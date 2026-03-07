import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Users,
  Building2,
  Activity,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const PlatformOwnerLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/platform', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/platform/accounts', label: 'Accounts', icon: Building2 },
    { path: '/platform/users', label: 'Users', icon: Users },
    { path: '/platform/system', label: 'System Health', icon: Activity },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex font-sans">
        {/* Mobile toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-[#12121e] rounded-md border border-amber-500/20 text-amber-400"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`
                fixed lg:static top-0 left-0 z-40 h-screen w-72
                bg-[#12121e] border-r border-amber-500/10
                flex flex-col shadow-xl
                ${isSidebarOpen ? 'block' : 'hidden lg:flex'}
              `}
            >
              {/* Header */}
              <div className="p-6 border-b border-amber-500/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Crown size={24} className="text-amber-400" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-slate-100 tracking-wider">PLATFORM OWNER</h2>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.2em]">
                      RZ Global Solutions
                    </span>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 relative overflow-hidden group
                        ${isActive
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-platform-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        />
                      )}
                      <item.icon
                        size={18}
                        className={`transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'}`}
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-amber-500/10 bg-[#0a0a0f]/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{currentUser?.email}</p>
                    <p className="text-xs text-amber-500 truncate font-semibold">Platform Owner</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors border border-slate-800 hover:border-red-900/50 group"
                >
                  <LogOut size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0f] relative">
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

export default PlatformOwnerLayout;
