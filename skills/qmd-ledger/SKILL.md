---
name: qmd-ledger
description: Universal append-only JSONL ledger with qmd semantic search and tiered HITL (strict, gated, autopilot). Use when tracking structured facts, decisions, requirements, research, or any append-only record across projects. Supports dynamic context injection into prompts. Install the pi-qmd-ledger extension first.
---

# QMD Ledger

Universal append-only JSONL ledger with hybrid semantic search (qmd) and dynamic context injection.

## When to use this skill

- Tracking research findings or verified facts with citations
- Building a decision log with rationale and traceability
- Maintaining a requirements registry
- Recording experiment outcomes or A/B test results
- Any domain where you need append-only structured records with HITL review

## Prerequisites

1. **qmd binary** must be on PATH. Quick options:
   ```bash
   # Prebuilt binary (fastest)
   # Download from the qmd releases page for your platform
   # and place the binary in /usr/local/bin or ~/bin

   # Or build from source (requires Rust)
   cargo install qmd-cli
   ```
2. **pi-qmd-ledger extension** must be installed via pi:
   ```bash
   pi install npm:pi-qmd-ledger
   # or try without installing
   pi -e npm:pi-qmd-ledger
   ```

## Quick Start

Run `/qmd-init` in your project root. This scaffolds:

```
pi-qmd-ledger.config.json   ← config
ledger/
  master.jsonl               ← main ledger
  pending.jsonl              ← pending review queue
```

Adapt the config to your domain, then run `/qmd-validate`.

## Configuration

Edit `pi-qmd-ledger.config.json`. Top-level keys:

- `version` — must be `2`
- `ledgers` — named ledger definitions
- `injectors` — regex triggers for auto-injecting context
- `qmd` — qmd binary settings

### Ledger definition

```json
"master": {
  "path": "ledger/master.jsonl",
  "schema": ["id", "domain", "source", "fact", "tag", "artifact"],
  "dedupField": "fact"
}
```

| Key | Description |
|---|---|
| `path` | File path (relative to cwd) |
| `schema` | Ordered field names, or `"master"` to inherit from another ledger |
| `dedupField` | Field checked for duplicates in autopilot mode |

### Injector definition

```json
{
  "name": "draft-context",
  "regex": "draft\\s+(\\S+)",
  "captureGroup": 1,
  "ledger": "master",
  "filterField": "tag",
  "artifactPath": "ledger/artifact.md",
  "template": "\\n\\n=== {{injector}} [{{capture}}] ===\\n{{entries}}\\n{{artifact}}\\n"
}
```

| Key | Required | Description |
|---|---|---|
| `name` | yes | Injector identifier |
| `regex` | yes | Pattern applied to the user prompt |
| `captureGroup` | no | Which capture group to use (default 1) |
| `ledger` | yes | Which ledger to query |
| `filterField` | no | Inject all entries where this field equals the capture |
| `artifactPath` | no | Optional extra file to inject after entries |
| `template` | no | Custom mustache-like template string |

## Tools

### qmd_search
Fuzzy semantic search across raw docs using the qmd engine.

**Parameters:**
- `query` (string) — search text
- `limit` (number, optional) — max results (default from config)

### qmd_status
Show qmd index state: collections, indexed document counts, and pending embeddings.

Takes no parameters. Returns the output of `qmd status` as text.

### query_ledger
Deterministic JSONL search by ledger name.

**Parameters:**
- `ledger` (string) — ledger name
- `query` (string, optional) — free-text search across all text schema fields
- `filters` (object, optional) — exact `{field: value}` matches

### append_ledger
Append an entry to a named ledger.

**Parameters:**
- `ledger` (string) — target ledger
- `mode` ("strict" | "gated" | "autopilot") — HITL mode
- `entry` (object) — keys matching the ledger schema

### configure_ledger
Read or update extension config at runtime.

**Parameters:**
- `action` ("read" | "update")
- `config` (object, optional for update)

### describe_ledger
Introspect a named ledger: returns schema, total entry count, and sample first/last entries.

**Parameters:**
- `ledger` (string) — ledger name

### ledger_stats
Dashboard with entry counts, pending queue size, config path, and qmd version for all ledgers.

Takes no parameters. Returns a formatted text report.

### ledger_export
Export a ledger to JSON array, CSV, or Markdown table.

**Parameters:**
- `ledger` (string) — ledger name
- `format` ("json" | "csv" | "markdown") — default is "json"

## Commands

- `/qmd-init` — scaffold config + empty ledgers + artifact template
- `/qmd-validate` — health check: qmd binary, config, all ledger paths, injectors
- `/qmd-index [--no-embed]` — re-index all collections (BM25 full-text + embeddings)
- `/qmd-approve [target]` — batch-review pending entries. Default target is `master`

## Workflow

### 1. Scaffold and index
```
/qmd-init
/qmd-validate
qmd_status
```

If qmd has no collections, add one:
```bash
qmd collection add ./docs --name my-docs
```

Then build the index:
```
/qmd-index
```

### 2. Capture facts
```
append_ledger(
  ledger="master",
  mode="gated",
  entry={
    "id": "REQ-042",
    "domain": "auth",
    "source": "stakeholder-interview-v3",
    "fact": "Users must authenticate via SSO only",
    "tag": "login",
    "artifact": "specs/auth.md"
  }
)
```

### 3. Approve pending queue
```
/qmd-approve master
```

### 4. Pre-fetch in prompts
If your config has `{ "regex": "draft\\s+(\\S+)", "ledger": "master", "filterField": "tag" }`, typing `draft login` will automatically inject all entries where `tag === "login"`.

## Patterns

### Adding a new domain
1. Add a new ledger in config.
2. Add an injector that triggers on domain keywords.
3. Append entries with the new ledger name.

### Schema evolution
1. Use `configure_ledger(action="update", config={...})` to change schema.
2. Old entries remain valid; queries ignore missing fields gracefully.

### Custom template for injection
Provide a `template` in the injector. Placeholders:
- `{{injector}}` — injector name
- `{{capture}}` — captured regex group
- `{{entries}}` — JSON array of matching entries
- `{{artifact}}` — contents of artifactPath (if any)

## Troubleshooting

| Problem | Solution |
|---|---|
| `qmd binary not found` | Install qmd or set `qmd.binary` in config. |
| `Unknown ledger` | Run `/qmd-validate` to see configured ledgers. |
| `Duplicate detected` | Change `dedupField` or provide a unique value for that field. |
| Injector not firing | Test regex against prompt. Ensure `captureGroup` index is correct. |
| Skills not in system prompt | Verify extension `resources_discover` fired. Check `.pi/skills/` discovery. |
