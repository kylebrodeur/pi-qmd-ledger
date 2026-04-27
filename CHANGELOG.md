# Changelog

All notable changes to this project follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.2] — 2026-04-26

### Fixed

- Fixed configuration merge bug where project-level ledger/injector definitions were replacing defaults instead of augmenting them. This prevents accidental loss of critical ledgers like `context_events`.

### Added

- New `/qmd-audit` command to detect and repair missing default ledgers and injectors in project configuration.

## [0.4.0] — 2026-04-26

### Added

- **Interactive Configuration Wizards**: Added `/qmd-ledger-create` and `/qmd-injector-create` commands that guide users through creating new ledgers and injectors directly in the TUI without editing JSON files.
- **Settings Dashboard**: Added `/qmd-settings` interactive menu to manage ledgers, injectors, and extension integrations visually.

## [0.3.2] — 2026-04-26

### Fixed

- Explicitly commit and bundle modified `src/index.ts` and `SKILL.md` files that were missed in the `0.3.1` release (git sync fix).

## [0.3.1] — 2026-04-26

### Fixed

- Changed Active Ledger Selection shortcut from `ctrl+l` to `ctrl+alt+l` to fix a conflict with the built-in Model Selector shortcut.

## [0.3.0] — 2026-04-26

### Added

- **Active Ledger Selection UX**: Added a session-level state manager for the active ledger, defaulting to the first available ledger.
- **TUI Widget**: Added a persistent UI widget above the editor input to display the currently active ledger.
- **Command & Shortcut**: Added `/qmd-ledger-select` command (bound to `ctrl+alt+l`) that opens a TUI `SelectList` to interactively switch the active ledger.
- **Agent Guidelines**: Updated the `append_ledger` tool guidelines and `before_agent_start` context injection so the LLM automatically knows and uses the active ledger as the default target.

## [0.2.2] — 2026-04-25

### Changed

- Renamed default ledger key from `master` to `main` across source code, templates, documentation, and test docs. The word `master` is no longer used as a ledger identifier anywhere in the project.

## [0.2.1] — 2026-04-25

### Added

- pi-context integration now reports its actions: captures event counts, tag injection counts, and clear enable/disable status messages.

### Fixed

- Extension review fixes: SKILL.md YAML frontmatter, remove stale tarballs, replace `@sinclair/typebox` with `typebox` devDependency, pin peerDependency, forward AbortSignal to child processes, fix `/qmd-init` return shape.

## [0.2.4] — 2026-04-25

### Added

- LLM prompt guidelines now explicitly teach the agent to auto-append facts when the user says "Remember: [fact]" or "Record this decision: [fact]".
- `/qmd-init` now prints a helpful tip about using the "Remember:" trigger.
- `/qmd-init` now automatically prompts the user to enable `pi-context` integration if the tools are detected during scaffolding.

## [0.2.3] — 2026-04-25

### Fixed

- pi-context enable toggle now accepts aliases (on/true/yes/1, off/false/no/0) and shows current status when run without arguments.
- getPiContextConfig now merges stored values over full defaults, preventing silent event-handler exits when the config only contains `{ enabled: true }`.
- /qmd-enable-pi-context writes the complete pi-context config object (not partial) and confirms persistence after writing.

## [0.2.2] — 2026-04-25

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
