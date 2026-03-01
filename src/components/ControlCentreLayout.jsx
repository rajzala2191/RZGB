
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Network,
  FolderOpen,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import ErrorBoundary from '@/components/ErrorBoundary';

const ControlCentreLayout = ({ children }) => {
  const { currentUser, userCompanyName, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (currentUser) {
      await logout();
    }
    navigate('/login');
  };

  const navItems = [
    { path: '/control-centre', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/control-centre/sanitisation-gate', label: 'Sanitisation Gate', icon: ShieldCheck },
    { path: '/control-centre/bid-management', label: 'Bid Management', icon: TrendingUp },
    { path: '/control-centre/document-review', label: 'Document Review', icon: FolderOpen },
    { path: '/control-centre/supplier-pool', label: 'Supplier Pool', icon: Network },
  ];

  return (
    <ErrorBoundary>
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
              <div className="p-6 border-b border-slate-800 bg-[#0f172a]">
                <div className="flex flex-col items-center">
                  <img
                    src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png"
                    alt="RZ Global Solutions"
                    className="h-12 w-auto mb-3 object-contain"
                  />
                  <h2 className="text-lg font-bold text-slate-100 tracking-wider">CONTROL CENTRE</h2>
                  <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em] mt-1">
                    Admin Command
                  </span>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                {navItems.map((item) => {
                  const isActive = item.path === '/control-centre'
                    ? location.pathname === '/control-centre'
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                      className={`
                        flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-300 relative overflow-hidden group mb-1
                        ${isActive 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="active-admin-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        />
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 bg-[#020617]/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-bold text-sm shadow-lg border border-cyan-500/20">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{currentUser?.email}</p>
                    <p className="text-xs text-slate-500 truncate">{userCompanyName || 'Administrator'}</p>
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
    </ErrorBoundary>
  );
};

export default ControlCentreLayout;
