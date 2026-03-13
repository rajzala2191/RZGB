import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  fetchProfileByUserId,
  getSession,
  logActivity as logAuthActivity,
  onAuthStateChange,
  signInWithPassword,
  signOut,
} from '@/services/authService';

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
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

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

  // Helper to fetch profile data. Fail closed if missing/invalid.
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await fetchProfileByUserId(userId);

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error.message);
        clearProfileState();
        return false;
      }

      if (!data?.role) {
        console.error('AuthContext: Missing profile or role for user:', userId);
        clearProfileState();
        return false;
      }

      setUserRole(data.role);
      setUserCompanyName(data.company_name || null);
      setUserLogoUrl(data.logo_url || null);
      setIsDemo(Boolean(data.is_demo));
      setWorkspaceId(data.workspace_id || null);
      setAdminScope(data.admin_scope || 'workspace');
      return true;
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching profile:', error);
      clearProfileState();
      return false;
    }
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
            const profileOk = await fetchUserProfile(session.user.id);
            if (!profileOk) {
              setProfileError('Your account is not fully set up. Please contact your administrator.');
              await signOut();
              setCurrentUser(null);
              clearProfileState();
            }
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
          const profileOk = await fetchUserProfile(session.user.id);
          if (!profileOk && event !== 'SIGNED_OUT') {
            setProfileError('Your account is not fully set up. Please contact your administrator.');
            await signOut();
            setCurrentUser(null);
            clearProfileState();
          }
        } else {
          setCurrentUser(null);
          clearProfileState();
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearProfileState, fetchUserProfile]);

  const login = async (email, password) => {
    setProfileError(null);
    try {
      const { data, error } = await signInWithPassword({
        email,
        password,
      });

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
      await signOut();
      setCurrentUser(null);
      clearProfileState();
    } catch (error) {
      console.error('AuthContext: Error logging out:', error.message);
    }
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
    loading,
    profileError,
    clearProfileError,
    login,
    logout,
    refreshProfile: async () => {
      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      }
    }
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