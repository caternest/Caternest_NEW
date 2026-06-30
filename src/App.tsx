import React, { useEffect } from 'react';
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
import { AuthProvider } from './contexts/AuthContext';
import { initializeSupabaseSync } from './lib/supabaseSync';

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
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation />
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
import { fetchHomepageMode } from './lib/supabase';
import { useState } from 'react';

function RootHome() {
  const [mode, setMode] = useState<string>('classic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage for immediate load to avoid flash
    const cached = localStorage.getItem('homepage_mode');
    if (cached) {
      setMode(cached);
      setLoading(false);
    }

    // Double check with DB
    fetchHomepageMode()
      .then((dbMode) => {
        setMode(dbMode);
      })
      .catch((err) => {
        console.warn("Error loading homepage mode on app load", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading && !localStorage.getItem('homepage_mode')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return mode === 'marketplace' ? <Explore /> : <Home />;
}

export default function App() {
  useEffect(() => {
    initializeSupabaseSync();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider />
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
          </Route>
          {/* Order flow doesn't use the standard footer/header layout strictly */}
          <Route path="/order/:id" element={<OrderFlow />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
