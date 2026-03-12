CREATE TABLE IF NOT EXISTS job_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL CHECK (cert_type IN ('MTR', 'CoC', 'Inspection Report', 'Test Certificate')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejection_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE job_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers manage own certs" ON job_certificates
  FOR ALL TO authenticated USING (supplier_id = auth.uid()) WITH CHECK (supplier_id = auth.uid());
CREATE POLICY "Admins manage all certs" ON job_certificates
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Clients view approved certs for their orders" ON job_certificates
  FOR SELECT TO authenticated USING (
    status = 'approved' AND
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
  );
