import { supabase } from '@/lib/customSupabaseClient';

export const signInWithPassword = async ({ email, password }) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = async (options) => supabase.auth.signOut(options);

export const getSession = async () => supabase.auth.getSession();

export const onAuthStateChange = (callback) => supabase.auth.onAuthStateChange(callback);

export const resetPasswordForEmail = async (email) =>
  supabase.auth.resetPasswordForEmail(email);

export const verifyRecoveryOtp = async ({ email, token }) =>
  supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });

export const updateUserPassword = async (password) =>
  supabase.auth.updateUser({ password });

export const fetchProfileByUserId = async (userId) =>
  supabase
    .from('profiles')
    .select('role, company_name, logo_url, is_demo, status, workspace_id, admin_scope')
    .eq('id', userId)
    .maybeSingle();

export const fetchProfileExtras = async (userId) =>
  supabase
    .from('profiles')
    .select('onboarding_status')
    .eq('id', userId)
    .maybeSingle();

export const fetchWorkspaceStatus = async (workspaceId) =>
  supabase
    .from('workspaces')
    .select('status')
    .eq('id', workspaceId)
    .maybeSingle();

export const logActivity = async ({ userId, action, status, details }) =>
  supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    status,
    details,
    ip_address: 'client-side',
  });

export const signUpWithEmail = ({ email, password, fullName }) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/oauth-completion` },
  });

