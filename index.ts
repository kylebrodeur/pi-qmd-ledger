import type {
  ExtensionAPI,
  ExtensionContext,
} from '@mariozechner/pi-coding-agent'
import { Type } from '@sinclair/typebox'
import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ═══════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════ */
const EXT_ROOT = path.join(__dirname, '..')
const CONFIG_FILES = ['pi-qmd-ledger.config.json', '.pi/qmd-ledger.config.json']

/* ═══════════════════════════════════════
   CONFIG TYPES
   ═══════════════════════════════════════ */
interface LedgerDef {
  path: string
  schema: string[]
  dedupField?: string
}

interface InjectorDef {
  name: string
  regex: string
  captureGroup?: number
  ledger: string
  filterField?: string
  artifactPath?: string
  template?: string
}

interface QmdDef {
  binary?: string
  defaultLimit?: number
  maxBuffer?: number
}

interface PiContextDef {
  enabled?: boolean
  tagPatterns?: string[]
  enhanceInjectors?: boolean
  autoEnableAcm?: boolean
  indexContextEvents?: boolean // New toggle for indexing pi-context events
}

interface UniversalConfig {
  version: number
  ledgers: Record<string, LedgerDef>
  injectors: InjectorDef[]
  qmd: QmdDef
  extensionCompatibility?: {
    'pi-context'?: PiContextDef
  }
}

const DEFAULT_CONFIG: UniversalConfig = {
  version: 2,
  ledgers: {
    master: {
      path: 'ledger/master.jsonl',
      schema: ['id', 'domain', 'source', 'fact', 'tag', 'artifact'],
      dedupField: 'fact',
    },
    pending: {
      path: 'ledger/pending.jsonl',
      schema: 'master' as unknown as string[], // resolved at runtime
    },
    context_events: {
      path: 'ledger/context_events.jsonl',
      schema: ['id', 'type', 'session_entry_id', 'content', 'timestamp', 'tags'],
      dedupField: 'id', // Deduplicate by event ID
    },
  },
  injectors: [
    {
      name: 'draft-context',
      regex: 'draft\\s+(\\S+)',
      ledger: 'master',
      filterField: 'tag',
      artifactPath: 'ledger/artifact.md',
    },
  ],
  qmd: {
    binary: 'qmd',
    defaultLimit: 5,
    maxBuffer: 10 * 1024 * 1024,
  },
  extensionCompatibility: {
    'pi-context': {
      enabled: false,
      tagPatterns: [],
      enhanceInjectors: false,
      autoEnableAcm: true,
      indexContextEvents: true, // Default to true for new feature
    },
  },
}

/* ═══════════════════════════════════════
   UTILS
   ═══════════════════════════════════════ */
