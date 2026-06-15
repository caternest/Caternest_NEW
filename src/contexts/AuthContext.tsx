import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'caterer' | 'customer';
  roles: string[]; // ['user', 'admin'] or ['user', 'partner', 'caterer'] or ['user']
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string, role?: 'customer' | 'caterer') => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch/create database profiles
  const syncProfile = async (authUser: any): Promise<User | null> => {
    const supabase = getSupabase();
    if (!supabase || !authUser) return null;

    try {
      // 1. Fetch from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error.message);
      }

      let activeProfile = profile;

      // 2. Fallback: Ifauthenticated but profile row hasn't been created yet, create it on the fly
      if (!activeProfile) {
        console.log("No profile row found. Autoincrement/Upserting fallback profile...");
        const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
        const metaRole = authUser.user_metadata?.role || 'customer';
        
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: metaName,
          role: metaRole,
          must_change_password: false // Social logins shouldn't be forced to change password
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertErr) {
          console.error("Fallback profile generation failed:", insertErr.message);
          activeProfile = newProfile; // Use virtual representation to prevent crash
        } else {
          activeProfile = inserted;
        }
      }

      // 3. Map role to backward compatible roles array
      const roleStr = activeProfile.role as 'admin' | 'caterer' | 'customer';
      let rolesArr: string[] = ['user'];
      if (roleStr === 'admin') {
        rolesArr = ['user', 'admin'];
      } else if (roleStr === 'caterer') {
        rolesArr = ['user', 'partner', 'caterer'];
      }

      return {
        id: authUser.id,
        name: activeProfile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
        email: authUser.email || '',
        phone: authUser.phone || authUser.user_metadata?.phone || '',
        role: roleStr,
        roles: rolesArr,
        must_change_password: activeProfile.must_change_password
      };
    } catch (err) {
      console.error("Fatal error during profile sync:", err);
      return null;
    }
  };

  const refreshSession = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const u = await syncProfile(session.user);
      setUser(u);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH EVENT]: ${event}`);
      if (session?.user) {
        const mappedUser = await syncProfile(session.user);
        setUser(mappedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Initial load
    refreshSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Function to register users natively
  const signUp = async (email: string, password: string, name: string, phone: string, role: 'customer' | 'caterer' = 'customer') => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role
        }
      }
    });

    if (error) return { data: null, error };

    // Explicit client-side profile creation as a secondary redundant layer to the triggers
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: name,
          role,
          must_change_password: false // Regular signups shouldn't be forced unless specified
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn("Redundant client-side profile creation skipped/handled in backend:", e);
      }
    }

    return { data, error: null };
  };

  // Login natively
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  };

  // Logout natively
  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('catererDashboardId');
  };

  // Reset Password instruction
  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    
    // Redirects back to our preview dashboard change password view
    const redirectUrl = `${window.location.origin}/change-password`;
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
  };

  // Update password flow
  const updatePassword = async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error };

    // Set must_change_password to false in their profile if update was successful
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);
      
      setUser(prev => prev ? { ...prev, must_change_password: false } : null);
    }

    return { error: null };
  };

  // Native Google OAuth login helper
  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      logout,
      resetPassword,
      updatePassword,
      signInWithGoogle,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
