# Tool Reference

## qmd_search

**Label:** QMD Search  
**Description:** Perform a fuzzy semantic search using qmd across raw docs.

**Parameters:**
```json
{
  "query": "string",
  "limit": "number?"
}
```

**Returns:** `{ content: [{ type: "text", text: "..." }], details: {} }`

**Behavior:**
- Calls `qmd search <query> --limit <limit>`.
- If qmd is not found, returns a clear error message asking the user to install it.
- `limit` defaults to `qmd.defaultLimit` from config.

---

## qmd_status

**Label:** QMD Status  
**Description:** Show qmd index state: collections, indexed documents, and pending embeddings.

**Parameters:** None.

**Returns:** Text output from `qmd status`.

**Behavior:**
- Reports total files indexed per collection, database size, and pending embeddings.
- If qmd binary is missing, returns install instructions.

**Use before `/qmd-index`** to see if embeddings are stale.

---

## query_ledger

**Label:** Query Ledger  
**Description:** Search a named JSONL ledger deterministically.

**Parameters:**
```json
{
  "ledger": "string",
  "query": "string?",
  "filters": "Record<string, string>?"
}
```

**Returns:** `{ content: [{ type: "text", text: "JSON array" }], details: {} }`

**Behavior:**
- Unknown ledger → returns error listing available ledgers.
- Missing file → prompts user to run `/qmd-init`.
- Text search: concatenates all text fields in the schema and searches for substring.
- Filters: exact string match per field.
- Both `query` and `filters` are ANDed together.

---

## append_ledger

**Label:** Append Ledger  
**Description:** Append an entry to a named ledger.

**Parameters:**
```json
{
  "ledger": "string",
  "mode": "strict | gated | autopilot",
  "entry": "Record<string, string>"
}
```

**Returns:** Confirmation or error message.

**Modes:**
| Mode | Behavior |
|---|---|
| `strict` | UI confirmation dialog before append. Denied → rejection message. |
| `gated` | Appends to the `pending` ledger. Human reviews via `/qmd-approve`. |
| `autopilot` | Appends immediately if `dedupField` is unset or no duplicate found. |

---

## configure_ledger

**Label:** Configure Ledger  
**Description:** Read or update config at runtime.

**Parameters:**
```json
{
  "action": "read | update",
  "config": "any?"
}
```

**Returns:** Current config as JSON text.

**Behavior:**
- `read` → returns merged config (file + env + defaults).
- `update` → deep-merges `config` into existing file config and writes it back.
- Creates file if it does not exist.

---

## describe_ledger

**Label:** Describe Ledger  
**Description:** Introspect a named ledger to discover its schema, size, and sample entries.

**Parameters:**
```json
{
  "ledger": "string"
}
```

**Returns:** Formatted report with:
- Schema field list
- Total entry count
- Malformed line count (if any)
- First and most recent entry

**Use this before calling `append_ledger`** when you don't know the expected schema keys.

---

## ledger_stats

**Label:** Ledger Stats  
**Description:** Dashboard of all ledgers: counts, sizes, qmd version, and config path.

**Parameters:** None.

**Returns:** formatted multi-line text report.

**Fields per ledger:**
| Field | Description |
|---|---|
| `Entries` | Valid JSON entries |
| `Size` | File size in bytes |
| `Malformed lines` | Lines that failed JSON.parse |
| `DedupField` | Duplicate-check field (if set) |

---

## ledger_export

**Label:** Ledger Export  
**Description:** Export a named ledger to a portable format.

**Parameters:**
```json
{
  "ledger": "string",
  "format": "json | csv | markdown"   // default: "json"
}
```

**Returns:** Exported text in the requested format.

**Formats:**
| Format | Output |
|---|---|
| `json` | JSON array of all entries, 2-space indent |
| `csv` | Header row using `schema` keys, quoted strings |
| `markdown` | Markdown table with `schema` as column headers |
