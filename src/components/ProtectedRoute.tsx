import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'caterer' | 'customer')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-green-900 animate-spin" />
        <p className="text-sm font-medium text-slate-500 font-poppins">Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    // If accessing an admin route, redirect to standard login page since custom page is deprecated
    if (location.pathname.startsWith('/admin') || location.pathname.includes('admin')) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // If accessing caterer dashboard, redirect to caterer-login
    if (location.pathname.startsWith('/caterer') || location.pathname.includes('caterer-dashboard')) {
      return <Navigate to="/caterer-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force first-time password change if flag is set on user profile, EXCEPT if already on change-password
  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Fallback: Check if user has registered a business in local storage (even if profile role of 'caterer' isn't set yet)
  const hasLocalBusiness = React.useMemo(() => {
    if (!user) return false;
    try {
      const raw = localStorage.getItem('registrations');
      if (raw) {
        const allRegs = JSON.parse(raw);
        return allRegs.some((r: any) => 
          (r.userId === user.id || (r.email && r.email.toLowerCase() === user.email.toLowerCase())) 
          && r.status !== 'Deleted'
        );
      }
    } catch (e) {
      console.error("[PROTECTED ROUTE] Error reading registrations:", e);
    }
    return false;
  }, [user]);

  const isAuthorized = React.useMemo(() => {
    if (!allowedRoles) return true;
    if (allowedRoles.includes(user.role)) return true;
    if (allowedRoles.includes('caterer') && hasLocalBusiness) return true;
    return false;
  }, [allowedRoles, user.role, hasLocalBusiness]);

  if (!isAuthorized) {
    console.warn(`Denied access for user "${user.email}" (Role: ${user.role}, Has Business: ${hasLocalBusiness}) trying to reach ${location.pathname}`);
    // Unauthorized access: redirect based on roles
    if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'caterer' || hasLocalBusiness) {
      return <Navigate to="/caterer-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
