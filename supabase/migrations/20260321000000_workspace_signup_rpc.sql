-- ============================================================
-- RPC: create_signup_workspace_and_profile
-- Allows authenticated signup to create workspace + profile without
-- needing the service_role key (avoids "new row violates RLS" when
-- VITE_SUPABASE_SERVICE_ROLE_KEY is not set in the browser).
-- ============================================================

CREATE OR REPLACE FUNCTION create_signup_workspace_and_profile(
  p_user_id    UUID,
  p_email     TEXT,
  p_full_name TEXT,
  p_business_name TEXT,
  p_phone     TEXT DEFAULT NULL,
  p_website   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug     TEXT;
  v_ws_id    UUID;
  v_user_id  UUID := auth.uid();
BEGIN
  -- Only the authenticated user can create their own signup workspace
  IF v_user_id IS NULL OR v_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Prevent duplicate profile (idempotent: do not create twice)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('workspace_id', (SELECT workspace_id FROM profiles WHERE id = p_user_id), 'error', NULL);
  END IF;

  -- Generate slug: lowercase, replace non-alphanumeric with dash, append random
  v_slug := lower(regexp_replace(trim(p_business_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '');
  v_slug := v_slug || '-' || floor(1000 + random() * 9000)::int;

  -- Insert workspace (SECURITY DEFINER bypasses RLS)
  INSERT INTO workspaces (name, slug, status, settings, onboarding_data)
  VALUES (trim(p_business_name), v_slug, 'pending', '{}'::jsonb, '{}'::jsonb)
  RETURNING id INTO v_ws_id;

  -- Insert profile for this user
  INSERT INTO profiles (id, email, company_name, role, admin_scope, workspace_id, status, is_demo, phone, website, onboarding_status)
  VALUES (
    p_user_id,
    p_email,
    trim(p_business_name),
    'admin',
    'workspace',
    v_ws_id,
    'active',
    false,
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_website), ''),
    'not_started'
  );

  RETURN jsonb_build_object('workspace_id', v_ws_id, 'error', NULL);
EXCEPTION
  WHEN unique_violation THEN
    -- Slug collision: return existing workspace if profile exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
      RETURN jsonb_build_object('workspace_id', (SELECT workspace_id FROM profiles WHERE id = p_user_id), 'error', NULL);
    END IF;
    RAISE;
END;
$$;

-- Allow authenticated users to call this (function checks auth.uid() = p_user_id)
GRANT EXECUTE ON FUNCTION create_signup_workspace_and_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
