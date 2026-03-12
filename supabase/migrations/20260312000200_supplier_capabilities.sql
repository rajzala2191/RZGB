CREATE TABLE IF NOT EXISTS supplier_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  processes TEXT[] DEFAULT '{}',
  materials TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  min_order_qty INT,
  max_order_qty INT,
  lead_time_days INT,
  country TEXT,
  region TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id)
);
ALTER TABLE supplier_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers manage own capabilities" ON supplier_capabilities
  FOR ALL TO authenticated USING (supplier_id = auth.uid()) WITH CHECK (supplier_id = auth.uid());
CREATE POLICY "Admins view all capabilities" ON supplier_capabilities
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
