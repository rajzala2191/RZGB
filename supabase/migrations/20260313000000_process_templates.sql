-- Process Templates
-- Allows admins to create reusable process presets that clients can apply during order creation.

CREATE TABLE process_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  process_keys JSONB NOT NULL,   -- ordered array e.g. ["MATERIAL","CASTING","MACHINING"]
  is_default   BOOLEAN DEFAULT FALSE,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE process_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on process_templates" ON process_templates
  FOR ALL USING (auth_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Client read access on process_templates" ON process_templates
  FOR SELECT USING (auth_user_role() IN ('client'));
