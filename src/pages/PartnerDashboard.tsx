import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Activity, MessageSquare, ChefHat, Edit, Star, Image as ImageIcon, Settings, Bell, TrendingUp, CalendarDays, ChevronRight, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function PartnerDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caterer, setCaterer] = useState<any>(null);
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
       const all = JSON.parse(raw);
       const found = all.find((c: any) => c.id === id);
       if (found) {
           setCaterer(found);
       }
    }
    
    // Fetch orders
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
        const allOrders = JSON.parse(rawOrders);
        const myOrders = allOrders.filter((o: any) => o.catererId === id);
        // sort by newest
        myOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPartnerOrders(myOrders);
    }
  }, [id]);

  if (!caterer) return <div className="pt-32 pb-24 text-center">Loading dashboard...</div>;

  const handleEditClick = () => {
     navigate(`/edit-business/${caterer.id}`);
  };

  const totalOrders = partnerOrders.length;
  const pendingOrders = partnerOrders.filter(o => o.status === 'Pending Caterer Review').length;
  const approvedOrders = partnerOrders.filter(o => o.status === 'Approved').length;
  const modifiedOrders = partnerOrders.filter(o => o.status === 'Modified').length;
  const rejectedOrders = partnerOrders.filter(o => o.status === 'Rejected').length;
  const completedOrders = partnerOrders.filter(o => o.status === 'Completed').length;
  
  // Calculate Revenue from Approved and Completed
  const revenue = partnerOrders
      .filter(o => o.status === 'Approved' || o.status === 'Completed')
      .reduce((acc, curr) => acc + (Number(curr.totalEstimate) || 0), 0);

  const stats = [
    { label: 'Total Orders', val: totalOrders, trend: 'All Time', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Review', val: pendingOrders, trend: 'Needs action', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Revenue Earned', val: `₹${revenue.toLocaleString('en-IN')}`, trend: 'Approved & Completed', icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Completed Orders', val: completedOrders, trend: 'Delivered', icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
               <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl font-display font-bold text-slate-900">{caterer.businessName}</h1>
                   <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md", caterer.status === 'Approved' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                       {caterer.status}
                   </span>
               </div>
               <p className="text-slate-500 font-poppins text-sm flex items-center gap-2">
                   Partner Dashboard • ID: {id}
               </p>
            </div>
            
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/orders')} className="relative p-2.5 bg-white text-slate-500 hover:text-brand-green-900 rounded-xl border border-slate-200 transition-colors shadow-sm">
                   <Bell size={20} />
                   {pendingOrders > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-gold-500 rounded-full border-2 border-white"></span>}
               </button>
               <button onClick={() => navigate(`/edit-business/${caterer.id}`)} className="bg-brand-green-900 hover:bg-brand-green-800 text-white px-5 py-2.5 rounded-xl font-bold font-poppins text-sm shadow-md transition-colors flex items-center gap-2">
                  <Edit size={16} /> Edit Business
               </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-green-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                      <stat.icon size={22} />
                    </div>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{stat.val}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-2">{stat.label}</p>
                  <p className="text-xs font-semibold text-brand-green-700">{stat.trend}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-green-50 text-green-600 p-3 rounded-lg"><CheckCircle size={20}/></div>
              <div>
                 <p className="text-sm font-bold text-slate-500">Approved</p>
                 <p className="text-xl font-bold text-slate-900">{approvedOrders}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg"><RefreshCw size={20}/></div>
              <div>
                 <p className="text-sm font-bold text-slate-500">Modified</p>
                 <p className="text-xl font-bold text-slate-900">{modifiedOrders}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-red-50 text-red-600 p-3 rounded-lg"><XCircle size={20}/></div>
              <div>
                 <p className="text-sm font-bold text-slate-500">Rejected</p>
                 <p className="text-xl font-bold text-slate-900">{rejectedOrders}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays size={18}/> Recent Orders</h3>
                       <button onClick={() => navigate('/orders')} className="text-xs font-bold text-brand-green-700 hover:underline">View CRM</button>
                   </div>
                   <div className="divide-y divide-slate-100 flex-1 h-[400px] overflow-y-auto">
                       {partnerOrders.length === 0 ? (
                           <div className="p-8 text-center text-slate-500">No orders received yet.</div>
                       ) : (
                           partnerOrders.map(ord => (
                               <div key={ord.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                   <div>
                                       <p className="font-bold text-slate-900 text-sm mb-1">{ord.customerName} - {ord.packageDetails?.packageName || 'Custom'}</p>
                                       <p className="text-xs text-slate-500">{ord.id} • Event Date: {ord.eventDate || 'TBD'} • Guests: {ord.guests}</p>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", 
                                           ord.status === 'Approved' || ord.status === 'Completed' ? "bg-green-100 text-green-800" :
                                           ord.status === 'Pending Caterer Review' || 'Submitted' ? "bg-amber-100 text-amber-800" :
                                           ord.status === 'Rejected' || ord.status === 'Cancelled' ? "bg-red-100 text-red-800" :
                                           "bg-blue-100 text-blue-800")}>
                                          {ord.status}
                                       </span>
                                       <button onClick={() => navigate('/orders')} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand-green-900 hover:bg-slate-50 transition-colors">
                                           <ChevronRight size={16} />
                                       </button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <button onClick={handleEditClick} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-900 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                           <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><ChefHat size={16}/></div>
                           Edit Core Menu Items
                        </button>
                        <button onClick={handleEditClick} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-900 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Package size={16}/></div>
                           Update Package Plans
                        </button>
                        <button onClick={handleEditClick} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-900 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                           <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center"><ImageIcon size={16}/></div>
                           Manage Photos & Gallery
                        </button>
                        <button onClick={handleEditClick} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-900 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Settings size={16}/></div>
                           Business Settings
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-brand-green-900 to-brand-green-950 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
                    <h3 className="font-display font-bold text-lg mb-2">Growth Center</h3>
                    <p className="text-sm font-poppins opacity-80 mb-6">Complete your profile 100% to rank higher in customer searches.</p>
                    <div className="w-full bg-brand-green-800/50 rounded-full h-2.5 mb-2">
                        <div className="bg-brand-gold-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs font-bold text-brand-gold-400 text-right">75% Completed</p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
