CREATE TABLE funds (
    isin TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160)
);

INSERT INTO funds (isin, name) VALUES (
    'IE00BK5BQT80', 'Vanguard FTSE All-World UCITS ETF (Acc)'
);

CREATE TABLE purchases (
    id TEXT PRIMARY KEY,
    isin TEXT NOT NULL REFERENCES funds(isin),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 100000000000),
    fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0 AND fee_cents <= 100000000000),
    quantity_atoms INTEGER CHECK (quantity_atoms > 0 AND quantity_atoms <= 100000000000000),
    executed_at TEXT NOT NULL,
    local_datetime TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Lisbon' CHECK (timezone = 'Europe/Lisbon'),
    source TEXT NOT NULL CHECK (source IN ('manual_actual', 'manual_unpriced')),
    notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
    created_at TEXT NOT NULL,
    archived_at TEXT,
    CHECK ((source = 'manual_actual' AND quantity_atoms IS NOT NULL)
        OR (source = 'manual_unpriced' AND quantity_atoms IS NULL))
);

CREATE INDEX purchases_history ON purchases (archived_at, executed_at DESC);
CREATE INDEX purchases_fund ON purchases (isin, archived_at);

CREATE TABLE purchase_plans (
    id TEXT PRIMARY KEY,
    isin TEXT NOT NULL REFERENCES funds(isin),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 100000000000),
    day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    purchase_time TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Lisbon' CHECK (timezone = 'Europe/Lisbon'),
    start_date TEXT NOT NULL,
    end_date TEXT,
    stopped_at TEXT,
    created_at TEXT NOT NULL,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX plans_fund ON purchase_plans (isin);
