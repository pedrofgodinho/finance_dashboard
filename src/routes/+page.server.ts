import { error, fail } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import {
	InputError,
	localDateTime,
	parseFund,
	parsePlan,
	parsePurchase,
	planOccurrences,
	recordId
} from '#lib/portfolio.js';
import {
	archivePurchase,
	readPortfolio,
	RecordConflict,
	saveFund,
	savePlan,
	savePurchase,
	stopPlan
} from '#lib/server/portfolio.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

function database() {
	const db = env.PORTFOLIO_DB;
	if (!db) error(503, 'Your portfolio is temporarily unavailable. Please try again later.');
	return db;
}

export const load: PageServerLoad = async () => {
	let portfolio: Awaited<ReturnType<typeof readPortfolio>>;
	try {
		portfolio = await readPortfolio(database());
	} catch {
		error(503, 'Your portfolio is temporarily unavailable. Please try again later.');
	}
	const now = new Date();
	const today = localDateTime(now).slice(0, 10);
	const start = `${Math.max(2000, now.getUTCFullYear() - 1)}-01-01`;
	const end = `${Math.min(2100, now.getUTCFullYear() + 1)}-12-31`;
	const occurrences = portfolio.plans
		.flatMap((plan) => planOccurrences(plan, start, end))
		.sort((a, b) => a.datetime.localeCompare(b.datetime) || a.id.localeCompare(b.id));
	const activePlans = portfolio.plans.filter(
		(plan) => !plan.stopped_at && (!plan.end_date || plan.end_date >= today)
	);
	return {
		...portfolio,
		today,
		defaultDatetime: localDateTime(now),
		purchaseId: crypto.randomUUID(),
		planId: crypto.randomUUID(),
		monthlyCents: activePlans
			.filter((plan) => plan.start_date <= today)
			.reduce((sum, plan) => sum + plan.amount_cents, 0),
		activePlanCount: activePlans.length,
		upcoming: occurrences.filter((entry) => entry.datetime > now.toISOString()).slice(0, 6),
		pastScheduled: occurrences
			.filter((entry) => entry.datetime <= now.toISOString())
			.slice(-12)
			.reverse()
	};
};

type FormKind = 'purchase' | 'plan' | 'fund' | 'archive' | 'stop';

async function submit(event: RequestEvent, kind: FormKind) {
	const data = await event.request.formData();
	const values = Object.fromEntries(
		[...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
	);
	try {
		const db = database();
		if (kind === 'purchase' || kind === 'plan') {
			const input = kind === 'purchase' ? parsePurchase(data) : parsePlan(data);
			const fund = await db
				.prepare('SELECT isin FROM funds WHERE isin = ?')
				.bind(input.isin)
				.first();
			if (!fund)
				throw new InputError({ isin: 'Add this ETF before recording a purchase or plan.' });
			if (kind === 'purchase') await savePurchase(db, parsePurchase(data));
			else await savePlan(db, parsePlan(data));
		} else if (kind === 'fund') await saveFund(db, parseFund(data));
		else if (kind === 'archive') await archivePurchase(db, recordId(data));
		else await stopPlan(db, recordId(data));
		const messages: Record<FormKind, string> = {
			purchase: 'Purchase recorded.',
			plan: 'Monthly plan saved.',
			fund: 'ETF added to your list.',
			archive: 'Purchase archived. It is no longer included in your totals.',
			stop: 'Plan stopped. Its past schedule is preserved.'
		};
		return {
			kind,
			message: messages[kind],
			errors: {} as Record<string, string>,
			values: {} as Record<string, string>
		};
	} catch (cause) {
		if (cause instanceof RecordConflict)
			return fail(409, {
				kind,
				message: cause.message,
				errors: { id: cause.message } as Record<string, string>,
				values
			});
		if (cause instanceof InputError)
			return fail(400, { kind, message: cause.message, errors: cause.fields, values });
		return fail(503, {
			kind,
			message: 'The change could not be saved. Please try again later.',
			errors: { _form: 'The change could not be saved.' } as Record<string, string>,
			values
		});
	}
}

export const actions = {
	purchase: (event) => submit(event, 'purchase'),
	plan: (event) => submit(event, 'plan'),
	fund: (event) => submit(event, 'fund'),
	archive: (event) => submit(event, 'archive'),
	stop: (event) => submit(event, 'stop')
} satisfies Actions;
