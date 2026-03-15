import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getSession } from '@/services/authService';
import { createSignupWorkspaceAndProfile } from '@/services/workspaceService';
import { ROLES, getDefaultRedirectForRole } from '@/lib/accessPolicy';
import OAuthCompletionView from '@/features/auth/presentational/OAuthCompletionView';

export default function OAuthCompletionContainer() {
  const navigate = useNavigate();
  const { currentUser, oauthUser, needsOAuthCompletion, clearOAuthCompletion, refreshProfile, workspaceStatus, onboardingStatus, workspaceId } = useAuth();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refresh session on mount so token stays valid while user fills the form (avoids "Session expired" on submit)
  useEffect(() => {
    if (!needsOAuthCompletion) return;
    supabase.auth.refreshSession().catch(() => {});
  }, [needsOAuthCompletion]);

  // If user already has a complete profile (e.g. landed here by mistake), redirect to correct destination (access policy)
  useEffect(() => {
    if (!currentUser || needsOAuthCompletion) return;
    if (workspaceStatus === null) {
      if (!workspaceId) navigate(getDefaultRedirectForRole(ROLES.SUPER_ADMIN), { replace: true });
      return;
    }
    if (workspaceStatus === 'pending') {
      if (onboardingStatus === 'not_started' || onboardingStatus === null) {
        navigate('/onboarding', { replace: true });
      } else if (onboardingStatus === 'completed') {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate(getDefaultRedirectForRole(ROLES.ADMIN), { replace: true });
      }
    } else {
      navigate(getDefaultRedirectForRole(ROLES.ADMIN), { replace: true });
    }
  }, [currentUser, needsOAuthCompletion, workspaceStatus, onboardingStatus, workspaceId, navigate]);

  const user = oauthUser || currentUser;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use in-memory user, or recover from Supabase session (avoids "Session expired" when state was cleared)
    let effectiveUser = oauthUser || currentUser;
    if (!effectiveUser) {
      const { data: { session } } = await getSession();
      effectiveUser = session?.user ?? null;
    }
    if (!effectiveUser) {
      setError('Session expired. Please sign in again.');
      return;
    }
    const effectiveName = effectiveUser.user_metadata?.full_name || effectiveUser.user_metadata?.name || '';
    const effectiveEmail = effectiveUser.email || '';

    setLoading(true);
    setError('');
    try {
      const raw = website.trim();
      const websiteValue = raw
        ? (raw.match(/^https?:\/\//i) ? raw : `https://${raw}`)
        : undefined;
      const { error: provErr } = await createSignupWorkspaceAndProfile({
        userId: effectiveUser.id,
        email: effectiveEmail,
        fullName: effectiveName,
        businessName: businessName.trim(),
        phone: phone.trim(),
        website: websiteValue,
      });
      if (provErr) throw provErr;

      await refreshProfile();
      toast({ title: 'Almost there!', description: 'Complete onboarding to activate your workspace.' });
      navigate('/onboarding', { replace: true });
      clearOAuthCompletion();
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OAuthCompletionView
      name={name}
      businessName={businessName}
      phone={phone}
      website={website}
      loading={loading}
      error={error}
      onBusinessNameChange={e => setBusinessName(e.target.value)}
      onPhoneChange={e => setPhone(e.target.value)}
      onWebsiteChange={e => setWebsite(e.target.value)}
      onSubmit={handleSubmit}
    />
  );
}
