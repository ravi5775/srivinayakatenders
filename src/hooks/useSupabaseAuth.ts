import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  // Get client IP for logging
  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return null;
    }
  };

  // Fetch user profile
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user && !data.session) {
        return { success: true, message: 'Please check your email to confirm your account' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; message?: string }> => {
    if (!authState.user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', authState.user.id);

      if (error) {
        return { success: false, message: error.message };
      }

      // Refresh profile
      const updatedProfile = await fetchProfile(authState.user.id);
      if (updatedProfile) {
        setAuthState(prev => ({ ...prev, profile: updatedProfile }));
      }

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;

      if (user) {
        fetchProfile(user.id).then(profile => {
          setAuthState({
            user,
            session,
            profile,
            loading: false,
            isAuthenticated: true,
            isAdmin: profile?.role === 'admin',
          });
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;

        if (user) {
          const profile = await fetchProfile(user.id);
          setAuthState({
            user,
            session,
            profile,
            loading: false,
            isAuthenticated: true,
            isAdmin: profile?.role === 'admin',
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getClientIP,
  };
};