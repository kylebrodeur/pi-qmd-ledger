# Changelog

All notable changes to this project follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.1] — 2026-04-25

### Added

- pi-context integration now reports its actions: captures event counts, tag injection counts, and clear enable/disable status messages.

### Fixed

- Extension review fixes: SKILL.md YAML frontmatter, remove stale tarballs, replace `@sinclair/typebox` with `typebox` devDependency, pin peerDependency, forward AbortSignal to child processes, fix `/qmd-init` return shape.

## [0.2.0] — 2026-04-23

### Added

- Extension compatibility framework with pi-context integration.
- New `context_events` ledger for capturing pi-context lifecycle events automatically.
- New commands for extension management: `/qmd-list-extensions`, `/qmd-extension-status`, `/qmd-enable-pi-context`.

### Fixed

- Removed incorrect use of `(ctx as any).toolMap` and `ctx.toolCall` which do not exist on `ExtensionContext`; replaced with `pi.getAllTools()` and inline ledger append logic.
- Changed `ctx.ui.editor` calls in command handlers to `ctx.ui.notify` for read-only output display.

## [0.1.4] — 2026-04-22

### Added

- Comprehensive test plan (`TESTING.md`) for agent, human, and HITL personas.
- New troubleshooting steps in `TROUBLESHOOTING.md` for empty search results and pending queue path mismatches.

## [0.1.3] — 2026-04-22

### Added

- Added `promptSnippet` and `promptGuidelines` to all 8 tools for vastly improved LLM agent discoverability and usage instructions.
- Added `getArgumentCompletions` to `/qmd-approve` command for ledger name auto-completion.

### Fixed

- Fixed stale error messages referencing the old `/init_ledger` command (now `/qmd-init`).

## [0.1.2] — 2026-04-22

### Added

- New tool `qmd_status` to show index collections, indexed docs, and pending embeddings.
- New command `/qmd-index` to run `qmd update` (BM25) and `qmd embed` (vectors).

## [0.1.1] — 2026-04-22

### Changed

- qmd setup: prebuilt binary is now the recommended install path; `cargo install qmd-cli` moved to fallback
- `/qmd-validate`, `/qmd-init`, and `qmd_search` now show platform-aware qmd install instructions when the binary is missing

## [0.1.0] — 2026-04-22

### Added

- Universal configurable JSONL ledger system with user-defined schemas
- 7 tools:
  - `qmd_search` — fuzzy semantic search via qmd binary
  - `query_ledger` — deterministic JSONL search with text + filter queries
  - `append_ledger` — HITL append (strict / gated / autopilot) with dedup
  - `configure_ledger` — read / write config at runtime
  - `describe_ledger` — introspect schema, counts, sample entries
  - `ledger_stats` — dashboard of all ledgers + qmd health
  - `ledger_export` — export to JSON, CSV, or Markdown
- 3 commands:
  - `/qmd-init` — scaffold config, ledgers, and artifact templates
  - `/qmd-validate` — health check qmd, config, and all ledger paths
  - `/qmd-approve [target]` — batch-review pending entries
- 2 events:
  - `resources_discover` — auto-expose skills directory to pi
  - `before_agent_start` — dynamic injector system for context injection
- Config v2 with `ledgers`, `injectors`, and `qmd` sections
- Schema inheritance (ledger schema can reference another ledger by name)
- `dedupField` per ledger for autopilot duplicate prevention
- Domain-agnostic architecture — works for research, decisions, requirements, etc.
- 3 example domain configs: research, decisions, requirements
- Agent Skills standard skill at `skills/qmd-ledger/SKILL.md`
- Scaffold templates for config, ledgers, and artifacts
- Full reference docs for config and tools
- Comprehensive test suite with mock pi ExtensionAPI

[0.2.0]: https://github.com/kylebrodeur/pi-qmd-ledger/releases/tag/v0.2.0
[0.1.0]: https://github.com/kylebrodeur/pi-qmd-ledger/releases/tag/v0.1.0