function resolvePath(cwd: string, p: string): string {
  return path.isAbsolute(p) ? p : path.join(cwd, p)
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function findConfig(cwd: string): string | undefined {
  for (const rel of CONFIG_FILES) {
    const fp = path.join(cwd, rel)
    if (fs.existsSync(fp)) return fp
  }
  return undefined
}

/* ── extension detection ── */
function hasPiContextTools(pi: ExtensionAPI): boolean {
  const tools = pi.getAllTools()
  const names = new Set(tools.map((t) => t.name))
  return (
    names.has('context_tag') &&
    names.has('context_log') &&
    names.has('context_checkout')
  )
}

function isPiContextEnabled(cfg: UniversalConfig): boolean {
  return cfg.extensionCompatibility?.['pi-context']?.enabled === true
}

function getPiContextConfig(cfg: UniversalConfig) {
  return cfg.extensionCompatibility?.['pi-context'] || {
    enabled: false,
    tagPatterns: [],
    enhanceInjectors: false,
    autoEnableAcm: true,
    indexContextEvents: true,
  }
}

function loadConfig(cwd: string): UniversalConfig {
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

  // Merge ledgers
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

  // Resolve artifact paths in injectors
  merged.injectors = merged.injectors.map((ij) => ({
    ...ij,
    artifactPath: ij.artifactPath
      ? resolvePath(cwd, ij.artifactPath)
      : undefined,
  }))

  // Env overrides
  if (process.env.QMD_BINARY) merged.qmd.binary = process.env.QMD_BINARY

  return merged
}

function ledgerNames(cfg: UniversalConfig): string[] {
  return Object.keys(cfg.ledgers)
}

/* ── qmd install helper ── */
function qmdInstructions(binary?: string): string {
  return [
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
}

function checkQmd(binary?: string): {
  ok: boolean
  version?: string
  instructions?: string
} {
  const result = child_process.spawnSync(binary || 'qmd', ['--version'], {
    encoding: 'utf-8',
  })
  if (result.error) {
    return { ok: false, instructions: qmdInstructions(binary) }
  }
  return { ok: true, version: result.stdout.trim() }
}

/* ═══════════════════════════════════════
   MAIN EXTENSION
   ═══════════════════════════════════════ */
export default function (pi: ExtensionAPI) {
  /* ── expose skills directory ── */
  pi.on('resources_discover', async (_event: any) => {
    const skillsDir = path.join(EXT_ROOT, 'skills')
    return fs.existsSync(skillsDir) ? { skillPaths: [skillsDir] } : {}
  })

  /* ── /qmd-validate ── */
  pi.registerCommand('qmd-validate', {
    description: 'Check qmd binary, config, and all configured ledger paths.',
    handler: async (_args: any, ctx: ExtensionContext) => {
      const cfg = loadConfig(ctx.cwd)
      const lines: string[] = []

      // qmd
      const qmd = checkQmd(cfg.qmd.binary || 'qmd')
      if (qmd.ok) {
        lines.push(`✅ qmd: ${cfg.qmd.binary || 'qmd'} (${qmd.version})`)
      } else {
        lines.push(`❌ qmd binary "${cfg.qmd.binary || 'qmd'}" not found.`)
        lines.push(`\n${qmd.instructions}`)
      }

      // config
      const cfgPath = findConfig(ctx.cwd)
      lines.push(
        cfgPath
          ? `✅ Config: ${cfgPath}`
          : `⚠️  No config file (checked ${CONFIG_FILES.join(', ')}).`
      )

      // ledgers
      for (const [name, def] of Object.entries(cfg.ledgers)) {
        const exists = fs.existsSync(def.path)
        lines.push(
          `${exists ? '✅' : '⚠️'} Ledger "${name}": ${def.path} ${exists ? '' : '(missing)'}`
        )
        if (exists && def.dedupField)
          lines.push(`   └─ dedupField: ${def.dedupField}`)
      }

      // injectors
      lines.push(`📡 Injectors (${cfg.injectors.length}):`)
      for (const ij of cfg.injectors) {
        lines.push(
          `   • "${ij.name}" → ledger:"${ij.ledger}" regex:${ij.regex}`
        )
      }

      // extension compatibility
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
    handler: async (_args: any, ctx: ExtensionContext) => {
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

      // Write config if missing
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

  /* ── qmd_search ── */
  pi.registerTool({
    name: 'qmd_search',
    label: 'QMD Search',
    description:
      'Perform a fuzzy semantic search using qmd across indexed raw documents.',
    promptSnippet:
      'qmd_search(query="...", limit=5) - semantic search over your docs.',
    promptGuidelines: [
      'Use qmd_search when you need to find relevant context before writing or verifying facts.',
      'If qmd_search returns nothing, try /qmd-index to rebuild indexes.',
      'The query parameter should be a natural-language question or topic, not a strict keyword.',
    ],
    parameters: Type.Object({
      query: Type.String({
        description:
          "Natural-language search query (e.g., 'user auth flow', 'database migration strategy')",
      }),
      limit: Type.Optional(
        Type.Number({
          description: 'Max results (default from config, typically 5)',
        })
      ),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const limit = params.limit ?? cfg.qmd.defaultLimit ?? 5
      return new Promise<any>((resolve) => {
        child_process.execFile(
          cfg.qmd.binary || 'qmd',
          ['search', params.query, '--limit', String(limit)],
          { maxBuffer: cfg.qmd.maxBuffer },
          (error, stdout, stderr) => {
            if (error) {
              const code = (error as any).code
              resolve({
                content: [
                  {
                    type: 'text',
                    text:
                      code === 'ENOENT'
                        ? `qmd binary "${cfg.qmd.binary}" not found.\n\n${qmdInstructions(cfg.qmd.binary)}`
                        : `Error: ${error.message}\n${stderr}`,
                  },
                ],
                details: {},
              })
              return
            }
            resolve({ content: [{ type: 'text', text: stdout }], details: {} })
          }
        )
      })
    },
  })

  /* ── query_ledger ── */
  pi.registerTool({
    name: 'query_ledger',
    label: 'Query Ledger',
    description:
      'Deterministic JSONL search by ledger name. Use for exact lookups and filtered retrieval.',
    promptSnippet:
      'query_ledger(ledger="master", query="...", filters={key: "value"}) - exact ledger search.',
    promptGuidelines: [
      "Use query_ledger when you already know the ledger name and need exact matches (e.g., all entries with tag='login').",
      'query does substring search across all text fields; filters does exact key-value matching.',
      'If the ledger is missing, run /qmd-init first.',
    ],
    parameters: Type.Object({
      ledger: Type.String({
        description: 'Ledger name to search (e.g. master, pending)',
      }),
      query: Type.Optional(
        Type.String({
          description:
            'Free-text substring search across all text fields of entries',
        })
      ),
      filters: Type.Optional(
        Type.Record(Type.String(), Type.String(), {
          description: 'Exact {field: value} matches (ANDed together)',
        })
      ),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const def = cfg.ledgers[params.ledger]
      if (!def) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(', ')}`,
            },
          ],
          details: {},
        }
      }
      if (!fs.existsSync(def.path)) {
        return {
          content: [
            {
              type: 'text',
              text: `Ledger "${params.ledger}" not found at ${def.path}. Run /qmd-init.`,
            },
          ],
          details: {},
        }
      }

      const lines = fs
        .readFileSync(def.path, 'utf-8')
        .split('\n')
        .filter(Boolean)
      const results: any[] = []

      for (const line of lines) {
        try {
          const entry = JSON.parse(line)
          let match = true

          if (params.query) {
            const text = def.schema
              .map((f) => entry[f] ?? '')
              .join(' ')
              .toLowerCase()
            match = text.includes(params.query.toLowerCase())
          }

          if (match && params.filters) {
            for (const [k, v] of Object.entries(params.filters)) {
              if (String(entry[k] ?? '') !== String(v)) {
                match = false
                break
              }
            }
          }

          if (match) results.push(entry)
        } catch {
          /* ignore malformed */
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        details: {},
      }
    },
  })

  /* ── append_ledger ── */
  pi.registerTool({
    name: 'append_ledger',
    label: 'Append Ledger',
    description:
      'Append an entry to a named ledger. Use autopilot for draft work; gated for review; strict for critical facts.',
    promptSnippet:
      'append_ledger(ledger="master", mode="autopilot", entry={...}) - append a fact.',
    promptGuidelines: [
      'Use autopilot mode for everyday notes; it deduplicates using dedupField automatically.',
      'Use gated mode when the fact needs human review (queues in pending ledger).',
      'Use strict mode only for the most sensitive facts requiring explicit user confirmation.',
      'Entry keys must match the ledger schema. Call describe_ledger first if unsure.',
    ],
    parameters: Type.Object({
      ledger: Type.String({
        description: 'Target ledger name (call describe_ledger if unsure)',
      }),
      mode: Type.Union([
        Type.Literal('strict'),
        Type.Literal('gated'),
        Type.Literal('autopilot'),
      ]),
      entry: Type.Record(Type.String(), Type.String(), {
        description: 'Field-key → value map matching the ledger schema',
      }),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const def = cfg.ledgers[params.ledger]
      if (!def) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(', ')}`,
            },
          ],
          details: {},
        }
      }

      const line = JSON.stringify(params.entry) + '\n'

      if (params.mode === 'strict') {
        const ok = await ctx.ui.confirm(
          'Strict Mode',
          `Approve entry for "${params.ledger}"?\n\n${JSON.stringify(params.entry, null, 2)}`
        )
        if (ok) {
          ensureDir(def.path)
          fs.appendFileSync(def.path, line)
          return {
            content: [
              { type: 'text', text: `Appended to "${params.ledger}".` },
            ],
            details: {},
          }
        }
        return {
          content: [{ type: 'text', text: `Entry rejected.` }],
          details: {},
        }
      }

      if (params.mode === 'gated') {
        const pending = cfg.ledgers['pending'] || def // fallback if no pending defined
        ensureDir(pending.path)
        fs.appendFileSync(pending.path, line)
        return {
          content: [{ type: 'text', text: `Queued for "${pending.path}".` }],
          details: {},
        }
      }

      // autopilot
      if (def.dedupField && fs.existsSync(def.path)) {
        const data = fs.readFileSync(def.path, 'utf-8')
        const dup = data
          .split('\n')
          .filter(Boolean)
          .some((l) => {
            try {
              return (
                JSON.parse(l)[def.dedupField!] === params.entry[def.dedupField!]
              )
            } catch {
              return false
            }
          })
        if (dup) {
          return {
            content: [
              {
                type: 'text',
                text: `Duplicate detected via "${def.dedupField}". Skipped.`,
              },
            ],
            details: {},
          }
        }
      }
      ensureDir(def.path)
      fs.appendFileSync(def.path, line)
      return {
        content: [
          { type: 'text', text: `Appended to "${params.ledger}" (autopilot).` },
        ],
        details: {},
      }
    },
  })

  /* ── configure_ledger ── */
  pi.registerTool({
    name: 'configure_ledger',
    label: 'Configure Ledger',
    description:
      'Read or update the pi-qmd-ledger config at runtime. Returns the merged config after changes.',
    promptSnippet: 'configure_ledger(action="read") - inspect current config.',
    promptGuidelines: [
      "Use configure_ledger(action='read') when you need to know the current schema, ledger paths, or injectors.",
      "Use configure_ledger(action='update', config={...}) when the user wants to change schema, add ledgers, or modify injectors.",
    ],
    parameters: Type.Object({
      action: Type.Union([Type.Literal('read'), Type.Literal('update')]),
      config: Type.Optional(
        Type.Record(Type.String(), Type.Any(), {
          description: 'Partial config object to merge (update mode only)',
        })
      ),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfgPath = findConfig(ctx.cwd) || path.join(ctx.cwd, CONFIG_FILES[0])

      if (params.action === 'read' || !params.config) {
        const cfg = loadConfig(ctx.cwd)
        return {
          content: [{ type: 'text', text: JSON.stringify(cfg, null, 2) }],
          details: {},
        }
      }

      let existing: any = {}
      if (fs.existsSync(cfgPath)) {
        try {
          existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
        } catch {
          /* fresh */
        }
      }

      const merged = { ...existing, ...params.config }
      ensureDir(cfgPath)
      fs.writeFileSync(cfgPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')

      ctx.ui.notify?.(`Config updated: ${cfgPath}`, 'info')
      return {
        content: [{ type: 'text', text: JSON.stringify(merged, null, 2) }],
        details: {},
      }
    },
  })

  pi.registerTool({
    name: 'describe_ledger',
    label: 'Describe Ledger',
    description:
      'Introspect a named ledger: schema, entry count, and sample first/last entries.',
    promptSnippet:
      'describe_ledger(ledger="master") - get schema and sample entries.',
    promptGuidelines: [
      'Call describe_ledger before append_ledger if you are unsure what fields the ledger expects.',
      'Use it to quickly check ledger health (total entries, malformed lines, schema).',
    ],
    parameters: Type.Object({
      ledger: Type.String({ description: 'Ledger name to inspect' }),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const def = cfg.ledgers[params.ledger]
      if (!def) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(', ')}`,
            },
          ],
          details: {},
        }
      }
      if (!fs.existsSync(def.path)) {
        return {
          content: [
            {
              type: 'text',
              text: `Ledger "${params.ledger}" not found at ${def.path}. Run /qmd-init.`,
            },
          ],
          details: {},
        }
      }

      const lines = fs
        .readFileSync(def.path, 'utf-8')
        .split('\n')
        .filter(Boolean)
      const total = lines.length
      let first: any = null
      let last: any = null
      let malformed = 0

      for (const line of lines) {
        try {
          const e = JSON.parse(line)
          if (!first) first = e
          last = e
        } catch {
          malformed++
        }
      }

      const report = [
        `Ledger: "${params.ledger}"`,
        `Path: ${def.path}`,
        `Schema: [${def.schema.join(', ')}]`,
        `Total entries: ${total}`,
        malformed ? `Malformed lines: ${malformed}` : '',
        `DedupField: ${def.dedupField ?? '(none)'}`,
        ``,
        `First entry:`,
        JSON.stringify(first, null, 2),
        ``,
        `Most recent entry:`,
        JSON.stringify(last, null, 2),
      ]
        .filter(Boolean)
        .join('\n')

      return { content: [{ type: 'text', text: report }], details: {} }
    },
  })

  pi.registerTool({
    name: 'ledger_stats',
    label: 'Ledger Stats',
    description:
      'Dashboard of all ledgers: counts, sizes, pending queue size, and qmd version.',
    promptSnippet: 'ledger_stats() - show all ledger counts and qmd health.',
    promptGuidelines: [
      'Call ledger_stats for a quick overview before writing or after a batch of appends.',
      'If qmd is missing, the output includes a pointer to /qmd-validate for install instructions.',
    ],
    parameters: Type.Object({}),
    async execute(
      _id: any,
      _params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const lines: string[] = []
      lines.push(`pi-qmd-ledger Stats`)
      lines.push(`Config path: ${findConfig(ctx.cwd) || '(default / none)'}`)
      lines.push(``)

      // qmd version
      const qmd = checkQmd(cfg.qmd.binary || 'qmd')
      lines.push(
        `qmd binary: ${cfg.qmd.binary || 'qmd'} ${qmd.ok ? qmd.version || '' : '(not found - run /qmd-validate for install instructions)'}`
      )
      lines.push(`Default search limit: ${cfg.qmd.defaultLimit}`)
      lines.push(`Max buffer: ${cfg.qmd.maxBuffer}`)
      lines.push(`Injectors: ${cfg.injectors.length}`)
      lines.push(``)

      lines.push(`Ledgers:`)
      for (const [name, def] of Object.entries(cfg.ledgers)) {
        let count = 0
        let malformed = 0
        if (fs.existsSync(def.path)) {
          const data = fs
            .readFileSync(def.path, 'utf-8')
            .split('\n')
            .filter(Boolean)
          for (const line of data) {
            try {
              JSON.parse(line)
              count++
            } catch {
              malformed++
            }
          }
        }
        const size = fs.existsSync(def.path)
          ? `${fs.statSync(def.path).size} bytes`
          : 'missing'
        lines.push(`  "${name}"`)
        lines.push(`    → ${def.path}`)
        lines.push(`    Schema: [${def.schema.join(', ')}]`)
        lines.push(
          `    Entries: ${count} entries, ${size}${malformed ? `, ${malformed} malformed lines` : ''}`
        )
        if (def.dedupField) lines.push(`    DedupField: ${def.dedupField}`)
      }

      const msg = lines.join('\n')
      return { content: [{ type: 'text', text: msg }], details: {} }
    },
  })

  pi.registerTool({
    name: 'ledger_export',
    label: 'Ledger Export',
    description:
      'Export a named ledger to JSON array, CSV, or Markdown table for sharing.',
    promptSnippet:
      'ledger_export(ledger="master", format="json") - export a ledger.',
    promptGuidelines: [
      'Use ledger_export when the user wants to share, archive, or import ledger data elsewhere.',
      'If exporting to CSV or Markdown, the schema keys become column headers.',
    ],
    parameters: Type.Object({
      ledger: Type.String({ description: 'Ledger name to export' }),
      format: Type.Union(
        [Type.Literal('json'), Type.Literal('csv'), Type.Literal('markdown')],
        { description: 'Export format (default json)' }
      ),
    }),
    async execute(
      _id: any,
      params: any,
      _signal: any,
      _onUpdate: any,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const def = cfg.ledgers[params.ledger]
      const format = params.format || 'json'
      if (!def) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(', ')}`,
            },
          ],
          details: {},
        }
      }
      if (!fs.existsSync(def.path)) {
        return {
          content: [
            {
              type: 'text',
              text: `Ledger "${params.ledger}" not found at ${def.path}.`,
            },
          ],
          details: {},
        }
      }

      const lines = fs
        .readFileSync(def.path, 'utf-8')
        .split('\n')
        .filter(Boolean)
      const entries: any[] = []
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line))
        } catch {
          /* skip malformed */
        }
      }

      let text = ''

      if (format === 'json') {
        text = JSON.stringify(entries, null, 2)
      } else if (format === 'csv') {
        const schemaKeys = def.schema.length
          ? def.schema
          : entries[0]
            ? Object.keys(entries[0])
            : []
        const escape = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
        const rows = [schemaKeys.map(escape).join(',')]
        for (const e of entries) {
          rows.push(schemaKeys.map((k) => escape(e[k])).join(','))
        }
        text = rows.join('\n')
      } else if (format === 'markdown') {
        const schemaKeys = def.schema.length
          ? def.schema
          : entries[0]
            ? Object.keys(entries[0])
            : []
        const esc = (s: string) =>
          String(s ?? '')
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
        const header = '| ' + schemaKeys.join(' | ') + ' |'
        const dashes = '| ' + schemaKeys.map(() => '---').join(' | ') + ' |'
        const rows = [header, dashes]
        for (const e of entries) {
          rows.push('| ' + schemaKeys.map((k) => esc(e[k])).join(' | ') + ' |')
        }
        text = rows.join('\n')
      }

      return { content: [{ type: 'text', text }], details: {} }
    },
  })

  /* ── qmd_status ── */
  pi.registerTool({
    name: 'qmd_status',
    label: 'QMD Status',
    description:
      'Show qmd index state: collections, indexed documents, and pending embeddings.',
    promptSnippet:
      'qmd_status() - check what docs are indexed and whether embeddings are stale.',
    promptGuidelines: [
      'Call qmd_status before qmd_search to confirm documents are indexed.',
      'If the output shows many pending embeddings, run /qmd-index to rebuild.',
    ],
    parameters: Type.Object({}),
    async execute(
      _id: any,
      _params: any,
      _signal: any,
      _onUpdate: any,
      _ctx: ExtensionContext
    ) {
      return new Promise<any>((resolve) => {
        child_process.execFile(
          'qmd',
          ['status'],
          { maxBuffer: 10 * 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              resolve({
                content: [
                  { type: 'text', text: qmdInstructions() + '\n\n' + stderr },
                ],
                details: {},
              })
              return
            }
            const msg = stdout + (stderr ? '\n' + stderr : '')
            resolve({ content: [{ type: 'text', text: msg }], details: {} })
          }
        )
      })
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

      // Run qmd update
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

  /* ── before_agent_start: dynamic injectors ── */
  pi.on('before_agent_start', async (event, ctx: ExtensionContext) => {
    const cfg = loadConfig(ctx.cwd)
    let additions = ''

    for (const ij of cfg.injectors) {
      const regex = new RegExp(ij.regex, 'i')
      const match = event.prompt.match(regex)
      if (!match) continue

      const capture = match[ij.captureGroup ?? 1]
      const ledger = cfg.ledgers[ij.ledger]
      if (!ledger) continue

      let entriesText = ''
      if (fs.existsSync(ledger.path)) {
        const lines = fs
          .readFileSync(ledger.path, 'utf-8')
          .split('\n')
          .filter(Boolean)
        const hits: any[] = []
        for (const line of lines) {
          try {
            const e = JSON.parse(line)
            if (!ij.filterField || e[ij.filterField] === capture) hits.push(e)
          } catch {
            /* ignore */
          }
        }
        entriesText = JSON.stringify(hits, null, 2)
      }

      const artifactText =
        ij.artifactPath && fs.existsSync(ij.artifactPath)
          ? fs.readFileSync(ij.artifactPath, 'utf-8')
          : ''

      const tmpl =
        ij.template ??
        `\n\n=== {{injector}} CONTEXT [capture={{capture}}] ===\nENTRIES:\n{{entries}}\nARTIFACT:\n{{artifact}}\n`

      additions += tmpl
        .replace(/\{\{injector\}\}/g, ij.name)
        .replace(/\{\{capture\}\}/g, capture ?? '')
        .replace(/\{\{entries\}\}/g, entriesText || '(none)')
        .replace(/\{\{artifact\}\}/g, artifactText || '(none)')
    }

    if (additions) {
      return { systemPrompt: event.systemPrompt + additions }
    }

    // --- pi-context integration: handle auto-ACM and tag-based triggers ---
    const piContextCfg = getPiContextConfig(cfg)
    if (piContextCfg.enabled) {
      // 1. Handle Auto-ACM: Send /acm if not yet enabled for this session
      if (piContextCfg.autoEnableAcm) {
        // pi-context uses a global CommandCtx. We can't check it from here, 
        // so we trigger /acm. If it's already enabled, it just notifies the user.
        pi.sendMessage({
          customType: 'pi-context',
          content: '/acm',
          display: false,
        }, {
          deliverAs: 'followUp'
        })
      }

      // 2. Hook into context tags via context_log
      if (piContextCfg.tagPatterns && piContextCfg.tagPatterns.length > 0) {
        try {
          const allTools = pi.getAllTools()
          const contextLogTool = allTools.find((t) => t.name === 'context_log')
          if (contextLogTool) {
            const logs = await (contextLogTool as any).execute?.(
              null,
              { limit: 100, verbose: true },
              null,
              null,
              ctx
            )
            
            if (logs && logs.content && logs.content[0]?.text) {
              const logText = logs.content[0].text
              
              for (const pattern of piContextCfg.tagPatterns) {
                const tagRegex = new RegExp(pattern, 'i')
                // Extract labels from context_log (usually formatted as 'tag: name')
                const tagMatches = logText.match(/tag:\s*([\w-]+)/gi)
                
                if (tagMatches) {
                  for (const match of tagMatches) {
                    const tagValue = match.replace(/tag:\s*/i, '')
                    if (tagRegex.test(tagValue)) {
                      // Found a matching tag. Now query ledgers for entries matching this tag.
                      // We check all ledgers that might have a 'tag' field in their schema.
                      for (const [ledgerName, ledgerDef] of Object.entries(cfg.ledgers)) {
                        if (ledgerDef.schema.includes('tag') && fs.existsSync(ledgerDef.path)) {
                          const lines = fs.readFileSync(ledgerDef.path, 'utf-8').split('\\n').filter(Boolean)
                          const hits = lines
                            .map(l => { try { return JSON.parse(l) } catch { return null } })
                            .filter(e => e && e.tag === tagValue)

                          if (hits.length > 0) {
                            additions += `\\n\\n=== pi-context tag [${tagValue}] matched ${ledgerName} ===\\n${JSON.stringify(hits, null, 2)}\\n`
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('[pi-qmd-ledger] pi-context tag integration error:', e)
        }
      }
    }

    if (additions) {
      return { systemPrompt: event.systemPrompt + additions }
    }
  })

  /* ── pi.on('turn_end'): capture pi-context events ── */
  pi.on('turn_end', async (event, ctx: ExtensionContext) => {
    const cfg = loadConfig(ctx.cwd)
    const piContextCfg = getPiContextConfig(cfg)
    const hasPiContext = hasPiContextTools(pi)

    if (!hasPiContext || !piContextCfg.enabled || !piContextCfg.indexContextEvents) {
      return // pi-context not available, not enabled, or indexing is toggled off
    }

    try {
      if (!hasPiContextTools(pi)) {
        return
      }

      const allTools = pi.getAllTools()
      const contextLogTool = allTools.find((t) => t.name === 'context_log')
      const contextCheckoutTool = allTools.find((t) => t.name === 'context_checkout')
      if (!contextLogTool || !contextCheckoutTool) {
        return
      }

      const ledgerDef = cfg.ledgers['context_events']
      if (!ledgerDef) {
        console.warn("[pi-qmd-ledger] 'context_events' ledger not defined in config. Cannot index pi-context events.")
        return
      }

      // 1. Get current session history
      const logs = await (contextLogTool as any).execute?.(
        null,
        { limit: 100, verbose: true },
        null,
        null,
        ctx
      )

      if (!logs || !logs.content || !logs.content[0]?.text) {
        return
      }
      const logText = logs.content[0].text

      // Simplified parsing for tags and summaries from context_log
      const capturedEvents: any[] = []
      const lines = logText.split('\n')

      lines.forEach(line => {
        const timestamp = new Date().toISOString() // Current time of capture
        let event: any = null

        // Capture Tags
        const tagMatch = line.match(/^\*?\s*([0-9a-f]+)\s+\(tag:\s*([\w-]+).*\)\s*\[(AI|USER|BASH|TOOL|SUMMARY)\]\s*(.*)/i)
        if (tagMatch) {
          event = {
            id: `tag-${tagMatch[1]}-${tagMatch[2]}`, // Unique ID for event
            type: 'tag_created',
            session_entry_id: tagMatch[1],
            content: `Tag '${tagMatch[2]}' created at ${tagMatch[1]}`,
            timestamp: timestamp,
            tags: [tagMatch[2], 'pi-context'],
            details: { tag_name: tagMatch[2], entry_id: tagMatch[1], entry_type: tagMatch[3], entry_summary: tagMatch[4].trim() }
          }
        }

        // Capture Checkout Summaries (more robust extraction needed, this is simplified)
        const summaryMatch = line.match(/^\*?\s*([0-9a-f]+)\s+\((ROOT|HEAD)?.*summary from (.*)\)\s*\[SUMMARY\]\s*(.*)/i)
        if (summaryMatch) {
            // Need to retrieve the actual summary message from the SessionManager.
            // context_log output provides only a short version.
            // For now, use the short version from log text.
            event = {
                id: `checkout-summary-${summaryMatch[1]}`,
                type: 'checkout_summary',
                session_entry_id: summaryMatch[1],
                content: `Checkout summary from ${summaryMatch[3]}: ${summaryMatch[4].trim()}`,
                timestamp: timestamp,
                tags: ['pi-context', 'checkout', 'summary'],
                details: { origin: summaryMatch[3], summary_message: summaryMatch[4].trim(), entry_id: summaryMatch[1] }
            }
        }

        if (event) {
          capturedEvents.push(event)
        }
      })

      // Append events directly to ledger (no ctx.toolCall available in event handlers)
      if (ledgerDef) {
        ensureDir(ledgerDef.path)

        // Deduplicate by id if dedupField is set
        let existingIds = new Set<string>()
        if (ledgerDef.dedupField && fs.existsSync(ledgerDef.path)) {
          const data = fs.readFileSync(ledgerDef.path, 'utf-8')
          for (const line of data.split('\n').filter(Boolean)) {
            try {
              existingIds.add(JSON.parse(line)[ledgerDef.dedupField])
            } catch {
              /* ignore malformed */
            }
          }
        }

        for (const event of capturedEvents) {
          if (ledgerDef.dedupField && existingIds.has(event[ledgerDef.dedupField])) {
            continue
          }
          fs.appendFileSync(ledgerDef.path, JSON.stringify(event) + '\n')
          if (ledgerDef.dedupField) existingIds.add(event[ledgerDef.dedupField])
        }
      }

    } catch (e) {
      console.error("[pi-qmd-ledger] Error capturing pi-context events:", e)
    }
  })
}
