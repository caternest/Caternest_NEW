import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ShoppingBag, 
  Bell, 
  CreditCard, 
  User, 
  ChefHat, 
  Menu, 
  ChevronRight, 
  CheckCircle, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Clock, 
  CalendarDays, 
  Image as ImageIcon, 
  Settings,
  X,
  LogOut,
  Building,
  Phone,
  MapPin,
  Mail,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  ChevronLeft,
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CatererMobileDashboardProps {
  user: any;
  caterer: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  partnerOrders: any[];
  localNotifications: any[];
  unreadNotificationsCount: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  revenue: number;
  eventFilter: '7' | '15' | '30' | 'custom';
  setEventFilter: (filter: '7' | '15' | '30' | 'custom') => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  getFilteredUpcomingEvents: () => any[];
  handleOpenOrderDetails: (ord: any) => void;
  getStatusColor: (status: string) => string;
  navItems: any[];
  logout: () => void;
  children?: React.ReactNode;

  // New props for Orders Redesign
  orderListFilter: 'all' | 'pending' | 'approved' | 'completed' | 'revenue';
  setOrderListFilter: (filter: 'all' | 'pending' | 'approved' | 'completed' | 'revenue') => void;
  filteredOrderList: any[];
  setSelectedOrder: (ord: any) => void;
  handleApprove: (id: string) => Promise<void>;
  setShowRejectModal: (show: boolean) => void;
  openModifyModal: (ord: any) => void;

  // New props for Profile Redesign
  profileFormData: any;
  setProfileFormData: (data: any) => void;
  isProfilePending: boolean;
  handleProfileSubmit: (e: React.FormEvent) => void;
  dashboardNewAreaText: string;
  setDashboardNewAreaText: (text: string) => void;

  // New props for Notifications
  handleClearAllNotifications: () => void;
  handleMarkNotificationRead: (id: string) => void;

  // New props for Gallery Management
  handleDeletePhoto: (index: number) => void;
  handleReplacePhoto: (index: number, file: File) => Promise<void>;
  handleMovePhoto: (index: number, direction: 'left' | 'right') => void;
  handleMakePrimary: (index: number) => void;
  handleMultipleFiles: (files: FileList) => Promise<void>;
}

