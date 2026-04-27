# Ledger-to-Ledger (L2L) Knowledge Promotion Design

> Status: **Partially implemented (v0.5.0)** — intra-project L2L works; cross-project L2L is a planned but unbuilt feature.

---

## 1. What Exists Today: Intra-Project L2L

### Overview

As of v0.5.0, `pi-qmd-ledger` supports promoting entries from one ledger to another **within the same project**. This is the core "Ledger-to-Ledger" (L2L) Knowledge Promotion system.

### Flow

```
┌─────────────┐    promote_ledger()     ┌─────────┐    /qmd-approve     ┌─────────────┐
│ sourceLedger│ ────────────────────────► │ pending │ ─────────────────►  │ targetLedger│
└─────────────┘  + _promotion metadata   └─────────┘  (respects         └─────────────┘
                                                      _promotion_target)
```

### Tools & Commands

| Component | Role |
|-----------|------|
| `promote_ledger` tool | Reads entries by ID from a source ledger, copies them to the local `pending` ledger with `_promotion_target`, `_promotion_source`, `_promotion_reason`, and `_promoted_at` metadata. |
| `/qmd-approve [target]` | Batch-reviews pending entries. If an entry has `_promotion_target`, it overrides the CLI argument and routes the entry to that specific ledger. |

### Metadata Added During Promotion

```json
{
  "_promotion_target": "main",
  "_promotion_source": "research",
  "_promotion_reason": "This insight generalizes beyond the current bug fix.",
  "_promoted_at": "2026-04-27T12:00:00.000Z"
}
```

### Example Usage

```
promote_ledger(
  sourceLedger="research",
  targetLedger="main",
  entryIds=["id1", "id2"],
  reason="These findings apply beyond the current experiment."
)
```

Then the user runs `/qmd-approve` (or `/qmd-approve main`) to finalize.

### Scope Limitation

- `loadConfig(ctx.cwd)` resolves to the **current project's** `pi-qmd-ledger.config.json`.
- All ledgers (`sourceLedger`, `pending`, `targetLedger`) must be defined in that single config file.
- There is no concept of an external / upstream / remote project.

---

## 2. What Does NOT Exist: Cross-Project L2L

### The Vision

Entries discovered in an ephemeral or project-specific ledger (e.g., a `pi-qmd-ledger` bug investigation session) should be promotable to a **global, shared ledger** in another project (e.g., `pi-tools/knowledge`).

### Concrete Example

| Source Project | Source Ledger | Entry |
|---|---|---|
| `pi-qmd-ledger` | `main` | `{ id: "BUG-001", fact: "qmd 0.3.2 crashes on smart quotes...", tag: "qmd" }` |

| Target Project | Target Ledger | Desired Entry |
|---|---|---|
| `pi-tools` | `knowledge` | `{ id: "BUG-001", source_file: "pi-qmd-ledger", content_summary: "qmd 0.3.2 smart-quote crash", full_content: "...", tags: "qmd,bug,fix", ... }` |

### Why It Doesn't Work Today

| Barrier | Explanation |
|---------|-------------|
| **Config isolation** | `promote_ledger` calls `loadConfig(ctx.cwd)`. It has no external project awareness. |
| **Schema mismatch** | `pi-qmd-ledger`'s `main` uses `id, domain, source, fact, tag, artifact`. `pi-tools`'s `knowledge` uses `id, timestamp, source_file, source_context, content_summary, full_content, tags, status, supersedes_id, confidence, extracted_by_agent, is_new_learning`. |
| **No wiring** | No config key for "upstream ledger," no tool for remote append, no schema mapping layer. |
| **No discovery** | The extension cannot enumerate or query ledgers in other project directories. |

---

## 3. Proposed Architectural Approaches

The following are ordered from simplest to most comprehensive:

### Approach A: Export → Import Pipeline

**Idea:** Use existing `ledger_export` to serialize entries, then `append_ledger` or a new `/qmd-import` command in the target project.

```
# In pi-qmd-ledger project:
ledger_export(ledger="main", format="json") → clipboard / file

# In pi-tools project:
/qmd-import ledger="knowledge" file="exported.json" --map-schema="auto"
```

| Pros | Cons |
|---|---|
| Minimal new code | Manual, two-step workflow |
| Reuses existing export logic | No seamless promotion UX |
| Schema mapping could be a one-off transform | No bi-directional sync |

### Approach B: Upstream Target Configuration

**Idea:** Add `"upstream"` or `"sync"` targets to ledger definitions.

```json
{
  "ledgers": {
    "main": {
      "path": "ledger/main.jsonl",
      "schema": ["id", "domain", "source", "fact", "tag", "artifact"],
      "dedupField": "fact",
      "upstream": {
        "targetProject": "~/projects/pi-tools",
        "targetLedger": "knowledge",
        "schemaMap": {
          "id": "id",
          "fact": "content_summary",
          "domain": "tags",
          "source": "source_file"
        }
      }
    }
  }
}
```

When `promote_ledger` or `/qmd-approve` runs, it checks for upstream config and optionally routes entries there.

| Pros | Cons |
|---|---|
| Declarative, config-driven | Requires schema mapping syntax design |
| Per-ledger granularity | Needs file-system access to external projects, or a shared ledger directory |

### Approach C: External Ledger Discovery & Append Tool

**Idea:** Extend `promote_ledger` to accept a `targetProject` (or `targetConfigPath`) parameter.

```
promote_ledger(
  sourceLedger="main",
  targetProject="~/projects/pi-tools",
  targetLedger="knowledge",
  entryIds=["BUG-001"],
  reason="Bug fix generalizes."
)
```

The tool would:
1. Load the external project's config.
2. Validate the external ledger exists.
3. Apply a schema mapping (auto-inferred or configured).
4. Append to the external project's `pending` (or directly to target with user confirmation).

| Pros | Cons |
|---|---|
| Natural UX extension | Requires schema mapping engine |
| Works across arbitrary projects | Security: need to handle path traversal / sandboxing |

### Approach D: Shared Ledger Directory (Global Ledger)

**Idea:** Define a global ledger directory (e.g., `~/.pi/ledgers/`) that all projects can read from and write to.

```json
{
  "ledgers": {
    "knowledge": {
      "path": "~/.pi/ledgers/knowledge.jsonl",
      "schema": ["id", "timestamp", "source_file", "content_summary", "full_content", "tags", "status", "confidence"],
      "scope": "global"
    }
  }
}
```

| Pros | Cons |
|---|---|
| True shared knowledge base across all projects | Requires migration from project-scoped to global model |
| Solves ownership / path issues | Concurrent writes could need locking |
| Clean separation between project-local and global knowledge | Needs new config semantics (`scope`) |

---

## 4. Recommended Next Steps

1. **Document the gap** (this doc — ✅).
2. **Start with Approach C** (external `targetProject` parameter) because it has the best UX and builds on existing `promote_ledger` behavior.
3. **Pair with a schema mapping config** (subset of Approach B) so per-project mapping rules are declarative.
4. **Defer Approach D** until we have real-world pain from multi-project fragmentation.

---

## 5. Related Files

| File | Relevance |
|---|---|
| `src/tools.ts` (`promote_ledger` implementation) | Core intra-project L2L logic |
| `src/commands.ts` (`/qmd-approve`) | Reads `_promotion_target` metadata |
| `src/utils.ts` (`loadConfig`, `findConfig`) | Config resolution is cwd-scoped |
| `../pi-tools/pi-qmd-ledger.config.json` | Example of a different project's config |
| `../pi-tools/ledger/knowledge.jsonl` | Example of a different ledger schema |
