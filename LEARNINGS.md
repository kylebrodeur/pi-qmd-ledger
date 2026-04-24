# pi-qmd-ledger Project Wrap-Up & Key Learnings

1. **From Rigid to Universal:** 
   We started with an extension hardcoded for a very specific research-oriented domain (with baked-in assumptions about "chapters," "evidence gems," and fixed file paths). We pivoted this into a highly flexible system. Now, the `pi-qmd-ledger` acts as an agnostic, append-only JSONL event sourcing system. By externalizing the schema and the target ledgers to `pi-qmd-ledger.config.json`, this tool can now be used out of the box for decision logs, error tracking, task management, or raw research.

2. **Mastering Pi Package Ecosystem:**
   We correctly configured the project to leverage Pi's internal routing:
   *   **`pi-package` Keyword & `pi` Manifest:** Ensuring the extension is properly surfaced in Pi's marketplace and the package manager auto-discovers our scripts.
   *   **Peer Dependencies:** Moving Pi core modules to `peerDependencies` with `*` rules. This stops the extension from bundling its own version of the Pi Core SDK, which bloats the package and risks runtime type/class conflicts.
   *   **Convention over Configuration:** We placed the skill strictly in `skills/qmd-ledger/SKILL.md` (where the folder name exactly matches the skill name). This lets Pi's `resources_discover` hook instantly find and load the Agent Skills standard instructions.

3. **Enhancing Agentic UX (LLM Usability):**
   *   **`promptSnippet` and `promptGuidelines`:** Originally, the LLM had to guess how to use the tools or rely heavily on its system prompt. We injected contextual guidelines directly into the tool registrations. Now, when Pi boots up, the LLM intrinsically understands the exact circumstances to call `describe_ledger` vs `qmd_status`.
   *   **HitL Tiers:** We implemented strict (prompt user), gated (queue in pending), and autopilot (auto-append + deduplicate). This granular control gives the agent the freedom to operate autonomously while keeping the human perfectly in the loop on destructive or permanent state changes.

4. **Integrating External Binaries (qmd):**
   *   We successfully wrapped the `qmd` (BM25 + Semantic Search) local engine into the flow.
   *   Instead of assuming `qmd` exists, we built robust fallback states. Tools gracefully fail with explicit installation instructions (prioritizing precompiled binaries for speed, falling back to Cargo builds).
   *   We exposed the `qmd` pipeline natively (`/qmd-index`), meaning agents can now ingest, compile, and embed large text repositories entirely inside the Pi environment without dropping down to raw bash scripts.

5. **Namespace Hygiene:**
   Instead of claiming generic commands like `/validate_setup` or `/init_ledger` which could easily collide with other extensions, we properly mapped them to `/qmd-validate` and `/qmd-init`.

7. **ESM Compatibility & `__dirname` Polyfill:**
   When `tsconfig.json` targets `"module": "ESNext"` with `"type": "module"` in `package.json`, `__dirname` is undefined. Use the standard ESM polyfill:
   ```typescript
   import { fileURLToPath } from 'url'
   const __filename = fileURLToPath(import.meta.url)
   const __dirname = path.dirname(__filename)
   ```
   This is essential for Pi extensions that need to resolve sibling paths (e.g., `skills/`, `templates/`).

8. **No Fake APIs on `ExtensionContext`:**
   `ExtensionContext` has a fixed, well-defined surface. The following are **not** real APIs and will fail silently or at runtime:
   * `(ctx as any).toolMap` — not a property on `ExtensionContext`
   * `ctx.toolCall(toolName, args)` — not a method on `ExtensionContext`
   * `ctx.ui.editor(title, text)` — exists, but is an **input** dialog (blocks for user input), not a display-only mechanism
   * For tool discovery, always use `pi.getAllTools()` and filter by `.name`
   * For invoking tool logic from an event handler, inline the code or queue a follow-up message (`pi.sendUserMessage()`); do not try to call tools through the context object

