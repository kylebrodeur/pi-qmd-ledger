# pi-qmd-ledger Project Dashboard & TODO

> This is the primary hub for pi-qmd-ledger development status, key knowledge, and actionable items. Check here first for any questions about setup, usage, or contributing.

---

## 📦 What It Is

`pi-qmd-ledger` is a universal JSONL ledger extension for Pi coding agents. It provides:

- **Append-only event sourcing** for facts, decisions, notes, or records
- **Flexible schema** defined per ledger in configuration
- **Hybrid search** through qmd (BM25 + semantic embeddings)
- **Tiered human-in-the-loop**: strict (confirm), gated (queue), autopilot (auto + dedup)
- **Dynamic context** injection via regex-triggered patterns

---

## 🏗️ Project Structure

```
pi-qmd-ledger/
├── dist/                # Compiled JS (gitignored)
├── skills/              # Agent skills (pi auto-discovers these)
│   └── qmd-ledger/SKILL.md
├── templates/           # Config/ledger scaffolds
│   ├── config.json
│   └── UCL_LEDGER.jsonl
├── topics/              # Extension integration docs
│   └── EXTENSIONS.md
├── index.ts             # Extension entrypoint
├── test/                # Node built-in test runner stub
│   └── index.test.ts
├── .github/             # Issue/PR templates and CI
├── .pi/                 # Local Pi agent config
├── CHANGELOG.md
├── README.md
└── TODO.md
```

---

## 🚀 Quick Setup & Usage

### For Pi Agents (Automatic)

1. Install via `pi package install pi-qmd-ledger` (when published)
2. Edit `.pi/qmd-ledger.config.json` in your project root
3. Run `/qmd-validate` to verify installation
4. Run `/qmd-init` to scaffold default ledgers

### For Developers

```bash
# Install dependencies
pnpm install

# Development commands
pnpm build     # Compile TypeScript to dist/
pnpm typecheck # typecheck only (no emit)
pnpm lint      # ESLint (JS files only, TS needs parser setup)
pnpm test      # Run all tests against dist/test/index.test.js
pnpm prettier  # Format all files

# Test a specific ledger entry manually
pnpm exec node -e 'console.log(JSON.parse(require("fs").readFileSync("ledger/master.jsonl").split("\n")[0]))'
```

### Configuration

```json
// .pi/qmd-ledger.config.json (or pi-qmd-ledger.config.json)
{
  "version": 2,
  "ledgers": {
    "master": {
      "path": "ledger/master.jsonl",
      "schema": ["id", "domain", "source", "fact", "tag", "artifact"],
      "dedupField": "fact"
    },
    "pending": {
      "path": "ledger/pending.jsonl",
      "schema": "master"
    }
  },
  "injectors": [
    {
      "name": "draft-context",
      "regex": "draft\\s+(\\S+)",
      "ledger": "master",
      "filterField": "tag"
    }
  ],
  "qmd": {
    "binary": "qmd",
    "defaultLimit": 5,
    "maxBuffer": 10485760
  }
}
```

---

## 🛠️ Tools & Commands

### Commands

| Command | Description |
|---------|-------------|
| `/qmd-validate` | Verify qmd binary, config, and ledger paths |
| `/qmd-init` | Scaffold config, ledgers, and artifact templates |
| `/qmd-index` | Re-index qmd collections (optionally add embeddings) |
| `/qmd-approve` | Review pending entries and migrate to target ledger |

### Tools

| Tool | Purpose |
|------|---------|
| `qmd_search` | Fuzzy semantic search across indexed docs |
| `query_ledger` | Exact ledger search with filters |
| `append_ledger` | Add entries to ledgers (autopilot/gated/strict modes) |
| `describe_ledger` | Get ledger schema, counts, and sample entries |
| `ledger_stats` | Dashboard of all ledgers: counts, sizes, health |
| `ledger_export` | Export to JSON, CSV, or Markdown |
| `configure_ledger` | Read/update config at runtime |
| `qmd_status` | Show indexing and embedding status |

---

## 🧪 Testing & CI

### Running All Tests

```bash
pnpm test
```

Expected output: 1 passing stub test.

> ⚠️ Legacy full test suite was removed from version control. The next priority is restoring comprehensive tests (see `## 📋 Upcoming`).

---

## 📚 Key Learnings & Conventions

### Developer Conventions

