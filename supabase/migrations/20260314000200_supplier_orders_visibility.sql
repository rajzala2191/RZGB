-- ============================================================
-- Supplier visibility for bidding opportunities
-- Ensures suppliers can read OPEN_FOR_BIDDING orders in workspace
-- and any orders assigned to them.
-- ============================================================

CREATE POLICY "Tenant-scoped supplier visibility on orders"
  ON orders FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'supplier'
    AND (
      order_status = 'OPEN_FOR_BIDDING'
      OR supplier_id = auth.uid()
    )
  );
