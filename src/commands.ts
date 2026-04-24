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
} from './utils.js'

export const registerCommands = (pi: ExtensionAPI) => {
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

      const cfgPath = findConfig(ctx.cwd)
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
      lines.push(`\n🧩 Extensions:`)
      lines.push(`   • pi-context: ${hasContext ? '✅' : '❌'} ${contextCfg.enabled ? 'Enabled' : 'Disabled'}`)
      if (hasContext && !contextCfg.enabled) {
        lines.push(`     └─ Run /qmd-enable-pi-context enable to activate`)
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
            master: {
              path: 'ledger/master.jsonl',
              schema: ['id', 'domain', 'source', 'fact', 'tag', 'artifact'],
              dedupField: 'fact',
            },
            pending: { path: 'ledger/pending.jsonl', schema: 'master' },
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
              ledger: 'master',
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
      ]
        .filter(Boolean)
        .join('\n')

      if (ctx.hasUI) ctx.ui.notify(msg, 'info')
      return { content: [{ type: 'text', text: msg }], details: {} } as any
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
      const enable = args.trim().toLowerCase() === 'enable'
      const cfgPath = findConfig(ctx.cwd)

      if (!cfgPath) {
        ctx.ui.notify('No config found. Run /qmd-init first.', 'error')
        return
      }

      const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
      existing.extensionCompatibility = existing.extensionCompatibility || {}
      existing.extensionCompatibility['pi-context'] = {
        ...existing.extensionCompatibility['pi-context'],
        enabled: enable,
      }
      fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

      if (enable) {
        const hasTools = hasPiContextTools(pi)
        if (hasTools) {
          ctx.ui.notify('✅ pi-context integration enabled', 'info')
        } else {
          ctx.ui.notify('⚠️  pi-context enabled but tools not found', 'warning')
        }
      } else {
        ctx.ui.notify('pi-context integration disabled', 'info')
      }

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

      const lines = [
        '**pi-qmd-ledger Extension Compatibility Status**',
        '',
        `Config path: ${findConfig(ctx.cwd) || 'none'}`,
        '',
        '--- pi-context ---',
        `Enabled: ${piContextCfg.enabled ? 'Yes' : 'No'}`,
        `Available: ${hasPiContext ? 'Yes' : 'No'}`,
        `Tag Patterns:`,
        ...(piContextCfg.tagPatterns?.length
          ? piContextCfg.tagPatterns.map((p) => `  • ${p}`)
          : ['  (none configured)']),
        `Enhance Injectors: ${piContextCfg.enhanceInjectors ? 'Yes' : 'No'}`,
        '',
        '**Detection:**',
        `context_tag found: ${hasPiContextTools(pi) ? 'Yes' : 'No'}`,
        `context_log found: ${hasPiContextTools(pi) ? 'Yes' : 'No'}`,
        `context_checkout found: ${hasPiContextTools(pi) ? 'Yes' : 'No'}`,
        '',
        'To enable: /qmd-enable-pi-context enable',
      ]

      const msg = lines.join('\n')
      if (ctx.hasUI) ctx.ui.notify(msg, 'info')
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

      const targetName = args.trim() || 'master'
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
