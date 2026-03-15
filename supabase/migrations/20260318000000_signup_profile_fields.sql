-- ============================================================
-- Self-signup support: phone field + profile insert RLS policy
-- ============================================================

-- 1. Add phone/contact field to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- 2. Allow a newly-signed-up user to insert their own profile row.
--    supabaseAdmin (service role) bypasses RLS; this policy is defense-in-depth.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'User can insert own profile on signup'
  ) THEN
    CREATE POLICY "User can insert own profile on signup"
      ON profiles FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
