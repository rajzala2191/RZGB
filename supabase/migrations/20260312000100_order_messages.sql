-- Per-Order Threaded Messaging: order_messages table
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_by UUID[] DEFAULT '{}'
);

ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only participants in the order (client, supplier, admin) can view/insert
-- (You may need to adjust this based on your app's logic)
CREATE POLICY "Order participants can view messages" ON order_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid() OR supplier_id = auth.uid())
  );

CREATE POLICY "Order participants can insert messages" ON order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
  );
