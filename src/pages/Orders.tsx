import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Users, MapPin, Search, Check, Clock, ArrowRight, ChevronRight, 
  Filter, X, BookOpen, User, Phone, ChefHat, RotateCcw, MoreVertical, 
  ExternalLink, Bell, AlertCircle, Sparkle, Download, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../components/Toast';
import { getSupabase, saveWithSupabaseSync } from '../lib/supabase';
import { 
  normalizeStatus, 
  getStatusLabel, 
  performOrderStatusUpdate, 
  storeNotification 
} from '../lib/orderUtils';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { MapPickerModal } from '../components/MapPickerModal';
import heroBg from '../assets/images/Hero-bg.png';

// High-fidelity contextual fallback thumbnails matching the reference image cards
const EVENT_THUMBNAILS: Record<string, string> = {
  wedding: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600",
  reception: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600",
  birthday: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600",
  family: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=600",
  lunch: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=600",
  dinner: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600",
  engagement: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
  corporate: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600",
  buffet: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600",
};

function getBookingThumbnail(order: any): string {
  if (order.image) return order.image;
  if (order.coverImage) return order.coverImage;
  if (order.catererImage) return order.catererImage;
  if (order.packageDetails?.image) return order.packageDetails.image;

  const typeStr = `${order.eventType || ""} ${order.eventName || ""}`.toLowerCase();
  for (const [key, url] of Object.entries(EVENT_THUMBNAILS)) {
    if (typeStr.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600";
}

// Helper to check if event date has passed
// Helper to format a single date cleanly with zero timezone distortion
function formatSingleDate(dateStr: string): { formatted: string; weekday: string } {
  if (!dateStr || dateStr.trim() === "" || dateStr === "2026" || dateStr === "2026-01-01") {
    return { formatted: "Date Scheduled", weekday: "" };
  }
  const clean = dateStr.trim();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // 1. Check YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return {
      formatted: `${day.toString().padStart(2, '0')} ${months[month]} ${year}`,
      weekday: `(${days[d.getDay()]})`
    };
  }

  // 2. Check DD Mon YYYY (e.g. 25 Oct 2026)
  const dmyMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const mStr = dmyMatch[2].toLowerCase().substring(0, 3);
    const mIdx = months.map(m => m.toLowerCase()).indexOf(mStr);
    const year = parseInt(dmyMatch[3], 10);
    if (mIdx !== -1) {
      const d = new Date(year, mIdx, day);
      return {
        formatted: `${day.toString().padStart(2, '0')} ${months[mIdx]} ${year}`,
        weekday: `(${days[d.getDay()]})`
      };
    }
  }

  // 3. Check DD Mon (without year)
  const dmMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,9})/);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const mStr = dmMatch[2].toLowerCase().substring(0, 3);
    const mIdx = months.map(m => m.toLowerCase()).indexOf(mStr);
    if (mIdx !== -1) {
      const year = new Date().getFullYear();
      const d = new Date(year, mIdx, day);
      return {
        formatted: `${day.toString().padStart(2, '0')} ${months[mIdx]} ${year}`,
        weekday: `(${days[d.getDay()]})`
      };
    }
  }

  return { formatted: clean, weekday: "" };
}

