import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Mail, Phone, Lock, User as UserIcon, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from '../components/Toast';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (currentMode === 'forgot') {
        const { error: resetErr } = await resetPassword(formData.email);
        if (resetErr) {
          setError(resetErr.message || "Failed to send reset email.");
        } else {
          toast("Password reset link sent to your email!", "success");
          setCurrentMode('login');
        }
      } else if (currentMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const { error: signUpErr } = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.phone,
          'customer'
        );

        if (signUpErr) {
          setError(signUpErr.message || "Registration failed.");
        } else {
          toast("Account created successfully! You are now logged in.", "success");
          const from = location.state?.from || '/';
          navigate(from, { replace: true });
        }
      } else {
        // Native email login
        const { data, error: signInErr } = await signIn(formData.email, formData.password);
        if (signInErr) {
          setError(signInErr.message || "Invalid email or password.");
        } else {
          toast("Logged in successfully!", "success");
          const from = location.state?.from || '/';
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error: googleErr } = await signInWithGoogle();
      if (googleErr) {
        setError(googleErr.message || "Google authentication failed.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to initialize Google Login.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-brand-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-green-900/5 overflow-hidden border border-brand-green-100/50">
        <div className="bg-brand-green-900 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gold-900/20 mix-blend-overlay" />
          <div className="relative z-10">
            {currentMode === 'forgot' && (
              <button 
                type="button"
                onClick={() => setCurrentMode('login')} 
                className="absolute left-0 top-0 p-2 text-brand-gold-300 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="bg-brand-gold-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-brand-gold-500/20">
              <ChefHat size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
              {currentMode === 'login' ? 'Welcome Back' : currentMode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-brand-green-100/80 font-poppins text-sm">
              {currentMode === 'login' 
                ? 'Sign in to access your orders and favorites.' 
                : currentMode === 'signup' 
                ? 'Join CaterNest to explore premium catering services.'
                : 'Enter your details to reset your password.'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm font-medium text-center mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {currentMode === 'signup' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="+91" />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="you@example.com" />
              </div>
            </div>

            {currentMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700 font-poppins">Password</label>
                  {currentMode === 'login' && (
                    <button type="button" onClick={() => setCurrentMode('forgot')} className="text-xs font-semibold text-brand-gold-600 hover:text-brand-gold-700">Forgot Password?</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                </div>
              </div>
            )}

            {currentMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-green-900 text-white font-medium font-poppins py-3.5 rounded-xl hover:bg-brand-green-800 transition-colors shadow-lg shadow-brand-green-900/30 mt-6 md:text-sm flex items-center justify-center gap-2"
            >
              {loading 
                ? 'Processing...' 
                : currentMode === 'login' 
                ? 'Sign In' 
                : currentMode === 'signup' 
                ? 'Create Account' 
                : 'Send Reset Link'
              }
            </button>
          </form>

          {currentMode !== 'forgot' && (
            <>
              <div className="relative mt-6 mb-6 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <span className="relative bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-widest font-poppins">Or continue with</span>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full border border-slate-200 hover:bg-slate-50 py-3 rounded-xl text-slate-700 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>
              </div>
            </>
          )}

          <p className="text-center text-slate-500 mt-8 text-sm">
            {currentMode === 'login' ? "Don't have an account? " : currentMode === 'signup' ? "Already have an account? " : "Remember your password? "}
            <button 
              type="button"
              onClick={() => {
                setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
              }} 
              className="text-brand-gold-600 font-semibold hover:text-brand-gold-700"
            >
              {currentMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
