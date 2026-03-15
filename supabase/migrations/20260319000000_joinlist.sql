-- ============================================================
-- Joinlist: self-signup workspaces require super-admin approval
-- ============================================================

-- 1. Change default workspace status to 'pending' for new signups.
--    Existing workspaces are unaffected (their status stays 'active').
ALTER TABLE workspaces ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Add onboarding wizard fields to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Approval RPC — activates workspace + approves all profiles + sends notification
CREATE OR REPLACE FUNCTION approve_workspace_joinlist(p_workspace_id UUID, p_admin_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE workspaces
    SET status = 'active', updated_at = now()
    WHERE id = p_workspace_id;

  UPDATE profiles
    SET onboarding_status = 'approved'
    WHERE workspace_id = p_workspace_id;

  INSERT INTO notifications (recipient_id, type, title, message, link)
    SELECT
      id,
      'WORKSPACE_APPROVED',
      'Your workspace has been approved!',
      'Welcome to Vrocure. You can now access your dashboard.',
      '/control-centre'
    FROM profiles
    WHERE workspace_id = p_workspace_id AND role = 'admin';
END;
$$;

-- 4. Reject RPC — archives workspace + marks profiles rejected
CREATE OR REPLACE FUNCTION reject_workspace_joinlist(p_workspace_id UUID, p_admin_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE workspaces
    SET status = 'archived', updated_at = now()
    WHERE id = p_workspace_id;

  UPDATE profiles
    SET onboarding_status = 'rejected'
    WHERE workspace_id = p_workspace_id;
END;
$$;
