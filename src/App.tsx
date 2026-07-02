import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import CatererDetails from './pages/CatererDetails';
import OrderFlow from './pages/OrderFlow';
import JoinCaterer from './pages/JoinCaterer';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import PartnerSelection from './pages/PartnerSelection';
import Explore from './pages/Explore';
import MyBusinesses from './pages/MyBusinesses';
import RegistrationSuccess from './pages/RegistrationSuccess';
import PartnerDashboard from './pages/PartnerDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlatformSettingsProvider, usePlatformSettings } from './contexts/PlatformSettingsContext';
import { initializeSupabaseSync } from './lib/supabaseSync';
import { ChefHat } from 'lucide-react';

import AdminEditCaterer from './pages/AdminEditCaterer';

import Profile from './pages/Profile';
import Orders from './pages/Orders';
import EditCaterer from './pages/EditCaterer';

import CatererDashboard from './pages/CatererDashboard';
import CatererLogin from './pages/CatererLogin';
import ProtectedRoute from './components/ProtectedRoute';
import ChangePassword from './pages/ChangePassword';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const { homepageMode } = usePlatformSettings();

  const isCatererDashboard = 
    pathname.startsWith('/caterer-dashboard') || 
    pathname.startsWith('/partner') || 
    pathname.startsWith('/businesses') || 
    pathname.startsWith('/edit-business');

  const isAdminDashboard = 
    pathname.startsWith('/admin-dashboard') || 
    pathname.startsWith('/admin/');

  const isDashboardRoute = isCatererDashboard || isAdminDashboard;

  return (
    <div className={`flex flex-col min-h-screen md:pb-0 ${isDashboardRoute ? 'pb-0' : 'pb-16'}`}>
      <ScrollToTop />
      <Navbar homepageMode={homepageMode} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation homepageMode={homepageMode} />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-500">This feature is currently under construction.</p>
    </div>
  );
}

import { ToastProvider } from './components/Toast';

function RootHome() {
  const { homepageMode, loading } = usePlatformSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return homepageMode === 'marketplace' ? <Explore /> : <Home />;
}

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDFB] p-4">
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* CaterNest Logo Container */}
        <div className="flex items-center gap-3 mb-8 animate-pulse">
          <div className="bg-brand-gold-500 p-3 rounded-2xl text-white shadow-md">
            <ChefHat size={36} />
          </div>
          <div className="flex flex-col border-l-2 border-brand-green-100 pl-3 text-left">
            <span className="text-3xl font-bold font-display tracking-tight text-brand-green-900">
              CaterNest
            </span>
            <span className="text-[10px] uppercase font-poppins tracking-widest text-brand-gold-600 font-semibold">
              Making Every Event Special
            </span>
          </div>
        </div>

        {/* Loading Spinner and Status Text */}
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-brand-gold-500"></div>
          
          <div className="flex flex-col gap-1">
            <p className="text-slate-800 font-medium font-poppins text-sm tracking-wide">
              Restoring your session...
            </p>
            <p className="text-slate-400 text-xs font-poppins">
              Please wait while we secure your connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppInitializer() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RootHome />} />
          <Route path="caterer/:id" element={<CatererDetails />} />
          <Route path="join" element={<JoinCaterer />} />
          <Route path="admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/partners" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="explore" element={<Explore />} />
          <Route path="explore-caterers" element={<Explore />} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="about" element={<PlaceholderPage title="About Us" />} />
          <Route path="contact" element={<PlaceholderPage title="Contact Us" />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
          <Route path="caterer-login" element={<CatererLogin />} />
          <Route path="partner-selection" element={<PartnerSelection />} />
          <Route path="businesses" element={<ProtectedRoute allowedRoles={['caterer', 'admin']}><MyBusinesses /></ProtectedRoute>} />
          <Route path="registration-success" element={<RegistrationSuccess />} />
          <Route path="partner-dashboard/:id" element={<ProtectedRoute allowedRoles={['caterer', 'admin']}><PartnerDashboard /></ProtectedRoute>} />
          <Route path="caterer-dashboard" element={<ProtectedRoute allowedRoles={['caterer', 'admin']}><CatererDashboard /></ProtectedRoute>} />
          <Route path="edit-business/:id" element={<ProtectedRoute allowedRoles={['caterer', 'admin']}><EditCaterer /></ProtectedRoute>} />
          <Route path="admin/caterers/view/:id" element={<ProtectedRoute allowedRoles={['admin']}><CatererDetails /></ProtectedRoute>} />
          <Route path="admin/caterers/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminEditCaterer /></ProtectedRoute>} />
          <Route path="order/:id" element={<OrderFlow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  useEffect(() => {
    // initializeSync is imported from ./lib/supabase (or similar) or initializeSupabaseSync from supabase.ts
    // Let's call the imported initializeSupabaseSync
    initializeSupabaseSync();
  }, []);

  return (
    <AuthProvider>
      <PlatformSettingsProvider>
        <ToastProvider />
        <AppInitializer />
      </PlatformSettingsProvider>
    </AuthProvider>
  );
}