9. **Event Handlers Cannot Call Tools Directly:**
   Unlike command handlers (which receive `ExtensionCommandContext`), lifecycle event handlers like `before_agent_start` and `turn_end` only receive `ExtensionContext`. There is no built-in mechanism to call another registered tool from within an event. The correct pattern is to either:
   * Extract the tool's core logic into a standalone function and call it directly, or
   * Use `pi.sendUserMessage('/command', { deliverAs: 'followUp' })` to queue a user-level command invocation

10. **Correct UI Method for Read-Only Display:**
    `ctx.ui.editor(title, prefill)` opens an editable text dialog and **awaits user input** — this will hang a command or event if used for display. For read-only informational output in commands, use `ctx.ui.notify(message, 'info' | 'warning' | 'error')`. If more detail is needed, return structured text in the command result or use `ctx.ui.setWidget()`.

11. **pnpm Overrides for Transitive Vulnerability Fixes:**
    When a security vulnerability exists deep in a transitive dependency chain (e.g., `fast-xml-parser` via `@aws-sdk` via `@mariozechner/pi-ai`), upstream packages may lag in updating. Force-resolve the patched version in your own `package.json`:
    ```json
    "pnpm": {
      "overrides": {
        "fast-xml-parser": ">=5.7.0"
      }
    }
    ```
    Then run `pnpm install && pnpm audit` to verify. This avoids waiting for upstream maintainers and immediately silences Dependabot alerts.

12. **GitHub Dependabot Re-Scans After Push:**
    After pushing a lockfile update that resolves a known vulnerability, Dependabot will re-evaluate on the next scan cycle (usually within minutes). The alert status transitions from `"open"` to `"fixed"` automatically — no manual dismissal required. Verify with: `gh api repos/OWNER/REPO/dependabot/alerts`.

13. **TypeBox 1.x Migration on the Horizon:**
    Pi SDK 0.69.0+ migrated from `@sinclair/typebox` (0.34.x) to `typebox` (1.x). Legacy extension loading still aliases the root `@sinclair/typebox` package, but `@sinclair/typebox/compiler` is no longer shimmed. Our extension currently imports from `@sinclair/typebox` which works via aliasing. Future work: migrate to `typebox` 1.x for forward compatibility and eval-restricted runtime support.

14. **Pi Extension Public Repo Checklist:**
    Before publishing an extension as a public GitHub repo and npm package, ensure:
    * `.github/ISSUE_TEMPLATE/` — structured bug reports and feature requests
    * `.github/pull_request_template.md` — checklist for build, test, lint, changelog
    * `.github/workflows/ci.yml` — automated build, lint, typecheck, test on push/PR
    * `test/` — even a stub test means `pnpm test` passes in CI
    * `CHANGELOG.md` — release entries with correct GitHub release links
    * `README.md` — version pins match current version, Node.js engine requirements match `package.json`
    * `package.json` — `"engines"` explicitly set, `"files"` array reviewed, no stale `.tgz` or `node_modules` tracked
    * `.gitignore` — excludes `dist/`, `node_modules/`, `*.tgz`, `ledger/`, `.pi/`, but **tracks** `TODO.md` and `.github/`
    * GitHub topics added via `gh repo edit --add-topic` for discoverability
    * Discussions enabled if community feedback is expected

15. **Modular Extension Architecture:**
    When an extension grows beyond ~1,000 lines, split it into dedicated modules by concern:
    * `src/types.ts` — All interfaces and constants (no runtime dependencies)
    * `src/utils.ts` — Pure helper functions (config loading, path resolution, qmd checks)
    * `src/tools.ts` — Tool registrations, each as an exported factory function taking `ExtensionAPI`
    * `src/commands.ts` — Command registrations, same pattern
    * `src/events.ts` — Event handlers decoupled from the main factory
    * `src/index.ts` — Thin orchestrator that imports and wires everything
    * `index.ts` (root) — Re-export for backward compatibility with existing `package.json` `main` field
    * **Benefit**: Each module can be unit-tested in isolation. Changes to one concern don't risk breaking unrelated logic.

