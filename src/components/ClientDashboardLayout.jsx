
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  Library, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Search,
  PlusCircle,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const ClientDashboardLayout = ({ children }) => {
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
    { path: '/client-dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/client-dashboard/create-order', label: 'Create New Order', icon: FolderPlus, highlight: true },
    { path: '/client-dashboard/orders', label: 'My Orders', icon: Briefcase },
    { path: '/client-dashboard/documents', label: 'Documents', icon: Library }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#020617] text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-900 rounded-md border border-slate-800 text-cyan-500 hover:text-cyan-400 shadow-lg"
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
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className={`
                fixed lg:static top-0 left-0 z-40 h-screen w-72 
                bg-[#020617] border-r border-slate-800 
                flex flex-col shadow-2xl shadow-black
                ${isSidebarOpen ? 'block' : 'hidden lg:flex'}
              `}
            >
              <div className="p-6 border-b border-slate-800 bg-[#020617] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex flex-col items-center relative z-10">
                  <img
                    src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png"
                    alt="RZ Global Solutions"
                    className="h-12 w-auto mb-3 object-contain"
                  />
                  <h2 className="text-lg font-bold text-slate-100 tracking-wider">CLIENT PORTAL</h2>
                  <div className="mt-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                    Orders
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
                        flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group mb-1
                        ${isActive 
                          ? 'bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                          : item.highlight 
                            ? 'text-cyan-400 hover:text-white hover:bg-cyan-900/20 border border-cyan-900/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <item.icon size={20} className={`transition-colors ${isActive || item.highlight ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                        <span className="font-medium text-sm tracking-wide">{item.label}</span>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="active-client-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"
                        />
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 bg-[#0f172a]/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm border border-cyan-500/20">
                    {userCompanyName ? userCompanyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-200 truncate">{userCompanyName || 'Valued Client'}</p>
                    <p className="text-xs text-slate-500 truncate font-mono">{currentUser?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1" />
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors border border-slate-800">
                    <Bell size={16} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-[3] flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors border border-slate-800 group"
                  >
                    <LogOut size={16} className="group-hover:text-red-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 h-screen overflow-y-auto bg-[#020617] relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {/* Header - Clean and Minimal */}
          <div className="hidden lg:flex sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 justify-between items-center">
            <div className="flex items-center gap-4">
               {/* Minimal Logo / Context Info if needed */}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Current Date</p>
                <p className="text-sm text-cyan-400 font-mono font-bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

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

export default ClientDashboardLayout;
