# Config Reference

## Complete config schema

```json
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
      "name": "default",
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

## Ledgers

### path

Relative to project cwd. Absolute paths accepted. Parent directories created on first write.

### schema

Array of field names defining the JSON keys. Or a string referencing another ledger name to inherit its schema.

### dedupField

Optional. In `autopilot` mode, compares this field across existing entries. If a match is found, append is rejected.

## Injectors

### regex

A JavaScript-compatible regex pattern. Must include at least one capture group if `filterField` is used.

### captureGroup

Default `1`. Which `match[index]` to use for filtering.

### filterField

If set, only ledger entries where `entry[filterField] === capture` are injected. If unset, all entries from the ledger are injected.

### artifactPath

Optional file to append after entries. If the file does not exist, injection continues with entries only.

### template

Optional. Default:

````
\n\n=== {{injector}} CONTEXT [capture={{capture}}] ===\nENTRIES:\n{{entries}}\nARTIFACT:\n{{artifact}}\n```

## Environment overrides

| Variable | Overrides |
|---|---|
| `QMD_BINARY` | `qmd.binary` |
| `QMD_LEDGER_CONFIG` | Custom config file path (checked before default locations) |

## Config resolution order

1. `process.env.QMD_LEDGER_CONFIG` (if set)
2. `cwd/pi-qmd-ledger.config.json`
3. `cwd/.pi/qmd-ledger.config.json`
4. Defaults from extension code
````
