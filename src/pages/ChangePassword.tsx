import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Lock, ShieldAlert, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from '../components/Toast';
import { getSupabase } from '../lib/supabase';

export default function ChangePassword() {
  const { updatePassword, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [verifyingRecovery, setVerifyingRecovery] = useState(true);

  useEffect(() => {
    // Check if URL has recovery tokens in hash or query
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasRecoveryToken = hash.includes('type=recovery') || search.includes('type=recovery');

    if (hasRecoveryToken) {
      setIsRecoverySession(true);
    }

    // Give Supabase a brief moment to process recovery hash from URL if arriving from email link
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsRecoverySession(true);
        }
        setVerifyingRecovery(false);
      }).catch(() => {
        setVerifyingRecovery(false);
      });
    } else {
      setVerifyingRecovery(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(formData.password);
      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
      } else {
        // If this was a forced password change for an active logged in user
        if (user?.must_change_password) {
          toast("Password updated successfully!", "success");
          if (user?.role === 'admin') {
            navigate('/admin-dashboard', { replace: true });
          } else if (user?.role === 'caterer') {
            navigate('/caterer-dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // Password recovery flow: sign out cleanly and redirect to login
          toast("Password reset successfully! Please log in with your new password.", "success");
          await logout();
          navigate('/login', { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // While checking session or loading auth
  if (loading || verifyingRecovery) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-brand-green-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-brand-green-100/50 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-brand-gold-500 mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium font-poppins text-sm">Verifying secure link...</p>
        </div>
      </div>
    );
  }

  // If no user and not a recovery session
  if (!user && !isRecoverySession) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-brand-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-green-900/5 overflow-hidden border border-brand-green-100/50 text-center p-8">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-slate-600 font-poppins text-sm mb-6 leading-relaxed">
            The password reset link is invalid or has expired. Please request a new password reset from the login page.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-brand-green-900 text-white font-medium font-poppins py-3 rounded-xl hover:bg-brand-green-800 transition-colors shadow-md text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-brand-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-green-900/5 overflow-hidden border border-brand-green-100/50">
        <div className="bg-brand-green-900 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gold-900/20 mix-blend-overlay" />
          <div className="relative z-10">
            <div className="bg-brand-gold-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-brand-gold-500/20">
              <ChefHat size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
              Set New Password
            </h2>
            <p className="text-brand-green-100/80 font-poppins text-sm">
              Please choose a secure new password for your PlanMyChoice account.
            </p>
          </div>
        </div>

        <div className="p-8">
          {user?.must_change_password && (
            <div className="mb-6 flex gap-3 bg-brand-gold-50 border border-brand-gold-200 text-brand-gold-800 p-4 rounded-xl text-sm font-medium">
              <ShieldAlert size={20} className="shrink-0 text-brand-gold-600 mt-0.5" />
              <div>
                <p className="font-bold">First login modification required</p>
                <p className="text-xs text-brand-gold-700/90 mt-0.5">As part of secure credential management, you must set a new password before accessing your dashboard.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 p-3 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" 
                  placeholder="At least 6 characters" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" 
                  placeholder="Repeat new password" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-brand-green-900 text-white font-medium font-poppins py-3.5 rounded-xl hover:bg-brand-green-800 transition-colors shadow-lg shadow-brand-green-900/30 mt-6 md:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {submitting ? 'Updating Password...' : 'Update Password & Proceed'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
