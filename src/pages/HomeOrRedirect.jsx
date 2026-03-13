import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isRZGBDomain } from '@/lib/portalConfig';
import LandingPage from '@/pages/LandingPage';
import RZGBLandingPage from '@/pages/RZGBLandingPage';

/**
 * Renders the appropriate landing page at "/".
 * - rzglobalsolutions.co.uk → RZGBLandingPage
 * - zaproc.co.uk / portal → LandingPage
 * Logged-in users are redirected to their dashboard in the background.
 */
export default function HomeOrRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userRole) {
      if (userRole === 'super_admin') navigate('/platform-admin', { replace: true });
      else if (userRole === 'admin') navigate('/control-centre', { replace: true });
      else if (userRole === 'client') navigate('/client-dashboard', { replace: true });
      else if (userRole === 'supplier') navigate('/supplier-hub', { replace: true });
    }
  }, [loading, currentUser, userRole, navigate]);

  if (isRZGBDomain()) return <RZGBLandingPage />;
  return <LandingPage />;
}
