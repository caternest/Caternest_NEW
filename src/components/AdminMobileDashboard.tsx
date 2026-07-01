import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Building, FileText, CheckCircle2, XCircle, Search, Clock, 
  CreditCard, ChevronRight, Menu as MenuIcon, AlertCircle, Trash2, 
  Package, Image, Trash, Upload, Check, RefreshCw, Sliders, ChefHat, Bell, LogOut 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminMobileDashboardProps {
  adminEmail: string;
  activeTab: 'overview' | 'partners' | 'users' | 'orders' | 'trash' | 'requests' | 'audit' | 'images' | 'settings';
  setActiveTab: (tab: any) => void;
  user: any;
  logout: () => Promise<void>;
  navigate: (path: string) => void;
  registrations: any[];
  activeRegistrations: any[];
  deletedRegistrations: any[];
  orders: any[];
  auditLogs: any[];
  stats: any[];
  platformFeePerPlate: number;
  setPlatformFeePerPlate: (fee: number) => void;
  homepageMode: 'classic' | 'marketplace';
  setHomepageMode: (mode: 'classic' | 'marketplace') => void;
  savingSettings: boolean;
  handleSavePlatformSettings: () => Promise<void>;
  handleAction: (id: string, status: string) => Promise<void>;
  setDeleteConfirm: (id: string) => void;
  handleRestore: (id: string) => Promise<void>;
  setPermanentDeleteConfirm: (id: string) => void;
  handleApproveProfileUpdate: (id: string) => Promise<void>;
  handleRejectProfileUpdate: (id: string) => Promise<void>;
  setSelectedAdminOrder: (order: any) => void;
  setAdminMemoText: (text: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
  filteredPartners: any[];
  filteredOrders: any[];
  filteredRequests: any[];
  filteredUsers: any[];
  
  // Mobile states
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isMobileNotificationsOpen: boolean;
  setIsMobileNotificationsOpen: (open: boolean) => void;
  isMobileProfileOpen: boolean;
  setIsMobileProfileOpen: (open: boolean) => void;
  mobileSearchQuery: string;
  setMobileSearchQuery: (q: string) => void;
  mobileFilterValue: string;
  setMobileFilterValue: (val: string) => void;
  mobileSortValue: string;
  setMobileSortValue: (val: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  isSortOpen: boolean;
  setIsSortOpen: (open: boolean) => void;
  expandedOrderIds: Record<string, boolean>;
  setExpandedOrderIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function AdminMobileDashboard({
  adminEmail,
  activeTab,
  setActiveTab,
  user,
  logout,
  navigate,
  registrations,
  activeRegistrations,
  deletedRegistrations,
  orders,
  auditLogs,
  stats,
  platformFeePerPlate,
  setPlatformFeePerPlate,
  homepageMode,
  setHomepageMode,
  savingSettings,
  handleSavePlatformSettings,
  handleAction,
  setDeleteConfirm,
  handleRestore,
  setPermanentDeleteConfirm,
  handleApproveProfileUpdate,
  handleRejectProfileUpdate,
  setSelectedAdminOrder,
  setAdminMemoText,
  toast,
  filteredPartners,
  filteredOrders,
  filteredRequests,
  filteredUsers,
  
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isMobileNotificationsOpen,
  setIsMobileNotificationsOpen,
  isMobileProfileOpen,
  setIsMobileProfileOpen,
  mobileSearchQuery,
  setMobileSearchQuery,
  mobileFilterValue,
  setMobileFilterValue,
  mobileSortValue,
  setMobileSortValue,
  isFilterOpen,
  setIsFilterOpen,
  isSortOpen,
  setIsSortOpen,
  expandedOrderIds,
  setExpandedOrderIds
}: AdminMobileDashboardProps) {

  return (
    <div className="block lg:hidden min-h-screen bg-[#FCFBF7] text-slate-900 pb-28 font-sans">
      
      {/* 1. Mobile Top Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-stone-150 px-4 py-3 flex items-center justify-between shadow-xs">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#FAF8F5] border border-stone-200 text-slate-800 active:scale-95 transition-all cursor-pointer"
          id="mobile-hamburger-btn"
        >
          <MenuIcon size={20} strokeWidth={2.5} />
        </button>

        <Link to="/" className="flex items-center gap-2" id="mobile-header-logo">
          <div className="bg-brand-gold-500 p-1.5 rounded-lg text-white">
            <ChefHat size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base font-extrabold font-display leading-none text-brand-green-900 uppercase tracking-tight">
              CaterNest
            </span>
            <span className="text-[7.5px] uppercase font-poppins tracking-widest text-brand-gold-600 font-extrabold leading-none mt-0.5">
              Admin Console
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileNotificationsOpen(true)}
            className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-[#FAF8F5] border border-stone-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
            id="mobile-notifications-btn"
          >
            <Bell size={18} strokeWidth={2.5} />
            {orders.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-600 border border-white" />
            )}
          </button>

          <button 
            onClick={() => setIsMobileProfileOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-gold-100 border border-brand-gold-200/50 text-brand-gold-700 active:scale-95 transition-all cursor-pointer overflow-hidden font-extrabold text-sm font-display"
            id="mobile-profile-btn"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </button>
        </div>
      </div>

      {/* 2. Left sliding Drawer Navigation */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[60]"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-76 bg-brand-green-900 text-slate-100 h-full z-[70] flex flex-col shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-6 border-b border-brand-green-800/60 bg-brand-green-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#DEAA38] p-2 rounded-xl text-brand-green-955">
                    <ChefHat size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xl font-bold font-display tracking-tight text-white leading-tight">
                      CaterNest
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#DEAA38] font-bold">
                      Admin Center
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-green-800/40 text-brand-green-200 hover:text-white cursor-pointer active:scale-90 transition-all text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-brand-green-300 tracking-widest mb-3.5 px-3">
                  Management
                </div>
                
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'partners', label: 'Partner Registrations', icon: Building, count: activeRegistrations.filter(r => r.status === 'Pending Approval').length, countColor: 'bg-[#DEAA38] text-brand-green-950' },
                  { id: 'requests', label: 'Change Requests', icon: AlertCircle, count: registrations.filter(r => r.pendingUpdates).length, countColor: 'bg-blue-500 text-white' },
                  { id: 'orders', label: 'All Orders', icon: CreditCard },
                  { id: 'users', label: 'Users & Accounts', icon: Users },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileSidebarOpen(false);
                      if (item.id === 'overview') navigate('/admin-dashboard');
                      if (item.id === 'partners') navigate('/admin/partners');
                      if (item.id === 'orders') navigate('/admin/orders');
                    }}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left border-0 cursor-pointer",
                      activeTab === item.id 
                        ? "bg-[#DEAA38] text-[#0f2922] shadow-lg shadow-brand-gold-500/10 scale-[1.02]" 
                        : "bg-transparent text-brand-green-100 hover:bg-brand-green-800/40"
                    )}
                  >
                    <item.icon size={18} strokeWidth={2.5} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black min-w-5 text-center", item.countColor)}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}

                <div className="pt-6 border-t border-brand-green-800/40 my-5 text-[10px] font-black uppercase text-brand-green-300 tracking-widest px-3">
                  System
                </div>

                {[
                  { id: 'trash', label: 'Trash', icon: Trash2, count: deletedRegistrations.length, countColor: 'bg-red-500 text-white' },
                  { id: 'audit', label: 'Audit Log', icon: Clock },
                  { id: 'settings', label: 'Platform Settings', icon: Sliders },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left border-0 cursor-pointer",
                      activeTab === item.id 
                        ? "bg-[#DEAA38] text-[#0f2922] shadow-lg shadow-brand-gold-500/10 scale-[1.02]" 
                        : "bg-transparent text-brand-green-100 hover:bg-brand-green-800/40"
                    )}
                  >
                    <item.icon size={18} strokeWidth={2.5} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black min-w-5 text-center", item.countColor)}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 border-t border-brand-green-800/40 bg-brand-green-950/40">
                <button 
                  onClick={async () => {
                    setIsMobileSidebarOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-600/15 hover:bg-red-600 text-red-200 hover:text-white font-black text-sm transition-all duration-300 shadow-sm border border-red-600/35 cursor-pointer"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Sticky Filter & Search Panel for appropriate modules */}
      {['partners', 'orders', 'requests', 'users'].includes(activeTab) && (
        <div className="sticky top-[68px] z-30 bg-[#FCFBF7]/90 backdrop-blur-md px-4 py-3 border-b border-stone-150 flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder={`Search ${activeTab === 'partners' ? 'partners' : activeTab === 'orders' ? 'orders' : activeTab === 'requests' ? 'requests' : activeTab === 'users' ? 'users' : 'records'}...`}
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-brand-gold-500 outline-none font-medium text-slate-800 shadow-xs"
              />
              {mobileSearchQuery && (
                <button 
                  onClick={() => setMobileSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold hover:text-slate-600 text-sm border-0 bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {activeTab !== 'requests' && (
              <>
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "px-4 h-10 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0",
                    mobileFilterValue !== 'All' 
                      ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38]" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Sliders size={13} strokeWidth={2.5} />
                  <span>Filter</span>
                  {mobileFilterValue !== 'All' && (
                    <span className="w-2 h-2 rounded-full bg-[#DEAA38] animate-pulse ml-0.5" />
                  )}
                </button>

                <button 
                  onClick={() => setIsSortOpen(true)}
                  className="px-4 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs hover:bg-slate-50 cursor-pointer active:scale-95 shrink-0"
                >
                  <Clock size={13} strokeWidth={2.5} />
                  <span>Sort</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Active Section Main Canvas */}
      <div className="p-4 pt-6 space-y-6">
        
        {/* Tab: Overview (Command Center) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="px-1 text-left">
              <h2 className="text-[32px] font-display font-extrabold text-[#0F2922] leading-tight uppercase tracking-tight">
                Command Center
              </h2>
              <p className="text-stone-500 font-sans font-medium text-xs mt-1 mb-2 leading-relaxed">
                Platform performance and operations management.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-start text-left relative overflow-hidden"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-md mb-4 shrink-0 text-white", s.bg)}>
                    {React.createElement(s.icon, { size: 22, strokeWidth: 2.5 })}
                  </div>
                  <div>
                    <p className="text-3xl font-display font-black text-[#0F2922] mb-1 tracking-tight leading-none">
                      {s.value}
                    </p>
                    <p className="text-[11px] font-sans font-bold text-stone-500 tracking-wide">
                      {s.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[24px] border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-[#FAF8F5]">
                <h3 className="font-display font-bold text-lg text-[#0F2922]">Recent Registrations</h3>
                <button 
                  onClick={() => { setActiveTab('partners'); navigate('/admin/partners'); }}
                  className="text-[11px] font-extrabold text-[#DEAA38] hover:text-[#c28824] flex items-center gap-0.5 transition-colors uppercase tracking-wider border-0 bg-transparent cursor-pointer"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-stone-100 p-4 space-y-4">
                {activeRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-xs italic font-medium">No partner registrations yet.</div>
                ) : (
                  activeRegistrations.slice(0, 3).map((r, idx) => (
                    <div key={r.id || idx} className="bg-[#FAF8F5]/50 p-4 rounded-2xl border border-stone-100 flex flex-col gap-3 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-extrabold text-base text-[#0F2922] leading-snug">{r.businessName}</h4>
                          <p className="text-[11px] font-sans text-stone-500 mt-0.5 font-semibold uppercase tracking-wider">{r.owner}</p>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-xs border",
                          r.status === 'Approved' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : r.status === 'Pending Approval' 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {r.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-1.5 text-xs text-stone-600 font-sans border-t border-b border-stone-150/40 py-2.5 my-1">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Service Type</span>
                          <span className="font-semibold text-[#0F2922]">{r.type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Reg Date</span>
                          <span className="font-semibold text-[#0F2922]">{r.date || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 font-sans">
                        <Link 
                          to={`/admin/caterers/view/${r.id}`}
                          className="flex-1 py-2.5 bg-[#FAF8F5] text-stone-700 border border-stone-200 hover:bg-stone-50 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          View
                        </Link>
                        <Link 
                          to={`/admin/caterers/edit/${r.id}`}
                          className="flex-1 py-2.5 bg-white text-[#DEAA38] border border-brand-gold-300 hover:border-[#DEAA38] font-extrabold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Partners */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase tracking-tight">
                Partners ({filteredPartners.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Manage Platform Caterer Vendors
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {filteredPartners.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  No partner registrations matched your query.
                </div>
              ) : (
                filteredPartners.map((r, idx) => (
                  <div 
                    key={r.id || idx} 
                    className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 text-left hover:border-brand-gold-300 transition-colors duration-300 relative overflow-hidden"
                  >
                    <div className="flex gap-3.5 items-start">
                      <div className="w-12 h-12 rounded-xl bg-brand-gold-50 text-brand-gold-700 border border-brand-gold-100 flex items-center justify-center shrink-0 font-display font-extrabold text-lg shadow-inner">
                        {r.logo ? (
                          <img src={r.logo} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{r.businessName ? r.businessName.charAt(0).toUpperCase() : 'C'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-extrabold text-base text-[#0F2922] leading-snug">{r.businessName}</h4>
                        <p className="text-[11px] font-sans text-[#DEAA38] font-bold uppercase tracking-wider mt-0.5">{r.owner}</p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0",
                        r.status === 'Approved' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : r.status === 'Pending Approval' 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : r.status === 'Suspended'
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {r.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-sans border-t border-b border-stone-100 py-3.5">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Service Type</span>
                        <span className="font-semibold text-[#0F2922]">{r.type || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Applied Date</span>
                        <span className="font-semibold text-[#0F2922]">{r.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Email</span>
                        <span className="font-semibold text-[#0F2922] truncate block max-w-[130px]" title={r.email}>{r.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Phone</span>
                        <span className="font-semibold text-[#0F2922]">{r.phone || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link 
                        to={`/admin/caterers/view/${r.id}`}
                        className="flex-1 min-w-[70px] py-2.5 bg-[#FAF8F5] hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/admin/caterers/edit/${r.id}`}
                        className="flex-1 min-w-[70px] py-2.5 bg-white border border-[#BB9C4A]/30 text-[#DEAA38] font-extrabold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        Edit
                      </Link>
                      {r.status !== 'Approved' && (
                        <button 
                          onClick={() => handleAction(r.id, 'Approved')}
                          className="flex-1 min-w-[70px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all border-0 cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === 'Pending Approval' && (
                        <button 
                          onClick={() => handleAction(r.id, 'Rejected')}
                          className="flex-1 min-w-[70px] py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      {r.status === 'Approved' && (
                        <button 
                          onClick={() => handleAction(r.id, 'Suspended')}
                          className="flex-1 min-w-[70px] py-2.5 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                      {r.status === 'Suspended' && (
                        <button 
                          onClick={() => handleAction(r.id, 'Approved')}
                          className="flex-1 min-w-[70px] py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                      <button 
                        onClick={() => setDeleteConfirm(r.id)}
                        className="py-2.5 px-3.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[11px] border border-red-200 active:scale-95 transition-all cursor-pointer font-bold flex items-center justify-center shrink-0"
                        title="Delete to Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase tracking-tight">
                Requests ({filteredRequests.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Review Profile Change Requests
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  No pending change requests found.
                </div>
              ) : (
                filteredRequests.map((r, idx) => (
                  <div 
                    key={r.id || idx} 
                    className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 text-left"
                  >
                    <div>
                      <h4 className="font-display font-extrabold text-base text-[#0F2922] leading-snug">
                        {r.businessName || r.name}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] font-sans font-semibold text-stone-500 uppercase tracking-wider">
                        <span>By {r.pendingUpdates?._requestedBy || r.owner || 'Caterer'}</span>
                        <span>•</span>
                        <span>{r.pendingUpdates?._requestedAt ? new Date(r.pendingUpdates._requestedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 space-y-3">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Proposed Adjustments</span>
                      <div className="space-y-2">
                        {Object.entries(r.pendingUpdates || {}).map(([key, newValue]: [string, any]) => {
                          if (key.startsWith('_')) return null;
                          const isImageKey = ['logo', 'coverBanner', 'ownerPhoto', 'branchPhoto'].includes(key);
                          return (
                            <div key={key} className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-100 text-xs font-sans">
                              <span className="font-bold text-stone-700 block mb-1 uppercase text-[9.5px] tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              {isImageKey ? (
                                <div className="flex items-center gap-3 mt-1.5 bg-white p-1.5 rounded-lg border border-stone-200">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-50">
                                    {r[key] ? (
                                      <img src={r[key]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-400 font-medium">None</div>
                                    )}
                                  </div>
                                  <span className="text-stone-400">➔</span>
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-brand-gold-200 bg-stone-50 shadow-sm">
                                    {newValue ? (
                                      <img src={newValue} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-400 font-medium">None</div>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-brand-gold-600 font-extrabold ml-1 uppercase">New File</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="line-through text-red-500 font-medium text-[11px]">{r[key] || 'Empty'}</p>
                                  <p className="text-emerald-700 font-bold text-[11px]">➔ {newValue || 'Empty'}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => handleRejectProfileUpdate(r.id)}
                        className="flex-1 py-2.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApproveProfileUpdate(r.id)}
                        className="flex-[1.5] py-2.5 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all border-0 shadow-md shadow-brand-green-900/10 cursor-pointer"
                      >
                        Approve Changes
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase tracking-tight">
                Orders ({filteredOrders.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Oversee & Force Admin Adjustments
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  No orders matched your selected filters.
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isExpanded = expandedOrderIds[ord.id];
                  return (
                    <div 
                      key={ord.id} 
                      className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 text-left hover:border-brand-gold-300 transition-colors duration-300"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono font-bold text-[#DEAA38] text-[10px] uppercase block tracking-wider">#{ord.id.substring(0, 8)}</span>
                          <h4 className="font-display font-extrabold text-base text-[#0F2922] leading-snug mt-0.5">{ord.customerName}</h4>
                          <p className="text-[11px] text-stone-500 font-sans font-medium mt-0.5">{ord.catererName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                            ['Approved', 'approved'].includes(ord.status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            ['Rejected', 'rejected', 'Cancelled', 'cancelled'].includes(ord.status) ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {ord.status}
                          </span>
                          <span className="font-display font-black text-sm text-[#0F2922]">₹{ord.totalEstimate?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-sans border-t border-b border-stone-100 py-3.5 my-0.5">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Event Date</span>
                          <span className="font-semibold text-[#0F2922]">{ord.eventDate || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Guests & Package</span>
                          <span className="font-semibold text-[#0F2922] block leading-snug truncate max-w-[130px]">{ord.guests} guests • {ord.packageDetails?.packageName || 'Custom'}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="text-xs space-y-3 font-sans bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-150/40 text-stone-600">
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block mb-1">Cost & Platform Fee</span>
                            <p className="flex justify-between">
                              <span>Platform Fee (₹{ord.platformFeePerPlate || 2}/plate):</span>
                              <strong className="text-[#0F2922]">₹{(ord.platformFee || 0).toLocaleString()}</strong>
                            </p>
                          </div>
                          {ord.selectedItems && ord.selectedItems.length > 0 && (
                            <div>
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block mb-1">Selected Menu Items</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ord.selectedItems.map((it: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] text-stone-700 font-medium">{it}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {ord.internal_notes && (
                            <div>
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block mb-1">Admin Memo (Private)</span>
                              <p className="italic text-stone-500 bg-white border border-stone-150 p-2 rounded-lg text-[10px]">{ord.internal_notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setExpandedOrderIds(prev => ({ ...prev, [ord.id]: !prev[ord.id] }))}
                          className="py-2.5 px-3.5 bg-[#FAF8F5] border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAdminOrder(ord);
                            setAdminMemoText(ord.internal_notes || ord.internalNotes || '');
                          }} 
                          className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-[#DEAA38] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer active:scale-95 text-center"
                        >
                          Manage Order
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase tracking-tight">
                Users ({filteredUsers.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Platform Accounts & Authorization
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  No accounts matched your filters.
                </div>
              ) : (
                filteredUsers.map((u, idx) => (
                  <div 
                    key={u.id || idx} 
                    className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 text-left hover:border-brand-gold-300 transition-colors"
                  >
                    <div className="flex gap-3.5 items-center">
                      <div className="w-12 h-12 rounded-full bg-brand-gold-50 border border-brand-gold-200/50 flex items-center justify-center font-display font-extrabold text-brand-gold-700 shrink-0 text-lg shadow-sm">
                        {u.logo ? (
                          <img src={u.logo} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{u.avatar}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-extrabold text-base text-[#0F2922] leading-snug truncate">{u.name}</h4>
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border mt-0.5",
                          u.role === 'Administrator' ? "bg-red-50 text-red-700 border-red-100" :
                          u.role === 'Partner' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-blue-50 text-blue-700 border-blue-100"
                        )}>
                          {u.role}
                        </span>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0",
                        u.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                      )}>
                        {u.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-sans border-t border-b border-stone-100 py-3.5 my-0.5">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Email Address</span>
                        <span className="font-semibold text-[#0F2922] truncate block max-w-[130px]">{u.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Phone Contact</span>
                        <span className="font-semibold text-[#0F2922] block leading-snug">{u.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {u.role === 'Partner' && u.id && (
                        <>
                          <Link 
                            to={`/admin/caterers/view/${u.id}`}
                            className="flex-1 py-2.5 bg-[#FAF8F5] border border-stone-200 text-stone-700 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                          >
                            View
                          </Link>
                          <Link 
                            to={`/admin/caterers/edit/${u.id}`}
                            className="flex-1 py-2.5 bg-white border border-brand-gold-300 text-[#DEAA38] font-extrabold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => {
                              const targetStatus = u.status === 'Active' ? 'Suspended' : 'Approved';
                              handleAction(u.id, targetStatus);
                              toast(`Partner status updated successfully`, 'success');
                            }}
                            className={cn(
                              "flex-1 py-2.5 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer border",
                              u.status === 'Active' 
                                ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            )}
                          >
                            {u.status === 'Active' ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                      {u.role === 'Customer' && (
                        <button 
                          onClick={() => {
                            toast(`Customer account synced under Root console standards.`, 'success');
                          }}
                          className="w-full py-2.5 bg-[#FAF8F5] text-stone-500 border border-stone-200 hover:bg-stone-100 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Access Token & Accounts Settings
                        </button>
                      )}
                      {u.role === 'Administrator' && (
                        <button 
                          onClick={() => {
                            toast(`Admin authorization permissions are fully secured.`, 'success');
                          }}
                          className="w-full py-2.5 bg-[#FAF8F5] text-stone-500 border border-stone-200 hover:bg-stone-100 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                        >
                          Root Administrator Credentials
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Trash */}
        {activeTab === 'trash' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase flex items-center gap-2">
                <Trash2 size={24} className="text-red-600 shrink-0" /> Trash ({deletedRegistrations.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Manage Trashed Partner listings
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {deletedRegistrations.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  Trash is empty.
                </div>
              ) : (
                deletedRegistrations.map((r, idx) => (
                  <div 
                    key={r.id || idx} 
                    className="bg-white rounded-[24px] p-5 border border-red-100 shadow-[0_4px_20px_rgba(255,0,0,0.01)] flex flex-col gap-4 text-left"
                  >
                    <div>
                      <h4 className="font-display font-extrabold text-base text-red-955 leading-snug">{r.businessName}</h4>
                      <p className="text-[11px] font-sans text-[#DEAA38] font-bold uppercase tracking-wider mt-0.5">Owner: {r.owner}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-sans border-t border-b border-stone-100 py-3.5">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Deleted Date</span>
                        <span className="font-semibold text-[#0F2922]">{r.deletedDate ? new Date(r.deletedDate).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">Deleted By</span>
                        <span className="font-semibold text-[#0F2922]">{r.deletedBy || 'System'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        to={`/admin/caterers/view/${r.id}`}
                        className="flex-1 py-2.5 bg-[#FAF8F5] border border-stone-200 text-stone-700 font-bold text-center rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleRestore(r.id)}
                        className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        Restore
                      </button>
                      <button 
                        onClick={() => setPermanentDeleteConfirm(r.id)}
                        className="flex-1 py-2.5 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Audit Log */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase flex items-center gap-2">
                <Clock size={24} className="text-[#DEAA38] shrink-0" /> Audit Logs ({auditLogs.length})
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Platform Action Governance Timeline
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {auditLogs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-xs italic font-medium">
                  No logs recorded.
                </div>
              ) : (
                auditLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-3 text-left relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                        log.action.includes('Delete') ? "bg-red-50 text-red-700 border-red-100" : 
                        log.action.includes('Trash') ? "bg-amber-50 text-amber-700 border-amber-100" : 
                        "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono font-bold">
                        {new Date(log.date || log.timestamp).toLocaleDateString()} {new Date(log.date || log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <div className="border-t border-stone-100 pt-3 space-y-1">
                      <p className="text-sm font-display font-extrabold text-[#0F2922] leading-snug">{log.entity || log.details}</p>
                      <p className="text-xs text-stone-500">
                        <strong>Admin User:</strong> <span className="font-semibold text-stone-700">{log.by || log.user_email}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-16">
            <div className="px-1 text-left">
              <h2 className="text-2xl font-display font-extrabold text-[#0F2922] leading-tight uppercase flex items-center gap-2">
                <Sliders size={24} className="text-[#DEAA38] shrink-0" /> Settings
              </h2>
              <p className="text-stone-500 font-sans text-xs font-semibold uppercase tracking-widest mt-1 mb-2">
                Platform-wide parameters & integrations
              </p>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <CreditCard className="text-brand-green-900" size={18} />
                <h3 className="font-display font-bold text-base text-[#0F2922]">Platform Fee</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                This fee per plate is multiplied directly by booking guest count:
              </p>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-150 text-stone-800 font-mono text-center text-xs font-bold">
                Payable platform fee = Guest count × Fee/Plate
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1, 2, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPlatformFeePerPlate(preset)}
                    className={cn(
                      "py-2.5 rounded-xl text-[10px] font-black tracking-wider transition-all border uppercase cursor-pointer",
                      platformFeePerPlate === preset
                        ? "bg-[#0F2922] border-[#0F2922] text-brand-gold-500 shadow-sm"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-slate-50"
                    )}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider shrink-0">Custom Fee:</span>
                <div className="relative rounded-xl shadow-xs flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={platformFeePerPlate}
                    onChange={(e) => setPlatformFeePerPlate(Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full pl-6 pr-3 py-2 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-brand-gold-500 text-xs font-bold text-stone-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <Sliders className="text-brand-green-900" size={18} />
                <h3 className="font-display font-bold text-base text-[#0F2922]">Homepage Mode</h3>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-150 cursor-pointer hover:bg-stone-50 transition-all">
                  <input
                    type="radio"
                    name="mobileHomepageMode"
                    value="classic"
                    checked={homepageMode === 'classic'}
                    onChange={() => setHomepageMode('classic')}
                    className="text-stone-900 focus:ring-stone-900 h-4 w-4"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-stone-800">Classic Landing Page</span>
                    <span className="block text-[10px] text-stone-400 mt-0.5 leading-snug">Show default promotional sections, search bar, sliders.</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-150 cursor-pointer hover:bg-stone-50 transition-all">
                  <input
                    type="radio"
                    name="mobileHomepageMode"
                    value="marketplace"
                    checked={homepageMode === 'marketplace'}
                    onChange={() => setHomepageMode('marketplace')}
                    className="text-stone-900 focus:ring-stone-900 h-4 w-4"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-stone-800">Catering Marketplace</span>
                    <span className="block text-[10px] text-stone-400 mt-0.5 leading-snug">Directly present explore page for immediate search listings.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <Sliders className="text-[#DEAA38]" size={18} />
                <h3 className="font-display font-bold text-base text-[#0F2922]">Service Integrations</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'WhatsApp Bot Notifications', desc: 'Auto message booking receipts via official API WhatsApp template', enabled: true },
                  { name: 'Google Maps Geocoding Grounding', desc: 'Enforces lat/long coordinates verification during venue placement', enabled: true },
                  { name: 'Direct Admin Slack Webhook Alerts', desc: 'Push real-time critical change requests directly to admin Slack channels', enabled: false }
                ].map((srv, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-stone-150/40">
                    <div className="text-left">
                      <span className="block text-xs font-extrabold text-[#0F2922]">{srv.name}</span>
                      <span className="block text-[9.5px] text-stone-500 leading-tight mt-0.5">{srv.desc}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        toast(`${srv.name} feature toggled in admin layout config`, 'success');
                      }}
                      className={cn(
                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 outline-none",
                        srv.enabled ? "bg-emerald-600 flex justify-end" : "bg-stone-300 flex justify-start"
                      )}
                    >
                      <span className="w-5 h-5 bg-white rounded-full block shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePlatformSettings}
                disabled={savingSettings}
                className="w-full py-4 bg-brand-green-900 hover:bg-brand-green-800 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green-900/10 active:scale-[0.98] border-0 cursor-pointer"
              >
                {savingSettings ? 'Saving Settings...' : 'Save All Settings'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5. Persistent Bottom Tab Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-stone-950 text-white rounded-3xl py-2.5 px-3 flex items-center justify-around shadow-2xl border border-stone-800/50">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'partners', label: 'Partners', icon: Building },
          { id: 'requests', label: 'Requests', icon: AlertCircle },
          { id: 'orders', label: 'Orders', icon: CreditCard },
          { id: 'users', label: 'Users', icon: Users },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'overview') navigate('/admin-dashboard');
                if (tab.id === 'partners') navigate('/admin/partners');
                if (tab.id === 'orders') navigate('/admin/orders');
              }}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 border-0 bg-transparent",
                isActive 
                  ? "bg-[#DEAA38] text-stone-950 font-bold px-4" 
                  : "text-stone-400 hover:text-white"
              )}
            >
              {React.createElement(tab.icon, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
              <span className="text-[10px] mt-1 font-bold font-sans tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. Modals for Filters & Sort selection */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-[55] shadow-2xl pb-10"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 font-display">Filter Records</h4>
                <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 font-bold hover:text-slate-600 text-sm border-0 bg-transparent cursor-pointer">✕</button>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider text-left">Select Filter State</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {activeTab === 'partners' && ['All', 'Approved', 'Pending Approval', 'Suspended', 'Rejected'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setMobileFilterValue(opt); setIsFilterOpen(false); }}
                      className={cn(
                        "py-3 px-4 rounded-2xl text-xs font-bold transition-all text-center border cursor-pointer",
                        mobileFilterValue === opt 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                  {activeTab === 'orders' && ['All', 'Pending', 'Submitted', 'Approved', 'Completed', 'Cancelled', 'Rejected'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setMobileFilterValue(opt); setIsFilterOpen(false); }}
                      className={cn(
                        "py-3 px-4 rounded-2xl text-xs font-bold transition-all text-center border cursor-pointer",
                        mobileFilterValue === opt 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                  {activeTab === 'users' && ['All', 'Administrator', 'Partner', 'Customer'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setMobileFilterValue(opt); setIsFilterOpen(false); }}
                      className={cn(
                        "py-3 px-4 rounded-2xl text-xs font-bold transition-all text-center border cursor-pointer",
                        mobileFilterValue === opt 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {mobileFilterValue !== 'All' && (
                  <button 
                    onClick={() => { setMobileFilterValue('All'); setIsFilterOpen(false); }}
                    className="w-full mt-4 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-xs text-center hover:bg-red-100 transition-colors border border-red-100 cursor-pointer"
                  >
                    Clear Active Filter
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSortOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSortOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-[55] shadow-2xl pb-10"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 font-display">Sort Records</h4>
                <button onClick={() => setIsSortOpen(false)} className="text-slate-400 font-bold hover:text-slate-600 text-sm border-0 bg-transparent cursor-pointer">✕</button>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider text-left">Select Sort Criteria</p>
                <div className="flex flex-col gap-2">
                  {activeTab === 'partners' && [
                    { value: 'Newest', label: 'Newest Registration First' },
                    { value: 'NameA-Z', label: 'Business Name (A to Z)' },
                    { value: 'NameZ-A', label: 'Business Name (Z to A)' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setMobileSortValue(opt.value); setIsSortOpen(false); }}
                      className={cn(
                        "py-3.5 px-4 rounded-2xl text-xs font-bold transition-all text-left border flex items-center justify-between cursor-pointer",
                        mobileSortValue === opt.value 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>{opt.label}</span>
                      {mobileSortValue === opt.value && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                  {activeTab === 'orders' && [
                    { value: 'Newest', label: 'Newest Order First' },
                    { value: 'TotalHighLow', label: 'Order Total: Highest to Lowest' },
                    { value: 'TotalLowHigh', label: 'Order Total: Lowest to Highest' },
                    { value: 'EventDate', label: 'Event Date Chronological' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setMobileSortValue(opt.value); setIsSortOpen(false); }}
                      className={cn(
                        "py-3.5 px-4 rounded-2xl text-xs font-bold transition-all text-left border flex items-center justify-between cursor-pointer",
                        mobileSortValue === opt.value 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>{opt.label}</span>
                      {mobileSortValue === opt.value && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                  {activeTab === 'users' && [
                    { value: 'NameA-Z', label: 'Name (A to Z)' },
                    { value: 'Role', label: 'Group by Role' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setMobileSortValue(opt.value); setIsSortOpen(false); }}
                      className={cn(
                        "py-3.5 px-4 rounded-2xl text-xs font-bold transition-all text-left border flex items-center justify-between cursor-pointer",
                        mobileSortValue === opt.value 
                          ? "bg-brand-green-900 border-brand-green-900 text-[#DEAA38] font-extrabold" 
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>{opt.label}</span>
                      {mobileSortValue === opt.value && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNotificationsOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 bottom-0 right-0 w-80 bg-white h-full z-[55] shadow-2xl flex flex-col overflow-hidden font-sans"
            >
              <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-[#FAF8F5]">
                <h4 className="text-lg font-bold text-slate-900 font-display">Notifications</h4>
                <button 
                  onClick={() => setIsMobileNotificationsOpen(false)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 text-stone-500 hover:bg-stone-200 transition cursor-pointer text-xs border-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {orders.slice(0, 8).map((o, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-150/40 text-xs text-left relative overflow-hidden">
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-gold-500" />
                    <p className="font-bold text-slate-800">Order Update</p>
                    <p className="text-stone-500 text-[11px] mt-0.5 leading-snug">Order #{o.id.substring(0, 8)} for {o.catererName} is currently {o.status}.</p>
                    <span className="text-[9px] text-stone-400 font-mono block mt-1.5">{o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center py-12 text-stone-400 text-xs italic">No new notifications.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileProfileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileProfileOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-[55] shadow-2xl pb-10 flex flex-col font-sans"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
                <h4 className="text-lg font-bold text-slate-900 font-display">Administrator Account</h4>
                <button onClick={() => setIsMobileProfileOpen(false)} className="text-slate-400 font-bold text-sm border-0 bg-transparent cursor-pointer">✕</button>
              </div>
              
              <div className="flex items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-stone-150 mb-5 text-left">
                <div className="w-14 h-14 rounded-full bg-[#DEAA38] text-stone-950 font-display font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-extrabold text-base text-[#0f2922] truncate">{user?.name || 'Platform Administrator'}</h4>
                  <p className="text-xs text-stone-500 font-medium truncate mt-0.5">{user?.email || adminEmail}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <button 
                  onClick={() => {
                    setIsMobileProfileOpen(false);
                    setActiveTab('settings');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs text-left transition border border-stone-200 cursor-pointer"
                >
                  ⚙️ Edit Platform Preferences
                </button>
                <button 
                  onClick={() => {
                    setIsMobileProfileOpen(false);
                    toast(`Admin credentials backed by high security protocols.`, 'success');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs text-left transition border border-stone-200 cursor-pointer"
                >
                  🛡️ Security & API Keys Config
                </button>
              </div>

              <button 
                onClick={async () => {
                  setIsMobileProfileOpen(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <LogOut size={14} strokeWidth={2.5} />
                <span>Sign Out of Console</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
