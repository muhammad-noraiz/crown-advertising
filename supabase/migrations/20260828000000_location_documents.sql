-- ============================================================
-- Location Legal Documents — private storage bucket + metadata table
--
-- Unlike location-images, this bucket is PRIVATE: land agreements, NOCs and
-- ownership papers must not be readable by anyone holding the object URL.
-- Reads go through short-lived signed URLs created server side.
-- ============================================================

CREATE TABLE IF NOT EXISTS location_documents (
  id           BIGSERIAL PRIMARY KEY,
  location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,          -- path inside the bucket: {location_id}/{filename}
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS location_documents_location_idx ON location_documents(location_id);

ALTER TABLE location_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage location documents" ON location_documents;
CREATE POLICY "Authenticated users can manage location documents"
  ON location_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Private bucket, capped at 20 MB per object so a stray upload cannot fill storage.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('location-documents', 'location-documents', false, 20971520)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 20971520;

-- Storage RLS: authenticated users only, and no public SELECT policy on purpose.
DROP POLICY IF EXISTS "Authenticated users can upload location documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload location documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-documents');

DROP POLICY IF EXISTS "Authenticated users can read location documents" ON storage.objects;
CREATE POLICY "Authenticated users can read location documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'location-documents');

DROP POLICY IF EXISTS "Authenticated users can delete location documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete location documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-documents');
