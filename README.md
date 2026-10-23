# Finance Dashboard

A personal ETF portfolio application for recording past investments and exploring very long-term
portfolio scenarios based on historical data.

The application targets Cloudflare Workers at `portfolio.pmfg.pt`, with Cloudflare Access providing
email-code sign-in for its owner. Deployment and account setup are documented in
[docs/cloudflare.md](docs/cloudflare.md). Portfolio features are the next phase.

## Getting started

Use Node.js 24 and npm 11. The Node version is recorded in `.nvmrc`; dependencies are locked in
`package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>.

## Commands

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the development server with hot reloading.                     |
| `npm run check`        | Generate SvelteKit types and check Svelte and TypeScript.            |
| `npm run check:watch`  | Run type checks continuously.                                        |
| `npm run lint`         | Check formatting and lint TypeScript, JavaScript, and Svelte.        |
| `npm run lint:fix`     | Apply automatic ESLint fixes.                                        |
| `npm run format`       | Format supported files with Prettier.                                |
| `npm run build`        | Create the production build.                                         |
| `npm run preview`      | Preview the production build locally.                                |
| `npm run gen`          | Regenerate Cloudflare binding and runtime types.                     |
| `npm test`             | Run authentication tests using Node's built-in test runner.          |
| `npm run deploy:check` | Build and validate the Worker deployment without publishing it.      |
| `npm run deploy`       | Build and deploy to Cloudflare Workers.                              |
| `npm run validate`     | Run types, formatting, linting, authentication tests, and the build. |

Run `npm run gen` after changing `wrangler.jsonc`, and `npm run validate` before sharing changes.
Authentication tests use locally generated signing keys and require no Cloudflare account or network.

`npm run dev` permits development on loopback addresses without Cloudflare sign-in. This bypass is
removed from production builds. The production preview requires valid Access settings and a signed
owner token, just like the deployed Worker.

## Project structure

```text
src/
  lib/               Shared application code and assets; import via #lib.
  routes/            SvelteKit file-based routes and layouts.
  app.d.ts           Application-wide SvelteKit types.
  app.html           HTML document template.
  env.ts             Private runtime environment variable declarations.
  hooks.server.ts    Authentication and private response headers for server requests.
static/              Files served directly, such as robots.txt.
tests/               Authentication tests.
vite.config.ts       Vite, Svelte compiler, and SvelteKit configuration.
wrangler.jsonc       Cloudflare Worker, hostname, and runtime configuration.
eslint.config.js     ESLint flat configuration with Svelte and TypeScript support.
prettier.config.js   Prettier configuration with Svelte support.
tsconfig.json        Strict TypeScript configuration.
```

The project uses Svelte 5 runes, SvelteKit 3, Vite 8, TypeScript 6, ESLint, and Prettier, generated with
the [official Svelte CLI](https://svelte.dev/docs/cli/sv-create). TypeScript also checks indexed access
and exact optional properties. EditorConfig and the recommended VS Code extensions/settings keep
formatting consistent across editors.

Application TypeScript remains strict. JavaScript diagnostics are disabled because Wrangler's
generated main-module declaration imports compiled Worker JavaScript; ESLint still checks authored
JavaScript configuration files.

The official Cloudflare adapter targets Workers. Default `workers.dev` and preview URLs are disabled.
The server verifies the Access token's signature, team, audience, expiry, and owner email, and denies
access when protection is unconfigured. Authenticated responses use `Cache-Control: private, no-store`.
