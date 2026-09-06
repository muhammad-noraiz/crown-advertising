-- ============================================================
-- Legal document classification + validity period
--
-- Paperwork is filed by kind (NOC, stability certificate, rental agreement,
-- tax receipt) and some kinds expire. valid_until stays NULL for the
-- documents that never do — ownership papers, one-off certificates — so the
-- expiry feed can simply ignore NULL rows.
-- ============================================================

ALTER TABLE location_documents
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS valid_until   DATE;

ALTER TABLE location_documents DROP CONSTRAINT IF EXISTS location_documents_document_type_check;
ALTER TABLE location_documents ADD CONSTRAINT location_documents_document_type_check
  CHECK (document_type IN ('noc', 'stability_certificate', 'rental', 'tax', 'other'));

-- The alerts page scans every location for paperwork expiring soon; rows with
-- no validity period are dead weight in that scan, so keep them out of the index.
CREATE INDEX IF NOT EXISTS location_documents_valid_until_idx
  ON location_documents(valid_until) WHERE valid_until IS NOT NULL;
