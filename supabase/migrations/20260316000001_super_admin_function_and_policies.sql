-- ============================================================
-- Part 2: Use super_admin (after enum value is committed).
-- ============================================================

-- 1. Update is_super_admin() to recognize role = 'super_admin'
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'super_admin'::public.user_role
        OR (role = 'admin'::public.user_role AND admin_scope = 'platform')
      )
  )
$$;

-- 2. Migrate existing platform admins to role = 'super_admin'
UPDATE public.profiles
SET role = 'super_admin'::public.user_role
WHERE role = 'admin'
  AND (admin_scope = 'platform' OR (admin_scope IS NULL AND workspace_id IS NULL));

-- 3. demo_requests: use is_super_admin() for platform admin access
DROP POLICY IF EXISTS "Super admin full access demo_requests" ON public.demo_requests;
DROP POLICY IF EXISTS "Super admin update demo_requests" ON public.demo_requests;

CREATE POLICY "Super admin full access demo_requests"
  ON public.demo_requests FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin update demo_requests"
  ON public.demo_requests FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
