-- Billing plan selected on a booking.
DO $$
BEGIN
  CREATE TYPE billing_type AS ENUM ('monthly', 'end_of_term');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Existing invoice_status is also used by the legacy booking columns.
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'PARTIAL' AFTER 'PENDING';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS billing_type billing_type NOT NULL DEFAULT 'end_of_term';

CREATE TABLE IF NOT EXISTS booking_invoices (
  id                BIGSERIAL PRIMARY KEY,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_no        TEXT NOT NULL,
  period_start      DATE,
  period_end        DATE,
  due_date          DATE NOT NULL,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_amount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= amount),
  status            invoice_status NOT NULL DEFAULT 'PENDING',
  last_payment_date DATE,
  payment_reference TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_invoices_period_check CHECK (
    period_start IS NULL OR period_end IS NULL OR period_end >= period_start
  ),
  CONSTRAINT booking_invoices_booking_number_unique UNIQUE (booking_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS booking_invoices_booking_id_idx
  ON booking_invoices (booking_id);

CREATE INDEX IF NOT EXISTS booking_invoices_due_status_idx
  ON booking_invoices (due_date, status);

DROP TRIGGER IF EXISTS booking_invoices_updated_at ON booking_invoices;
CREATE TRIGGER booking_invoices_updated_at
  BEFORE UPDATE ON booking_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE booking_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_booking_invoices"
  ON booking_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_booking_invoices"
  ON booking_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_booking_invoices"
  ON booking_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_booking_invoices"
  ON booking_invoices FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE booking_invoices TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE booking_invoices_id_seq TO authenticated;
