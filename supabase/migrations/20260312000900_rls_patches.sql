-- ─────────────────────────────────────────────────────────────────────────────
-- RLS patches: closes gaps identified in Phase A hardening review.
-- Targets: credit_notes, payment_milestones, approval_requests, bid_submissions
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. credit_notes — suppliers had no read access to their own notes
CREATE POLICY "Suppliers view own credit notes"
  ON credit_notes FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE supplier_id = auth.uid()
    )
  );

-- 2. payment_milestones — suppliers could SELECT but not INSERT or UPDATE
CREATE POLICY "Suppliers insert milestones for own orders"
  ON payment_milestones FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE supplier_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers update milestones for own orders"
  ON payment_milestones FOR UPDATE TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE supplier_id = auth.uid()
    )
  );

-- 3. approval_requests — approvers need to query requests awaiting their action.
--    An approver is any authenticated user assigned to a step in the workflow.
CREATE POLICY "Approvers view requests assigned to them"
  ON approval_requests FOR SELECT TO authenticated
  USING (
    workflow_id IN (
      SELECT workflow_id FROM approval_steps WHERE approver_id = auth.uid()
    )
  );

-- 4. bid_submissions — suppliers lacked an UPDATE policy, meaning RLS blocked
--    legitimate withdraw operations (status -> 'withdrawn').
CREATE POLICY "Suppliers update own pending bids"
  ON bid_submissions FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());
