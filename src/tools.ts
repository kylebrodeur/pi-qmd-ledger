import type { ExtensionAPI, ExtensionContext, AgentToolUpdateCallback } from '@mariozechner/pi-coding-agent'
import { Type } from '@sinclair/typebox'
import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {
  checkQmd,
  ensureDir,
  findConfig,
  ledgerNames,
  loadConfig,
  qmdInstructions,
} from './utils.js'
import type {
  QmdSearchInput,
  QueryLedgerInput,
  AppendLedgerInput,
  ConfigureLedgerInput,
  DescribeLedgerInput,
  LedgerExportInput,
} from './types.js'

export const registerTools = (pi: ExtensionAPI) => {
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
      _id: string,
      params: QmdSearchInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
              const code = (error as { code?: string }).code
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
      _id: string,
      params: QueryLedgerInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
      const results: unknown[] = []

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
      _id: string,
      params: AppendLedgerInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
        const pending = cfg.ledgers['pending'] || def
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
      _id: string,
      params: ConfigureLedgerInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
      ctx: ExtensionContext
    ) {
      const cfgPath = findConfig(ctx.cwd).project || path.join(ctx.cwd, 'pi-qmd-ledger.config.json')

      if (params.action === 'read' || !params.config) {
        const cfg = loadConfig(ctx.cwd)
        return {
          content: [{ type: 'text', text: JSON.stringify(cfg, null, 2) }],
          details: {},
        }
      }

      let existing: Record<string, unknown> = {}
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
      _id: string,
      params: DescribeLedgerInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
      let first: unknown = null
      let last: unknown = null
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
      _id: string,
      _params: Record<string, never>,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
      ctx: ExtensionContext
    ) {
      const cfg = loadConfig(ctx.cwd)
      const lines: string[] = []
      lines.push(`pi-qmd-ledger Stats`)
      lines.push(`Config path: project=${findConfig(ctx.cwd).project || '(none)'}, global=${findConfig(ctx.cwd).global || '(none)'}`)
      lines.push(``)

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
      _id: string,
      params: LedgerExportInput,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
      const entries: unknown[] = []
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
      _id: string,
      _params: Record<string, never>,
      _signal: AbortSignal | undefined,
      _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
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
}
