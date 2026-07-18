-- Harden an existing trigger helper and remove public object listing. Public
-- image URLs continue to work because the bucket itself is public.
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

DROP POLICY IF EXISTS "Location images are publicly readable" ON storage.objects;