export default function CatererMobileDashboard({
  user,
  caterer,
  activeTab,
  setActiveTab,
  partnerOrders,
  localNotifications,
  unreadNotificationsCount,
  totalOrders,
  pendingOrders,
  approvedOrders,
  completedOrders,
  rejectedOrders,
  revenue,
  eventFilter,
  setEventFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  getFilteredUpcomingEvents,
  handleOpenOrderDetails,
  getStatusColor,
  navItems,
  logout,
  children,

  // New props for Orders Redesign
  orderListFilter,
  setOrderListFilter,
  filteredOrderList,
  setSelectedOrder,
  handleApprove,
  setShowRejectModal,
  openModifyModal,

  // New props for Profile Redesign
  profileFormData,
  setProfileFormData,
  isProfilePending,
  handleProfileSubmit,
  dashboardNewAreaText,
  setDashboardNewAreaText,

  // New props for Notifications
  handleClearAllNotifications,
  handleMarkNotificationRead,

  // New props for Gallery Management
  handleDeletePhoto,
  handleReplacePhoto,
  handleMovePhoto,
  handleMakePrimary,
  handleMultipleFiles
}: CatererMobileDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bottom Nav items
  const bottomNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrders > 0 ? pendingOrders : null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden flex flex-col min-h-screen bg-slate-50 pb-32">
      {/* Sticky top header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-30 shadow-sm select-none">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all rounded-xl"
            id="mobile-hamburger-menu-btn"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-brand-gold-500 p-1.5 rounded-xl text-white">
              <ChefHat size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-brand-green-900 leading-none">CaterNest</span>
              <span className="text-[7.5px] uppercase tracking-widest text-brand-gold-600 font-extrabold leading-none mt-0.5">PORTAL</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Notification bell icon */}
          <button 
            onClick={() => setActiveTab('notifications')}
            className="relative p-2.5 text-slate-500 hover:text-brand-green-900 transition-colors rounded-xl hover:bg-slate-50"
            id="mobile-header-bell-btn"
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
            )}
          </button>
          
          {/* Profile Dropdown Trigger */}
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 pl-2.5 border-l border-slate-200 active:scale-95 transition-transform"
            id="mobile-header-profile-btn"
          >
            <div className="w-8 h-8 rounded-full bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center font-black text-sm border border-brand-gold-200 shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <span className="text-xs font-bold text-slate-800 max-w-[80px] truncate">
              {user?.name?.split(' ')[0] || 'Caterer'}
            </span>
          </button>
        </div>
      </div>

      {/* Main content body (offset by header height) */}
      <div className="pt-16 px-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Premium Hero Card */}
            <div className="relative mt-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-6 text-white shadow-xl border border-emerald-800/20">
              {/* Subtle background glow or texture pattern */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-gold-500/5 rounded-full filter blur-2xl" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1 max-w-[65%]">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Caterer Portal
                  </p>
                  <h2 className="text-2xl font-display font-medium text-white tracking-wide leading-tight truncate">
                    {caterer?.businessName || 'Elite Catering'}
                  </h2>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-gold-300 bg-brand-gold-500/10 border border-brand-gold-500/30 px-3 py-1.5 rounded-full">
                      <CheckCircle size={10} className="text-brand-gold-400" /> Approved Partner
                    </span>
                  </div>
                </div>

                {/* Golden circular food/caterer logo */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-brand-gold-500/40 p-1.5 bg-emerald-950 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
                    {caterer?.logo ? (
                      <img 
                        src={caterer.logo} 
                        alt={caterer?.businessName} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-900 flex items-center justify-center text-brand-gold-500">
                        <ChefHat size={32} />
                      </div>
                    )}
                  </div>
                  {/* Miniature decorative chef crown or accent */}
                  <span className="absolute -top-1 -right-1 bg-brand-gold-500 text-emerald-950 rounded-full p-1 border border-emerald-950 shadow">
                    <ChefHat size={8} />
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Overview Title */}
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                Dashboard Overview
              </h1>
            </div>

            {/* Statistics (2-column responsive grid) */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Total Orders */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
              </button>

              {/* Pending Orders */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Orders</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{pendingOrders}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
              </button>

              {/* Approved */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                  <p className="text-2xl font-black text-green-600 mt-1">{approvedOrders}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
              </button>

              {/* Completed */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{completedOrders}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              </button>

              {/* Rejected */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
                  <p className="text-2xl font-black text-red-600 mt-1">{rejectedOrders}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle size={18} />
                </div>
              </button>

              {/* Revenue */}
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between text-left active:scale-95 transition-all w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-black text-brand-gold-600 mt-1">₹{(revenue/1000).toFixed(1)}k</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
              </button>

            </div>

            {/* Upcoming Scheduled Events Card */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base font-display">Upcoming Scheduled Events</h3>
                <p className="text-xs text-slate-400 mt-0.5">Filter and manage confirmed celebrations</p>
                
                {/* Range selector row */}
                <div className="mt-4 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center gap-1 overflow-x-auto custom-sidebar-scrollbar whitespace-nowrap py-0.5">
                    {[
                      { id: '7', label: '7 Days' },
                      { id: '15', label: '15 Days' },
                      { id: '30', label: '30 Days' },
                      { id: 'custom', label: 'Custom' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEventFilter(tab.id as any)}
                        className={cn(
                          "flex-1 text-center py-2 px-3 text-xs font-bold rounded-xl transition-all",
                          eventFilter === tab.id
                            ? "bg-emerald-950 text-white shadow"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  
                  {eventFilter === 'custom' && (
                    <div className="flex flex-col gap-2 mt-3 p-3 bg-white rounded-xl border border-slate-100 animate-fade-in text-xs font-bold text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>From</span>
                        <input 
                          type="date" 
                          value={customStartDate} 
                          onChange={(e) => setCustomStartDate(e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-gold-500 w-[70%]" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>To</span>
                        <input 
                          type="date" 
                          value={customEndDate} 
                          onChange={(e) => setCustomEndDate(e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-gold-500 w-[70%]" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Cards or Empty view */}
              <div className="pt-4 space-y-3.5">
                {getFilteredUpcomingEvents().map(ord => (
                  <div key={'upcoming-event-'+ord.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:shadow hover:border-brand-green-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex gap-3 items-center mb-3">
                        <div className="w-12 h-12 bg-emerald-950 text-white rounded-xl flex flex-col items-center justify-center border border-emerald-900 flex-shrink-0 shadow-sm">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-brand-gold-300">{new Date(ord.eventDate).toLocaleDateString('en-US', {month: 'short'})}</span>
                          <span className="text-lg font-display font-black leading-none">{new Date(ord.eventDate).getDate()}</span>
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-950 text-sm truncate" title={ord.customerName}>{ord.customerName}</p>
                          <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border", getStatusColor(ord.status))}>
                            {ord.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-600 font-medium border-t border-slate-100 pt-2.5">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Guests:</span> 
                          <span className="font-bold text-slate-800">{ord.guests}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Package:</span> 
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">{ord.packageDetails?.packageName || 'Custom'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Phone:</span> 
                          <span className="font-bold text-slate-800">{ord.phone || ord.customerPhone || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between items-start gap-2">
                          <span className="text-slate-400 shrink-0">Venue:</span> 
                          <span className="font-bold text-slate-800 text-right truncate max-w-[150px]" title={ord.venue}>{ord.venue || 'TBD'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button onClick={() => handleOpenOrderDetails(ord)} className="text-xs font-black text-brand-green-950 hover:text-brand-green-800 flex items-center gap-1 active:scale-95 transition-transform">
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {getFilteredUpcomingEvents().length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm">
                      <CalendarDays size={22} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700">No scheduled events</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">No upcoming events are scheduled within this timeframe.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 mt-4 pt-3 flex justify-end">
                <button 
                  onClick={() => setActiveTab('orders')} 
                  className="text-xs font-extrabold text-brand-green-900 hover:text-brand-green-850 flex items-center gap-1"
                >
                  View All Calendar <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base font-display">Recent Notifications</h3>
                <button 
                  onClick={() => setActiveTab('notifications')} 
                  className="text-xs font-extrabold text-brand-green-900 hover:text-brand-green-850 flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-3.5">
                {partnerOrders.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-slate-50/55 border border-slate-100 rounded-2xl flex gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex flex-shrink-0 items-center justify-center border border-blue-100">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          New Booking Received
                        </p>
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
                          New
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        You have received a new booking request for {ord.guests} guests from {ord.customerName}.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                        {new Date(ord.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} • {new Date(ord.created_at).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
                
                {partnerOrders.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No recent notifications.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- ORDERS REDESIGNED FOR MOBILE --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Premium Emerald Hero Card */}
            <div className="relative mt-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0F3D2E] via-[#164E3D] to-[#0A2D22] p-6 text-white shadow-xl border border-emerald-800/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-gold-500/5 rounded-full filter blur-2xl" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1 max-w-[65%]">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Caterer Portal
                  </p>
                  <h2 className="text-2xl font-display font-medium text-white tracking-wide leading-tight truncate">
                    {caterer?.businessName || 'Elite Catering'}
                  </h2>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#DEAA38] bg-[#DEAA38]/15 border border-[#DEAA38]/35 px-3 py-1.5 rounded-full">
                      <CheckCircle size={10} className="text-[#DEAA38]" /> Approved Partner
                    </span>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-[#DEAA38]/40 p-1.5 bg-emerald-950 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
                    {caterer?.logo ? (
                      <img 
                        src={caterer.logo} 
                        alt={caterer?.businessName} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-900 flex items-center justify-center text-[#DEAA38]">
                        <ChefHat size={32} />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-[#DEAA38] text-emerald-950 rounded-full p-1 border border-emerald-950 shadow">
                    <ChefHat size={8} />
                  </span>
                </div>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="space-y-1">
              <h1 className="text-[28px] font-display font-bold text-slate-950 leading-tight">
                Order Management
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Filter, review and confirm customer booking requests.
              </p>
            </div>

            {/* Order Filters (Segmented Control) */}
            <div className="bg-[#FAF6EC] p-1.5 rounded-[1.5rem] border border-[#DEAA38]/10">
              <div className="flex gap-1 overflow-x-auto whitespace-nowrap py-0.5 no-scrollbar">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'revenue', label: 'Revenue Base' }
                ].map((tab) => {
                  const isActive = orderListFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderListFilter(tab.id as any)}
                      className={cn(
                        "flex-1 text-center py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer",
                        isActive
                          ? "bg-[#0F3D2E] text-white shadow-md"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-100"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Cards List */}
            <div className="space-y-4">
              {filteredOrderList.map((ord) => (
                <div key={ord.id} className="bg-white rounded-[20px] shadow-sm border border-slate-150 p-5 flex flex-col gap-4">
                  
                  {/* Row 1: Order ID & Status */}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</span>
                      <span className="font-mono text-sm font-bold text-slate-700">#{ord.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border", getStatusColor(ord.status))}>
                      {ord.status}
                    </span>
                  </div>

                  {/* Row 2: Customer details & Date */}
                  <div className="border-t border-slate-50 pt-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer</span>
                    <h3 className="font-display font-bold text-slate-900 text-lg leading-snug mt-0.5">
                      {ord.customerName || 'Guest User'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                      <CalendarDays size={13} className="text-slate-400 shrink-0" />
                      Booking: {new Date(ord.eventDate).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}
                    </p>
                  </div>

                  {/* Row 3: Specifications Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-[#FBF9F4] p-3 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Package</span>
                      <span className="text-xs font-bold text-slate-800 truncate mt-0.5" title={ord.packageDetails?.packageName}>
                        {ord.packageDetails?.packageName || 'Customized'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Guests</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5">
                        {ord.guests}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Amount</span>
                      <span className="text-xs font-black text-[#0F3D2E] mt-0.5">
                        ₹{ord.totalEstimate?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    
                    {/* Secondary Actions (always available for utility) */}
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedOrder(ord)} 
                        className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                      >
                        View Details
                      </button>

                      {(ord.customerPhone || ord.phone) && (
                        <a 
                          href={`tel:${ord.customerPhone || ord.phone}`}
                          className="flex-1 h-12 bg-[#FAF6EC] hover:bg-[#F2EADA] text-[#DEAA38] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border border-[#DEAA38]/20"
                        >
                          <Phone size={14} /> Call Customer
                        </a>
                      )}
                    </div>

                    {/* Operational Map Action if location exists */}
                    {(ord.venue || ord.address) && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ord.venue || ord.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-12 bg-blue-50/50 hover:bg-blue-50 border border-blue-250 text-blue-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MapPin size={14} /> Open Maps
                      </a>
                    )}

                    {/* Primary Decision Action Buttons for pending/submitted orders */}
                    {['pending', 'Submitted', 'Pending Caterer Review', 'updated_by_customer'].includes(ord.status) && (
                      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 mt-1">
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setShowRejectModal(true);
                            }}
                            className="flex-1 h-12 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                          >
                            Reject
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleApprove(ord.id)}
                            className="flex-1 h-12 bg-[#0F3D2E] hover:bg-emerald-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                          >
                            Approve
                          </button>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => openModifyModal(ord)}
                          className="h-12 border-2 border-[#DEAA38] text-[#DEAA38] bg-amber-500/5 hover:bg-amber-500/10 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                        >
                          Edit Quotation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredOrderList.length === 0 && (
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-150 p-10 text-center py-16">
                  <div className="w-20 h-20 bg-[#FAF6EC] rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={36} className="text-[#DEAA38]" />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-xl">
                    {orderListFilter === 'approved' ? "No approved orders found" : "No orders found"}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 font-medium max-w-xs mx-auto leading-relaxed">
                    {orderListFilter === 'approved' 
                      ? "When you approve orders, they will appear here." 
                      : "We couldn't find any orders matching this filter."
                    }
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- PROFILE REDESIGNED FOR MOBILE --- */}
        {activeTab === 'profile' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleProfileSubmit(e);
            }} 
            className="space-y-6"
          >
            
            {/* Premium Emerald Hero Card */}
            <div className="relative mt-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0F3D2E] via-[#164E3D] to-[#0A2D22] p-6 text-white shadow-xl border border-emerald-800/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-gold-500/5 rounded-full filter blur-2xl" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1 max-w-[65%]">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Caterer Portal
                  </p>
                  <h2 className="text-2xl font-display font-medium text-white tracking-wide leading-tight truncate">
                    {caterer?.businessName || 'Elite Catering'}
                  </h2>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#DEAA38] bg-[#DEAA38]/15 border border-[#DEAA38]/35 px-3 py-1.5 rounded-full">
                      <CheckCircle size={10} className="text-[#DEAA38]" /> Approved Partner
                    </span>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-[#DEAA38]/40 p-1.5 bg-emerald-950 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
                    {caterer?.logo ? (
                      <img 
                        src={caterer.logo} 
                        alt={caterer?.businessName} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-900 flex items-center justify-center text-[#DEAA38]">
                        <ChefHat size={32} />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-[#DEAA38] text-emerald-950 rounded-full p-1 border border-emerald-950 shadow">
                    <ChefHat size={8} />
                  </span>
                </div>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="space-y-1">
              <h1 className="text-[28px] font-display font-bold text-slate-950 leading-tight">
                Profile Management
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Identify your registration with approved before becoming visible.
              </p>
            </div>

            {/* Under Review State Banner */}
            {isProfilePending && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3 shadow-2xs">
                <Clock className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={20} />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 text-sm">Update Request Pending</h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Your recent profile changes are currently under review by our admin team. Once approved, they will be visible to customers.
                  </p>
                </div>
              </div>
            )}

            {/* Basic Info Fields Stack (one per row) */}
            <div className="space-y-5 bg-white rounded-[20px] shadow-sm border border-slate-150 p-6">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Owner Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </span>
                  <input 
                    type="text" 
                    value={profileFormData.owner || ''} 
                    onChange={(e) => setProfileFormData({...profileFormData, owner: e.target.value})} 
                    className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-12 pr-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. Mohammed Ismail"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Business Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building size={18} />
                  </span>
                  <input 
                    type="text" 
                    value={profileFormData.businessName || ''} 
                    onChange={(e) => setProfileFormData({...profileFormData, businessName: e.target.value})} 
                    className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-12 pr-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. Elite Catering"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={18} />
                  </span>
                  <input 
                    type="tel" 
                    value={profileFormData.phone || ''} 
                    onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})} 
                    className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-12 pr-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. 6300255623"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    value={profileFormData.email || ''} 
                    onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})} 
                    className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-12 pr-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. atulcatering25@gmail.com"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Business Description</label>
                <textarea 
                  value={profileFormData.description || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, description: e.target.value})} 
                  className="w-full bg-[#FAF9F5]/70 border border-slate-200 rounded-xl p-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors h-32 resize-none leading-relaxed" 
                  placeholder="Tell customers about your catering service, specialties, and vision..." 
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Full Address</label>
                <textarea 
                  value={profileFormData.address || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, address: e.target.value})} 
                  className="w-full bg-[#FAF9F5]/70 border border-slate-200 rounded-xl p-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors h-28 resize-none leading-relaxed" 
                  placeholder="Enter full physical business or kitchen address..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Base City</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={18} />
                  </span>
                  <input 
                    type="text" 
                    value={profileFormData.city || ''} 
                    onChange={(e) => setProfileFormData({...profileFormData, city: e.target.value})} 
                    className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-12 pr-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. Hyderabad"
                    required 
                  />
                </div>
              </div>

            </div>

            {/* Professional & Operational Details Section */}
            <div className="space-y-5 bg-white rounded-[20px] shadow-sm border border-slate-150 p-6">
              <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Professional & Operational Details
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Brand Name</label>
                <input 
                  type="text" 
                  value={profileFormData.brandName || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, brandName: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. Q4 Royal Caterers Premium" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Tagline</label>
                <input 
                  type="text" 
                  value={profileFormData.tagline || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, tagline: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. Crafting Memorable Celebrations with Exceptional Taste" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">WhatsApp Mobile Connection</label>
                <input 
                  type="tel" 
                  value={profileFormData.whatsappNumber || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, whatsappNumber: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. +91 98765 43210" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Years of Experience</label>
                <input 
                  type="number" 
                  value={profileFormData.experience || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, experience: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. 20" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Events Completed</label>
                <input 
                  type="number" 
                  value={profileFormData.eventsCompleted || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, eventsCompleted: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. 260" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Number of Branches</label>
                <input 
                  type="number" 
                  value={profileFormData.branches || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, branches: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors" 
                  placeholder="e.g. 2" 
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700">Service Areas</label>
                
                {/* Serve Entire Hyderabad checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-[#FAF9F5] border border-slate-200 rounded-xl px-4 py-3.5 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={(() => {
                      const raw = profileFormData.serviceAreas;
                      if (!raw) return false;
                      const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                      return arr.length === 1 && arr[0] === "All Hyderabad";
                    })()}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfileFormData({ ...profileFormData, serviceAreas: ["All Hyderabad"] });
                      } else {
                        setProfileFormData({ ...profileFormData, serviceAreas: [] });
                      }
                    }}
                    className="w-5 h-5 text-[#0F3D2E] focus:ring-[#0F3D2E] border-slate-300 rounded cursor-pointer accent-[#0F3D2E]"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Serve Entire Hyderabad
                  </span>
                </label>

                {!(() => {
                  const raw = profileFormData.serviceAreas;
                  if (!raw) return false;
                  const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                  return arr.length === 1 && arr[0] === "All Hyderabad";
                })() && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2 relative">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <MapPin size={18} />
                        </span>
                        <input
                          type="text"
                          value={dashboardNewAreaText}
                          onChange={(e) => setDashboardNewAreaText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = dashboardNewAreaText.trim();
                              if (trimmed) {
                                const raw = profileFormData.serviceAreas;
                                const arr = Array.isArray(raw) ? [...raw] : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                                if (!arr.includes(trimmed)) {
                                  arr.push(trimmed);
                                  setProfileFormData({ ...profileFormData, serviceAreas: arr });
                                }
                              }
                              setDashboardNewAreaText("");
                            }
                          }}
                          placeholder="Enter area name, e.g. Jubilee Hills..."
                          className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium focus:border-[#DEAA38] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = dashboardNewAreaText.trim();
                          if (trimmed) {
                            const raw = profileFormData.serviceAreas;
                            const arr = Array.isArray(raw) ? [...raw] : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                            if (!arr.includes(trimmed)) {
                              arr.push(trimmed);
                              setProfileFormData({ ...profileFormData, serviceAreas: arr });
                            }
                          }
                          setDashboardNewAreaText("");
                        }}
                        className="bg-[#0F3D2E] hover:bg-emerald-900 text-white text-xs font-black px-5 rounded-xl transition h-14 shrink-0 uppercase tracking-wider cursor-pointer"
                      >
                        + Add Area
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(() => {
                        const raw = profileFormData.serviceAreas;
                        if (!raw) return [];
                        return Array.isArray(raw) ? raw : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                      })().map((area: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-[#FAF6EC] border border-[#DEAA38]/20 text-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold select-none"
                        >
                          <span className="uppercase text-[10px] font-bold text-amber-900 tracking-wider">
                            {area}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const raw = profileFormData.serviceAreas;
                              const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                              const filtered = arr.filter((a: string) => a !== area);
                              setProfileFormData({ ...profileFormData, serviceAreas: filtered });
                            }}
                            className="text-amber-850 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                      {(() => {
                        const raw = profileFormData.serviceAreas;
                        const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (raw.startsWith("[") ? JSON.parse(raw) : raw.split(",").map(s => s.trim()).filter(Boolean)) : []);
                        return arr.length === 0;
                      })() && (
                        <p className="text-xs text-slate-400 italic">No specific service areas added yet. Type an area above and click Add Area.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Branding & Identity Section */}
            <div className="space-y-6 bg-white rounded-[20px] shadow-sm border border-slate-150 p-6">
              <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Branding & Identity
              </h3>

              {/* Logo Upload Box */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Caterer Logo Upload (500x500)</label>
                <div className="border-2 border-dashed border-[#DEAA38]/40 rounded-3xl p-5 bg-[#FAF9F5]/30 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden transition-all">
                  {profileFormData.logo ? (
                    <div className="relative w-full h-[140px] flex flex-col items-center justify-center">
                      <img 
                        src={profileFormData.logo} 
                        alt="Logo Preview" 
                        className="max-h-full max-w-[120px] object-contain rounded-full shadow border-2 border-white"
                        referrerPolicy="no-referrer"
                      />
                      <label className="mt-3 cursor-pointer bg-[#DEAA38] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-amber-500 shadow-sm transition-all select-none uppercase tracking-wider">
                        Change Logo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setProfileFormData({ ...profileFormData, logo: ev.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#FAF6EC] text-amber-700 flex items-center justify-center mb-2">
                        <UploadCloud size={22} className="text-[#DEAA38]" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">No logo uploaded yet</p>
                      <label className="mt-2 cursor-pointer bg-[#DEAA38] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-amber-500 transition-all select-none uppercase tracking-wider">
                        Upload Logo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setProfileFormData({ ...profileFormData, logo: ev.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or Select From Gallery / Paste URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. https://host.com/logo.jpg" 
                      value={profileFormData.logo && profileFormData.logo.startsWith('data:') ? '' : (profileFormData.logo || '')} 
                      onChange={(e) => setProfileFormData({...profileFormData, logo: e.target.value})} 
                      className="flex-1 h-12 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-xs font-medium outline-none" 
                    />
                    <button 
                      type="button"
                      onClick={() => setProfileFormData({...profileFormData, logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500'})}
                      className="bg-[#FAF6EC] border border-[#DEAA38]/30 text-amber-900 font-bold px-4 rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Gallery
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover Banner Upload Box */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Cover Banner Upload (1600x600)</label>
                <div className="border-2 border-dashed border-[#DEAA38]/40 rounded-3xl p-5 bg-[#FAF9F5]/30 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden transition-all">
                  {profileFormData.coverBanner ? (
                    <div className="relative w-full h-[140px] flex flex-col items-center justify-center">
                      <img 
                        src={profileFormData.coverBanner} 
                        alt="Banner Preview" 
                        className="max-h-full w-full object-cover rounded-xl shadow border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <label className="mt-3 cursor-pointer bg-[#DEAA38] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-amber-500 shadow-sm transition-all select-none uppercase tracking-wider">
                        Change Banner
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setProfileFormData({ ...profileFormData, coverBanner: ev.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#FAF6EC] text-amber-700 flex items-center justify-center mb-2">
                        <UploadCloud size={22} className="text-[#DEAA38]" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">No cover banner uploaded yet</p>
                      <label className="mt-2 cursor-pointer bg-[#DEAA38] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-amber-500 transition-all select-none uppercase tracking-wider">
                        Upload Banner
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setProfileFormData({ ...profileFormData, coverBanner: ev.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or Select From Gallery / Paste URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. https://host.com/banner.jpg" 
                      value={profileFormData.coverBanner && profileFormData.coverBanner.startsWith('data:') ? '' : (profileFormData.coverBanner || '')} 
                      onChange={(e) => setProfileFormData({...profileFormData, coverBanner: e.target.value})} 
                      className="flex-1 h-12 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-xs font-medium outline-none" 
                    />
                    <button 
                      type="button"
                      onClick={() => setProfileFormData({...profileFormData, coverBanner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'})}
                      className="bg-[#FAF6EC] border border-[#DEAA38]/30 text-amber-900 font-bold px-4 rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Gallery
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Gallery Photos Section */}
            <div className="space-y-6 bg-white rounded-[20px] shadow-sm border border-slate-150 p-6">
              <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Gallery Photos
              </h3>
              <p className="text-xs text-slate-500 -mt-2">
                Manage the images shown on your Explore Caterers listing.
              </p>

              {/* Mobile 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                {(profileFormData.galleryPhotos || []).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 shadow-sm relative flex flex-col justify-between">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 mb-2 flex items-center justify-center">
                      <img 
                        src={imgUrl} 
                        alt={`Gallery ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-brand-gold-500 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow uppercase tracking-wider">
                          <Star size={8} fill="currentColor" /> Primary
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {idx > 0 && (
                        <button 
                          type="button" 
                          onClick={() => handleMakePrimary(idx)}
                          className="w-full py-1 bg-brand-gold-50 hover:bg-brand-gold-100 text-[#DEAA38] font-bold rounded-lg text-[10px] transition-colors flex items-center justify-center gap-0.5 border border-brand-gold-100 uppercase tracking-wide"
                        >
                          <Star size={10} /> Primary
                        </button>
                      )}

                      <div className="flex gap-1">
                        <button 
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePhoto(idx, 'left')}
                          className="flex-1 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center"
                          title="Move Left"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button 
                          type="button"
                          disabled={idx === (profileFormData.galleryPhotos || []).length - 1}
                          onClick={() => handleMovePhoto(idx, 'right')}
                          className="flex-1 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center"
                          title="Move Right"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <label className="flex-1 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer text-center uppercase tracking-wide">
                          Replace
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleReplacePhoto(idx, file);
                              }
                            }} 
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => handleDeletePhoto(idx)}
                          className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="border border-dashed border-[#DEAA38]/40 rounded-3xl p-5 bg-[#FAF9F5]/30 flex flex-col items-center justify-center min-h-[140px] text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF6EC] text-amber-700 flex items-center justify-center mb-2 shadow-sm">
                  <UploadCloud size={20} className="text-[#DEAA38]" />
                </div>
                <p className="text-xs font-bold text-slate-700 mb-0.5">Upload new images</p>
                <p className="text-[10px] text-slate-400 mb-3">Supports JPG, PNG, WEBP</p>
                <label className="cursor-pointer bg-[#DEAA38] text-slate-950 text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-amber-500 shadow-sm transition-all select-none uppercase tracking-wider">
                  Upload Photos
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMultipleFiles(e.target.files);
                      }
                    }} 
                  />
                </label>
              </div>
            </div>

            {/* Legal Details Section */}
            <div className="space-y-5 bg-white rounded-[20px] shadow-sm border border-slate-150 p-6">
              <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Legal Details
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">FSSAI Number</label>
                <input 
                  type="text" 
                  value={profileFormData.fssaiNumber || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, fssaiNumber: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors uppercase" 
                  placeholder="14-digit FSSAI registration" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">GSTIN</label>
                <input 
                  type="text" 
                  value={profileFormData.gstNumber || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, gstNumber: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors uppercase" 
                  placeholder="15-character GSTIN code" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">PAN Number</label>
                <input 
                  type="text" 
                  value={profileFormData.panNumber || ''} 
                  onChange={(e) => setProfileFormData({...profileFormData, panNumber: e.target.value})} 
                  className="w-full h-14 bg-[#FAF9F5]/70 border border-slate-200 rounded-xl px-4 text-base font-medium focus:border-[#DEAA38] focus:bg-white outline-none transition-colors uppercase" 
                  placeholder="10-character business PAN" 
                />
              </div>
            </div>

            {/* Submit Button Block */}
            <div className="pt-4 pb-12">
              <button 
                type="submit" 
                className="w-full h-14 bg-[#0F3D2E] hover:bg-emerald-900 text-white text-base font-black rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center cursor-pointer"
              >
                Submit Profile for Review
              </button>
            </div>

          </form>
        )}

        {/* --- NOTIFICATIONS ON MOBILE --- */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-2">
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-950">
                  Notifications
                </h1>
                <p className="text-xs text-slate-500 font-semibold">
                  Status changes, system updates, and requests.
                </p>
              </div>
              {localNotifications.length > 0 && (
                <button 
                  onClick={handleClearAllNotifications} 
                  className="px-3.5 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-3">
              {localNotifications.map((n) => (
                <div key={n.id} className={cn("p-4 rounded-2xl border transition-all flex justify-between items-start gap-2.5", n.read ? "bg-white border-slate-150" : "bg-[#FAF6EC] border-[#DEAA38]/30 shadow-2xs")}>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", n.read ? "bg-slate-300" : "bg-[#DEAA38]")} />
                      <h4 className="font-bold text-slate-800 text-sm truncate">{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-4 leading-relaxed font-medium">{n.message}</p>
                    {n.orderId && <p className="text-[10px] text-slate-400 font-mono pl-4">Order: #{n.orderId.substring(0, 8)}</p>}
                  </div>
                  {!n.read && (
                    <button 
                      onClick={() => handleMarkNotificationRead(n.id)} 
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
              
              {localNotifications.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-150 p-10 text-center py-12">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Bell size={24} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">You have no new notifications.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PAYMENTS ON MOBILE --- */}
        {activeTab === 'payments' && (
          <div className="space-y-6 pt-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-950">
                Payment History
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Manage your transaction payouts and fees.
              </p>
            </div>

            <div className="space-y-4">
              {partnerOrders.filter(o => ['Approved', 'Completed'].includes(o.status)).map((ord) => {
                const gross = (ord.pricePerPlate || 0) * (ord.guests || 0);
                const netAmount = gross * 0.9;
                return (
                  <div key={'pay-'+ord.id} className="bg-white rounded-2xl shadow-2xs border border-slate-150 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Order ID</span>
                        <span className="font-mono text-xs font-bold text-slate-700">#{ord.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <span className="bg-green-50 text-green-700 border border-green-150 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        Paid
                      </span>
                    </div>

                    <div className="border-t border-slate-50 pt-2 text-xs font-medium space-y-1 text-slate-650">
                      <p className="flex justify-between"><span className="text-slate-400">Customer:</span> <span className="font-bold text-slate-800">{ord.customerName}</span></p>
                      <p className="flex justify-between"><span className="text-slate-400">Gross Amount:</span> <span className="font-bold text-slate-800">₹{gross.toLocaleString()}</span></p>
                      <p className="flex justify-between"><span className="text-slate-400">Platform Fee (10%):</span> <span className="font-semibold text-rose-600">-₹{(gross*0.1).toFixed(0)}</span></p>
                      <p className="flex justify-between border-t border-dashed border-slate-100 pt-2 mt-1 text-sm font-bold"><span className="text-[#0F3D2E]">Net Payout:</span> <span className="text-[#0F3D2E]">₹{netAmount.toLocaleString()}</span></p>
                    </div>
                  </div>
                );
              })}

              {partnerOrders.filter(o => ['Approved', 'Completed'].includes(o.status)).length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-150 p-10 text-center py-12">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <CreditCard size={24} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700">No transactions</p>
                  <p className="text-xs text-slate-400 mt-1">Confirmed payouts will be listed here.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-4 left-4 right-4 z-50 select-none">
        <div className="bg-[#111111] rounded-[2rem] p-2 px-3 flex justify-between items-center shadow-2xl border border-white/5">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-[#DEAA38] text-slate-950 font-black shadow-lg" 
                    : "text-slate-400 hover:text-white"
                )}
                id={`mobile-bottom-nav-${item.id}`}
              >
                <div className="relative">
                  <item.icon size={18} className={isActive ? "scale-110" : ""} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-[#DEAA38] text-slate-950 text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#111111]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] mt-1 font-extrabold tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer/Sidebar triggered by Hamburger button */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            
            {/* Sidebar drawer panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-slate-950 text-white z-50 flex flex-col p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-6 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-gold-500 p-1.5 rounded-xl text-white">
                    <ChefHat size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-white leading-none">CaterNest</span>
                    <span className="text-[7.5px] uppercase tracking-widest text-brand-gold-500 font-black leading-none mt-0.5">PORTAL</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation items list */}
              <div className="flex-1 overflow-y-auto py-6 space-y-1.5 custom-sidebar-scrollbar">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-sm",
                        isActive 
                          ? "bg-brand-gold-500 text-slate-950 shadow-lg shadow-brand-gold-500/10" 
                          : "hover:bg-slate-900 text-slate-300 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full",
                          isActive ? "bg-slate-950 text-brand-gold-500" : "bg-brand-gold-500 text-slate-950"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Log out option inside mobile drawer */}
              <div className="pt-6 border-t border-slate-900">
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl font-bold transition-colors text-sm"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
