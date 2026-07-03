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

    try {
      // Fetch from profiles table
      console.log("[AUDIT LOG] Fetching profile from 'profiles' table for ID:", authUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn("[AUDIT LOG] Error fetching user profile:", error.message || error, error);
      }

      let activeProfile = profile;

      // Fallback: If authenticated but profile row hasn't been created yet, create it on the fly
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
          must_change_password: false
        };

        console.log("[AUDIT LOG] Triggering upsert of fallback profile row:", newProfile);
        try {
          const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (insertErr) {
            console.warn("[AUDIT LOG] Fallback profile generation database insert returned error:", insertErr.message || insertErr);
            activeProfile = newProfile;
          } else {
            console.log("[AUDIT LOG] Fallback profile generated in database. Result row:", inserted);
            activeProfile = inserted || newProfile;
          }
        } catch (innerErr: any) {
          console.warn("[AUDIT LOG] Gracefully caught exception during fallback profile insertion:", innerErr);
          activeProfile = newProfile;
        }
      }

      // Identity Drift Repair Guard
      if (activeProfile) {
        let needsProfileUpdate = false;
        const updatePayload: any = {};

        // 1. Auto Repair Profiles Email
        if (authUser.email && activeProfile.email !== authUser.email) {
          console.log(`[IDENTITY REPAIR] Drift detected: activeProfile email "${activeProfile.email}" != authUser email "${authUser.email}". Repairing profiles...`);
          updatePayload.email = authUser.email;
          activeProfile.email = authUser.email;
          needsProfileUpdate = true;
        }

        // 2. Auto Repair Admin Role Drift
        const isAdminEmail = ['meda1824@gmail.com', 'ybmk24@gmail.com'].includes(authUser.email?.toLowerCase().trim());
        const isAdminRole = authUser.user_metadata?.role === 'admin';
        if ((isAdminEmail || isAdminRole) && activeProfile.role !== 'admin') {
          console.log(`[IDENTITY REPAIR] Admin drift detected: profile role "${activeProfile.role}" != "admin" for admin user. Repairing role...`);
          updatePayload.role = 'admin';
          activeProfile.role = 'admin';
          needsProfileUpdate = true;
        }

        if (needsProfileUpdate) {
          try {
            await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', authUser.id);
            console.log("[IDENTITY REPAIR] Profiles table updated successfully with correct identity values.");
          } catch (updateErr) {
            console.error("[IDENTITY REPAIR] Error repairing profiles row in DB:", updateErr);
          }
        }

        // 3. Auto Repair Caterer Registrations Email
        if (authUser.email) {
          try {
            const { data: regs, error: regsErr } = await supabase
              .from('caterer_registrations')
              .select('id, email')
              .eq('userId', authUser.id);

            if (!regsErr && regs && regs.length > 0) {
              for (const r of regs) {
                if (r.email !== authUser.email) {
                  console.log(`[IDENTITY REPAIR] Drift detected: caterer_registrations email "${r.email}" != authUser email "${authUser.email}". Repairing registration ID "${r.id}"...`);
                  await supabase
                    .from('caterer_registrations')
                    .update({ email: authUser.email })
                    .eq('id', r.id);
                  console.log(`[IDENTITY REPAIR] Registration ID "${r.id}" successfully repaired.`);
                }
              }
            }
          } catch (rErr) {
            console.warn("[IDENTITY REPAIR] Caterer registration email check failed:", rErr);
          }
        }
      }

      // Map role to backward compatible roles array
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
    console.log("[DEBUG LOG] refreshSession manual invocation started...");
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[DEBUG LOG] refreshSession: Supabase client not configured.");
      setLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[DEBUG LOG] refreshSession: fetched session. User present:", !!session?.user);
      if (session?.user) {
        const u = await syncProfile(session.user);
        console.log("[DEBUG LOG] refreshSession: Profile synced. User state set to:", u);
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[DEBUG LOG] refreshSession check failed with exception:", err);
    } finally {
      setLoading(false);
      console.log("[DEBUG LOG] refreshSession loading set to false.");
    }
  };

  useEffect(() => {
    console.log("[DEBUG LOG] AuthProvider: useEffect mounting...");
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[DEBUG LOG] AuthProvider: Supabase client not configured. Setting loading to false.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let initialCheckDone = false;

    // 1. Perform standard session retrieval exactly once during startup, blocking loading = false
    const checkSession = async () => {
      console.log("[DEBUG LOG] Timeline Step 1: App Loaded. Running checkSession...");
      if (isMounted) {
        setLoading(true);
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("[DEBUG LOG] Timeline Step 3: Session user found:", session.user.email, "Syncing profile...");
          const mappedUser = await syncProfile(session.user);
          if (isMounted) {
            setUser(mappedUser);
          }
        } else {
          console.log("[DEBUG LOG] Timeline Step 3: No valid session returned from getSession.");
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("[DEBUG LOG] Timeline Step 3: Exception caught while getting session:", err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        initialCheckDone = true;
        if (isMounted) {
          setLoading(false);
          console.log("[DEBUG LOG] Timeline Step 5: Initial auth loading state set to false.");
        }
      }
    };

    // 2. Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[DEBUG LOG] onAuthStateChange event: ${event}`);
      if (!initialCheckDone) return;

      try {
        if (session?.user) {
          const mappedUser = await syncProfile(session.user);
          if (isMounted) {
            setUser(mappedUser);
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Error in onAuthStateChange handler:", err);
      }
    });

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      console.log("[DEBUG LOG] AuthProvider: useEffect cleaning up subscription.");
    };
  }, []);

  // Function to register users natively
  const signUp = async (email: string, password: string, name: string, phone: string, role: 'customer' | 'caterer' = 'customer') => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
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
    if (data && data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: normalizedEmail,
          full_name: name,
          role,
          must_change_password: false
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn("Redundant client-side profile creation skipped/handled in backend:", e);
      }
    }

    return { data, error: null };
  };

  // Login natively
  const signIn = async (emailOrUsername: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");

    let targetEmail = emailOrUsername.trim().toLowerCase();
    console.log("[AUDIT LOG] signIn called with payload:", {
      emailOrUsername,
      targetEmail,
      passwordLength: password?.length,
    });

    // If input does not contain '@', it's a username. Resolve to email from caterer_registrations.
    if (!targetEmail.includes("@")) {
      try {
        console.log(
          "[AUDIT LOG] Input looks like a username. Querying active caterer_registrations...",
        );
        const { data: regs, error: lookupErr } = await supabase
          .from("caterer_registrations")
          .select("email")
          .eq("username", targetEmail)
          .eq("status", "Approved")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (lookupErr) {
          console.error(
            "[AUDIT LOG] Error resolving username to email:",
            lookupErr,
          );
        } else if (regs && regs.length > 0 && regs[0].email) {
          console.log(
            `[AUDIT LOG] Resolved username "${targetEmail}" to email "${regs[0].email}"`,
          );
          targetEmail = regs[0].email;
        } else {
          console.warn(
            `[AUDIT LOG] No approved email found associated with username "${targetEmail}"`,
          );
        }
      } catch (err) {
        console.error(
          "[AUDIT LOG] Exception during username resolution:",
          err,
        );
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    return { data, error };
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
    
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
    } catch (fetchErr: any) {
      if (fetchErr?.message?.includes('Failed to fetch') || fetchErr?.toString()?.includes('Failed to fetch')) {
        console.warn("[AUDIT LOG] Direct reset password fetch failed. Retrying via high-reliability server auth proxy...");
        try {
          const proxyRes = await fetch('/api/auth/reset-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              redirectTo: redirectUrl
            })
          });
          if (proxyRes.ok) {
            return { error: null };
          } else {
            const errText = await proxyRes.text();
            return { error: { message: errText || "Proxy reset password failed" } };
          }
        } catch (proxyErr: any) {
          return { error: { message: proxyErr.message || "Proxy reset password exception" } };
        }
      }
      throw fetchErr;
    }
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
