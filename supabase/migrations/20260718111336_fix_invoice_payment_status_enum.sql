-- PostgreSQL resolves CASE string literals to text in this assignment context.
-- Cast each branch explicitly so the atomic payment RPC writes invoice_status.
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
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
  current_invoice public.booking_invoices%ROWTYPE;
  new_paid_amount NUMERIC(12,2);
BEGIN
  SELECT *
  INTO current_invoice
  FROM public.booking_invoices
  WHERE id = p_invoice_id AND booking_id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF current_invoice.status = 'CANCELLED'::public.invoice_status THEN
    RAISE EXCEPTION 'A cancelled invoice cannot receive payments.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  new_paid_amount := current_invoice.paid_amount + p_amount;
  IF new_paid_amount > current_invoice.amount THEN
    RAISE EXCEPTION 'Payment cannot exceed the outstanding invoice balance.';
  END IF;

  INSERT INTO public.invoice_payments (
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

  UPDATE public.booking_invoices
  SET
    paid_amount = new_paid_amount,
    status = CASE
      WHEN new_paid_amount >= amount THEN 'PAID'::public.invoice_status
      ELSE 'PARTIAL'::public.invoice_status
    END,
    last_payment_date = p_payment_date,
    payment_reference = NULLIF(BTRIM(p_payment_reference), '')
  WHERE id = p_invoice_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_invoice_payment(BIGINT, BIGINT, NUMERIC, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(BIGINT, BIGINT, NUMERIC, DATE, TEXT) TO authenticated;
