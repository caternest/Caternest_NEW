import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: Math.random().toString(),
      name: 'Super Admin',
      email: formData.username || 'admin@caternest.com',
      phone: '0000000000',
      roles: ['user', 'admin'],
    });
    navigate('/admin-dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
               <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Admin Access</h1>
            <p className="text-slate-400 text-center text-sm">Secure login required to access the CaterNest management console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Enter any username"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Enter any password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/20 mt-6"
            >
              Authenticate
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
