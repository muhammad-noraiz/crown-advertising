-- Management roles and granular dashboard access.
DO $$
BEGIN
  CREATE TYPE management_role AS ENUM ('super_admin', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE dashboard_permission AS ENUM (
    'overview',
    'locations',
    'bookings',
    'clients',
    'accounts'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS management_users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role         management_role NOT NULL DEFAULT 'custom',
  permissions  dashboard_permission[] NOT NULL DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS management_users_role_idx ON management_users(role);

DROP TRIGGER IF EXISTS management_users_updated_at ON management_users;
CREATE TRIGGER management_users_updated_at
  BEFORE UPDATE ON management_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE management_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "management_users_read_own_profile" ON management_users;
CREATE POLICY "management_users_read_own_profile"
  ON management_users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

REVOKE ALL ON TABLE management_users FROM anon, authenticated;
GRANT SELECT ON TABLE management_users TO authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

-- RLS helper. It is private, checks auth.uid(), and exposes only a boolean.
CREATE OR REPLACE FUNCTION private.has_any_dashboard_permission(requested dashboard_permission[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.management_users
    WHERE id = (SELECT auth.uid())
      AND (
        role = 'super_admin'
        OR permissions && requested
      )
  );
$$;

REVOKE ALL ON FUNCTION private.has_any_dashboard_permission(dashboard_permission[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_any_dashboard_permission(dashboard_permission[]) TO authenticated;

-- Existing installations keep working: the earliest Auth user becomes Super
-- Admin and any other existing users keep full module access until customized.
WITH ranked_users AS (
  SELECT
    id,
    email,
    raw_user_meta_data,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at, id) AS position
  FROM auth.users
)
INSERT INTO management_users (id, email, display_name, role, permissions)
SELECT
  id,
  COALESCE(email, id::TEXT || '@management.local'),
  COALESCE(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name', SPLIT_PART(COALESCE(email, ''), '@', 1)),
  CASE WHEN position = 1 THEN 'super_admin'::management_role ELSE 'custom'::management_role END,
  ARRAY['overview', 'locations', 'bookings', 'clients', 'accounts']::dashboard_permission[]
FROM ranked_users
ON CONFLICT (id) DO NOTHING;

-- Every Auth user receives a profile. The first ever user is bootstrapped as
-- Super Admin; users subsequently created by the app are assigned permissions
-- immediately by the privileged server action.
CREATE OR REPLACE FUNCTION private.handle_new_management_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role public.management_role;
  assigned_permissions public.dashboard_permission[];
BEGIN
  IF EXISTS (SELECT 1 FROM public.management_users WHERE role = 'super_admin') THEN
    assigned_role := 'custom';
    assigned_permissions := '{}'::public.dashboard_permission[];
  ELSE
    assigned_role := 'super_admin';
    assigned_permissions := ARRAY['overview', 'locations', 'bookings', 'clients', 'accounts']::public.dashboard_permission[];
  END IF;

  INSERT INTO public.management_users (id, email, display_name, role, permissions)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::TEXT || '@management.local'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)),
    assigned_role,
    assigned_permissions
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_management_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_management_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_management_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_management_user();

-- Replace broad authenticated policies with module-aware authorization.
DROP POLICY IF EXISTS "auth_select_locations" ON locations;
DROP POLICY IF EXISTS "auth_insert_locations" ON locations;
DROP POLICY IF EXISTS "auth_update_locations" ON locations;
DROP POLICY IF EXISTS "auth_delete_locations" ON locations;
CREATE POLICY "permission_select_locations" ON locations FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'locations', 'bookings', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_locations" ON locations FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_update_locations" ON locations FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_delete_locations" ON locations FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_bookings" ON bookings;
DROP POLICY IF EXISTS "auth_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "auth_update_bookings" ON bookings;
DROP POLICY IF EXISTS "auth_delete_bookings" ON bookings;
CREATE POLICY "permission_select_bookings" ON bookings FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'bookings', 'clients', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_bookings" ON bookings FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));
CREATE POLICY "permission_update_bookings" ON bookings FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));
CREATE POLICY "permission_delete_bookings" ON bookings FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_clients" ON clients;
DROP POLICY IF EXISTS "auth_insert_clients" ON clients;
DROP POLICY IF EXISTS "auth_update_clients" ON clients;
DROP POLICY IF EXISTS "auth_delete_clients" ON clients;
CREATE POLICY "permission_select_clients" ON clients FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'bookings', 'clients']::dashboard_permission[])));
CREATE POLICY "permission_insert_clients" ON clients FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['clients']::dashboard_permission[])));
CREATE POLICY "permission_update_clients" ON clients FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['clients']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['clients']::dashboard_permission[])));
CREATE POLICY "permission_delete_clients" ON clients FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['clients']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_expenses" ON location_expenses;
DROP POLICY IF EXISTS "auth_insert_expenses" ON location_expenses;
DROP POLICY IF EXISTS "auth_update_expenses" ON location_expenses;
DROP POLICY IF EXISTS "auth_delete_expenses" ON location_expenses;
CREATE POLICY "permission_select_expenses" ON location_expenses FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'locations', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_expenses" ON location_expenses FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_update_expenses" ON location_expenses FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_delete_expenses" ON location_expenses FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_partners" ON location_partners;
DROP POLICY IF EXISTS "auth_insert_partners" ON location_partners;
DROP POLICY IF EXISTS "auth_update_partners" ON location_partners;
DROP POLICY IF EXISTS "auth_delete_partners" ON location_partners;
CREATE POLICY "permission_select_partners" ON location_partners FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'locations', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_partners" ON location_partners FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_update_partners" ON location_partners FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));
CREATE POLICY "permission_delete_partners" ON location_partners FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_booking_invoices" ON booking_invoices;
DROP POLICY IF EXISTS "auth_insert_booking_invoices" ON booking_invoices;
DROP POLICY IF EXISTS "auth_update_booking_invoices" ON booking_invoices;
DROP POLICY IF EXISTS "auth_delete_booking_invoices" ON booking_invoices;
CREATE POLICY "permission_select_booking_invoices" ON booking_invoices FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'bookings', 'clients', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_booking_invoices" ON booking_invoices FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));
CREATE POLICY "permission_update_booking_invoices" ON booking_invoices FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));
CREATE POLICY "permission_delete_booking_invoices" ON booking_invoices FOR DELETE TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));

DROP POLICY IF EXISTS "auth_select_invoice_payments" ON invoice_payments;
DROP POLICY IF EXISTS "auth_insert_invoice_payments" ON invoice_payments;
CREATE POLICY "permission_select_invoice_payments" ON invoice_payments FOR SELECT TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['overview', 'bookings', 'accounts']::dashboard_permission[])));
CREATE POLICY "permission_insert_invoice_payments" ON invoice_payments FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['bookings']::dashboard_permission[])));

DROP POLICY IF EXISTS "Authenticated users can manage location images" ON location_images;
CREATE POLICY "permission_manage_location_images" ON location_images FOR ALL TO authenticated
  USING ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])))
  WITH CHECK ((SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[])));

DROP POLICY IF EXISTS "Authenticated users can upload location images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete location images" ON storage.objects;
CREATE POLICY "permission_upload_location_images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'location-images'
    AND (SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[]))
  );
CREATE POLICY "permission_delete_location_images" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'location-images'
    AND (SELECT private.has_any_dashboard_permission(ARRAY['locations']::dashboard_permission[]))
  );
