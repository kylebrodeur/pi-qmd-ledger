import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

/* ═══════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════ */
const EXT_ROOT = path.join(__dirname, "..");
const CONFIG_FILES = ["pi-qmd-ledger.config.json", ".pi/qmd-ledger.config.json"];

/* ═══════════════════════════════════════
   CONFIG TYPES
   ═══════════════════════════════════════ */
interface LedgerDef {
    path: string;
    schema: string[];
    dedupField?: string;
}

interface InjectorDef {
    name: string;
    regex: string;
    captureGroup?: number;
    ledger: string;
    filterField?: string;
    artifactPath?: string;
    template?: string;
}

interface QmdDef {
    binary?: string;
    defaultLimit?: number;
    maxBuffer?: number;
}

interface UniversalConfig {
    version: number;
    ledgers: Record<string, LedgerDef>;
    injectors: InjectorDef[];
    qmd: QmdDef;
}

const DEFAULT_CONFIG: UniversalConfig = {
    version: 2,
    ledgers: {
        master: {
            path: "ledger/master.jsonl",
            schema: ["id", "domain", "source", "fact", "tag", "artifact"],
            dedupField: "fact"
        },
        pending: {
            path: "ledger/pending.jsonl",
            schema: "master" as unknown as string[], // resolved at runtime
        }
    },
    injectors: [
        {
            name: "draft-context",
            regex: "draft\\s+(\\S+)",
            ledger: "master",
            filterField: "tag",
            artifactPath: "ledger/artifact.md",
        }
    ],
    qmd: {
        binary: "qmd",
        defaultLimit: 5,
        maxBuffer: 10 * 1024 * 1024,
    }
};

/* ═══════════════════════════════════════
   UTILS
   ═══════════════════════════════════════ */
function resolvePath(cwd: string, p: string): string {
    return path.isAbsolute(p) ? p : path.join(cwd, p);
}

