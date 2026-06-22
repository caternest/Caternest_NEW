import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Search, Check, Clock, ArrowRight, ChevronRight, Filter, X, ChevronLeft, BookOpen, Sparkles, Eye, Archive } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from '../components/Toast';
import { getSupabase, saveWithSupabaseSync } from '../lib/supabase';
import { normalizeStatus, getStatusLabel, getStatusBadgeColor, performOrderStatusUpdate, storeNotification } from '../lib/orderUtils';


// Helper to check if event date has passed
function isEventPassed(eventDateStr: string): boolean {
  if (!eventDateStr) return false;
  try {
    const parts = eventDateStr.split('-');
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    
    const evDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    evDate.setHours(0, 0, 0, 0);
    
    return evDate.getTime() < today.getTime();
  } catch (e) {
    return false;
  }
}

// Countdown badge utility
function getEventCountdownBadge(eventDateStr: string): { text: string; color: string } | null {
  if (!eventDateStr) return null;
  try {
    const parts = eventDateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const evDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    evDate.setHours(0, 0, 0, 0);
    
    const diffTime = evDate.getTime() - today.getTime();
    if (diffTime < 0) return null;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: "Event Today", color: "bg-emerald-600 text-white animate-pulse" };
    } else if (diffDays === 1) {
      return { text: "Event Tomorrow", color: "bg-amber-500 text-white font-bold" };
    } else {
      return { text: `Event in ${diffDays} Days`, color: "bg-brand-green-905 text-white font-medium bg-slate-900 border border-slate-755 text-[10px]" };
    }
  } catch (e) {
    return null;
  }
}

