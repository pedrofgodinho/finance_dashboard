# Finance Dashboard

A personal ETF portfolio application for recording past investments and exploring very long-term
portfolio scenarios based on historical data.

This initial scaffold contains the application foundation and a placeholder home page. Investment
records, market data, persistence, and projection calculations will be added in subsequent work.

## Getting started

Use Node.js 24 and npm 11. The Node version is recorded in `.nvmrc`; dependencies are locked in
`package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>.

## Commands

| Command               | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `npm run dev`         | Start the development server with hot reloading.                       |
| `npm run check`       | Generate SvelteKit types and check Svelte and TypeScript.              |
| `npm run check:watch` | Run type checks continuously.                                          |
| `npm run lint`        | Check formatting and lint TypeScript, JavaScript, and Svelte.          |
| `npm run lint:fix`    | Apply automatic ESLint fixes.                                          |
| `npm run format`      | Format supported files with Prettier.                                  |
| `npm run build`       | Create the production build.                                           |
| `npm run preview`     | Preview the production build locally.                                  |
| `npm run validate`    | Run type checks, formatting checks, linting, and the production build. |

Run `npm run validate` before sharing changes. No test framework is configured yet; add tests alongside
the portfolio and projection logic when those features are implemented.

## Project structure

```text
src/
  lib/               Shared application code and assets; import via #lib.
  routes/            SvelteKit file-based routes and layouts.
  app.d.ts           Application-wide SvelteKit types.
  app.html           HTML document template.
static/              Files served directly, such as robots.txt.
vite.config.ts       Vite, Svelte compiler, and SvelteKit configuration.
eslint.config.js     ESLint flat configuration with Svelte and TypeScript support.
prettier.config.js   Prettier configuration with Svelte support.
tsconfig.json        Strict TypeScript configuration.
```

The project uses Svelte 5 runes, SvelteKit 3, Vite 8, TypeScript 6, ESLint, and Prettier, generated with
the [official Svelte CLI](https://svelte.dev/docs/cli/sv-create). TypeScript also checks indexed access
and exact optional properties. EditorConfig and the recommended VS Code extensions/settings keep
formatting consistent across editors.

SvelteKit's automatic adapter is configured for now. Select an explicit
[deployment adapter](https://svelte.dev/docs/kit/adapters) once a hosting target is chosen.
