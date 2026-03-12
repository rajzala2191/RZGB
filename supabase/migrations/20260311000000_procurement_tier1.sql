-- ============================================================
-- Procurement Tier 1: Bidding, POs, RFQ Enhancements
-- ============================================================

-- 1. bid_submissions
CREATE TABLE IF NOT EXISTS bid_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'GBP',
  lead_time_days  INTEGER NOT NULL,
  notes           TEXT,
  price_breakdown JSONB DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','shortlisted','awarded','rejected','withdrawn')),
  bid_deadline    TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, supplier_id)
);

ALTER TABLE bid_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own bids"
  ON bid_submissions FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can insert own bids"
  ON bid_submissions FOR INSERT TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Admin full access on bids"
  ON bid_submissions FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 2. Add bid_deadline to orders for auto-close
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bid_deadline TIMESTAMPTZ;

-- 3. purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bid_id          UUID REFERENCES bid_submissions(id),
  supplier_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  po_number       TEXT NOT NULL UNIQUE,
  po_status       TEXT NOT NULL DEFAULT 'draft'
                  CHECK (po_status IN ('draft','issued','acknowledged','amended','completed','cancelled')),
  line_items      JSONB DEFAULT '[]',
  total_amount    NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'GBP',
  payment_terms   TEXT,
  delivery_date   DATE,
  notes           TEXT,
  issued_at       TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on POs"
  ON purchase_orders FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Suppliers view own POs"
  ON purchase_orders FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

-- 4. po_amendments (change orders)
CREATE TABLE IF NOT EXISTS po_amendments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  changes         JSONB NOT NULL DEFAULT '{}',
  old_total       NUMERIC(12,2),
  new_total       NUMERIC(12,2),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(po_id, amendment_number)
);

ALTER TABLE po_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on amendments"
  ON po_amendments FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Suppliers view own amendments"
  ON po_amendments FOR SELECT TO authenticated
  USING (po_id IN (SELECT id FROM purchase_orders WHERE supplier_id = auth.uid()));

-- 5. rfq_lots (multi-lot RFQ)
CREATE TABLE IF NOT EXISTS rfq_lots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lot_number  INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity    INTEGER,
  material    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, lot_number)
);

ALTER TABLE rfq_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read lots"
  ON rfq_lots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on lots"
  ON rfq_lots FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 6. rfq_templates
CREATE TABLE IF NOT EXISTS rfq_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID REFERENCES profiles(id),
  name            TEXT NOT NULL,
  description     TEXT,
  template_data   JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rfq_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on templates"
  ON rfq_templates FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Clients can read own templates"
  ON rfq_templates FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Clients can insert own templates"
  ON rfq_templates FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 7. rfq_questions (Q&A board)
CREATE TABLE IF NOT EXISTS rfq_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  asked_by    UUID NOT NULL REFERENCES profiles(id),
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rfq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read public questions"
  ON rfq_questions FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert questions"
  ON rfq_questions FOR INSERT TO authenticated
  WITH CHECK (asked_by = auth.uid());

CREATE POLICY "Admin full access on questions"
  ON rfq_questions FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bid_submissions_order_id ON bid_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_supplier_id ON bid_submissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id ON purchase_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_lots_order_id ON rfq_lots(order_id);
CREATE INDEX IF NOT EXISTS idx_rfq_questions_order_id ON rfq_questions(order_id);
