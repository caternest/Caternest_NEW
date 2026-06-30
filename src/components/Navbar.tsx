import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, safeSaveRegistrations } from '../lib/utils';
import { ChefHat, Menu, X, LogOut, Settings, Handshake, ShoppingBag, Building, Bell, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [registrations, setRegistrations] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('registrations');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const fetchRegistrations = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('caterer_registrations')
          .select('*');
        if (!error && data) {
          setRegistrations(data);
          safeSaveRegistrations(data);
        }
      } catch (err) {
        console.error("Failed to fetch registrations in Navbar:", err);
      }
    }
  };

  const hasCatererBusinesses = React.useMemo(() => {
    if (!user) return false;
    return registrations.some((r: any) => 
      (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) 
      && r.status !== 'Deleted'
    );
  }, [user, registrations]);

  const hasApprovedCatererBusiness = React.useMemo(() => {
    if (!user) return false;
    return registrations.some((r: any) => 
      (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) 
      && r.status === 'Approved'
    );
  }, [user, registrations]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Caterers', path: '/explore' },
    { name: 'Become a Caterer', path: '/partner-selection' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleExploreCaterersClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const mode = localStorage.getItem('homepage_mode') || 'classic';
    if (mode === 'marketplace') {
      const isCurrentlyExplorePage = ['/', '/explore', '/explore-caterers'].includes(location.pathname);
      if (isCurrentlyExplorePage) {
        e.preventDefault();
        const element = document.getElementById('explore-marketplace');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const fetchNavbarNotifications = async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('id', { ascending: false });

        if (!error && data) {
          let filtered = data;
          if (user.roles.includes('admin')) {
            filtered = data.filter((n: any) => n.targetRole === 'admin');
          } else if (user.role === 'caterer') {
            const myCatererIds = registrations
              .filter((r: any) => r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase()))
              .map((r: any) => r.id);
            filtered = data.filter((n: any) => n.targetRole === 'caterer' && (myCatererIds.includes(n.catererId) || !n.catererId));
          } else {
            const myOrderIds = JSON.parse(localStorage.getItem('orders') || '[]')
              .filter((o: any) => o.userId === user.id || o.customerEmail?.toLowerCase() === user.email.toLowerCase() || o.customerName === user.name)
              .map((o: any) => o.id);
            filtered = data.filter((n: any) => n.targetRole === 'customer' && (myOrderIds.includes(n.orderId) || !n.orderId));
          }
          setNotifications(filtered);
          return;
        }
      } catch(e) {
        console.error("Supabase notifications loading failed:", e);
      }
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem('notifications') || '[]';
      const parsed = JSON.parse(raw);
      let filtered = parsed;
      if (user.roles.includes('admin')) {
        filtered = parsed.filter((n: any) => n.targetRole === 'admin');
      } else if (user.role === 'caterer') {
        const myCatererIds = registrations
          .filter((r: any) => r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase()))
          .map((r: any) => r.id);
        filtered = parsed.filter((n: any) => n.targetRole === 'caterer' && (myCatererIds.includes(n.catererId) || !n.catererId));
      } else {
        const myOrderIds = JSON.parse(localStorage.getItem('orders') || '[]')
          .filter((o: any) => o.userId === user.id || o.customerEmail?.toLowerCase() === user.email.toLowerCase() || o.customerName === user.name)
          .map((o: any) => o.id);
        filtered = parsed.filter((n: any) => n.targetRole === 'customer' && (myOrderIds.includes(n.orderId) || !n.orderId));
      }
      setNotifications(filtered);
    } catch(e) {}
  };

  useEffect(() => {
    fetchNavbarNotifications();
    fetchRegistrations();

    const supabase = getSupabase();
    if (supabase && user) {
      // Setup real-time postgres changes listener
      const channel = supabase
        .channel('navbar-notifications-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          fetchNavbarNotifications();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Click outside and escaping close implementation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Profile outside close
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        if (!target.closest('[data-keep-profile-open="true"]')) {
          setIsProfileDropdownOpen(false);
        }
      }

      // Notifications outside close
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Closes open segments on navigation change
  useEffect(() => {
    setIsProfileDropdownOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  const handleMarkNavbarNotificationRead = async (id: string, orderId?: string) => {
    // 1. Update localStorage
    try {
      const raw = localStorage.getItem('notifications') || '[]';
      const parsed = JSON.parse(raw);
      const updated = parsed.map((n: any) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notifications', JSON.stringify(updated));
    } catch(e) {}

    // 2. Update Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await (supabase.from('notifications') as any).update({ read: true }).eq('id', id);
      } catch(e) {}
    }

    await fetchNavbarNotifications();

    // 3. Redirect matching roles
    if (user) {
      if (user.roles.includes('admin')) {
        navigate('/admin-dashboard');
      } else if (user.roles.includes('partner')) {
        navigate('/caterer-dashboard');
      } else {
        navigate('/orders');
      }
    }
  };

  const handleClearAllNavbarNotifications = async () => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const idsToRemove = notifications.map(n => n.id);
      const remaining = parsed.filter((n: any) => !idsToRemove.includes(n.id));
      localStorage.setItem('notifications', JSON.stringify(remaining));
    } catch(e) {}

    const supabase = getSupabase();
    if (supabase) {
      try {
        const idsToRemove = notifications.map(n => n.id);
        await (supabase.from('notifications') as any).delete().in('id', idsToRemove);
      } catch(e) {}
    }

    fetchNavbarNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isHome = location.pathname === '/';
  const navClass = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    isScrolled ? 'glass py-3 shadow-sm' : 'bg-white py-5 shadow-sm'
  );

  const textClass = cn(
    'transition-colors font-medium font-poppins text-sm',
    'text-slate-700 hover:text-brand-gold-600 font-bold'
  );

  return (
    <nav className={navClass} id="main-navigation-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center bg-transparent">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" id="navbar-logo-link">
            <div className="bg-brand-gold-500 p-2 rounded-xl text-white group-hover:scale-105 transition-transform">
              <ChefHat size={28} />
            </div>
            <div className="flex flex-col border-l-2 border-brand-green-100 pl-3">
              <span className="text-2xl font-bold font-display tracking-tight text-brand-green-900">
                CaterNest
              </span>
              <span className="text-[9px] uppercase font-poppins tracking-widest text-brand-gold-600 font-semibold">
                Making Every Event Special
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8" id="desktop-links-container">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isExplore = link.name === 'Explore Caterers';
                const isMarketplace = localStorage.getItem('homepage_mode') === 'marketplace';
                
                // Determine destination URL
                const toPath = isExplore && isMarketplace ? '/explore?scroll=true' : link.path;
                
                // Determine active status
                let isActive = location.pathname === link.path;
                if (isExplore) {
                  isActive = location.pathname === '/explore' || location.pathname === '/explore-caterers' || (location.pathname === '/' && isMarketplace);
                } else if (link.name === 'Home') {
                  isActive = location.pathname === '/' && !isMarketplace;
                }

                return (
                  <Link 
                    key={link.name} 
                    to={toPath} 
                    data-keep-profile-open="true" 
                    onClick={isExplore ? handleExploreCaterersClick : undefined}
                    className={cn(textClass, isActive && "text-brand-gold-600")}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-4 border-l pl-6 border-slate-200 relative">
              {user && user.roles.includes('admin') && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-800 text-[10px] uppercase tracking-widest font-bold shadow-sm">
                      Admin Mode
                  </div>
              )}
              {!user ? (
                <div className="flex items-center gap-3" id="navbar-anonymous-actions">
                  <Link to="/caterer-login" className="flex items-center gap-2 px-4 py-2 font-poppins font-medium text-sm text-brand-gold-700 bg-brand-gold-50 hover:bg-brand-gold-100 rounded-full transition-colors border border-brand-gold-100">
                    <ChefHat size={16} /> Caterer Login
                  </Link>
                  <Link to="/login" className="px-4 py-2 font-poppins font-medium text-sm text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-5 py-2 rounded-full font-poppins text-sm font-medium transition-all bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-lg shadow-brand-green-900/20"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4" id="navbar-signed-actions">
                  {/* Real-time sync Bell */}
                  <div className="relative" ref={notificationRef} id="bell-container">
                    <button 
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative p-2 text-slate-500 hover:text-brand-green-900 transition-colors"
                      id="navbar-notification-bell-btn"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[9px] rounded-full border-2 border-white flex items-center justify-center font-bold font-sans">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-105 overflow-hidden z-50 text-slate-900"
                        >
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="font-bold font-display text-sm text-slate-800">Alerts ({unreadCount})</h4>
                            {notifications.length > 0 && (
                              <button onClick={handleClearAllNavbarNotifications} className="text-[10px] text-rose-600 hover:underline font-bold">
                                Clear All
                              </button>
                            )}
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                            {notifications.map((n) => (
                              <div 
                                key={n.id} 
                                onClick={() => handleMarkNavbarNotificationRead(n.id, n.orderId)}
                                className={cn(
                                  "p-3.5 text-left text-xs cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-1",
                                  n.read ? "opacity-75" : "bg-brand-gold-50/20 font-medium"
                                )}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className="font-bold text-slate-900 line-clamp-1">{n.title}</span>
                                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />}
                                </div>
                                <p className="text-slate-500 font-sans leading-relaxed line-clamp-2">{n.message}</p>
                              </div>
                            ))}

                            {notifications.length === 0 && (
                              <div className="p-8 text-center text-slate-400">
                                <p className="font-bold text-sm text-slate-600">All caught up! 🎉</p>
                                <p className="text-[11px] mt-1 text-slate-400">No new alerts or booking updates.</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef} id="profile-container">
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full transition-colors border border-slate-200 hover:bg-slate-50"
                      id="navbar-profile-toggle-btn"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-brand-green-900 font-poppins text-sm">
                        {user.name.split(' ')[0]}
                      </span>
                    </button>
                    
                    <AnimatePresence>
                      {isProfileDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 text-slate-900"
                        >
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <p className="font-bold text-slate-900">{user.name} {user.roles.includes('admin') && <span className="ml-1 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>}</p>
                            <p className="text-sm text-slate-500 truncate">{user.email}</p>
                          </div>
                          <div className="p-2 flex flex-col">
                            {user.roles.includes('admin') ? (
                                <>
                                  <Link to="/admin-dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-green-900 hover:bg-brand-green-50 rounded-lg transition-colors">
                                    <Settings size={16} /> Admin Dashboard
                                  </Link>
                                  <Link to="/admin/partners" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Building size={16} /> Partner Registrations
                                  </Link>
                                  <Link to="/admin/orders" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <ShoppingBag size={16} /> All Orders
                                  </Link>
                                  <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Settings size={16} /> Admin Profile
                                  </Link>
                                </>
                            ) : user.role === 'caterer' ? (
                                <>
                                  {user.role === 'caterer' && (
                                    <Link 
                                      to="/caterer-dashboard" 
                                      onClick={() => {
                                        if (!localStorage.getItem('catererDashboardId') && user) {
                                          try {
                                            const raw = localStorage.getItem('registrations');
                                            if (raw) {
                                              const allRegs = JSON.parse(raw);
                                              const firstApproved = allRegs.find((r: any) => (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) && r.status === 'Approved');
                                              if (firstApproved) {
                                                localStorage.setItem('catererDashboardId', firstApproved.id);
                                              } else {
                                                const firstAny = allRegs.find((r: any) => (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) && r.status !== 'Deleted');
                                                if (firstAny) {
                                                  localStorage.setItem('catererDashboardId', firstAny.id);
                                                }
                                              }
                                            }
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }
                                        setIsProfileDropdownOpen(false);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-green-900 hover:bg-brand-green-50 rounded-lg transition-colors"
                                    >
                                      <Settings size={16} /> My Dashboard
                                    </Link>
                                  )}
                                  <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <ShoppingBag size={16} /> My Orders
                                  </Link>
                                  <Link to="/businesses" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Building size={16} /> My Business
                                  </Link>
                                  {user.role === 'caterer' && (
                                    <Link to="/businesses" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                      <Package size={16} /> My Packages
                                    </Link>
                                  )}
                                  <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Settings size={16} /> Settings
                                  </Link>
                                </>
                            ) : (
                                <>
                                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Settings size={16} /> My Profile
                                  </Link>
                                  <Link to="/orders" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <ShoppingBag size={16} /> My Bookings
                                  </Link>
                                  <Link to="/partner-selection" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Handshake size={16} /> Become a Partner
                                  </Link>
                                </>
                            )}
                          </div>
                          <div className="p-2 border-t border-slate-100">
                            <button 
                              onClick={() => {
                                logout();
                                setIsProfileDropdownOpen(false);
                              }} 
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogOut size={16} /> Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center" id="mobile-toggle-btn-container">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-brand-green-900 p-2"
              id="navbar-mobile-toggle-btn"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-out Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[290px] max-w-[85vw] bg-[#FFFDFB] shadow-2xl z-55 md:hidden flex flex-col border-l border-[#E8DCC7]/60 overflow-hidden"
              id="mobile-navigation-drawer"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#E8DCC7]/40 flex items-center justify-between bg-[#173D32] text-white">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-gold-500 p-1.5 rounded-lg text-white">
                    <ChefHat size={18} />
                  </div>
                  <span className="font-display font-bold text-lg tracking-tight">CaterNest</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* User info if logged in */}
                {user && (
                  <div className="p-3 bg-gradient-to-br from-[#173D32]/5 to-[#D4AF37]/5 border border-[#E8DCC7]/40 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center font-bold text-lg border border-[#D4AF37]/30">
                      {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-brand-green-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.roles.includes('admin') && (
                        <span className="inline-block mt-1 text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Nav Links */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-1">Navigation</span>
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      (location.pathname === "/" && localStorage.getItem('homepage_mode') !== 'marketplace') ? "bg-[#173D32]/5 text-[#173D32]" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Home
                  </Link>
                  <Link
                    to={localStorage.getItem('homepage_mode') === 'marketplace' ? '/explore?scroll=true' : '/explore'}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleExploreCaterersClick(e);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      (location.pathname === "/explore" || location.pathname === "/explore-caterers" || (location.pathname === "/" && localStorage.getItem('homepage_mode') === 'marketplace')) ? "bg-[#173D32]/5 text-[#173D32]" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Explore Caterers
                  </Link>

                  {user && (
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        location.pathname === "/orders" ? "bg-[#173D32]/5 text-[#173D32]" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <ShoppingBag size={16} className="text-[#D4AF37]" />
                      {user.role === 'caterer' ? 'My Orders' : 'My Bookings'}
                    </Link>
                  )}
                </div>

                {/* Role Specific/Management Links */}
                <div className="space-y-1 border-t border-[#E8DCC7]/30 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-1">Partner Portal</span>
                  {user ? (
                    <>
                      {user.role === 'caterer' ? (
                        <>
                          <Link
                            to="/caterer-dashboard"
                            onClick={() => {
                              if (!localStorage.getItem('catererDashboardId') && user) {
                                try {
                                  const raw = localStorage.getItem('registrations');
                                  if (raw) {
                                    const allRegs = JSON.parse(raw);
                                    const firstApproved = allRegs.find((r: any) => (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) && r.status === 'Approved');
                                    if (firstApproved) {
                                      localStorage.setItem('catererDashboardId', firstApproved.id);
                                    } else {
                                      const firstAny = allRegs.find((r: any) => (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) && r.status !== 'Deleted');
                                      if (firstAny) {
                                        localStorage.setItem('catererDashboardId', firstAny.id);
                                      }
                                    }
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                              setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                              location.pathname === "/caterer-dashboard" ? "bg-[#173D32]/5 text-[#173D32]" : "text-[#173D32] hover:bg-slate-50"
                            )}
                          >
                            <Settings size={16} /> Partner Dashboard
                          </Link>
                          <Link
                            to="/businesses"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Building size={16} /> My Businesses
                          </Link>
                        </>
                      ) : (
                        <Link
                          to="/partner-selection"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Handshake size={16} /> Become a Partner
                        </Link>
                      )}

                      {user.roles.includes('admin') && (
                        <Link
                          to="/admin-dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-50 text-red-900 border border-red-100",
                            location.pathname.startsWith("/admin") ? "bg-red-100" : ""
                          )}
                        >
                          <Settings size={16} /> Admin Dashboard
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/partner-selection"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Handshake size={16} /> Join as Caterer
                    </Link>
                  )}
                </div>

                {/* Profile Settings / Auth */}
                <div className="space-y-1 border-t border-[#E8DCC7]/30 pt-4">
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Settings size={16} /> My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 pt-2">
                      <Link
                        to="/caterer-login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex justify-center items-center gap-2 px-3 py-2.5 text-xs font-bold bg-brand-gold-50 text-brand-gold-700 rounded-xl hover:bg-brand-gold-100 border border-brand-gold-100 uppercase tracking-wider"
                      >
                        <ChefHat size={14} /> Caterer Login
                      </Link>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-center px-3 py-2.5 text-xs font-extrabold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 uppercase tracking-wider"
                        >
                          Login
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-center px-3 py-2.5 text-xs font-extrabold bg-[#173D32] text-white rounded-xl hover:bg-brand-green-800 uppercase tracking-wider"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
