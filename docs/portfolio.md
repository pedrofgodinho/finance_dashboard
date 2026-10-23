# Portfolio Tracking

The first functional slice records one-time purchases and monthly plans in Cloudflare D1. It supports
EUR contributions, Lisbon times, and the initial fund `IE00BK5BQT80`. Other ETFs can be registered by
ISIN and name. An ISIN is not an exchange listing; no exchange or market-data provider is assumed.

## Purchase Records

- ETF amounts exclude fees; recorded investment totals include both. Amounts and fees are integer
  cents. Units are integer 10⁻⁸ units, supporting up to eight decimal places without parsing float math.
- Providing units records `manual_actual` provenance. Leaving them blank records `manual_unpriced`;
  the app does not infer quantities or fabricate execution prices.
- Store execution as UTC, preserve the entered local timestamp, and display in `Europe/Lisbon`.
  Future manual purchases and nonexistent clock-gap times are rejected. Repeated autumn times use
  their first occurrence; a future broker import must preserve explicit execution offsets.
- Submission UUIDs make retries idempotent. Reusing an ID with different data returns a conflict.
- Archiving excludes a purchase from totals while preserving its stored record. The history view
  shows the latest 200 active records; totals cover all active records.

## Monthly Plans

Plans store an ISIN, EUR amount, monthly day, Lisbon wall-clock time, and inclusive start/end dates.
The initial time field is 10:00 and can be changed. Days absent from a short month are clamped to its
last day. Spring clock-gap schedules move forward one hour; autumn overlaps use the first occurrence.

Preview occurrences have stable `plan-id:scheduled-date` identifiers and are derived on read. The UI
shows upcoming dates through the next calendar year and recent planned dates from the previous year.
These are timing/cash-flow assumptions, excluded from recorded purchase totals.

Stopping a plan sets an immutable cutoff timestamp. Earlier scheduled dates remain visible and later
ones disappear. Changing an existing plan or reconciling its executions is not yet implemented.

## Prices and Future Reconciliation

Historical prices, market valuation, and return projections are not connected yet. A recorded amount
without actual units remains unpriced. The agreed price convention for future estimates is the next
available trading day's closing price; daily data does not reproduce intraday broker execution.

Before pricing, verify the fund's actual listing, quote currency, provider coverage, and adjustment
rules. A later Trade Republic CSV importer must associate actual executions with their estimated
occurrences so they are not counted twice.

## Storage and Migrations

`migrations/0001_portfolio.sql` creates `funds`, `purchases`, and `purchase_plans`, with foreign keys,
numeric checks, provenance constraints, and history indexes. All user inputs are bound parameters.
The app is single-owner; Access and server JWT verification protect all routes and form actions.
Keep SvelteKit's production origin checks enabled to reject cross-origin form submissions.

The server reads `env.PORTFOLIO_DB` from `cloudflare:workers`; the Cloudflare adapter emulates that
module locally. Local state lives under ignored `.wrangler/state/` and is separate from production.

```sh
npm run db:migrate
npm run dev
```

Add numbered migrations for subsequent schema changes; do not edit already-applied migrations.
Production migrations and private SQL exports are covered in [the hosting guide](cloudflare.md).

## Verification

`npm test` includes authentication tests, calendar/precision/validation tests, and database tests using
Node's SQLite engine with the real migration and repository SQL. These tests use memory-only data.
Also check actual local D1 through the browser: record a purchase, reload, create a monthly plan,
inspect month-end dates, stop the plan, and archive the purchase. Keep test records out of production.
