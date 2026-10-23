# Project Plan

This is the living record of scope, decisions, progress, and outstanding work. Update it as work
changes. A checked item means completed work; unverified account setup remains unchecked.

Last reviewed: 2026-10-23.

## Goal and Scope

Build a private dashboard for one owner's ETF portfolio, hosted within Cloudflare's free tier.
Record past investments and estimate very long-term outcomes using historical data. It is intended
for tracking and planning; real-time quotes and trading execution are outside the current scope.

Support two ways of recording investments:

- **One-time purchases:** record a purchase of an identified ETF at a particular date/time.
- **Scheduled purchases:** define a monthly purchase for an ETF on day N, using the plan's scheduled
  date/time to estimate execution until actual broker records are available.

Actual execution prices can vary even within seconds. Initial daily-price estimates are an accepted
approximation. A later Trade Republic CSV import must reconcile actual purchases with their estimated
counterparts, so the portfolio does not count both.

## Agreed Decisions

| Area                 | Decision                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application          | SvelteKit, Svelte 5 runes, TypeScript, linting, and formatting.                                                                                      |
| Hosting              | Cloudflare Workers, targeting the free tier, at `portfolio.pmfg.pt`.                                                                                 |
| Privacy              | Single-owner access; no multi-user product or public registration.                                                                                   |
| Sign-in              | Simple Cloudflare Access email-code login; owner policy and server JWT verification.                                                                 |
| Implementation order | Hosting and privacy first, then portfolio functionality.                                                                                             |
| ETF identity         | Identify funds by ISIN; expand beyond the initial fund over time.                                                                                    |
| First ETF            | `IE00BK5BQT80`, Vanguard FTSE All-World UCITS ETF (USD) Accumulating, held through Trade Republic.                                                   |
| Prices               | Daily historical prices are sufficient initially; real-time and historical intraday data are unnecessary for the first version.                      |
| Estimated purchases  | Derive estimates from the purchase plan's date/time; label the approximation.                                                                        |
| Broker import        | Trade Republic CSV reconciliation is a later phase.                                                                                                  |
| Workflow             | Agents use separate branches/bookmarks with `feat/`, `fix/`, `refactor/`, or `chore/` prefixes and never push to `main`; the owner controls merging. |
| Documentation        | Maintain this plan, `README.md`, `AGENTS.md`, and relevant `docs/` with each change. Keep the README lean.                                           |
| Rule changes         | Standing owner rules in `AGENTS.md` require a very explicit owner instruction to change.                                                             |

An ISIN identifies the fund; Trade Republic identifies the broker. The exact exchange/listing and data
provider mapping still need confirmation. Do not infer those from the ISIN alone.

### Purchase Tracking Decisions

- Use Cloudflare D1 with prepared SQL and numbered migrations; no ORM is needed for this slice.
- First release records EUR amounts and uses `Europe/Lisbon` for manual and scheduled times.
- Clamp days 29–31 to the last day of a short month. Price estimates will use the next available
  trading day's closing price; the data provider remains undecided.
- Choose a time when creating a plan, with 10:00 as the initial form default. During the spring clock gap,
  scheduled times shift forward one hour. During the autumn overlap, use the first occurrence.
  Manual input of a nonexistent time is rejected. Store UTC alongside the original local timestamp.
- Store amounts/fees in integer cents and fractional units in integer 10⁻⁸ units.
- Separate actual broker units from unpriced records. Do not fabricate prices, quantities, or valuation.
- Derive schedule previews on read, using stable plan/date identifiers. They do not count as confirmed
  purchases. Persisting priced estimates and reconciling actual records remain future work.

## Completed Foundation

- [x] Scaffold SvelteKit with TypeScript, ESLint, Prettier, EditorConfig, and Node/npm version guidance.
- [x] Configure the official Cloudflare adapter, Wrangler, production build, and local preview.
- [x] Deploy the `finance-dashboard` Worker on the custom domain.
- [x] Configure Zero Trust team `pmfgodinho.cloudflareaccess.com`, one-time PIN, and owner-only Access.
- [x] Attach Access to the Worker and disable public `workers.dev` and preview URLs.
- [x] Verify Access JWT signatures, issuer, audience, expiry, and owner email in the server hook.
- [x] Deny access when authentication is missing/invalid or configuration is incomplete.
- [x] Apply private/no-store and no-index response headers; keep private routes server rendered.
- [x] Add 22 authentication cases using local signing keys; validate types, lint, tests, and build.
- [x] Verify signed-out requests redirect to Access without exposing dashboard data.
- [x] Create contributor guidance and Cloudflare setup documentation.
- [x] Create the GitHub repository, configure `origin`, and publish the initial `main` history.
- [x] Record permanent branch/documentation rules, create this plan, and move detailed development
      guidance out of the README.
- [x] Adopt purpose-based branch prefixes (`feat/`, `fix/`, `refactor/`, `chore/`) following the owner's
      explicit naming-rule update.
