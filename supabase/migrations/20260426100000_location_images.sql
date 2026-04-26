-- ============================================================
-- Location Images — storage bucket + metadata table
-- ============================================================

CREATE TABLE IF NOT EXISTS location_images (
  id           BIGSERIAL PRIMARY KEY,
  location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,          -- path inside the bucket: {location_id}/{filename}
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL DEFAULT 'image/jpeg',
  size_bytes   BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS location_images_location_idx ON location_images(location_id);

-- RLS
ALTER TABLE location_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage location images"
  ON location_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage bucket (idempotent via DO block)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('location-images', 'location-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage RLS: allow authenticated users to upload/read/delete
CREATE POLICY "Authenticated users can upload location images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Location images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'location-images');

CREATE POLICY "Authenticated users can delete location images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-images');
