import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isRZGBDomain } from '@/lib/portalConfig';
import { getDefaultRedirectForRole } from '@/lib/accessPolicy';
import LandingPage from '@/pages/LandingPage';
import RZGBLandingPage from '@/pages/RZGBLandingPage';

/**
 * Renders the appropriate landing page at "/".
 * - rzglobalsolutions.co.uk → RZGBLandingPage
 * - vrocure.co.uk / portal → LandingPage
 * Logged-in users are redirected to their dashboard in the background.
 */
export default function HomeOrRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userRole) {
      const target = getDefaultRedirectForRole(userRole);
      if (target) navigate(target, { replace: true });
    }
  }, [loading, currentUser, userRole, navigate]);

  if (isRZGBDomain()) return <RZGBLandingPage />;
  return <LandingPage />;
}
