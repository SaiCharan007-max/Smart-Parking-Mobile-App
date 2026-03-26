-- Booking billing + payment simulation fields
-- Run once on your PostgreSQL database for ParkX backend.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pricing_rate_per_hour NUMERIC(10,2) NOT NULL DEFAULT 20.00;

-- Ensure completed rows are marked correctly if exit_time already existed.
UPDATE bookings
SET status = 'completed'
WHERE exit_time IS NOT NULL AND status <> 'completed';

-- Ensure active rows are marked correctly when exit_time is missing.
UPDATE bookings
SET status = 'active'
WHERE exit_time IS NULL AND status <> 'active';

-- One active booking per vehicle at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_active_vehicle
ON bookings(vehicle_id)
WHERE status = 'active';

-- Optional: payment status checks for consistency.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;

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
END $$;
