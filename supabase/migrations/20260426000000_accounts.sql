-- ============================================================
-- Part 2: Accounts — land_type, clients, expenses, partners
-- ============================================================

-- land_type enum
CREATE TYPE land_type AS ENUM ('private', 'government', 'crown');
ALTER TABLE locations ADD COLUMN IF NOT EXISTS land_type land_type NOT NULL DEFAULT 'crown';

-- Total contract amount on bookings (for profit calculation)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ── Clients ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  company     TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from bookings → clients
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;

-- Migrate: create a client record per distinct client_name
INSERT INTO clients (name)
SELECT DISTINCT TRIM(client_name)
FROM   bookings
WHERE  client_name IS NOT NULL AND TRIM(client_name) != ''
ON CONFLICT DO NOTHING;

-- Link existing bookings to their new client records
UPDATE bookings b
SET    client_id = c.id
FROM   clients c
WHERE  LOWER(TRIM(c.name)) = LOWER(TRIM(b.client_name));

-- ── Expenses ─────────────────────────────────────────────────
CREATE TYPE expense_type AS ENUM ('installation', 'land_rent', 'tax', 'maintenance', 'other');

CREATE TABLE IF NOT EXISTS location_expenses (
  id           BIGSERIAL PRIMARY KEY,
  location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  expense_type expense_type NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Partners ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_partners (
  id           BIGSERIAL PRIMARY KEY,
  location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  percentage   NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at triggers ──────────────────────────────────────
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER location_expenses_updated_at
  BEFORE UPDATE ON location_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER location_partners_updated_at
  BEFORE UPDATE ON location_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_clients" ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_clients" ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_expenses" ON location_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_expenses" ON location_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_expenses" ON location_expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_expenses" ON location_expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_partners" ON location_partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_partners" ON location_partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_partners" ON location_partners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_partners" ON location_partners FOR DELETE TO authenticated USING (true);
