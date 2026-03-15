import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES, getDefaultRedirectForRole } from '@/lib/accessPolicy';
import OnboardingWizard from '@/features/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { currentUser, workspaceStatus, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else if (workspaceStatus === 'active') {
      navigate(getDefaultRedirectForRole(ROLES.ADMIN), { replace: true });
    }
  }, [currentUser, workspaceStatus, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--app-bg)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#FF6B35' }} />
      </div>
    );
  }

  return <OnboardingWizard />;
}
