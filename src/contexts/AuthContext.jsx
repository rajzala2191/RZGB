import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  fetchProfileByUserId,
  fetchProfileExtras,
  fetchWorkspaceStatus,
  getSession,
  logActivity as logAuthActivity,
  onAuthStateChange,
  signInWithPassword,
  signOut,
  signUpWithEmail,
  signInWithGoogle as signInWithGoogleService,
} from '@/services/authService';
import { createSignupWorkspaceAndProfile } from '@/services/workspaceService';
import { getLandingUrl, isPortalDomain } from '@/lib/portalConfig';

const AuthContext = createContext(undefined);
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCompanyName, setUserCompanyName] = useState(null);
  const [userLogoUrl, setUserLogoUrl] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [adminScope, setAdminScope] = useState(null);
  const [workspaceStatus, setWorkspaceStatus] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [needsOAuthCompletion, setNeedsOAuthCompletion] = useState(false);
  const [oauthUser, setOauthUser] = useState(null);

  const isSuperAdmin = userRole === 'super_admin' || (userRole === 'admin' && adminScope === 'platform');
  const isCustomerAdmin = userRole === 'admin' && adminScope === 'workspace';

  const canAccessWorkspace = useCallback((resourceWorkspaceId) => {
    if (isSuperAdmin) return true;
    return workspaceId && resourceWorkspaceId === workspaceId;
  }, [isSuperAdmin, workspaceId]);

  const clearProfileState = useCallback(() => {
    setUserRole(null);
    setUserCompanyName(null);
    setUserLogoUrl(null);
    setIsDemo(false);
    setWorkspaceId(null);
    setAdminScope(null);
    setWorkspaceStatus(null);
    setOnboardingStatus(null);
  }, []);

  const clearProfileError = useCallback(() => setProfileError(null), []);

  const logActivity = async (userId, action, status, details) => {
    try {
      if (!userId) return;
      await logAuthActivity({ userId, action, status, details });
    } catch (e) {
      console.error('Failed to log auth activity', e);
    }
  };

  // Returns 'ok' | 'missing' | 'error'
  // 'ok'      — profile loaded successfully
  // 'missing' — authenticated but no profile row / no role (invitation not completed)
  // 'error'   — transient DB / network failure; do NOT sign the user out
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await fetchProfileByUserId(userId);

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error.message);
        clearProfileState();
        return 'error';
      }

      if (!data?.role) {
        console.error('AuthContext: Missing profile or role for user:', userId);
        clearProfileState();
        return 'missing';
      }

      setUserRole(data.role);
      setUserCompanyName(data.company_name || null);
      setUserLogoUrl(data.logo_url || null);
      setIsDemo(Boolean(data.is_demo));
      setWorkspaceId(data.workspace_id || null);
      setAdminScope(data.admin_scope || 'workspace');

      return 'ok';
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching profile:', error);
      clearProfileState();
      return 'error';
    }
  }, [clearProfileState]);

  // Only called when profile is genuinely absent (not on transient errors).
  // Google OAuth new users are held for profile completion; email users are signed out.
  const handleMissingProfile = useCallback(async (user) => {
    const provider = user.app_metadata?.provider;
    const isOAuth = provider === 'google';
    if (isOAuth) {
      setNeedsOAuthCompletion(true);
      setOauthUser(user);
      return;
    }
    setProfileError('Your account isn\'t fully set up yet. Please contact your workspace administrator or reach out to support.');
    await signOut();
    setCurrentUser(null);
    clearProfileState();
  }, [clearProfileState]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            const profileResult = await fetchUserProfile(session.user.id);
            if (profileResult === 'missing') {
              await handleMissingProfile(session.user);
            }
            // 'error': transient failure — user stays logged in, profile state is cleared
          } else {
            setCurrentUser(null);
            clearProfileState();
          }
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setCurrentUser(session.user);
          const profileResult = await fetchUserProfile(session.user.id);
          if (profileResult === 'missing' && event !== 'SIGNED_OUT') {
            await handleMissingProfile(session.user);
          }
          // 'error': transient failure — don't sign out, let the user retry
        } else {
          setCurrentUser(null);
          clearProfileState();
          setNeedsOAuthCompletion(false);
          setOauthUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearProfileState, fetchUserProfile, handleMissingProfile]);

  // Workspace status + onboarding status loaded separately so they never block login.
  // Both depend on currentUser being set; workspaceId may be null for super_admin.
  useEffect(() => {
    if (!currentUser) {
      setWorkspaceStatus(null);
      setOnboardingStatus(null);
      return;
    }
    let cancelled = false;

    if (workspaceId) {
      fetchWorkspaceStatus(workspaceId).then(({ data }) => {
        if (!cancelled) setWorkspaceStatus(data?.status || null);
      }).catch(() => {
        if (!cancelled) setWorkspaceStatus(null);
      });
    } else {
      setWorkspaceStatus(null);
    }

    fetchProfileExtras(currentUser.id).then(({ data }) => {
      if (!cancelled) setOnboardingStatus(data?.onboarding_status || null);
    }).catch(() => {
      if (!cancelled) setOnboardingStatus(null);
    });

    return () => { cancelled = true; };
  }, [currentUser, workspaceId]);

  const login = async (email, password) => {
    setProfileError(null);
    try {
      const { data, error } = await signInWithPassword({ email, password });
      if (error) {
        console.error('AuthContext: Login failed:', error.message);
        throw error;
      }
      await logActivity(data.user.id, 'Login', 'Success', 'User logged in');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      setProfileError(null);
      setNeedsOAuthCompletion(false);
      setOauthUser(null);
      setCurrentUser(null);
      clearProfileState();
      await signOut({ scope: 'global' });
      if (isPortalDomain()) {
        window.location.href = getLandingUrl('/');
      }
    } catch (error) {
      console.error('AuthContext: Error logging out:', error.message);
    }
  };

  const signUp = async ({ email, password, fullName, businessName, phone, website }) => {
    setProfileError(null);
    try {
      const { data, error } = await signUpWithEmail({ email, password, fullName });
      if (error) throw error;

      if (data.user) {
        const { error: provErr } = await createSignupWorkspaceAndProfile({
          userId: data.user.id,
          email,
          fullName,
          businessName,
          phone,
          website,
        });
        if (provErr) throw provErr;
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await signInWithGoogleService();
      return { error: error || null };
    } catch (error) {
      return { error };
    }
  };

  const clearOAuthCompletion = () => {
    setNeedsOAuthCompletion(false);
    setOauthUser(null);
  };

  const value = {
    currentUser,
    userRole,
    userCompanyName,
    userLogoUrl,
    isDemo,
    workspaceId,
    adminScope,
    isSuperAdmin,
    isCustomerAdmin,
    canAccessWorkspace,
    workspaceStatus,
    onboardingStatus,
    loading,
    profileError,
    clearProfileError,
    needsOAuthCompletion,
    oauthUser,
    clearOAuthCompletion,
    login,
    logout,
    signUp,
    signInWithGoogle,
    refreshProfile: async () => {
      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
