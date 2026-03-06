import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCompanyName, setUserCompanyName] = useState(null);
  const [userLogoUrl, setUserLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

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

  // Helper to fetch profile data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, company_name, status')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error.message);
        return null;
      }

      if (data) {
        setUserRole(data.role);
        setUserCompanyName(data.company_name);
      } else {
        // Fallback if profile doesn't exist yet (though handle_new_user trigger should create it)
        setUserRole('client');
        setUserCompanyName(null);
        setUserLogoUrl(null);
        return { role: 'client' };
      }

      // Fetch logo_url separately so a missing column never blocks login
      try {
        const { data: logoData } = await supabase
          .from('profiles')
          .select('logo_url')
          .eq('id', userId)
          .maybeSingle();
        setUserLogoUrl(logoData?.logo_url || null);
      } catch (_) {
        setUserLogoUrl(null);
      }

      return data;
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            setCurrentUser(null);
            setUserRole(null);
            setUserCompanyName(null);
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
          if (session.user.id !== currentUser?.id) {
            setCurrentUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            setCurrentUser(session.user);
            if (!userRole) await fetchUserProfile(session.user.id);
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
          setUserCompanyName(null);
          setUserLogoUrl(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      setUserRole(null);
      setUserCompanyName(null);
      setUserLogoUrl(null);
    } catch (error) {
      console.error('AuthContext: Error logging out:', error.message);
    }
  };

  const value = {
    currentUser,
    userRole,
    userCompanyName,
    userLogoUrl,
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