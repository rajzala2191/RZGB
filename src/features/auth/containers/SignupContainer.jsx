import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import SignupView from '@/features/auth/presentational/SignupView';

export default function SignupContainer() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, currentUser, userRole } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect already-logged-in users to their dashboard
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'super_admin' || (userRole === 'admin')) {
        navigate('/control-centre', { replace: true });
      } else if (userRole === 'client') {
        navigate('/client-dashboard', { replace: true });
      } else if (userRole === 'supplier') {
        navigate('/supplier-hub', { replace: true });
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: signUpError } = await signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        website: website.trim() || undefined,
      });
      if (signUpError) throw signUpError;
      toast({ title: 'Welcome to Vrocure!', description: 'Your workspace is ready.' });
      // Navigation handled by useEffect above via onAuthStateChange
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error: oauthErr } = await signInWithGoogle();
    if (oauthErr) setError(oauthErr.message);
    // On success, browser is redirected by Supabase OAuth
  };

  return (
    <SignupView
      fullName={fullName}
      businessName={businessName}
      email={email}
      phone={phone}
      website={website}
      password={password}
      loading={loading}
      error={error}
      onFullNameChange={e => setFullName(e.target.value)}
      onBusinessNameChange={e => setBusinessName(e.target.value)}
      onEmailChange={e => setEmail(e.target.value)}
      onPhoneChange={e => setPhone(e.target.value)}
      onWebsiteChange={e => setWebsite(e.target.value)}
      onPasswordChange={e => setPassword(e.target.value)}
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}
