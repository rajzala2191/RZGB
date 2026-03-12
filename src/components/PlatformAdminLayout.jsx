import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, LogOut, Menu, X,
  ChevronRight, Shield, Activity, Settings, Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ACCENT, SIDEBAR, HEADER } from '@/lib/theme';
import ErrorBoundary from '@/components/ErrorBoundary';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { path: '/platform-admin',              label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { path: '/platform-admin/workspaces',   label: 'Workspaces',     icon: Building2 },
  { path: '/platform-admin/users',        label: 'All Users',      icon: Users },
  { path: '/platform-admin/demo-requests', label: 'Demo requests',  icon: Mail },
  { path: '/platform-admin/activity',     label: 'Activity',       icon: Activity },
  { path: '/platform-admin/settings',     label: 'Settings',       icon: Settings },
];

const PlatformAdminLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (currentUser) await logout();
    navigate('/login');
  };

  const sb = SIDEBAR;

  return (
    <ErrorBoundary>
      <div className="flex overflow-hidden font-sans" style={{ background: 'var(--app-bg)', height: '100vh' }}>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            />
          )}
        </AnimatePresence>

        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ background: sb.bg, borderRight: `1px solid ${sb.border}` }}
        >
          <div style={{ height: 3, background: `linear-gradient(90deg, #ef4444, #f97316, transparent)`, flexShrink: 0 }} />

          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${sb.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Shield size={16} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p style={{ color: sb.nameColor }} className="font-bold text-sm leading-none tracking-tight">Zaproc</p>
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase mt-1" style={{ color: '#ef4444' }}>
                  Platform Admin
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: sb.labelColor }}>Platform</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
            {NAV_ITEMS.map(item => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: isActive ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: isActive ? '#ef4444' : sb.navInactive,
                    border: isActive ? '1px solid rgba(239,68,68,0.22)' : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isActive ? 'rgba(239,68,68,0.18)' : sb.iconBg }}>
                      <item.icon size={15} style={{ color: isActive ? '#ef4444' : sb.iconColor }} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={13} style={{ color: '#ef4444' }} />}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-3 pb-4 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${sb.border}` }}>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: sb.cardBg, border: `1px solid ${sb.cardBorder}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}>
                SA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-none mb-0.5" style={{ color: sb.nameColor }}>Super Admin</p>
                <p className="text-[11px] truncate" style={{ color: sb.emailColor }}>{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150"
              style={{ background: sb.btnBg, color: sb.btnColor, border: `1px solid ${sb.btnBorder}` }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header
            className="flex items-center gap-2 sm:gap-6 px-2 sm:px-8 py-2 sm:py-4 border-b shadow-sm relative"
            style={{ background: HEADER.bg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${HEADER.border}` }}
          >
            <div className="flex items-center">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center justify-center p-2 rounded-xl shadow-lg mr-2"
                  style={{ background: HEADER.btnBg, border: `1px solid ${HEADER.btnBorder}`, color: HEADER.btnColor }}>
                  <Menu size={20} />
                </button>
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">
                PLATFORM ADMIN
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto" style={{ background: 'var(--app-bg)' }}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6 lg:p-8 max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PlatformAdminLayout;
