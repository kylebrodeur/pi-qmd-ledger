# pi-qmd-ledger

[![npm version](https://img.shields.io/npm/v/pi-qmd-ledger)](https://www.npmjs.com/package/pi-qmd-ledger)
[![license](https://img.shields.io/npm/l/pi-qmd-ledger)](LICENSE)
[![pi-extension](https://img.shields.io/badge/pi-extension-blue)](https://github.com/mariozechner/pi)

Universal append-only JSONL ledger with hybrid semantic search (qmd) and dynamic context injection for [pi](https://github.com/mariozechner/pi).

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

### Prerequisites

- **qmd** binary on PATH (prebuilt or via `cargo install qmd-cli`)
- **Node.js** 18+

### 1. Install with pi

```bash
pi install npm:pi-qmd-ledger              # latest
pi install npm:pi-qmd-ledger@0.1.3       # pinned
pi -e npm:pi-qmd-ledger                  # try without installing
```

Or from git (SSH):

```bash
pi install git:git@github.com:kylebrodeur/pi-qmd-ledger
pi install git:git@github.com:kylebrodeur/pi-qmd-ledger@v0.1.1
```

### 2. Verify the install

```
/pi list
/qmd-validate
```

You should see `pi-qmd-ledger` in the package list and a green health check for qmd, config, and ledgers.

### 3. Scaffold your ledger

Inside any project:

```
/qmd-init
/qmd-validate
```

This creates `pi-qmd-ledger.config.json` and empty ledger files.

### 4. Index your documents

Before `qmd_search` works, you need to build the search index:

```bash
# Add a collection (run from the directory containing your .md files)
qmd collection add ./docs --name my-docs

# Build the full-text (BM25) and vector indexes
/qmd-index

# Check status
qmd_status
```

### 5. Adapt the config

Edit `pi-qmd-ledger.config.json` to match your domain. See [Config Reference](skills/qmd-ledger/references/config-reference.md).

### Install from npm (classic)

If you are not using pi's package manager:

```bash
npm install pi-qmd-ledger
# or
pnpm add pi-qmd-ledger
# or
yarn add pi-qmd-ledger
```

Then register in your project's `package.json`:

```json
{
  "pi": {
    "extensions": ["./node_modules/pi-qmd-ledger/dist/index.js"]
  }
}
```

### Installing from source

```bash
git clone https://github.com/kylebrodeur/pi-qmd-ledger.git
cd pi-qmd-ledger
pnpm install && pnpm build
```

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
| `qmd_status` | Show qmd collections, indexed docs, and embedding state |
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
| `/qmd-index [--no-embed]` | Re-index all collections (BM25 + embeddings) |
| `/qmd-approve [target]` | Batch-review pending entries |

## Documentation

| Doc | Description |
|---|---|
| [Skill](skills/qmd-ledger/SKILL.md) | What pi auto-loads about this extension |
| [Config Reference](skills/qmd-ledger/references/config-reference.md) | Full config schema, env overrides, resolution order |
| [Tool Reference](skills/qmd-ledger/references/tool-reference.md) | All 7 tools: parameters, behavior, return types |
| [Troubleshooting](TROUBLESHOOTING.md) | Common issues and fixes |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, testing, and commit conventions.

## License

MIT — see [LICENSE](LICENSE) (or package.json).
