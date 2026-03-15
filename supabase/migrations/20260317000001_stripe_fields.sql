-- ============================================================
-- Stripe Integration: customer & subscription tracking
-- ============================================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS stripe_customer_id        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_id           TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT DEFAULT NULL;

-- Index for webhook lookups by customer/subscription id
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_subscription ON workspaces(stripe_subscription_id);
