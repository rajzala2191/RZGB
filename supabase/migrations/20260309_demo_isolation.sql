-- ============================================================
-- Demo data isolation
-- Adds is_demo flag to profiles so demo accounts are
-- completely separated from real production data via RLS.
-- ============================================================

-- 1. Add is_demo column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark the three demo accounts
UPDATE profiles SET is_demo = TRUE
WHERE email IN (
  'demo.client@rzglobalsolutions.co.uk',
  'demo.admin@rzglobalsolutions.co.uk',
  'demo.supplier@rzglobalsolutions.co.uk'
);

-- 3. Helper functions (SECURITY DEFINER bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION auth_user_is_demo()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT is_demo FROM profiles WHERE id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS: orders table
-- Each admin tier only sees orders from their own demo tier.
-- Client_id on orders points to the client's profile row.
-- ============================================================

-- Drop existing admin read/update policies
DROP POLICY IF EXISTS "Admins view all orders"       ON orders;
DROP POLICY IF EXISTS "Admins can view all orders"   ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders"     ON orders;
DROP POLICY IF EXISTS "Admin can view all orders"    ON orders;
DROP POLICY IF EXISTS "Admin can update all orders"  ON orders;

CREATE POLICY "admin_orders_demo_isolated" ON orders
  FOR SELECT TO authenticated
  USING (
    auth_user_role() = 'admin'
    AND auth_user_is_demo() = (
      SELECT is_demo FROM profiles WHERE id = orders.client_id
    )
  );

CREATE POLICY "admin_orders_update_demo_isolated" ON orders
  FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'admin'
    AND auth_user_is_demo() = (
      SELECT is_demo FROM profiles WHERE id = orders.client_id
    )
  );

-- ============================================================
-- RLS: profiles table
-- Admin only sees profiles of matching demo tier (plus own row).
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"  ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles"   ON profiles;
DROP POLICY IF EXISTS "Admins can view all users"     ON profiles;

CREATE POLICY "admin_profiles_demo_isolated" ON profiles
  FOR SELECT TO authenticated
  USING (
    -- always allow reading own profile
    id = auth.uid()
    OR (
      auth_user_role() = 'admin'
      AND is_demo = auth_user_is_demo()
    )
  );
