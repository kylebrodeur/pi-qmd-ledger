import type { ExtensionAPI, ExtensionContext } from '@mariozechner/pi-coding-agent'
import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import {
  checkQmd,
  CONFIG_FILES,
  ensureDir,
  EXT_ROOT,
  findConfig,
  getPiContextConfig,
  hasPiContextTools,
  loadConfig,
  qmdInstructions,
  ledgerNames,
} from './utils.js'
import { setActiveLedger, getActiveLedger } from './state.js'
import { updateActiveLedgerWidget } from './widget.js'
import { SelectList, Text, Container } from '@mariozechner/pi-tui'

import { openSettingsDashboard, createLedgerWizard, createInjectorWizard } from './settings-ui.js'

export const selectActiveLedger = async (ctx: ExtensionContext) => {
  if (!ctx.hasUI) {
    // Fallback for RPC mode where there's no interactive TUI overlay
    const cfg = loadConfig(ctx.cwd)
    const names = ledgerNames(cfg)
    const next = names.find((n) => n !== getActiveLedger(ctx.cwd)) || names[0]
    if (next) {
      setActiveLedger(next)
      updateActiveLedgerWidget(ctx)
      ctx.ui.notify(`Active ledger set to: ${next}`, 'info')
    }
    return
  }

  const cfg = loadConfig(ctx.cwd)
  const names = ledgerNames(cfg)
  if (names.length === 0) {
    ctx.ui.notify('No ledgers configured.', 'warning')
    return
  }

  const items = names.map((name) => ({ label: name, value: name }))

  const result = await ctx.ui.custom<string | null>(
    (tui, theme, keybindings, done) => {
      const container = new Container()
      
      container.addChild(new Text(theme.fg('accent', 'Select Active Ledger'), 1, 1))

      const selectList = new SelectList(items, Math.min(items.length, 10), {
        selectedPrefix: (t) => theme.fg('accent', t),
        selectedText: (t) => theme.fg('accent', t),
        description: (t) => theme.fg('muted', t),
        scrollInfo: (t) => theme.fg('dim', t),
        noMatch: (t) => theme.fg('warning', t),
      })
      selectList.onSelect = (item) => done(item.value)
      selectList.onCancel = () => done(null)
      container.addChild(selectList)

      container.addChild(new Text(theme.fg('dim', '↑↓ navigate • enter select • esc cancel'), 1, 0))

      return {
        render: (w) => container.render(w),
        handleInput: (data) => {
          selectList.handleInput?.(data)
          tui.requestRender()
        },
        invalidate: () => container.invalidate(),
      }
    },
    { overlay: true }
  )

  if (result) {
    setActiveLedger(result)
    updateActiveLedgerWidget(ctx)
    ctx.ui.notify(`Active ledger set to: ${result}`, 'info')
  }
}

