-- ============================================================
-- Block portal data access for pending workspaces (backend enforcement)
-- Prevents direct API/DB access bypassing frontend onboarding gates.
--
-- Tables gated (only if they exist): orders, documents, bid_submissions,
-- purchase_orders, invoices, audit_logs, support_tickets, notifications.
-- Existence checks allow partial schemas (e.g. missing procurement tables).
-- ============================================================

-- Ensure required helpers exist (from workspace_tenancy / super_admin; create if those weren't run)
CREATE OR REPLACE FUNCTION auth_user_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role::text = 'super_admin' OR (role::text = 'admin' AND admin_scope = 'platform'))
  );
$$;

-- Helper: true only when user's workspace is active (or super_admin bypasses)
CREATE OR REPLACE FUNCTION workspace_allows_portal_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    is_super_admin(),
    (SELECT w.status = 'active' FROM workspaces w
     JOIN profiles p ON p.workspace_id = w.id
     WHERE p.id = auth.uid())
  );
$$;

-- Standard policy USING clause (for orders, documents, bids, POs, invoices)
-- Applied per-table only if table exists

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on orders" ON orders;
    DROP POLICY IF EXISTS "Admin full access" ON orders;
    CREATE POLICY "Tenant-scoped admin access on orders" ON orders FOR ALL TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on documents" ON documents;
    DROP POLICY IF EXISTS "Admin full access" ON documents;
    CREATE POLICY "Tenant-scoped admin access on documents" ON documents FOR ALL TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bid_submissions') THEN
    ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on bids" ON bid_submissions;
    DROP POLICY IF EXISTS "Admin full access on bids" ON bid_submissions;
    CREATE POLICY "Tenant-scoped admin access on bids" ON bid_submissions FOR ALL TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on POs" ON purchase_orders;
    DROP POLICY IF EXISTS "Admin full access on POs" ON purchase_orders;
    CREATE POLICY "Tenant-scoped admin access on POs" ON purchase_orders FOR ALL TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on invoices" ON invoices;
    DROP POLICY IF EXISTS "Admin full access on invoices" ON invoices;
    CREATE POLICY "Tenant-scoped admin access on invoices" ON invoices FOR ALL TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on audit_logs" ON audit_logs;
    DROP POLICY IF EXISTS "Admin full access" ON audit_logs;
    CREATE POLICY "Tenant-scoped admin access on audit_logs" ON audit_logs FOR SELECT TO authenticated
      USING (is_super_admin() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped admin access on support_tickets" ON support_tickets;
    DROP POLICY IF EXISTS "Admin full access" ON support_tickets;
    CREATE POLICY "Tenant-scoped admin access on support_tickets" ON support_tickets FOR ALL TO authenticated
      USING (is_super_admin() OR user_id = auth.uid() OR ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

-- Notifications: recipient always sees own; workspace-scoped requires active workspace
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
    DROP POLICY IF EXISTS "Tenant-scoped access on notifications" ON notifications;
    DROP POLICY IF EXISTS "Admin full access" ON notifications;
    CREATE POLICY "Tenant-scoped access on notifications" ON notifications FOR ALL TO authenticated
      USING (is_super_admin() OR recipient_id = auth.uid() OR (workspace_id = auth_user_workspace_id() AND workspace_allows_portal_access()));
  END IF;
END $$;

-- Profiles: workspace members can view each other only when workspace is active
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users in same workspace can view each other" ON profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users in same workspace can view each other"
  ON profiles FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR id = auth.uid()
    OR (
      workspace_id = auth_user_workspace_id()
      AND workspace_allows_portal_access()
    )
  );
