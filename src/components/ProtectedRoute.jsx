import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getDefaultRedirectForRole } from '@/lib/accessPolicy';
import { Loader2, RefreshCw } from 'lucide-react';

const VERIFY_TIMEOUT_MS = 12_000;

const ProtectedRoute = ({ children, requiredRole, requiredRoles, skipOnboardingCheck = false }) => {
  const {
    currentUser, userRole, isSuperAdmin, isCustomerAdmin, adminScope,
    workspaceStatus, onboardingStatus, loading, needsOAuthCompletion,
    workspaceId,
  } = useAuth();
  const location = useLocation();
  const [mfaVerified, setMfaVerified] = useState(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);

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
  const showingSpinner = loading || (currentUser && !userRole) || (mfaApplies && mfaLoading) || adminAwaitingWorkspaceStatus;

  // If we're stuck on "Verifying access..." for too long, show a way out
  useEffect(() => {
    setVerifyTimedOut(false);
    if (!showingSpinner) return;
    const t = setTimeout(() => setVerifyTimedOut(true), VERIFY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [showingSpinner]);
  if (showingSpinner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          {!verifyTimedOut ? (
            <>
              <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
              <p className="text-slate-600 text-xl">Verifying access...</p>
            </>
          ) : (
            <>
              <p className="text-slate-600 text-xl text-center max-w-sm">Verification is taking longer than usual.</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:opacity-90"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                <Link
                  to="/login"
                  className="text-slate-600 text-sm hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
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

  // Onboarding gates first: any link they open should send them to onboarding until it's done
  // Pending workspace admins: must complete onboarding before accessing any app route
  if (userRole === 'admin' && workspaceStatus === 'pending') {
    if (onboardingStatus === 'not_started' || onboardingStatus === null) {
      if (location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
      }
    } else if (onboardingStatus === 'completed') {
      if (location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" state={{ from: location }} replace />;
      }
    }
  }
  // Block archived (rejected) workspace admins from portal
  if (userRole === 'admin' && workspaceStatus === 'archived') {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" state={{ from: location }} replace />;
    }
  }
  // Suppliers who haven't completed onboarding go to supplier onboarding
  if (userRole === 'supplier' && !skipOnboardingCheck && onboardingStatus && onboardingStatus !== 'approved') {
    if (location.pathname !== '/supplier-hub/onboarding') {
      return <Navigate to="/supplier-hub/onboarding" state={{ from: location }} replace />;
    }
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
        const target = getDefaultRedirectForRole(userRole);
        return <Navigate to={target || '/login'} replace />;
      }
    } else if (isAdminRoute) {
      if (userRole !== 'admin') {
        const target = getDefaultRedirectForRole(userRole);
        return <Navigate to={target || '/login'} replace />;
      }
    } else {
      const hasRole = allowedRoles.includes(userRole);
      const superAdminBypass = isSuperAdmin;
      if (!hasRole && !superAdminBypass) {
        const target = getDefaultRedirectForRole(userRole);
        return <Navigate to={target || '/login'} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
