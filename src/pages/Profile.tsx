import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Shield, Mail, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
      return (
          <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
             <h1 className="text-3xl font-bold font-display text-slate-800 mb-4">Please log in</h1>
          </div>
      );
  }

  return (
    <div className="pt-24 pb-20 min-h-[80vh] bg-slate-50 font-poppins">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">My Profile</h1>
        
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
           <div className="flex items-start gap-6 border-b border-slate-100 pb-8 mb-8">
               <div className="w-24 h-24 rounded-full bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center text-3xl font-bold font-display">
                  {user.name.charAt(0)}
               </div>
               <div>
                   <h2 className="text-2xl font-bold text-slate-900 border-none outline-none">{user.name}</h2>
                   <p className="text-slate-500 flex items-center gap-2 mt-1"><Mail size={16} /> {user.email}</p>
                   
                   <div className="flex gap-2 mt-3 flex-wrap">
                      {user.roles.includes('admin') && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5"><Shield size={12}/> Admin Role</span>
                      )}
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">User</span>
                   </div>
               </div>
           </div>

           <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900">Account Security</h3>
              
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-500">
                          <Key size={18} />
                      </div>
                      <div>
                          <p className="font-semibold text-sm text-slate-800">Password</p>
                          <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                      </div>
                  </div>
                  <button className="text-sm font-semibold text-brand-green-900 bg-brand-green-50 px-4 py-2 rounded-lg hover:bg-brand-green-100 transition-colors">Change</button>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-500">
                          <Settings size={18} />
                      </div>
                      <div>
                          <p className="font-semibold text-sm text-slate-800">Manage Data</p>
                          <p className="text-xs text-slate-500">Download or delete your account</p>
                      </div>
                  </div>
                  <button className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">Manage</button>
              </div>
           </div>

           <div className="mt-10 pt-6 border-t border-slate-100">
               <button onClick={() => { logout(); navigate('/'); }} className="text-red-600 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                   Log Out
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
