import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	decimalToInteger,
	InputError,
	localDateTime,
	localToInstant,
	parseFund,
	parsePlan,
	parsePurchase,
	planOccurrences,
	validDate,
	validIsin
} from '../src/lib/portfolio.ts';

const uuid = '8d111ac1-ddf8-4d46-8ff1-617495347cab';
const isin = 'IE00BK5BQT80';
const form = (entries) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) data.set(key, value);
	return data;
};
const purchase = (overrides = {}) =>
	form({
		id: uuid,
		isin,
		datetime: '2026-01-15T10:00',
		amount: '500.10',
		fee: '1',
		quantity: '',
		notes: '',
		...overrides
	});
const plan = (overrides = {}) => ({
	id: uuid,
	isin,
	fund_name: 'Vanguard',
	amount_cents: 50_000,
	day_of_month: 31,
	purchase_time: '10:00',
	start_date: '2026-01-01',
	end_date: null,
	stopped_at: null,
	...overrides
});

test('parses money and fractional quantities without floating point rounding', () => {
	assert.equal(decimalToInteger('500.10', 2, 'amount'), 50010);
	assert.equal(decimalToInteger('0,01', 2, 'amount'), 1);
	assert.equal(decimalToInteger('0.00000001', 8, 'quantity'), 1);
	assert.equal(decimalToInteger('1.23456789', 8, 'quantity'), 123456789);
});

for (const value of ['0', '-1', '1e3', '1.001', 'NaN', '1,000.50', '999999999999']) {
	test(`rejects invalid money: ${value}`, () =>
		assert.throws(() => decimalToInteger(value, 2, 'amount'), InputError));
}

test('validates ISIN checksums and rejects malformed identifiers', () => {
	assert.ok(validIsin(isin));
	assert.ok(validIsin('US0378331005'));
	assert.equal(validIsin('IE00BK5BQT81'), false);
	assert.equal(validIsin('VWCE'), false);
});

test('validates calendar dates including leap years', () => {
	assert.ok(validDate('2024-02-29'));
	assert.equal(validDate('2026-02-29'), false);
	assert.equal(validDate('2026-04-31'), false);
	assert.equal(validDate('1999-12-31'), false);
});

test('converts Lisbon wall-clock time independently of the host timezone', () => {
	assert.equal(localToInstant('2026-01-15T10:00'), '2026-01-15T10:00:00.000Z');
	assert.equal(localToInstant('2026-07-15T10:00:12'), '2026-07-15T09:00:12.000Z');
	assert.equal(localDateTime(new Date('2026-07-15T09:00:12Z')), '2026-07-15T10:00:12');
});

test('rejects nonexistent manual times and uses the first occurrence of repeated times', () => {
	assert.throws(() => localToInstant('2026-03-29T01:30'), InputError);
	assert.equal(localToInstant('2026-10-25T01:30'), '2026-10-25T00:30:00.000Z');
});

test('records unpriced purchases without fabricating units', () => {
	const result = parsePurchase(purchase(), new Date('2026-10-23T12:00Z'));
	assert.equal(result.amount_cents, 50010);
	assert.equal(result.fee_cents, 100);
	assert.equal(result.quantity_atoms, null);
	assert.equal(result.source, 'manual_unpriced');
});

test('records actual broker units when supplied', () => {
	const result = parsePurchase(purchase({ quantity: '3.456789' }));
	assert.equal(result.quantity_atoms, 345678900);
	assert.equal(result.source, 'manual_actual');
});

test('rejects future purchases and invalid quantities', () => {
	assert.throws(() => parsePurchase(purchase(), new Date('2025-01-01Z')), InputError);
	assert.throws(() => parsePurchase(purchase({ quantity: '0.000000001' })), InputError);
});

test('validates recurring plan fields and date range', () => {
	const input = {
		id: uuid,
		isin,
		amount: '50',
		day: '31',
		time: '10:00',
		start: '2026-01-01',
		end: ''
	};
	assert.equal(parsePlan(form(input)).day_of_month, 31);
	assert.throws(() => parsePlan(form({ ...input, day: '32' })), InputError);
	assert.throws(() => parsePlan(form({ ...input, time: '24:00' })), InputError);
	assert.throws(() => parsePlan(form({ ...input, end: '2025-12-31' })), InputError);
});

test('normalizes fund identifiers and requires a name', () => {
	assert.equal(parseFund(form({ isin: isin.toLowerCase(), name: '  Vanguard  ' })).isin, isin);
	assert.throws(() => parseFund(form({ isin, name: '' })), InputError);
});

test('clamps month-end plans without drifting into following months', () => {
	const dates = planOccurrences(plan(), '2026-01-01', '2026-03-31').map((item) => item.date);
	assert.deepEqual(dates, ['2026-01-31', '2026-02-28', '2026-03-31']);
	assert.equal(
		planOccurrences(plan({ start_date: '2024-01-01' }), '2024-02-01', '2024-02-29')[0].date,
		'2024-02-29'
	);
});

test('respects start, inclusive end, and stopped-at boundaries', () => {
	assert.deepEqual(
		planOccurrences(
			plan({ start_date: '2026-02-01', end_date: '2026-03-31' }),
			'2026-01-01',
			'2026-12-31'
		).map((item) => item.date),
		['2026-02-28', '2026-03-31']
	);
	assert.deepEqual(
		planOccurrences(plan({ stopped_at: '2026-03-01T00:00:00Z' }), '2026-01-01', '2026-12-31').map(
			(item) => item.date
		),
		['2026-01-31', '2026-02-28']
	);
});

test('uses stable occurrence IDs and shifts spring clock-gap schedules forward', () => {
	const input = plan({ day_of_month: 29, purchase_time: '01:30' });
	const first = planOccurrences(input, '2026-03-01', '2026-03-31')[0];
	assert.equal(first.id, `${uuid}:2026-03-29`);
	assert.equal(first.datetime, '2026-03-29T01:30:00.000Z');
	assert.deepEqual(planOccurrences(input, '2026-03-01', '2026-03-31')[0], first);
});
