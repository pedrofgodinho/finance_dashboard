import type {
	Fund,
	Purchase,
	PurchasePlan,
	parseFund,
	parsePlan,
	parsePurchase
} from '../portfolio.ts';

export interface PortfolioStatement {
	bind(...values: (string | number | null)[]): PortfolioStatement;
	all<T>(): Promise<{ results: T[] }>;
	first<T>(): Promise<T | null>;
	run(): Promise<unknown>;
}

export interface PortfolioDatabase {
	prepare(query: string): PortfolioStatement;
}

export class RecordConflict extends Error {}

async function confirmSaved(
	db: PortfolioDatabase,
	table: 'purchases' | 'purchase_plans',
	input: { id: string }
) {
	const stored = await db
		.prepare(`SELECT * FROM ${table} WHERE id = ?`)
		.bind(input.id)
		.first<Record<string, unknown>>();
	if (
		!stored ||
		stored.archived_at ||
		Object.entries(input).some(([key, value]) => stored[key] !== value)
	) {
		throw new RecordConflict(
			'This form was already used for a different record. Reload the page before adding another.'
		);
	}
}

export async function readPortfolio(db: PortfolioDatabase) {
	const [funds, purchases, plans, totals] = await Promise.all([
		db.prepare('SELECT * FROM funds ORDER BY name').all<Fund>(),
		db
			.prepare(
				`SELECT p.*, f.name AS fund_name FROM purchases p JOIN funds f ON f.isin = p.isin
			WHERE p.archived_at IS NULL ORDER BY p.executed_at DESC, p.created_at DESC LIMIT 200`
			)
			.all<Purchase>(),
		db
			.prepare(
				`SELECT p.*, f.name AS fund_name FROM purchase_plans p JOIN funds f ON f.isin = p.isin
			ORDER BY p.created_at DESC`
			)
			.all<PurchasePlan>(),
		db
			.prepare(
				`SELECT COALESCE(SUM(amount_cents), 0) AS amount_cents,
			COALESCE(SUM(fee_cents), 0) AS fee_cents, COUNT(*) AS count
			FROM purchases WHERE archived_at IS NULL`
			)
			.first<{ amount_cents: number; fee_cents: number; count: number }>()
	]);
	return {
		funds: funds.results,
		purchases: purchases.results,
		plans: plans.results,
		totals: totals ?? { amount_cents: 0, fee_cents: 0, count: 0 }
	};
}

export async function savePurchase(
	db: PortfolioDatabase,
	purchase: ReturnType<typeof parsePurchase>,
	now = new Date()
) {
	await db
		.prepare(
			`INSERT INTO purchases
		(id, isin, amount_cents, fee_cents, quantity_atoms, executed_at, local_datetime, source, notes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`
		)
		.bind(
			purchase.id,
			purchase.isin,
			purchase.amount_cents,
			purchase.fee_cents,
			purchase.quantity_atoms,
			purchase.executed_at,
			purchase.local_datetime,
			purchase.source,
			purchase.notes,
			now.toISOString()
		)
		.run();
	await confirmSaved(db, 'purchases', purchase);
}

export async function savePlan(
	db: PortfolioDatabase,
	plan: ReturnType<typeof parsePlan>,
	now = new Date()
) {
	await db
		.prepare(
			`INSERT INTO purchase_plans
		(id, isin, amount_cents, day_of_month, purchase_time, start_date, end_date, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`
		)
		.bind(
			plan.id,
			plan.isin,
			plan.amount_cents,
			plan.day_of_month,
			plan.purchase_time,
			plan.start_date,
			plan.end_date,
			now.toISOString()
		)
		.run();
	await confirmSaved(db, 'purchase_plans', plan);
}

export async function saveFund(db: PortfolioDatabase, fund: ReturnType<typeof parseFund>) {
	await db
		.prepare('INSERT INTO funds (isin, name) VALUES (?, ?) ON CONFLICT(isin) DO NOTHING')
		.bind(fund.isin, fund.name)
		.run();
}

export async function archivePurchase(db: PortfolioDatabase, id: string, now = new Date()) {
	await db
		.prepare('UPDATE purchases SET archived_at = COALESCE(archived_at, ?) WHERE id = ?')
		.bind(now.toISOString(), id)
		.run();
}

export async function stopPlan(db: PortfolioDatabase, id: string, now = new Date()) {
	await db
		.prepare('UPDATE purchase_plans SET stopped_at = COALESCE(stopped_at, ?) WHERE id = ?')
		.bind(now.toISOString(), id)
		.run();
}
