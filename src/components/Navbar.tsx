import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
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
          try {
            localStorage.setItem('registrations', JSON.stringify(data));
          } catch (storageErr) {
            console.warn("Could not save full registrations in Navbar localStorage. Attempting sanitized fallback...", storageErr);
            try {
              const sanitizeItem = (val: any): any => {
                if (typeof val === 'string') {
                  if (val.length > 500 && (val.startsWith('data:') || val.includes(';base64,'))) {
                    return '/placeholder.jpg';
                  }
                  return val;
                }
                if (Array.isArray(val)) {
                  return val.map(item => sanitizeItem(item));
                }
                if (val !== null && typeof val === 'object') {
                  const cleanedObj: any = {};
                  for (const k of Object.keys(val)) {
                    cleanedObj[k] = sanitizeItem(val[k]);
                  }
                  return cleanedObj;
                }
                return val;
              };
              const cleaned = data.map(r => sanitizeItem(r));
              localStorage.setItem('registrations', JSON.stringify(cleaned));
            } catch (fallbackErr) {
              console.error("Failed to write even sanitized registrations in Navbar:", fallbackErr);
            }
          }
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
          } else if (user.roles.includes('partner') || hasCatererBusinesses) {
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
      } else if (user.roles.includes('partner') || hasCatererBusinesses) {
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
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  data-keep-profile-open="true" 
                  className={cn(textClass, location.pathname === link.path && "text-brand-gold-600")}
                >
                  {link.name}
                </Link>
              ))}
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
                                  <Link to="/admin-dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-green-900 hover:bg-brand-green-50 rounded-lg transition-colors">
                                    <Settings size={16} /> Admin Dashboard
                                  </Link>
                                  <Link to="/admin-dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Building size={16} /> Partner Registrations
                                  </Link>
                                  <Link to="/admin-dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <ShoppingBag size={16} /> All Orders
                                  </Link>
                                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                    <Settings size={16} /> Admin Profile
                                  </Link>
                                </>
                            ) : (user.roles.includes('partner') || hasCatererBusinesses) ? (
                                <>
                                  {(user.roles.includes('partner') || hasApprovedCatererBusiness) && (
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
                                  {(user.roles.includes('partner') || hasApprovedCatererBusiness) && (
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

      {/* Mobile Menu Links */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100"
            id="mobile-navigation-drawer"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium font-poppins text-slate-700 hover:text-brand-gold-600 hover:bg-slate-50 rounded-lg"
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                {!user ? (
                  <>
                    <Link 
                      to="/caterer-login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex justify-center items-center gap-2 px-3 py-3 text-base font-medium bg-brand-gold-50 text-brand-gold-700 rounded-lg hover:bg-brand-gold-100 border border-brand-gold-100"
                    >
                      <ChefHat size={18} /> Caterer Login
                    </Link>
                    <Link 
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center px-3 py-3 text-base font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center px-3 py-3 text-base font-medium bg-brand-green-900 text-white rounded-lg hover:bg-brand-green-800"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-brand-green-900">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                      <Settings size={20} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                      <ShoppingBag size={20} /> My Orders
                    </Link>
                    <Link to="/businesses" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                      <Building size={20} /> My Businesses
                    </Link>
                    <Link to="/partner-selection" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                      <Handshake size={20} /> Become a Partner
                    </Link>
                    {user.roles.includes('admin') && (
                        <Link to="/admin-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-brand-green-900 bg-brand-green-50 rounded-lg mt-2">
                           <Settings size={20} /> Admin Dashboard
                        </Link>
                    )}
                    <button 
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
