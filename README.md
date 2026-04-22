# pi-qmd-ledger

Universal append-only JSONL ledger with hybrid semantic search (qmd) and dynamic context injection for [pi](https://github.com/mariozechner/pi).

[![pi-extension](https://img.shields.io/badge/pi-extension-blue)](https://github.com/mariozechner/pi)

## Features

- **Universal** — user-defined schema per ledger. Works for research, decisions, requirements, experiments, docs-anything.
- **Append-only** — immutable history with configurable dedup.
- **Tiered HITL** — strict (confirm each), gated (queue for review), autopilot (auto-append).
- **Semantic search** — fuzzy retrieval via qmd across raw documents.
- **Context injection** — regex triggers auto-inject ledger entries into prompts.
- **Self-adapting** — runtime config changes, schema evolution, multiple named ledgers.

## Architecture

```
┌─────────────────────────────────────────┐
│  User prompt                             │
│  e.g. "draft login"                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Injector regex match                    │
│  → matches "draft\s+(\S+)"              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  query master.jsonl where tag="login"   │
│  + inject artifact.md                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Appended to system prompt               │
│  → LLM now has pre-fetched context       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Install qmd

```bash
cargo install qmd-cli
# or download a release
```

### 2. Install the extension

```bash
git clone <this-repo>
cd pi-qmd-ledger
pnpm install && pnpm build
```

### 3. Register as a pi extension

In your project's `package.json`:

```json
{
  "pi": {
    "extensions": ["/path/to/pi-qmd-ledger/dist/index.js"]
  }
}
```

Or in pi config. Then restart pi.

### 4. Scaffold your ledger

Inside any project you want to use the ledger:

```
/qmd-init
/qmd-validate
```

This creates `pi-qmd-ledger.config.json` and empty ledger files.

### 5. Adapt the config

Edit `pi-qmd-ledger.config.json` to match your domain. See [skills/qmd-ledger/references/config-reference.md](skills/qmd-ledger/references/config-reference.md).

## Example domains

### Research project

```json
{
  "ledgers": {
    "findings": {
      "path": "research/findings.jsonl",
      "schema": ["id", "paper", "claim", "evidence", "confidence", "tag"],
      "dedupField": "claim"
    }
  },
  "injectors": [
    {
      "name": "lit-review",
      "regex": "review\\s+(\\S+)",
      "ledger": "findings",
      "filterField": "tag",
      "artifactPath": "research/synthesis.md"
    }
  ]
}
```

### Decision log

```json
{
  "ledgers": {
    "decisions": {
      "path": "decisions/log.jsonl",
      "schema": ["id", "date", "context", "decision", "rationale", "status", "owner"],
      "dedupField": "decision"
    }
  },
  "injectors": [
    {
      "name": "decide",
      "regex": "decide\\s+(\\S+)",
      "ledger": "decisions",
      "filterField": "context"
    }
  ]
}
```

## Tools

| Tool | Purpose |
|---|---|
| `qmd_search` | Fuzzy semantic search via qmd |
| `query_ledger` | Deterministic JSONL search by ledger name |
| `append_ledger` | Append with strict/gated/autopilot modes |
| `configure_ledger` | Read or update config at runtime |
| `describe_ledger` | Introspect schema, count, and sample entries |
| `ledger_stats` | Dashboard: counts, sizes, qmd version |
| `ledger_export` | Export to JSON, CSV, or Markdown |

## Commands

| Command | Purpose |
|---|---|
| `/qmd-init` | Scaffold config + ledgers + artifact templates |
| `/qmd-validate` | Health check everything |
| `/qmd-approve [target]` | Batch-review pending entries |

## Documentation

- [Skill documentation](skills/qmd-ledger/SKILL.md) — what pi sees about this extension
- [Config reference](skills/qmd-ledger/references/config-reference.md) — full config schema
- [Tool reference](skills/qmd-ledger/references/tool-reference.md) — parameters and behavior

## Contributing

This extension is open-source. PRs welcome for new example configs, additional reference docs, and bug fixes.
