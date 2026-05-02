-- ParkX complete PostgreSQL schema
-- Creates every table required by the current app:
--   users, vehicles, slots, bookings
-- Includes constraints, indexes, and base slot seed data.
-- Safe to run multiple times.

BEGIN;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Slots
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    area CHAR(1) NOT NULL,
    slot_number INTEGER NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'slots_area_check'
    ) THEN
        ALTER TABLE slots
            ADD CONSTRAINT slots_area_check
            CHECK (LOWER(area) IN ('a', 'b', 'c'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'slots_slot_number_positive_check'
    ) THEN
        ALTER TABLE slots
            ADD CONSTRAINT slots_slot_number_positive_check
            CHECK (slot_number > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'slots_area_slot_number_unique'
    ) THEN
        ALTER TABLE slots
            ADD CONSTRAINT slots_area_slot_number_unique UNIQUE (area, slot_number);
    END IF;
END $$;

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    model VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'vehicles_vehicle_number_unique'
    ) THEN
        ALTER TABLE vehicles
            ADD CONSTRAINT vehicles_vehicle_number_unique UNIQUE (vehicle_number);
    END IF;
END $$;

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    slot_id INTEGER NOT NULL REFERENCES slots(id),
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    total_amount NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    pricing_rate_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_status_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_status_check
            CHECK (status IN ('active', 'completed', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_payment_status_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_payment_status_check
            CHECK (payment_status IN ('pending', 'paid'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_duration_minutes_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_duration_minutes_check
            CHECK (duration_minutes IS NULL OR duration_minutes >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_total_amount_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_total_amount_check
            CHECK (total_amount IS NULL OR total_amount >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_pricing_rate_per_hour_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_pricing_rate_per_hour_check
            CHECK (pricing_rate_per_hour >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_exit_after_entry_check'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_exit_after_entry_check
            CHECK (exit_time IS NULL OR exit_time >= entry_time);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_slots_area ON slots(area);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_entry_time ON bookings(entry_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_active_vehicle
ON bookings(vehicle_id)
WHERE status = 'active';

-- Seed slot inventory expected by the app bootstrap
INSERT INTO slots (area, slot_number)
SELECT seeded.area, seeded.slot_number
FROM (
    SELECT 'a'::CHAR(1) AS area, gs AS slot_number
    FROM generate_series(1, 35) AS gs
    UNION ALL
    SELECT 'b'::CHAR(1) AS area, gs AS slot_number
    FROM generate_series(1, 46) AS gs
    UNION ALL
    SELECT 'c'::CHAR(1) AS area, gs AS slot_number
    FROM generate_series(1, 30) AS gs
) AS seeded
ON CONFLICT (area, slot_number) DO NOTHING;

COMMIT;
