-- ============================================================
-- Procurement Tier 2: Invoices, Spend Analytics, Approvals, Supplier Discovery
-- ============================================================

-- 1. invoices
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  po_id           UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES profiles(id),
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'GBP',
  tax_amount      NUMERIC(12,2) DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL,
  invoice_status  TEXT NOT NULL DEFAULT 'submitted'
                  CHECK (invoice_status IN ('draft','submitted','under_review','approved','rejected','paid','overdue','cancelled')),
  due_date        DATE,
  paid_date       DATE,
  line_items      JSONB DEFAULT '[]',
  notes           TEXT,
  file_path       TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on invoices"
  ON invoices FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Suppliers view own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers insert own invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Clients view own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- 2. payment_milestones
CREATE TABLE IF NOT EXISTS payment_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  po_id           UUID REFERENCES purchase_orders(id),
  milestone_type  TEXT NOT NULL CHECK (milestone_type IN ('deposit','progress','final','custom')),
  description     TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'GBP',
  percentage      NUMERIC(5,2),
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','invoiced','paid','overdue')),
  invoice_id      UUID REFERENCES invoices(id),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on milestones"
  ON payment_milestones FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Suppliers view milestones for own orders"
  ON payment_milestones FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE supplier_id = auth.uid()));

-- 3. credit_notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  credit_number   TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  reason          TEXT NOT NULL,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on credit_notes"
  ON credit_notes FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 4. approval_workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('purchase_order','invoice','rfq','contract','requisition')),
  is_active       BOOLEAN DEFAULT true,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on workflows"
  ON approval_workflows FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 5. approval_steps
CREATE TABLE IF NOT EXISTS approval_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  approver_role   TEXT NOT NULL,
  approver_id     UUID REFERENCES profiles(id),
  threshold_amount NUMERIC(12,2),
  threshold_currency TEXT DEFAULT 'GBP',
  auto_approve    BOOLEAN DEFAULT false,
  escalation_hours INTEGER DEFAULT 48,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, step_order)
);

ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on steps"
  ON approval_steps FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 6. approval_requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES approval_workflows(id),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  current_step    INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','approved','rejected','escalated','cancelled')),
  requested_by    UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on requests"
  ON approval_requests FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users view own approval requests"
  ON approval_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

-- 7. approval_decisions
CREATE TABLE IF NOT EXISTS approval_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  decided_by      UUID NOT NULL REFERENCES profiles(id),
  decision        TEXT NOT NULL CHECK (decision IN ('approved','rejected','delegated')),
  comments        TEXT,
  delegated_to    UUID REFERENCES profiles(id),
  decided_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on decisions"
  ON approval_decisions FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users view own decisions"
  ON approval_decisions FOR SELECT TO authenticated
  USING (decided_by = auth.uid());

-- 8. supplier_directory (extends profiles for discovery)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_established INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- 9. procurement_categories
CREATE TABLE IF NOT EXISTS procurement_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES procurement_categories(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE procurement_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON procurement_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on categories"
  ON procurement_categories FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Seed default categories
INSERT INTO procurement_categories (name, description) VALUES
  ('CNC Machining', 'Precision CNC milling and turning'),
  ('Castings', 'Metal casting processes'),
  ('Forgings', 'Metal forging and stamping'),
  ('Sheet Metal', 'Sheet metal fabrication and bending'),
  ('Raw Materials', 'Bulk material procurement'),
  ('Surface Treatment', 'Coating, plating, and finishing'),
  ('Assembly', 'Assembly and sub-assembly services')
ON CONFLICT (name) DO NOTHING;

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_po_id ON invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_order_id ON payment_milestones(order_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON approval_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_profiles_discoverable ON profiles(is_discoverable) WHERE is_discoverable = true;
