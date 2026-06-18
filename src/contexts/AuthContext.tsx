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

let isSupabaseOffline = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch/create database profiles
  const syncProfile = async (authUser: any): Promise<User | null> => {
    console.log("[AUDIT LOG] syncProfile start for user ID:", authUser?.id, "Email:", authUser?.email);
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[AUDIT LOG] syncProfile: Supabase client is not configured!");
      return null;
    }
    if (!authUser) {
      console.warn("[AUDIT LOG] syncProfile: authUser input is null or undefined!");
      return null;
    }

    if (isSupabaseOffline) {
      console.log("[AUDIT LOG] syncProfile: Supabase is marked offline. Using fast local cache/metadata fallback instead of querying.");
      const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User';
      const metaRole = authUser.user_metadata?.role || 'customer';
      const roleStr = metaRole as 'admin' | 'caterer' | 'customer';
      let rolesArr: string[] = ['user'];
      if (roleStr === 'admin') {
        rolesArr = ['user', 'admin'];
      } else if (roleStr === 'caterer') {
        rolesArr = ['user', 'partner', 'caterer'];
      }
      return {
        id: authUser.id,
        name: metaName,
        email: authUser.email || '',
        phone: authUser.phone || authUser.user_metadata?.phone || '',
        role: roleStr,
        roles: rolesArr,
        must_change_password: false
      };
    }

    try {
      // 1. Fetch from profiles table with query timeout protection to prevent hanging
      console.log("[AUDIT LOG] Fetching profile from 'profiles' table for ID:", authUser.id);
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // Race with a 3.5 second timeout to guarantee we never hang the UI/login flow
      const fetchResult = await Promise.race([
        fetchPromise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Database profile fetch timed out")), 3500))
      ]).catch((err) => {
        console.warn("[AUDIT LOG] Profile fetch error or timeout:", err);
        isSupabaseOffline = true; // Mark offline for fast-path next time
        return { data: null, error: err };
      });

      const profile = fetchResult?.data;
      const error = fetchResult?.error;

      if (error) {
        console.warn("[AUDIT LOG] Error fetching user profile:", error.message || error, error);
      } else {
        console.log("[AUDIT LOG] Raw profile query successfully returned profile data:", profile);
      }

      if (profile === null || profile === undefined) {
        console.log("[AUDIT LOG] Profile fetch returned null. Exact database response metadata fields - data:", profile, "error:", error);
      }

      let activeProfile = profile;

      // 2. Fallback: If authenticated but profile row hasn't been created yet, create it on the fly
      if (!activeProfile) {
        console.log("[AUDIT LOG] No profile row found in DB. Autoincrement/Upserting fallback profile...");
        const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
        const metaRole = authUser.user_metadata?.role || 'customer';
        console.log("[AUDIT LOG] Prepared fallback profile name:", metaName, "role:", metaRole);
        
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: metaName,
          role: metaRole,
          must_change_password: false // Social logins shouldn't be forced to change password
        };

        console.log("[AUDIT LOG] Triggering upsert/insert of fallback profile row:", newProfile);
        try {
          const insertPromise = supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          const insertResult = await Promise.race([
            insertPromise,
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Database profile insert timed out")), 3500))
          ]).catch((err) => {
            console.warn("[AUDIT LOG] Fallback profile generation database insert exception caught:", err);
            isSupabaseOffline = true; // Mark offline for fast-path next time
            return { data: null, error: err };
          });

          const inserted = insertResult?.data;
          const insertErr = insertResult?.error;

          if (insertErr) {
            console.warn("[AUDIT LOG] Fallback profile generation database insert returned error (likely RLS error):", insertErr.message || insertErr, insertErr);
            activeProfile = newProfile; // Use virtual representation to prevent crash and complete login flow
          } else {
            console.log("[AUDIT LOG] Fallback profile generated in database. Result row:", inserted);
            activeProfile = inserted || newProfile;
          }
        } catch (innerErr: any) {
          console.warn("[AUDIT LOG] Gracefully caught exception during fallback profile insertion (likely RLS error):", innerErr);
          activeProfile = newProfile; // Handle gracefully inside the flow, do not throw
        }
      }

      // Prevent activeProfile.role access when activeProfile is null by creating a safe fallback representation
      if (!activeProfile) {
        console.warn("[AUDIT LOG] activeProfile is still null after fetch and fallback checks. Constructing emergency virtual fallback profile to avoid crash.");
        activeProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
          role: authUser.user_metadata?.role || 'customer',
          must_change_password: false
        };
      }

      // 3. Map role to backward compatible roles array
      const resolvedRole = activeProfile ? activeProfile.role : 'customer';
      console.log("[AUDIT LOG] Resolved activeProfile role field:", resolvedRole);
      const roleStr = (resolvedRole || 'customer') as 'admin' | 'caterer' | 'customer';
      let rolesArr: string[] = ['user'];
      if (roleStr === 'admin') {
        rolesArr = ['user', 'admin'];
      } else if (roleStr === 'caterer') {
        rolesArr = ['user', 'partner', 'caterer'];
      }

      const syncResult: User = {
        id: authUser.id,
        name: (activeProfile && activeProfile.full_name) || authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
        email: authUser.email || '',
        phone: authUser.phone || authUser.user_metadata?.phone || '',
        role: roleStr,
        roles: rolesArr,
        must_change_password: activeProfile ? !!activeProfile.must_change_password : false
      };

      console.log("[AUDIT LOG] syncProfile final mapped user state:", syncResult);
      return syncResult;
    } catch (err) {
      console.warn("[AUDIT LOG] Exception caught during trace/sync of profile:", err);
      // Emergency safe fallback to complete authentication flow if everything else exceptions out
      try {
        const fallbackUser: User = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
          email: authUser.email || '',
          phone: authUser.phone || authUser.user_metadata?.phone || '',
          role: (authUser.user_metadata?.role || 'customer') as 'admin' | 'caterer' | 'customer',
          roles: authUser.user_metadata?.role === 'admin' ? ['user', 'admin'] : authUser.user_metadata?.role === 'caterer' ? ['user', 'partner', 'caterer'] : ['user'],
          must_change_password: false
        };
        console.log("[AUDIT LOG] Caught sync exception, recovering with fallback user definition:", fallbackUser);
        return fallbackUser;
      } catch (nestedErr) {
        console.warn("[AUDIT LOG] CRITICAL: Failed to construct even emergency fallback representation:", nestedErr);
        return null;
      }
    }
  };

  const refreshSession = async () => {
    console.log("[AUDIT LOG] refreshSession invoked.");
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[AUDIT LOG] refreshSession: Supabase client not configured.");
      setLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[AUDIT LOG] refreshSession: fetched session. User present:", !!session?.user);
      if (session?.user) {
        const u = await syncProfile(session.user);
        console.log("[AUDIT LOG] refreshSession: Profile synced. User state set to:", u);
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[AUDIT LOG] refreshSession check failed with exception:", err);
    } finally {
      setLoading(false);
      console.log("[AUDIT LOG] refreshSession loading set to false.");
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH EVENT]: ${event}`, "Session User ID:", session?.user?.id);
      try {
        if (session?.user) {
          console.log("[AUDIT LOG] Auth state change with active user session. Syncing profile...");
          const mappedUser = await syncProfile(session.user);
          console.log("[AUDIT LOG] Auth state change profile mapping complete. setUser logic running with:", mappedUser);
          setUser(mappedUser);
        } else {
          console.log("[AUDIT LOG] Auth state changed: No user session present. setUser(null)");
          setUser(null);
        }
      } catch (evtErr) {
        console.error("[AUDIT LOG] Auth state change callback crashed:", evtErr);
      } finally {
        setLoading(false);
        console.log("[AUDIT LOG] Auth state change loading set to false.");
      }
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
    console.log("[AUDIT LOG] logout() initiated.");
    const supabase = getSupabase();
    try {
      if (supabase) {
        await supabase.auth.signOut();
        console.log("[AUDIT LOG] supabase.auth.signOut() completed successfully.");
      }
    } catch (e: any) {
      console.error("[AUDIT LOG] Error calling supabase.auth.signOut() inside logout flow:", e.message || e);
    } finally {
      setUser(null);
      
      // Explicitly clean up all Supabase auth tokens and cached fields from localStorage and sessionStorage
      try {
        console.log("[AUDIT LOG] Explicitly sweeping localStorage and sessionStorage auth tokens and user caches...");
        
        // 1. Clear known user-specific / business-specific cached state keys statically
        const userCacheKeys = [
          'registrations',
          'orders',
          'notifications',
          'auditLogs',
          'caterer_join_form_data',
          'catererDashboardId'
        ];
        
        userCacheKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // 2. Clear Supabase local storage tokens statically using collected keys to avoid mutating during iteration
        const localKeys = Object.keys(localStorage);
        localKeys.forEach(key => {
          if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
            localStorage.removeItem(key);
          }
        });
        
        // 3. Clear Supabase session storage tokens statically using collected keys
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
            sessionStorage.removeItem(key);
          }
        });
      } catch (storageErr) {
        console.error("[AUDIT LOG] Error clearing storage tokens:", storageErr);
      }
      
      console.log("[AUDIT LOG] logout() finalized. User state set to null.");
    }
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
