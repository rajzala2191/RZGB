
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  FolderOpen,
  ClipboardList,
  Hammer,
  Cog,
  CheckCircle,
  Truck,
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const SupplierHubLayout = ({ children }) => {
  const { currentUser, userCompanyName, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/supplier-hub', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/supplier-hub/jobs', label: 'My Jobs', icon: Briefcase },
    { path: '/supplier-hub/job-tracking', label: 'Job Details', icon: ClipboardList },
    { path: '/supplier-hub/material-update', label: 'Material Update', icon: FolderOpen },
    { path: '/supplier-hub/casting', label: 'Casting', icon: Hammer },
    { path: '/supplier-hub/machining', label: 'Machining', icon: Cog },
    { path: '/supplier-hub/qc', label: 'QC & Quality', icon: CheckCircle },
    { path: '/supplier-hub/dispatch', label: 'Dispatch', icon: Truck },
    { path: '/supplier-hub/documents', label: 'Documents Portal', icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex font-sans">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-900 rounded-md border border-slate-800 text-cyan-500 hover:text-cyan-400"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`
              fixed lg:static top-0 left-0 z-40 h-screen w-72 
              bg-[#0f172a] border-r border-slate-800 
              flex flex-col shadow-xl
              ${isSidebarOpen ? 'block' : 'hidden lg:flex'}
            `}
          >
            <div className="p-6 border-b border-slate-800">
              <div className="flex flex-col items-center">
                <img
                  src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png"
                  alt="RZ Global Solutions"
                  className="h-12 w-auto mb-3 object-contain"
                />
                <h2 className="text-lg font-bold text-slate-100 tracking-wider">SUPPLIER HUB</h2>
                <div className="mt-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  Authorized Partner
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
              {navItems.map((item) => {
                const isActive = item.path === '/supplier-hub' 
                   ? location.pathname === item.path 
                   : location.pathname.startsWith(item.path);
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden group mb-1
                      ${isActive 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]'
                      }
                    `}
                  >
                    <item.icon size={18} className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-supplier-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-[#020617]/50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center text-white font-bold text-sm shadow-lg border border-emerald-500/20">
                  {userCompanyName ? userCompanyName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{userCompanyName || 'Supplier'}</p>
                  <p className="text-xs text-slate-500 truncate font-mono">{currentUser?.id?.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <ThemeToggle />
                <div className="flex-1" />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors border border-slate-800 hover:border-red-900/50 group"
              >
                <LogOut size={16} className="group-hover:text-red-400" />
                <span className="text-xs font-semibold uppercase tracking-wide">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 h-screen overflow-y-auto bg-[#020617] relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SupplierHubLayout;
