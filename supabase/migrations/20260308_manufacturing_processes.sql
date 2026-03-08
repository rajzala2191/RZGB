-- Create manufacturing_processes table
CREATE TABLE IF NOT EXISTS manufacturing_processes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  status_key   TEXT NOT NULL UNIQUE,
  description  TEXT,
  display_order INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Seed defaults
INSERT INTO manufacturing_processes (name, status_key, description, display_order) VALUES
  ('Material Sourcing', 'MATERIAL',  'Raw material procurement and preparation', 1),
  ('Casting',           'CASTING',   'Metal or plastic casting process',          2),
  ('CNC Machining',     'MACHINING', 'Computer-controlled precision machining',   3)
ON CONFLICT (status_key) DO NOTHING;

-- RLS
ALTER TABLE manufacturing_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON manufacturing_processes FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Anyone can read active processes" ON manufacturing_processes FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Add selected_processes column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_processes JSONB DEFAULT '["MATERIAL","MACHINING"]'::jsonb;
