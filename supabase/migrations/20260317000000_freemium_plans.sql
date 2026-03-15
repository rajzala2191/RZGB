-- ============================================================
-- Freemium Subscription Plans
-- Adds plan tracking to workspaces and monthly usage counting
-- ============================================================

-- 1. Add plan columns to workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'growth', 'enterprise')),
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active'
    CHECK (plan_status IN ('active', 'trialing', 'expired', 'cancelled')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_upgraded_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_upgraded_by UUID REFERENCES profiles(id) DEFAULT NULL;

-- Existing workspaces default to 'free' (already set via DEFAULT)
-- Super admin's default workspace can be bumped manually

-- 2. Monthly usage tracking (reset-able per billing cycle)
CREATE TABLE IF NOT EXISTS workspace_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month           DATE NOT NULL,  -- first day of month e.g. 2026-03-01
  orders_created  INTEGER NOT NULL DEFAULT 0,
  users_invited   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, month)
);

ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_usage_ws_month ON workspace_usage(workspace_id, month);

-- 3. RPC: increment order usage for current month
CREATE OR REPLACE FUNCTION increment_workspace_order_usage(p_workspace_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month DATE := date_trunc('month', now())::DATE;
BEGIN
  INSERT INTO workspace_usage (workspace_id, month, orders_created)
  VALUES (p_workspace_id, v_month, 1)
  ON CONFLICT (workspace_id, month)
  DO UPDATE SET
    orders_created = workspace_usage.orders_created + 1,
    updated_at = now();
END;
$$;

-- 4. RPC: get current month order count for a workspace
CREATE OR REPLACE FUNCTION get_workspace_monthly_orders(p_workspace_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(orders_created, 0)
  FROM workspace_usage
  WHERE workspace_id = p_workspace_id
    AND month = date_trunc('month', now())::DATE;
$$;

-- 5. RLS policies for workspace_usage
CREATE POLICY "Super admin full access on workspace_usage"
  ON workspace_usage FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Workspace members view own usage"
  ON workspace_usage FOR SELECT TO authenticated
  USING (workspace_id = auth_user_workspace_id());

-- 6. Upgrade log table (audit trail for plan changes)
CREATE TABLE IF NOT EXISTS subscription_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  from_plan      TEXT,
  to_plan        TEXT NOT NULL,
  changed_by     UUID REFERENCES profiles(id),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on subscription_events"
  ON subscription_events FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Workspace admins view own events"
  ON subscription_events FOR SELECT TO authenticated
  USING (workspace_id = auth_user_workspace_id());
