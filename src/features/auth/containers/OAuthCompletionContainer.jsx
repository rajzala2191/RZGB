import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { createSignupWorkspaceAndProfile } from '@/services/workspaceService';
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

  // If user already has a complete profile (e.g. landed here by mistake), redirect to correct destination
  useEffect(() => {
    if (!currentUser || needsOAuthCompletion) return;
    if (workspaceStatus === null) {
      if (!workspaceId) navigate('/control-centre', { replace: true }); // super_admin etc.
      return;
    }
    if (workspaceStatus === 'pending') {
      if (onboardingStatus === 'not_started' || onboardingStatus === null) {
        navigate('/onboarding', { replace: true });
      } else if (onboardingStatus === 'completed') {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/control-centre', { replace: true });
      }
    } else {
      navigate('/control-centre', { replace: true });
    }
  }, [currentUser, needsOAuthCompletion, workspaceStatus, onboardingStatus, workspaceId, navigate]);

  const user = oauthUser || currentUser;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Session expired. Please sign in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = website.trim();
      const websiteValue = raw
        ? (raw.match(/^https?:\/\//i) ? raw : `https://${raw}`)
        : undefined;
      const { error: provErr } = await createSignupWorkspaceAndProfile({
        userId: user.id,
        email,
        fullName: name,
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
