import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext(undefined);
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCompanyName, setUserCompanyName] = useState(null);
  const [userLogoUrl, setUserLogoUrl] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearProfileState = useCallback(() => {
    setUserRole(null);
    setUserCompanyName(null);
    setUserLogoUrl(null);
    setIsDemo(false);
  }, []);

  const logActivity = async (userId, action, status, details) => {
    try {
      if (!userId) return;
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action,
        status,
        details,
        ip_address: 'client-side'
      });
    } catch (e) {
      console.error('Failed to log auth activity', e);
    }
  };

  // Helper to fetch profile data. Fail closed if missing/invalid.
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, company_name, logo_url, is_demo, status')
        .eq('id', userId)
        .maybeSingle();

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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            const profileOk = await fetchUserProfile(session.user.id);
            if (!profileOk) {
              await supabase.auth.signOut();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setCurrentUser(session.user);
          const profileOk = await fetchUserProfile(session.user.id);
          if (!profileOk && event !== 'SIGNED_OUT') {
            await supabase.auth.signOut();
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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
      await supabase.auth.signOut();
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
    loading,
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