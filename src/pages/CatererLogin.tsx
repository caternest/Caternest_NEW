import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock } from 'lucide-react';
import { toast } from '../components/Toast';

export default function CatererLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawRegistrations = localStorage.getItem('registrations');
    let approved = false;
    let pending = false;
    let rejected = false;
    let wrongPassword = false;
    let userFound = false;
    let userName = 'Caterer Partner';
    let catererId = '';
    let userPhone = '';

    if (rawRegistrations) {
        const registrations = JSON.parse(rawRegistrations);
        
        // Find all accounts matching email, phone, or username
        const inputString = formData.email.trim().toLowerCase();
        const matches = registrations.filter((r: any) => {
            const e = (r.email || '').toLowerCase();
            const p = (r.phone || '');
            const u = (r.username || '').toLowerCase();
            return e === inputString || p === formData.email.trim() || u === inputString;
        });
        
        if (matches.length > 0) {
            userFound = true;
            
            // Prefer Approved over others if multiple registrations exist with the same email
            matches.sort((a: any, b: any) => {
                const rank = (s: string) => s === 'Approved' ? 3 : s === 'Pending Approval' ? 2 : 1;
                return rank(b.status) - rank(a.status);
            });

            // Find the one where password matches
            const validMatch = matches.find((m: any) => m.password === formData.password);
            
            if (!validMatch) {
                wrongPassword = true;
            } else {
                if (validMatch.status === 'Suspended') {
                    approved = false;
                    toast('Your account is currently suspended. Please contact support.', 'error');
                    return;
                }
                if (validMatch.status === 'Trashed' || validMatch.status === 'Deleted') {
                    approved = false;
                    toast('Your account has been deactivated.', 'error');
                    return;
                }
                if (validMatch.status === 'Approved') {
                    approved = true;
                    userName = validMatch.owner || validMatch.businessName;
                    catererId = validMatch.id;
                    userPhone = validMatch.phone || '0000000000';
                } else if (validMatch.status === 'Pending Approval') {
                    pending = true;
                } else if (validMatch.status === 'Rejected') {
                    rejected = true;
                }
            }
        }
    }

    if (!userFound || wrongPassword) {
        setError("Invalid email or password.");
        return;
    }

    if (pending) {
        setError("Your account is under review. Our team is verifying your profile.");
        return;
    }

    if (rejected) {
        setError("Your account has been rejected. Please contact administrator.");
        return;
    }

    if (!approved) {
        setError("Account not approved.");
        return;
    }

    login({
      id: catererId,
      name: userName,
      email: formData.email,
      phone: userPhone,
      roles: ['user', 'partner'],
    });
    
    localStorage.setItem('catererDashboardId', catererId);
    toast("Login successful! Welcome to your dashboard.", "success");
    navigate('/caterer-dashboard');
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
      
      <div className="w-full max-w-md relative z-10">
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
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-medium text-center">
                    {error}
                </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-brand-green-200 ml-1">Email, Phone, or Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-green-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-brand-green-950/50 border border-brand-green-800 rounded-xl text-white placeholder:text-brand-green-700 focus:ring-2 focus:ring-brand-gold-500/50 focus:border-brand-gold-500 transition-all outline-none"
                  placeholder="Enter registered email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-medium text-brand-green-200">Password</label>
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
                  className="w-full pl-11 pr-4 py-3.5 bg-brand-green-950/50 border border-brand-green-800 rounded-xl text-white placeholder:text-brand-green-700 focus:ring-2 focus:ring-brand-gold-500/50 focus:border-brand-gold-500 transition-all outline-none"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-green-950 font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-brand-gold-500/20 mt-6"
            >
              Login to Dashboard
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
