export const TIMEZONE = 'Europe/Lisbon';
export const CURRENCY = 'EUR';
export const QUANTITY_SCALE = 100_000_000;

export interface Fund {
	isin: string;
	name: string;
}

export interface Purchase {
	id: string;
	isin: string;
	fund_name: string;
	amount_cents: number;
	fee_cents: number;
	quantity_atoms: number | null;
	executed_at: string;
	local_datetime: string;
	source: 'manual_actual' | 'manual_unpriced';
	notes: string;
}

export interface PurchasePlan {
	id: string;
	isin: string;
	fund_name: string;
	amount_cents: number;
	day_of_month: number;
	purchase_time: string;
	start_date: string;
	end_date: string | null;
	stopped_at: string | null;
}

export class InputError extends Error {
	fields: Record<string, string>;
	constructor(fields: Record<string, string>) {
		super(Object.values(fields)[0] ?? 'Check the supplied values.');
		this.fields = fields;
	}
}

export function decimalToInteger(value: string, digits: number, field: string, allowZero = false) {
	if (!new RegExp(`^\\d{1,12}(?:[.,]\\d{1,${digits}})?$`).test(value)) {
		throw new InputError({
			[field]: `Enter a positive number with up to ${digits} decimal places.`
		});
	}
	const [whole = '', fraction = ''] = value.replace(',', '.').split('.');
	const integer = Number(
		BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0'))
	);
	const maximum = digits === 2 ? 100_000_000_000 : 100_000_000_000_000;
	if (!Number.isSafeInteger(integer) || integer > maximum || integer < (allowZero ? 0 : 1)) {
		throw new InputError({ [field]: 'Enter an amount within the supported range.' });
	}
	return integer;
}

export function validIsin(value: string) {
	if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(value)) return false;
	const digits = [...value].map((character) => parseInt(character, 36).toString()).join('');
	const total = [...digits].reverse().reduce((sum, character, index) => {
		const digit = Number(character) * (index % 2 === 1 ? 2 : 1);
		return sum + (digit > 9 ? digit - 9 : digit);
	}, 0);
	return total % 10 === 0;
}

