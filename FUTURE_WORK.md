# Future Work & Ideas

This document captures ideas, potential features, and improvements to explore in future sessions.

## Tool & Command Enhancements

1. **Pagination for `query_ledger`:**
   - As ledgers grow large, returning the entire dataset might bloat the LLM context. Introduce `limit` and `offset` parameters.
2. **Interactive TUI Rendering (`renderCall` / `renderResult`):**
   - Leverage Pi's CustomMessage and rendering capabilities to display ledger entries as rich tables or cards directly in the terminal UI, rather than dumping raw JSON strings.
3. **Advanced Deduping:**
   - Expand the `dedupField` logic in `autopilot` mode to use fuzzy matching or semantic similarity via `qmd` rather than strict exact string matches.

## QMD & Indexing Integration

1. **Background Auto-indexing:**
   - Implement a watcher or a background task that automatically runs `qmd update` when files in configured collection directories change.
2. **LLM Schema Generation / Discovery (`discover_schema`):**
   - A tool that reads an existing un-configured `.jsonl` file, infers the schema, and automatically updates `pi-qmd-ledger.config.json` to map to it.

## Ledger Management

1. **Redaction / Tombstoning:**
   - While the ledger is strictly append-only by philosophy, real-world usage sometimes requires removing sensitive data (API keys accidentally pasted, etc.). Investigate a `tombstone_entry` tool that marks lines as deleted without breaking the append-only log format.
2. **Ledger Migrations:**
   - A command like `/qmd-migrate` to transform entries from an old schema to a new schema when configuration changes.

## Documentation & DX

1. **Gallery Preview Assets:**
   - Create a short `.mp4` video or `.png` screenshot demonstrating the workflow to add to `package.json` (`pi.video` / `pi.image`) for the Pi package marketplace.
