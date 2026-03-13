import { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Activity,
  Settings,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SIDEBAR, HEADER } from '@/lib/theme';
import ErrorBoundary from '@/components/ErrorBoundary';
import ThemeToggle from './ThemeToggle';

const sb = SIDEBAR;

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/platform-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Platform',
    items: [
      { path: '/platform-admin/workspaces', label: 'Workspaces', icon: Building2 },
      { path: '/platform-admin/users', label: 'All Users', icon: Users },
    ],
  },
  {
    label: 'Demos & requests',
    items: [
      { path: '/platform-admin/demo-requests', label: 'Demo requests', icon: Mail },
    ],
  },
  {
    label: 'Activity & settings',
    items: [
      { path: '/platform-admin/activity', label: 'Activity', icon: Activity },
      { path: '/platform-admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function PlatformAdminLayout() {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (currentUser) await logout();
    navigate('/login');
  };

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <ErrorBoundary>
      <div
        className="flex overflow-hidden font-sans"
        style={{ background: 'var(--app-bg)', height: '100vh' }}
      >
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            />
          )}
        </AnimatePresence>

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 flex flex-col
            transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            background: sb.bg,
            borderRight: `1px solid ${sb.border}`,
          }}
        >
          <div
            style={{
              height: 3,
              background: 'linear-gradient(90deg, var(--brand, #ef4444), #f97316, transparent)',
              flexShrink: 0,
            }}
          />
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${sb.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--sidebar-nav-active-bg)',
                  border: '1px solid var(--sidebar-nav-active-border)',
                }}
              >
                <Shield size={20} style={{ color: 'var(--brand, #ef4444)' }} />
              </div>
              <div>
                <p style={{ color: sb.nameColor }} className="font-bold text-sm leading-none tracking-tight">
                  Zaproc
                </p>
                <p
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase mt-1"
                  style={{ color: 'var(--brand, #ef4444)' }}
                >
                  Platform Admin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-black/10"
              aria-label="Close menu"
            >
              <X size={18} style={{ color: sb.iconColor }} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="px-4 pb-3">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-2"
                  style={{ color: sb.labelColor }}
                >
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        end={item.exact}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                        style={{
                          background: active ? sb.navActiveBg : 'transparent',
                          color: active ? sb.navActiveText : sb.navInactive,
                          border: active ? `1px solid ${sb.navActiveBorder}` : '1px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: active ? sb.navActiveIconBg : sb.iconBg,
                            }}
                          >
                            <item.icon
                              size={16}
                              style={{ color: active ? sb.navActiveIconColor : sb.iconColor }}
                            />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {active && (
                          <ChevronRight
                            size={14}
                            className="shrink-0"
                            style={{ color: sb.navActiveIconColor }}
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div
            className="px-3 pb-4 pt-3 space-y-2.5 shrink-0"
            style={{ borderTop: `1px solid ${sb.border}` }}
          >
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: sb.cardBg, border: `1px solid ${sb.cardBorder}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--brand, #ef4444) 0%, #f97316 100%)',
                }}
              >
                SA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-none mb-0.5" style={{ color: sb.nameColor }}>
                  Super Admin
                </p>
                <p className="text-[11px] truncate" style={{ color: sb.emailColor }}>
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: sb.btnBg,
                color: sb.btnColor,
                border: `1px solid ${sb.btnBorder}`,
              }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-72">
          <header
            className="flex items-center gap-2 sm:gap-6 px-4 sm:px-8 py-3 border-b shrink-0"
            style={{
              background: HEADER.bg,
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${HEADER.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center p-2.5 rounded-xl"
              style={{
                background: HEADER.btnBg,
                border: `1px solid ${HEADER.btnBorder}`,
                color: HEADER.btnColor,
              }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 flex items-center gap-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{
                  color: 'var(--brand, #ef4444)',
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.25)',
                }}
              >
                PLATFORM ADMIN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: 'var(--app-bg)' }}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6 lg:p-8 max-w-7xl mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PlatformAdminLayout;