// Weight system for Recent priority list
function getRecentPriority(status: string): number {
  const norm = normalizeStatus(status);
  const statusStr = String(status).toLowerCase();
  
  if (norm === 'pending' || statusStr.includes('review') || statusStr.includes('submitted')) {
    return 1; // Action attention
  }
  if (norm === 'changes_requested') {
    return 2; // Customer feedback requested
  }
  if (norm === 'approved') {
    return 3; // Fully confirmed future orders
  }
  return 4; // Completed / Other fallback
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab segments: Recent versus History
  const [bookingSubTab, setBookingSubTab] = useState<'recent' | 'history'>('recent');

  // Booking history filter states
  const [searchQueryHistory, setSearchQueryHistory] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 5;

  // Selected order for modern Quick View floating popup card
  const [selectedQuickViewOrder, setSelectedQuickViewOrder] = useState<any | null>(null);

  // Repeat Booking state variables
  const [repeatOrderSource, setRepeatOrderSource] = useState<any | null>(null);
  const [repeatForm, setRepeatForm] = useState({
    eventDate: '',
    guests: 0,
    specialNotes: '',
    venue: ''
  });

  const handleRepeatBookingInitiate = (order: any) => {
    setRepeatOrderSource(order);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setRepeatForm({
      eventDate: tomorrowStr,
      guests: Number(order.guests ?? order.guestCount ?? 20),
      specialNotes: order.specialNotes || order.notes || '',
      venue: order.venue || order.address || ''
    });
  };

  const handleRepeatBookingConfirm = async () => {
    if (!repeatOrderSource) return;
    if (!repeatForm.eventDate) {
      toast("Please specify a valid Event Date", "error");
      return;
    }
    if (repeatForm.guests <= 0) {
      toast("Please specify a valid number of guests", "error");
      return;
    }

    try {
      const newId = Math.random().toString(36).substr(2, 9);
      const newGuests = Number(repeatForm.guests);
      
      const pricePerPlate = Number(repeatOrderSource.pricePerPlate || 120);
      const platformFeePerPlate = Number(repeatOrderSource.platformFeePerPlate || 15);
      const platformFee = newGuests * platformFeePerPlate;
      const totalEstimate = (pricePerPlate * newGuests) + platformFee;

      const newOrder = {
        ...repeatOrderSource,
        id: newId,
        eventDate: repeatForm.eventDate,
        guests: newGuests,
        guestCount: newGuests,
        specialNotes: repeatForm.specialNotes,
        notes: repeatForm.specialNotes,
        venue: repeatForm.venue || repeatOrderSource.venue,
        address: repeatForm.venue || repeatOrderSource.address,
        totalEstimate: totalEstimate > 0 ? totalEstimate : (repeatOrderSource.totalEstimate || 0),
        platformFee: platformFee,
        status: 'Submitted',
        statusHistory: [
          {
            note: "New repetitive request initiated from booking history",
            actor: "customer",
            action: "submitted",
            timestamp: new Date().toISOString()
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const rawOrders = localStorage.getItem('orders') || '[]';
      const parsedOrders = JSON.parse(rawOrders);
      const updatedOrders = [newOrder, ...parsedOrders];
      
      await saveWithSupabaseSync('orders', 'orders', updatedOrders);

      await storeNotification(
        newId,
        "New Booking Submitted 📨",
        `Your repeated booking request for ${newOrder.catererName} on ${newOrder.eventDate} has been submitted successfully!`,
        "customer",
        newOrder.catererId
      );

      await storeNotification(
        newId,
        "New Order Received 🧑‍🍳",
        `A duplicated booking request has been received from ${newOrder.customerName || 'Customer'} on ${newOrder.eventDate}.`,
        "caterer",
        newOrder.catererId
      );

      await storeNotification(
        newId,
        "New Order Created 🔔",
        `Customer repeated booking order #${newId} for ${newOrder.catererName || 'caterer'}.`,
        "admin"
      );

      toast("Repeat booking request submitted successfully!", "success");
      setRepeatOrderSource(null);
      await fetchOrders();
      setBookingSubTab('recent');
    } catch (err) {
      console.error("[REPEAT BOOKING ERR]", err);
      toast("Failed to repeat booking", "error");
    }
  };

  // Edit state for changes_requested workflow
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({
    eventDate: '',
    eventType: '',
    venue: '',
    guests: 0,
    specialNotes: ''
  });

  const startEditing = (o: any) => {
    setEditingOrderId(o.id);
    setEditForm({
      eventDate: o.eventDate || '',
      eventType: o.eventType || '',
      venue: o.venue || o.address || '',
      guests: Number(o.guests ?? o.guestCount ?? 0),
      specialNotes: o.specialNotes || o.notes || ''
    });
  };

  const handleResubmitOrder = async (orderId: string, catererId: string) => {
    try {
      console.log("[RESUBMITTING ORDER]", orderId);
      await performOrderStatusUpdate(
        orderId,
        'updated_by_customer',
        {
          eventDate: editForm.eventDate,
          eventType: editForm.eventType,
          venue: editForm.venue,
          guests: Number(editForm.guests),
          guestCount: Number(editForm.guests),
          specialNotes: editForm.specialNotes,
          notes: editForm.specialNotes
        },
        user?.email || 'customer@caternest.com',
        'customer'
      );

      await storeNotification(orderId, "Order Resubmitted", "Order resubmitted successfully", "customer");
      await storeNotification(orderId, "Order Resubmitted", "Customer has resubmitted order", "caterer", catererId);
      await storeNotification(orderId, "Order Resubmitted", "Order resubmitted", "admin");

      toast("Order resubmitted successfully!", "success");
      setEditingOrderId(null);
      await fetchOrders();
    } catch (err) {
      console.error("Error resubmitting order:", err);
      toast("Failed to resubmit order", "error");
    }
  };

  // Customer notifications
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

  // Evaluates and updates status on page loads or real-time broadcasts
  const autoTriggerCompletionIfPassed = async (ordersList: any[]): Promise<any[]> => {
    const supabase = getSupabase();
    let updatedLocalCache = false;

    const nextList = ordersList.map(o => {
      const norm = normalizeStatus(o.status);
      const datePassed = isEventPassed(o.eventDate);

      if ((norm === 'approved' || String(o.status).toLowerCase() === 'approved') && datePassed) {
        console.log(`[AUTO-COMPLETE WORKFLOW] Order ${o.id} is approved and event date ${o.eventDate} passed. Setting Completed.`);
        updatedLocalCache = true;

        const nextHistory = [
          ...(o.statusHistory || []),
          {
            note: "Event has successfully concluded. System automatically marked booking status as Completed.",
            actor: "system",
            action: "completed",
            timestamp: new Date().toISOString()
          }
        ];

        // Store real Event Completed notification for the customer
        try {
          storeNotification(
            o.id,
            "Event Completed 🎉",
            `Your event on ${o.eventDate || 'N/A'} with ${o.catererName || 'caterer'} has successfully concluded. we hope you loved the platter service!`,
            "customer",
            o.catererId
          );
        } catch (err) {
          console.error("[AUTO-COMPLETE NOTIFY ERR]", err);
        }

        // Background update database without interrupting the render cycle
        if (supabase) {
          supabase.from('orders').update({
            status: 'completed',
            statusHistory: nextHistory,
            completedAt: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', o.id).then(({ error }) => {
            if (error) {
              console.error(`[AUTO-COMPLETE ERR] Failed to async complete #${o.id}:`, error);
            } else {
              console.log(`[AUTO-COMPLETE OK] #${o.id} successfully completed in database`);
            }
          });
        }

        return {
          ...o,
          status: 'completed',
          statusHistory: nextHistory,
          completedAt: new Date().toISOString()
        };
      }
      return o;
    });

    if (updatedLocalCache) {
      const cacheRaw = localStorage.getItem('orders');
      if (cacheRaw) {
        try {
          const cacheParsed = JSON.parse(cacheRaw);
          const aligned = cacheParsed.map((o: any) => {
            const match = nextList.find(n => n.id === o.id);
            return match ? match : o;
          });
          localStorage.setItem('orders', JSON.stringify(aligned));
        } catch (err) {
          console.error(err);
        }
      }
    }

    return nextList;
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
          const localOrdersRaw = localStorage.getItem('orders');
          const localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
          
          const remoteIds = new Set(data.map((o: any) => o.id));
          const unsyncedLocal = localOrders.filter((o: any) => o && o.id && !remoteIds.has(o.id));
          
          const combinedOrders = [...unsyncedLocal, ...data];
          
          combinedOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          let filtered = combinedOrders;
          if (user.roles.includes('admin')) {
              // Admin sees all
          } else if (user.roles.includes('partner')) {
              const myRegs = JSON.parse(localStorage.getItem('registrations') || '[]')
                .filter((r: any) => r.userId === user.id)
                .map((r: any) => r.id);
              filtered = combinedOrders.filter((o: any) => 
                myRegs.includes(o.catererId) || 
                o.customerName === user.name ||
                o.userId === user.id ||
                (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase())
              );
          } else {
              // Customer matching email name etc
              filtered = combinedOrders.filter((o: any) => 
                o.userId === user.id || 
                (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
                (o.customerName && o.customerName === user.name) ||
                (o.phone && o.phone === user.phone) ||
                (o.customerPhone && o.customerPhone === user.phone) ||
                o.customerName === 'Guest User'
              );
          }

          // Trigger automatic completion evaluations
          const completedEvaluated = await autoTriggerCompletionIfPassed(filtered);
          
          setOrders(completedEvaluated);
          // Sync unified cache to client local storage
          localStorage.setItem('orders', JSON.stringify(combinedOrders));
          return;
        }
      } catch (err) {
        console.error("Error reading live orders in Orders page:", err);
      }
    }

    // fallback to local storage
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
        let allOrders = rawOrders ? JSON.parse(rawOrders) : [];
        if (user) {
           if (user.roles.includes('admin')) {
               // Admin sees all
           } else if (user.roles.includes('partner')) {
               const myRegs = JSON.parse(localStorage.getItem('registrations') || '[]').filter((r: any) => r.userId === user.id).map((r: any) => r.id);
               allOrders = allOrders.filter((o: any) => 
                 myRegs.includes(o.catererId) || 
                 o.customerName === user.name ||
                 o.userId === user.id ||
                 (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase())
               );
           } else {
               allOrders = allOrders.filter((o: any) => 
                 o.userId === user.id || 
                 (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
                 o.customerName === user.name ||
                 (o.phone && o.phone === user.phone) ||
                 (o.customerPhone && o.customerPhone === user.phone) ||
                 o.customerName === 'Guest User'
               );
           }
        }
        allOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        const completedEvaluatedFallback = await autoTriggerCompletionIfPassed(allOrders);
        setOrders(completedEvaluatedFallback);
    }
  };

  useEffect(() => {
    fetchOrders();

    const supabase = getSupabase();
    if (supabase) {
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
       const norm = normalizeStatus(newStatus);
       await performOrderStatusUpdate(
         id,
         norm,
         {},
         user?.email || 'customer@caternest.com',
         user?.roles.includes('partner') ? 'partner' : user?.roles.includes('admin') ? 'admin' : 'customer'
       );

       const ord = orders.find(o => o.id === id);
       const catererId = ord?.catererId;
       const catererName = ord?.catererName || 'Caterer';

       if (user?.roles.includes('partner')) {
         if (norm === 'completed') {
           storeNotification(id, "Order Completed! 🏆", `Your catering order with ${catererName} has been marked as Completed.`, "customer", catererId);
         }
       } else if (user?.roles.includes('admin')) {
         if ((norm as string) === 'escalation') {
           storeNotification(id, "Order Escalated ⚠️", `Order #${id} has been escalated for review.`, "admin");
         }
       } else {
         if (norm === 'approved') {
           storeNotification(id, "Customer Approved Quote 👍", `${user?.name} approved/confirmed the quote/booking request #${id}.`, "caterer", catererId);
         } else if (norm === 'cancelled' || norm === 'rejected') {
           storeNotification(id, "Order Cancelled ❌", `${user?.name} has cancelled/declined order request #${id}.`, "caterer", catererId);
         }
       }

       toast(`Order status updated: ${getStatusLabel(newStatus)}`, 'success');
       await fetchOrders();
       if (selectedQuickViewOrder && selectedQuickViewOrder.id === id) {
         const refreshed = orders.find(x => x.id === id);
         if (refreshed) {
           setSelectedQuickViewOrder({ ...refreshed, status: norm });
         }
       }
     } catch (err) {
       console.error("Failed to update status on Customer bookings page:", err);
       toast("Error updating order status", "error");
     }
  };

  const getStatusColor = (status: string) => {
       const norm = normalizeStatus(status);
       switch(norm) {
           case 'approved': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
           case 'completed': return 'bg-slate-900 text-white border-slate-700';
           case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
           case 'rejected': return 'bg-rose-50 text-rose-850 border-rose-200';
           case 'changes_requested': return 'bg-amber-50 text-amber-800 border-amber-200';
           case 'quotation_updated': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
           case 'pending': return 'bg-purple-50 text-purple-800 border-purple-200';
           default: return 'bg-slate-100 text-slate-700 border-slate-200';
       }
  };

  // Automatically reset pagination back to page 1 on search parameter mutation
  useEffect(() => {
    setHistoryPage(1);
  }, [searchQueryHistory, filterStatus, filterStartDate, filterEndDate]);

  // Dynamically partition and filter down list values to keep Recent clean and history archived
  const recentOrdersList: any[] = [];
  const historyOrdersList: any[] = [];

  orders.forEach(o => {
    const norm = normalizeStatus(o.status);
    const datePassed = isEventPassed(o.eventDate);

    // 2 & 3. Rejected, Cancelled, and Completed orders (and Approved events that have passed) map to history
    const isHistory = 
      norm === 'completed' || 
      norm === 'rejected' || 
      norm === 'cancelled' ||
      (datePassed && norm === 'approved');

    if (isHistory) {
      historyOrdersList.push(o);
    } else {
      // 1. Recent Orders should only contain active and actionable bookings of allowed statuses:
      // Submitted, Pending Review, Pending Caterer Review, Changes Requested, Approved (future only)
      const statusLower = String(o.status).toLowerCase();
      const isActiveStatus = 
        norm === 'pending' || 
        norm === 'changes_requested' || 
        norm === 'updated_by_customer' || 
        norm === 'quotation_updated' ||
        (norm === 'approved' && !datePassed) ||
        statusLower.includes('submitted') ||
        statusLower.includes('review') ||
        statusLower.includes('pending') ||
        statusLower.includes('request') ||
        statusLower.includes('quote') ||
        statusLower.includes('quotation');

      if (isActiveStatus) {
        recentOrdersList.push(o);
      } else {
        historyOrdersList.push(o);
      }
    }
  });

  // 7. Recent Orders always sorted by latest activity
  recentOrdersList.sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  const filteredRecentOrders = recentOrdersList.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.catererName && o.catererName.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.venue && o.venue.toLowerCase().includes(q)) ||
      (o.eventType && o.eventType.toLowerCase().includes(q))
    );
  });

  const filteredHistoryOrders = historyOrdersList.filter(o => {
    const q = searchQueryHistory.toLowerCase().trim();
    const matchSearch = !q || [
      o.id,
      o.catererName,
      o.customerName,
      o.venue,
      o.eventType
    ].some(val => val && String(val).toLowerCase().includes(q));

    let matchStart = true;
    if (filterStartDate) {
      matchStart = o.eventDate && new Date(o.eventDate) >= new Date(filterStartDate);
    }

    let matchEnd = true;
    if (filterEndDate) {
      matchEnd = o.eventDate && new Date(o.eventDate) <= new Date(filterEndDate);
    }

    let matchStat = true;
    if (filterStatus && filterStatus !== 'all') {
      matchStat = normalizeStatus(o.status) === filterStatus;
    }

    return matchSearch && matchStart && matchEnd && matchStat;
  });

  // Slice paginated items for history list
  const totalHistoryPages = Math.ceil(filteredHistoryOrders.length / historyPageSize) || 1;
  const paginatedHistoryOrders = filteredHistoryOrders.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize
  );

  const unreadCustCount = customerNotifications.filter(n => !n.read).length;

  const activeOrdersCount = orders.filter(o => {
    const norm = normalizeStatus(o.status);
    const datePassed = isEventPassed(o.eventDate);
    return !['completed', 'rejected', 'cancelled'].includes(norm) && !(norm === 'approved' && datePassed);
  }).length;

  const upcomingEventsCount = orders.filter(o => {
    const norm = normalizeStatus(o.status);
    const datePassed = isEventPassed(o.eventDate);
    return norm === 'approved' && !datePassed;
  }).length;

  const completedEventsCount = orders.filter(o => normalizeStatus(o.status) === 'completed').length;
  const rejectedOrdersCount = orders.filter(o => normalizeStatus(o.status) === 'rejected').length;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Toggle headers and dynamic title */}
        <div id="orders-dashboard-header" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pb-4 border-b border-slate-200">
            <div>
               <h1 className="text-3xl font-sans font-black text-slate-900 tracking-tight">
                   {user.roles.includes('admin') ? 'All Orders Platform' : user.roles.includes('partner') ? 'My Orders & Inquiries' : 'My Bookings'}
               </h1>
               <p className="text-xs text-slate-500 mt-1 font-medium">Coordinate catering menus, track dynamic milestones, and monitor quote revisions</p>
            </div>
            
            {/* Customer notification toggle buttons */}
            {!user.roles.includes('admin') && !user.roles.includes('partner') && (
                <div id="customer-alert-segment-toggles" className="flex gap-2 bg-slate-200/60 p-1 rounded-xl border border-slate-250 shrink-0">
                    <button 
                        id="btn-active-bookings-section"
                        type="button"
                        onClick={() => setActiveSegment('bookings')} 
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeSegment === 'bookings' 
                                ? "bg-white text-slate-900 shadow-xs" 
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        My Bookings ({orders.length})
                    </button>
                    <button 
                        id="btn-active-alerts-section"
                        type="button"
                        onClick={() => setActiveSegment('notifications')} 
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 relative",
                            activeSegment === 'notifications' 
                                ? "bg-white text-slate-900 shadow-xs" 
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Notifications Inbox
                        {unreadCustCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {unreadCustCount}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Dynamic Bento Summary Counters on Dashboard (Visible during bookings tab) */}
        {activeSegment === 'bookings' && (
          <>
            {/* KPI Cards Grid */}
            <div id="orders-kpi-cards-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
                  <h4 className="text-xl font-bold font-sans text-slate-800">{activeOrdersCount}</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-55 bg-indigo-50 text-indigo-600">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Events</p>
                  <h4 className="text-xl font-bold font-sans text-slate-800">{upcomingEventsCount}</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Check size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Events</p>
                  <h4 className="text-xl font-bold font-sans text-slate-800">{completedEventsCount}</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
                  <X size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected Orders</p>
                  <h4 className="text-xl font-bold font-sans text-slate-800">{rejectedOrdersCount}</h4>
                </div>
              </div>
            </div>

            <div id="orders-bento-grid-dashboard" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

            <button
              id="recent-bookings-bento-card"
              onClick={() => setBookingSubTab('recent')}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group hover:scale-[1.01]",
                bookingSubTab === 'recent'
                  ? "bg-white border-brand-green-900 shadow-md ring-2 ring-brand-green-900/10"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent &amp; Active Bookings</p>
                  <h3 className="text-3xl font-sans font-black text-slate-800 mt-1">{recentOrdersList.length}</h3>
                </div>
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  bookingSubTab === 'recent' ? "bg-brand-green-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                )}>
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1 font-semibold">
                View ongoing estimates, changes requested &amp; approved states <ChevronRight size={12} />
              </p>
            </button>

            <button
              id="history-bookings-bento-card"
              onClick={() => setBookingSubTab('history')}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group hover:scale-[1.01]",
                bookingSubTab === 'history'
                  ? "bg-white border-brand-green-900 shadow-md ring-2 ring-brand-green-900/10"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archived Booking History</p>
                  <h3 className="text-3xl font-sans font-black text-slate-800 mt-1">{historyOrdersList.length}</h3>
                </div>
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  bookingSubTab === 'history' ? "bg-brand-green-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                )}>
                  <BookOpen size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1 font-semibold">
                Review past event recipes, billing settlements &amp; concluded orders <ChevronRight size={12} />
              </p>
            </button>
          </div>
        </>
        )}

        {/* Segment 1: Notifications Inbox */}
        {activeSegment === 'notifications' && !user.roles.includes('admin') && !user.roles.includes('partner') ? (
            <div id="notifications-inbox" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">🔔 Alerts &amp; Status Logs</h2>
                        <p className="text-xs text-slate-500 mt-1">Direct confirmations and pricing revisions from caterer partners</p>
                    </div>
                    {customerNotifications.length > 0 && (
                        <button onClick={handleClearAllCustNotifications} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">
                            Clear All
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {customerNotifications.map((n) => (
                        <div key={n.id} className={cn("p-4 rounded-xl border transition-all flex justify-between items-start gap-4", n.read ? "bg-slate-50 border-slate-150" : "bg-brand-gold-50/25 border-brand-gold-200 shadow-xs")}>
                            <div className="space-y-1 w-full">
                                <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", n.read ? "bg-slate-300" : "bg-brand-gold-500")} />
                                    <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                                </div>
                                <p className="text-[11px] text-slate-600 pl-4 font-semibold">{n.message}</p>
                                {n.orderId && (
                                    <div className="flex items-center gap-2 mt-2 pl-4">
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {n.orderId}</p>
                                        <button 
                                            onClick={() => { setActiveSegment('bookings'); setBookingSubTab('recent'); setSearchQuery(n.orderId); }} 
                                            className="text-[10px] text-brand-green-900 hover:underline font-bold"
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
                            <p className="font-bold text-slate-700 text-sm">No new alerts</p>
                            <p className="text-xs text-slate-500 mt-1">Any status changes or revised estimates will appear instantly in this feed.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // Segment 2: Booking Management Content
            <>
               {/* Tab 2A: Recent & Active Bookings */}
               {bookingSubTab === 'recent' && (
                  <div id="recent-bookings-tab-panel">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              ✨ Active Event Plans
                           </h2>
                           <p className="text-xs text-slate-400">Current proposals requiring your review or scheduled event executions</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              id="input-recent-search"
                              type="text" 
                              placeholder="Search recent orders..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-bold outline-none focus:border-brand-green-900 w-full sm:w-64" 
                            />
                        </div>
                     </div>

                     {filteredRecentOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-3xl mx-auto">
                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">⚡</div>
                            <h3 className="text-lg font-bold text-slate-850 mb-1">No Active Bookings</h3>
                            <p className="text-slate-500 text-xs mb-6 max-w-md mx-auto">
                              {searchQuery ? 'No pending bookings match your search parameters.' : "You do not have any upcoming bookings, live quotes, or modifications in progress."}
                            </p>
                            {!searchQuery && (
                              <Link to="/explore" className="bg-brand-green-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-brand-green-900/90 transition-colors shadow-xs">
                                Find a Caterer Partner
                              </Link>
                            )}
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {filteredRecentOrders.map((o) => (
                              <div 
                                key={o.id} 
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden group"
                              >
                                {/* Side bar accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green-900 rounded-r-md"></div>
                                
                                <div className="flex-1 pl-2">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                                        <div>
                                           <div className="text-[9px] text-slate-400 font-mono tracking-wider font-bold mb-0.5">BOOKING REFERENCE: {o.id}</div>
                                           <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                               {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Customer)' : o.catererName}
                                           </h3>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {normalizeStatus(o.status) === 'approved' && (() => {
                                                const badge = getEventCountdownBadge(o.eventDate);
                                                return badge ? (
                                                    <span className={cn("px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide rounded-lg border", badge.color)}>
                                                        ⏱️ {badge.text}
                                                    </span>
                                                ) : null;
                                            })()}
                                            <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border w-fit font-mono text-[9px]", getStatusColor(o.status))}>
                                                {getStatusLabel(o.status)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-b border-slate-100 py-3 mb-4">
                                       <span className="flex items-center gap-2 text-xs font-bold text-slate-650"><Calendar size={15} className="text-brand-green-900 shrink-0"/> {o.eventDate || 'Not specified'}</span>
                                       <span className="flex items-center gap-2 text-xs font-bold text-slate-650"><Users size={15} className="text-brand-green-900 shrink-0"/> {o.guests} Guests</span>
                                       <span className="flex items-center gap-2 text-xs font-bold text-slate-650 truncate"><MapPin size={15} className="text-brand-green-900 shrink-0"/> {o.venue || 'Venue TBD'}</span>
                                    </div>

                                    <div className="text-xs text-slate-500 mb-2">
                                        <span className="font-extrabold text-slate-705">Event Category:</span> {o.eventType} | <span className="font-extrabold text-slate-705">Platter:</span> {o.packageDetails?.packageName || 'Customized Selection'}
                                    </div>

                                    {/* Platter details list */}
                                    <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                                        <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-2">Platter Checklist &amp; Contact:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                           <div>
                                              <p className="font-bold text-slate-700">Contact Details</p>
                                              <p className="mt-1">Lead: {o.customerName || 'Registered Member'}</p>
                                              <p>Phone: {o.phone || o.customerPhone || 'N/A'}</p>
                                              <p>Event Scale: {o.guests} Pax</p>
                                              <p>Slab Rate: {o.matchedSlab ? `${o.matchedSlab.minGuests}-${o.matchedSlab.maxGuests || '1000+'} Guests` : 'Standard Price'}</p>
                                           </div>
                                           <div>
                                              <p className="font-bold text-slate-700">Detailed Menu Items</p>
                                              <ul className="list-disc pl-4 text-[11px] space-y-0.5 mt-1">
                                                  {o.selectedItems?.length > 0 ? o.selectedItems.map((item: string, i: number) => (
                                                      <li key={i} className="text-slate-600 font-semibold">{item}</li>
                                                  )) : <li className="text-slate-400 italic">No custom selections provided</li>}
                                              </ul>
                                           </div>
                                        </div>
                                    </div>

                                    {o.specialNotes && (
                                        <div className="text-xs bg-amber-50/50 p-3 rounded-lg text-slate-600 border border-amber-100 mt-3">
                                            <span className="font-bold text-slate-800">Note: </span>{o.specialNotes}
                                        </div>
                                    )}

                                    {/* Actions based on state */}
                                    {!user.roles.includes('partner') && !user.roles.includes('admin') && (() => {
                                        const norm = normalizeStatus(o.status);
                                        
                                        if (norm === 'rejected') {
                                            return (
                                                <div className="mt-6 pt-4 border-t border-slate-100">
                                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
                                                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 font-bold">✕</div>
                                                        <div>
                                                            <h4 className="font-bold text-rose-950 text-sm">Catering Request Cancelled</h4>
                                                            <p className="text-xs text-rose-700 mt-0.5">The caterer declined the quote. Reason: "{o.rejectionReason || o.specialNotes || 'Partner fully booked'}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (norm === 'changes_requested') {
                                            const isEditing = editingOrderId === o.id;
                                            return (
                                                <div className="mt-6 pt-4 border-t border-slate-100">
                                                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                                                        <div className="flex gap-3 items-start mb-3">
                                                            <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-950 lg:text-amber-900 flex items-center justify-center font-bold">?</div>
                                                            <div>
                                                                <h4 className="font-extrabold text-amber-950 text-sm">Action Required: Caterer Suggested Revisions</h4>
                                                                <p className="text-xs text-amber-800 mt-[2px]">"{o.changesRequestedMemo || 'The partner requested updates to the event layout or schedule to process the quote.'}"</p>
                                                            </div>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="bg-white border border-amber-200 p-4 rounded-xl space-y-4 mt-3 animate-fade-in-rapid">
                                                                <p className="text-xs font-bold text-amber-900 border-b border-slate-150 pb-2">
                                                                    ✏️ Edit Booking Details
                                                                </p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Date</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none hover:border-slate-350"
                                                                            value={editForm.eventDate} 
                                                                            onChange={(e) => setEditForm({...editForm, eventDate: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Type</label>
                                                                        <select 
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-850 focus:border-amber-400 outline-none hover:border-slate-350"
                                                                            value={editForm.eventType} 
                                                                            onChange={(e) => setEditForm({...editForm, eventType: e.target.value})}
                                                                        >
                                                                            <option value="Wedding">Wedding</option>
                                                                            <option value="Birthday">Birthday</option>
                                                                            <option value="Corporate Event">Corporate Event</option>
                                                                            <option value="House Party">House Party</option>
                                                                            <option value="Anniversary">Anniversary</option>
                                                                            <option value="Cocktail Party">Cocktail Party</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Venue Address</label>
                                                                        <textarea 
                                                                            rows={2} 
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none hover:border-slate-350"
                                                                            value={editForm.venue} 
                                                                            onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest count</label>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none hover:border-slate-350"
                                                                            value={editForm.guests ?? 0} 
                                                                            onChange={(e) => setEditForm({...editForm, guests: parseInt(e.target.value) || 0})}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 justify-end pt-2">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setEditingOrderId(null)} 
                                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleResubmitOrder(o.id, o.catererId)} 
                                                                        className="bg-brand-green-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-green-950 transition-colors"
                                                                    >
                                                                        Resubmit Order
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2 justify-end mt-3">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => startEditing(o)} 
                                                                    className="bg-brand-green-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-green-950 transition-colors"
                                                                >
                                                                    Enable Grid Edit Mode
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (norm === 'quotation_updated') {
                                            return (
                                                <div className="mt-6 pt-4 border-t border-slate-100">
                                                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                                                        <div className="flex gap-3 items-start mb-3">
                                                            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">i</div>
                                                            <div className="flex-1">
                                                                <h4 className="font-extrabold text-cyan-950 text-xs">Revised Pricing Received!</h4>
                                                                <p className="text-xs text-cyan-800 mt-[2px]">
                                                                  Caterer calculated slabs. Rate: <span className="font-bold">₹{o.pricePerPlate}/plate</span> (Estimate: <span className="font-bold">₹{o.totalEstimate?.toLocaleString()}</span>)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => updateStatus(o.id, 'approved')} className="bg-brand-green-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-green-950 transition-colors">Accept Quote Details</button>
                                                            <button onClick={() => updateStatus(o.id, 'rejected')} className="bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-150 transition-colors">Decline Quote</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Default Steps
                                        const trackingSteps = [
                                            { label: 'Submitted', key: 'submitted' },
                                            { label: 'Caterer Review', key: 'pending_review' },
                                            { label: 'Approved', key: 'approved' },
                                            { label: 'Completed', key: 'completed' }
                                         ];
                                        
                                        let currentTrackingIdx = 0;
                                        const statusStr = String(o.status).toLowerCase();
                                        if (statusStr.includes('review') || statusStr === 'pending caterer review') {
                                           currentTrackingIdx = 1;
                                        } else if (norm === 'approved') {
                                           currentTrackingIdx = 2;
                                        } else if (norm === 'completed') {
                                           currentTrackingIdx = 3;
                                        }

                                        return (
                                            <div className="mt-8 pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between relative max-w-sm mx-auto">
                                                    <div className="absolute left-3 right-3 top-4 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full">
                                                        <div 
                                                            className="h-full bg-brand-green-900 rounded-full transition-all duration-700" 
                                                            style={{ width: `${(currentTrackingIdx / (trackingSteps.length - 1)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    
                                                    {trackingSteps.map((step, index) => {
                                                        const isPassed = index <= currentTrackingIdx;
                                                        const isActive = index === currentTrackingIdx;
                                                        
                                                        return (
                                                            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 border-2",
                                                                    isActive 
                                                                        ? "bg-brand-green-905 border-brand-green-905 text-white shadow-md scale-105" 
                                                                        : isPassed
                                                                            ? "bg-brand-green-900 border-brand-green-900 text-white"
                                                                            : "bg-white border-slate-200 text-slate-400"
                                                                )}>
                                                                    {isPassed ? <Check size={12} className="stroke-[3]" /> : index + 1}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[9px] tracking-wider font-extrabold uppercase transition-all duration-300", 
                                                                    isActive ? "text-brand-green-900" : isPassed ? "text-slate-600" : "text-slate-400"
                                                                )}>
                                                                    {step.key === 'pending_review' ? 'Review' : step.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="lg:w-64 flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-slate-150 pt-4 lg:pt-0 lg:pl-6 shrink-0 font-medium">
                                    <div className="text-left lg:text-right mb-4 lg:mb-0 w-full">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pricing Breakdown</p>
                                        <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-500 mb-1">
                                            <span>Base Quote (₹{o.pricePerPlate} × {o.guests})</span>
                                            <span>₹{((o.pricePerPlate || 0) * (o.guests || 0)).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-500 mb-3">
                                            <span>Platform Surcharges</span>
                                            <span>₹{o.platformFee || 0}</span>
                                        </div>
                                        
                                        <div className="flex justify-between lg:justify-end gap-4 border-t border-slate-100 pt-3">
                                            <p className="text-xs font-bold text-slate-450 uppercase tracking-widest self-end">Total</p>
                                            <p className="text-2xl font-display font-black text-brand-green-900 leading-none">₹{o.totalEstimate?.toLocaleString()}</p>
                                        </div>

                                        {(user.roles.includes('partner') || user.roles.includes('admin')) && normalizeStatus(o.status) === 'approved' && (
                                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-150 text-left">
                                                <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Settlement info</p>
                                                <p className="text-xs text-slate-650">Platform Fee Earned: ₹{o.platformFee || 0}</p>
                                                <p className="text-xs font-bold text-brand-green-909 mt-1">Caterer Profit share: ₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.9).toFixed(0)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {(user.roles.includes('admin') || user.roles.includes('partner')) && (
                                        <div className="flex flex-col gap-3 w-full">
                                             <select 
                                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-705 outline-none focus:border-brand-green-909"
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
                                                 <div className="flex gap-1.5">
                                                    <button onClick={() => updateStatus(o.id, 'Approved')} className="flex-1 bg-brand-green-900 text-white py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-brand-green-950 transition-colors">Approve</button>
                                                    <button onClick={() => updateStatus(o.id, 'Rejected')} className="flex-1 bg-rose-50 text-rose-650 border border-rose-200 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors">Reject</button>
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
               )}

               {/* Tab 2B: Booking History Archives */}
               {bookingSubTab === 'history' && (
                  <div id="booking-history-tab-panel">
                     {/* History Filtering Bar Panel */}
                     <div className="bg-white p-5 rounded-3xl border border-slate-200 mb-6 shadow-xs">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-105 pb-2">
                           <Filter size={15} className="text-brand-green-900" />
                           <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Search History Archives</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           {/* Text Query */}
                           <div className="relative">
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Search Keyword</label>
                              <div className="relative">
                                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input
                                    id="input-history-search"
                                    type="text"
                                    placeholder="ID, partner, address..."
                                    value={searchQueryHistory}
                                    onChange={(e) => setSearchQueryHistory(e.target.value)}
                                    className="bg-slate-50 border border-slate-250 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-green-900 w-full"
                                 />
                              </div>
                           </div>

                           {/* Status Filter */}
                           <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Milestone Category</label>
                              <select
                                 id="select-history-status"
                                 value={filterStatus}
                                 onChange={(e) => setFilterStatus(e.target.value)}
                                 className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-green-900 w-full h-[32px]"
                              >
                                 <option value="all">All Concluded Orders</option>
                                 <option value="completed">Completed Events</option>
                                 <option value="approved">Approved &amp; Concluded</option>
                                 <option value="rejected">Rejected Bookings</option>
                                 <option value="cancelled">Cancelled Inquiries</option>
                              </select>
                           </div>

                           {/* Start Date */}
                           <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">From Date</label>
                              <input
                                 id="input-history-start"
                                 type="date"
                                 value={filterStartDate}
                                 onChange={(e) => setFilterStartDate(e.target.value)}
                                 className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-green-900 w-full h-[32px]"
                              />
                           </div>

                           {/* End Date */}
                           <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">To Date</label>
                              <input
                                 id="input-history-end"
                                 type="date"
                                 value={filterEndDate}
                                 onChange={(e) => setFilterEndDate(e.target.value)}
                                 className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-green-900 w-full h-[32px]"
                              />
                           </div>
                        </div>

                        {/* Reset Filters button */}
                        {(searchQueryHistory || filterStatus !== 'all' || filterStartDate || filterEndDate) && (
                          <div className="flex justify-end mt-4">
                             <button
                               onClick={() => {
                                 setSearchQueryHistory('');
                                 setFilterStatus('all');
                                 setFilterStartDate('');
                                 setFilterEndDate('');
                               }}
                               className="text-xs text-rose-600 font-extrabold hover:underline py-1 px-3 bg-rose-50 rounded-lg transition-colors"
                             >
                               Reset Search Specifications
                             </button>
                          </div>
                        )}
                     </div>

                     {/* Table vs compact mobile list layout */}
                     {filteredHistoryOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-3xl mx-auto animate-fade-in-rapid">
                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">📂</div>
                            <h3 className="text-md font-bold text-slate-800 mb-1">No Booking Logs Found</h3>
                            <p className="text-slate-500 text-xs">There are no archived past bookings corresponding to your search specifications.</p>
                        </div>
                     ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                           
                           {/* Desktop Table */}
                           <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="bg-slate-55/75 border-b border-slate-200 text-slate-450 text-[10px] font-black uppercase tracking-wider">
                                       <th className="py-4 px-5">Archive Reference</th>
                                       <th className="py-4 px-5">Service Provider</th>
                                       <th className="py-4 px-5 text-center">Attendees</th>
                                       <th className="py-4 px-5 text-right">Invoice Payout</th>
                                       <th className="py-4 px-5 text-center">Status badge</th>
                                       <th className="py-4 px-5 text-center">Verify Row</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                    {paginatedHistoryOrders.map((o) => (
                                       <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="py-4 px-5">
                                             <p className="font-mono text-[9px] text-slate-400">ID: #{o.id.slice(0, 8)}...</p>
                                             <p className="font-bold text-slate-700 mt-0.5">{o.eventDate || 'Concluded Event'}</p>
                                          </td>
                                          <td className="py-4 px-5 font-bold text-slate-800">
                                             <p className="truncate max-w-[170px]">{user.roles.includes('partner') && o.customerName ? o.customerName : o.catererName}</p>
                                             <p className="text-[10px] font-medium text-slate-400 mt-0.5">{o.eventType}</p>
                                          </td>
                                          <td className="py-4 px-5 text-center text-slate-600">
                                             {o.guests} Pax
                                          </td>
                                          <td className="py-4 px-5 text-right font-black text-brand-green-900 font-mono">
                                             ₹{o.totalEstimate?.toLocaleString()}
                                          </td>
                                          <td className="py-4 px-5 text-center">
                                             <span className={cn("px-2 py-1 text-[9px] font-extrabold uppercase rounded-lg border", getStatusColor(o.status))}>
                                                {getStatusLabel(o.status)}
                                             </span>
                                          </td>
                                          <td className="py-4 px-5 text-center">
                                             <div className="flex items-center justify-center gap-2">
                                                <button
                                                   onClick={() => setSelectedQuickViewOrder(o)}
                                                   className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                                >
                                                   <Eye size={12} />
                                                   Quick View
                                                </button>
                                                {!user.roles.includes('partner') && !user.roles.includes('admin') && (
                                                   <button
                                                      id={`btn-repeat-booking-${o.id}`}
                                                      onClick={() => handleRepeatBookingInitiate(o)}
                                                      className="inline-flex items-center gap-1 bg-brand-green-900 hover:bg-brand-green-900/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                                   >
                                                      🔄 Repeat
                                                   </button>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>

                           {/* Mobile Stack Cards List */}
                           <div className="block md:hidden divide-y divide-slate-100">
                              {paginatedHistoryOrders.map((o) => (
                                 <div key={o.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <p className="text-[9px] font-mono text-slate-400">REF ID: #{o.id}</p>
                                          <h4 className="font-bold text-slate-850 mt-0.5">{user.roles.includes('partner') && o.customerName ? o.customerName : o.catererName}</h4>
                                       </div>
                                       <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded border", getStatusColor(o.status))}>
                                          {getStatusLabel(o.status)}
                                       </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                                       <p>Scheduled: <span className="font-bold text-slate-705">{o.eventDate}</span></p>
                                       <p>Guests: <span className="font-bold text-slate-755">{o.guests} Pax</span></p>
                                       <p className="col-span-2 text-brand-green-909 font-bold">Payout total: ₹{o.totalEstimate?.toLocaleString()}</p>
                                    </div>

                                    <div className="flex justify-end">
                                       <button
                                          onClick={() => setSelectedQuickViewOrder(o)}
                                          className="text-xs text-brand-green-900 font-extrabold flex items-center gap-1 bg-brand-green-900/5 px-2.5 py-1.5 rounded-lg transition-colors"
                                       >
                                          Retrieve Sheets <ChevronRight size={13} />
                                        </button>
                                        {!user.roles.includes('partner') && !user.roles.includes('admin') && (
                                           <button
                                              id={`btn-repeat-booking-mobile-${o.id}`}
                                              onClick={() => handleRepeatBookingInitiate(o)}
                                              className="text-xs text-white font-extrabold flex items-center gap-1 bg-brand-green-900 px-2.5 py-1.5 rounded-lg transition-colors ml-2"
                                           >
                                              🔄 Repeat
                                           </button>
                                                                                 )}
                                    </div>
                                 </div>
                              ))}
                           </div>

                           {/* Dynamic Table Pagination */}
                           {totalHistoryPages > 1 && (
                              <div className="bg-slate-50 border-t border-slate-100 py-3 px-5 flex justify-between items-center text-xs">
                                 <span className="text-slate-500 font-bold">
                                    Displaying Page <span className="text-slate-755 font-black">{historyPage}</span> of {totalHistoryPages}
                                 </span>
                                 <div className="flex gap-1.5">
                                    <button
                                       disabled={historyPage === 1}
                                       onClick={() => setHistoryPage(prev => prev - 1)}
                                       className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                                    >
                                       Prev
                                    </button>
                                    <button
                                       disabled={historyPage === totalHistoryPages}
                                       onClick={() => setHistoryPage(prev => prev + 1)}
                                       className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                                    >
                                       Next
                                    </button>
                                 </div>
                              </div>
                           )}

                        </div>
                     )}
                  </div>
               )}
            </>
        )}

        {/* Float Modal details card sheet drawer */}
        {selectedQuickViewOrder && (
           <div id="quickview-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-rapid">
              <div 
                id="quickview-modal-content" 
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 relative"
              >
                 {/* Close drawer */}
                 <button 
                   onClick={() => setSelectedQuickViewOrder(null)} 
                   className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
                 >
                    <X size={15} />
                 </button>

                 <div className="border-b border-slate-100 pb-4 mb-4">
                    <span className="bg-slate-100 text-slate-500 font-mono text-[9px] font-bold py-1 px-2 rounded-md uppercase">Ref DB ID: {selectedQuickViewOrder.id}</span>
                    <h2 className="text-lg font-black text-slate-900 mt-2 tracking-tight">Catering Summary Sheet</h2>
                    <p className="text-xs text-slate-500 font-medium">Receipt parameters, item listings, and payout audit trail logs</p>
                 </div>

                 <div className="space-y-4 text-xs font-semibold">
                    {/* Visual Badge Card */}
                    <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                       <div>
                          <p className="text-slate-400 text-[10px] uppercase">Service Provider</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                             {user.roles.includes('partner') && selectedQuickViewOrder.customerName ? selectedQuickViewOrder.customerName : selectedQuickViewOrder.catererName}
                          </p>
                       </div>
                       <span className={cn("px-3 py-1 rounded-lg text-xs font-bold uppercase", getStatusColor(selectedQuickViewOrder.status))}>
                          {getStatusLabel(selectedQuickViewOrder.status)}
                       </span>
                    </div>

                    {/* Metadata column fields */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-slate-400 text-[10px] uppercase">Event Category</p>
                          <p className="text-xs text-slate-755 font-black mt-1">{selectedQuickViewOrder.eventType}</p>
                       </div>
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-slate-400 text-[10px] uppercase">Concluded Date</p>
                          <p className="text-xs text-slate-755 font-black mt-1">{selectedQuickViewOrder.eventDate || 'N/A'}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-slate-400 text-[10px] uppercase">Scale / Guest Pax</p>
                          <p className="text-xs text-slate-755 font-black mt-1">{selectedQuickViewOrder.guests} Attendees</p>
                       </div>
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-slate-400 text-[10px] uppercase">Venue location</p>
                          <p className="text-xs text-slate-755 font-black mt-1 truncate">{selectedQuickViewOrder.venue || 'TBD Address'}</p>
                       </div>
                    </div>

                    {/* Menu items listing */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-slate-400 text-[10px] uppercase mb-2 font-bold">Platter Items selection</p>
                       <ul className="list-disc pl-4 text-xs space-y-1 text-slate-650">
                          {selectedQuickViewOrder.selectedItems?.length > 0 ? (
                             selectedQuickViewOrder.selectedItems.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                             ))
                          ) : (
                             <li className="text-slate-405 italic">No selections specified</li>
                          )}
                       </ul>
                    </div>

                    {/* Settlement calculations */}
                    <div className="p-4 bg-brand-green-909/5 rounded-xl border border-brand-green-900/10">
                       <p className="text-slate-650 text-[10px] uppercase font-bold mb-3">Invoice &amp; Settlement breakdown</p>
                       <div className="space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between text-slate-500">
                             <span>Platter Rate Unit Price</span>
                             <span>₹{selectedQuickViewOrder.pricePerPlate}/plate</span>
                          </div>
                          <div className="flex justify-between text-slate-500 font-medium">
                             <span>Raw Food Cost ({selectedQuickViewOrder.guests} Pax)</span>
                             <span>₹{((selectedQuickViewOrder.pricePerPlate || 0) * (selectedQuickViewOrder.guests || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 font-medium">
                             <span>Platform Security Surcharges</span>
                             <span>₹{selectedQuickViewOrder.platformFee || 0}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-brand-green-900 text-sm">
                             <span>Settled Total Invoice</span>
                             <span>₹{selectedQuickViewOrder.totalEstimate?.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    {/* Timeline status update audit trail */}
                    {selectedQuickViewOrder.statusHistory && selectedQuickViewOrder.statusHistory.length > 0 && (
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-105">
                          <p className="text-slate-400 text-[10px] uppercase mb-2 font-bold">Timeline Audit trail logs</p>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                             {selectedQuickViewOrder.statusHistory.map((h: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-slate-200 pl-3 py-0.5 text-xs">
                                   <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                      <span>Action: {h.action || 'Updated'}</span>
                                      <span>•</span>
                                      <span>Signed: {h.actor || 'User'}</span>
                                   </div>
                                   <p className="text-slate-600 font-semibold text-[11px] mt-0.5">{h.note}</p>
                                   {h.timestamp && (
                                     <p className="text-[9px] text-slate-400 mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>
                                   )}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                 </div>

                 <div className="mt-6 pt-4 border-t border-slate-150 flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedQuickViewOrder(null)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                       Close Sheets
                    </button>
                    {(user.roles.includes('admin') || user.roles.includes('partner')) && (
                       <div className="flex gap-1.5">
                          {normalizeStatus(selectedQuickViewOrder.status) === 'pending' && (
                             <button
                               onClick={() => updateStatus(selectedQuickViewOrder.id, 'approved')}
                               className="px-4 py-2.5 bg-brand-green-900 hover:bg-brand-green-950 text-white rounded-xl text-xs font-bold transition-all animate-pulse-once"
                             >
                               Approve Platter
                             </button>
                          )}
                          {normalizeStatus(selectedQuickViewOrder.status) === 'approved' && (
                             <button
                               onClick={() => updateStatus(selectedQuickViewOrder.id, 'completed')}
                               className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all"
                             >
                               Mark Completed
                             </button>
                          )}
                       </div>
                    )}
                 </div>

              </div>
           </div>
        )}

      </div>
    </div>
  );
}