- [x] Confirm owner sign-in/sign-out and denial of access for another email (owner verification).
- [x] Connect GitHub Workers Builds to `main`; the supplied build log confirms cloning and validation.

Implementation details and account identifiers are in [the Cloudflare guide](docs/cloudflare.md).
Purchase storage and schedule previews are implemented. Historical price
integration, valuation, reconciliation, and projections remain unimplemented.

## Remaining Work

### 1. Verify Hosting Workflow

- [x] Confirm the owner can complete email-code sign-in and use sign-out.
- [x] Confirm another email cannot access the application.
- [x] Connect the existing Worker to GitHub Workers Builds for `main`.
- [x] Fix and locally verify the generated-types failure in a clean build. The first automatic build
      failed at `wrangler types --check` because its recorded type hash depends on generated Worker
      output absent from a fresh checkout. Generate ignored declarations before checks/builds instead.
      Verified an isolated clean install, full validation (22 tests), and a post-build type check.
- [x] Merge the build fix and verify automatic deployment (owner confirmed it is working).
- [ ] Consider GitHub branch protection to enforce review before `main` changes; this is an optional
      safeguard, not an implemented setting.

### 2. Decide Portfolio Data and Pricing Design

- [x] Choose D1 with prepared SQL and migrations. The owner created `finance-dashboard-portfolio`
      in the EU; its binding is `PORTFOLIO_DB`.
- [x] Define funds, purchases, monthly plans, provenance, and derived schedule occurrences.
- [ ] Define exchange listings, daily price records, persisted estimates, and reconciliation links.
- [ ] Choose a historical ETF data source and verify coverage for the initial ISIN/listing, currency,
      history length, usage limits, and price-adjustment semantics.
- [ ] Decide caching, refresh frequency, stale-data handling, and recovery when prices are unavailable.
- [x] Specify EUR amounts, fees, fractional precision, Lisbon times, and month-end rules.
- [x] Agree to the next trading day's close for estimated pricing. Implementation awaits a data source.
- [x] Generate schedule previews deterministically; use submission IDs to avoid duplicate records.
- [x] Add the first migration, local migration commands, and a remote export/backup procedure.

### 3. Implement Initial Tracking

- [x] Seed `IE00BK5BQT80` and allow adding other ETFs by validated ISIN and name.
- [x] Record one-time purchases with fees, optional actual units, and notes; retain unpriced status.
- [x] Add monthly purchase plans with day, scheduled time, amount, and active date range.
- [x] Preview upcoming and recent scheduled dates; keep these separate from recorded purchases.
- [ ] Generate clearly labelled purchase estimates using historical daily prices.
- [x] Stop plans without removing their past schedule; archive purchases without deleting their rows.
- [ ] Add purchase/plan editing with explicit history semantics.
- [x] Show recorded investment totals, current monthly contributions, and actual-unit provenance.
- [ ] Show holdings, invested contributions, valuation, and gains with data dates and provenance.
- [x] Pass full validation (49 tests), local D1 browser checks for creation/reload/stop/archive, and
      a deployment dry run. Verify the compiled local Worker rejects unsigned/spoofed identities
      and cross-origin form submissions. Synthetic browser records were removed from local storage.
- [x] Apply `0001_portfolio.sql` to production. The owner's Wrangler output on 2026-10-23
      confirms successful migration of `finance-dashboard-portfolio` (8 commands executed).
- [x] Obtain the owner's explicit instruction to publish purchase tracking directly to `main`
      on 2026-10-23. This release authorization is an exception for this operation; permanent
      branch and push rules remain unchanged.
- [ ] Verify automatic deployment and persistent records on the private deployed dashboard.

### 4. Implement Historical Projections

- [ ] Agree on the projection method and scenario assumptions before implementing calculations.
- [ ] Support long horizons and future scheduled contributions; distinguish contributions from growth.
- [ ] Assess available fund history. If a benchmark/proxy is necessary for a longer history, agree on
      it and clearly identify where it replaces the fund's own data.
- [ ] Decide whether fees, inflation, taxes, distributions, and currency effects are included.
- [ ] Handle accumulating-fund distributions consistently to avoid counting reinvestment twice.
- [ ] Present scenario ranges, assumptions, and source history clearly; avoid false execution precision.

### 5. Add Trade Republic CSV Reconciliation Later

- [ ] Inspect a representative export and map its dates/times, ISINs, amounts, quantities, and fees.
- [ ] Preview parsed records and proposed matches before applying an import.
- [ ] Make repeat imports safe and prevent duplicate actual purchases.
- [ ] Replace matched estimates with actual execution records while preserving their relationship.
- [ ] Recalculate holdings/history and leave unmatched records available for review.

## Questions Still Open

- Which exact trading venue/listing and quote currency should represent the first ETF?
- Which provider supplies suitable historical prices, and how should adjusted prices be used?
- How should foreign-currency holdings be handled after the EUR-only first release?
- What pricing, estimate reconciliation, and projection approaches best fit the agreed constraints?

Resolve these during the relevant phase; proposals above are not settled implementation choices.
