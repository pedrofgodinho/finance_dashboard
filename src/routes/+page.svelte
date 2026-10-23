<script lang="ts">
	import { enhance } from '$app/forms';
	import { money, TIMEZONE, units } from '#lib/portfolio.js';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let entryMode = $derived<'purchase' | 'plan'>(form?.kind === 'plan' ? 'plan' : 'purchase');
	let saving = $state(false);
	const date = (value: string, time = false) =>
		new Intl.DateTimeFormat('en-GB', {
			timeZone: TIMEZONE,
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			...(time ? ({ hour: '2-digit', minute: '2-digit' } as const) : {})
		}).format(new Date(value));
	const value = (kind: string, name: string, fallback = '') =>
		form?.kind === kind ? (form.values[name] ?? fallback) : fallback;
	const invalid = (kind: string, name: string) => Boolean(form?.kind === kind && form.errors[name]);
	const submit = () => {
		saving = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			try {
				await update();
			} finally {
				saving = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Your portfolio | Finance Dashboard</title>
	<meta
		name="description"
		content="Your private ETF purchase history and monthly investment plans."
	/>
</svelte:head>

<main>
	<section class="intro">
		<div>
			<p class="eyebrow">PORTFOLIO OVERVIEW</p>
			<h1>A little today.<br />A longer view.</h1>
			<p class="muted">Keep your investments and monthly plans in one place.</p>
		</div>
		<div class="context">
			<span>EUR</span><span>Europe / Lisbon</span><small>All purchase times use Lisbon time.</small>
		</div>
	</section>

	<section class="metrics" aria-label="Portfolio summary">
		<article class="metric featured">
			<p>Recorded investment</p>
			<strong>{money(data.totals.amount_cents + data.totals.fee_cents)}</strong><small
				>Across {data.totals.count} recorded {data.totals.count === 1 ? 'purchase' : 'purchases'},
				including fees</small
			>
		</article>
		<article class="metric">
			<p>Monthly contributions</p>
			<strong>{money(data.monthlyCents)}<span> / month</span></strong><small
				>From plans currently in their active date range</small
			>
		</article>
		<article class="metric">
			<p>Active monthly plans</p>
			<strong
				>{data.activePlanCount}<span> {data.activePlanCount === 1 ? 'plan' : 'plans'}</span></strong
			><small>Including plans with a future start date</small>
		</article>
	</section>

	<div class="workspace">
		<section class="card entry">
			<div class="section-heading">
				<div>
					<p class="eyebrow">BUILD YOUR HISTORY</p>
					<h2>Add an investment</h2>
				</div>
				<span class="plus" aria-hidden="true">+</span>
			</div>
			<div class="switcher" role="group" aria-label="Investment type">
				<button
					type="button"
					class:selected={entryMode === 'purchase'}
					aria-pressed={entryMode === 'purchase'}
					onclick={() => (entryMode = 'purchase')}>One-time purchase</button
				>
				<button
					type="button"
					class:selected={entryMode === 'plan'}
					aria-pressed={entryMode === 'plan'}
					onclick={() => (entryMode = 'plan')}>Monthly plan</button
				>
			</div>
			{#if form?.message}<p
					class="message"
					class:failure={Object.keys(form.errors).length > 0}
					role="status"
				>
					{form.message}
				</p>{/if}
			{#if entryMode === 'purchase'}
				<form method="POST" action="?/purchase" use:enhance={submit}>
					<input type="hidden" name="id" value={value('purchase', 'id', data.purchaseId)} />
					<label
						>ETF<select
							name="isin"
							required
							aria-invalid={invalid('purchase', 'isin')}
							value={value('purchase', 'isin', 'IE00BK5BQT80')}
							>{#each data.funds as fund (fund.isin)}<option value={fund.isin}
									>{fund.name} · {fund.isin}</option
								>{/each}</select
						></label
					>
					<label
						>Purchase date and time<input
							type="datetime-local"
							name="datetime"
							step="1"
							min="2000-01-01T00:00"
							max={`${data.today}T23:59:59`}
							value={value('purchase', 'datetime', data.defaultDatetime)}
							required
							aria-invalid={invalid('purchase', 'datetime')}
						/><small>Europe/Lisbon, including daylight saving time</small></label
					>
					<div class="fields">
						<label
							>ETF amount (€)<input
								name="amount"
								inputmode="decimal"
								placeholder="500.00"
								required
								value={value('purchase', 'amount')}
								aria-invalid={invalid('purchase', 'amount')}
							/><small>Amount spent on units, excluding fees</small></label
						><label
							>Fees (€)<input
								name="fee"
								inputmode="decimal"
								placeholder="0.00"
								value={value('purchase', 'fee', '0.00')}
								aria-invalid={invalid('purchase', 'fee')}
							/></label
						>
					</div>
					<label
						><span>Units bought <span class="optional">Optional</span></span><input
							name="quantity"
							inputmode="decimal"
							placeholder="e.g. 3.456789"
							value={value('purchase', 'quantity')}
							aria-invalid={invalid('purchase', 'quantity')}
						/><small>Enter the actual units from your broker. Leave blank if unknown.</small></label
					>
					<label
						><span>Note <span class="optional">Optional</span></span><textarea
							name="notes"
							rows="2"
							maxlength="500"
							placeholder="Anything you’d like to remember"
							value={value('purchase', 'notes')}></textarea></label
					>
					<button class="primary" disabled={saving}
						>{saving ? 'Saving…' : 'Record purchase'} <span aria-hidden="true">↗</span></button
					>
				</form>
			{:else}
				<form method="POST" action="?/plan" use:enhance={submit}>
					<input type="hidden" name="id" value={value('plan', 'id', data.planId)} />
					<label
						>ETF<select
							name="isin"
							required
							value={value('plan', 'isin', 'IE00BK5BQT80')}
							aria-invalid={invalid('plan', 'isin')}
							>{#each data.funds as fund (fund.isin)}<option value={fund.isin}
									>{fund.name} · {fund.isin}</option
								>{/each}</select
						></label
					>
					<label
						>Monthly ETF amount (€)<input
							name="amount"
							inputmode="decimal"
							placeholder="500.00"
							required
							value={value('plan', 'amount')}
							aria-invalid={invalid('plan', 'amount')}
						/></label
					>
					<div class="fields">
						<label
							>Day of month<input
								type="number"
								name="day"
								min="1"
								max="31"
								required
								value={value('plan', 'day', '1')}
								aria-invalid={invalid('plan', 'day')}
							/></label
						><label
							>Purchase time<input
								type="time"
								name="time"
								required
								value={value('plan', 'time', '10:00')}
								aria-invalid={invalid('plan', 'time')}
							/></label
						>
					</div>
					<div class="fields">
						<label
							>Start date<input
								type="date"
								name="start"
								min="2000-01-01"
								max="2100-12-31"
								required
								value={value('plan', 'start', data.today)}
								aria-invalid={invalid('plan', 'start')}
							/></label
						><label
							><span>End date <span class="optional">Optional</span></span><input
								type="date"
								name="end"
								min="2000-01-01"
								max="2100-12-31"
								value={value('plan', 'end')}
								aria-invalid={invalid('plan', 'end')}
							/></label
						>
					</div>
					<div class="hint">
						<strong>Your schedule, consistently.</strong>
						<p>
							Short months use their last day. Times follow Lisbon’s clock. Future price estimates
							will use the next available trading day’s close.
						</p>
					</div>
					<button class="primary" disabled={saving}
						>{saving ? 'Saving…' : 'Create monthly plan'} <span aria-hidden="true">↗</span></button
					>
				</form>
			{/if}
			<details class="add-fund" open={form?.kind === 'fund'}>
				<summary>Add another ETF by ISIN</summary>
				<form method="POST" action="?/fund" use:enhance={submit}>
					<label
						>ISIN<input
							name="isin"
							maxlength="12"
							minlength="12"
							required
							placeholder="IE00BK5BQT80"
							value={value('fund', 'isin')}
							aria-invalid={invalid('fund', 'isin')}
						/></label
					><label
						>ETF name<input
							name="name"
							maxlength="160"
							required
							placeholder="ETF name"
							value={value('fund', 'name')}
							aria-invalid={invalid('fund', 'name')}
						/></label
					>
					<p class="form-note">
						This version records EUR purchases. Adding an ETF does not connect price data.
					</p>
					<button class="primary" disabled={saving}>Add ETF</button>
				</form>
			</details>
		</section>

		<div class="right-column">
			<section class="card">
				<div class="section-heading">
					<div>
						<p class="eyebrow">LOOKING AHEAD</p>
						<h2>Next planned purchases</h2>
					</div>
					<span class="count">{data.upcoming.length}</span>
				</div>
				{#if data.upcoming.length}<div class="schedule">
						{#each data.upcoming as occurrence (occurrence.id)}<article class="schedule-row">
								<div class="date-tile">
									<strong>{occurrence.date.slice(8)}</strong><span
										>{new Intl.DateTimeFormat('en', { month: 'short', timeZone: TIMEZONE }).format(
											new Date(occurrence.datetime)
										)}</span
									>
								</div>
								<div class="schedule-info">
									<strong>{occurrence.fund_name}</strong><small
										>{date(occurrence.datetime, true)} · Lisbon</small
									><span class="badge neutral">Scheduled · units pending</span>
								</div>
								<strong class="amount">{money(occurrence.amount_cents)}</strong>
							</article>{/each}
					</div>
					<p class="form-note">
						Showing up to six dates through the next calendar year. These are plans, not confirmed
						executions.
					</p>{:else}<div class="empty">
						<span class="empty-symbol" aria-hidden="true">↗</span>
						<h3>
							{data.activePlanCount ? 'No dates in this preview.' : 'Make investing a habit.'}
						</h3>
						<p>
							{data.activePlanCount
								? 'Your plans have no remaining dates through the next calendar year.'
								: 'Create a monthly plan to see your next contributions here.'}
						</p>
					</div>{/if}
			</section>
			<section class="card">
				<div class="section-heading">
					<div>
						<p class="eyebrow">STEADY CONTRIBUTIONS</p>
						<h2>Your monthly plans</h2>
					</div>
				</div>
				{#if !data.plans.length}<p class="quiet-empty">
						No monthly plans yet. Start with an amount and a day that works for you.
					</p>{/if}
				{#each data.plans as plan (plan.id)}
					<div class="plan">
						<div>
							<strong>{plan.fund_name}</strong><small
								>Day {plan.day_of_month} · {plan.purchase_time} Lisbon · {money(
									plan.amount_cents
								)}/month</small
							><small>From {plan.start_date}{plan.end_date ? ` until ${plan.end_date}` : ''}</small>
						</div>
						{#if plan.stopped_at}<span class="badge neutral">Stopped</span
							>{:else if plan.end_date && plan.end_date < data.today}<span class="badge neutral"
								>Ended</span
							>{:else}<form method="POST" action="?/stop" use:enhance={submit}>
								<input type="hidden" name="id" value={plan.id} /><button
									class="subtle"
									disabled={saving}
									aria-label={`Stop monthly plan for ${plan.fund_name}`}>Stop plan</button
								>
							</form>{/if}
					</div>
				{/each}
				{#if data.pastScheduled.length}<details class="past">
						<summary>Past planned dates</summary>
						<p class="form-note">
							These dates are assumptions from your plans. Recorded totals include only entries in
							purchase history.
						</p>
						{#each data.pastScheduled as occurrence (occurrence.id)}<div class="past-row">
								<span>{date(occurrence.datetime)}<small>{occurrence.fund_name}</small></span><strong
									>{money(occurrence.amount_cents)}</strong
								>
							</div>{/each}
						<p class="form-note">
							Latest 12 dates, back to the previous calendar year. Price data and reconciliation are
							still to come.
						</p>
					</details>{/if}
			</section>
		</div>
	</div>

	<section class="card history">
		<div class="section-heading">
			<div>
				<p class="eyebrow">YOUR INVESTMENT RECORD</p>
				<h2>Purchase history</h2>
			</div>
			<span class="count"
				>{data.totals.count} {data.totals.count === 1 ? 'purchase' : 'purchases'}</span
			>
		</div>
		{#if !data.purchases.length}<div class="empty history-empty">
				<span class="empty-symbol" aria-hidden="true">+</span>
				<h3>Your first entry starts the story.</h3>
				<p>
					Record a past purchase above. Add actual units now, or leave it unpriced until price
					history is connected.
				</p>
			</div>{:else}<div class="table-scroll" role="region" aria-label="Purchase history">
				<table>
					<thead
						><tr
							><th>Purchase</th><th>ETF amount</th><th>Units</th><th>Record type</th><th
								><span class="sr-only">Actions</span></th
							></tr
						></thead
					><tbody
						>{#each data.purchases as purchase (purchase.id)}<tr
								><td
									><strong>{purchase.fund_name}</strong><small
										>{purchase.isin} · {date(purchase.executed_at, true)} Lisbon</small
									>{#if purchase.notes}<small class="note">{purchase.notes}</small>{/if}</td
								><td class="numeric"
									><strong>{money(purchase.amount_cents)}</strong><small
										>{money(purchase.fee_cents)} fees</small
									></td
								><td class="numeric"
									>{purchase.quantity_atoms === null ? '—' : units(purchase.quantity_atoms)}</td
								><td
									><span class="badge" class:neutral={purchase.quantity_atoms === null}
										>{purchase.quantity_atoms === null
											? 'Awaiting price data'
											: 'Actual units'}</span
									></td
								><td
									><form method="POST" action="?/archive" use:enhance={submit}>
										<input type="hidden" name="id" value={purchase.id} /><button
											class="subtle"
											disabled={saving}
											aria-label={`Archive ${purchase.fund_name} purchase from ${date(purchase.executed_at)}`}
											>Archive</button
										>
									</form></td
								></tr
							>{/each}</tbody
					>
				</table>
			</div>
			<p class="form-note">
				Showing the latest {data.purchases.length} active records. Totals include all recorded purchases
				and their fees.
			</p>{/if}
	</section>
	<footer>
		<span>One portfolio. A long horizon.</span><span
			>Historical prices and long-term projections are the next step.</span
		>
	</footer>
</main>

<style>
	main {
		max-width: 1260px;
		margin: 0 auto;
		padding: 2.8rem 1.5rem 1rem;
	}
	.intro {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 2rem;
		margin-bottom: 2rem;
	}
	.eyebrow {
		color: var(--muted);
		font-size: 0.64rem;
		font-weight: 650;
		letter-spacing: 0.15em;
		margin: 0 0 0.65rem;
	}
	h1 {
		font-weight: 550;
		font-size: clamp(2rem, 4vw, 3.1rem);
		letter-spacing: -0.05em;
		line-height: 1.14;
		margin: 0;
	}
	.intro p.muted {
		font-size: 0.88rem;
		margin: 1rem 0 0;
	}
	.context {
		text-align: right;
		white-space: nowrap;
		padding-bottom: 0.25rem;
	}
	.context > span {
		display: inline-block;
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		margin-left: 0.4rem;
		font-size: 0.74rem;
		background: white;
	}
	.context small {
		display: block;
		color: var(--muted);
		margin-top: 0.6rem;
		font-size: 0.7rem;
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.metric {
		background: white;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
	}
	.metric p {
		margin: 0 0 1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.metric > strong {
		display: block;
		font-size: clamp(1.75rem, 3vw, 2.3rem);
		letter-spacing: -0.05em;
		font-weight: 550;
		font-variant-numeric: tabular-nums;
	}
	.metric strong span {
		margin-left: 0.25rem;
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--muted);
		letter-spacing: 0;
	}
	.metric > small {
		display: block;
		color: var(--muted);
		margin-top: 0.8rem;
		font-size: 0.68rem;
	}
	.featured {
		background: var(--green);
		border-color: var(--green);
		color: white;
	}
	.featured p,
	.featured > small {
		color: #d4e8df;
	}
	.workspace {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		gap: 1.5rem;
		align-items: start;
	}
	.card {
		background: white;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		min-width: 0;
	}
	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.3rem;
	}
	.section-heading .eyebrow {
		margin-bottom: 0.35rem;
	}
	h2 {
		font-size: 1.1rem;
		letter-spacing: -0.025em;
		font-weight: 600;
		margin: 0;
	}
	.plus {
		font-size: 1.8rem;
		font-weight: 300;
		color: var(--green);
	}
	.count {
		font-size: 0.7rem;
		color: var(--muted);
		background: #f3f6f5;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 0.3rem 0.5rem;
		white-space: nowrap;
	}
	.switcher {
		display: flex;
		background: #f1f5f3;
		border-radius: 7px;
		padding: 4px;
		margin-bottom: 1.4rem;
		gap: 4px;
	}
	.switcher button {
		flex: 1;
		padding: 0.55rem;
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font-size: 0.78rem;
	}
	.switcher .selected {
		background: white;
		color: var(--green);
		box-shadow: 0 1px 4px #1a3c2f12;
		font-weight: 600;
	}
	.entry form {
		display: grid;
		gap: 1rem;
	}
	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.optional {
		font-size: 0.67rem;
		color: var(--muted);
		font-weight: 400;
	}
	.hint {
		background: #f4f7f5;
		padding: 0.85rem 1rem;
		border-radius: 7px;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.hint strong {
		color: var(--ink);
		font-size: 0.76rem;
	}
	.hint p {
		margin: 0.3rem 0 0;
	}
	.primary span {
		float: right;
	}
	.add-fund {
		border-top: 1px solid var(--border);
		margin-top: 1.5rem;
		padding-top: 1rem;
	}
	summary {
		cursor: pointer;
		font-size: 0.78rem;
		color: var(--green);
		font-weight: 550;
	}
	.add-fund form {
		margin-top: 1rem;
	}
	.form-note {
		font-size: 0.7rem;
		color: var(--muted);
		line-height: 1.6;
		margin: 0.7rem 0 0;
	}
	.message {
		font-size: 0.8rem;
		background: var(--green-light);
		color: var(--green);
		padding: 0.75rem;
		border-radius: 6px;
	}
	.failure {
		background: #fff0ed;
		color: #9e3434;
	}
	.right-column {
		display: grid;
		gap: 1.5rem;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.6rem 1.4rem 2rem;
	}
	.empty-symbol {
		display: grid;
		place-content: center;
		width: 48px;
		height: 48px;
		background: var(--green-light);
		border-radius: 13px;
		font-size: 1.5rem;
		color: var(--green);
		font-weight: 300;
		margin-bottom: 0.7rem;
	}
	h3 {
		font-size: 0.95rem;
		font-weight: 550;
		margin: 0.3rem 0;
	}
	.empty p {
		font-size: 0.78rem;
		max-width: 24rem;
		color: var(--muted);
		margin: 0.3rem 0 0;
	}
	.quiet-empty {
		font-size: 0.8rem;
		color: var(--muted);
		margin: 0;
		padding: 0.3rem 0;
	}
	.schedule-row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem 0;
		border-top: 1px solid #eef2f0;
	}
	.date-tile {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		background: #f3f6f5;
		border: 1px solid var(--border);
		border-radius: 8px;
		width: 46px;
		padding: 0.35rem;
	}
	.date-tile strong {
		font-size: 1.1rem;
		font-weight: 550;
	}
	.date-tile span {
		font-size: 0.6rem;
		text-transform: uppercase;
		color: var(--muted);
	}
	.schedule-info {
		flex: 1;
		min-width: 0;
	}
	.schedule-info > strong {
		font-size: 0.78rem;
		font-weight: 550;
		display: block;
	}
	.schedule-info > small {
		display: block;
		color: var(--muted);
		font-size: 0.65rem;
		margin: 0.2rem 0;
	}
	.amount {
		font-size: 0.85rem;
		font-weight: 550;
		white-space: nowrap;
	}
	.badge {
		display: inline-block;
		background: var(--green-light);
		color: var(--green);
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-size: 0.6rem;
		font-weight: 500;
		white-space: nowrap;
	}
	.badge.neutral {
		background: #f3f4ed;
		color: #6e6d4c;
	}
	.plan {
		border-top: 1px solid #eef2f0;
		padding: 1rem 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.plan > div {
		min-width: 0;
	}
	.plan strong {
		font-size: 0.8rem;
		font-weight: 550;
	}
	.plan small {
		display: block;
		font-size: 0.68rem;
		color: var(--muted);
		margin-top: 0.25rem;
	}
	.plan .subtle {
		white-space: nowrap;
	}
	.past {
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}
	.past-row {
		display: flex;
		justify-content: space-between;
		gap: 0.6rem;
		margin-top: 0.7rem;
		font-size: 0.75rem;
	}
	.past-row small {
		display: block;
		color: var(--muted);
		font-size: 0.66rem;
	}
	.history {
		margin-top: 1.5rem;
	}
	.history-empty {
		padding-block: 2.5rem;
	}
	.table-scroll {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		text-align: left;
		font-size: 0.78rem;
	}
	th {
		color: var(--muted);
		font-size: 0.66rem;
		font-weight: 500;
		padding: 0.6rem 0.6rem 1rem;
		border-bottom: 1px solid var(--border);
	}
	td {
		padding: 1rem 0.6rem;
		border-bottom: 1px solid #eef2f0;
		vertical-align: middle;
	}
	td:first-child {
		min-width: 235px;
	}
	td strong {
		font-size: 0.8rem;
		font-weight: 550;
	}
	td small {
		display: block;
		color: var(--muted);
		font-size: 0.67rem;
		margin-top: 0.3rem;
	}
	.numeric {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.note {
		max-width: 26rem;
		overflow-wrap: anywhere;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
	}
	footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.65rem;
		color: var(--muted);
		padding: 1.5rem 0.1rem 0.5rem;
	}
	@media (max-width: 850px) {
		.workspace {
			grid-template-columns: 1fr;
		}
		.intro {
			align-items: start;
		}
		.context {
			white-space: normal;
		}
		.metric {
			padding: 1.1rem;
		}
	}
	@media (max-width: 560px) {
		main {
			padding-top: 1.7rem;
		}
		.intro {
			display: block;
		}
		.context {
			text-align: left;
			margin-top: 1rem;
		}
		.context > span {
			margin: 0 0.4rem 0 0;
		}
		.context small {
			display: none;
		}
		.metrics {
			grid-template-columns: 1fr;
			gap: 0.65rem;
		}
		.metric p {
			margin-bottom: 0.4rem;
		}
		.metric > small {
			margin-top: 0.4rem;
		}
		.card {
			padding: 1.1rem;
		}
		.fields {
			gap: 0.6rem;
		}
		footer {
			flex-direction: column;
		}
	}
</style>
