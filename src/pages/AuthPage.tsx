import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Mail, Phone, Lock, User as UserIcon, CheckCircle2, ChevronLeft, Building } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'signup' | 'forgot';
type LoginMethod = 'email' | 'mobile';

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [showOtpField, setShowOtpField] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const location = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMode === 'forgot' && !showOtpField) {
      setShowOtpField(true);
      return;
    }
    if (currentMode === 'signup' && !showOtpField) {
        setShowOtpField(true);
        return;
    }
    
    // Check if the email suggests admin
    const isAdmin = formData.email.toLowerCase().includes('admin');
    
    // Final submission
    login({
      id: Math.random().toString(),
      name: formData.name || 'Test User',
      email: formData.email,
      phone: formData.phone,
      roles: isAdmin ? ['user', 'admin'] : ['user'],
    });
    
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-brand-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-green-900/5 overflow-hidden border border-brand-green-100/50">
        <div className="bg-brand-green-900 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gold-900/20 mix-blend-overlay" />
          <div className="relative z-10">
            {currentMode === 'forgot' && (
              <button 
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
          {currentMode === 'login' && (
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
               <button 
                 type="button"
                 onClick={() => setLoginMethod('email')}
                 className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-colors", loginMethod === 'email' ? "bg-white text-brand-green-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
               >
                 Email
               </button>
               <button 
                 type="button"
                 onClick={() => setLoginMethod('mobile')}
                 className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-colors", loginMethod === 'mobile' ? "bg-white text-brand-green-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
               >
                 Mobile OTP
               </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {currentMode === 'signup' && !showOtpField && (
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
            
            {(!showOtpField || currentMode === 'login') && (
                <>
                {((currentMode === 'login' && loginMethod === 'email') || currentMode === 'signup' || (currentMode === 'forgot' && loginMethod === 'email')) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="you@example.com" />
                    </div>
                  </motion.div>
                )}

                {((currentMode === 'login' && loginMethod === 'mobile') || (currentMode === 'forgot' && loginMethod === 'mobile')) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="+91" />
                    </div>
                  </motion.div>
                )}

                {(currentMode === 'login' && loginMethod === 'email') && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-700 font-poppins">Password</label>
                      <button type="button" onClick={() => setCurrentMode('forgot')} className="text-xs font-semibold text-brand-gold-600 hover:text-brand-gold-700">Forgot Password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                    </div>
                  </motion.div>
                )}

                {currentMode === 'signup' && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                      </div>
                    </motion.div>
                    <div className="flex items-start gap-2 mt-2">
                        <input type="checkbox" required className="mt-1 accent-brand-gold-500" />
                        <p className="text-xs text-slate-500 leading-tight">By creating an account, I agree to the <a href="#" className="text-brand-gold-600">Terms of Service</a> and <a href="#" className="text-brand-gold-600">Privacy Policy</a>.</p>
                    </div>
                  </>
                )}
                </>
            )}

            {showOtpField && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Enter OTP</label>
                  <p className="text-xs text-slate-500 mb-2">We've sent a code to your {loginMethod === 'mobile' ? 'mobile' : 'email'}.</p>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="otp" value={formData.otp} onChange={handleChange} type="text" maxLength={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-center tracking-[0.5em] font-medium" placeholder="------" />
                  </div>
                  {currentMode === 'forgot' && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input required name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 font-poppins">Confirm New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold-500 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                          </div>
                        </div>
                      </div>
                  )}
                </motion.div>
            )}

            <button type="submit" className="w-full bg-brand-green-900 text-white font-medium font-poppins py-3.5 rounded-xl hover:bg-brand-green-800 transition-colors shadow-lg shadow-brand-green-900/30 mt-6 md:text-sm">
              {currentMode === 'login' 
                ? (loginMethod === 'mobile' && !showOtpField ? 'Send OTP' : 'Sign In') 
                : currentMode === 'signup' && !showOtpField 
                ? 'Create Account' 
                : currentMode === 'forgot' && !showOtpField
                ? 'Send Reset Link'
                : 'Verify & Proceed'
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
                    <button className="flex-1 w-full border border-slate-200 hover:bg-slate-50 py-3 rounded-xl text-slate-700 font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        Google
                    </button>
                </div>
              </>
          )}

          <p className="text-center text-slate-500 mt-8 text-sm">
            {currentMode === 'login' ? "Don't have an account? " : currentMode === 'signup' ? "Already have an account? " : "Remember your password? "}
            <button 
                onClick={() => {
                    setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
                    setShowOtpField(false);
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
