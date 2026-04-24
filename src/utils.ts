import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { ExtensionAPI } from '@mariozechner/pi-coding-agent'
import type { LedgerDef, QmdCheckResult, UniversalConfig } from './types.js'
import { DEFAULT_CONFIG } from './types.js'

export const CONFIG_FILES = [
  'pi-qmd-ledger.config.json',
  '.pi/qmd-ledger.config.json',
]

export const EXT_ROOT = path.join(import.meta.dirname, '..')

export const resolvePath = (cwd: string, p: string): string =>
  path.isAbsolute(p) ? p : path.join(cwd, p)

export const ensureDir = (filePath: string) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export const findConfig = (cwd: string): string | undefined => {
  for (const rel of CONFIG_FILES) {
    const fp = path.join(cwd, rel)
    if (fs.existsSync(fp)) return fp
  }
  return undefined
}

export const hasPiContextTools = (pi: ExtensionAPI): boolean => {
  const tools = pi.getAllTools()
  const names = new Set(tools.map((t) => t.name))
  return (
    names.has('context_tag') &&
    names.has('context_log') &&
    names.has('context_checkout')
  )
}

export const isPiContextEnabled = (cfg: UniversalConfig): boolean => cfg.extensionCompatibility?.['pi-context']?.enabled === true

export const getPiContextConfig = (cfg: UniversalConfig) =>
  cfg.extensionCompatibility?.['pi-context'] || {
    enabled: false,
    tagPatterns: [],
    enhanceInjectors: false,
    autoEnableAcm: true,
    indexContextEvents: true,
  }

export const loadConfig = (cwd: string): UniversalConfig => {
  let cfg: Partial<UniversalConfig> = {}
  const cfgPath = findConfig(cwd)
  if (cfgPath) {
    try {
      cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
    } catch (e) {
      console.warn(`[pi-qmd-ledger] Config parse error at ${cfgPath}: ${e}`)
    }
  }

  const merged: UniversalConfig = {
    version: cfg.version ?? DEFAULT_CONFIG.version,
    ledgers: {},
    injectors: cfg.injectors ?? DEFAULT_CONFIG.injectors,
    qmd: { ...DEFAULT_CONFIG.qmd, ...cfg.qmd },
    extensionCompatibility: {
      ...DEFAULT_CONFIG.extensionCompatibility,
      ...cfg.extensionCompatibility,
    },
  }

  const ledgersSrc = cfg.ledgers ?? DEFAULT_CONFIG.ledgers
  const resolvedLedgers: Record<string, LedgerDef> = {}
  for (const [name, def] of Object.entries(ledgersSrc)) {
    const base =
      typeof def.schema === 'string' ? resolvedLedgers[def.schema] : undefined
    resolvedLedgers[name] = {
      path: resolvePath(cwd, def.path || (base?.path ?? '')),
      schema:
        typeof def.schema === 'string' ? (base?.schema ?? []) : def.schema,
      dedupField: def.dedupField ?? base?.dedupField,
    }
  }
  merged.ledgers = resolvedLedgers

  merged.injectors = merged.injectors.map((ij) => ({
    ...ij,
    artifactPath: ij.artifactPath
      ? resolvePath(cwd, ij.artifactPath)
      : undefined,
  }))

  if (process.env.QMD_BINARY) merged.qmd.binary = process.env.QMD_BINARY

  return merged
}

export const ledgerNames = (cfg: UniversalConfig): string[] =>
  Object.keys(cfg.ledgers)

export const qmdInstructions = (binary?: string): string =>
  [
    `qmd binary "${binary || 'qmd'}" not found.`,
    ``,
    `Quick install (prebuilt binary):`,
    `  1. Download for your platform from the qmd releases page`,
    `  2. Extract the binary to a folder on your PATH (e.g. /usr/local/bin)`,
    `  3. Or set the env var: export QMD_BINARY=/path/to/qmd`,
    ``,
    `Build from source (requires Rust):`,
    `  cargo install qmd-cli`,
    ``,
    `Then restart pi and run /qmd-validate.`,
  ].join('\n')

export const checkQmd = (binary?: string): QmdCheckResult => {
  const result = child_process.spawnSync(binary || 'qmd', ['--version'], {
    encoding: 'utf-8',
  })
  if (result.error) {
    return { ok: false, instructions: qmdInstructions(binary) }
  }
  return { ok: true, version: result.stdout.trim() }
}
