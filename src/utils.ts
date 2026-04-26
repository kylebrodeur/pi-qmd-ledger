import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { ExtensionAPI } from '@mariozechner/pi-coding-agent'
import type { LedgerDef, PiContextDef, QmdCheckResult, UniversalConfig } from './types.js'
import { DEFAULT_CONFIG } from './types.js'

export const CONFIG_FILES = [
  'pi-qmd-ledger.config.json',
  '.pi/qmd-ledger.config.json',
]

export const GLOBAL_CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.pi',
  'agent'
)

export const GLOBAL_CONFIG_PATH = path.join(
  GLOBAL_CONFIG_DIR,
  'qmd-ledger.config.json'
)

export const EXT_ROOT = path.join(import.meta.dirname, '..')

export const resolvePath = (cwd: string, p: string): string =>
  path.isAbsolute(p) ? p : path.join(cwd, p)

export const ensureDir = (filePath: string) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export const findConfig = (
  cwd: string
): { global?: string; project?: string } => {
  const result: { global?: string; project?: string } = {}

  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    result.global = GLOBAL_CONFIG_PATH
  }

  for (const rel of CONFIG_FILES) {
    const fp = path.join(cwd, rel)
    if (fs.existsSync(fp)) {
      result.project = fp
      break
    }
  }

  return result
}

const readConfigFile = (p?: string): Partial<UniversalConfig> => {
  if (!p) return {}
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch (e) {
    console.warn(`[pi-qmd-ledger] Config parse error at ${p}: ${e}`)
    return {}
  }
}

const mergeConfigLayer = (
  base: UniversalConfig,
  layer: Partial<UniversalConfig>,
  cwd: string
): UniversalConfig => {
  const merged: UniversalConfig = {
    version: layer.version ?? base.version,
    ledgers: {},
    injectors: layer.injectors ?? base.injectors,
    qmd: { ...base.qmd, ...layer.qmd },
    extensionCompatibility: {
      ...base.extensionCompatibility,
      ...layer.extensionCompatibility,
    },
  }

  const ledgersSrc = layer.ledgers ?? base.ledgers
  const resolvedLedgers: Record<string, LedgerDef> = {}
  for (const [name, def] of Object.entries(ledgersSrc)) {
    const resolvedBase =
      typeof def.schema === 'string' ? resolvedLedgers[def.schema] : undefined
    resolvedLedgers[name] = {
      path: resolvePath(cwd, def.path || (resolvedBase?.path ?? '')),
      schema:
        typeof def.schema === 'string'
          ? (resolvedBase?.schema ?? [])
          : def.schema,
      dedupField: def.dedupField ?? resolvedBase?.dedupField,
    }
  }
  merged.ledgers = resolvedLedgers

  merged.injectors = merged.injectors.map((ij) => ({
    ...ij,
    artifactPath: ij.artifactPath
      ? resolvePath(cwd, ij.artifactPath)
      : undefined,
  }))

  return merged
}

export const loadConfig = (cwd: string): UniversalConfig => {
  const paths = findConfig(cwd)
  const globalCfg = readConfigFile(paths.global)
  const projectCfg = readConfigFile(paths.project)

  // Start from DEFAULT, layer global, then project
  let merged = mergeConfigLayer(DEFAULT_CONFIG, globalCfg, cwd)
  merged = mergeConfigLayer(merged, projectCfg, cwd)

  if (process.env.QMD_BINARY) merged.qmd.binary = process.env.QMD_BINARY

  return merged
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

export const isPiContextEnabled = (cfg: UniversalConfig): boolean =>
  cfg.extensionCompatibility?.['pi-context']?.enabled === true

export const getPiContextConfig = (cfg: UniversalConfig): PiContextDef => ({
  enabled: false,
  tagPatterns: [],
  enhanceInjectors: false,
  autoEnableAcm: true,
  indexContextEvents: true,
  ...cfg.extensionCompatibility?.['pi-context'],
})

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
