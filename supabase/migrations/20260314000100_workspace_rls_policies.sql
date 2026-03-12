-- ============================================================
-- Workspace-aware RLS policies for tenant isolation
-- Pattern: super_admin bypasses; others scoped to workspace_id
-- ============================================================

-- Helper: check if row belongs to user's workspace
-- Used inline in policies: is_super_admin() OR t.workspace_id = auth_user_workspace_id()

-- ── orders ──────────────────────────────────────────────────
-- Drop overly broad legacy admin policy if it exists, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access" ON orders;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on orders"
  ON orders FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── documents ───────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access" ON documents;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on documents"
  ON documents FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── bid_submissions ─────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on bids" ON bid_submissions;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on bids"
  ON bid_submissions FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── purchase_orders ─────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on POs" ON purchase_orders;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on POs"
  ON purchase_orders FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── invoices ────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on invoices" ON invoices;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on invoices"
  ON invoices FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── notifications ───────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access" ON notifications;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped access on notifications"
  ON notifications FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR recipient_id = auth.uid()
    OR workspace_id = auth_user_workspace_id()
  );

-- ── audit_logs ──────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access" ON audit_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on audit_logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );

-- ── approval_workflows ─────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on workflows" ON approval_workflows;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on workflows"
  ON approval_workflows FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── approval_requests ───────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on requests" ON approval_requests;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on approval_requests"
  ON approval_requests FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── profiles: workspace-scoped reads ────────────────────────
CREATE POLICY "Users in same workspace can view each other"
  ON profiles FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR id = auth.uid()
    OR workspace_id = auth_user_workspace_id()
  );

-- ── support_tickets ─────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access" ON support_tickets;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Tenant-scoped admin access on support_tickets"
  ON support_tickets FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      AND workspace_id = auth_user_workspace_id()
    )
  );
