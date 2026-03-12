-- Process Sub-Steps and Order Step Progress
-- Sub-steps: granular checklist items per manufacturing process (admin-defined)
-- Order step progress: per-order tracking of sub-step completion by suppliers

-- ─── Sub-step definitions ──────────────────────────────────────────────────────

CREATE TABLE process_sub_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id    UUID REFERENCES manufacturing_processes(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  display_order INTEGER DEFAULT 0,
  is_required   BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE process_sub_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on process_sub_steps" ON process_sub_steps
  FOR ALL USING (auth_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Supplier read active sub_steps" ON process_sub_steps
  FOR SELECT USING (auth_user_role() = 'supplier');

CREATE POLICY "Client read active sub_steps" ON process_sub_steps
  FOR SELECT USING (auth_user_role() = 'client');

-- ─── Per-order sub-step progress ──────────────────────────────────────────────

CREATE TABLE order_step_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id) ON DELETE CASCADE,
  sub_step_id   UUID REFERENCES process_sub_steps(id) ON DELETE CASCADE,
  process_key   TEXT NOT NULL,           -- denormalised status_key for easy grouping
  status        TEXT DEFAULT 'pending',  -- pending | in_progress | completed | skipped
  completed_by  UUID REFERENCES profiles(id),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  evidence_url  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, sub_step_id)
);

ALTER TABLE order_step_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on order_step_progress" ON order_step_progress
  FOR ALL USING (auth_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Supplier read own order steps" ON order_step_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_step_progress.order_id
        AND orders.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Supplier update own order steps" ON order_step_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_step_progress.order_id
        AND orders.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Supplier insert own order steps" ON order_step_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_step_progress.order_id
        AND orders.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Client read own order steps" ON order_step_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_step_progress.order_id
        AND orders.client_id = auth.uid()
    )
  );
