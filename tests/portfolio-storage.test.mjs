import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import {
	archivePurchase,
	readPortfolio,
	saveFund,
	savePlan,
	savePurchase,
	stopPlan
} from '../src/lib/server/portfolio.ts';

function database(context) {
	const sqlite = new DatabaseSync(':memory:');
	context.after(() => sqlite.close());
	sqlite.exec('PRAGMA foreign_keys = ON');
	sqlite.exec(readFileSync(new URL('../migrations/0001_portfolio.sql', import.meta.url), 'utf8'));
	// Use SQLite itself to exercise the D1 queries, constraints, and bound parameters.
	return {
		sqlite,
		prepare(sql) {
			let args = [];
			const statement = sqlite.prepare(sql);
			return {
				bind(...values) {
					args = values;
					return this;
				},
				async all() {
					return { results: statement.all(...args) };
				},
				async first() {
					return statement.get(...args) ?? null;
				},
				async run() {
					return statement.run(...args);
				}
			};
		}
	};
}

const purchase = {
	id: '8d111ac1-ddf8-4d46-8ff1-617495347cab',
	isin: 'IE00BK5BQT80',
	amount_cents: 50000,
	fee_cents: 100,
	quantity_atoms: 300_000_000,
	executed_at: '2026-01-15T10:00:00.000Z',
	local_datetime: '2026-01-15T10:00',
	source: 'manual_actual',
	notes: ''
};

test('migration seeds the initial ISIN and starts with an empty portfolio', async (context) => {
	const result = await readPortfolio(database(context));
	assert.equal(result.funds[0].isin, purchase.isin);
	assert.equal(result.totals.count, 0);
});

test('repeated submission IDs do not duplicate or overwrite purchases', async (context) => {
	const db = database(context);
	await savePurchase(db, purchase);
	await savePurchase(db, purchase);
	await assert.rejects(savePurchase(db, { ...purchase, amount_cents: 100 }));
	const result = await readPortfolio(db);
	assert.equal(result.totals.count, 1);
	assert.equal(result.totals.amount_cents, 50000);
	assert.equal(result.totals.fee_cents, 100);
});

test('archiving removes a purchase from totals while preserving its record', async (context) => {
	const db = database(context);
	await savePurchase(db, purchase);
	await archivePurchase(db, purchase.id);
	assert.equal((await readPortfolio(db)).totals.count, 0);
	assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM purchases').get().count, 1);
});

test('database constraints reject unknown funds and inconsistent provenance', async (context) => {
	const db = database(context);
	await assert.rejects(savePurchase(db, { ...purchase, isin: 'IE00UNKNOWN0' }));
	await assert.rejects(savePurchase(db, { ...purchase, quantity_atoms: null }));
});

test('stores SQL-looking notes as data', async (context) => {
	const db = database(context);
	const notes = "'); DROP TABLE funds; --";
	await savePurchase(db, { ...purchase, notes });
	const result = await readPortfolio(db);
	assert.equal(result.purchases[0].notes, notes);
	assert.equal(result.funds.length, 1);
});

test('repeated plan submissions and stop requests preserve a single plan and original cutoff', async (context) => {
	const db = database(context);
	const plan = {
		id: purchase.id,
		isin: purchase.isin,
		amount_cents: 50000,
		day_of_month: 31,
		purchase_time: '10:00',
		start_date: '2026-01-01',
		end_date: null
	};
	await savePlan(db, plan);
	await savePlan(db, plan);
	await stopPlan(db, plan.id, new Date('2026-02-01T10:00Z'));
	await stopPlan(db, plan.id, new Date('2026-03-01T10:00Z'));
	const result = await readPortfolio(db);
	assert.equal(result.plans.length, 1);
	assert.equal(result.plans[0].stopped_at, '2026-02-01T10:00:00.000Z');
});

test('adding an existing ETF keeps its original metadata', async (context) => {
	const db = database(context);
	await saveFund(db, { isin: purchase.isin, name: 'Changed name' });
	assert.equal((await readPortfolio(db)).funds.length, 1);
});
