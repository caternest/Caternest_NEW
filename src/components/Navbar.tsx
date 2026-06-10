import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ChefHat, Search, Menu, X, User, LogOut, Settings, Handshake, ShoppingBag, Building, Bell, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

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
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isHome = location.pathname === '/';
  const navClass = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    isScrolled ? 'glass py-3 shadow-sm' : 'bg-white py-5 shadow-sm'
  );

  const textClass = cn(
    'transition-colors font-medium font-poppins text-sm',
    'text-slate-700 hover:text-brand-gold-600'
  );

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center bg-transparent">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
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
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={textClass}>
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
                <>
                  <Link to="/caterer-login" className="flex items-center gap-2 px-4 py-2 font-poppins font-medium text-sm text-brand-gold-700 bg-brand-gold-50 hover:bg-brand-gold-100 rounded-full transition-colors border border-brand-gold-100">
                    <ChefHat size={16} /> Caterer Login
                  </Link>
                  <Link to="/admin-login" className="flex items-center gap-2 px-4 py-2 font-poppins font-medium text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors mr-2 border border-indigo-100">
                    <Settings size={16} /> Admin Login
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
                </>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-500 hover:text-brand-green-900 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full transition-colors border border-slate-200 hover:bg-slate-50"
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
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
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
                                <Link to="/admin-dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Building size={16} /> Partner Registrations
                                </Link>
                                <Link to="/admin-dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <ShoppingBag size={16} /> All Orders
                                </Link>
                                <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Settings size={16} /> Admin Profile
                                </Link>
                              </>
                          ) : user.roles.includes('partner') ? (
                              <>
                                <Link to="/caterer-dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-green-900 hover:bg-brand-green-50 rounded-lg transition-colors">
                                  <Settings size={16} /> My Dashboard
                                </Link>
                                <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <ShoppingBag size={16} /> My Orders
                                </Link>
                                <Link to="/businesses" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Building size={16} /> My Business
                                </Link>
                                <Link to="/businesses" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Package size={16} /> My Packages
                                </Link>
                                <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Settings size={16} /> Settings
                                </Link>
                              </>
                          ) : (
                              <>
                                <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <Settings size={16} /> My Profile
                                </Link>
                                <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
                                  <ShoppingBag size={16} /> My Bookings
                                </Link>
                                <Link to="/partner-selection" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-gold-600 rounded-lg transition-colors">
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
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-brand-green-900"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100"
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
                    to="/admin-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center items-center gap-2 px-3 py-3 text-base font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-100"
                  >
                    <Settings size={18} /> Admin Login
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
