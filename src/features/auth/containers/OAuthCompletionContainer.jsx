import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { createSignupWorkspaceAndProfile } from '@/services/workspaceService';
import OAuthCompletionView from '@/features/auth/presentational/OAuthCompletionView';

export default function OAuthCompletionContainer() {
  const navigate = useNavigate();
  const { currentUser, oauthUser, needsOAuthCompletion, clearOAuthCompletion, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user already has a complete profile, redirect away
  useEffect(() => {
    if (currentUser && !needsOAuthCompletion) {
      navigate('/control-centre', { replace: true });
    }
  }, [currentUser, needsOAuthCompletion, navigate]);

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
      const { error: provErr } = await createSignupWorkspaceAndProfile({
        userId: user.id,
        email,
        fullName: name,
        businessName: businessName.trim(),
        phone: phone.trim(),
        website: website.trim() || undefined,
      });
      if (provErr) throw provErr;

      await refreshProfile();
      clearOAuthCompletion();
      toast({ title: 'Workspace ready!', description: 'Welcome to Vrocure.' });
      navigate('/control-centre', { replace: true });
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
