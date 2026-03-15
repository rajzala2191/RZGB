import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isRZGBDomain } from '@/lib/portalConfig';
import { getDefaultRouteForUser } from '@/lib/portalDirects';
import LandingPage from '@/pages/LandingPage';
import RZGBLandingPage from '@/pages/RZGBLandingPage';

/**
 * Renders the appropriate landing page at "/".
 * - rzglobalsolutions.co.uk → RZGBLandingPage
 * - vrocure.co.uk / portal → LandingPage
 * Logged-in users are redirected to their portal via getDefaultRouteForUser
 * (respects workspace status and onboarding so admins go to onboarding when pending).
 */
export default function HomeOrRedirect() {
  const { currentUser, userRole, workspaceStatus, onboardingStatus, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !currentUser || !userRole) return;
    if (userRole === 'admin' && workspaceStatus == null) return;
    const path = getDefaultRouteForUser(userRole, workspaceStatus, onboardingStatus);
    if (path && path !== '/login') navigate(path, { replace: true });
  }, [loading, currentUser, userRole, workspaceStatus, onboardingStatus, navigate]);

  if (isRZGBDomain()) return <RZGBLandingPage />;
  return <LandingPage />;
}
