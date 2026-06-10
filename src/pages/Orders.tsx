import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Search, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from '../components/Toast';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
        let allOrders = JSON.parse(rawOrders);
        if (user) {
           if (user.roles.includes('admin')) {
               // Admin sees all
           } else if (user.roles.includes('partner')) {
               // In a real app we'd map catererId to ownerId, here we will match catererName to user's registered caterers if needed, 
               // but for simplicity, let's just show all for partner or mock it? 
               // Wait, customerName vs. caterer Name. Let's just mock logic:
               const myRegs = JSON.parse(localStorage.getItem('registrations') || '[]').filter((r: any) => r.userId === user.id).map((r: any) => r.id);
               allOrders = allOrders.filter((o: any) => myRegs.includes(o.catererId) || o.customerName === user.name);
           } else {
               // Customer sees their own
               allOrders = allOrders.filter((o: any) => o.customerName === user.name || o.customerName === 'Guest User');
           }
        }
        setOrders(allOrders);
    }
  }, [user]);

  const updateStatus = (id: string, newStatus: string) => {
     const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
     setOrders(updated);
     localStorage.setItem('orders', JSON.stringify(updated));
     toast(`Order status updated to ${newStatus}`, 'success');
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Approved': return 'bg-green-100 text-green-800';
          case 'Completed': return 'bg-slate-800 text-white';
          case 'Cancelled': return 'bg-red-100 text-red-800';
          case 'Rejected': return 'bg-red-100 text-red-800';
          case 'Modified': return 'bg-blue-100 text-blue-800';
          case 'Pending Caterer Review': return 'bg-purple-100 text-purple-800';
          case 'Submitted': return 'bg-amber-100 text-amber-800';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  if (!user) {
    return (
        <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
           <h1 className="text-3xl font-bold font-display text-slate-800 mb-4">Please log in to view orders</h1>
        </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 font-poppins">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
               <h1 className="text-3xl font-display font-bold text-slate-900">
                   {user.roles.includes('admin') ? 'All Orders' : user.roles.includes('partner') ? 'My Orders & Inquiries' : 'My Bookings'}
               </h1>
            </div>
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search orders..." className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-gold-500 w-full sm:w-64" />
            </div>
        </div>

        {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">No Orders Found</h3>
                <p className="text-slate-500 mb-6">You don't have any bookings or quote requests yet.</p>
                <Link to="/explore" className="bg-brand-green-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-800 transition-colors">Explore Caterers</Link>
            </div>
        ) : (
            <div className="space-y-4">
               {orders.map((o) => (
                   <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                       <div className="flex-1">
                           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                               <h3 className="text-lg font-bold text-slate-900">
                                   {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Customer)' : o.catererName}
                               </h3>
                               <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md w-fit", getStatusColor(o.status))}>
                                   {o.status}
                               </span>
                           </div>
                           
                           <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600 mb-4">
                              <span className="flex items-center gap-1.5"><Calendar size={16} className="text-brand-gold-500"/> {o.eventDate || 'Not specified'}</span>
                              <span className="flex items-center gap-1.5"><Users size={16} className="text-brand-gold-500"/> {o.guests} Guests</span>
                              <span className="flex items-center gap-1.5"><MapPin size={16} className="text-brand-gold-500"/> {o.venue || 'Venue TBD'}</span>
                           </div>

                           <div className="text-sm text-slate-500 mb-2">
                               <span className="font-semibold text-slate-700">Event:</span> {o.eventType} | <span className="font-semibold text-slate-700">Package:</span> {o.packageDetails?.packageName || 'Custom'}
                           </div>

                           <div className="text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                               <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-2">Order Details:</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                     <p className="font-bold text-slate-700 mb-1">Event details</p>
                                     <p>Customer: {o.customerName}</p>
                                     <p>Phone: {o.phone || 'N/A'}</p>
                                     <p>Guest Count: {o.guests}</p>
                                     <p>Matched Slab: {o.matchedSlab ? `${o.matchedSlab.minGuests} - ${o.matchedSlab.maxGuests || '1000+'} Guests` : 'Default Slab'}</p>
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-700 mb-1">Menu Items Selected</p>
                                     <ul className="list-disc pl-4 text-xs space-y-0.5">
                                         {o.selectedItems?.length > 0 ? o.selectedItems.map((item: string, i: number) => (
                                             <li key={i} className="text-slate-600">{item}</li>
                                         )) : <li className="text-slate-400">No items selected yet</li>}
                                     </ul>
                                  </div>
                               </div>
                           </div>

                           {o.specialNotes && (
                               <div className="text-sm bg-amber-50/50 p-3 rounded-lg text-slate-600 border border-amber-100 mb-4">
                                   <span className="font-bold text-slate-800">Notes: </span>{o.specialNotes}
                               </div>
                           )}

                           {/* Customer Progress Tracker */}
                           {!user.roles.includes('partner') && !user.roles.includes('admin') && 
                            !o.status.includes('Quote') && o.status !== 'Cancelled' && o.status !== 'Rejected' && (
                               <div className="mt-6 pt-6 border-t border-slate-100">
                                   <div className="flex items-center justify-between relative">
                                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded-full"></div>
                                       {['Submitted', 'Pending Caterer Review', 'Approved', 'Completed'].map((step, index) => {
                                           const statuses = ['Submitted', 'Pending Caterer Review', 'Approved', 'Completed'];
                                           let currentIdx = statuses.indexOf(o.status);
                                           if(currentIdx === -1) currentIdx = 0;
                                           if(o.status === 'Modified') currentIdx = 2;
                                           
                                           const isPassed = index <= currentIdx;
                                           const isActive = index === currentIdx;
                                           
                                           return (
                                               <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-500", isPassed ? "bg-brand-green-900 shadow-md shadow-brand-green-900/40" : "bg-slate-200 text-slate-400")}>
                                                      {isPassed ? <Check size={12} /> : index + 1}
                                                  </div>
                                                  <span className={cn("text-[10px] uppercase tracking-widest font-bold absolute -bottom-6 w-24 text-center", isActive ? "text-brand-green-900" : "text-slate-400")}>{step}</span>
                                               </div>
                                           )
                                       })}
                                   </div>
                               </div>
                           )}

                       </div>

                       <div className="lg:w-64 flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                           <div className="text-left lg:text-right mb-4 lg:mb-0 w-full">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimate Breakdown</p>
                               <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-500 mb-1 font-medium">
                                   <span>Food (₹{o.pricePerPlate} × {o.guests})</span>
                                   <span>₹{((o.pricePerPlate || 0) * (o.guests || 0)).toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-500 mb-3 font-medium">
                                   <span>Platform Fee</span>
                                   <span>₹{o.platformFee || 0}</span>
                               </div>
                               
                               <div className="flex justify-between lg:justify-end gap-4 border-t border-slate-100 pt-3">
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest self-end">Total</p>
                                   <p className="text-2xl font-display font-bold text-brand-green-900 leading-none">₹{o.totalEstimate?.toLocaleString()}</p>
                               </div>

                               {(user.roles.includes('partner') || user.roles.includes('admin')) && o.status === 'Approved' && (
                                   <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 text-left">
                                       <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Revenue Data</p>
                                       <p className="text-xs text-green-700 font-medium">Platform Fee: ₹{o.platformFee || 0}</p>
                                       <p className="text-xs text-green-700 font-medium">Platform Env. Share (10%): ₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.1).toFixed(0)}</p>
                                       <p className="text-xs font-bold text-brand-green-900 mt-1">Caterer Net: ₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.9).toFixed(0)}</p>
                                   </div>
                               )}

                               {(!user.roles.includes('partner') && !user.roles.includes('admin')) && o.status === 'Modified' && (
                                   <div className="mt-4 w-full text-left">
                                      <p className="text-xs text-blue-800 bg-blue-50 p-2 rounded-lg mb-2 font-medium">The caterer has modified your order details and quote. Please review.</p>
                                      <div className="flex gap-2">
                                          <button onClick={() => updateStatus(o.id, 'Approved')} className="flex-1 bg-brand-green-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-brand-green-800 transition-colors">Accept</button>
                                          <button onClick={() => updateStatus(o.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Reject</button>
                                      </div>
                                   </div>
                               )}
                           </div>

                           {(user.roles.includes('admin') || user.roles.includes('partner')) && (
                               <div className="flex flex-col gap-3 w-full">
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold text-slate-700 focus:border-brand-gold-500"
                                        value={o.status}
                                        onChange={(e) => updateStatus(o.id, e.target.value)}
                                    >
                                        <option value="Submitted">Submitted</option>
                                        <option value="Pending Caterer Review">Pending Caterer Review</option>
                                        <option value="Modified">Modified</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>

                                    {o.status === 'Pending Caterer Review' && user.roles.includes('partner') && (
                                        <div className="flex gap-2">
                                           <button onClick={() => updateStatus(o.id, 'Approved')} className="flex-1 bg-brand-green-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-green-800 transition-colors">Approve</button>
                                           <button onClick={() => updateStatus(o.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors">Reject</button>
                                           <button onClick={() => updateStatus(o.id, 'Modified')} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors">Modify</button>
                                        </div>
                                    )}
                               </div>
                           )}
                       </div>
                   </div>
               ))}
            </div>
        )}
      </div>
    </div>
  );
}
