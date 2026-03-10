import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // Also wait if user is authenticated but profile/role hasn't loaded yet
  if (loading || (currentUser && !userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
          <p className="text-slate-600 text-xl">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged in -> Redirect to Login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Check
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`ProtectedRoute: Access denied to ${location.pathname}. Required: ${requiredRole}, Found: ${userRole}`);
    if (userRole === 'admin') return <Navigate to="/control-centre" replace />;
    if (userRole === 'client') return <Navigate to="/client-dashboard" replace />;
    if (userRole === 'supplier') return <Navigate to="/supplier-hub" replace />;
    return <Navigate to="/login" replace />;
  }

  // 3. Access Granted
  return children;
};

export default ProtectedRoute;
