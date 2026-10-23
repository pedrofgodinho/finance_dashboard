# Repository Guidelines

## Project Structure & Module Organization

This private ETF dashboard uses SvelteKit 3, Svelte 5, and TypeScript on Cloudflare Workers.

- `src/routes/`: SvelteKit pages, layouts, and server loaders.
- `src/lib/`: shared modules and bundled assets, imported through `#lib`.
- `src/lib/server/`: server-only authentication and future private application logic.
- `src/hooks.server.ts`: request authentication and privacy headers.
- `static/`: directly served assets; `tests/`: automated tests.
- `docs/cloudflare.md`: deployment instructions; `wrangler.jsonc`: Worker configuration.

## Build, Test, and Development Commands

Use Node.js 24 and npm 11; install locked dependencies with `npm ci`.

- `npm run dev`: start Vite with hot reloading and loopback-only authentication bypass.
- `npm run check`: verify generated Cloudflare types and check Svelte/TypeScript.
- `npm run lint` / `npm run format`: check formatting/lint or apply Prettier.
- `npm test`: run authentication tests.
- `npm run build` / `npm run preview`: build production output, or serve it locally with Wrangler.
- `npm run validate`: run type checks, lint, tests, and production build before sharing changes.
- `npm run gen`: regenerate `worker-configuration.d.ts` after Wrangler configuration changes.
- `npm run deploy:check`: validate deployment without publishing; `npm run deploy`: publish to Cloudflare.

## Coding Style & Naming Conventions

Use TypeScript and Svelte 5 runes. Preserve strict typing, indexed-access checks, and exact optional
properties. Prettier enforces tabs, single quotes, no trailing commas, and a 100-character print width;
EditorConfig specifies LF endings. ESLint covers TypeScript, JavaScript, and Svelte.
Use PascalCase for reusable components, camelCase for functions, and SvelteKit filenames such as
`+page.svelte` and `+layout.server.ts`.

## Testing Guidelines

Tests use Node's built-in `node:test` and `node:assert/strict`. Name files `tests/*.test.mjs` and describe
observable behavior in test names. Authentication tests generate local signing keys without network
access. Add regression cases for changed behavior, especially authorization failures. No coverage
percentage is currently enforced.

## Commit & Pull Request Guidelines

This checkout uses Jujutsu (`.jj/`); use `jj --no-pager`, not raw Git commands. Describe a new, focused
change before editing. History uses imperative, sentence-case descriptions, such as
“Configure private Cloudflare deployment with owner authentication”. PRs should explain behavior,
validation, and configuration changes; link relevant issues and include screenshots for visual changes.

## Security & Configuration

Preserve Cloudflare Access, owner JWT verification, denied access when configuration is missing, and
private response headers. Keep prerendering disabled for private routes and public Worker/preview
URLs disabled. Never commit API tokens, session cookies, `.env.cloudflare.local`, or `.dev.vars`.
Consult `docs/cloudflare.md` before changing authentication or deployment.
