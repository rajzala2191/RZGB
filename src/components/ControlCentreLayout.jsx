import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Network,
  FolderOpen,
  Radio,
  ChevronRight,
  Truck,
  Cog,
  Gavel,
  FileText,
  Receipt,
  TrendingUp,
  GitBranch,
  FileSignature,
  Globe,
  Settings,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import { ACCENT, ACCENT_GLOW, SIDEBAR, HEADER } from '@/lib/theme';

const NAV_ITEMS = [
  { path: '/control-centre',                          label: 'Dashboard',          icon: LayoutDashboard, exact: true },
  { path: '/control-centre/sanitisation-gate',        label: 'Sanitisation Gate',  icon: ShieldCheck },
  { path: '/control-centre/manufacturing-processes',  label: 'Processes',          icon: Cog },
  { path: '/control-centre/live-tracking',            label: 'Live Tracking',      icon: Radio },
  { path: '/control-centre/supplier-pool',            label: 'Assign to Supplier', icon: Network },
  { path: '/control-centre/bid-management',           label: 'Bid Management',     icon: Gavel },
  { path: '/control-centre/purchase-orders',          label: 'Purchase Orders',    icon: FileText },
  { path: '/control-centre/invoices',                 label: 'Invoices',           icon: Receipt },
  { path: '/control-centre/spend-analytics',          label: 'Spend Analytics',    icon: TrendingUp },
  { path: '/control-centre/approval-workflows',       label: 'Approvals',          icon: GitBranch },
  { path: '/control-centre/contracts',               label: 'Contracts',          icon: FileSignature },
  { path: '/control-centre/supplier-discovery',       label: 'Supplier Discovery', icon: Globe },
  { path: '/control-centre/shipments',                label: 'Shipments',          icon: Truck },
  { path: '/control-centre/document-review',          label: 'Document Review',    icon: FolderOpen },
  { path: '/control-centre/supplier-scorecard',       label: 'Supplier Scorecard', icon: BarChart2 },
  { path: '/control-centre/settings',                 label: 'Settings',           icon: Settings },
];

const ControlCentreLayout = ({ children }) => {
  const { currentUser, userCompanyName, userLogoUrl, isSuperAdmin, logout } = useAuth();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = !!localStorage.getItem('rzgb-demo-session');

  const handleLogout = async () => {
    if (currentUser) await logout();
    navigate('/login');
  };

  const initials = (userCompanyName || currentUser?.email || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sb = SIDEBAR;

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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            background:  sb.bg,
            borderRight: `1px solid ${sb.border}`,
          }}
        >
          {/* Logo / Brand */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${sb.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.1)' }}
              >
                <img
                  src="/zaproc-logo-192.png"
                  alt="Zaproc"
                  className="h-6 w-6 object-contain rounded"
                />
              </div>
              <div>
                <p style={{ color: sb.nameColor }} className="font-bold text-sm leading-none tracking-tight">Zaproc</p>
                <p
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase mt-1"
                  style={{ color: 'var(--sidebar-label)' }}
                >
                  Control Centre
                </p>
              </div>
            </div>
          </div>

          {/* Section label */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: sb.labelColor }}>
              Navigation
            </p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
            {isSuperAdmin && (
              <NavLink
                to="/platform-admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-2"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <ShieldCheck size={15} style={{ color: '#ef4444' }} />
                  </div>
                  <span>Platform Admin</span>
                </div>
                <ChevronRight size={13} style={{ color: '#ef4444' }} />
              </NavLink>
            )}
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
                    background: isActive ? sb.navActiveBg : 'transparent',
                    color:      isActive ? sb.navActiveText : sb.navInactive,
                    border:     isActive ? `1px solid ${sb.navActiveBorder}` : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = sb.navHoverBg;
                      e.currentTarget.style.color = sb.navHoverText;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = sb.navInactive;
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isActive ? sb.navActiveIconBg : sb.iconBg }}
                    >
                      <item.icon size={15} style={{ color: isActive ? sb.navActiveIconColor : sb.iconColor }} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={13} style={{ color: sb.navActiveIconColor }} />}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div
            className="px-3 pb-4 pt-3 space-y-2.5"
            style={{ borderTop: `1px solid ${sb.border}` }}
          >
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: sb.cardBg, border: `1px solid ${sb.cardBorder}` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                style={{ background: '#2a2a2a' }}
              >
                {userLogoUrl
                  ? <img src={userLogoUrl} alt="logo" className="w-full h-full object-contain rounded-xl" />
                  : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-none mb-0.5" style={{ color: sb.nameColor }}>
                  {userCompanyName || 'Administrator'}
                </p>
                <p className="text-[11px] truncate" style={{ color: sb.emailColor }}>
                  {currentUser?.email}
                </p>
              </div>
            </div>

            {!isDemo && (
              <div className="flex gap-1.5">
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ background: sb.btnBg, color: sb.btnColor, border: `1px solid ${sb.btnBorder}` }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = sb.btnColor; e.currentTarget.style.background = sb.btnBg; e.currentTarget.style.borderColor = sb.btnBorder; }}
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header
            className="flex items-center gap-2 sm:gap-6 px-2 sm:px-8 py-2 sm:py-4 border-b shadow-sm relative"
            style={{
              background:     HEADER.bg,
              backdropFilter: 'blur(12px)',
              borderBottom:   `1px solid ${HEADER.border}`,
            }}
          >
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center justify-center p-2 rounded-xl shadow-lg mr-2"
                  style={{
                    zIndex: 60,
                    background: HEADER.btnBg,
                    border: `1px solid ${HEADER.btnBorder}`,
                    color: HEADER.btnColor,
                  }}
                >
                  <Menu size={20} />
                </button>
              )}
            </div>
            <div className="flex-1 flex justify-start">
              <SearchBar onResultSelect={(item, type) => {
                if (type === 'order') navigate(`/control-centre/order-preview/${item.id}`);
                else if (type === 'supplier') navigate('/control-centre/supplier-management');
                else if (type === 'document' && item.order_id) navigate(`/control-centre/order-preview/${item.order_id}`);
              }} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Page */}
          <main
            className="flex-1 overflow-y-auto"
            style={{ background: 'var(--app-bg)' }}
          >
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

export default ControlCentreLayout;
