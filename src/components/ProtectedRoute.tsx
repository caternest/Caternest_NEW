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

  console.log("[DEBUG LOG] ProtectedRoute execution:", {
    pathname: location.pathname,
    loading,
    user: user ? { id: user.id, email: user.email, role: user.role } : null
  });

  if (loading) {
    console.log("[DEBUG LOG] ProtectedRoute: loading is true, rendering LoadingScreen...");
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-green-900 animate-spin" />
        <p className="text-sm font-medium text-slate-500 font-poppins">Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    console.log("[DEBUG LOG] ProtectedRoute: user is null, redirecting...");
    // If accessing an admin route, redirect to standard login page since custom page is deprecated
    if (location.pathname.startsWith('/admin') || location.pathname.includes('admin')) {
      console.log("[DEBUG LOG] ProtectedRoute redirecting admin route to /login");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // If accessing caterer dashboard, redirect to caterer-login
    if (location.pathname.startsWith('/caterer') || location.pathname.includes('caterer-dashboard')) {
      console.log("[DEBUG LOG] ProtectedRoute redirecting caterer route to /caterer-login");
      return <Navigate to="/caterer-login" state={{ from: location }} replace />;
    }
    console.log("[DEBUG LOG] ProtectedRoute redirecting default route to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force first-time password change if flag is set on user profile, EXCEPT if already on change-password
  if (user.must_change_password && location.pathname !== '/change-password') {
    console.log("[DEBUG LOG] ProtectedRoute: user must change password, redirecting to /change-password");
    return <Navigate to="/change-password" replace />;
  }

  const isAuthorized = React.useMemo(() => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(user.role);
  }, [allowedRoles, user.role]);

  console.log("[DEBUG LOG] ProtectedRoute: isAuthorized =", isAuthorized);

  if (!isAuthorized) {
    console.warn(`Denied access for user "${user.email}" (Role: ${user.role}) trying to reach ${location.pathname}`);
    // Unauthorized access: redirect based on roles
    if (user.role === 'admin') {
      console.log("[DEBUG LOG] ProtectedRoute redirecting unauthorized user to /admin-dashboard");
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'caterer') {
      console.log("[DEBUG LOG] ProtectedRoute redirecting unauthorized user to /caterer-dashboard");
      return <Navigate to="/caterer-dashboard" replace />;
    } else {
      console.log("[DEBUG LOG] ProtectedRoute redirecting unauthorized user to /");
      return <Navigate to="/" replace />;
    }
  }

  console.log("[DEBUG LOG] ProtectedRoute: authorized! Allowing access to requested path.");
  return <>{children}</>;
}