export function validDate(value: string) {
	if (!/^20\d{2}-\d{2}-\d{2}$/.test(value) && !/^2100-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const localFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIMEZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

export function localDateTime(date: Date) {
	const parts = Object.fromEntries(
		localFormatter.formatToParts(date).map(({ type, value }) => [type, value])
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function localToInstant(value: string) {
	const normalized = value.length === 16 ? `${value}:00` : value;
	if (
		!validDate(value.slice(0, 10)) ||
		!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
	) {
		throw new InputError({ datetime: 'Enter a valid Lisbon date and time between 2000 and 2100.' });
	}
	const wallClock = Date.parse(`${normalized}Z`);
	// Derive possible offsets around this date, rather than using the browser's timezone.
	const offsets = new Set(
		[-36, -12, 0, 12, 36].map((hours) => {
			const instant = wallClock + hours * 3_600_000;
			return Date.parse(`${localDateTime(new Date(instant))}Z`) - instant;
		})
	);
	const candidates = [...offsets]
		.map((offset) => wallClock - offset)
		.filter((instant) => localDateTime(new Date(instant)) === normalized)
		.sort((a, b) => a - b);
	if (!candidates.length)
		throw new InputError({
			datetime:
				'This time does not exist in Lisbon because the clocks move forward. Choose another time.'
		});
	// During the autumn overlap, consistently use the first occurrence of the wall-clock time.
	return new Date(candidates[0]!).toISOString();
}

function text(data: FormData, name: string, maximum = 500) {
	const value = data.get(name);
	if (typeof value !== 'string' || value.length > maximum)
		throw new InputError({ [name]: 'Check this field.' });
	return value.trim();
}

export function recordId(data: FormData) {
	const value = text(data, 'id', 36);
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
		throw new InputError({ id: 'Reload the page and try again.' });
	}
	return value;
}

function isin(data: FormData) {
	const value = text(data, 'isin', 12).toUpperCase();
	if (!validIsin(value)) throw new InputError({ isin: 'Enter a valid 12-character ISIN.' });
	return value;
}

export function parsePurchase(data: FormData, now = new Date()) {
	const datetime = text(data, 'datetime', 19);
	const executedAt = localToInstant(datetime);
	if (executedAt > now.toISOString())
		throw new InputError({ datetime: 'A recorded purchase cannot be in the future.' });
	const quantity = text(data, 'quantity', 24);
	return {
		id: recordId(data),
		isin: isin(data),
		amount_cents: decimalToInteger(text(data, 'amount', 24), 2, 'amount'),
		fee_cents: decimalToInteger(text(data, 'fee', 24) || '0', 2, 'fee', true),
		quantity_atoms: quantity ? decimalToInteger(quantity, 8, 'quantity') : null,
		executed_at: executedAt,
		local_datetime: datetime,
		source: quantity ? ('manual_actual' as const) : ('manual_unpriced' as const),
		notes: text(data, 'notes')
	};
}

export function parsePlan(data: FormData) {
	const day = text(data, 'day', 2);
	const time = text(data, 'time', 5);
	const start = text(data, 'start', 10);
	const end = text(data, 'end', 10);
	if (!/^\d{1,2}$/.test(day) || Number(day) < 1 || Number(day) > 31)
		throw new InputError({ day: 'Choose a day from 1 to 31.' });
	if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
		throw new InputError({ time: 'Enter a valid purchase time.' });
	if (!validDate(start))
		throw new InputError({ start: 'Enter a valid start date between 2000 and 2100.' });
	if (end && (!validDate(end) || end < start))
		throw new InputError({ end: 'The end date must be on or after the start date.' });
	return {
		id: recordId(data),
		isin: isin(data),
		amount_cents: decimalToInteger(text(data, 'amount', 24), 2, 'amount'),
		day_of_month: Number(day),
		purchase_time: time,
		start_date: start,
		end_date: end || null
	};
}

export function parseFund(data: FormData) {
	const name = text(data, 'name', 160);
	if (!name) throw new InputError({ name: 'Enter the ETF name.' });
	return { isin: isin(data), name };
}

export interface Occurrence {
	id: string;
	plan_id: string;
	isin: string;
	fund_name: string;
	date: string;
	datetime: string;
	amount_cents: number;
}

export function planOccurrences(plan: PurchasePlan, from: string, to: string): Occurrence[] {
	const start = plan.start_date > from ? plan.start_date : from;
	const end = plan.end_date && plan.end_date < to ? plan.end_date : to;
	if (start > end) return [];
	const [startYear = 0, startMonth = 0] = start.split('-').map(Number);
	const [endYear = 0, endMonth = 0] = end.split('-').map(Number);
	const result: Occurrence[] = [];
	for (
		let monthIndex = startYear * 12 + startMonth - 1;
		monthIndex <= endYear * 12 + endMonth - 1;
		monthIndex++
	) {
		const year = Math.floor(monthIndex / 12);
		const month = monthIndex % 12;
		const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
		const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(plan.day_of_month, lastDay)).padStart(2, '0')}`;
		if (date < start || date > end) continue;
		let datetime: string;
		try {
			datetime = localToInstant(`${date}T${plan.purchase_time}`);
		} catch (error) {
			if (!(error instanceof InputError)) throw error;
			// Move a schedule falling into the spring DST gap one hour forward.
			const time = new Date(`${date}T${plan.purchase_time}:00Z`);
			time.setUTCHours(time.getUTCHours() + 1);
			datetime = localToInstant(time.toISOString().slice(0, 19));
		}
		if (plan.stopped_at && datetime > plan.stopped_at) continue;
		result.push({
			id: `${plan.id}:${date}`,
			plan_id: plan.id,
			isin: plan.isin,
			fund_name: plan.fund_name,
			date,
			datetime,
			amount_cents: plan.amount_cents
		});
	}
	return result;
}

export function money(cents: number) {
	return new Intl.NumberFormat('en-IE', { style: 'currency', currency: CURRENCY }).format(
		cents / 100
	);
}

export function units(atoms: number) {
	return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 8 }).format(
		atoms / QUANTITY_SCALE
	);
}
