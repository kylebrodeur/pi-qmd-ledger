# Publishing Guide

This extension is distributed as an npm package. Users install it via their package manager and register it as a pi extension.

## Pre-publish checklist

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm test` passes all tests
- [ ] `pnpm version` set correctly in `package.json`
- [ ] `CHANGELOG.md` updated for the version
- [ ] No `node_modules/` or `dist/` accidentally tracked in git
- [ ] `files` field in `package.json` reviewed

## Version bumping

This project follows [Semantic Versioning](https://semver.org/):

| Change type | Version bump | Example |
|---|---|---|
| Bug fix | patch | `0.1.1` |
| New tool/command (non-breaking) | minor | `0.2.0` |
| Breaking change | major | `1.0.0` |

```bash
# patch (bug fix)
pnpm version patch

# minor (new feature)
pnpm version minor

# major (breaking change)
pnpm version major
```

This updates `package.json`, `package-lock.json` (if using npm), and creates a git tag.

## Publish to npm

```bash
# build one more time
pnpm build

# publish (requires npm login)
pnpm publish --access public
```

For scoped packages (`@your-org/pi-qmd-ledger`), the `--access public` flag is required for first publish.

### Dry run

```bash
pnpm publish --dry-run
```

## GitHub Release

After publishing:

1. Push the version tag: `git push origin main --tags`
2. Create a release on GitHub from the new tag
3. Copy the relevant section from `CHANGELOG.md` into the release notes

## Installation by users

After publishing, users install via:

```bash
npm install pi-qmd-ledger
# or
pnpm add pi-qmd-ledger
# or
yarn add pi-qmd-ledger
```

Then register in their project's `package.json`:

```json
{
  "pi": {
    "extensions": [
      "./node_modules/pi-qmd-ledger/dist/index.js"
    ]
  }
}
```

Or globally in pi config.

## What gets published

The `files` field in `package.json` controls the npm tarball contents:

```json
"files": [
  "dist",
  "skills",
  "templates",
  "examples",
  "CHANGELOG.md",
  "README.md",
  "LICENSE"
]
```

These are auto-built at publish time:
- `dist/` — compiled JavaScript output
- `skills/` — Agent Skills standard SKILL.md and references
- `templates/` — scaffold files for `/qmd-init`
- `examples/` — domain-specific sample configs

**Do NOT publish:**
- `node_modules/`
- `test/`
- `.git/`
- `.pi/`
- Raw `index.ts` (if compiling to `dist/`)

## Automated publishing (GitHub Actions)

To publish from CI, add an npm automation token as `NPM_TOKEN` to repository secrets, then create:

```yaml
name: Publish
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
