import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Search, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from '../components/Toast';
import { getSupabase } from '../lib/supabase';
import { normalizeStatus, getStatusLabel, getStatusBadgeColor, performOrderStatusUpdate } from '../lib/orderUtils';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer notification states
  const [activeSegment, setActiveSegment] = useState<'bookings' | 'notifications'>('bookings');
  const [customerNotifications, setCustomerNotifications] = useState<any[]>([]);

  const reloadCustomerNotifications = () => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const myOrderIds = orders.map(o => o.id);
      const filtered = parsed.filter((n: any) => 
        n.targetRole === 'customer' && 
        (myOrderIds.includes(n.orderId) || !n.orderId)
      );
      setCustomerNotifications(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadCustomerNotifications();
  }, [orders]);

  const handleMarkCustNotificationRead = (id: string) => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const updated = parsed.map((n: any) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notifications', JSON.stringify(updated));
      reloadCustomerNotifications();
      toast("Notification marked read", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllCustNotifications = () => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const myOrderIds = orders.map(o => o.id);
      const remaining = parsed.filter((n: any) => 
        !(n.targetRole === 'customer' && (myOrderIds.includes(n.orderId) || !n.orderId))
      );
      localStorage.setItem('notifications', JSON.stringify(remaining));
      reloadCustomerNotifications();
      toast("Notifications cleared", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (supabase) {
      try {
        console.log("Fetching live customer orders from Supabase...");
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          let filtered = data;
          if (user.roles.includes('admin')) {
             // Admin sees all
          } else if (user.roles.includes('partner')) {
             const myRegs = JSON.parse(localStorage.getItem('registrations') || '[]')
               .filter((r: any) => r.userId === user.id)
               .map((r: any) => r.id);
             filtered = data.filter((o: any) => myRegs.includes(o.catererId) || o.customerName === user.name);
          } else {
             // Customer matching userId or email or name
             filtered = data.filter((o: any) => 
               o.userId === user.id || 
               (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
               o.customerName === user.name ||
               o.customerName === 'Guest User'
             );
          }
          setOrders(filtered);
          // Sync cache
          localStorage.setItem('orders', JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error("Error reading live orders in Orders page:", err);
      }
    }

    // fallback to local storage
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
        let allOrders = JSON.parse(rawOrders);
        if (user) {
           if (user.roles.includes('admin')) {
               // Admin sees all
           } else if (user.roles.includes('partner')) {
               const myRegs = JSON.parse(localStorage.getItem('registrations') || '[]').filter((r: any) => r.userId === user.id).map((r: any) => r.id);
               allOrders = allOrders.filter((o: any) => myRegs.includes(o.catererId) || o.customerName === user.name);
           } else {
               allOrders = allOrders.filter((o: any) => 
                 o.userId === user.id || 
                 (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
                 o.customerName === user.name ||
                 o.customerName === 'Guest User'
               );
           }
        }
        setOrders(allOrders);
    }
  };

  useEffect(() => {
    fetchOrders();

    const supabase = getSupabase();
    if (supabase) {
      // Real-time listener for any inserts, updates, deletes on orders table
      const channel = supabase
        .channel('orders-realtime-customer')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log("[REALTIME] Order update received on Customer page:", payload);
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
     try {
       await performOrderStatusUpdate(
         id,
         normalizeStatus(newStatus),
         {},
         user?.email || 'customer@caternest.com',
         user?.roles.includes('partner') ? 'partner' : user?.roles.includes('admin') ? 'admin' : 'customer'
       );
       toast(`Order status updated: ${getStatusLabel(newStatus)}`, 'success');
       await fetchOrders();
     } catch (err) {
       console.error("Failed to update status on Customer bookings page:", err);
       toast("Error updating order status", "error");
     }
  };

  const getStatusColor = (status: string) => {
       const norm = normalizeStatus(status);
       switch(norm) {
           case 'approved': return 'bg-green-100 text-green-800 border-green-200';
           case 'completed': return 'bg-slate-800 text-white border-slate-700';
           case 'cancelled': return 'bg-slate-150 text-slate-500 border-slate-200';
           case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
           case 'changes_requested': return 'bg-amber-100 text-amber-800 border-amber-200';
           case 'quotation_updated': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
           case 'pending': return 'bg-purple-100 text-purple-800 border-purple-200';
           default: return 'bg-slate-150 text-slate-800';
       }
  };

  if (!user) {
    return (
        <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
           <h1 className="text-3xl font-bold font-display text-slate-800 mb-4">Please log in to view orders</h1>
        </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (o.catererName && o.catererName.toLowerCase().includes(query)) ||
      (o.customerName && o.customerName.toLowerCase().includes(query)) ||
      (o.eventType && o.eventType.toLowerCase().includes(query)) ||
      (o.id && o.id.toLowerCase().includes(query)) ||
      (o.venue && o.venue.toLowerCase().includes(query))
    );
  });

  const unreadCustCount = customerNotifications.filter(n => !n.read).length;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 font-poppins">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Toggle headers and dynamic title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-200">
            <div>
               <h1 className="text-3xl font-display font-bold text-slate-900">
                   {user.roles.includes('admin') ? 'All Orders Platform' : user.roles.includes('partner') ? 'My Orders & Inquiries' : 'My Bookings'}
               </h1>
               <p className="text-xs text-slate-500 mt-1">Review event requests, current status metrics, and real-time alerts</p>
            </div>
            
            {/* Customer notification toggle buttons */}
            {!user.roles.includes('admin') && !user.roles.includes('partner') && (
                <div className="flex gap-2 bg-slate-200/60 p-1 rounded-xl border border-slate-250 shrink-0">
                    <button 
                        type="button"
                        onClick={() => setActiveSegment('bookings')} 
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeSegment === 'bookings' 
                                ? "bg-white text-slate-900 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        My Bookings ({filteredOrders.length})
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveSegment('notifications')} 
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 relative",
                            activeSegment === 'notifications' 
                                ? "bg-white text-slate-900 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Notifications Inbox
                        {unreadCustCount > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold tracking-tight">
                                {unreadCustCount}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>

        {activeSegment === 'notifications' && !user.roles.includes('admin') && !user.roles.includes('partner') ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">🔔 Alerts & Status Changes</h2>
                        <p className="text-xs text-slate-500 mt-1">Updates on requests, quotes, and confirmed orders from your custom caterer partners</p>
                    </div>
                    {customerNotifications.length > 0 && (
                        <button onClick={handleClearAllCustNotifications} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">
                            Clear All
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {customerNotifications.map((n) => (
                        <div key={n.id} className={cn("p-4 rounded-2xl border transition-all flex justify-between items-start gap-4", n.read ? "bg-slate-50 border-slate-150" : "bg-brand-gold-50/25 border-brand-gold-150 shadow-sm")}>
                            <div className="space-y-1 w-full">
                                <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", n.read ? "bg-slate-300" : "bg-brand-gold-500")} />
                                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                                </div>
                                <p className="text-xs text-slate-650 pl-4 font-medium">{n.message}</p>
                                {n.orderId && (
                                    <div className="flex items-center gap-2 mt-2 pl-4">
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {n.orderId}</p>
                                        <button 
                                            onClick={() => { setActiveSegment('bookings'); setSearchQuery(n.orderId); }} 
                                            className="text-[10px] text-brand-green-909 hover:underline font-bold"
                                        >
                                            View Booking Details →
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!n.read && (
                                <button onClick={() => handleMarkCustNotificationRead(n.id)} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-lg text-[10px] font-bold transition-all shrink-0">
                                    Mark Read
                                </button>
                            )}
                        </div>
                    ))}
                    {customerNotifications.length === 0 && (
                        <div className="text-center py-16 text-slate-500">
                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                🔔
                            </div>
                            <p className="font-bold text-slate-700">No new alerts</p>
                            <p className="text-xs text-slate-550 mt-1">Any status changes or revised estimates will appear instantly in this feed.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <>
               {activeSegment === 'bookings' && (
                   <div className="flex justify-end mb-6">
                       <div className="relative w-full sm:w-auto">
                           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="text" 
                             placeholder="Search orders by name, venue..." 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-gold-500 w-full sm:w-64" 
                           />
                       </div>
                   </div>
               )}

               {filteredOrders.length === 0 ? (
                   <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                       <h3 className="text-xl font-bold font-display text-slate-930 mb-2">No Orders Found</h3>
                       <p className="text-slate-500 mb-6">{searchQuery ? 'No bookings match your search query.' : "You don't have any bookings or quote requests yet."}</p>
                       {!searchQuery && (
                         <Link to="/explore" className="bg-brand-green-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-805 transition-colors">Explore Caterers</Link>
                       )}
                   </div>
               ) : (
                   <div className="space-y-4">
                      {filteredOrders.map((o) => (
                   <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                       <div className="flex-1">
                           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                               <h3 className="text-lg font-bold text-slate-900">
                                   {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Customer)' : o.catererName}
                               </h3>
                               <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border w-fit", getStatusColor(o.status))}>
                                   {getStatusLabel(o.status)}
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

                           <div className="text-sm text-slate-500 mb-4 bg-slate-55 p-4 rounded-xl border border-slate-100 mt-4">
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

                           {/* Customer Status & Dynamic Interactive Timelines */}
                           {!user.roles.includes('partner') && !user.roles.includes('admin') && (() => {
                               const norm = normalizeStatus(o.status);
                               
                               // 1. Rejected State
                               if (norm === 'rejected') {
                                   return (
                                       <div className="mt-6 pt-6 border-t border-slate-100">
                                           <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
                                               <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 font-bold">✕</div>
                                               <div>
                                                   <h4 className="font-bold text-red-950 text-sm">Order Request Declined</h4>
                                                   <p className="text-xs text-red-700 mt-0.5">The caterer has rejected your booking request. Reason: "{o.rejectionReason || o.specialNotes || o.notes || 'Not specified'}"</p>
                                                   <p className="text-[10px] text-red-500 mt-2 font-medium">Please feel free to explore other caterers or submit a new proposal.</p>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               }

                               // 2. Cancelled State
                               if (norm === 'cancelled') {
                                   return (
                                       <div className="mt-6 pt-6 border-t border-slate-100">
                                           <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex gap-3 items-start">
                                               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold">!</div>
                                               <div>
                                                   <h4 className="font-bold text-slate-800 text-sm">Booking Cancelled</h4>
                                                   <p className="text-xs text-slate-600 mt-0.5">This inquiry has been cancelled by the user or an administrator.</p>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               }

                               // 3. Changes Requested State
                               if (norm === 'changes_requested') {
                                   return (
                                       <div className="mt-6 pt-6 border-t border-slate-100">
                                           <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                               <div className="flex gap-3 items-start mb-3">
                                                   <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 font-bold">?</div>
                                                   <div>
                                                       <h4 className="font-bold text-amber-950 text-sm">Changes / Details Requested by Caterer</h4>
                                                       <p className="text-xs text-amber-800 mt-0.5">"{o.changesRequestedMemo || o.specialNotes || o.notes || 'Please provide details.'}"</p>
                                                   </div>
                                               </div>
                                               <div className="flex gap-2 justify-end">
                                                   <Link to={`/caterer/${o.catererId}`} className="bg-brand-green-905 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-green-800 transition-colors">Modify Choices</Link>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               }

                               // 4. Quotation Updated State
                               if (norm === 'quotation_updated') {
                                   return (
                                       <div className="mt-6 pt-6 border-t border-slate-100">
                                           <div className="bg-cyan-50 border border-cyan-205 rounded-2xl p-4">
                                               <div className="flex gap-3 items-start mb-4">
                                                   <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 font-bold">i</div>
                                                   <div className="flex-1">
                                                       <h4 className="font-bold text-cyan-950 text-sm">Revised Quote Proposal Received!</h4>
                                                       <p className="text-xs text-cyan-800 mt-0.5">The caterer updated the quotation. Price per plate: <span className="font-bold text-brand-green-905">₹{o.pricePerPlate}</span> (Total Estimate: <span className="font-bold text-brand-green-905">₹{o.totalEstimate?.toLocaleString()}</span>)</p>
                                                       {o.specialNotes && <p className="text-xs text-cyan-700 italic mt-1.5">Note from Partner: "{o.specialNotes}"</p>}
                                                   </div>
                                               </div>
                                               <div className="flex gap-2 justify-end">
                                                   <button onClick={() => updateStatus(o.id, 'approved')} className="bg-brand-green-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-green-800 transition-colors">Accept Revised Quote</button>
                                                   <button onClick={() => updateStatus(o.id, 'rejected')} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Decline Quote</button>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               }

                               // 5. Standard Timeline Steps
                               const steps = [
                                   { label: 'Submitted', key: 'submitted' },
                                   { label: 'Caterer Review', key: 'pending_review' },
                                   { label: 'Approved', key: 'approved' },
                                   { label: 'Completed', key: 'completed' }
                                ];
                               
                               // Determine current active index
                               let currentIdx = 0;
                               if (norm === 'pending' || (norm as string) === 'pending_review' || o.status === 'Pending Caterer Review') currentIdx = 1;
                               if (norm === 'approved') currentIdx = 2;
                               if (norm === 'completed') currentIdx = 3;

                               return (
                                   <div className="mt-8 pt-6 border-t border-slate-100">
                                       <div className="flex items-center justify-between relative max-w-md mx-auto">
                                           {/* Track Line */}
                                           <div className="absolute left-3 right-3 top-4 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full">
                                               <div 
                                                   className="h-full bg-brand-green-900 rounded-full transition-all duration-700" 
                                                   style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                                               ></div>
                                           </div>
                                           
                                           {steps.map((step, index) => {
                                               const isPassed = index <= currentIdx;
                                               const isActive = index === currentIdx;
                                               
                                               return (
                                                   <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                                                       <div className={cn(
                                                           "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2",
                                                           isActive 
                                                               ? "bg-brand-green-900 border-brand-green-900 text-white shadow-lg shadow-brand-green-900/30 scale-110" 
                                                               : isPassed
                                                                   ? "bg-green-500 border-green-555 text-white"
                                                                   : "bg-white border-slate-200 text-slate-400"
                                                       )}>
                                                           {isPassed ? <Check size={14} className="stroke-[3]" /> : index + 1}
                                                       </div>
                                                       <span className={cn(
                                                           "text-[10px] tracking-wider font-bold uppercase transition-all duration-300", 
                                                           isActive ? "text-brand-green-900 font-extrabold" : isPassed ? "text-slate-700 font-semibold" : "text-slate-400"
                                                       )}>
                                                           {step.label}
                                                       </span>
                                                   </div>
                                               );
                                           })}
                                       </div>
                                   </div>
                               );
                           })()}

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

                               {(user.roles.includes('partner') || user.roles.includes('admin')) && normalizeStatus(o.status) === 'approved' && (
                                   <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-150 text-left">
                                       <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Revenue Data</p>
                                       <p className="text-xs text-green-700 font-medium">Platform Fee: ₹{o.platformFee || 0}</p>
                                       <p className="text-xs text-green-700 font-medium">Platform Env. Share (10%): ₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.1).toFixed(0)}</p>
                                       <p className="text-xs font-bold text-brand-green-900 mt-1">Caterer Net: ₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.9).toFixed(0)}</p>
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
                                           <button onClick={() => updateStatus(o.id, 'Approved')} className="flex-1 bg-brand-green-90s text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-green-800 transition-colors">Approve</button>
                                           <button onClick={() => updateStatus(o.id, 'Rejected')} className="flex-1 bg-red-50 text-red-650 border border-red-200 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors">Reject</button>
                                           <button onClick={() => updateStatus(o.id, 'Modified')} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-105 transition-colors">Modify</button>
                                        </div>
                                    )}
                               </div>
                           )}
                       </div>
                   </div>
               ))}
            </div>
        )}
        </>
       )}
      </div>
    </div>
  );
}
