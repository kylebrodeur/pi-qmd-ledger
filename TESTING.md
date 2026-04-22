# Test Plan

How to verify pi-qmd-ledger works for agents, humans, and human-in-the-loop (HITL) workflows.

## Three personas

| Persona | Role | How they interact |
|---|---|---|
| **Agent** | LLM / pi | Discovers tools, calls them with correct parameters, reads `promptGuidelines` |
| **Human** | User | Types `/qmd-init`, reviews output, runs commands |
| **Human-in-the-loop** | Approver | Confirm/reject via `strict` mode or `/qmd-approve` batch review |

---

## Agent-only test (autopilot mode)

**Goal:** The agent captures facts without human interaction.

```
User: Record that users must authenticate via SSO.
```

Agent flow:
1. `describe_ledger` → confirms schema fields
2. `append_ledger` with `mode="autopilot"`
3. Checks dedup → appends if unique
4. Returns success confirmation

**Verify:**
```
query_ledger(ledger="master", filters={tag: "auth"})
```
Returns the entry.

---

## Human-only test (commands)

**Goal:** A human can set up and use the ledger without the agent writing code.

```bash
# 1. Install
pi install npm:pi-qmd-ledger

# 2. Check health
/qmd-validate

# 3. Scaffold
/qmd-init

# 4. Check config created
cat pi-qmd-ledger.config.json

# 5. Index docs (if qmd collections exist)
/qmd-index

# 6. Search
qmd_search(query="authentication strategy")

# 7. Check stats
ledger_stats
```

**Expected:** No tool calls needed; all interaction is via slash commands.

---

## Human-in-the-loop test (strict mode)

**Goal:** Agent proposes entries; human approves each one.

```
User: Add a fact about SSO but I want to review it first.
```

Agent flow:
1. `append_ledger` with `mode="strict"`
2. `ctx.ui.confirm` fires → human sees a dialog
3. Human clicks **Approve** → entry appended
4. Or human clicks **Reject** → agent sees rejection, pivots

**Verify dialog shows:**
- Full JSON of proposed entry
- Ledger name
- "Approve entry for 'master'?"

---

## Human-in-the-loop test (gated + approval batch)

**Goal:** Agent queues many facts; human reviews all at once.

```
User: Queue these 5 facts for later review.
```

Agent flow (5x):
1. `append_ledger` with `mode="gated"` each time
2. Facts go to `pending.jsonl`

Human later types:
```
/qmd-approve master
```

**Verify:**
- Each pending entry shows in a confirm dialog
- Approve → moved to `master.jsonl`
- Reject → stays in `pending.jsonl` (or removed)
- Final count message: "Approved 4 → 'master'. Rejected 1."

---

## Context injection test

**Goal:** Typing a keyword triggers automatic context loading.

Setup: Ensure config has:
```json
"injectors": [
  { "name": "draft-context", "regex": "draft\\s+(\\S+)", "ledger": "master", "filterField": "tag" }
]
```

Add an entry:
```
append_ledger(ledger="master", mode="autopilot", entry={id:"r1", domain:"auth", source:"s1", fact:"SSO required", tag:"login", artifact:""})
```

Test:
```
User: draft login
```

**Expected:** The `before_agent_start` event injects all entries where `tag === "login"` into the system prompt.

Verify by checking the LLM response references "SSO required".

---

## Indexing test (qmd pipeline)

**Goal:** Documents are searchable after indexing.

```bash
# 1. Have markdown files in ./docs
ls docs/*.md

# 2. Add to qmd
cd docs && qmd collection add . --name project-docs

# 3. Index (BM25 + embeddings)
/qmd-index

# 4. Check status
qmd_status
# Expected: shows collection, file count, zero pending embeddings

# 5. Search
qmd_search(query="deployment strategy", limit=3)
# Expected: returns relevant markdown chunks
```

---

## Export test

**Goal:** Data portability.

```
ledger_export(ledger="master", format="csv")
ledger_export(ledger="master", format="markdown")
```

**Verify:** Files are valid CSV/Markdown with schema headers.

---

## Regression checklist

Run before each release:

| Check | How |
|---|---|
| Build | `pnpm build` → zero errors |
| Tests | `pnpm test` → 17/17 pass |
| Version | `cat package.json \| grep version` matches planned release |
| Changelog | `CHANGELOG.md` has entry for this version |
| Skills manifest | `skills/qmd-ledger/SKILL.md` has valid frontmatter |
| No stale refs | No `/init_ledger`, `/validate_setup`, or `/approve_ledger` in docs |

---

## Smoke test (one-liner)

```bash
pi -e npm:pi-qmd-ledger
/qmd-init
/qmd-validate
```

If this sequence completes without errors, the extension is healthy.
