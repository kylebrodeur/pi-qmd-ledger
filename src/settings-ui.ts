import type { ExtensionContext } from '@mariozechner/pi-coding-agent'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig, findConfig, ledgerNames, getPiContextConfig } from './utils.js'

export const createLedgerWizard = async (ctx: ExtensionContext) => {
  const { project: cfgPath } = findConfig(ctx.cwd)
  if (!cfgPath) {
    ctx.ui.notify('No config found. Run /qmd-init first.', 'error')
    return
  }

  if (!ctx.hasUI) {
    ctx.ui.notify('TUI required for interactive wizard.', 'error')
    return
  }

  const name = await ctx.ui.input('Ledger Name:', 'e.g., experiments')
  if (!name) return

  const defaultPath = `ledger/${name}.jsonl`
  const p = await ctx.ui.input('File Path:', defaultPath)
  if (!p) return

  const schemaStr = await ctx.ui.input('Schema Fields (comma-separated):', 'id, date, content')
  if (!schemaStr) return
  const schema = schemaStr.split(',').map(s => s.trim()).filter(Boolean)

  const dedupField = await ctx.ui.input('Dedup Field (optional):', '')

  const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  existing.ledgers = existing.ledgers || {}
  existing.ledgers[name] = {
    path: p,
    schema,
    ...(dedupField ? { dedupField } : {})
  }

  fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
  
  // ensure dir and file
  const fullPath = path.isAbsolute(p) ? p : path.join(ctx.cwd, p)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '', 'utf-8')
  }

  ctx.ui.notify(`✅ Ledger "${name}" created and configured!`, 'info')
}

export const createInjectorWizard = async (ctx: ExtensionContext) => {
  const { project: cfgPath } = findConfig(ctx.cwd)
  if (!cfgPath) {
    ctx.ui.notify('No config found. Run /qmd-init first.', 'error')
    return
  }

  if (!ctx.hasUI) {
    ctx.ui.notify('TUI required for interactive wizard.', 'error')
    return
  }

  const name = await ctx.ui.input('Injector Name:', 'e.g., meeting-notes')
  if (!name) return

  const regex = await ctx.ui.input('Regex Pattern:', 'meeting\\s+(\\S+)')
  if (!regex) return

  const cfg = loadConfig(ctx.cwd)
  const names = ledgerNames(cfg)
  if (names.length === 0) {
    ctx.ui.notify('No ledgers configured to target. Create one first.', 'error')
    return
  }

  const ledger = await ctx.ui.select('Target Ledger:', names)
  if (!ledger) return

  const filterField = await ctx.ui.input('Filter Field (optional):', 'tag')

  const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  existing.injectors = existing.injectors || []
  existing.injectors.push({
    name,
    regex,
    ledger,
    ...(filterField ? { filterField } : {})
  })

  fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
  ctx.ui.notify(`✅ Injector "${name}" created and configured!`, 'info')
}

export const openSettingsDashboard = async (ctx: ExtensionContext) => {
  if (!ctx.hasUI) {
    ctx.ui.notify('TUI required for settings dashboard.', 'error')
    return
  }

  const { project: cfgPath } = findConfig(ctx.cwd)
  if (!cfgPath) {
    ctx.ui.notify('No config found. Run /qmd-init first.', 'error')
    return
  }

  let running = true
  while (running) {
    const choice = await ctx.ui.select('QMD Ledger Settings', [
      'Manage Ledgers',
      'Manage Injectors',
      'Extension Integrations',
      'Exit',
    ])

    if (!choice || choice === 'Exit') {
      running = false
      break
    }

    if (choice === 'Manage Ledgers') {
      await manageLedgers(ctx, cfgPath)
    } else if (choice === 'Manage Injectors') {
      await manageInjectors(ctx, cfgPath)
    } else if (choice === 'Extension Integrations') {
      await manageExtensions(ctx, cfgPath)
    }
  }
}

const manageLedgers = async (ctx: ExtensionContext, cfgPath: string) => {
  const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  const names = Object.keys(existing.ledgers || {})
  
  const choice = await ctx.ui.select('Ledgers', [
    ...names.map(n => `Edit: ${n}`),
    'Create New Ledger',
    'Back'
  ])

  if (!choice || choice === 'Back') return

  if (choice === 'Create New Ledger') {
    await createLedgerWizard(ctx)
    return
  }

  if (choice.startsWith('Edit: ')) {
    const name = choice.replace('Edit: ', '')
    const dedup = await ctx.ui.input(`Dedup Field for ${name} (currently ${existing.ledgers[name].dedupField || 'none'}):`, '')
    if (dedup !== undefined) {
      existing.ledgers[name].dedupField = dedup || undefined
      fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
      ctx.ui.notify(`Updated ${name}`, 'info')
    }
  }
}

const manageInjectors = async (ctx: ExtensionContext, cfgPath: string) => {
  const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  const injectors = existing.injectors || []
  
  const choice = await ctx.ui.select('Injectors', [
    ...injectors.map((i: any) => `Delete: ${i.name}`),
    'Create New Injector',
    'Back'
  ])

  if (!choice || choice === 'Back') return

  if (choice === 'Create New Injector') {
    await createInjectorWizard(ctx)
    return
  }

  if (choice.startsWith('Delete: ')) {
    const name = choice.replace('Delete: ', '')
    const ok = await ctx.ui.confirm('Confirm', `Delete injector ${name}?`)
    if (ok) {
      existing.injectors = injectors.filter((i: any) => i.name !== name)
      fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
      ctx.ui.notify(`Deleted ${name}`, 'info')
    }
  }
}

const manageExtensions = async (ctx: ExtensionContext, cfgPath: string) => {
  const existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
  existing.extensionCompatibility = existing.extensionCompatibility || {}
  const piCtx = existing.extensionCompatibility['pi-context'] || {}

  const choice = await ctx.ui.select('pi-context Integration', [
    `Toggle Enabled (currently ${piCtx.enabled ? 'ON' : 'OFF'})`,
    `Toggle Auto-ACM (currently ${piCtx.autoEnableAcm !== false ? 'ON' : 'OFF'})`,
    `Toggle Event Indexing (currently ${piCtx.indexContextEvents !== false ? 'ON' : 'OFF'})`,
    'Back'
  ])

  if (!choice || choice === 'Back') return

  if (choice.startsWith('Toggle Enabled')) {
    piCtx.enabled = !piCtx.enabled
  } else if (choice.startsWith('Toggle Auto-ACM')) {
    piCtx.autoEnableAcm = piCtx.autoEnableAcm === false ? true : false
  } else if (choice.startsWith('Toggle Event Indexing')) {
    piCtx.indexContextEvents = piCtx.indexContextEvents === false ? true : false
  }

  existing.extensionCompatibility['pi-context'] = piCtx
  fs.writeFileSync(cfgPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
  ctx.ui.notify('Settings updated', 'info')
}