16. **Global + Project Config Hierarchy:**
    Follow the pi-model-router pattern for dual-level configuration:
    * Global: `~/.pi/agent/qmd-ledger.config.json` — shared defaults across all projects
    * Project: `.pi/qmd-ledger.config.json` — per-repo overrides
    * Merge order: `DEFAULT` → `global` → `project` (project wins on conflicts)
    * `findConfig()` should return `{ global?: string; project?: string }`
    * This lets users set baseline settings once and override only what's needed per repo.

17. **Zero-`any` Implementation Strategy:**
    For TypeBox-based tool params, define manual input interfaces rather than relying on `Static<typeof schema>` (which varies across TypeBox versions):
    ```typescript
    export interface QmdSearchInput { query: string; limit?: number }
    ```
    Then use them in tool execute signatures:
    ```typescript
    async execute(_id: string, params: QmdSearchInput, _signal: AbortSignal | undefined, _onUpdate: AgentToolUpdateCallback<unknown> | undefined, ctx: ExtensionContext)
    ```
    For unknown JSONL entries, use `unknown[]` or `Record<string, unknown>` instead of `any[]`/`any`.

18. **ESM Import Paths in TypeScript:**
    When using `"module": "ESNext"` with TypeScript, always import sibling modules with `.js` extension:
    ```typescript
    import { loadConfig } from './utils.js'
    import type { LedgerDef } from './types.js'
    ```
    TypeScript resolves these correctly at compile time and the emitted JS works natively in Node.js ESM.
    Also, `import.meta.dirname` (Node 20.11+) is cleaner than the `fileURLToPath(import.meta.url)` polyfill for getting `__dirname` in ESM.

6. **Developer Tooling & Conventions:**
   We established a modern development pipeline to ensure consistent code quality, type safety, and adherence to coding standards:

   *   **Build & Type Checking:**
     *   `pnpm build` - TypeScript compilation with `tsc`
     *   `pnpm typecheck` - Type checking without emitting files using `tsc --noEmit`
     *   Configured in `tsconfig.json` with strict settings and output to `dist/`

   *   **Code Quality & Linting:**
     *   `pnpm lint` - ESLint with JavaScript rules (.ts files skipped for now due to complexity with TypeScript parser in ESLint v10)
     *   `.prettierrc.json` - Single quotes, no semicolons, trailing commas set to `es5`
     *   `.prettierignore` - Excludes `dist/`, `node_modules/`, and other non-code files
     *   `eslint.config.js` - ESLint v9+ flat config format with Prettier integration

   *   **Testing & CI:**
     *   `pnpm test` - Runs Node.js built-in test runner against `dist/test/index.test.js`
     *   All 17 tests pass (Extension registration, Config system, Ledger CRUD, Injector system, Commands)
     *   Tests use a mock API pattern with temp directories to ensure isolation

   *   **Conventions for Future Extensions:**
     *   **Naming:** Use `qmd-*` prefix for commands to avoid namespace collisions
     *   **Tool Registration:** Always include `promptSnippet` and `promptGuidelines` for better LLM context
     *   **Error Handling:** Gracefully handle missing dependencies with clear installation instructions
     *   **Parameters:** Name parameters after their purpose and use descriptive types or `any` when needed
     *   **Async Execution:** Wrap file operations in `Promise` when using `child_process.execFile`
     *   **Context Usage:** Use `ExtensionContext` for cwd and UI interactions
     *   **Schema Definition:** Use `Type.Object` and `Type.Record` from `@sinclair/typebox` for parameter validation
     *   **Configuration:** Load config lazily in tools and support environment variable overrides
     *   **Testing Strategy:** Create a mock API with helper functions and test against temp directories
