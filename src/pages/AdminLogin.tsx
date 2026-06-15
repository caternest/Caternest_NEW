import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from '../components/Toast';

export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const adminEmails = ['meda1824@gmail.com', 'ybmk24@gmail.com'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const emailLower = formData.email.trim().toLowerCase();
    
    // Explicit email checking beforehand to enforce authorization rules
    if (!adminEmails.includes(emailLower)) {
      setError("Unauthorized. Access restricted to Admin Accounts only.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signInErr } = await signIn(emailLower, formData.password);
      if (signInErr) {
        setError(signInErr.message || "Invalid administrative credentials.");
      } else {
        toast("Authenticated as Admin!", "success");
        navigate('/admin-dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError("Authentication failed due to an unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10 font-poppins">
        <div className="bg-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
               <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Admin Access</h1>
            <p className="text-slate-400 text-center text-sm">Secure login required to access the CaterNest management console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none text-sm"
                  placeholder="admin@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-medium text-slate-300">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/20 mt-6 flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? 'Authenticating...' : 'Authenticate Access'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
