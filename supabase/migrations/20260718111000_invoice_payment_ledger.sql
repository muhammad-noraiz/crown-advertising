-- Keep an immutable payment ledger so accounts reports can show cash receipts
-- for an exact date range instead of assigning the full paid balance to the
-- invoice's latest payment date.
CREATE TABLE IF NOT EXISTS invoice_payments (
  id                BIGSERIAL PRIMARY KEY,
  invoice_id        BIGINT NOT NULL REFERENCES booking_invoices(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date      DATE NOT NULL,
  payment_reference TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_payments_invoice_id_idx
  ON invoice_payments (invoice_id);

CREATE INDEX IF NOT EXISTS invoice_payments_payment_date_idx
  ON invoice_payments (payment_date);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_invoice_payments"
  ON invoice_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_invoice_payments"
  ON invoice_payments FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON TABLE invoice_payments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE invoice_payments_id_seq TO authenticated;

-- Preserve payments recorded before this ledger existed as one opening entry.
INSERT INTO invoice_payments (
  invoice_id,
  amount,
  payment_date,
  payment_reference,
  notes
)
SELECT
  id,
  paid_amount,
  COALESCE(last_payment_date, updated_at::date),
  payment_reference,
  'Opening payment balance migrated from invoice'
FROM booking_invoices
WHERE paid_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM invoice_payments payment WHERE payment.invoice_id = booking_invoices.id
  );

-- Atomically record the ledger entry and update the invoice balance.
CREATE OR REPLACE FUNCTION record_invoice_payment(
  p_invoice_id BIGINT,
  p_booking_id BIGINT,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_invoice booking_invoices%ROWTYPE;
  new_paid_amount NUMERIC(12,2);
BEGIN
  SELECT *
  INTO current_invoice
  FROM booking_invoices
  WHERE id = p_invoice_id AND booking_id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF current_invoice.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'A cancelled invoice cannot receive payments.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  new_paid_amount := current_invoice.paid_amount + p_amount;
  IF new_paid_amount > current_invoice.amount THEN
    RAISE EXCEPTION 'Payment cannot exceed the outstanding invoice balance.';
  END IF;

  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_date,
    payment_reference
  ) VALUES (
    p_invoice_id,
    p_amount,
    p_payment_date,
    NULLIF(BTRIM(p_payment_reference), '')
  );

  UPDATE booking_invoices
  SET
    paid_amount = new_paid_amount,
    status = CASE WHEN new_paid_amount >= amount THEN 'PAID' ELSE 'PARTIAL' END,
    last_payment_date = p_payment_date,
    payment_reference = NULLIF(BTRIM(p_payment_reference), '')
  WHERE id = p_invoice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_invoice_payment(BIGINT, BIGINT, NUMERIC, DATE, TEXT) TO authenticated;
