# Troubleshooting

Common issues and how to fix them.

## qmd binary not found

**Symptom:**

```
qmd binary "qmd" not found.
```

Seen in: `/qmd-validate`, `qmd_search`, `/qmd-init`

**Fix:**

1. Download a prebuilt binary for your platform from the [qmd releases page](https://github.com/your-org/qmd/releases).
2. Extract it to a folder on your PATH:
   ```bash
   # macOS / Linux
   mv qmd /usr/local/bin/
   # or
   mv qmd ~/.local/bin/
   ```
3. Or set the env var and restart pi:
   ```bash
   export QMD_BINARY=/path/to/qmd
   ```
4. Re-run `/qmd-validate`.

**Alternative:** Build from source with Rust:

```bash
cargo install qmd-cli
```

---

## Extension tools not showing up

**Symptom:** `qmd_search`, `query_ledger`, etc. are not in pi's tool list.

**Fix:**

1. Verify the extension is installed:

   ```
   /pi list
   ```

   Look for `pi-qmd-ledger`.

2. If missing, install:

   ```bash
   pi install npm:pi-qmd-ledger
   # or from git
   pi install git:github.com/kylebrodeur/pi-qmd-ledger
   ```

3. Restart pi after installing.

4. If installed locally, check `package.json`:
   ```json
   {
     "pi": {
       "extensions": ["./node_modules/pi-qmd-ledger/dist/index.js"]
     }
   }
   ```

---

## /qmd-init says "qmd not found"

**Symptom:** Running `/qmd-init` shows qmd install instructions instead of scaffolding files.

**Fix:**
`/qmd-init` checks for qmd before scaffolding. Install qmd first (see "qmd binary not found" above), then re-run `/qmd-init`.

---

## Config file not found

**Symptom:**

```
⚠️ No config file (checked pi-qmd-ledger.config.json, .pi/qmd-ledger.config.json).
```

**Fix:**
Run `/qmd-init` in your project root to scaffold the config and ledger files.

If you want a custom config location, set an env var:

```bash
export QMD_LEDGER_CONFIG=/custom/path/config.json
```

---

## Ledger files missing

**Symptom:**

```
Ledger "main" not found at ledger/main.jsonl. Run /qmd-init.
```

**Fix:**
Run `/qmd-init` in your project root. It creates the empty `.jsonl` files.

If you moved the config after scaffolding, the paths are relative to the config's directory. Update `pi-qmd-ledger.config.json` if you relocated files.

---

## Injector not matching my prompt

**Symptom:** Typing `draft chapter-1` does not inject ledger entries.

**Fix:**

1. Check your config's injector `regex`. Example:

   ```json
   "injectors": [
     { "name": "draft-context", "regex": "draft\\s+(\\S+)", ... }
   ]
   ```

   → This matches `draft chapter-1` and captures `chapter-1`.

2. Verify `filterField` matches a field in your entries. If `filterField: "tag"`, ensure entries have `tag: "chapter-1"`.

3. Use `/qmd-validate` to inspect injectors and confirm the ledger exists.

---

## Duplicate detected in autopilot mode

**Symptom:** `append_ledger` with `mode: "autopilot"` returns "Duplicate detected".

**Fix:**

- The ledger has a `dedupField` (e.g., `fact`). Change the value for that field, or use `mode: "gated"` / `mode: "strict"` instead.
- To bypass dedup temporarily, use `configure_ledger` to remove `dedupField` from the ledger config.

---

## Export file is empty

**Symptom:** `ledger_export` returns an empty CSV or Markdown table.

**Fix:**

- Ensure the ledger file has entries. Run `query_ledger(filters={})` to confirm.
- If using `csv` or `markdown` format, the schema fields must exist in the config. `describe_ledger` shows the schema.

---

## Skills not loading

**Symptom:** pi does not show the `qmd-ledger` skill in `/skill:` commands.

**Fix:**

1. Verify the extension's `resources_discover` event fired. Check pi's startup output for extension load messages.
2. Ensure `skills/qmd-ledger/SKILL.md` exists in the extension directory.
3. The skill name must match the parent directory: `qmd-ledger`.
4. Manually force-load with `/skill:qmd-ledger`.

---

## qmd_search returns no results

**Symptom:** `qmd_search(query="...")` returns empty output even though documents exist.

**Fix:**

1. Check if documents are indexed: `qmd_status`
2. If pending embeddings are high, run `/qmd-index` to rebuild.
3. If no collections exist, add one:
   ```bash
   qmd collection add ./docs --name my-docs
   /qmd-index
   ```
4. Try searching with a broader query or higher limit.

---

## Pending queue has entries but /qmd-approve doesn't run

**Symptom:** `/qmd-approve` says "No pending entries" but `query_ledger(ledger="pending")` shows data.

**Fix:**

1. The pending ledger path may have changed after config edits. Check `ledger_stats` for the pending ledger path.
2. If the file exists but is empty (only newlines), delete it and let gated mode recreate it:
   ```bash
   rm ledger/pending.jsonl
   ```
3. Run `/qmd-validate` to confirm paths.

---

## Still stuck?

Open an issue at https://github.com/kylebrodeur/pi-qmd-ledger/issues with:

- pi version (`pi --version`)
- Node version (`node -v`)
- `pi-qmd-ledger` version
- Output from `/qmd-validate`
- Your `pi-qmd-ledger.config.json` (redact sensitive data)
