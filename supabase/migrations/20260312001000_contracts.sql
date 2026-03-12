-- ─────────────────────────────────────────────────────────────────────────────
-- Contract Management
-- Lifecycle: draft → active → (expired | terminated | renewed)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number      TEXT UNIQUE NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  contract_type        TEXT NOT NULL DEFAULT 'supply_agreement',
  -- Parties
  supplier_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id             UUID REFERENCES orders(id) ON DELETE SET NULL,
  -- Financial
  total_value          NUMERIC(14,2),
  currency             TEXT NOT NULL DEFAULT 'GBP',
  -- Lifecycle
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','active','expired','terminated','renewed')),
  start_date           DATE,
  end_date             DATE,
  signed_at            TIMESTAMPTZ,
  signed_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Renewal config
  renewal_notice_days  INTEGER NOT NULL DEFAULT 30,
  auto_renew           BOOLEAN NOT NULL DEFAULT false,
  renewed_from_id      UUID REFERENCES contracts(id) ON DELETE SET NULL,
  -- Content
  terms                JSONB NOT NULL DEFAULT '[]',
  notes                TEXT,
  file_path            TEXT,
  -- Audit
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on contracts"
  ON contracts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Suppliers view own contracts"
  ON contracts FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Clients view own contracts"
  ON contracts FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- ── contract_events — immutable audit trail for status transitions ──────────

CREATE TABLE IF NOT EXISTS contract_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,   -- 'created','activated','terminated','expired','renewed'
  from_status   TEXT,
  to_status     TEXT,
  performed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on contract_events"
  ON contract_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Suppliers view events for own contracts"
  ON contract_events FOR SELECT TO authenticated
  USING (
    contract_id IN (SELECT id FROM contracts WHERE supplier_id = auth.uid())
  );

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contracts_supplier_id ON contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status      ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date    ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contract_events_cid   ON contract_events(contract_id);
