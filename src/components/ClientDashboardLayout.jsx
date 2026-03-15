import { useState } from 'react';
import VrocureLogo from '@/components/VrocureLogo';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Library,
  LogOut,
  Menu,
  Settings,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const NAV_ITEMS = [
  { path: '/client-dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/client-dashboard/orders', label: 'My Orders', icon: Briefcase },
  { path: '/client-dashboard/documents', label: 'Documents', icon: Library },
  { path: '/client-dashboard/settings', label: 'Settings', icon: Settings },
];

export default function ClientDashboardLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = !!localStorage.getItem('rzgb-demo-session');

  const handleLogout = async () => {
    if (currentUser) await logout();
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <div className="flex overflow-hidden font-sans h-screen bg-slate-50 dark:bg-slate-950 min-w-0">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Narrow icon-only sidebar — tooltip on hover */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-10 flex flex-col w-16 shrink-0
            bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-center py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white">
              <VrocureLogo size={28} />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col items-center gap-1 min-w-0">
            <NavLink
              to="/client-dashboard/create-order"
              onClick={() => setSidebarOpen(false)}
              title="New Order"
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Zap size={20} strokeWidth={1.5} />
            </NavLink>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={item.label}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                </NavLink>
              );
            })}
          </nav>

          {!isDemo && (
            <div className="flex justify-center p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={handleLogout}
                title="Sign out"
                className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
          <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex-1 flex justify-center max-w-xl mx-auto min-w-0">
              <SearchBar
                variant="pill"
                onResultSelect={(item, type) => {
                  if (type === 'order') navigate(`/client-dashboard/orders/${item.id}`);
                  else if (type === 'document' && item.order_id) navigate(`/client-dashboard/orders/${item.order_id}`);
                }}
              />
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-8 max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
