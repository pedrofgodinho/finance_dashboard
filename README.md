# Finance Dashboard

A private, personal ETF dashboard for tracking investments and exploring long-term portfolio scenarios
using historical data.

Record one-time ETF purchases, save monthly plans, and preview their scheduled dates. Actual units
can be entered from broker records; purchases without units remain unpriced. Historical prices,
valuations, CSV reconciliation, and projections are next.

The dashboard lives at <https://portfolio.pmfg.pt> behind owner-only email-code sign-in.

## Run locally

Use Node.js 24 and npm 11:

```sh
npm ci
npm run db:migrate
npm run dev
```

Open the URL printed by Vite, usually <http://localhost:5173>. Local development bypasses sign-in on
loopback addresses; production builds enforce authentication.

Run `npm run validate` for type checks, formatting, lint, tests, and the production build.

## Documentation

- [Plan and decisions](PLAN.md): completed work, next steps, and open questions.
- [Development guide](docs/development.md): commands, structure, testing, and branch workflow.
- [Portfolio behavior](docs/portfolio.md): data, scheduling rules, and current limitations.
- [Cloudflare guide](docs/cloudflare.md): deployment, Access, and automatic builds.
- [Contributor rules](AGENTS.md): standing repository instructions.
