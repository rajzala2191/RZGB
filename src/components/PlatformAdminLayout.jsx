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
  ScrollText,
  Lock,
  Bell,
  UserCheck,
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
    label: 'Tenants',
    items: [
      { path: '/platform-admin/workspaces',   label: 'Workspaces', icon: Building2 },
      { path: '/platform-admin/users',        label: 'All Users',  icon: Users     },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { path: '/platform-admin/demo-requests', label: 'Demo Requests', icon: Mail },
      { path: '/platform-admin/join-requests', label: 'Join Requests', icon: UserCheck },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { path: '/platform-admin/audit-log', label: 'Audit Log', icon: ScrollText },
      { path: '/platform-admin/activity',  label: 'Activity',  icon: Activity   },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/platform-admin/security',      label: 'Security',      icon: Lock     },
      { path: '/platform-admin/notifications', label: 'Notifications', icon: Bell     },
      { path: '/platform-admin/settings',      label: 'Configuration', icon: Settings },
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
    window.location.assign('/login');
  };

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <ErrorBoundary>
      <div
        className="flex overflow-hidden font-sans"
        style={{ background: 'var(--app-bg)', height: '100vh' }}
      >
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 flex flex-col
            transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            background:  sb.bg,
            borderRight: `1px solid ${sb.border}`,
          }}
        >
          {/* Authority bar — 2px solid top accent */}
          <div style={{ height: 2, background: 'var(--edge-strong)', flexShrink: 0 }} />

          {/* Brand */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${sb.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--edge)',
                }}
              >
                <Shield size={18} style={{ color: 'var(--heading)' }} />
              </div>
              <div>
                <p style={{ color: sb.nameColor }} className="font-bold text-sm leading-none tracking-tight">
                  Zaproc
                </p>
                <p
                  className="text-[10px] font-bold tracking-[0.14em] uppercase mt-1"
                  style={{ color: sb.labelColor }}
                >
                  Platform Admin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: sb.iconColor }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="px-3 pb-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5"
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
                          background: active ? sb.navActiveBg    : 'transparent',
                          color:      active ? sb.navActiveText  : sb.navInactive,
                          border:     active ? `1px solid ${sb.navActiveBorder}` : '1px solid transparent',
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            e.currentTarget.style.background = sb.navHoverBg;
                            e.currentTarget.style.color = sb.navHoverText;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = sb.navInactive;
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: active ? sb.navActiveIconBg : sb.iconBg }}
                          >
                            <item.icon
                              size={14}
                              style={{ color: active ? sb.navActiveIconColor : sb.iconColor }}
                            />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {active && (
                          <ChevronRight size={13} className="shrink-0" style={{ color: sb.navActiveIconColor }} />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div
            className="px-3 pb-4 pt-3 space-y-2 shrink-0"
            style={{ borderTop: `1px solid ${sb.border}` }}
          >
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: sb.cardBg, border: `1px solid ${sb.cardBorder}` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: 'var(--brand)',
                  color: 'var(--app-bg)',
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
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: sb.btnBg,
                color:      sb.btnColor,
                border:     `1px solid ${sb.btnBorder}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = sb.btnColor; e.currentTarget.style.background = sb.btnBg; e.currentTarget.style.borderColor = sb.btnBorder; }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-72">
          <header
            className="flex items-center gap-3 px-4 sm:px-8 py-3 shrink-0"
            style={{
              background:     HEADER.bg,
              backdropFilter: 'blur(8px)',
              borderBottom:   `1px solid ${HEADER.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center p-2 rounded-xl"
              style={{
                background: HEADER.btnBg,
                border:     `1px solid ${HEADER.btnBorder}`,
                color:      HEADER.btnColor,
              }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex-1 flex items-center">
              <span
                className="text-[10px] font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full border"
                style={{
                  color:       'var(--caption)',
                  borderColor: 'var(--edge)',
                  background:  'var(--surface-raised)',
                }}
              >
                Platform Admin
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
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="p-6 lg:p-8 max-w-7xl mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default PlatformAdminLayout;
