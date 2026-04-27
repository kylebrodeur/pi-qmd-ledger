# Contributing to pi-qmd-ledger

Thank you for considering a contribution! This guide covers setup, testing, and how to submit changes.

## Development setup

```bash
git clone <repo-url>
cd pi-qmd-ledger
pnpm install
pnpm build
```

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- qmd binary on PATH (`cargo install qmd-cli`)

## Project structure

```
index.ts              ← main extension entry
test/                 ← test suite
skills/               ← Agent Skills standard skill
  qmd-ledger/SKILL.md
templates/            ← scaffold templates
examples/             ← domain-specific configs
  research/
  decisions/
  requirements/
```

## Workflow

1. **Fork and branch** — create a feature branch from `main`
2. **Write code** — TypeScript, strict mode preferred
3. **Add tests** — see `test/index.test.ts` for patterns
4. **Build** — `pnpm build` must succeed with zero errors
5. **Test** — `pnpm test` must pass
6. **Commit** — follow [Conventional Commits](https://conventionalcommits.org/)
7. **PR** — describe what changed and why

## Testing

```bash
pnpm test              # run all tests
pnpm test -- --watch # watch mode (if available runner)
```

Each test runs in a temp directory to avoid side effects. Tests use a mock ExtensionAPI and verify:

- Tool/command/event registration counts
- Config scaffolding correctness
- Ledger CRUD (append, query, dedup)
- Export formats (JSON, CSV, Markdown)
- Injector activation on prompt matching
- Stats accuracy

### Adding a test

```typescript
it('does something new', async () => {
  const { api } = createMockApi()
  extensionFactory(api as any)
  // ... exercise the tool command or event
})
```

## Code style

- Prefer `const` / `let`, never `var`
- Use `===` and `!==`
- Prefer async/await over callbacks
- Prefix internal functions with underscore or keep them module-private
- Comments in `/* ── Section ── */` style for major blocks

## Commit message format

```
type(scope): short description

Longer explanation if needed. Wrap at 72 chars.

Closes #123
```

| Type       | Use for                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New tool, command, config option         |
| `fix`      | Bug fix                                  |
| `docs`     | README, skill, reference changes         |
| `test`     | Adding or fixing tests                   |
| `chore`    | Build, dependencies, tooling             |
| `refactor` | Code change that is neither feat nor fix |

## Feature requests and bugs

Open an issue first. For bugs, include:

- pi version (`pi --version`)
- Node version (`node -v`)
- Steps to reproduce
- Expected vs actual behavior
- Config file (redacted as needed)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
