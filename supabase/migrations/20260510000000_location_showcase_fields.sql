-- Public location showcase inventory fields.
-- These columns let the client-facing showcase and generated PPT use the
-- actual locations table instead of a static presentation extract.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS price_per_month NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS price_label TEXT,
  ADD COLUMN IF NOT EXISTS pricing_basis TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS facing_from TEXT,
  ADD COLUMN IF NOT EXISTS facing_towards TEXT,
  ADD COLUMN IF NOT EXISTS media_category TEXT NOT NULL DEFAULT 'static',
  ADD COLUMN IF NOT EXISTS source_slide INTEGER,
  ADD COLUMN IF NOT EXISTS public_image_path TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS locations_source_slide_key
  ON locations(source_slide);

CREATE INDEX IF NOT EXISTS locations_public_showcase_idx
  ON locations(is_active, city, media_category);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'locations_pricing_basis_check'
  ) THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_pricing_basis_check
      CHECK (pricing_basis IN ('monthly', 'slot', 'on_request'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'locations_media_category_check'
  ) THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_media_category_check
      CHECK (media_category IN ('static', 'motorway', 'digital', 'bridge-panel', 'toll-plaza'));
  END IF;
END $$;
