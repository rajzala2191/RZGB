-- ============================================================
-- Workspace Tenancy: Super Admin vs Customer Admin
-- ============================================================

-- 1. workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','suspended','archived')),
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 2. Add workspace + admin scope columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_scope TEXT DEFAULT 'workspace'
  CHECK (admin_scope IN ('platform', 'workspace'));

-- 3. Add workspace_id to high-traffic business tables
ALTER TABLE orders           ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE documents        ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE bid_submissions  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE purchase_orders  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE notifications    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE audit_logs       ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE support_tickets  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- 4. workspace_memberships for future flexibility
CREATE TABLE IF NOT EXISTS workspace_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL DEFAULT 'member'
                  CHECK (membership_role IN ('owner','admin','member','viewer')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_workspace ON orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_workspace ON bid_submissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_workspace ON purchase_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_ws ON workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user ON workspace_memberships(user_id);

-- 6. Helper functions for RLS

CREATE OR REPLACE FUNCTION auth_user_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_user_admin_scope()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT admin_scope FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_scope = 'platform'
  )
$$;

CREATE OR REPLACE FUNCTION is_workspace_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_scope = 'workspace'
  )
$$;

-- 7. Workspace RLS policies

CREATE POLICY "Super admin full access on workspaces"
  ON workspaces FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Workspace members can view own workspace"
  ON workspaces FOR SELECT TO authenticated
  USING (id = auth_user_workspace_id());

CREATE POLICY "Super admin full access on memberships"
  ON workspace_memberships FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Users view own membership"
  ON workspace_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 8. Backfill: create a default workspace for existing data
INSERT INTO workspaces (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workspace', 'default', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Backfill all existing profiles into the default workspace
UPDATE profiles
SET workspace_id = '00000000-0000-0000-0000-000000000001'
WHERE workspace_id IS NULL;

-- Backfill business tables
UPDATE orders SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE documents SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE bid_submissions SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE purchase_orders SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE invoices SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;

-- Set existing admin users to platform scope (super admins)
UPDATE profiles
SET admin_scope = 'platform'
WHERE role = 'admin';
