-- ============================================================
-- RZGB Portal - Full Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run on an existing database:
--   • CREATE TABLE IF NOT EXISTS  → skipped if table exists
--   • ALTER TABLE ADD COLUMN IF NOT EXISTS → skipped if column exists
--   • CREATE INDEX IF NOT EXISTS  → skipped if index exists
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- SHARED: updated_at trigger function
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text,
  role           text NOT NULL DEFAULT 'client',
  company_name   text,
  contact_person text,
  phone          text,
  status         text NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role           text NOT NULL DEFAULT 'client';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

-- Auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ════════════════════════════════════════════════════════════
-- ORDERS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  client_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_id              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  supplier_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  part_name            text NOT NULL,
  description          text,
  material             text,
  quantity             integer,
  tolerance            text,
  surface_finish       text,
  special_requirements text,
  budget               numeric,
  delivery_location    text,
  order_status         text NOT NULL DEFAULT 'PENDING_ADMIN_SCRUB',
  ghost_public_name    text,
  ghost_description    text,
  target_sell_price    numeric,
  rz_job_id            text UNIQUE,
  unit_price           numeric
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at           timestamptz NOT NULL DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id            uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id              uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_id          uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS description          text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS material             text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity             integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tolerance            text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS surface_finish       text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_requirements text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS budget               numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status         text NOT NULL DEFAULT 'PENDING_ADMIN_SCRUB';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ghost_public_name    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ghost_description    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS target_sell_price    numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_price           numeric;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documents (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  order_id           uuid REFERENCES orders(id) ON DELETE CASCADE,
  client_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_name          text NOT NULL,
  file_path          text NOT NULL,
  file_url           text,
  file_type          text NOT NULL,
  status             text NOT NULL DEFAULT 'PENDING_SCRUB',
  scrubbed_file_path text,
  notes              text,
  redaction_notes    text
);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS order_id           uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_id          uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by        uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url           text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS scrubbed_file_path text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes              text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS redaction_notes    text;

-- ════════════════════════════════════════════════════════════
-- JOB_UPDATES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_updates (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  rz_job_id  text NOT NULL,
  stage      text,
  status     text,
  notes      text,
  note       text,
  created_by text,
  updated_by text
);
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS stage      text;
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS status     text;
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS notes      text;
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS note       text;
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE job_updates ADD COLUMN IF NOT EXISTS updated_by text;

-- ════════════════════════════════════════════════════════════
-- SANITIZATION_RECORDS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sanitization_records (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  order_id   uuid REFERENCES orders(id) ON DELETE CASCADE,
  admin_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ghost_name text,
  status     text NOT NULL DEFAULT 'COMPLETED'
);
ALTER TABLE sanitization_records ADD COLUMN IF NOT EXISTS order_id   uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE sanitization_records ADD COLUMN IF NOT EXISTS admin_id   uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE sanitization_records ADD COLUMN IF NOT EXISTS ghost_name text;
ALTER TABLE sanitization_records ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'COMPLETED';

-- ════════════════════════════════════════════════════════════
-- BIDS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bids (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount  numeric NOT NULL,
  unit_price  numeric,
  lead_time   text,
  notes       text,
  status      text NOT NULL DEFAULT 'pending'
);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS order_id    uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS unit_price  numeric;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS lead_time   text;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS notes       text;

-- ════════════════════════════════════════════════════════════
-- AUDIT_LOGS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_id   uuid REFERENCES orders(id) ON DELETE SET NULL,
  action     text NOT NULL,
  details    text,
  status     text NOT NULL DEFAULT 'success',
  ip_address text DEFAULT 'client-side'
);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS admin_id   uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS order_id   uuid REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details    text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'success';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text DEFAULT 'client-side';

-- ════════════════════════════════════════════════════════════
-- ACTIVITY_LOGS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action     text NOT NULL,
  details    text,
  status     text,
  ip_address text DEFAULT 'client-side'
);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details    text;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS status     text;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ip_address text DEFAULT 'client-side';

-- ════════════════════════════════════════════════════════════
-- SUPPORT_TICKETS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_tickets (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_role  text,
  subject    text NOT NULL,
  category   text,
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'open',
  priority   text NOT NULL DEFAULT 'medium'
);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_role  text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category   text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority   text NOT NULL DEFAULT 'medium';

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- TICKET_REPLIES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ticket_replies (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  ticket_id      uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message        text NOT NULL,
  is_admin_reply boolean NOT NULL DEFAULT false
);
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS ticket_id      uuid REFERENCES support_tickets(id) ON DELETE CASCADE;
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS user_id        uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS is_admin_reply boolean NOT NULL DEFAULT false;

-- ════════════════════════════════════════════════════════════
-- NCR_REPORTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ncr_reports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issue_type  text NOT NULL,
  severity    text NOT NULL DEFAULT 'Low',
  description text NOT NULL,
  status      text NOT NULL DEFAULT 'reported'
);
ALTER TABLE ncr_reports ADD COLUMN IF NOT EXISTS order_id    uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE ncr_reports ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE ncr_reports ADD COLUMN IF NOT EXISTS severity    text NOT NULL DEFAULT 'Low';

-- ════════════════════════════════════════════════════════════
-- SHIPPING_LABELS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shipping_labels (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  carrier         text,
  tracking_number text,
  status          text NOT NULL DEFAULT 'generated'
);
ALTER TABLE shipping_labels ADD COLUMN IF NOT EXISTS order_id        uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE shipping_labels ADD COLUMN IF NOT EXISTS supplier_id     uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE shipping_labels ADD COLUMN IF NOT EXISTS carrier         text;
ALTER TABLE shipping_labels ADD COLUMN IF NOT EXISTS tracking_number text;

-- ════════════════════════════════════════════════════════════
-- ORDER_MILESTONES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_milestones (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  order_id       uuid REFERENCES orders(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  status         text NOT NULL DEFAULT 'completed',
  completed_at   timestamptz
);
ALTER TABLE order_milestones ADD COLUMN IF NOT EXISTS order_id       uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_milestones ADD COLUMN IF NOT EXISTS completed_at   timestamptz;

-- ════════════════════════════════════════════════════════════
-- SYSTEM_SETTINGS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS system_settings (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key   text NOT NULL UNIQUE,
  setting_value text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_value text;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

-- ════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_client_id      ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id    ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_rz_job_id      ON orders(rz_job_id);
CREATE INDEX IF NOT EXISTS idx_documents_order_id    ON documents(order_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type   ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_job_updates_rz_job_id ON job_updates(rz_job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id   ON audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_order_id         ON bids(order_id);
CREATE INDEX IF NOT EXISTS idx_bids_supplier_id      ON bids(supplier_id);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY  (enable — configure policies in dashboard)
-- ════════════════════════════════════════════════════════════
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_updates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanitization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncr_reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_labels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_milestones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings      ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- STORAGE BUCKETS  (reference — create via Supabase Dashboard → Storage)
-- ════════════════════════════════════════════════════════════
-- Bucket: "documents"
--   {client_id}/{order_id}/{file_name}             ← client drawings
--   {client_id}/{order_id}/models/{file_name}      ← 3D models (.stl .obj .gltf .glb .x_t)
--   supplier/{supplier_id}/{order_id}/{file_name}  ← supplier submissions
--   scrubbed/{order_id}/{file_name}                ← AI-scrubbed drawings
