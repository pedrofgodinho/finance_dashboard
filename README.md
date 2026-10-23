# Finance Dashboard

A private, personal ETF dashboard for tracking investments and exploring long-term portfolio scenarios
using historical data.

The SvelteKit/TypeScript foundation and private Cloudflare hosting are implemented. Purchase tracking,
ETF prices, and projections are planned. The dashboard lives at <https://portfolio.pmfg.pt> behind
owner-only email-code sign-in.

## Run locally

Use Node.js 24 and npm 11:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, usually <http://localhost:5173>. Local development bypasses sign-in on
loopback addresses; production builds enforce authentication.

Run `npm run validate` for type checks, formatting, lint, tests, and the production build.

## Documentation

- [Plan and decisions](PLAN.md): completed work, next steps, and open questions.
- [Development guide](docs/development.md): commands, structure, testing, and branch workflow.
- [Cloudflare guide](docs/cloudflare.md): deployment, Access, and automatic builds.
- [Contributor rules](AGENTS.md): standing repository instructions.
