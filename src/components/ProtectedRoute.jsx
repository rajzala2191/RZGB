import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole, requiredRoles, skipOnboardingCheck = false }) => {
  const {
    currentUser, userRole, isSuperAdmin, isCustomerAdmin, adminScope,
    workspaceStatus, onboardingStatus, loading, needsOAuthCompletion,
    workspaceId,
  } = useAuth();
  const location = useLocation();
  const [mfaVerified, setMfaVerified] = useState(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : []);

  useEffect(() => {
    if (!currentUser || userRole !== 'admin') return;
    if (localStorage.getItem('rzgb-demo-session')) { setMfaVerified(true); return; }
    setMfaLoading(true);
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      setMfaVerified(data?.currentLevel === 'aal2');
      setMfaLoading(false);
    });
  }, [currentUser, userRole]);

  const mfaApplies = userRole === 'admin';
  // Admin with workspace must wait for workspaceStatus/onboardingStatus before gating (prevents race → control-centre buffering)
  const adminAwaitingWorkspaceStatus = userRole === 'admin' && workspaceId && workspaceStatus === null;
  if (loading || (currentUser && !userRole) || (mfaApplies && mfaLoading) || adminAwaitingWorkspaceStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
          <p className="text-slate-600 text-xl">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Google OAuth users without profile must complete setup first
  if (needsOAuthCompletion) {
    return <Navigate to="/oauth-completion" state={{ from: location }} replace />;
  }

  // Require MFA only for customer admins (control-centre); super_admin can use platform-admin without MFA
  if (userRole === 'admin' && mfaVerified === false) {
    const isSettingsPath = location.pathname.startsWith('/control-centre/settings');
    if (!isSettingsPath) {
      return <Navigate to="/control-centre/settings?mfa=required" state={{ from: location }} replace />;
    }
  }

  if (allowedRoles.length > 0) {
    const isPlatformRoute = allowedRoles.includes('super_admin');
    const isAdminRoute = allowedRoles.includes('admin');

    if (isPlatformRoute) {
      if (!isSuperAdmin) {
        if (userRole === 'admin') return <Navigate to="/control-centre" replace />;
        if (userRole === 'client') return <Navigate to="/client-dashboard" replace />;
        if (userRole === 'supplier') return <Navigate to="/supplier-hub" replace />;
        return <Navigate to="/login" replace />;
      }
    } else if (isAdminRoute) {
      if (userRole !== 'admin') {
        if (userRole === 'client') return <Navigate to="/client-dashboard" replace />;
        if (userRole === 'supplier') return <Navigate to="/supplier-hub" replace />;
        return <Navigate to="/login" replace />;
      }
    } else {
      const hasRole = allowedRoles.includes(userRole);
      const superAdminBypass = isSuperAdmin;
      if (!hasRole && !superAdminBypass) {
        if (userRole === 'admin') return <Navigate to="/control-centre" replace />;
        if (userRole === 'client') return <Navigate to="/client-dashboard" replace />;
        if (userRole === 'supplier') return <Navigate to="/supplier-hub" replace />;
        return <Navigate to="/login" replace />;
      }
    }
  }

  // Gate suppliers who haven't completed their onboarding
  if (userRole === 'supplier' && !skipOnboardingCheck && onboardingStatus && onboardingStatus !== 'approved') {
    if (location.pathname !== '/supplier-hub/onboarding') {
      return <Navigate to="/supplier-hub/onboarding" replace />;
    }
  }

  // Gate pending workspace admins: must complete onboarding before accessing the app
  if (userRole === 'admin' && workspaceStatus === 'pending') {
    if (onboardingStatus === 'not_started' || onboardingStatus === null) {
      if (location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
    } else if (onboardingStatus === 'completed') {
      if (location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" replace />;
      }
    }
  }

  // Block archived (rejected) workspace admins from portal
  if (userRole === 'admin' && workspaceStatus === 'archived') {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
