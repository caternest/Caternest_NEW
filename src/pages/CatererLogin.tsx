import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from '../components/Toast';
import { getSupabase } from '../lib/supabase';
import { safeSaveRegistrations } from '../lib/utils';

export default function CatererLogin() {
  const { signIn, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const inputId = formData.identifier.trim();
    if (!inputId) {
      setError("Please enter your email, username, or mobile number.");
      setLoading(false);
      return;
    }

    let resolvedEmail = '';

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError("Database is temporarily unavailable.");
        setLoading(false);
        return;
      }

      if (inputId.includes('@')) {
        resolvedEmail = inputId.toLowerCase();
      } else {
        // Resolve email using username or phone lookups
        const { data: matchedRegs, error: lookupErr } = await supabase
          .from('caterer_registrations')
          .select('email, id, status, userId, username, phone')
          .or(`phone.eq.${inputId},username.eq.${inputId},username.eq.${inputId.toLowerCase()}`);

        if (lookupErr) {
          console.error("Error looking up caterer account:", lookupErr);
        }

        if (!matchedRegs || matchedRegs.length === 0) {
          setError("No caterer account found with the provided email, username, or mobile number.");
          setLoading(false);
          return;
        }

        // Retrieve registration containing a valid email Address
        const resolvedRecord = matchedRegs.find(r => r.email) || matchedRegs[0];
        if (!resolvedRecord || !resolvedRecord.email) {
          setError("No caterer account found with the provided email, username, or mobile number.");
          setLoading(false);
          return;
        }

        resolvedEmail = resolvedRecord.email.toLowerCase();
      }

      // 1. Sign in natively via Supabase
      console.log("[AUDIT LOG] CatererLogin.tsx invoking signIn with payload:", {
        email: resolvedEmail,
        passwordLength: formData.password?.length
      });

      let signInResult = await signIn(resolvedEmail, formData.password);
      let authUser = signInResult?.data?.user;
      let signInErr = signInResult?.error;

      if (signInErr) {
        setError(signInErr.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (!authUser) {
        setError("User session could not be established.");
        setLoading(false);
        return;
      }

      // 2. Fetch their registration to verify status
      const { data: registrations, error: regError } = await supabase
        .from('caterer_registrations')
        .select('*')
        .or(`userId.eq.${authUser.id},email.eq.${resolvedEmail}`);

      if (regError) {
        console.error("Error checking caterer registration:", regError);
      }

      // If user is also an Admin, they can view everything and bypass status checks
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      const isAdmin = profile?.role === 'admin';

      if (!registrations || registrations.length === 0) {
        if (isAdmin) {
          toast("Authenticating Admin into Caterer Dashboard...", "success");
          navigate('/caterer-dashboard');
          return;
        }
        setError("No registered caterer profile found for this account. Go to the Join page to register.");
        await logout();
        setLoading(false);
        return;
      }

      // Sort status priorities: Approved is preferred
      const sortedRegs = [...registrations].sort((a: any, b: any) => {
        const rank = (s: string) => (s || '').toLowerCase() === 'approved' ? 3 : (s || '').toLowerCase() === 'pending approval' ? 2 : 1;
        return rank(b.status) - rank(a.status);
      });

      const activeReg = sortedRegs[0];

      // Keep registration userId synchronized with authentic authUser id if it is misaligned or has demo value
      if (activeReg && activeReg.userId !== authUser.id) {
         console.log(`[CATERER LOGIN] Aligning register userId "${activeReg.userId}" to current secure session id "${authUser.id}"...`);
         const { error: syncUserIdErr } = await supabase
           .from('caterer_registrations')
           .update({ userId: authUser.id })
           .eq('id', activeReg.id);

         if (syncUserIdErr) {
           console.warn("[CATERER LOGIN] Failed to sync userId back to Cloud DB schema:", syncUserIdErr.message);
         } else {
           activeReg.userId = authUser.id;
           // Keep localCache registrations in perfect local sync
           const rawLocal = localStorage.getItem('registrations');
           if (rawLocal) {
              const allLocal = JSON.parse(rawLocal);
              const updatedLocal = allLocal.map((r: any) => r.id === activeReg.id ? { ...r, userId: authUser.id } : r);
              safeSaveRegistrations(updatedLocal);
           }
         }
      }

      const status = (activeReg.status || '').toLowerCase();

      if (status === 'suspended') {
        setError("Your account is currently suspended. Please contact coordinator support.");
        await logout();
        setLoading(false);
        return;
      }

      if (status === 'trashed' || status === 'deleted') {
        setError("Your account has been deactivated.");
        await logout();
        setLoading(false);
        return;
      }

      if (status === 'rejected') {
        setError("Your registration request was not approved.");
        await logout();
        setLoading(false);
        return;
      }

      if (status === 'pending verification') {
        setError("Your registration is pending email verification. Please sign up again to complete verification.");
        await logout();
        setLoading(false);
        return;
      }

      if (status === 'pending approval' || status === 'pending') {
        setError("Your account is under review. Please wait for coordinator approval.");
        await logout();
        setLoading(false);
        return;
      }

      // Save active caterer ID to local session
      localStorage.setItem('catererDashboardId', activeReg.id);
      toast("Login successful! Welcome to coordinates.", "success");
      navigate('/caterer-dashboard');
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during check-in.");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-brand-green-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10 font-poppins">
        <div className="bg-brand-green-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-brand-green-800">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-gold-500/20 text-brand-gold-500 rounded-full flex items-center justify-center mb-4">
               <ChefHat size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Caterer Login</h1>
            <p className="text-brand-green-200 text-center text-sm">Access your partner dashboard and manage your orders.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-brand-green-200 ml-1">Email, Username or Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-green-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  name="identifier"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-brand-green-950 border border-brand-green-800 rounded-xl text-white placeholder:text-brand-green-700 focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500 transition-all outline-none text-sm"
                  placeholder="Enter email, username or mobile number"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-medium text-brand-green-200 animate-pulse">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-green-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-brand-green-950 border border-brand-green-800 rounded-xl text-white placeholder:text-brand-green-700 focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500 transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-green-900 font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-brand-gold-500/20 mt-6 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Authenticating Partner...' : 'Caterer Check-In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
