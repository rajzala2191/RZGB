import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
          <p className="text-white text-xl">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged in -> Redirect to Login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Check
  // If a specific role is required and the user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`ProtectedRoute: Access denied to ${location.pathname}. Required: ${requiredRole}, Found: ${userRole}`);
    // Redirect to the dashboard appropriate for their actual role to prevent getting stuck
    if (userRole === 'admin') return <Navigate to="/control-centre" replace />;
    if (userRole === 'client') return <Navigate to="/client-dashboard" replace />;
    if (userRole === 'supplier') return <Navigate to="/supplier-hub" replace />;
    
    // Fallback if role is unknown or invalid
    return <Navigate to="/login" replace />;
  }

  // 3. Access Granted
  return children;
};

export default ProtectedRoute;