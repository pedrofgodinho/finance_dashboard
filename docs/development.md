# Development Guide

Read [AGENTS.md](../AGENTS.md) before changing the repository. Track scope, decisions, and progress in
[PLAN.md](../PLAN.md). The README is the human-facing entry point; detailed instructions belong here
or in [the Cloudflare guide](cloudflare.md).

## Environment and Commands

Use Node.js 24 (`.nvmrc`) and npm 11 (`packageManager` records npm 11.9.0). Install dependencies with
`npm ci` to use `package-lock.json`.

| Command                | Purpose                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`          | Generate Cloudflare types and start Vite with hot reloading.                      |
| `npm run check`        | Generate Cloudflare types, then check Svelte/TypeScript.                          |
| `npm run check:watch`  | Generate Cloudflare types, then run Svelte/TypeScript checks continuously.        |
| `npm run lint`         | Check Prettier formatting and ESLint rules.                                       |
| `npm run lint:fix`     | Apply automatic ESLint fixes.                                                     |
| `npm run format`       | Apply Prettier formatting.                                                        |
| `npm test`             | Run Node's built-in test runner against `tests/*.test.mjs`.                       |
| `npm run build`        | Generate Cloudflare types and build for production.                               |
| `npm run preview`      | Serve the existing production build with Wrangler on port 4173.                   |
| `npm run gen`          | Regenerate Cloudflare binding/runtime types after Wrangler configuration changes. |
| `npm run validate`     | Run types, formatting, lint, tests, and production build.                         |
| `npm run deploy:check` | Build and dry-run the deployment without publishing.                              |
| `npm run deploy`       | Build and publish the Worker; this changes production.                            |

`npm run dev` bypasses authentication only on loopback hostnames in development mode. Never expose
that server publicly. Run `npm run build` before `npm run preview`; production previews enforce Access
authentication and do not have the development bypass.

## Source Organization

```text
src/
  routes/            SvelteKit pages, layouts, and server loaders.
  lib/               Shared modules and bundled assets; import via #lib.
    server/          Server-only logic, including Access JWT verification.
  hooks.server.ts    Request authentication and private response headers.
  env.ts             Private runtime environment declarations.
  app.d.ts           Application-wide SvelteKit types.
  app.html           HTML template.
static/              Directly served assets.
tests/               Automated behavior tests.
docs/                Development and operational documentation.
vite.config.ts       Vite, Svelte compiler, SvelteKit, and Cloudflare adapter.
wrangler.jsonc       Worker identity, hostname, bindings, and runtime configuration.
```

Use Svelte 5 runes and strict TypeScript. The current toolchain includes SvelteKit 3, Vite 8, and
TypeScript 6. `tsconfig.json` enables indexed-access checking and exact optional properties.
JavaScript diagnostics are disabled because Wrangler's generated main-module declaration imports
compiled Worker JavaScript; ESLint still checks authored JavaScript configuration files.
`worker-configuration.d.ts` is generated and ignored by version control. Installation (`prepare`),
development, type-check, and build scripts run `npm run gen` before consuming these declarations.
Run `npm run gen` explicitly when needed; never edit or commit the generated file.

Do not replace generation with `wrangler types --check` against a committed declaration file.
Wrangler includes entry-point information in its environment hash when the compiled Worker exists,
so the hash differs between a fresh checkout and an already-built workspace. Generate in the current
environment first and let Svelte/TypeScript check the application against the resulting declarations.

Prettier uses tabs, single quotes, no trailing commas, and a 100-character print width. EditorConfig
specifies LF endings. ESLint covers TypeScript, JavaScript, and Svelte.

## Branch and Review Workflow

This checkout uses Jujutsu. Use `jj --no-pager` and keep work on a separate `<type>/<topic>` bookmark.
Never put agent changes on `main`, move `main` to them, or push `main`. The owner controls merging.

Choose the prefix by purpose and use a short, hyphenated topic:

| Prefix      | Purpose                                 | Example                       |
| ----------- | --------------------------------------- | ----------------------------- |
| `feat/`     | New functionality                       | `feat/purchase-entry`         |
| `fix/`      | Bug fixes                               | `fix/schedule-month-end`      |
| `refactor/` | Code restructuring                      | `refactor/price-provider`     |
| `chore/`    | Maintenance, tooling, and documentation | `chore/repository-guidelines` |

Inspect status and bookmarks first. Start a separate change and bookmark before editing, unless
continuing the task's existing feature change:

```powershell
jj --no-pager status
jj --no-pager bookmark list
jj --no-pager new -m "Add purchase entry"
jj --no-pager bookmark create feat/purchase-entry -r '@'
```

Preserve unrelated work in its existing change. Never describe or edit a revision carrying `main`;
start a separate change first. Quote revision expressions such as `'@'` in PowerShell.

Review the diff with `jj --no-pager diff --git`, maintain affected documentation, and run
`npm run validate` before sharing. Bookmarks do not automatically advance to new changes. When a push
is explicitly requested, move the feature bookmark to the intended finished revision and push only it:

```powershell
jj --no-pager bookmark move feat/purchase-entry --to '@'
jj --no-pager git push --remote origin --bookmark feat/purchase-entry
```

Use `'@-'` instead if the finished change is the parent of a new empty working change. PRs should
describe resulting behavior, validation, and relevant configuration changes, with screenshots for
visual changes and issue links when applicable.

## Testing and Documentation

Tests use `node:test` and `node:assert/strict`; name files `tests/*.test.mjs` and describe observable
behavior in test names. Authentication tests generate local signing keys and require no network or
Cloudflare account. Add regression cases for behavior changes, especially authorization failures.
There is no enforced coverage percentage.

For each task, review `README.md`, `PLAN.md`, `AGENTS.md`, and relevant `docs/`. Update affected content
in the same change. Keep `PLAN.md` accurate, document decisions and open questions, and leave the
README concise. Only a very explicit owner instruction may change the immutable rules in `AGENTS.md`.