function ensureDir(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function findConfig(cwd: string): string | undefined {
    for (const rel of CONFIG_FILES) {
        const fp = path.join(cwd, rel);
        if (fs.existsSync(fp)) return fp;
    }
    return undefined;
}

function loadConfig(cwd: string): UniversalConfig {
    let cfg: Partial<UniversalConfig> = {};
    const cfgPath = findConfig(cwd);
    if (cfgPath) {
        try {
            cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
        } catch (e) {
            console.warn(`[pi-qmd-ledger] Config parse error at ${cfgPath}: ${e}`);
        }
    }

    const merged: UniversalConfig = {
        version: cfg.version ?? DEFAULT_CONFIG.version,
        ledgers: {},
        injectors: cfg.injectors ?? DEFAULT_CONFIG.injectors,
        qmd: { ...DEFAULT_CONFIG.qmd, ...cfg.qmd },
    };

    // Merge ledgers
    const ledgersSrc = cfg.ledgers ?? DEFAULT_CONFIG.ledgers;
    const resolvedLedgers: Record<string, LedgerDef> = {};
    for (const [name, def] of Object.entries(ledgersSrc)) {
        const base = typeof def.schema === "string" ? resolvedLedgers[def.schema] : undefined;
        resolvedLedgers[name] = {
            path: resolvePath(cwd, def.path || (base?.path ?? "")),
            schema: (typeof def.schema === "string" ? (base?.schema ?? []) : def.schema),
            dedupField: def.dedupField ?? base?.dedupField,
        };
    }
    merged.ledgers = resolvedLedgers;

    // Resolve artifact paths in injectors
    merged.injectors = merged.injectors.map(ij => ({
        ...ij,
        artifactPath: ij.artifactPath ? resolvePath(cwd, ij.artifactPath) : undefined,
    }));

    // Env overrides
    if (process.env.QMD_BINARY) merged.qmd.binary = process.env.QMD_BINARY;

    return merged;
}

function describeSchema(schema: string[]): string {
    return `Entry fields (${schema.join(", ")}). Example: ${JSON.stringify(
        Object.fromEntries(schema.map(f => [f, "..."]))
    )}`;
}

function ledgerNames(cfg: UniversalConfig): string[] {
    return Object.keys(cfg.ledgers);
}

/* ── qmd install helper ── */
function qmdInstructions(binary?: string): string {
    return [
        `qmd binary "${binary || "qmd"}" not found.`,
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
    ].join("\n");
}

function checkQmd(binary?: string): { ok: boolean; version?: string; instructions?: string } {
    const result = child_process.spawnSync(binary || "qmd", ["--version"], { encoding: "utf-8" });
    if (result.error) {
        return { ok: false, instructions: qmdInstructions(binary) };
    }
    return { ok: true, version: result.stdout.trim() };
}

/* ═══════════════════════════════════════
   MAIN EXTENSION
   ═══════════════════════════════════════ */
export default function (pi: ExtensionAPI) {

    /* ── expose skills directory ── */
    pi.on("resources_discover", async (_event) => {
        const skillsDir = path.join(EXT_ROOT, "skills");
        return fs.existsSync(skillsDir) ? { skillPaths: [skillsDir] } : {};
    });

    /* ── /qmd-validate ── */
    pi.registerCommand("qmd-validate", {
        description: "Check qmd binary, config, and all configured ledger paths.",
        handler: async (_args, ctx: ExtensionContext) => {
            const cfg = loadConfig(ctx.cwd);
            const lines: string[] = [];

            // qmd
            const qmd = checkQmd(cfg.qmd.binary || "qmd");
            if (qmd.ok) {
                lines.push(`✅ qmd: ${cfg.qmd.binary || "qmd"} (${qmd.version})`);
            } else {
                lines.push(`❌ qmd binary "${cfg.qmd.binary || "qmd"}" not found.`);
                lines.push(`\n${qmd.instructions}`);
            }

            // config
            const cfgPath = findConfig(ctx.cwd);
            lines.push(cfgPath ? `✅ Config: ${cfgPath}` : `⚠️  No config file (checked ${CONFIG_FILES.join(", ")}).`);

            // ledgers
            for (const [name, def] of Object.entries(cfg.ledgers)) {
                const exists = fs.existsSync(def.path);
                lines.push(`${exists ? "✅" : "⚠️"} Ledger "${name}": ${def.path} ${exists ? "" : "(missing)"}`);
                if (exists && def.dedupField) lines.push(`   └─ dedupField: ${def.dedupField}`);
            }

            // injectors
            lines.push(`📡 Injectors (${cfg.injectors.length}):`);
            for (const ij of cfg.injectors) {
                lines.push(`   • "${ij.name}" → ledger:"${ij.ledger}" regex:${ij.regex}`);
            }

            const msg = lines.join("\n");
            if (ctx.hasUI) ctx.ui.editor("Ledger Setup Validation", msg);
            return { content: [{ type: "text", text: msg }], details: {} } as any;
        }
    });

    /* ── /qmd-init ── */
    pi.registerCommand("qmd-init", {
        description: "Scaffold config, ledgers, and artifact templates in the current project.",
        handler: async (_args, ctx: ExtensionContext) => {
            const cfg = loadConfig(ctx.cwd);
            const created: string[] = [];
            const skipped: string[] = [];

            const ensureFile = (dest: string, tmpl: string) => {
                if (fs.existsSync(dest)) { skipped.push(dest); return; }
                ensureDir(dest);
                const src = path.join(EXT_ROOT, "templates", tmpl);
                fs.writeFileSync(dest, fs.existsSync(src) ? fs.readFileSync(src) : "", "utf-8");
                created.push(dest);
            };

            // Write config if missing
            const cfgDest = path.join(ctx.cwd, CONFIG_FILES[0]);
            if (!fs.existsSync(cfgDest)) {
                const tmpl = {
                    version: 2,
                    ledgers: {
                        master: { path: "ledger/master.jsonl", schema: ["id", "domain", "source", "fact", "tag", "artifact"], dedupField: "fact" },
                        pending: { path: "ledger/pending.jsonl", schema: "master" },
                    },
                    injectors: [
                        { name: "draft-context", regex: "draft\\s+(\\S+)", ledger: "master", filterField: "tag" }
                    ],
                    qmd: { binary: "qmd", defaultLimit: 5 },
                };
                fs.writeFileSync(cfgDest, JSON.stringify(tmpl, null, 2) + "\n", "utf-8");
                created.push(cfgDest);
            } else {
                skipped.push(cfgDest);
            }

            for (const [name, def] of Object.entries(cfg.ledgers)) {
                ensureFile(def.path, name === "pending" ? "PENDING_LEDGER.jsonl" : "UCL_LEDGER.jsonl");
            }

            for (const ij of cfg.injectors) {
                if (ij.artifactPath) ensureFile(ij.artifactPath, "ARTIFACT.md");
            }

            const msg = [
                `Ledger scaffolding complete.`,
                ``,
                `Created:`,
                ...created.map(c => `  • ${path.relative(ctx.cwd, c)}`),
                skipped.length ? `Skipped (already exist):` : "",
                ...skipped.map(s => `  • ${path.relative(ctx.cwd, s)}`),
            ].filter(Boolean).join("\n");

            if (ctx.hasUI) ctx.ui.notify(msg, "info");
            return { content: [{ type: "text", text: msg }], details: {} } as any;
        }
    });

    /* ── qmd_search ── */
    pi.registerTool({
        name: "qmd_search",
        label: "QMD Search",
        description: "Perform a fuzzy semantic search using qmd across indexed raw documents.",
        promptSnippet: "qmd_search(query=\"...\", limit=5) — semantic search over your docs.",
        promptGuidelines: [
            "Use qmd_search when you need to find relevant context before writing or verifying facts.",
            "If qmd_search returns nothing, try /qmd-index to rebuild indexes.",
            "The query parameter should be a natural-language question or topic, not a strict keyword.",
        ],
        parameters: Type.Object({ query: Type.String({ description: "Natural-language search query (e.g., 'user auth flow', 'database migration strategy')" }), limit: Type.Optional(Type.Number({ description: "Max results (default from config, typically 5)" })) }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const limit = params.limit ?? cfg.qmd.defaultLimit ?? 5;
            return new Promise<any>(resolve => {
                child_process.execFile(
                    cfg.qmd.binary || "qmd",
                    ["search", params.query, "--limit", String(limit)],
                    { maxBuffer: cfg.qmd.maxBuffer },
                    (error, stdout, stderr) => {
                        if (error) {
                            const code = (error as any).code;
                            resolve({ content: [{ type: "text", text: code === "ENOENT"
                                ? `qmd binary "${cfg.qmd.binary}" not found.\n\n${qmdInstructions(cfg.qmd.binary)}`
                                : `Error: ${error.message}\n${stderr}` }], details: {} });
                            return;
                        }
                        resolve({ content: [{ type: "text", text: stdout }], details: {} });
                    }
                );
            });
        }
    });

    /* ── query_ledger ── */
    pi.registerTool({
        name: "query_ledger",
        label: "Query Ledger",
        description: "Deterministic JSONL search by ledger name. Use for exact lookups and filtered retrieval.",
        promptSnippet: "query_ledger(ledger=\"master\", query=\"...\", filters={key: \"value\"}) — exact ledger search.",
        promptGuidelines: [
            "Use query_ledger when you already know the ledger name and need exact matches (e.g., all entries with tag='login').",
            "query does substring search across all text fields; filters does exact key-value matching.",
            "If the ledger is missing, run /qmd-init first.",
        ],
        parameters: Type.Object({
            ledger: Type.String({ description: "Ledger name to search (e.g. master, pending)" }),
            query: Type.Optional(Type.String({ description: "Free-text substring search across all text fields of entries" })),
            filters: Type.Optional(Type.Record(Type.String(), Type.String(), { description: "Exact {field: value} matches (ANDed together)" })),
        }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const def = cfg.ledgers[params.ledger];
            if (!def) {
                return { content: [{ type: "text", text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(", ")}` }], details: {} };
            }
            if (!fs.existsSync(def.path)) {
                return { content: [{ type: "text", text: `Ledger "${params.ledger}" not found at ${def.path}. Run /qmd-init.` }], details: {} };
            }

            const lines = fs.readFileSync(def.path, "utf-8").split("\n").filter(Boolean);
            const results: any[] = [];

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    let match = true;

                    if (params.query) {
                        const text = def.schema.map(f => entry[f] ?? "").join(" ").toLowerCase();
                        match = text.includes(params.query.toLowerCase());
                    }

                    if (match && params.filters) {
                        for (const [k, v] of Object.entries(params.filters)) {
                            if (String(entry[k] ?? "") !== String(v)) { match = false; break; }
                        }
                    }

                    if (match) results.push(entry);
                } catch { /* ignore malformed */ }
            }

            return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }], details: {} };
        }
    });

    /* ── append_ledger ── */
    pi.registerTool({
        name: "append_ledger",
        label: "Append Ledger",
        description: "Append an entry to a named ledger. Use autopilot for draft work; gated for review; strict for critical facts.",
        promptSnippet: "append_ledger(ledger=\"master\", mode=\"autopilot\", entry={...}) — append a fact.",
        promptGuidelines: [
            "Use autopilot mode for everyday notes; it deduplicates using dedupField automatically.",
            "Use gated mode when the fact needs human review (queues in pending ledger).",
            "Use strict mode only for the most sensitive facts requiring explicit user confirmation.",
            "Entry keys must match the ledger schema. Call describe_ledger first if unsure.",
        ],
        parameters: Type.Object({
            ledger: Type.String({ description: "Target ledger name (call describe_ledger if unsure)" }),
            mode: Type.Union([Type.Literal("strict"), Type.Literal("gated"), Type.Literal("autopilot")]),
            entry: Type.Record(Type.String(), Type.String(), { description: "Field-key → value map matching the ledger schema" }),
        }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const def = cfg.ledgers[params.ledger];
            if (!def) {
                return { content: [{ type: "text", text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(", ")}` }], details: {} };
            }

            const line = JSON.stringify(params.entry) + "\n";

            if (params.mode === "strict") {
                const ok = await ctx.ui.confirm("Strict Mode", `Approve entry for "${params.ledger}"?\n\n${JSON.stringify(params.entry, null, 2)}`);
                if (ok) {
                    ensureDir(def.path);
                    fs.appendFileSync(def.path, line);
                    return { content: [{ type: "text", text: `Appended to "${params.ledger}".` }], details: {} };
                }
                return { content: [{ type: "text", text: `Entry rejected.` }], details: {} };
            }

            if (params.mode === "gated") {
                const pending = cfg.ledgers["pending"] || def; // fallback if no pending defined
                ensureDir(pending.path);
                fs.appendFileSync(pending.path, line);
                return { content: [{ type: "text", text: `Queued for "${pending.path}".` }], details: {} };
            }

            // autopilot
            if (def.dedupField && fs.existsSync(def.path)) {
                const data = fs.readFileSync(def.path, "utf-8");
                const dup = data.split("\n").filter(Boolean).some(l => {
                    try { return JSON.parse(l)[def.dedupField!] === params.entry[def.dedupField!]; } catch { return false; }
                });
                if (dup) {
                    return { content: [{ type: "text", text: `Duplicate detected via "${def.dedupField}". Skipped.` }], details: {} };
                }
            }
            ensureDir(def.path);
            fs.appendFileSync(def.path, line);
            return { content: [{ type: "text", text: `Appended to "${params.ledger}" (autopilot).` }], details: {} };
        }
    });

    /* ── configure_ledger ── */
    pi.registerTool({
        name: "configure_ledger",
        label: "Configure Ledger",
        description: "Read or update the pi-qmd-ledger config at runtime. Returns the merged config after changes.",
        promptSnippet: "configure_ledger(action=\"read\") — inspect current config.",
        promptGuidelines: [
            "Use configure_ledger(action='read') when you need to know the current schema, ledger paths, or injectors.",
            "Use configure_ledger(action='update', config={...}) when the user wants to change schema, add ledgers, or modify injectors.",
        ],
        parameters: Type.Object({
            action: Type.Union([Type.Literal("read"), Type.Literal("update")]),
            config: Type.Optional(Type.Record(Type.String(), Type.Any(), { description: "Partial config object to merge (update mode only)" })),
        }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfgPath = findConfig(ctx.cwd) || path.join(ctx.cwd, CONFIG_FILES[0]);

            if (params.action === "read" || !params.config) {
                const cfg = loadConfig(ctx.cwd);
                return { content: [{ type: "text", text: JSON.stringify(cfg, null, 2) }], details: {} };
            }

            let existing: any = {};
            if (fs.existsSync(cfgPath)) {
                try { existing = JSON.parse(fs.readFileSync(cfgPath, "utf-8")); } catch { /* fresh */ }
            }

            const merged = { ...existing, ...params.config };
            ensureDir(cfgPath);
            fs.writeFileSync(cfgPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");

            ctx.ui.notify?.(`Config updated: ${cfgPath}`, "info");
            return { content: [{ type: "text", text: JSON.stringify(merged, null, 2) }], details: {} };
        }
    });

    pi.registerTool({
        name: "describe_ledger",
        label: "Describe Ledger",
        description: "Introspect a named ledger: schema, entry count, and sample first/last entries.",
        promptSnippet: "describe_ledger(ledger=\"master\") — get schema and sample entries.",
        promptGuidelines: [
            "Call describe_ledger before append_ledger if you are unsure what fields the ledger expects.",
            "Use it to quickly check ledger health (total entries, malformed lines, schema).",
        ],
        parameters: Type.Object({
            ledger: Type.String({ description: "Ledger name to inspect" }),
        }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const def = cfg.ledgers[params.ledger];
            if (!def) {
                return { content: [{ type: "text", text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(", ")}` }], details: {} };
            }
            if (!fs.existsSync(def.path)) {
                return { content: [{ type: "text", text: `Ledger "${params.ledger}" not found at ${def.path}. Run /qmd-init.` }], details: {} };
            }

            const lines = fs.readFileSync(def.path, "utf-8").split("\n").filter(Boolean);
            const total = lines.length;
            let first: any = null;
            let last: any = null;
            let malformed = 0;

            for (const line of lines) {
                try {
                    const e = JSON.parse(line);
                    if (!first) first = e;
                    last = e;
                } catch { malformed++; }
            }

            const report = [
                `Ledger: "${params.ledger}"`,
                `Path: ${def.path}`,
                `Schema: [${def.schema.join(", ")}]`,
                `Total entries: ${total}`,
                malformed ? `Malformed lines: ${malformed}` : "",
                `DedupField: ${def.dedupField ?? "(none)"}`,
                ``,
                `First entry:`,
                JSON.stringify(first, null, 2),
                ``,
                `Most recent entry:`,
                JSON.stringify(last, null, 2),
            ].filter(Boolean).join("\n");

            return { content: [{ type: "text", text: report }], details: {} };
        }
    });

    pi.registerTool({
        name: "ledger_stats",
        label: "Ledger Stats",
        description: "Dashboard of all ledgers: counts, sizes, pending queue size, and qmd version.",
        promptSnippet: "ledger_stats() — show all ledger counts and qmd health.",
        promptGuidelines: [
            "Call ledger_stats for a quick overview before writing or after a batch of appends.",
            "If qmd is missing, the output includes a pointer to /qmd-validate for install instructions.",
        ],
        parameters: Type.Object({}),
        async execute(_id, _params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const lines: string[] = [];
            lines.push(`pi-qmd-ledger Stats`);
            lines.push(`Config path: ${findConfig(ctx.cwd) || "(default / none)"}`);
            lines.push(``);

            // qmd version
            const qmd = checkQmd(cfg.qmd.binary || "qmd");
            lines.push(`qmd binary: ${cfg.qmd.binary || "qmd"} ${qmd.ok ? (qmd.version || "") : "(not found — run /qmd-validate for install instructions)"}`);
            lines.push(`Default search limit: ${cfg.qmd.defaultLimit}`);
            lines.push(`Max buffer: ${cfg.qmd.maxBuffer}`);
            lines.push(`Injectors: ${cfg.injectors.length}`);
            lines.push(``);

            lines.push(`Ledgers:`);
            for (const [name, def] of Object.entries(cfg.ledgers)) {
                let count = 0;
                let malformed = 0;
                if (fs.existsSync(def.path)) {
                    const data = fs.readFileSync(def.path, "utf-8").split("\n").filter(Boolean);
                    for (const line of data) {
                        try { JSON.parse(line); count++; } catch { malformed++; }
                    }
                }
                const size = fs.existsSync(def.path) ? `${fs.statSync(def.path).size} bytes` : "missing";
                lines.push(`  "${name}"`);
                lines.push(`    → ${def.path}`);
                lines.push(`    Schema: [${def.schema.join(", ")}]`);
                lines.push(`    Entries: ${count} entries, ${size}${malformed ? `, ${malformed} malformed lines` : ""}`);
                if (def.dedupField) lines.push(`    DedupField: ${def.dedupField}`);
            }

            const msg = lines.join("\n");
            return { content: [{ type: "text", text: msg }], details: {} };
        }
    });

    pi.registerTool({
        name: "ledger_export",
        label: "Ledger Export",
        description: "Export a named ledger to JSON array, CSV, or Markdown table for sharing.",
        promptSnippet: "ledger_export(ledger=\"master\", format=\"json\") — export a ledger.",
        promptGuidelines: [
            "Use ledger_export when the user wants to share, archive, or import ledger data elsewhere.",
            "If exporting to CSV or Markdown, the schema keys become column headers.",
        ],
        parameters: Type.Object({
            ledger: Type.String({ description: "Ledger name to export" }),
            format: Type.Union([Type.Literal("json"), Type.Literal("csv"), Type.Literal("markdown")], { description: "Export format (default json)" }),
        }),
        async execute(_id, params, _signal, _onUpdate, ctx: ExtensionContext) {
            const cfg = loadConfig(ctx.cwd);
            const def = cfg.ledgers[params.ledger];
            const format = params.format || "json";
            if (!def) {
                return { content: [{ type: "text", text: `Unknown ledger "${params.ledger}". Available: ${ledgerNames(cfg).join(", ")}` }], details: {} };
            }
            if (!fs.existsSync(def.path)) {
                return { content: [{ type: "text", text: `Ledger "${params.ledger}" not found at ${def.path}.` }], details: {} };
            }

            const lines = fs.readFileSync(def.path, "utf-8").split("\n").filter(Boolean);
            const entries: any[] = [];
            for (const line of lines) {
                try { entries.push(JSON.parse(line)); } catch { /* skip malformed */ }
            }

            let text = "";

            if (format === "json") {
                text = JSON.stringify(entries, null, 2);
            } else if (format === "csv") {
                const schemaKeys = def.schema.length ? def.schema : (entries[0] ? Object.keys(entries[0]) : []);
                const escape = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
                const rows = [schemaKeys.map(escape).join(",")];
                for (const e of entries) {
                    rows.push(schemaKeys.map(k => escape(e[k])).join(","));
                }
                text = rows.join("\n");
            } else if (format === "markdown") {
                const schemaKeys = def.schema.length ? def.schema : (entries[0] ? Object.keys(entries[0]) : []);
                const esc = (s: string) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
                const header = "| " + schemaKeys.join(" | ") + " |";
                const dashes = "| " + schemaKeys.map(() => "---").join(" | ") + " |";
                const rows = [header, dashes];
                for (const e of entries) {
                    rows.push("| " + schemaKeys.map(k => esc(e[k])).join(" | ") + " |");
                }
                text = rows.join("\n");
            }

            return { content: [{ type: "text", text }], details: {} };
        }
    });

    /* ── qmd_status ── */
    pi.registerTool({
        name: "qmd_status",
        label: "QMD Status",
        description: "Show qmd index state: collections, indexed documents, and pending embeddings.",
        promptSnippet: "qmd_status() — check what docs are indexed and whether embeddings are stale.",
        promptGuidelines: [
            "Call qmd_status before qmd_search to confirm documents are indexed.",
            "If the output shows many pending embeddings, run /qmd-index to rebuild.",
        ],
        parameters: Type.Object({}),
        async execute(_id, _params, _signal, _onUpdate, _ctx: ExtensionContext) {
            return new Promise<any>((resolve) => {
                child_process.execFile(
                    "qmd",
                    ["status"],
                    { maxBuffer: 10 * 1024 * 1024 },
                    (error, stdout, stderr) => {
                        if (error) {
                            resolve({ content: [{ type: "text", text: qmdInstructions() + "\n\n" + stderr }], details: {} });
                            return;
                        }
                        const msg = stdout + (stderr ? "\n" + stderr : "");
                        resolve({ content: [{ type: "text", text: msg }], details: {} });
                    }
                );
            });
        }
    });

    /* ── /qmd-index ── */
    pi.registerCommand("qmd-index", {
        description: "Re-index all qmd collections (full-text) and optionally run embeddings. Run after adding new documents.",
        handler: async (args, ctx: ExtensionContext) => {
            const qmdBin = "qmd";
            const embed = args.trim().toLowerCase() !== "--no-embed";

            const lines: string[] = [];

            // Run qmd update
            const update = child_process.spawnSync(qmdBin, ["update"], { encoding: "utf-8", cwd: ctx.cwd });
            if (update.error) {
                lines.push(`❌ qmd update failed: ${update.error.message}`);
                lines.push(qmdInstructions());
                ctx.ui.notify(lines.join("\n"), "error");
                return;
            }
            lines.push(`✅ qmd update:\n${update.stdout}${update.stderr ? "\n" + update.stderr : ""}`);

            if (embed) {
                const emb = child_process.spawnSync(qmdBin, ["embed"], { encoding: "utf-8", cwd: ctx.cwd });
                if (emb.error) {
                    lines.push(`❌ qmd embed failed: ${emb.error.message}`);
                } else {
                    lines.push(`✅ qmd embed:\n${emb.stdout}${emb.stderr ? "\n" + emb.stderr : ""}`);
                }
            } else {
                lines.push(`⏭️  Skipped embeddings (pass --no-embed to skip).`);
            }

            const msg = lines.join("\n\n");
            if (ctx.hasUI) ctx.ui.notify(msg, "info");
            return;
        }
    });

    /* ── /qmd-approve ── */
    pi.registerCommand("qmd-approve", {
        description: "Batch-review pending entries and migrate approved ones to their target ledger.",
        getArgumentCompletions: (prefix) => {
            const cfg = loadConfig(process.cwd());
            const names = Object.keys(cfg.ledgers).filter(n => n.startsWith(prefix));
            return names.map(n => ({ label: n, value: n, description: cfg.ledgers[n].path }));
        },
        handler: async (args, ctx: ExtensionContext) => {
            const cfg = loadConfig(ctx.cwd);
            const pending = cfg.ledgers["pending"];
            if (!pending || !fs.existsSync(pending.path)) {
                ctx.ui.notify("No pending ledger configured or empty.", "info");
                return;
            }

            const targetName = args.trim() || "master";
            const target = cfg.ledgers[targetName];
            if (!target) {
                ctx.ui.notify(`Unknown target ledger "${targetName}".`, "error");
                return;
            }

            const lines = fs.readFileSync(pending.path, "utf-8").split("\n").filter(Boolean);
            if (lines.length === 0) {
                ctx.ui.notify("No pending entries.", "info");
                return;
            }

            let approved = 0;
            const rejected: string[] = [];

            for (const line of lines) {
                const ok = await ctx.ui.confirm("Pending Entry", `${line}\n\nApprove migration to "${targetName}"?`);
                if (ok) {
                    ensureDir(target.path);
                    fs.appendFileSync(target.path, line + "\n");
                    approved++;
                } else {
                    rejected.push(line);
                }
            }

            fs.writeFileSync(pending.path, rejected.join("\n") + (rejected.length > 0 ? "\n" : ""));
            ctx.ui.notify(`Approved ${approved} → "${targetName}". Rejected ${rejected.length}.`, "info");
        }
    });

    /* ── before_agent_start: dynamic injectors ── */
    pi.on("before_agent_start", async (event, ctx: ExtensionContext) => {
        const cfg = loadConfig(ctx.cwd);
        let additions = "";

        for (const ij of cfg.injectors) {
            const regex = new RegExp(ij.regex, "i");
            const match = event.prompt.match(regex);
            if (!match) continue;

            const capture = match[ij.captureGroup ?? 1];
            const ledger = cfg.ledgers[ij.ledger];
            if (!ledger) continue;

            let entriesText = "";
            if (fs.existsSync(ledger.path)) {
                const lines = fs.readFileSync(ledger.path, "utf-8").split("\n").filter(Boolean);
                const hits: any[] = [];
                for (const line of lines) {
                    try {
                        const e = JSON.parse(line);
                        if (!ij.filterField || e[ij.filterField] === capture) hits.push(e);
                    } catch { /* ignore */ }
                }
                entriesText = JSON.stringify(hits, null, 2);
            }

            const artifactText = (ij.artifactPath && fs.existsSync(ij.artifactPath))
                ? fs.readFileSync(ij.artifactPath, "utf-8")
                : "";

            const tmpl = ij.template
                ?? `\n\n=== {{injector}} CONTEXT [capture={{capture}}] ===\nENTRIES:\n{{entries}}\nARTIFACT:\n{{artifact}}\n`;

            additions += tmpl
                .replace(/\{\{injector\}\}/g, ij.name)
                .replace(/\{\{capture\}\}/g, capture ?? "")
                .replace(/\{\{entries\}\}/g, entriesText || "(none)")
                .replace(/\{\{artifact\}\}/g, artifactText || "(none)");
        }

        if (additions) {
            return { systemPrompt: event.systemPrompt + additions };
        }
    });
}
