import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Search, Check, Clock, ArrowRight, ChevronRight, Filter, X, ChevronLeft, BookOpen, Sparkles, Eye, Archive, User, Phone, ShoppingBag, Star, AlertCircle, Sparkle, DollarSign, Shield, Menu, ChefHat, Download, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../components/Toast';
import { getSupabase, saveWithSupabaseSync } from '../lib/supabase';
import { normalizeStatus, getStatusLabel, getStatusBadgeColor, performOrderStatusUpdate, storeNotification } from '../lib/orderUtils';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { MapPickerModal } from '../components/MapPickerModal';


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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile redesign state variables
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<{[cardId: string]: string | null}>({});
  
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
  const [isMapOpen, setIsMapOpen] = useState(false);
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

  const toggleAccordion = (orderId: string, section: string) => {
    setExpandedSection(prev => ({
      ...prev,
      [orderId]: prev[orderId] === section ? null : section
    }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 767px) {
          #main-navigation-navbar {
            display: none !important;
          }
          body {
            padding-top: 0 !important;
          }
        }
      `}} />

      {/* ==================================================== */}
      {/* DESKTOP VIEW LAYOUT (VISIBLE ONLY ON DESKTOP >= 768px) */}
      {/* ==================================================== */}
      <div className="hidden md:block pt-24 pb-20 min-h-screen bg-[#FFFEFB] font-sans text-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Toggle headers and dynamic title */}
        <div id="orders-dashboard-header" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4 pb-2">
            <div>
               <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F3D2E] tracking-tight">
                   {user.roles.includes('admin') ? 'All Orders Platform' : user.roles.includes('partner') ? 'My Orders & Inquiries' : 'My Bookings'}
               </h1>
               <p className="text-xs text-[#0F3D2E]/70 mt-1 font-medium italic">Coordinate catering menus, track dynamic milestones, and monitor quote revisions</p>
            </div>
            
            {/* Customer notification toggle buttons */}
            {!user.roles.includes('admin') && !user.roles.includes('partner') && (
                <div id="customer-alert-segment-toggles" className="flex gap-1 bg-[#FCF8F0] p-1 rounded-xl border border-[#E8D7A5]/60 shrink-0">
                    <button 
                        id="btn-active-bookings-section"
                        type="button"
                        onClick={() => setActiveSegment('bookings')} 
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeSegment === 'bookings' 
                                ? "bg-[#0F3D2E] text-[#FFFEFB] shadow-xs" 
                                : "text-[#0F3D2E]/70 hover:text-[#0F3D2E]"
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
                                ? "bg-[#0F3D2E] text-[#FFFEFB] shadow-xs" 
                                : "text-[#0F3D2E]/70 hover:text-[#0F3D2E]"
                        )}
                    >
                        Notifications Inbox
                        {unreadCustCount > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {unreadCustCount}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Decorative gold flourish separator line */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#E8D7A5]"></div>
          </div>
          <div className="relative flex justify-center text-xs bg-[#FFFEFB] px-4 text-[#D4AF37] gap-2">
            <span>✦</span>
            <span className="text-sm font-serif">❦</span>
            <span>✦</span>
          </div>
        </div>

        {/* Dynamic Bento Summary Counters on Dashboard (Visible during bookings tab) */}
        {activeSegment === 'bookings' && (
          <>
            {/* KPI Cards Grid */}
            <div id="orders-kpi-cards-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Active Orders */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8D7A5]/50 shadow-[0_10px_35px_rgba(15,61,46,0.02)] flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all relative overflow-hidden group">
                <div className="w-12 h-12 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center shadow-md border border-[#D4AF37]/30 shrink-0">
                  <ShoppingBag size={18} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">Active Orders</p>
                  <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-0.5 leading-none">{activeOrdersCount}</h4>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0F3D2E] to-[#D4AF37]" />
              </div>

              {/* Upcoming Events */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8D7A5]/50 shadow-[0_10px_35px_rgba(15,61,46,0.02)] flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all relative overflow-hidden group">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shadow-md border border-white/20 shrink-0">
                  <Calendar size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">Upcoming Events</p>
                  <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-0.5 leading-none">{upcomingEventsCount}</h4>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#D4AF37]" />
              </div>

              {/* Completed Events */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8D7A5]/50 shadow-[0_10px_35px_rgba(15,61,46,0.02)] flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all relative overflow-hidden group">
                <div className="w-12 h-12 rounded-full bg-[#EAFDF5] text-[#0F3D2E] flex items-center justify-center shadow-md border border-emerald-100 shrink-0">
                  <Check size={18} className="text-[#0F3D2E] stroke-[3]" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">Completed Events</p>
                  <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-0.5 leading-none">{completedEventsCount}</h4>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500" />
              </div>

              {/* Rejected Orders */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8D7A5]/50 shadow-[0_10px_35px_rgba(15,61,46,0.02)] flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all relative overflow-hidden group">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-md border border-rose-100 shrink-0">
                  <X size={18} className="text-rose-600 stroke-[3]" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">Rejected Orders</p>
                  <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-0.5 leading-none">{rejectedOrdersCount}</h4>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500" />
              </div>
            </div>

            <div id="orders-bento-grid-dashboard" className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

            <button
              id="recent-bookings-bento-card"
              onClick={() => setBookingSubTab('recent')}
              className={cn(
                "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group hover:scale-[1.01] shadow-[0_12px_40px_rgba(15,61,46,0.03)] cursor-pointer",
                bookingSubTab === 'recent'
                  ? "bg-[#0F3D2E] border-[#D4AF37] ring-1 ring-[#D4AF37]"
                  : "bg-white border-[#E8D7A5]/60 hover:border-[#D4AF37]"
              )}
            >
              {/* Gold watermark mandala element */}
              <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4">
                <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke="#D4AF37" strokeWidth="0.5">
                  <circle cx="50" cy="50" r="40" />
                  <circle cx="50" cy="50" r="30" />
                  <circle cx="50" cy="50" r="20" />
                  <path d="M 50 0 L 50 100 M 0 50 L 100 50 M 15 15 L 85 85 M 15 85 L 85 15" />
                </svg>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className={cn(
                    "text-[10px] font-extrabold uppercase tracking-widest font-mono",
                    bookingSubTab === 'recent' ? "text-[#E8D7A5]" : "text-slate-400"
                  )}>Recent &amp; Active Bookings</p>
                  <h3 className={cn(
                    "text-4xl font-serif font-black mt-2",
                    bookingSubTab === 'recent' ? "text-white" : "text-[#0F3D2E]"
                  )}>{recentOrdersList.length}</h3>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-sm shrink-0",
                  bookingSubTab === 'recent' ? "bg-[#FCF8F0]/15 border-[#D4AF37]/40 text-[#D4AF37]" : "bg-[#FCF8F0] border-[#E8D7A5]/60 text-[#D4AF37]"
                )}>
                  <Clock size={20} />
                </div>
              </div>
              <p className={cn(
                "text-[11px] mt-5 flex items-center gap-1 font-semibold relative z-10 font-sans",
                bookingSubTab === 'recent' ? "text-[#E8D7A5]/90" : "text-slate-500"
              )}>
                View ongoing estimates, changes requested &amp; approved states <ChevronRight size={12} className={bookingSubTab === 'recent' ? "text-[#D4AF37]" : "text-slate-400"} />
              </p>
            </button>

            <button
              id="history-bookings-bento-card"
              onClick={() => setBookingSubTab('history')}
              className={cn(
                "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group hover:scale-[1.01] shadow-[0_12px_40px_rgba(15,61,46,0.03)] cursor-pointer",
                bookingSubTab === 'history'
                  ? "bg-[#0F3D2E] border-[#D4AF37] ring-1 ring-[#D4AF37]"
                  : "bg-white border-[#E8D7A5]/60 hover:border-[#D4AF37]"
              )}
            >
              {/* Gold watermark mandala element */}
              <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4">
                <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke="#D4AF37" strokeWidth="0.5">
                  <circle cx="50" cy="50" r="40" />
                  <circle cx="50" cy="50" r="30" />
                  <circle cx="50" cy="50" r="20" />
                  <path d="M 50 0 L 50 100 M 0 50 L 100 50 M 15 15 L 85 85 M 15 85 L 85 15" />
                </svg>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className={cn(
                    "text-[10px] font-extrabold uppercase tracking-widest font-mono",
                    bookingSubTab === 'history' ? "text-[#E8D7A5]" : "text-slate-400"
                  )}>Archived Booking History</p>
                  <h3 className={cn(
                    "text-4xl font-serif font-black mt-2",
                    bookingSubTab === 'history' ? "text-white" : "text-[#0F3D2E]"
                  )}>{historyOrdersList.length}</h3>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-sm shrink-0",
                  bookingSubTab === 'history' ? "bg-[#FCF8F0]/15 border-[#D4AF37]/40 text-[#D4AF37]" : "bg-[#FCF8F0] border-[#E8D7A5]/60 text-[#D4AF37]"
                )}>
                  <BookOpen size={20} />
                </div>
              </div>
              <p className={cn(
                "text-[11px] mt-5 flex items-center gap-1 font-semibold relative z-10 font-sans",
                bookingSubTab === 'history' ? "text-[#E8D7A5]/90" : "text-slate-500"
              )}>
                Review past event recipes, billing settlements &amp; concluded orders <ChevronRight size={12} className={bookingSubTab === 'history' ? "text-[#D4AF37]" : "text-slate-400"} />
              </p>
            </button>
          </div>
        </>
        )}

        {/* Segment 1: Notifications Inbox */}
        {activeSegment === 'notifications' && !user.roles.includes('admin') && !user.roles.includes('partner') ? (
            <div id="notifications-inbox" className="bg-white rounded-3xl border border-[#E8D7A5]/85 shadow-[0_4px_30px_rgba(15,61,46,0.02)] p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center border-b border-[#E8D7A5]/40 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#0F3D2E] flex items-center gap-2">
                           <span className="text-[#D4AF37]">✦</span> Alerts &amp; Status Logs
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Direct confirmations and pricing revisions from caterer partners</p>
                    </div>
                    {customerNotifications.length > 0 && (
                        <button onClick={handleClearAllCustNotifications} className="px-4 py-2 bg-[#FCF8F0] text-[#D4AF37] hover:bg-[#F6EAD4] font-bold rounded-xl text-xs transition-colors border border-[#E8D7A5]/40">
                            Clear All
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {customerNotifications.map((n) => (
                        <div key={n.id} className={cn("p-4 rounded-xl border transition-all flex justify-between items-start gap-4", n.read ? "bg-slate-50 border-slate-200" : "bg-[#FCF8F0]/40 border-[#E8D7A5] shadow-xs")}>
                            <div className="space-y-1 w-full">
                                <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", n.read ? "bg-slate-300" : "bg-[#D4AF37]")} />
                                    <h4 className="font-bold text-[#0F3D2E] text-xs">{n.title}</h4>
                                </div>
                                <p className="text-[11px] text-slate-600 pl-4 font-semibold">{n.message}</p>
                                {n.orderId && (
                                    <div className="flex items-center gap-2 mt-2 pl-4">
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {n.orderId}</p>
                                        <button 
                                            onClick={() => { setActiveSegment('bookings'); setBookingSubTab('recent'); setSearchQuery(n.orderId); }} 
                                            className="text-[10px] text-[#0F3D2E] hover:text-[#D4AF37] hover:underline font-bold"
                                        >
                                            View Booking Details →
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!n.read && (
                                <button onClick={() => handleMarkCustNotificationRead(n.id)} className="px-2.5 py-1 bg-white hover:bg-[#FCF8F0] border border-[#E8D7A5] text-[#D4AF37] rounded-lg text-[10px] font-bold transition-all shrink-0">
                                    Mark Read
                                </button>
                            )}
                        </div>
                    ))}
                    {customerNotifications.length === 0 && (
                        <div className="text-center py-16 text-slate-500">
                            <div className="w-12 h-12 bg-[#FCF8F0] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                                🔔
                            </div>
                            <p className="font-serif font-bold text-[#0F3D2E] text-sm">No new alerts</p>
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
                           <div className="flex items-center gap-2">
                              <span className="text-[#D4AF37] text-lg">✦</span>
                              <h2 className="text-2xl font-serif font-bold text-[#0F3D2E]">
                                 Active Event Plans
                              </h2>
                           </div>
                           <p className="text-xs text-slate-400 italic">Current proposals requiring your review or scheduled event executions</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                            <input 
                              id="input-recent-search"
                              type="text" 
                              placeholder="Search recent orders..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white border border-[#E8D7A5] rounded-full pl-10 pr-4 py-2 text-xs font-bold text-[#0F3D2E] placeholder-[#0F3D2E]/40 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-64 shadow-xs" 
                            />
                        </div>
                     </div>

                     {filteredRecentOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-[#E8D7A5]/60 shadow-sm max-w-3xl mx-auto">
                            <div className="w-16 h-16 bg-[#FCF8F0] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✦</div>
                            <h3 className="text-xl font-serif font-bold text-[#0F3D2E] mb-1">No Active Bookings</h3>
                            <p className="text-slate-500 text-xs mb-6 max-w-md mx-auto">
                              {searchQuery ? 'No pending bookings match your search parameters.' : "You do not have any upcoming bookings, live quotes, or modifications in progress."}
                            </p>
                            {!searchQuery && (
                              <Link to="/explore" className="bg-[#0F3D2E] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#051410] transition-colors shadow-xs border border-[#0F3D2E]">
                                Find a Caterer Partner
                              </Link>
                            )}
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {filteredRecentOrders.map((o) => (
                              <div 
                                key={o.id} 
                                className="bg-white rounded-3xl border border-[#E8D7A5] shadow-[0_12px_40px_rgba(15,61,46,0.04)] hover:border-[#D4AF37] hover:shadow-[0_15px_50px_rgba(15,61,46,0.06)] transition-all duration-300 relative overflow-hidden group grid grid-cols-1 lg:grid-cols-10"
                              >
                                 {/* Left side gold luxury accent bar */}
                                 <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#D4AF37] z-10"></div>
                                 
                                 {/* Left content column */}
                                 <div className="lg:col-span-7 p-6 sm:p-8 pl-8 sm:pl-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#E8D7A5]/50">
                                     <div>
                                         {/* Top Row: Reference & Status */}
                                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF8F0] border border-[#E8D7A5]/40 rounded-lg shrink-0">
                                               <Sparkle size={10} className="text-[#D4AF37] animate-pulse" />
                                               <span className="text-[9px] text-[#D4AF37] font-mono tracking-widest font-extrabold uppercase font-bold">Catering Reference: #{o.id.substring(0, 8).toUpperCase()}...</span>
                                            </div>
                                            <div>
                                                <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border font-mono", getStatusColor(o.status))}>
                                                    {getStatusLabel(o.status)}
                                                </span>
                                            </div>
                                         </div>
                                         {/* Name Header */}
                                         <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#0F3D2E] tracking-tight leading-tight mb-3">
                                             {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Client)' : o.catererName}
                                         </h3>
                                         
                                         {/* Event Details Row */}
                                         <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-3 mb-4 border-b border-[#E8D7A5]/30 text-xs text-slate-600 font-sans">
                                            <div className="flex items-center gap-2">
                                               <Calendar size={14} className="text-[#D4AF37]" />
                                               <span className="font-bold text-[#0F3D2E]">{o.eventDate || 'TBD'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                               <Users size={14} className="text-[#D4AF37]" />
                                               <span className="font-bold text-[#0F3D2E]">{o.guests} Guests</span>
                                            </div>
                                            <div className="flex items-center gap-2 truncate max-w-xs">
                                               <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                                               <span className="font-bold text-[#0F3D2E] truncate" title={o.venue || 'Venue TBD'}>{o.venue || 'Venue TBD'}</span>
                                               {(o.latitude && o.longitude) ? (
                                                 <a
                                                   href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-[#D4AF37] hover:underline font-bold text-[10px] shrink-0 inline-flex items-center ml-1"
                                                   title="View Venue on Map"
                                                 >
                                                   🗺️ View on Map
                                                 </a>
                                               ) : (o.venue || o.address) ? (
                                                 <a
                                                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.venue || o.address)}`}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-[#D4AF37] hover:underline font-bold text-[10px] shrink-0 inline-flex items-center ml-1"
                                                   title="View Venue on Map"
                                                 >
                                                   🗺️ View on Map
                                                 </a>
                                               ) : null}
                                            </div>
                                         </div>

                                         {/* Category & Package Details Row */}
                                         <div className="text-xs text-slate-500 mb-4 bg-white/50 px-1 font-sans">
                                             <span>Event Category:</span> <span className="text-[#0F3D2E] font-bold">{o.eventType}</span>
                                             <span className="mx-2 text-[#E8D7A5]">|</span>
                                             <span>Platter:</span> <span className="text-[#D4AF37] font-bold">{o.packageDetails?.packageName || 'Customized Selection'}</span>
                                         </div>

                                         {/* Platter Checklist Container */}
                                         <div className="text-xs text-[#0F3D2E]/90 bg-[#FCF8F0]/25 p-5 rounded-2xl border border-[#E8D7A5]/40 mt-4">
                                             <h4 className="font-serif font-bold text-xs text-[#0F3D2E] uppercase tracking-wider mb-3 border-b border-[#E8D7A5]/30 pb-2 flex items-center gap-1.5">
                                                <span className="text-[#D4AF37]">✦</span> Platter Checklist &amp; Client Details:
                                             </h4>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                                <div>
                                                   <p className="font-extrabold text-[#0F3D2E] border-b border-[#E8D7A5]/15 pb-1 mb-2 uppercase text-[9px] tracking-widest font-mono flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /> Contact Details</p>
                                                   <div className="space-y-1 text-slate-700 font-medium font-sans">
                                                      <p className="flex items-center gap-1.5">Lead: {o.customerName || 'Registered Member'}</p>
                                                      <p className="flex items-center gap-1.5">Phone: {o.phone || o.customerPhone || 'N/A'}</p>
                                                      <p className="flex items-center gap-1.5">Scale Rate: {o.matchedSlab ? `${o.matchedSlab.minGuests}-${o.matchedSlab.maxGuests || '1000+'} Guests` : 'Standard Rate'}</p>
                                                   </div>
                                                </div>
                                                <div>
                                                   <p className="font-extrabold text-[#0F3D2E] border-b border-[#E8D7A5]/15 pb-1 mb-2 uppercase text-[9px] tracking-widest font-mono flex items-center gap-1"><BookOpen size={10} className="text-[#D4AF37]" /> Detailed Menu Selection</p>
                                                   <ul className="space-y-1 text-slate-700 font-medium pl-1 font-sans">
                                                       {o.selectedItems?.length > 0 ? o.selectedItems.map((item, i) => (
                                                           <li key={i} className="flex items-start gap-1.5 hover:text-[#D4AF37] transition-colors">
                                                              <span className="text-[#D4AF37]">•</span>
                                                              <span>{item}</span>
                                                           </li>
                                                       )) : <li className="text-slate-400 italic list-none">No custom selections provided</li>}
                                                   </ul>
                                                </div>
                                             </div>
                                         </div>

                                         {/* Special Notes Instructions */}
                                         {o.specialNotes && (
                                             <div className="text-xs bg-[#FCF8F0]/50 p-4 rounded-xl text-slate-700 border border-[#E8D7A5]/50 mt-4 italic font-medium flex items-start gap-2.5 font-sans">
                                                 <AlertCircle size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                                                 <div>
                                                     <span className="font-extrabold text-[#0F3D2E] not-italic uppercase text-[9px] tracking-widest block mb-1 font-mono">Special Instructions:</span>
                                                     "{o.specialNotes}"
                                                 </div>
                                             </div>
                                         )}
                                     </div>

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
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Venue Address</label>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setIsMapOpen(true)}
                                                                                className="text-[10px] font-bold text-[#DEAA38] hover:text-[#b08427] transition flex items-center gap-0.5 cursor-pointer"
                                                                            >
                                                                                <span>🗺️ Select Location</span>
                                                                            </button>
                                                                        </div>
                                                                        <AddressAutocomplete
                                                                            useTextarea={true}
                                                                            rows={2} 
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none hover:border-slate-350"
                                                                            value={editForm.venue} 
                                                                            onChange={(val) => setEditForm({...editForm, venue: val})}
                                                                            onSelect={(data) => {
                                                                                setEditForm({
                                                                                    ...editForm,
                                                                                    venue: data.address,
                                                                                    latitude: data.latitude,
                                                                                    longitude: data.longitude
                                                                                });
                                                                            }}
                                                                            theme="gold"
                                                                            leftIcon={<MapPin className="text-[#DEAA38] w-4 h-4 hover:text-[#b08427] transition-colors" />}
                                                                            onIconClick={() => setIsMapOpen(true)}
                                                                        />
                                                                        <MapPickerModal
                                                                            isOpen={isMapOpen}
                                                                            onClose={() => setIsMapOpen(false)}
                                                                            initialLat={editForm.latitude}
                                                                            initialLng={editForm.longitude}
                                                                            initialAddress={editForm.venue}
                                                                            onSave={(data) => {
                                                                                setEditForm({
                                                                                    ...editForm,
                                                                                    venue: data.address,
                                                                                    latitude: data.latitude,
                                                                                    longitude: data.longitude
                                                                                });
                                                                            }}
                                                                            title="Select Event Location"
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
                                             <div className="mt-8 pt-6 border-t border-[#E8D7A5]/30">
                                                 <div className="flex items-center justify-between relative max-w-sm mx-auto">
                                                     <div className="absolute left-3 right-3 top-4.5 h-[2px] bg-[#FCF8F0] -translate-y-1/2 z-0 rounded-full border border-[#E8D7A5]/20">
                                                         <div 
                                                             className="h-full bg-[#0F3D2E] rounded-full transition-all duration-700" 
                                                             style={{ width: `${(currentTrackingIdx / (trackingSteps.length - 1)) * 100}%` }}
                                                         ></div>
                                                     </div>
                                                     
                                                     {trackingSteps.map((step, index) => {
                                                         const isPassed = index <= currentTrackingIdx;
                                                         const isActive = index === currentTrackingIdx;
                                                         
                                                         return (
                                                             <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                                                                 <div className={cn(
                                                                     "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 border-2",
                                                                     isActive 
                                                                         ? "bg-[#0F3D2E] border-[#D4AF37] text-white shadow-sm scale-105" 
                                                                         : isPassed
                                                                             ? "bg-[#FCF8F0] border-[#0F3D2E] text-[#0F3D2E]"
                                                                             : "bg-white border-slate-200 text-slate-400"
                                                                 )}>
                                                                     {isPassed ? <Check size={13} className="stroke-[3] text-[#D4AF37]" /> : index + 1}
                                                                 </div>
                                                                 <span className={cn(
                                                                     "text-[9px] tracking-widest font-extrabold uppercase transition-all duration-300 font-mono", 
                                                                     isActive ? "text-[#0F3D2E]" : isPassed ? "text-slate-600" : "text-slate-400"
                                                                 )}>
                                                                     {step.key === 'pending_review' ? 'Review' : step.label}
                                                                 </span>
                                                             </div>
                                                         );
                                                     })}
                                                 </div>
                                             </div>
                                         );})()}
                                </div>

                                 <div className="lg:col-span-3 p-6 sm:p-8 bg-[#FCF8F0]/15 flex flex-col justify-between relative border-t lg:border-t-0 lg:border-l border-[#E8D7A5]/50">
                                     <div className="text-left lg:text-right mb-4 lg:mb-0 w-full">
                                         <p className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-widest mb-1.5 font-mono">Pricing Breakdown</p>
                                         <div className="w-10 h-[2px] bg-[#D4AF37]/50 lg:ml-auto mb-4"></div>
                                         <div className="space-y-2 mb-4">
                                             <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-600">
                                                 <span className="text-slate-400">Base Quote (₹{o.pricePerPlate} × {o.guests})</span>
                                                 <span className="font-bold text-[#0F3D2E]">₹{((o.pricePerPlate || 0) * (o.guests || 0)).toLocaleString()}</span>
                                             </div>
                                             <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-600">
                                                 <span className="text-slate-400">Platform Surcharges</span>
                                                 <span className="font-bold text-[#0F3D2E]">₹{o.platformFee || 0}</span>
                                             </div>
                                         </div>
                                         
                                         <div className="flex justify-between lg:justify-end gap-4 border-t border-[#E8D7A5]/40 pt-4 mb-4">
                                             <p className="text-xs font-bold text-slate-450 uppercase tracking-widest self-end font-mono">Total Estimate</p>
                                             <p className="text-3xl font-serif font-black text-[#0F3D2E] leading-none">₹{o.totalEstimate?.toLocaleString()}</p>
                                         </div>

                                         {(user.roles.includes('partner') || user.roles.includes('admin')) && normalizeStatus(o.status) === 'approved' && (
                                             <div className="mt-4 p-4 bg-white/80 rounded-xl border border-[#E8D7A5]/40 text-left">
                                                 <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2 font-mono">✦ Settlement details</p>
                                                 <p className="text-xs text-slate-650 flex justify-between"><span>Platform Fee:</span> <span className="font-semibold">₹{o.platformFee || 0}</span></p>
                                                 <p className="text-xs font-bold text-[#0F3D2E] mt-1.5 pt-1.5 border-t border-[#E8D7A5]/30 flex justify-between"><span>Partner Profit Share:</span> <span>₹{(((o.pricePerPlate || 0) * (o.guests || 0)) * 0.9).toFixed(0)}</span></p>
                                             </div>
                                         )}
                                     </div>

                                     {/* Bottom select/button actions in pricing column */}
                                     <div className="relative z-10 w-full mt-6">
                                         {(user.roles.includes('admin') || user.roles.includes('partner')) ? (
                                             <div className="flex flex-col gap-3 w-full">
                                                 <p className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-widest font-mono text-left lg:text-right">Manage Status</p>
                                                 <div className="relative w-full">
                                                      <select 
                                                          className="w-full bg-white border border-[#E8D7A5] rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none hover:border-[#D4AF37] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-xs cursor-pointer appearance-none font-mono"
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
                                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                                                         <ChevronRight size={14} className="rotate-90" />
                                                      </div>
                                                 </div>

                                                 {o.status === 'Pending Caterer Review' && user.roles.includes('partner') && (
                                                     <div className="flex gap-2 mt-1">
                                                        <button onClick={() => updateStatus(o.id, 'Approved')} className="flex-1 bg-[#0F3D2E] text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#051410] transition-colors border border-[#0F3D2E]">Approve</button>
                                                        <button onClick={() => updateStatus(o.id, 'Rejected')} className="flex-1 bg-white text-rose-700 border border-rose-200 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors">Reject</button>
                                                     </div>
                                                 )}
                                             </div>
                                         ) : (
                                             <div className="w-full">
                                                 <button 
                                                    onClick={() => setSelectedQuickViewOrder(o)}
                                                    className="w-full bg-white text-[#D4AF37] hover:bg-[#FCF8F0] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#E8D7A5] flex items-center justify-center gap-2 font-sans"
                                                 >
                                                    <Eye size={14} /> View History logs
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                              </div>
                         )
                      )})
                   </div>
                )}
             </div>
          )}

          {/* Tab 2B: Archived Booking History */}
          {bookingSubTab === 'history' && (
             <div id="history-bookings-tab-panel" className="space-y-6 animate-fade-in-rapid">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="text-[#D4AF37] text-lg">✦</span>
                         <h2 className="text-2xl font-serif font-bold text-[#0F3D2E]">
                            Booking History Archives
                         </h2>
                      </div>
                      <p className="text-xs text-slate-400 italic font-medium font-sans">Review past event recipes, billing settlements &amp; concluded orders</p>
                   </div>
                   <div className="relative w-full sm:w-auto">
                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                       <input 
                         id="input-history-search"
                         type="text" 
                         placeholder="Search archived bookings..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="bg-white border border-[#E8D7A5] rounded-full pl-10 pr-4 py-2 text-xs font-bold text-[#0F3D2E] placeholder-[#0F3D2E]/40 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-64 shadow-xs" 
                       />
                   </div>
                </div>

                {paginatedHistoryOrders.length === 0 ? (
                   <div className="bg-white rounded-3xl p-16 text-center border border-[#E8D7A5]/60 shadow-sm max-w-3xl mx-auto">
                       <div className="w-16 h-16 bg-[#FCF8F0] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✦</div>
                       <h3 className="text-xl font-serif font-bold text-[#0F3D2E] mb-1">No Archived Bookings</h3>
                       <p className="text-slate-500 text-xs max-w-md mx-auto font-sans">
                          {searchQuery ? 'No past bookings match your search parameters.' : "Your past event bookings and concluded history will be indexed here."}
                       </p>
                   </div>
                ) : (
                   <div className="space-y-6">
                      {paginatedHistoryOrders.map((o) => {
                         const norm = normalizeStatus(o.status);
                         return (
                            <div 
                              key={o.id} 
                              className="bg-white rounded-3xl border border-[#E8D7A5] shadow-[0_12px_40px_rgba(15,61,46,0.04)] hover:border-[#D4AF37] hover:shadow-[0_15px_50px_rgba(15,61,46,0.06)] transition-all duration-300 relative overflow-hidden group grid grid-cols-1 lg:grid-cols-10"
                            >
                              {/* Left side gold luxury accent bar */}
                              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#D4AF37]/55 z-10"></div>
                              
                              {/* Left content column */}
                              <div className="lg:col-span-7 p-6 sm:p-8 pl-8 sm:pl-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#E8D7A5]/50">
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 pb-3 border-b border-[#E8D7A5]/30">
                                      <div>
                                         <div className="text-[10px] text-[#D4AF37] font-mono tracking-widest font-bold mb-1 uppercase">Archived ID: #{o.id.substring(0, 8)}...</div>
                                         <h3 className="text-2xl font-serif font-bold text-[#0F3D2E]">
                                             {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Client)' : o.catererName}
                                         </h3>
                                      </div>
                                      <div>
                                          <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border font-mono", getStatusColor(o.status))}>
                                              {getStatusLabel(o.status)}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  {/* Event Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FCF8F0]/30 border border-[#E8D7A5]/30 rounded-2xl p-4 mb-5">
                                     <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#FCF8F0] text-[#0F3D2E] flex items-center justify-center border border-[#E8D7A5]/40 shrink-0">
                                           <Calendar size={15} />
                                        </div>
                                        <div>
                                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Event Date</p>
                                           <p className="text-xs font-bold text-[#0F3D2E]">{o.eventDate || 'TBD'}</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#FCF8F0] text-[#0F3D2E] flex items-center justify-center border border-[#E8D7A5]/40 shrink-0">
                                           <Users size={15} />
                                        </div>
                                        <div>
                                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Guest List</p>
                                           <p className="text-xs font-bold text-[#0F3D2E]">{o.guests} Pax</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-3 truncate">
                                        <div className="w-9 h-9 rounded-full bg-[#FCF8F0] text-[#0F3D2E] flex items-center justify-center border border-[#E8D7A5]/40 shrink-0">
                                           <MapPin size={15} />
                                        </div>
                                        <div className="truncate">
                                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Venue</p>
                                           <p className="text-xs font-bold text-[#0F3D2E] truncate" title={o.venue || 'Venue TBD'}>{o.venue || 'Venue TBD'}</p>
                                            {(o.latitude && o.longitude) ? (
                                              <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#D4AF37] hover:underline font-bold text-[10px] block mt-0.5"
                                              >
                                                🗺️ View on Map
                                              </a>
                                            ) : (o.venue || o.address) ? (
                                              <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.venue || o.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#D4AF37] hover:underline font-bold text-[10px] block mt-0.5"
                                              >
                                                🗺️ View on Map
                                              </a>
                                            ) : null}
                                        </div>
                                     </div>
                                  </div>

                                  <div className="text-xs text-slate-600 mb-4 bg-white px-1">
                                      <span className="font-bold text-[#0F3D2E]">Event Type:</span> <span className="text-slate-800 font-medium">{o.eventType}</span> | <span className="font-bold text-[#0F3D2E]">Gastronomy Package:</span> <span className="text-slate-800 font-medium">{o.packageDetails?.packageName || 'Customized Selection'}</span>
                                  </div>

                                  {/* Platter Checklist Container */}
                                  <div className="text-xs text-[#0F3D2E]/90 bg-[#FCF8F0]/25 p-5 rounded-2xl border border-[#E8D7A5]/40 mt-4">
                                      <h4 className="font-serif font-bold text-xs text-[#0F3D2E] uppercase tracking-wider mb-3 border-b border-[#E8D7A5]/30 pb-2 flex items-center gap-1.5">
                                         <span className="text-[#D4AF37]">✦</span> Platter Checklist &amp; Client Details:
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                         <div>
                                            <p className="font-extrabold text-[#0F3D2E] border-b border-[#E8D7A5]/15 pb-1 mb-2 uppercase text-[9px] tracking-widest font-mono flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /> Contact Details</p>
                                            <div className="space-y-1 text-slate-700 font-medium font-sans">
                                               <p className="flex items-center gap-1.5">Lead: {o.customerName || 'Registered Member'}</p>
                                               <p className="flex items-center gap-1.5">Phone: {o.phone || o.customerPhone || 'N/A'}</p>
                                               <p className="flex items-center gap-1.5">Scale Rate: {o.matchedSlab ? (o.matchedSlab.minGuests + '-' + (o.matchedSlab.maxGuests || '1000+') + ' Guests') : 'Standard Rate'}</p>
                                            </div>
                                         </div>
                                         <div>
                                            <p className="font-extrabold text-[#0F3D2E] border-b border-[#E8D7A5]/15 pb-1 mb-2 uppercase text-[9px] tracking-widest font-mono flex items-center gap-1"><BookOpen size={10} className="text-[#D4AF37]" /> Detailed Menu Selection</p>
                                            <ul className="space-y-1 text-slate-700 font-medium pl-1 font-sans">
                                                {o.selectedItems?.length > 0 ? o.selectedItems.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-1.5 hover:text-[#D4AF37] transition-colors">
                                                       <span className="text-[#D4AF37]">•</span>
                                                       <span>{item}</span>
                                                    </li>
                                                )) : <li className="text-slate-400 italic list-none">No custom selections provided</li>}
                                            </ul>
                                         </div>
                                      </div>
                                  </div>

                                  {o.specialNotes && (
                                      <div className="text-xs bg-[#FCF8F0]/50 p-4 rounded-xl text-slate-700 border border-[#E8D7A5]/50 mt-4 italic font-medium">
                                          <span className="font-bold text-[#0F3D2E] not-italic uppercase text-[10px] tracking-wider block mb-1">Catering Instructions:</span>
                                          "{o.specialNotes}"
                                      </div>
                                  )}
                              </div>

                              {/* Right Column - Pricing Summary */}
                              <div className="lg:col-span-3 p-6 sm:p-8 bg-[#FCF8F0]/15 flex flex-col justify-between relative border-t lg:border-t-0 lg:border-l border-[#E8D7A5]/50">
                                  <div className="text-left lg:text-right mb-4 lg:mb-0 w-full">
                                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3 font-mono">Concluded Invoice</p>
                                      <div className="space-y-2 mb-4">
                                          <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-600">
                                              <span className="text-slate-400">Base Quote (₹{o.pricePerPlate} × {o.guests})</span>
                                              <span className="font-bold text-[#0F3D2E]">₹{((o.pricePerPlate || 0) * (o.guests || 0)).toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between lg:justify-end gap-4 text-xs text-slate-600">
                                              <span className="text-slate-400">Platform Surcharges</span>
                                              <span className="font-bold text-[#0F3D2E]">₹{o.platformFee || 0}</span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex justify-between lg:justify-end gap-4 border-t border-[#E8D7A5]/40 pt-4 mb-4">
                                          <p className="text-xs font-bold text-slate-450 uppercase tracking-widest self-end font-mono">Concluded Total</p>
                                          <p className="text-3xl font-serif font-black text-[#0F3D2E] leading-none">₹{o.totalEstimate?.toLocaleString()}</p>
                                      </div>
                                  </div>

                                  <div className="w-full">
                                      {user.roles.includes('admin') || user.roles.includes('partner') ? (
                                         <button 
                                            onClick={() => setSelectedQuickViewOrder(o)}
                                            className="w-full bg-[#FCF8F0] text-[#D4AF37] hover:bg-[#F6EAD4] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#E8D7A5]/50 flex items-center justify-center gap-2"
                                         >
                                            View Logs
                                         </button>
                                      ) : (
                                         <button 
                                            onClick={() => handleRepeatBookingInitiate(o)}
                                            className="w-full bg-[#0F3D2E] text-white hover:bg-[#051410] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#0F3D2E] flex items-center justify-center gap-2"
                                         >
                                            Repeat Booking
                                         </button>
                                      )}
                                  </div>
                              </div>
                            </div>
                         );
                      })}
                   </div>
                )}

                {/* Pagination Controls */}
                {totalHistoryPages > 1 && (
                   <div className="flex justify-between items-center bg-white border border-[#E8D7A5]/50 p-4 rounded-2xl shadow-xs max-w-sm mx-auto mt-8">
                       <button 
                         disabled={historyPage === 1}
                         onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                         className="px-4 py-2 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold transition-all"
                       >
                          Previous
                       </button>
                       <span className="text-xs font-bold text-[#0F3D2E] font-mono">
                          Page {historyPage} of {totalHistoryPages}
                       </span>
                       <button 
                         disabled={historyPage === totalHistoryPages}
                         onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                         className="px-4 py-2 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold transition-all"
                       >
                          Next
                       </button>
                   </div>
                )}
             </div>
          )}
          </>
         )}

         {/* Segment 3: Modal sheets for admin audit logs */}
         {selectedQuickViewOrder && (
            <div id="modal-quick-view" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/45 backdrop-blur-xs">
               <div className="bg-white rounded-3xl border border-[#E8D7A5] max-w-2xl w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,61,46,0.15)] animate-fade-in-rapid relative">
                  <div className="absolute right-6 top-6">
                     <button 
                       onClick={() => setSelectedQuickViewOrder(null)}
                       className="w-8 h-8 rounded-full bg-[#FCF8F0] hover:bg-[#F6EAD4] border border-[#E8D7A5]/50 flex items-center justify-center text-[#D4AF37] font-bold transition-all"
                     >
                       ✕
                     </button>
                  </div>

                  <div className="mb-6 border-b border-[#E8D7A5]/40 pb-4">
                     <span className="text-[10px] text-[#D4AF37] font-mono font-bold tracking-widest block mb-1">AUDIT MANAGEMENT SHEET</span>
                     <h3 className="text-2xl font-serif font-bold text-[#0F3D2E]">Order Reference #{selectedQuickViewOrder.id.substring(0, 8)}</h3>
                     <p className="text-xs text-slate-500 mt-1">Concluded state: {selectedQuickViewOrder.status}</p>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4 bg-[#FCF8F0]/30 border border-[#E8D7A5]/30 rounded-2xl p-4">
                        <div>
                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Client</p>
                           <p className="text-xs font-bold text-[#0F3D2E]">{selectedQuickViewOrder.customerName || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Caterer Partner</p>
                           <p className="text-xs font-bold text-[#0F3D2E]">{selectedQuickViewOrder.catererName || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Event Details</p>
                           <p className="text-xs font-bold text-[#0F3D2E]">{selectedQuickViewOrder.eventType} on {selectedQuickViewOrder.eventDate}</p>
                        </div>
                        <div>
                           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Concluded Total Price</p>
                           <p className="text-sm font-bold text-[#D4AF37]">₹{selectedQuickViewOrder.totalEstimate?.toLocaleString()}</p>
                        </div>
                     </div>

                     {/* Timeline status update audit trail */}
                     {selectedQuickViewOrder.statusHistory && selectedQuickViewOrder.statusHistory.length > 0 && (
                        <div className="p-5 bg-[#FCF8F0]/40 rounded-2xl border border-[#E8D7A5]/30">
                           <p className="text-[#D4AF37] text-[10px] uppercase mb-3 font-mono font-bold">✦ Timeline Audit Trail Logs</p>
                           <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                              {selectedQuickViewOrder.statusHistory.map((h: any, idx: number) => (
                                 <div key={idx} className="border-l-2 border-[#D4AF37] pl-3 py-0.5 text-xs">
                                    <div className="flex items-center gap-2 text-[9px] text-[#0F3D2E] font-bold uppercase font-mono">
                                       <span>Action: {h.action || 'Updated'}</span>
                                       <span className="text-[#D4AF37]">•</span>
                                       <span>Signed: {h.actor || 'User'}</span>
                                    </div>
                                    <p className="text-slate-700 font-semibold text-[11px] mt-1">{h.note}</p>
                                    {h.timestamp && (
                                      <p className="text-[9px] text-slate-400 mt-1 font-mono">{new Date(h.timestamp).toLocaleString()}</p>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E8D7A5]/40 flex justify-end gap-2">
                     <button
                       onClick={() => setSelectedQuickViewOrder(null)}
                       className="px-5 py-2.5 bg-[#FCF8F0] hover:bg-[#F6EAD4] border border-[#E8D7A5]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all"
                     >
                        Close Sheet
                     </button>
                     {(user.roles.includes('admin') || user.roles.includes('partner')) && (
                        <div className="flex gap-1.5">
                           {normalizeStatus(selectedQuickViewOrder.status) === 'pending' && (
                              <button
                                onClick={() => updateStatus(selectedQuickViewOrder.id, 'approved')}
                                className="px-4 py-2.5 bg-[#0F3D2E] text-white rounded-xl text-xs font-bold hover:bg-[#051410] transition-all"
                              >
                                Approve Platter
                              </button>
                           )}
                           {normalizeStatus(selectedQuickViewOrder.status) === 'approved' && (
                              <button
                                onClick={() => updateStatus(selectedQuickViewOrder.id, 'completed')}
                                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
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

         {/* Segment 4: Repeat Booking Dialog */}
         {repeatOrderSource && (
            <div id="modal-repeat-booking" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/40 backdrop-blur-xs">
               <div className="bg-white rounded-3xl border border-[#E8D7A5] max-w-lg w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,61,46,0.15)] animate-fade-in-rapid relative">
                  <div className="absolute right-6 top-6">
                     <button 
                       onClick={() => setRepeatOrderSource(null)}
                       className="w-8 h-8 rounded-full bg-[#FCF8F0] hover:bg-[#F6EAD4] border border-[#E8D7A5]/50 flex items-center justify-center text-[#D4AF37] font-bold transition-all"
                     >
                       ✕
                     </button>
                  </div>

                  <div className="mb-6 border-b border-[#E8D7A5]/40 pb-4">
                     <span className="text-[10px] text-[#D4AF37] font-mono font-bold tracking-widest block mb-1">✦ GOLD MEMBER PRIVILEGES</span>
                     <h3 className="text-2xl font-serif font-bold text-[#0F3D2E]">Repeat Event Plan</h3>
                     <p className="text-xs text-slate-500 mt-1">Re-initiate a past successful recipe platter with {repeatOrderSource.catererName}</p>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">New Event Date</label>
                        <input 
                           type="date" 
                           value={repeatForm.eventDate}
                           onChange={(e) => setRepeatForm({...repeatForm, eventDate: e.target.value})}
                           className="w-full bg-[#FCF8F0]/35 border border-[#E8D7A5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none focus:border-[#D4AF37] shadow-xs"
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Guest Count (Pax)</label>
                        <input 
                           type="number" 
                           value={repeatForm.guests || ''}
                           onChange={(e) => setRepeatForm({...repeatForm, guests: parseInt(e.target.value) || 0})}
                           className="w-full bg-[#FCF8F0]/35 border border-[#E8D7A5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none focus:border-[#D4AF37] shadow-xs"
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Venue Address</label>
                        <textarea 
                           rows={2}
                           value={repeatForm.venue}
                           onChange={(e) => setRepeatForm({...repeatForm, venue: e.target.value})}
                           className="w-full bg-[#FCF8F0]/35 border border-[#E8D7A5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none focus:border-[#D4AF37] shadow-xs"
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Special Instructions</label>
                        <textarea 
                           rows={2}
                           value={repeatForm.specialNotes}
                           onChange={(e) => setRepeatForm({...repeatForm, specialNotes: e.target.value})}
                           className="w-full bg-[#FCF8F0]/35 border border-[#E8D7A5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none focus:border-[#D4AF37] shadow-xs"
                        />
                     </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E8D7A5]/40 flex justify-end gap-2">
                     <button
                       onClick={() => setRepeatOrderSource(null)}
                       className="px-5 py-2.5 bg-[#FCF8F0] hover:bg-[#F6EAD4] border border-[#E8D7A5]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all"
                     >
                        Cancel
                     </button>
                     <button
                       onClick={handleRepeatBookingConfirm}
                       className="px-6 py-2.5 bg-[#0F3D2E] hover:bg-[#051410] border border-[#0F3D2E] text-white rounded-xl text-xs font-bold transition-all"
                     >
                        Re-Submit Quote
                     </button>
                  </div>

               </div>
            </div>
         )}

      </div>
    </div>

    {/* ==================================================== */}
    {/* MOBILE VIEW LAYOUT (VISIBLE ONLY ON MOBILE < 768px) */}
    {/* ==================================================== */}
    <div className="block md:hidden min-h-screen bg-[#FCFBF7] font-sans text-slate-800 pb-24">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8D7A5]/40 px-4 py-3 shadow-[0_2px_15px_rgba(15,61,46,0.04)] flex justify-between items-center">
        {/* Hamburger menu */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-white border border-[#E8D7A5]/50 flex items-center justify-center text-[#0F3D2E] shadow-sm active:scale-95 transition-all"
          id="mobile-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#D4AF37] w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0">
            <ChefHat size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display tracking-tight text-[#0F3D2E] leading-none">CaterNest</span>
            <span className="text-[7px] font-extrabold tracking-widest text-[#D4AF37] leading-none uppercase mt-0.5">Making Every Event Special</span>
          </div>
        </Link>

        {/* Profile icon */}
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center border border-[#D4AF37]/30 shadow-sm"
          id="mobile-profile-btn"
        >
          <User size={18} />
        </button>
      </header>

      {/* Mobile drawer menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[80vw] bg-[#FFFEFB] z-55 flex flex-col border-r border-[#E8D7A5]/40 shadow-2xl overflow-y-auto"
            >
              <div className="p-4 bg-[#0F3D2E] text-white flex justify-between items-center">
                <span className="font-display font-bold text-lg">CaterNest Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {user && (
                  <div className="p-3 bg-[#FCF8F0] border border-[#E8D7A5]/40 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-[#0F3D2E] text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1.5 font-sans">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#FCF8F0]">Home</Link>
                  <Link to="/explore" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#FCF8F0]">Explore Caterers</Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#0F3D2E] text-white">My Bookings</Link>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#FCF8F0]">My Profile</Link>
                  {user?.roles.includes('admin') && (
                    <Link to="/admin-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-red-700 bg-red-50">Admin Dashboard</Link>
                  )}
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="px-4 py-5 space-y-5">
        {/* Premium Dashboard Cards - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active Orders */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8D7A5]/50 shadow-[0_4px_20px_rgba(15,61,46,0.02)] flex flex-col justify-between h-[100px] relative overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0F3D2E] text-[#D4AF37] flex items-center justify-center">
                <ShoppingBag size={14} />
              </div>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Active Orders</p>
            </div>
            <div>
              <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-1 leading-none text-left">{activeOrdersCount}</h4>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0F3D2E] to-[#D4AF37]" />
          </div>

          {/* Upcoming Events */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8D7A5]/50 shadow-[0_4px_20px_rgba(15,61,46,0.02)] flex flex-col justify-between h-[100px] relative overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center">
                <Calendar size={14} />
              </div>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Upcoming Events</p>
            </div>
            <div>
              <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-1 leading-none text-left">{upcomingEventsCount}</h4>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#D4AF37]" />
          </div>

          {/* Completed Events */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8D7A5]/50 shadow-[0_4px_20px_rgba(15,61,46,0.02)] flex flex-col justify-between h-[100px] relative overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EAFDF5] text-[#0F3D2E] flex items-center justify-center border border-emerald-100">
                <Check size={14} className="stroke-[3]" />
              </div>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Completed Events</p>
            </div>
            <div>
              <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-1 leading-none text-left">{completedEventsCount}</h4>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500" />
          </div>

          {/* Rejected Orders */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8D7A5]/50 shadow-[0_4px_20px_rgba(15,61,46,0.02)] flex flex-col justify-between h-[100px] relative overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <X size={14} className="stroke-[3]" />
              </div>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Rejected Orders</p>
            </div>
            <div>
              <h4 className="text-3xl font-serif font-black text-[#0F3D2E] mt-1 leading-none text-left">{rejectedOrdersCount}</h4>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500" />
          </div>
        </div>

        {/* Recent & Active Bookings (Emerald premium card) */}
        <button
          onClick={() => setBookingSubTab('recent')}
          className={cn(
            "w-full p-5 rounded-3xl border text-left transition-all relative overflow-hidden shadow-[0_8px_30px_rgba(15,61,46,0.02)] active:scale-[0.99] cursor-pointer",
            bookingSubTab === 'recent'
              ? "bg-[#0F3D2E] border-[#D4AF37] ring-1 ring-[#D4AF37]"
              : "bg-white border-[#E8D7A5]/60"
          )}
        >
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#D4AF37" strokeWidth="0.5">
              <circle cx="50" cy="50" r="40" />
              <circle cx="50" cy="50" r="30" />
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className={cn(
                "text-[8px] font-extrabold uppercase tracking-widest font-mono text-left",
                bookingSubTab === 'recent' ? "text-[#E8D7A5]" : "text-slate-400"
              )}>Recent &amp; Active Bookings</p>
              <h3 className={cn(
                "text-3xl font-serif font-black mt-1 text-left",
                bookingSubTab === 'recent' ? "text-white" : "text-[#0F3D2E]"
              )}>{recentOrdersList.length}</h3>
            </div>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center border text-[#D4AF37]",
              bookingSubTab === 'recent' ? "bg-white/10 border-[#D4AF37]/30" : "bg-[#FCF8F0] border-[#E8D7A5]/60"
            )}>
              <Clock size={16} />
            </div>
          </div>
          <p className={cn(
            "text-[10px] mt-4 flex items-center gap-1 font-semibold text-left",
            bookingSubTab === 'recent' ? "text-[#E8D7A5]/90" : "text-slate-500"
          )}>
            View ongoing estimates, changes requested &amp; approved status <ChevronRight size={10} />
          </p>
        </button>

        {/* Archived Booking History (White premium card) */}
        <button
          onClick={() => setBookingSubTab('history')}
          className={cn(
            "w-full p-5 rounded-3xl border text-left transition-all relative overflow-hidden shadow-[0_8px_30px_rgba(15,61,46,0.02)] active:scale-[0.99] cursor-pointer",
            bookingSubTab === 'history'
              ? "bg-[#0F3D2E] border-[#D4AF37] ring-1 ring-[#D4AF37]"
              : "bg-white border-[#E8D7A5]/60"
          )}
        >
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#D4AF37" strokeWidth="0.5">
              <circle cx="50" cy="50" r="40" />
              <circle cx="50" cy="50" r="30" />
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" />
            </svg>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className={cn(
                "text-[8px] font-extrabold uppercase tracking-widest font-mono text-left",
                bookingSubTab === 'history' ? "text-[#E8D7A5]" : "text-slate-400"
              )}>Archived Booking History</p>
              <h3 className={cn(
                "text-3xl font-serif font-black mt-1 text-left",
                bookingSubTab === 'history' ? "text-white" : "text-[#0F3D2E]"
              )}>{historyOrdersList.length}</h3>
            </div>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center border text-[#D4AF37]",
              bookingSubTab === 'history' ? "bg-white/10 border-[#D4AF37]/30" : "bg-[#FCF8F0] border-[#E8D7A5]/60"
            )}>
              <BookOpen size={16} />
            </div>
          </div>
          <p className={cn(
            "text-[10px] mt-4 flex items-center gap-1 font-semibold text-left",
            bookingSubTab === 'history' ? "text-[#E8D7A5]/90" : "text-slate-500"
          )}>
            Review past event recipes, billing settlements &amp; concluded orders <ChevronRight size={10} />
          </p>
        </button>

        {/* Separator and Title */}
        <div className="pt-2 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#D4AF37]">✦</span>
            <h2 className="text-2xl font-serif font-bold text-[#0F3D2E]">
              {bookingSubTab === 'recent' ? 'Active Event Plans' : 'Archived History'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 italic">
            {bookingSubTab === 'recent' 
              ? 'Current proposals requiring your review or scheduled event execution' 
              : 'Review concluded invoices and past successful platters'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
          <input 
            type="text" 
            placeholder={bookingSubTab === 'recent' ? "Search recent orders..." : "Search archived bookings..."}
            value={bookingSubTab === 'recent' ? searchQuery : searchQueryHistory}
            onChange={(e) => {
              if (bookingSubTab === 'recent') {
                setSearchQuery(e.target.value);
              } else {
                setSearchQueryHistory(e.target.value);
              }
            }}
            className="bg-white border border-[#E8D7A5] rounded-full pl-11 pr-4 py-3 text-xs font-bold text-[#0F3D2E] placeholder-[#0F3D2E]/40 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-full shadow-xs" 
          />
        </div>

        {/* Mobile Orders List */}
        <div className="space-y-6">
          {(bookingSubTab === 'recent' ? filteredRecentOrders : paginatedHistoryOrders).map((o) => {
            const norm = normalizeStatus(o.status);
            const activeAccordion = expandedSection[o.id] || null;

            return (
              <div key={o.id} className="bg-white rounded-3xl border border-[#E8D7A5] shadow-[0_8px_30px_rgba(15,61,46,0.03)] p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#D4AF37]" />

                {/* Top Row Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FCF8F0] border border-[#E8D7A5]/40 rounded-lg text-[8px] text-[#D4AF37] font-mono font-extrabold uppercase tracking-wider shrink-0">
                    <Sparkle size={8} className="animate-pulse" />
                    REF: #{o.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className={cn("px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border font-mono", getStatusColor(o.status))}>
                    {getStatusLabel(o.status)}
                  </span>
                </div>

                {/* Caterer Name */}
                <h3 className="text-xl font-serif font-black text-[#0F3D2E] tracking-tight mb-3 text-left">
                  {user.roles.includes('partner') && o.customerName ? o.customerName + ' (Client)' : o.catererName}
                </h3>

                {/* Details Row */}
                <div className="space-y-2 mb-4 text-xs text-[#0F3D2E]/90 font-sans border-b border-[#E8D7A5]/30 pb-3 text-left">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    <span className="font-bold">{o.eventDate || 'TBD'}</span>
                    {o.eventDate && (
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase font-mono border", isEventPassed(o.eventDate) ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-amber-50 border-amber-200 text-amber-700")}>
                        {isEventPassed(o.eventDate) ? "Concluded" : "Upcoming"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" />
                    <span className="font-bold">{o.guests} Guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="font-bold truncate">{o.venue || 'Venue TBD'}</span>
                    {(o.latitude && o.longitude) ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D4AF37] hover:underline font-extrabold text-[10px] shrink-0 ml-1"
                      >
                        🗺️ View on Map
                      </a>
                    ) : (o.venue || o.address) ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.venue || o.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D4AF37] hover:underline font-extrabold text-[10px] shrink-0 ml-1"
                      >
                        🗺️ View on Map
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Category & Package Details */}
                <div className="text-[11px] text-slate-500 mb-4 font-sans bg-[#FCF8F0]/30 p-2 rounded-xl border border-[#E8D7A5]/20 flex flex-wrap justify-between gap-1 text-left">
                  <div>
                    <span>Category:</span> <span className="text-[#0F3D2E] font-bold">{o.eventType}</span>
                  </div>
                  <div>
                    <span>Platter:</span> <span className="text-[#D4AF37] font-bold">{o.packageDetails?.packageName || 'Customized'}</span>
                  </div>
                </div>

                {/* Inline Editing Form */}
                {norm === 'changes_requested' && (
                  <div className="mt-4 pt-3 border-t border-slate-105 text-left mb-4">
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                      <div className="flex gap-3 items-start mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-950 flex items-center justify-center font-bold shrink-0">?</div>
                        <div>
                          <h4 className="font-extrabold text-amber-950 text-sm">Action Required: Caterer Suggested Revisions</h4>
                          <p className="text-xs text-amber-800 mt-[2px]">"{o.changesRequestedMemo || 'The partner requested updates to the event layout or schedule to process the quote.'}"</p>
                        </div>
                      </div>

                      {editingOrderId === o.id ? (
                        <div className="bg-white border border-amber-200 p-4 rounded-xl space-y-4 mt-3">
                          <p className="text-xs font-bold text-amber-900 border-b border-slate-150 pb-2">
                            ✏️ Edit Booking Details
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Date</label>
                              <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none"
                                value={editForm.eventDate} 
                                onChange={(e) => setEditForm({...editForm, eventDate: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Type</label>
                              <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-850 focus:border-amber-400 outline-none"
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
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Venue Address</label>
                                <button
                                  type="button"
                                  onClick={() => setIsMapOpen(true)}
                                  className="text-[10px] font-bold text-[#DEAA38] hover:text-[#b08427] transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>🗺️ Select Location</span>
                                </button>
                              </div>
                              <AddressAutocomplete
                                useTextarea={true}
                                rows={2} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none"
                                value={editForm.venue} 
                                onChange={(val) => setEditForm({...editForm, venue: val})}
                                onSelect={(data) => {
                                  setEditForm({
                                    ...editForm,
                                    venue: data.address,
                                    latitude: data.latitude,
                                    longitude: data.longitude
                                  });
                                }}
                                theme="gold"
                                leftIcon={<MapPin className="text-[#DEAA38] w-4 h-4 hover:text-[#b08427] transition-colors" />}
                                onIconClick={() => setIsMapOpen(true)}
                              />
                              <MapPickerModal
                                isOpen={isMapOpen}
                                onClose={() => setIsMapOpen(false)}
                                initialLat={editForm.latitude}
                                initialLng={editForm.longitude}
                                initialAddress={editForm.venue}
                                onSave={(data) => {
                                  setEditForm({
                                    ...editForm,
                                    venue: data.address,
                                    latitude: data.latitude,
                                    longitude: data.longitude
                                  });
                                }}
                                title="Select Event Location"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest count</label>
                              <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:border-amber-400 outline-none"
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
                        <button 
                          type="button"
                          onClick={() => startEditing(o)}
                          className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all border border-amber-600 cursor-pointer"
                        >
                          ✏️ Edit &amp; Resubmit Details
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsible Accordions (1 to 4) */}
                <div className="space-y-2 mb-4">
                  {/* Accordion 1: Platter Checklist & Client Details */}
                  <div className="border border-[#E8D7A5]/40 rounded-2xl overflow-hidden bg-white">
                    <button 
                      onClick={() => toggleAccordion(o.id, 'platter')}
                      className="w-full flex justify-between items-center bg-[#FCF8F0]/20 px-4 py-3 text-left text-xs font-serif font-bold text-[#0F3D2E] hover:bg-[#FCF8F0]/40 transition-colors cursor-pointer"
                    >
                      <span>Platter Checklist &amp; Client Details</span>
                      <ChevronRight size={14} className={cn("text-[#D4AF37] transition-transform duration-200", activeAccordion === 'platter' && "rotate-90")} />
                    </button>
                    {activeAccordion === 'platter' && (
                      <div className="p-4 bg-[#FCF8F0]/10 border-t border-[#E8D7A5]/20 space-y-3 text-xs text-left">
                        <div>
                          <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#D4AF37] mb-1 font-mono">Contact Details</p>
                          <p className="font-medium text-slate-700">Lead: {o.customerName || 'Registered Member'}</p>
                          <p className="font-medium text-slate-700">Phone: {o.phone || o.customerPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#D4AF37] mb-1 font-mono">Menu Items</p>
                          <ul className="space-y-1 font-medium text-slate-700 pl-1">
                            {o.selectedItems?.length > 0 ? o.selectedItems.map((item: string, i: number) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-[#D4AF37]">•</span>
                                <span>{item}</span>
                              </li>
                            )) : <li className="text-slate-450 italic">No selections</li>}
                          </ul>
                        </div>
                        {o.specialNotes && (
                          <div>
                            <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#D4AF37] mb-0.5 font-mono">Special Notes</p>
                            <p className="font-medium italic text-slate-600">"{o.specialNotes}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Pricing Breakdown */}
                  <div className="border border-[#E8D7A5]/40 rounded-2xl overflow-hidden bg-white">
                    <button 
                      onClick={() => toggleAccordion(o.id, 'pricing')}
                      className="w-full flex justify-between items-center bg-[#FCF8F0]/20 px-4 py-3 text-left text-xs font-serif font-bold text-[#0F3D2E] hover:bg-[#FCF8F0]/40 transition-colors cursor-pointer"
                    >
                      <span>Pricing Breakdown</span>
                      <ChevronRight size={14} className={cn("text-[#D4AF37] transition-transform duration-200", activeAccordion === 'pricing' && "rotate-90")} />
                    </button>
                    {activeAccordion === 'pricing' && (
                      <div className="p-4 bg-[#FCF8F0]/10 border-t border-[#E8D7A5]/20 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Quote (₹{o.pricePerPlate} × {o.guests})</span>
                          <span className="font-bold text-[#0F3D2E]">₹{((o.pricePerPlate || 0) * (o.guests || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Platform Fee</span>
                          <span className="font-bold text-[#0F3D2E]">₹{o.platformFee || 0}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#E8D7A5]/30 pt-2 mt-2">
                          <span className="font-bold text-[#0F3D2E]">Grand Total</span>
                          <span className="font-black text-sm text-[#0F3D2E]">₹{o.totalEstimate?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion 3: Timeline */}
                  <div className="border border-[#E8D7A5]/40 rounded-2xl overflow-hidden bg-white">
                    <button 
                      onClick={() => toggleAccordion(o.id, 'timeline')}
                      className="w-full flex justify-between items-center bg-[#FCF8F0]/20 px-4 py-3 text-left text-xs font-serif font-bold text-[#0F3D2E] hover:bg-[#FCF8F0]/40 transition-colors cursor-pointer"
                    >
                      <span>Timeline</span>
                      <ChevronRight size={14} className={cn("text-[#D4AF37] transition-transform duration-200", activeAccordion === 'timeline' && "rotate-90")} />
                    </button>
                    {activeAccordion === 'timeline' && (
                      <div className="p-4 bg-[#FCF8F0]/10 border-t border-[#E8D7A5]/20 space-y-3 text-xs">
                        <div className="space-y-4 pt-1">
                          {[
                            { label: 'Submitted', desc: 'Booking submitted successfully' },
                            { label: 'Caterer Review', desc: 'Caterer review of reservation details' },
                            { label: 'Approved', desc: 'Event details approved & locked' },
                            { label: 'Completed', desc: 'Event concluded successfully' }
                          ].map((step, idx) => {
                            let currentTrackingIdx = 0;
                            const statusStr = String(o.status).toLowerCase();
                            if (statusStr.includes('review') || statusStr === 'pending caterer review') {
                              currentTrackingIdx = 1;
                            } else if (norm === 'approved') {
                              currentTrackingIdx = 2;
                            } else if (norm === 'completed') {
                              currentTrackingIdx = 3;
                            }

                            const isDone = idx <= currentTrackingIdx;
                            const isCurrent = idx === currentTrackingIdx;

                            return (
                              <div key={idx} className="flex gap-3 relative">
                                {idx < 3 && (
                                  <div className={cn("absolute left-2.5 top-5 bottom-0 w-[2px] bg-slate-100", isDone && "bg-[#0F3D2E]")} style={{ height: 'calc(100% + 16px)' }} />
                                )}
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center border text-[8px] font-bold z-10 shrink-0",
                                  isCurrent ? "bg-[#0F3D2E] text-white border-[#D4AF37]" : isDone ? "bg-[#0F3D2E] text-white border-[#0F3D2E]" : "bg-white text-slate-300 border-slate-200"
                                )}>
                                  {isDone ? '✓' : idx + 1}
                                </div>
                                <div className="text-left">
                                  <p className={cn("font-bold text-xs", isCurrent ? "text-[#0F3D2E]" : isDone ? "text-[#0F3D2E]/80" : "text-slate-400")}>{step.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium font-sans">{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion 4: Venue Details */}
                  <div className="border border-[#E8D7A5]/40 rounded-2xl overflow-hidden bg-white">
                    <button 
                      onClick={() => toggleAccordion(o.id, 'venue')}
                      className="w-full flex justify-between items-center bg-[#FCF8F0]/20 px-4 py-3 text-left text-xs font-serif font-bold text-[#0F3D2E] hover:bg-[#FCF8F0]/40 transition-colors cursor-pointer"
                    >
                      <span>Venue Details</span>
                      <ChevronRight size={14} className={cn("text-[#D4AF37] transition-transform duration-200", activeAccordion === 'venue' && "rotate-90")} />
                    </button>
                    {activeAccordion === 'venue' && (
                      <div className="p-4 bg-[#FCF8F0]/10 border-t border-[#E8D7A5]/20 space-y-2 text-xs">
                        <p className="font-bold text-[#0F3D2E] flex items-start gap-1.5 text-left">
                          <MapPin size={12} className="text-[#D4AF37] shrink-0 mt-0.5" />
                          <span>{o.venue || 'Address TBD'}</span>
                        </p>
                        {(o.latitude && o.longitude) ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] hover:bg-[#F6EAD4] rounded-xl text-[10px] font-bold transition-all mt-1"
                          >
                            🗺️ Open Google Maps
                          </a>
                        ) : (o.venue || o.address) ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.venue || o.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] hover:bg-[#F6EAD4] rounded-xl text-[10px] font-bold transition-all mt-1"
                          >
                            🗺️ Open Google Maps
                          </a>
                        ) : <p className="text-slate-400 italic text-left">No coordinates or map link available</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Total Row */}
                <div className="flex justify-between items-center border-t border-[#E8D7A5]/30 pt-3.5 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] font-mono">Grand Total</span>
                  <span className="text-2xl font-serif font-black text-[#0F3D2E]">₹{o.totalEstimate?.toLocaleString()}</span>
                </div>

                {/* Admin / Partner Status Selector Dropdown */}
                {(user.roles.includes('admin') || user.roles.includes('partner')) && (
                  <div className="mb-4 space-y-1 text-left">
                    <label className="block text-[9px] font-extrabold text-[#D4AF37] uppercase tracking-widest font-mono">Manage Status</label>
                    <div className="relative w-full text-left">
                      <select 
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="w-full bg-white border border-[#E8D7A5] rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-[#0F3D2E] outline-none hover:border-[#D4AF37] appearance-none"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Pending Caterer Review">Pending Caterer Review</option>
                        <option value="Modified">Modified</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                        <ChevronRight size={12} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons (Stacked Vertically on Mobile) */}
                <div className="space-y-2 mt-4">
                  {/* Track Order / View History Log */}
                  <button 
                    onClick={() => setSelectedQuickViewOrder(o)}
                    className="w-full bg-white hover:bg-[#FCF8F0] text-[#D4AF37] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#E8D7A5] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} /> Track Order &amp; Logs
                  </button>

                  {/* Download Estimate */}
                  <button 
                    onClick={() => {
                      toast("Estimate summary downloaded successfully!", "success");
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-[#0F3D2E] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#0F3D2E]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} /> Download Estimate
                  </button>

                  {/* View Invoice */}
                  <button 
                    onClick={() => {
                      toast(`Invoice details for REF #${o.id.substring(0, 8).toUpperCase()} displayed in breakdown.`, "success");
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={14} /> View Invoice
                  </button>

                  {/* Contact Caterer */}
                  <a 
                    href="mailto:contact@caternest.com"
                    className="w-full bg-[#0F3D2E] hover:bg-[#0c3024] text-[#FCFBF7] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#0F3D2E] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone size={14} /> Contact Caterer
                  </a>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {(bookingSubTab === 'recent' ? filteredRecentOrders : paginatedHistoryOrders).length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#E8D7A5]/60 shadow-xs max-w-md mx-auto">
              <div className="w-12 h-12 bg-[#FCF8F0] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-3 text-lg">✦</div>
              <h3 className="text-base font-serif font-bold text-[#0F3D2E] mb-1">No Bookings Found</h3>
              <p className="text-slate-500 text-xs mb-4">
                There are no items currently matching your filter or search selection.
              </p>
            </div>
          )}
        </div>

        {/* History Pagination for Mobile */}
        {bookingSubTab === 'history' && totalHistoryPages > 1 && (
          <div className="flex justify-between items-center bg-white border border-[#E8D7A5]/50 p-3 rounded-2xl shadow-xs w-full mt-6">
            <button 
              disabled={historyPage === 1}
              onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-2 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] disabled:opacity-40 rounded-xl text-[11px] font-bold cursor-pointer"
            >
              Prev
            </button>
            <span className="text-[11px] font-bold text-[#0F3D2E] font-mono">
              {historyPage} / {totalHistoryPages}
            </span>
            <button 
              disabled={historyPage === totalHistoryPages}
              onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
              className="px-3 py-2 bg-[#FCF8F0] border border-[#E8D7A5]/40 text-[#D4AF37] disabled:opacity-40 rounded-xl text-[11px] font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  </>
  );
}
