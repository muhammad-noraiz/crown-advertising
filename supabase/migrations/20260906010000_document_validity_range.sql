-- ============================================================
-- Validity is a period, not just an end date
--
-- An agreement or NOC runs from one date to another. valid_until stays the
-- column the expiry alerts hang off; valid_from records where the period
-- started. Both remain optional — paperwork that never expires carries neither.
-- ============================================================

ALTER TABLE location_documents
  ADD COLUMN IF NOT EXISTS valid_from DATE;

ALTER TABLE location_documents DROP CONSTRAINT IF EXISTS location_documents_validity_range_check;
ALTER TABLE location_documents ADD CONSTRAINT location_documents_validity_range_check
  CHECK (valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until);
