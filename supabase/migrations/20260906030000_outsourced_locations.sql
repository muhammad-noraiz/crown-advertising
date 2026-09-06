-- ============================================================
-- Outsourced inventory
--
-- Some sites sold to clients are bought in from another media owner rather than
-- owned by Crown. Those rows record who they come from and what Crown pays for
-- them; the sale price stays per-booking, exactly as it is for owned sites.
-- ============================================================

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_outsourced   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS outsourced_from TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price  NUMERIC(12,2);

-- An outsourced site without a named owner is a record nobody can act on.
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_outsourced_owner_check;
ALTER TABLE locations ADD CONSTRAINT locations_outsourced_owner_check
  CHECK (NOT is_outsourced OR outsourced_from IS NOT NULL);

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_purchase_price_check;
ALTER TABLE locations ADD CONSTRAINT locations_purchase_price_check
  CHECK (purchase_price IS NULL OR purchase_price >= 0);