// Helper to check if event date has passed
function isEventPassed(eventDateStr: string): boolean {
  if (!eventDateStr) return false;
  try {
    const parts = eventDateStr.split(',').map(p => p.trim()).filter(Boolean);
    const targetDate = parts[parts.length - 1]; // check latest date if multiple
    const parsed = formatSingleDate(targetDate);
    if (!parsed || !parsed.formatted) return false;

    const m = parsed.formatted.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (!m) return false;

    const day = parseInt(m[1], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months.indexOf(m[2]);
    const year = parseInt(m[3], 10);
    if (month === -1) return false;

    const evDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    evDate.setHours(0, 0, 0, 0);

    return evDate.getTime() < today.getTime();
  } catch {
    return false;
  }
}

// Date formatter matching reference card: "25 Oct 2026", "(Sunday)"
function formatEventDate(dateStr: string): { formatted: string; weekday: string } {
  if (!dateStr || !dateStr.trim() || dateStr === "2026" || dateStr === "2026-01-01") {
    return { formatted: "Date Scheduled", weekday: "" };
  }
  
  if (dateStr.includes(",")) {
    const dates = dateStr.split(",").map(d => d.trim()).filter(Boolean);
    if (dates.length > 1) {
      const first = formatSingleDate(dates[0]);
      return {
        formatted: `${first.formatted} (+${dates.length - 1} more)`,
        weekday: first.weekday
      };
    }
  }

  return formatSingleDate(dateStr);
}

function cleanLocation(loc: string): string {
  if (!loc || !loc.trim()) return "Hyderabad, Telangana";
  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const hyd = parts.find(p => p.toLowerCase().includes("hyderabad"));
    const state = parts.find(p => p.toLowerCase().includes("telangana") || p.toLowerCase().includes("ap"));
    if (hyd && state) return `${hyd}, ${state}`;
    return parts.slice(-2).join(", ");
  }
  return loc;
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  
  // Navigation & Filtering
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEventType, setFilterEventType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'date_asc' | 'amount_desc' | 'amount_asc'>('newest');

  // Quick View Modal
  const [selectedQuickViewOrder, setSelectedQuickViewOrder] = useState<any | null>(null);

  // Dropdown menu tracking
  const [openMenuOrderId, setOpenMenuOrderId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Repeat Booking Modal
  const [repeatOrderSource, setRepeatOrderSource] = useState<any | null>(null);
  const [repeatForm, setRepeatForm] = useState({
    eventDate: '',
    guests: 0,
    specialNotes: '',
    venue: ''
  });

  // Edit Booking Modal (Changes requested)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    eventDate: '',
    eventType: '',
    venue: '',
    guests: 0,
    specialNotes: '',
    latitude: undefined,
    longitude: undefined
  });

  // Customer notifications
  const [customerNotifications, setCustomerNotifications] = useState<any[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Close 3-dot menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuOrderId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Auto completion check
  const autoTriggerCompletionIfPassed = async (ordersList: any[]): Promise<any[]> => {
    const supabase = getSupabase();
    let updatedLocalCache = false;

    const nextList = ordersList.map(o => {
      const norm = normalizeStatus(o.status);
      const datePassed = isEventPassed(o.eventDate);

      if ((norm === 'approved' || String(o.status).toLowerCase() === 'approved') && datePassed) {
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

        try {
          storeNotification(
            o.id,
            "Event Completed 🎉",
            `Your event on ${o.eventDate || 'N/A'} with ${o.catererName || 'caterer'} has successfully concluded. We hope you loved the platter service!`,
            "customer",
            o.catererId
          );
        } catch (err) {
          console.error(err);
        }

        if (supabase) {
          supabase.from('orders').update({
            status: 'completed',
            statusHistory: nextHistory,
            completedAt: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', o.id).then();
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
          if (user.roles?.includes('admin')) {
              // Admin sees all
          } else if (user.roles?.includes('partner')) {
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
              filtered = combinedOrders.filter((o: any) => 
                o.userId === user.id || 
                (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
                (o.customerName && o.customerName === user.name) ||
                (o.phone && o.phone === user.phone) ||
                (o.customerPhone && o.customerPhone === user.phone) ||
                o.customerName === 'Guest User'
              );
          }

          const completedEvaluated = await autoTriggerCompletionIfPassed(filtered);
          setOrders(completedEvaluated);
          localStorage.setItem('orders', JSON.stringify(combinedOrders));
          return;
        }
      } catch (err) {
        console.error("Error reading live orders in Orders page:", err);
      }
    }

    // Local fallback
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
      let allOrders = JSON.parse(rawOrders) || [];
      if (user) {
        if (user.roles?.includes('admin')) {
            // Admin sees all
        } else if (user.roles?.includes('partner')) {
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
          () => {
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
        user?.roles?.includes('partner') ? 'partner' : user?.roles?.includes('admin') ? 'admin' : 'customer'
      );

      const ord = orders.find(o => o.id === id);
      const catererId = ord?.catererId;
      const catererName = ord?.catererName || 'Caterer';

      if (user?.roles?.includes('partner')) {
        if (norm === 'completed') {
          storeNotification(id, "Order Completed! 🏆", `Your catering order with ${catererName} has been marked as Completed.`, "customer", catererId);
        }
      } else if (user?.roles?.includes('admin')) {
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
      console.error("Failed to update status:", err);
      toast("Error updating order status", "error");
    }
  };

  // Rebook booking handler
  const handleRepeatBookingInitiate = (order: any) => {
    setRepeatOrderSource(order);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setRepeatForm({
      eventDate: tomorrowStr,
      guests: Number(order.guests ?? order.guestCount ?? 50),
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
        status: 'Pending Approval',
        statusHistory: [
          {
            note: "New repetitive request initiated from booking history - awaiting caterer approval",
            actor: "customer",
            action: "pending",
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
        `Your booking request for ${newOrder.catererName} on ${newOrder.eventDate} has been submitted and is waiting for caterer approval.`,
        "customer",
        newOrder.catererId
      );

      toast("Your booking request has been submitted and is waiting for caterer approval.", "success");
      setRepeatOrderSource(null);
      await fetchOrders();
      setActiveFilterTab('pending');
    } catch (err) {
      console.error(err);
      toast("Failed to repeat booking", "error");
    }
  };

  // Start Editing changes_requested order
  const startEditing = (o: any) => {
    setEditingOrderId(o.id);
    setEditForm({
      eventDate: o.eventDate || '',
      eventType: o.eventType || '',
      venue: o.venue || o.address || '',
      guests: Number(o.guests ?? o.guestCount ?? 0),
      specialNotes: o.specialNotes || o.notes || '',
      latitude: o.latitude,
      longitude: o.longitude
    });
  };

  const handleResubmitOrder = async (orderId: string, catererId: string) => {
    try {
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
          notes: editForm.specialNotes,
          latitude: editForm.latitude,
          longitude: editForm.longitude
        },
        user?.email || 'customer@caternest.com',
        'customer'
      );

      await storeNotification(orderId, "Order Resubmitted", "Order resubmitted successfully", "customer");
      await storeNotification(orderId, "Order Resubmitted", "Customer has resubmitted order", "caterer", catererId);

      toast("Order resubmitted successfully!", "success");
      setEditingOrderId(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast("Failed to resubmit order", "error");
    }
  };

  // Status Counts for Tabs matching the reference image
  // Status Counts for Tabs reflecting the actual booking lifecycle
  const pendingApprovalCount = useMemo(() => {
    return orders.filter(o => {
      const norm = normalizeStatus(o.status);
      return norm === 'pending' || norm === 'changes_requested' || norm === 'updated_by_customer' || norm === 'quotation_updated';
    }).length;
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const norm = normalizeStatus(o.status);
      return norm === 'approved';
    }).length;
  }, [orders]);

  const completedEventsCount = useMemo(() => {
    return orders.filter(o => {
      const norm = normalizeStatus(o.status);
      return norm === 'completed';
    }).length;
  }, [orders]);

  const rejectedOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const norm = normalizeStatus(o.status);
      return norm === 'rejected';
    }).length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const norm = normalizeStatus(o.status);
      return norm === 'cancelled';
    }).length;
  }, [orders]);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const norm = normalizeStatus(o.status);

      // Tab filter strictly following lifecycle rules
      if (activeFilterTab === 'pending') {
        const isPending = norm === 'pending' || norm === 'changes_requested' || norm === 'updated_by_customer' || norm === 'quotation_updated';
        if (!isPending) return false;
      }
      if (activeFilterTab === 'active') {
        if (norm !== 'approved') return false;
      }
      if (activeFilterTab === 'completed') {
        if (norm !== 'completed') return false;
      }
      if (activeFilterTab === 'rejected') {
        if (norm !== 'rejected') return false;
      }
      if (activeFilterTab === 'cancelled') {
        if (norm !== 'cancelled') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          (o.id && o.id.toLowerCase().includes(q)) ||
          (o.eventType && o.eventType.toLowerCase().includes(q)) ||
          (o.eventName && o.eventName.toLowerCase().includes(q)) ||
          (o.catererName && o.catererName.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.venue && o.venue.toLowerCase().includes(q)) ||
          (o.address && o.address.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Date Range Filters
      if (filterStartDate && o.eventDate && new Date(o.eventDate) < new Date(filterStartDate)) return false;
      if (filterEndDate && o.eventDate && new Date(o.eventDate) > new Date(filterEndDate)) return false;

      // Event Type Filter
      if (filterEventType !== 'all') {
        const typeStr = (o.eventType || o.eventName || '').toLowerCase();
        if (!typeStr.includes(filterEventType.toLowerCase())) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime();
      }
      if (sortBy === 'amount_desc') {
        return (Number(b.totalEstimate) || 0) - (Number(a.totalEstimate) || 0);
      }
      if (sortBy === 'amount_asc') {
        return (Number(a.totalEstimate) || 0) - (Number(b.totalEstimate) || 0);
      }
      // default: newest booking created
      return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
    });

    return result;
  }, [orders, activeFilterTab, searchQuery, filterStartDate, filterEndDate, filterEventType, sortBy]);

  const unreadCustCount = customerNotifications.filter(n => !n.read).length;

  // Helper for badge display, subtext and permissions strictly based on lifecycle rules
  const getCardStatus = (o: any) => {
    const norm = normalizeStatus(o.status);

    if (norm === 'completed') {
      const dateStr = o.completedAt || o.updated_at || o.eventDate;
      const formatted = dateStr ? formatEventDate(dateStr).formatted : '';
      return {
        badgeText: 'Completed',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        icon: <Check size={14} className="stroke-[3]" />,
        subtext: formatted && !formatted.includes("Scheduled") ? `Completed on ${formatted}` : 'Booking Completed',
        canRebook: false
      };
    }

    if (norm === 'rejected') {
      return {
        badgeText: 'Rejected',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80',
        icon: <X size={14} className="stroke-[3]" />,
        subtext: o.rejectionReason || o.notes || 'Booking Declined',
        canRebook: false
      };
    }

    if (norm === 'cancelled') {
      return {
        badgeText: 'Cancelled',
        badgeColor: 'bg-stone-100 text-stone-600 border-stone-200',
        icon: <X size={14} className="stroke-[3]" />,
        subtext: 'Booking Cancelled',
        canRebook: false
      };
    }

    if (norm === 'approved') {
      return {
        badgeText: 'Caterer Approved',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        icon: <Check size={14} className="stroke-[3]" />,
        subtext: 'Active - Scheduled',
        canRebook: false
      };
    }

    if (norm === 'changes_requested') {
      return {
        badgeText: 'Changes Requested',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
        icon: <Clock size={14} />,
        subtext: 'Action Needed - Edit Booking',
        canRebook: false
      };
    }

    // Default: Pending / Submitted / Under Review
    return {
      badgeText: 'Waiting for Approval',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: <Clock size={14} />,
      subtext: 'Waiting for caterer approval',
      canRebook: false
    };
  };

  const getOrderTotalAmount = (order: any): number => {
    if (order.totalEstimate && Number(order.totalEstimate) > 0) return Number(order.totalEstimate);
    if (order.totalAmount && Number(order.totalAmount) > 0) return Number(order.totalAmount);
    if (order.amount && Number(order.amount) > 0) return Number(order.amount);
    const g = Number(order.guests ?? order.guestCount ?? 0);
    const p = Number(order.pricePerPlate ?? (order.packageDetails?.startingPrice || order.packageDetails?.price || 0));
    const fee = Number(order.platformFee ?? 0);
    if (g > 0 && p > 0) return (g * p) + fee;
    return 0;
  };

  const getOrderGuests = (order: any): number => {
    return Number(order.guests ?? order.guestCount ?? 0) || 50;
  };

  const getOrderPricePerPlate = (order: any): number => {
    const p = Number(order.pricePerPlate ?? (order.packageDetails?.startingPrice || order.packageDetails?.price || 0));
    if (p > 0) return p;
    const tot = getOrderTotalAmount(order);
    const g = getOrderGuests(order);
    return tot > 0 && g > 0 ? Math.round(tot / g) : 350;
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] pt-24 sm:pt-28 pb-24 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* ==================================================== */}
        {/* HERO SECTION: Heading + Subtitle + Need New Booking CTA */}
        {/* ==================================================== */}
        <div className="relative rounded-3xl overflow-hidden bg-[#FCFBF8] border border-stone-200/70 p-6 sm:p-8 lg:p-10 shadow-xs">
          {/* Subtle background food illustration in the top-right corner */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-20 sm:opacity-25 overflow-hidden flex justify-end items-center">
            <img 
              src={heroBg} 
              alt="Catering Feast" 
              className="h-full w-auto object-cover object-left mask-radial"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 60%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Titles */}
            <div className="space-y-1.5 max-w-xl">
              <h1 
                className="font-serif font-bold text-[32px] sm:text-[38px] md:text-[44px] text-stone-900 tracking-tight leading-tight"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                My Bookings
              </h1>
              <p className="font-sans text-[14px] sm:text-[16px] text-stone-600 font-medium">
                Manage all your catering bookings in one place
              </p>
            </div>

            {/* Right: "Need a new booking?" CTA Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4 sm:gap-6 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100/80">
                  <Calendar size={22} className="text-[#064E3B]" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-[15px] sm:text-[16px] text-stone-900 leading-snug">
                    Need a new booking?
                  </h3>
                  <p className="font-sans text-[13px] sm:text-[14px] text-stone-500 mt-0.5">
                    Find the perfect caterer for your next event
                  </p>
                </div>
              </div>

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white rounded-xl font-sans font-semibold text-[14px] transition-all duration-200 shadow-sm hover:shadow shrink-0 cursor-pointer"
              >
                <span>Explore Caterers</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* FILTER CONTROLS: Category Tabs + Search & Filters */}
        {/* ==================================================== */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-1">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'all'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              All Bookings ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('pending')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'pending'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              Waiting for Approval ({pendingApprovalCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('active')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'active'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              Active Orders ({activeOrdersCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('completed')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'completed'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              Completed ({completedEventsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('rejected')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'rejected'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              Rejected ({rejectedOrdersCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('cancelled')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl font-sans text-[14px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeFilterTab === 'cancelled'
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 hover:border-stone-300"
              )}
            >
              Cancelled ({cancelledOrdersCount})
            </button>
          </div>

          {/* Search Bar + Filters + Notifications Button */}
          <div className="flex items-center gap-2.5 flex-1 xl:max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search 
                size={16} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" 
              />
              <input
                type="text"
                placeholder="Search by event name, caterer name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200/90 rounded-xl text-[14px] text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#D9A62E] focus:ring-1 focus:ring-[#D9A62E]/50 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters Toggle Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFiltersModal(!showFiltersModal)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-[14px] font-semibold border transition-all cursor-pointer shadow-2xs shrink-0",
                  showFiltersModal || filterStartDate || filterEndDate || filterEventType !== 'all' || sortBy !== 'newest'
                    ? "bg-[#064E3B] text-white border-[#064E3B]"
                    : "bg-white hover:bg-stone-50 border-stone-200/90 text-stone-700"
                )}
              >
                <Filter size={16} />
                <span>Filters</span>
                {(filterStartDate || filterEndDate || filterEventType !== 'all' || sortBy !== 'newest') && (
                  <span className="w-2 h-2 rounded-full bg-[#D9A62E]" />
                )}
              </button>

              {/* Filters Dropdown Card */}
              {showFiltersModal && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-stone-200 p-5 shadow-xl z-30 space-y-4 animate-fade-in-rapid">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-[14px] text-stone-900">Filter Bookings</h4>
                    <button 
                      type="button"
                      onClick={() => setShowFiltersModal(false)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                      Event Type
                    </label>
                    <select
                      value={filterEventType}
                      onChange={(e) => setFilterEventType(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-medium text-stone-800 outline-none focus:border-[#D9A62E]"
                    >
                      <option value="all">All Events</option>
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday</option>
                      <option value="family">Family Function</option>
                      <option value="engagement">Engagement</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-medium text-stone-800 outline-none focus:border-[#D9A62E]"
                    >
                      <option value="newest">Recently Booked</option>
                      <option value="date_asc">Event Date (Soonest first)</option>
                      <option value="amount_desc">Amount (High to Low)</option>
                      <option value="amount_asc">Amount (Low to High)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setFilterEventType('all');
                        setSortBy('newest');
                      }}
                      className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFiltersModal(false)}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-[#064E3B] hover:bg-[#043d2e] rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Inbox Quick Bell */}
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="relative p-2.5 bg-white border border-stone-200/90 hover:border-stone-300 rounded-xl text-stone-700 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Notifications & Updates"
            >
              <Bell size={18} />
              {unreadCustCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCustCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BOOKINGS CARDS LIST */}
        {/* ==================================================== */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FCFBF8] border border-[#D9A62E]/30 text-[#D9A62E] flex items-center justify-center mx-auto text-2xl shadow-xs">
              <Calendar size={28} />
            </div>
            <h3 
              className="font-serif font-bold text-2xl text-stone-900"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              No Bookings Found
            </h3>
            <p className="font-sans text-sm text-stone-500 max-w-md mx-auto">
              {searchQuery 
                ? `No catering orders match "${searchQuery}". Try adjusting your search query or filters.`
                : "You don't have any catering bookings in this category yet."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {(searchQuery || filterStartDate || filterEndDate || filterEventType !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterEventType('all');
                    setActiveFilterTab('all');
                  }}
                  className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 font-semibold text-sm rounded-xl hover:bg-stone-50 cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
              <Link
                to="/explore"
                className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Find a Caterer</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {filteredOrders.map((o) => {
              const dateInfo = formatEventDate(o.eventDate);
              const cardStatus = getCardStatus(o);
              const thumbUrl = getBookingThumbnail(o);
              const isMenuOpen = openMenuOrderId === o.id;

              return (
                <div
                  key={o.id}
                  className="bg-[#FCFBF8] rounded-2xl border border-[#D9A62E]/30 p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(217,166,46,0.06)] hover:shadow-[0_6px_20px_rgba(217,166,46,0.12)] hover:border-[#D9A62E]/60 transition-all duration-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 relative"
                >
                  {/* Left Column: Image Thumbnail + Event Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1 lg:max-w-[420px] xl:max-w-[460px]">
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-[150px] md:w-[170px] h-[105px] sm:h-[110px] rounded-xl overflow-hidden shrink-0 border border-stone-200/60 bg-stone-100 shadow-2xs">
                      <img
                        src={thumbUrl}
                        alt={o.eventType || "Catering Event"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Details: Event Name, Caterer, Location */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="text-[14px] sm:text-[15px] text-stone-500 font-sans leading-tight">
                        <span>Event Name: </span>
                        <span 
                          className="font-serif font-semibold text-[17px] sm:text-[20px] text-stone-900"
                          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                        >
                          {o.eventType || o.eventName || "Wedding Dinner"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[14px] sm:text-[15px] text-stone-600 font-sans truncate">
                        <ChefHat size={16} className="text-[#D9A62E] shrink-0" />
                        <span className="truncate">
                          Caterer: <span className="font-medium text-stone-900">{o.catererName || "The Golden Spoon"}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[14px] text-stone-600 font-sans truncate">
                        <MapPin size={16} className="text-[#D9A62E] shrink-0" />
                        <span className="truncate">
                          {cleanLocation(o.venue || o.address || "Hyderabad, Telangana")}
                        </span>
                      </div>

                      {/* Optional Sub-status pill */}
                      {cardStatus.badgeText === 'Caterer Approved' && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active - In Progress
                          </span>
                        </div>
                      )}
                      {cardStatus.badgeText === 'Waiting for Approval' && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                            Waiting for Caterer Approval
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Event Date */}
                  <div className="flex flex-col min-w-[120px] xl:min-w-[140px] shrink-0">
                    <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-stone-500 font-medium font-sans">
                      <Calendar size={18} className="text-[#D9A62E] shrink-0" />
                      <span>Event Date</span>
                    </div>
                    <p className="font-bold text-[14px] sm:text-[16px] text-stone-900 mt-1 font-sans">
                      {dateInfo.formatted}
                    </p>
                    <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans">
                      {dateInfo.weekday}
                    </p>
                  </div>

                  {/* Column 3: Guests */}
                  <div className="flex flex-col min-w-[90px] xl:min-w-[110px] shrink-0">
                    <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-stone-500 font-medium font-sans">
                      <Users size={18} className="text-[#D9A62E] shrink-0" />
                      <span>Guests</span>
                    </div>
                    <p className="font-bold text-[14px] sm:text-[16px] text-stone-900 mt-1 font-sans">
                      {getOrderGuests(o)}
                    </p>
                    <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans">
                      People
                    </p>
                  </div>

                  {/* Column 4: Estimated Amount */}
                  <div className="flex flex-col min-w-[130px] xl:min-w-[160px] shrink-0">
                    <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-stone-500 font-medium font-sans">
                      <span className="w-5 h-5 rounded-full border border-[#D9A62E] text-[#D9A62E] flex items-center justify-center font-bold text-xs shrink-0">
                        ₹
                      </span>
                      <span>Estimated Amount</span>
                    </div>
                    <p className="font-bold text-[14px] sm:text-[16px] text-stone-900 mt-1 font-sans">
                      ₹{getOrderTotalAmount(o).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans">
                      ₹{getOrderPricePerPlate(o)} per person
                    </p>
                  </div>

                  {/* Column 5: Status Badge & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-200/60">
                    {/* Status Badge + Subtitle */}
                    <div className="flex flex-col items-start lg:items-end">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[14px] font-semibold font-sans border", cardStatus.badgeColor)}>
                        {cardStatus.icon}
                        <span>{cardStatus.badgeText}</span>
                      </span>
                      <span className="text-[12px] sm:text-[13px] text-stone-500 mt-1 font-sans font-medium">
                        {cardStatus.subtext}
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedQuickViewOrder(o)}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-900 rounded-xl font-sans font-semibold text-[14px] transition-all shadow-2xs cursor-pointer"
                      >
                        View Details
                      </button>

                      {/* 3-Dot More Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuOrderId(isMenuOpen ? null : o.id);
                          }}
                          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isMenuOpen && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-stone-200 py-1.5 shadow-xl z-20 text-xs font-semibold font-sans text-stone-700 animate-fade-in-rapid"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuOrderId(null);
                                setSelectedQuickViewOrder(o);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FileText size={14} className="text-[#D9A62E]" />
                              <span>View Menu Items</span>
                            </button>

                            {(o.venue || o.address) && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.venue || o.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenMenuOrderId(null)}
                                className="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                              >
                                <ExternalLink size={14} className="text-[#D9A62E]" />
                                <span>Venue on Map</span>
                              </a>
                            )}

                            {normalizeStatus(o.status) === 'changes_requested' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuOrderId(null);
                                  startEditing(o);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-amber-800 flex items-center gap-2 cursor-pointer"
                              >
                                <span>✏️ Edit Booking</span>
                              </button>
                            )}

                            {/* Customer cancellation for pending request */}
                            {normalizeStatus(o.status) === 'pending' && !user?.roles?.includes('partner') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuOrderId(null);
                                  updateStatus(o.id, 'cancelled');
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer"
                              >
                                <X size={14} />
                                <span>Cancel Booking Request</span>
                              </button>
                            )}

                            {(user?.roles?.includes('admin') || user?.roles?.includes('partner')) && (
                              <>
                                <div className="border-t border-stone-100 my-1" />
                                {normalizeStatus(o.status) === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuOrderId(null);
                                        updateStatus(o.id, 'approved');
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Check size={14} />
                                      <span>Approve Booking</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuOrderId(null);
                                        updateStatus(o.id, 'rejected');
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={14} />
                                      <span>Reject Booking</span>
                                    </button>
                                  </>
                                )}
                                {normalizeStatus(o.status) === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuOrderId(null);
                                      updateStatus(o.id, 'completed');
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-stone-100 text-stone-900 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Check size={14} />
                                    <span>Mark Completed</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* QUICK VIEW / DETAILS MODAL */}
      {/* ==================================================== */}
      <AnimatePresence>
        {selectedQuickViewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FCFBF8] rounded-3xl border border-[#D9A62E]/40 max-w-2xl w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(6,78,59,0.15)] relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedQuickViewOrder(null)}
                className="absolute right-6 top-6 w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="mb-6 border-b border-[#D9A62E]/30 pb-4">
                <span className="text-[11px] text-[#D9A62E] font-semibold uppercase tracking-widest block mb-1 font-sans">
                  Booking Reference #{selectedQuickViewOrder.id.substring(0, 8).toUpperCase()}
                </span>
                <h3 
                  className="font-serif font-bold text-2xl sm:text-3xl text-stone-900"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {selectedQuickViewOrder.eventType || selectedQuickViewOrder.eventName || "Catering Event"}
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-sans">
                  Status: <span className="font-semibold text-stone-800">{getStatusLabel(selectedQuickViewOrder.status)}</span>
                </p>
              </div>

              {/* Order Info Grid */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Caterer</p>
                    <p className="text-xs sm:text-sm font-bold text-[#064E3B] truncate">{selectedQuickViewOrder.catererName || 'Elite Caterer'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Event Date</p>
                    <p className="text-xs sm:text-sm font-bold text-stone-900">{formatEventDate(selectedQuickViewOrder.eventDate).formatted}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Guests</p>
                    <p className="text-xs sm:text-sm font-bold text-stone-900">{getOrderGuests(selectedQuickViewOrder)} Pax</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Total Price</p>
                    <p className="text-xs sm:text-sm font-bold text-[#D9A62E]">₹{getOrderTotalAmount(selectedQuickViewOrder).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Venue Address</span>
                    {(selectedQuickViewOrder.venue || selectedQuickViewOrder.address) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedQuickViewOrder.venue || selectedQuickViewOrder.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#064E3B] hover:underline flex items-center gap-1"
                      >
                        <MapPin size={12} className="text-[#D9A62E]" />
                        <span>Open in Google Maps</span>
                      </a>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-stone-800">
                    {selectedQuickViewOrder.venue || selectedQuickViewOrder.address || "Hyderabad, Telangana"}
                  </p>
                </div>

                {/* Selected Menu Items Checklist */}
                {selectedQuickViewOrder.selectedItems && selectedQuickViewOrder.selectedItems.length > 0 && (
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                    <h4 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <BookOpen size={14} className="text-[#D9A62E]" />
                      <span>Curated Menu Items ({selectedQuickViewOrder.selectedItems.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {selectedQuickViewOrder.selectedItems.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-stone-800 py-1 px-2.5 rounded-lg bg-stone-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A62E]" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {selectedQuickViewOrder.specialNotes && (
                  <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 text-xs space-y-1">
                    <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">Special Instructions:</span>
                    <p className="text-amber-950 font-medium whitespace-pre-line">{selectedQuickViewOrder.specialNotes}</p>
                  </div>
                )}

                {/* Status Timeline / Audit Trail */}
                {selectedQuickViewOrder.statusHistory && selectedQuickViewOrder.statusHistory.length > 0 && (
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                    <span className="font-bold text-stone-500 text-[10px] uppercase tracking-wider block">Audit Trail Logs</span>
                    <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-2">
                      {selectedQuickViewOrder.statusHistory.map((h: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-[#D9A62E] pl-3 py-0.5 text-xs">
                          <div className="flex items-center gap-2 text-[10px] text-[#064E3B] font-bold uppercase">
                            <span>{h.action || 'Updated'}</span>
                            <span className="text-[#D9A62E]">•</span>
                            <span>{h.actor || 'User'}</span>
                            {h.timestamp && (
                              <span className="text-stone-400 font-normal ml-auto">{new Date(h.timestamp).toLocaleDateString()}</span>
                            )}
                          </div>
                          <p className="text-stone-700 font-medium text-[11px] mt-0.5">{h.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedQuickViewOrder(null)}
                  className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>

                {/* Close action */}

                {(user?.roles?.includes('admin') || user?.roles?.includes('partner')) && (
                  <div className="flex items-center gap-2">
                    {normalizeStatus(selectedQuickViewOrder.status) === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(selectedQuickViewOrder.id, 'approved')}
                          className="px-4 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-semibold hover:bg-[#043d2e] cursor-pointer"
                        >
                          Approve Booking
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(selectedQuickViewOrder.id, 'rejected')}
                          className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                        >
                          Reject Booking
                        </button>
                      </>
                    )}
                    {normalizeStatus(selectedQuickViewOrder.status) === 'approved' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(selectedQuickViewOrder.id, 'completed')}
                        className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* REPEAT BOOKING MODAL */}
      {/* ==================================================== */}
      <AnimatePresence>
        {repeatOrderSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FCFBF8] rounded-3xl border border-[#D9A62E]/40 max-w-lg w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(6,78,59,0.15)] relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                type="button"
                onClick={() => setRepeatOrderSource(null)}
                className="absolute right-6 top-6 w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="mb-6 border-b border-[#D9A62E]/30 pb-4">
                <span className="text-[11px] text-[#D9A62E] font-semibold uppercase tracking-widest block mb-1 font-sans">
                  Quick Rebooking
                </span>
                <h3 
                  className="font-serif font-bold text-2xl text-stone-900"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  Repeat Catering Event
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-sans">
                  Re-submit booking for {repeatOrderSource.catererName}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    New Event Date
                  </label>
                  <input 
                    type="date" 
                    value={repeatForm.eventDate}
                    onChange={(e) => setRepeatForm({ ...repeatForm, eventDate: e.target.value })}
                    className="w-full bg-white border border-stone-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-[#D9A62E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Guest Count (Pax)
                  </label>
                  <input 
                    type="number" 
                    value={repeatForm.guests || ''}
                    onChange={(e) => setRepeatForm({ ...repeatForm, guests: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-[#D9A62E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Venue Address in Hyderabad
                  </label>
                  <textarea 
                    rows={2}
                    value={repeatForm.venue}
                    onChange={(e) => setRepeatForm({ ...repeatForm, venue: e.target.value })}
                    className="w-full bg-white border border-stone-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Special Instructions
                  </label>
                  <textarea 
                    rows={2}
                    value={repeatForm.specialNotes}
                    onChange={(e) => setRepeatForm({ ...repeatForm, specialNotes: e.target.value })}
                    className="w-full bg-white border border-stone-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E] shadow-2xs"
                  />
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRepeatOrderSource(null)}
                  className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRepeatBookingConfirm}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Rebook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* EDIT MODAL FOR CHANGES_REQUESTED */}
      {/* ==================================================== */}
      <AnimatePresence>
        {editingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFBF8] rounded-3xl border border-[#D9A62E]/40 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                type="button"
                onClick={() => setEditingOrderId(null)}
                className="absolute right-6 top-6 w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 
                className="font-serif font-bold text-2xl text-stone-900 mb-4"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Edit Booking Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Event Date</label>
                    <input 
                      type="date" 
                      value={editForm.eventDate}
                      onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Event Type</label>
                    <input 
                      type="text" 
                      value={editForm.eventType}
                      onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-stone-500 uppercase">Venue Address</label>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className="text-xs font-bold text-[#D9A62E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin size={12} />
                      <span>Select on Map</span>
                    </button>
                  </div>
                  <AddressAutocomplete
                    useTextarea={true}
                    rows={2}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E]"
                    value={editForm.venue}
                    onChange={(val) => setEditForm({ ...editForm, venue: val })}
                    onSelect={(data) => {
                      setEditForm({
                        ...editForm,
                        venue: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude
                      });
                    }}
                    theme="gold"
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
                  <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Guest Count</label>
                  <input 
                    type="number"
                    value={editForm.guests ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, guests: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Notes / Instructions</label>
                  <textarea 
                    rows={2}
                    value={editForm.specialNotes}
                    onChange={(e) => setEditForm({ ...editForm, specialNotes: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-[#D9A62E]"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOrderId(null)}
                  className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ord = orders.find(x => x.id === editingOrderId);
                    if (ord) handleResubmitOrder(editingOrderId, ord.catererId);
                  }}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Resubmit Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* NOTIFICATIONS INBOX MODAL */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showNotificationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFBF8] rounded-3xl border border-[#D9A62E]/40 max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900">Notifications &amp; Activity</h3>
                    <p className="text-xs text-stone-500">Live booking alerts from caterers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customerNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCustNotifications}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotificationsModal(false)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {customerNotifications.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Bell size={24} className="mx-auto mb-2 text-stone-300" />
                    <p className="text-xs font-medium">No alerts right now</p>
                  </div>
                ) : (
                  customerNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkCustNotificationRead(n.id)}
                      className={cn(
                        "p-3.5 rounded-xl border text-xs transition-all cursor-pointer",
                        n.read ? "bg-white border-stone-200 text-stone-600" : "bg-[#FFFDF7] border-[#D9A62E]/40 text-stone-900 font-semibold shadow-2xs"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#064E3B]">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[#D9A62E] shrink-0 mt-1" />}
                      </div>
                      <p className="mt-1 text-stone-600 font-normal leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
