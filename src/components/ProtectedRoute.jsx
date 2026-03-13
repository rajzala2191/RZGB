import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole, requiredRoles, skipOnboardingCheck = false }) => {
  const { currentUser, userRole, isSuperAdmin, isCustomerAdmin, adminScope, loading } = useAuth();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : []);

  useEffect(() => {
    if (!currentUser || userRole !== 'supplier' || skipOnboardingCheck) return;
    setOnboardingLoading(true);
    supabase
      .from('profiles')
      .select('onboarding_status')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingStatus(data?.onboarding_status ?? 'approved');
        setOnboardingLoading(false);
      });
  }, [currentUser, userRole, skipOnboardingCheck]);

  useEffect(() => {
    if (!currentUser || (userRole !== 'admin' && userRole !== 'super_admin')) return;
    if (localStorage.getItem('rzgb-demo-session')) { setMfaVerified(true); return; }
    setMfaLoading(true);
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      setMfaVerified(data?.currentLevel === 'aal2');
      setMfaLoading(false);
    });
  }, [currentUser, userRole]);

  if (loading || (currentUser && !userRole) || onboardingLoading || mfaLoading) {
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

  if ((userRole === 'admin' || userRole === 'super_admin') && mfaVerified === false) {
    const isSettingsPath = userRole === 'super_admin'
      ? location.pathname.startsWith('/platform-admin/settings')
      : location.pathname.startsWith('/control-centre/settings');
    if (!isSettingsPath) {
      const settingsPath = userRole === 'super_admin' ? '/platform-admin/settings?mfa=required' : '/control-centre/settings?mfa=required';
      return <Navigate to={settingsPath} state={{ from: location }} replace />;
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

  if (userRole === 'supplier' && !skipOnboardingCheck && onboardingStatus && onboardingStatus !== 'approved') {
    if (location.pathname !== '/supplier-hub/onboarding') {
      return <Navigate to="/supplier-hub/onboarding" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