export const registerCommands = (pi: ExtensionAPI) => {
  /* ── /qmd-settings ── */
  pi.registerCommand('qmd-settings', {
    description: 'Open the comprehensive configuration dashboard',
    handler: async (_args, ctx: ExtensionContext) => {
      await openSettingsDashboard(ctx)
    },
  })

  /* ── /qmd-ledger-select ── */
  pi.registerCommand('qmd-ledger-select', {
    description: 'Select the active ledger from available ledgers.',
    handler: async (_args, ctx: ExtensionContext) => {
      await selectActiveLedger(ctx)
    },
  })

  /* ── /qmd-ledger-create ── */
  pi.registerCommand('qmd-ledger-create', {
    description: 'Interactive wizard to create and configure a new ledger',
    handler: async (_args, ctx: ExtensionContext) => {
      await createLedgerWizard(ctx)
    }
  })

  /* ── /qmd-injector-create ── */
  pi.registerCommand('qmd-injector-create', {
    description: 'Interactive wizard to create a new prompt injector',
    handler: async (_args, ctx: ExtensionContext) => {
      await createInjectorWizard(ctx)
    }
  })

  /* ── /qmd-validate ── */
  pi.registerCommand('qmd-validate', {
    description: 'Check qmd binary, config, and all configured ledger paths.',
    handler: async (_args, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const lines: string[] = []

      const qmd = checkQmd(cfg.qmd.binary || 'qmd')
      if (qmd.ok) {
        lines.push(`✅ qmd: ${cfg.qmd.binary || 'qmd'} (${qmd.version})`)
      } else {
        lines.push(`❌ qmd binary "${cfg.qmd.binary || 'qmd'}" not found.`)
        lines.push(`\n${qmd.instructions}`)
      }

      const { project: cfgPath } = findConfig(ctx.cwd)
      lines.push(
        cfgPath
          ? `✅ Config: ${cfgPath}`
          : `⚠️  No config file (checked ${CONFIG_FILES.join(', ')}).`
      )

      for (const [name, def] of Object.entries(cfg.ledgers)) {
        const exists = fs.existsSync(def.path)
        lines.push(
          `${exists ? '✅' : '⚠️'} Ledger "${name}": ${def.path} ${exists ? '' : '(missing)'}`
        )
        if (exists && def.dedupField)
          lines.push(`   └─ dedupField: ${def.dedupField}`)
      }

      lines.push(`📡 Injectors (${cfg.injectors.length}):`)
      for (const ij of cfg.injectors) {
        lines.push(
          `   • "${ij.name}" → ledger:"${ij.ledger}" regex:${ij.regex}`
        )
      }

      const hasContext = hasPiContextTools(pi)
      const contextCfg = getPiContextConfig(cfg)
      const willCapture = hasContext && contextCfg.enabled
      lines.push(`\n🧩 Extension Integrations:`)
      lines.push(`   • pi-context:`)
      lines.push(`       - Tools installed: ${hasContext ? '✅ Yes (context_tag, context_log, context_checkout)' : '❌ No'}`)
      lines.push(`       - Config enabled: ${contextCfg.enabled ? '✅ Yes' : '❌ No'}`)
      lines.push(`       - Will capture events: ${willCapture ? '✅ Yes — on next turn' : '❌ No'}`)
      if (hasContext && !contextCfg.enabled) {
        lines.push(`       → Run /qmd-enable-pi-context enable to activate`)
      }
      if (!hasContext && contextCfg.enabled) {
        lines.push(`       ⚠️  Config says enabled but tools missing. Install with: pi install npm:pi-context`)
      }

      const msg = lines.join('\n')
      if (ctx.hasUI) ctx.ui.notify(msg, 'info')
      return
    },
  })

  /* ── /qmd-init ── */
  pi.registerCommand('qmd-init', {
    description:
      'Scaffold config, ledgers, and artifact templates in the current project.',
    handler: async (_args, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const created: string[] = []
      const skipped: string[] = []

      const ensureFile = (dest: string, tmpl: string) => {
        if (fs.existsSync(dest)) {
          skipped.push(dest)
          return
        }
        ensureDir(dest)
        const src = path.join(EXT_ROOT, 'templates', tmpl)
        fs.writeFileSync(
          dest,
          fs.existsSync(src) ? fs.readFileSync(src) : '',
          'utf-8'
        )
        created.push(dest)
      }

      const cfgDest = path.join(ctx.cwd, CONFIG_FILES[0])
      if (!fs.existsSync(cfgDest)) {
        const tmpl = {
          version: 2,
          ledgers: {
            main: {
              path: 'ledger/main.jsonl',
              schema: ['id', 'domain', 'source', 'fact', 'tag', 'artifact'],
              dedupField: 'fact',
            },
            pending: { path: 'ledger/pending.jsonl', schema: 'main' },
            context_events: {
              path: 'ledger/context_events.jsonl',
              schema: ['id', 'type', 'session_entry_id', 'content', 'timestamp', 'tags'],
              dedupField: 'id',
            },
          },
          injectors: [
            {
              name: 'draft-context',
              regex: 'draft\\s+(\\S+)',
              ledger: 'main',
              filterField: 'tag',
            },
          ],
          qmd: { binary: 'qmd', defaultLimit: 5 },
        }
        fs.writeFileSync(cfgDest, JSON.stringify(tmpl, null, 2) + '\n', 'utf-8')
        created.push(cfgDest)
      } else {
        skipped.push(cfgDest)
      }

      for (const [name, def] of Object.entries(cfg.ledgers)) {
        ensureFile(
          def.path,
          name === 'pending' ? 'PENDING_LEDGER.jsonl' : 'UCL_LEDGER.jsonl'
        )
      }

      for (const ij of cfg.injectors) {
        if (ij.artifactPath) ensureFile(ij.artifactPath, 'ARTIFACT.md')
      }

      const msg = [
        `Ledger scaffolding complete.`,
        ``,
        `Created:`,
        ...created.map((c) => `  • ${path.relative(ctx.cwd, c)}`),
        skipped.length ? `Skipped (already exist):` : '',
        ...skipped.map((s) => `  • ${path.relative(ctx.cwd, s)}`),
        ``,
        `💡 Tip: Tell the agent "Remember: [fact]" to auto-append to the main ledger!`,
      ]
        .filter(Boolean)
        .join('\n')

      if (ctx.hasUI) {
        ctx.ui.notify(msg, 'info')

        if (hasPiContextTools(pi)) {
          const enable = await ctx.ui.confirm(
            'Enable pi-context integration?',
            'pi-context tools were detected. Would you like to enable the integration now to capture session context?'
          )

          if (enable) {
            const existing = JSON.parse(fs.readFileSync(cfgDest, 'utf-8'))
            existing.extensionCompatibility = existing.extensionCompatibility || {}
            existing.extensionCompatibility['pi-context'] = {
              tagPatterns: [],
              enhanceInjectors: false,
              autoEnableAcm: true,
              indexContextEvents: true,
              ...existing.extensionCompatibility['pi-context'],
              enabled: true,
            }
            fs.writeFileSync(cfgDest, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
            ctx.ui.notify('✅ pi-context integration ENABLED in config', 'info')
          }
        }
      }
      return
    },
  })

  /* ── /qmd-index ── */
  pi.registerCommand('qmd-index', {
    description:
      'Re-index all qmd collections (full-text) and optionally run embeddings. Run after adding new documents.',
    handler: async (args, ctx: ExtensionContext) => {
      const qmdBin = 'qmd'
      const embed = args.trim().toLowerCase() !== '--no-embed'
      const lines: string[] = []

      const update = child_process.spawnSync(qmdBin, ['update'], {
        encoding: 'utf-8',
        cwd: ctx.cwd,
      })
      if (update.error) {
        lines.push(`❌ qmd update failed: ${update.error.message}`)
        lines.push(qmdInstructions())
        ctx.ui.notify(lines.join('\n'), 'error')
        return
      }
      lines.push(
        `✅ qmd update:\n${update.stdout}${update.stderr ? '\n' + update.stderr : ''}`
      )

      if (embed) {
        const emb = child_process.spawnSync(qmdBin, ['embed'], {
          encoding: 'utf-8',
          cwd: ctx.cwd,
        })
        if (emb.error) {
          lines.push(`❌ qmd embed failed: ${emb.error.message}`)
        } else {
          lines.push(
            `✅ qmd embed:\n${emb.stdout}${emb.stderr ? '\n' + emb.stderr : ''}`
          )
        }
      } else {
        lines.push(`⏭️  Skipped embeddings (pass --no-embed to skip).`)
      }

      const msg = lines.join('\n\n')
      if (ctx.hasUI) ctx.ui.notify(msg, 'info')
      return
    },
  })

  /* ── /qmd-enable-pi-context ── */
  pi.registerCommand('qmd-enable-pi-context', {
    description: 'Enable or disable pi-context integration',
    getArgumentCompletions: () => [
      { label: 'enable', value: 'enable', description: 'Enable pi-context integration' },
      { label: 'disable', value: 'disable', description: 'Disable pi-context integration' },
    ],
    handler: async (args, ctx: ExtensionContext) => {
      const arg = args.trim().toLowerCase()
      const { project: cfgPath } = findConfig(ctx.cwd)

      if (!cfgPath) {
        ctx.ui.notify('No config found. Run /qmd-init first.', 'error')
        return
      }

      const ENABLE_ALIASES = new Set(['enable', 'on', 'true', 'yes', '1'])
      const DISABLE_ALIASES = new Set(['disable', 'off', 'false', 'no', '0'])

      // No arg provided → show current status + usage
      if (!arg) {
        const cfg = loadConfig(ctx.cwd)
        const piContextCfg = getPiContextConfig(cfg)
        const hasTools = hasPiContextTools(pi)
        const willCapture = hasTools && piContextCfg.enabled

        const lines = [
          'pi-context Integration Status',
          '',
          `Config file: ${cfgPath}`,
          `Enabled in config: ${piContextCfg.enabled ? 'Yes' : 'No'}`,
          `Tools detected: ${hasTools ? 'Yes' : 'No'}`,
          `Will capture on next turn: ${willCapture ? 'Yes' : 'No'}`,
          '',
          'Usage:',
          '  /qmd-enable-pi-context enable   (aliases: on, true, yes)',
          '  /qmd-enable-pi-context disable  (aliases: off, false, no)',
        ]
        ctx.ui.notify(lines.join('\n'), willCapture ? 'info' : 'warning')
        return
      }

      if (!ENABLE_ALIASES.has(arg) && !DISABLE_ALIASES.has(arg)) {
        ctx.ui.notify(`Unknown argument "${arg}". Use: enable | disable`, 'error')
        return
      }

      const enable = ENABLE_ALIASES.has(arg)

      const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
      existing.extensionCompatibility = existing.extensionCompatibility || {}
      // Merge with defaults so we never write a partial config
      existing.extensionCompatibility['pi-context'] = {
        tagPatterns: [],
        enhanceInjectors: false,
        autoEnableAcm: true,
        indexContextEvents: true,
        ...existing.extensionCompatibility['pi-context'],
        enabled: enable,
      }
      fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

      // Read back to confirm persistence
      const afterCfg = loadConfig(ctx.cwd)
      const afterPiContext = getPiContextConfig(afterCfg)
      const hasTools = hasPiContextTools(pi)
      const persisted = afterPiContext.enabled === enable

      const msgLines: string[] = []
      msgLines.push(`Config written to: ${cfgPath}`)
      msgLines.push(persisted ? '✅ Change persisted successfully.' : '❌ Warning: config write may not have persisted.')
      msgLines.push('')

      if (enable) {
        if (hasTools) {
          msgLines.push('✅ pi-context integration ENABLED')
          msgLines.push('')
          msgLines.push('What this means:')
          msgLines.push('  • On every turn_end, pi-context events will be captured to the context_events ledger')
          msgLines.push('  • Tag patterns from config will trigger ledger lookups on before_agent_start')
          msgLines.push('  • autoEnableAcm is ' + (afterPiContext.autoEnableAcm ? 'ON' : 'OFF'))
          msgLines.push('  • indexContextEvents is ' + (afterPiContext.indexContextEvents ? 'ON' : 'OFF'))
        } else {
          msgLines.push('⚠️  pi-context integration ENABLED in config, but pi-context tools NOT found')
          msgLines.push('')
          msgLines.push('To actually capture events, install the pi-context extension:')
          msgLines.push('  pi install npm:pi-context')
          msgLines.push('')
          msgLines.push('After installing, run /qmd-validate to confirm tools are detected.')
        }
      } else {
        msgLines.push('pi-context integration DISABLED.')
        msgLines.push('Context events will NOT be captured to the ledger.')
      }

      ctx.ui.notify(msgLines.join('\n'), enable ? (hasTools ? 'info' : 'warning') : 'info')
      return
    },
  })

  /* ── /qmd-list-extensions ── */
  pi.registerCommand('qmd-list-extensions', {
    description: 'List available and enabled extension integrations',
    handler: async (_args, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const piContextCfg = getPiContextConfig(cfg)
      const hasPiContext = hasPiContextTools(pi)

      const lines = [
        '**Available Extension Integrations**',
        '',
        '**pi-context:**',
        `  Status: ${hasPiContext ? '✅ Available' : '❌ Not installed'}`,
        `  Configured: ${piContextCfg.enabled ? 'Enabled' : 'Disabled'}`,
        `  Tag Patterns: ${piContextCfg.tagPatterns?.length || 0}`,
        `  Enhance Injectors: ${piContextCfg.enhanceInjectors ? 'Yes' : 'No'}`,
        '',
        'Commands:',
        '  /qmd-enable-pi-context [enable|disable]',
        '  /qmd-validate',
        '',
        `pi-context tools detected: ${hasPiContext ? 'Yes' : 'No'}`,
      ]

      const msg = lines.join('\n')
      if (ctx.hasUI) ctx.ui.notify(msg, 'info')
      return
    },
  })

  /* ── /qmd-extension-status ── */
  pi.registerCommand('qmd-extension-status', {
    description: 'Show detailed extension compatibility status',
    handler: async (_args, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const piContextCfg = getPiContextConfig(cfg)
      const hasPiContext = hasPiContextTools(pi)
      const willCapture = hasPiContext && piContextCfg.enabled

      const lines = [
        '**pi-qmd-ledger Extension Compatibility Status**',
        '',
        '--- pi-context ---',
        `Status: ${willCapture ? '✅ ACTIVE' : '❌ INACTIVE'}`,
        `  - Tools installed: ${hasPiContext ? '✅' : '❌'}`,
        `  - Config enabled: ${piContextCfg.enabled ? '✅' : '❌'}`,
        `  - Will capture on next turn: ${willCapture ? '✅ Yes' : '❌ No'}`,
        '',
        `Tag Patterns: ${piContextCfg.tagPatterns?.length || 0}`,
        ...(piContextCfg.tagPatterns?.length
          ? piContextCfg.tagPatterns.map((p) => `  • "${p}"`)
          : ['  (none configured — no tag-based lookups triggered)']),
        '',
        `Enhance Injectors: ${piContextCfg.enhanceInjectors ? 'Yes' : 'No'}`,
        `autoEnableAcm: ${piContextCfg.autoEnableAcm ? 'Yes' : 'No'}`,
        `indexContextEvents: ${piContextCfg.indexContextEvents ? 'Yes' : 'No'}`,
        '',
        willCapture
          ? 'Context events will be captured on the next turn_end.'
          : hasPiContext && !piContextCfg.enabled
            ? 'Run /qmd-enable-pi-context enable to activate.'
            : !hasPiContext && piContextCfg.enabled
              ? '⚠️ Config says enabled but tools not found. Install pi-context extension.'
              : 'Run /qmd-init then /qmd-enable-pi-context enable to start capturing.',
      ]

      const msg = lines.join('\n')
      ctx.ui.notify(msg, willCapture ? 'info' : 'warning')
      return
    },
  })

  pi.registerCommand('qmd-approve', {
    description:
      'Batch-review pending entries and migrate approved ones to their target ledger.',
    getArgumentCompletions: (prefix) => {
      const cfg = loadConfig(process.cwd())
      const names = Object.keys(cfg.ledgers).filter((n) => n.startsWith(prefix))
      return names.map((n) => ({
        label: n,
        value: n,
        description: cfg.ledgers[n].path,
      }))
    },
    handler: async (args, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const pending = cfg.ledgers['pending']
      if (!pending || !fs.existsSync(pending.path)) {
        ctx.ui.notify('No pending ledger configured or empty.', 'info')
        return
      }

      const targetName = args.trim() || 'main'
      const target = cfg.ledgers[targetName]
      if (!target) {
        ctx.ui.notify(`Unknown target ledger "${targetName}".`, 'error')
        return
      }

      const lines = fs
        .readFileSync(pending.path, 'utf-8')
        .split('\n')
        .filter(Boolean)
      if (lines.length === 0) {
        ctx.ui.notify('No pending entries.', 'info')
        return
      }

      let approved = 0
      const rejected: string[] = []

      for (const line of lines) {
        const ok = await ctx.ui.confirm(
          'Pending Entry',
          `${line}\n\nApprove migration to "${targetName}"?`
        )
        if (ok) {
          ensureDir(target.path)
          fs.appendFileSync(target.path, line + '\n')
          approved++
        } else {
          rejected.push(line)
        }
      }

      fs.writeFileSync(
        pending.path,
        rejected.join('\n') + (rejected.length > 0 ? '\n' : '')
      )
      ctx.ui.notify(
        `Approved ${approved} → "${targetName}". Rejected ${rejected.length}.`,
        'info'
      )
    },
  })
}
