import { useState } from 'react';
import { Check, X, Building2, Search, ArrowRight, ShieldCheck, Mail, Phone, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('pending');
  
  const pendingCaterers = [
    { id: 1, name: "Hyderabadi Grand Events", owner: "Mohammed Ali", phone: "+91 9988776655", date: "2 hours ago", status: "pending", location: "Jubilee Hills" },
    { id: 2, name: "Sri Balaji Caterers", owner: "V. Sharma", phone: "+91 8877665544", date: "5 hours ago", status: "pending", location: "Madhapur" },
    { id: 3, name: "Urban Tastes", owner: "Sneha Reddy", phone: "+91 7766554433", date: "1 day ago", status: "pending", location: "Kukatpally" },
  ];

  return (
    <div className="pt-24 pb-20 bg-brand-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2 flex items-center gap-3">
              <ShieldCheck className="text-brand-gold-500" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-slate-600 font-poppins text-sm">Manage caterers, review approvals, and monitor platform health.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-2">
             <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors font-poppins">
               Export Report
             </button>
          </div>
        </div>

        {/* Analytics mini */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Active Caterers', val: '142', inc: '+3 this week' },
            { label: 'Pending Approvals', val: pendingCaterers.length.toString(), inc: 'Requires review' },
            { label: 'Total Orders', val: '8,420', inc: '+12% vs last month' },
            { label: 'Revenue Generated', val: '₹4.5Cr', inc: 'All time' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
               <p className="text-sm font-medium text-slate-500 mb-2 font-poppins">{stat.label}</p>
               <h3 className="text-3xl font-display font-bold text-brand-green-900 mb-1">{stat.val}</h3>
               <p className="text-[11px] text-brand-gold-600 font-semibold uppercase tracking-wider">{stat.inc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-brand-green-900/5 overflow-hidden">
           <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div className="flex space-x-6">
                <button onClick={() => setActiveTab('pending')} className={cn("text-sm font-bold tracking-wide uppercase pb-4 -mb-4 border-b-[3px] transition-colors font-poppins", activeTab === 'pending' ? "border-brand-gold-500 text-brand-green-900" : "border-transparent text-slate-500 hover:text-slate-800")}>
                  Approvals <span className="ml-1 bg-brand-gold-100 text-brand-gold-700 px-2 py-0.5 rounded-full text-xs">{pendingCaterers.length}</span>
                </button>
                <button onClick={() => setActiveTab('approved')} className={cn("text-sm font-bold tracking-wide uppercase pb-4 -mb-4 border-b-[3px] transition-colors font-poppins", activeTab === 'approved' ? "border-brand-gold-500 text-brand-green-900" : "border-transparent text-slate-500 hover:text-slate-800")}>
                  Active Caterers
                </button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search businesses..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold-500 font-poppins" />
              </div>
           </div>
           
           {activeTab === 'pending' && (
             <div className="divide-y divide-slate-100">
               {pendingCaterers.map(c => (
                 <div key={c.id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-brand-green-50/30 transition-colors group">
                    <div className="flex gap-4 items-start w-full lg:w-1/3">
                       <div className="w-12 h-12 bg-brand-gold-50 text-brand-gold-600 rounded-xl flex items-center justify-center shrink-0 border border-brand-gold-100">
                         <Building2 size={24} />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 text-lg mb-0.5">{c.name}</h4>
                         <p className="text-sm text-brand-gold-600 font-medium">Applied {c.date}</p>
                       </div>
                    </div>

                    <div className="flex gap-6 w-full lg:w-auto text-sm text-slate-600 font-poppins">
                        <div>
                            <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1"><Mail size={14} className="text-brand-gold-500"/> Contact Info</p>
                            <p>{c.owner}</p>
                            <p>{c.phone}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">Location</p>
                            <p>{c.location}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto mt-4 lg:mt-0 flex-wrap">
                       <button className="flex-1 lg:flex-none justify-center px-4 py-2.5 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-2 transition-colors">
                         <Eye size={16} /> Request Changes
                       </button>
                       <button className="flex-1 lg:flex-none justify-center px-4 py-2.5 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-xl flex items-center gap-2 transition-colors border border-red-100">
                         <X size={16} /> Reject
                       </button>
                       <button className="flex-1 lg:flex-none justify-center px-6 py-2.5 text-sm font-medium bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-md shadow-brand-green-900/20 rounded-xl flex items-center gap-2 transition-colors">
                         <Check size={16} /> Approve
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           )}

           {activeTab === 'approved' && (
             <div className="p-16 flex flex-col items-center justify-center text-center">
                 <ShieldCheck size={48} className="text-brand-gold-200 mb-4" />
                 <h4 className="text-xl font-bold font-display text-slate-800 mb-2">No Active Filters</h4>
                 <p className="text-slate-500 font-poppins text-sm max-w-sm">Use search to find active caterers, or view the analytics overview to see live statistics.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