1. **Naming**: Use `qmd-*` prefix for commands to avoid collisions
2. **Tool Registration**: Always include `promptSnippet` and `promptGuidelines`
3. **Error Handling**: Gracefully handle missing dependencies with clear instructions
4. **Parameters**: Name after purpose, use `any` when needed for flexibility
5. **Async Execution**: Wrap file operations in `Promise` with `child_process.execFile`
6. **Context Usage**: Use `ExtensionContext` for cwd and UI interactions
7. **Schema Definition**: Use `Type.Object` and `Type.Record` from `@sinclair/typebox`
8. **Configuration**: Load config lazily and support environment variable overrides
9. **Testing Strategy**: Mock API with temp directories to ensure isolation

### Pi Package Conventions

1. **Skills Location**: Place skills in `skills/<name>/SKILL.md`
2. **Package Structure**: Use `scripts/build`, `scripts/test`, `scripts/typecheck`
3. **Dependencies**: Put Pi SDK in `peerDependencies` to avoid bundling
4. **Manifest**: Define `pi.extensions` and `pi.skills` in `package.json`

---

## 📈 Current Status

### ✅ Completed

- Event sourcing ledger system with flexible schemas
- qmd integration with fallback instructions
- Human-in-the-loop tiers (strict/gated/autopilot)
- Dynamic context injection via regex patterns
- Prettier, ESLint, and typecheck configuration
- Developer documentation and learnings
- Architecture visualization for context injection flow
- Extension compatibility framework with pi-context integration
- pi-context event indexing and 'context_events' ledger
- **GitHub repo readiness**: Templates, CI workflow, updated README/CHANGELOG
- **Build/test alignment**: ESM compilation, stub test suite, `__dirname` polyfill
- **SDK compatibility review**: Removed fake `ctx.toolCall` / `(ctx as any).toolMap`, switched to `pi.getAllTools()`

### 🔄 In Progress

- [ ] Fully implement `enhanceInjectors` for pi-context integration

### 📋 Upcoming

**Publishing**
- [ ] Run npm publish dry-run: `pnpm publish --dry-run`
- [ ] Ensure `files` array in `package.json` is correct
- [ ] Verify no secrets in tarball (`npm pack --dry-run`)
- [ ] Publish `v0.2.0` to npm: `pnpm publish --access public`
- [ ] Tag release on GitHub from latest main

**Testing**
- [ ] Restore full test suite (config CRUD, ledger append/query, dedup, injectors)
- [ ] Add integration test using mock ExtensionAPI
- [ ] Add test for pi-context event capture path
- [ ] Run manual HITL test plan from TESTING.md

**Code Quality**
- [ ] Migrate from `@sinclair/typebox` to `typebox` 1.x for pi-coding-agent >=0.69.0
- [ ] Add TypeScript parser to ESLint for `.ts` linting
- [ ] Enable `strict: true` in `tsconfig.json`
- [ ] Reduce `any` usage in index.ts

**Features**
- [ ] Fully implement `enhanceInjectors` for pi-context integration
- [ ] Add advanced qmd configuration (custom embeddings, custom models)
- [ ] Add ledger migration tools for schema changes
- [ ] Add pagination (`limit`/`offset`) to `query_ledger`

---

## 🗂️ Files

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Version history and release notes |
| `README.md` | User-facing overview and quick start |
| `TESTING.md` | Detailed testing documentation |
| `TROUBLESHOOTING.md` | Common issues and resolutions |
| `PUBLISHING.md` | npm publishing checklist |
| `FUTURE_WORK.md` | Long-term roadmap and experiments |

---

## 🔧 Maintenance Tasks

### Version Management

- **Current Version**: 0.2.0
- **Versioning Scheme**: Semantic Versioning (MAJOR.MINOR.PATCH)
- **Next Version**: 0.2.1 (for next minor bug fix or small enhancement)

### npm Publishing Checklist

- [ ] Update `version` in `package.json`
- [ ] Add release notes to `CHANGELOG.md`
- [ ] Tag release in Git: `git tag vX.Y.Z && git push origin --tags`
- [ ] Run `pnpm publish` (or `npm publish` with .npmrc)

---

## 📞 Need Help?

1. Check this TODO.md first for setup and conventions
2. Review the relevant skill file in `skills/qmd-ledger/SKILL.md`
3. Run `/qmd-validate` to identify configuration issues
4. Review `TROUBLESHOOTING.md` for common errors

---

*Last updated: 2026-04-24*
