import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const RootRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate('/login');
      } else {
        // Role-based redirection
        switch (userRole) {
          case 'admin':
            navigate('/control-centre');
            break;
          case 'client':
            navigate('/client-dashboard');
            break;
          case 'supplier':
            navigate('/supplier-hub');
            break;
          default:
            // Fallback for unknown roles (e.g. newly invited users without profile data yet)
            // Default to client or show error
            navigate('/client-dashboard');
        }
      }
    }
  }, [currentUser, userRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm tracking-wider uppercase font-bold">Authenticating Secure Session...</p>
      </div>
    </div>
  );
};

export default RootRedirect;