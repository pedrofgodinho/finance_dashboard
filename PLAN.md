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
No portfolio database, ETF price integration, purchase tracking, or projection engine exists yet.

## Remaining Work

### 1. Verify Hosting Workflow

- [x] Confirm the owner can complete email-code sign-in and use sign-out.
- [x] Confirm another email cannot access the application.
- [x] Connect the existing Worker to GitHub Workers Builds for `main`.
- [x] Fix and locally verify the generated-types failure in a clean build. The first automatic build
      failed at `wrangler types --check` because its recorded type hash depends on generated Worker
      output absent from a fresh checkout. Generate ignored declarations before checks/builds instead.
      Verified an isolated clean install, full validation (22 tests), and a post-build type check.
- [ ] Merge the build fix through owner review and retry the Cloudflare build.
- [ ] Verify an automatic build completes validation and deploys successfully, with previews disabled
      and Access still enforced. Intended commands: `npm run validate`, then `npx wrangler deploy`.
- [ ] Consider GitHub branch protection to enforce review before `main` changes; this is an optional
      safeguard, not an implemented setting.

### 2. Decide Portfolio Data and Pricing Design

- [ ] Choose persistent storage compatible with the free-tier target. Cloudflare D1 is a candidate;
      no database or ORM has been selected or provisioned.
- [ ] Define funds, exchange listings, purchases, recurring plans, generated occurrences, and daily
      price records, including estimate/actual provenance and reconciliation links.
- [ ] Choose a historical ETF data source and verify coverage for the initial ISIN/listing, currency,
      history length, usage limits, and price-adjustment semantics.
- [ ] Decide caching, refresh frequency, stale-data handling, and recovery when prices are unavailable.
- [ ] Specify purchase amounts, quantities, fees, currency, rounding, and fractional-unit precision.
- [ ] Specify the schedule timezone and time, handling for days 29–31, non-trading days, and which
      daily price represents execution. Daily data cannot reproduce exact intraday execution.
- [ ] Choose how occurrences are generated and ensure retries cannot duplicate purchases.
- [ ] Plan schema migrations and backup/export before storing personal portfolio records.

### 3. Implement Initial Tracking

- [ ] Add ISIN-based ETF selection, prioritizing `IE00BK5BQT80`.
- [ ] Add one-time purchase entry, distinguishing actual records from inferred execution values.
- [ ] Add monthly purchase plans with day, scheduled time, amount, and active date range.
- [ ] Generate clearly labelled purchase estimates using historical daily prices.
- [ ] Support editing/stopping plans without silently rewriting actual purchase history.
- [ ] Show holdings, invested contributions, valuation, and gains with data dates and provenance.
- [ ] Add relevant regression tests and verify the private dashboard in the Cloudflare runtime.

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
- Which timezone, execution-time default, month-end rule, and non-trading-day rule should plans use?
- Is the first release EUR-only, and how should future foreign-currency holdings be handled?
- What storage, occurrence-generation, and projection approaches best fit the agreed constraints?

Resolve these during the relevant phase; proposals above are not settled implementation choices.
