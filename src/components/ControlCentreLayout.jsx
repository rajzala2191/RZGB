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
  LifeBuoy,
  Users,
  Sun,
  Moon,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const NAV_ITEMS = [
  { path: '/control-centre',                    label: 'Dashboard',         icon: LayoutDashboard, exact: true },
  { path: '/control-centre/sanitisation-gate',  label: 'Sanitisation Gate', icon: ShieldCheck },
  { path: '/control-centre/live-tracking',      label: 'Live Tracking',     icon: Radio },
  { path: '/control-centre/supplier-pool',      label: 'Assign to Supplier',icon: Network },
  { path: '/control-centre/shipments',           label: 'Shipments',         icon: Truck },
  { path: '/control-centre/document-review',    label: 'Document Review',   icon: FolderOpen },
  { path: '/control-centre/users',              label: 'User Management',   icon: Users },
  { path: '/control-centre/support',            label: 'Support',           icon: LifeBuoy },
];

const ACCENT      = '#FF6B35';
const ACCENT_GLOW = 'rgba(255,107,53,0.18)';

const ControlCentreLayout = ({ children }) => {
  const { currentUser, userCompanyName, userLogoUrl, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (currentUser) await logout();
    navigate('/login');
  };

  const initials = (userCompanyName || currentUser?.email || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sb = isDark ? {
    bg:            'linear-gradient(180deg, #0e0e18 0%, #0c0c14 100%)',
    border:        'rgba(255,255,255,0.07)',
    labelColor:    'rgba(255,255,255,0.2)',
    navInactive:   'rgba(255,255,255,0.45)',
    navHoverBg:    'rgba(255,255,255,0.05)',
    navHoverText:  'rgba(255,255,255,0.8)',
    iconBg:        'rgba(255,255,255,0.05)',
    iconColor:     'rgba(255,255,255,0.4)',
    cardBg:        'rgba(255,255,255,0.04)',
    cardBorder:    'rgba(255,255,255,0.07)',
    nameColor:     '#ffffff',
    emailColor:    'rgba(255,255,255,0.3)',
    btnBg:         'rgba(255,255,255,0.05)',
    btnBorder:     'rgba(255,255,255,0.08)',
    btnColor:      'rgba(255,255,255,0.4)',
    btnHoverBg:    'rgba(255,255,255,0.10)',
    btnHoverColor: '#ffffff',
    mobileBtnBg:   '#0e0e18',
  } : {
    bg:            'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
    border:        'rgba(0,0,0,0.09)',
    labelColor:    'rgba(0,0,0,0.28)',
    navInactive:   'rgba(0,0,0,0.45)',
    navHoverBg:    'rgba(0,0,0,0.05)',
    navHoverText:  'rgba(0,0,0,0.8)',
    iconBg:        'rgba(0,0,0,0.05)',
    iconColor:     'rgba(0,0,0,0.35)',
    cardBg:        'rgba(0,0,0,0.04)',
    cardBorder:    'rgba(0,0,0,0.08)',
    nameColor:     '#0f0f0f',
    emailColor:    'rgba(0,0,0,0.38)',
    btnBg:         'rgba(0,0,0,0.05)',
    btnBorder:     'rgba(0,0,0,0.09)',
    btnColor:      'rgba(0,0,0,0.4)',
    btnHoverBg:    'rgba(0,0,0,0.09)',
    btnHoverColor: '#0f0f0f',
    mobileBtnBg:   '#ffffff',
  };

  return (
    <ErrorBoundary>
      <div
        className="flex h-screen overflow-hidden font-sans"
        style={{ background: isDark ? '#09090b' : '#f0f0f2' }}
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
          {/* Orange accent line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #f97316, transparent)`, flexShrink: 0 }} />

          {/* Logo / Brand */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${sb.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)' }}
              >
                <img
                  src={isDark
                    ? "https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png"
                    : "/light-logo.png"
                  }
                  alt="RZ"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <div>
                <p style={{ color: sb.nameColor }} className="font-bold text-sm leading-none tracking-tight">RZ Global</p>
                <p
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase mt-1"
                  style={{ color: ACCENT }}
                >
                  Control Centre
                </p>
              </div>
            </div>
            {/* NotificationBell removed from sidebar header */}
          </div>

          {/* Section label */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: sb.labelColor }}>
              Navigation
            </p>
          </div>

          {/* Nav items */}
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
                    background: isActive ? 'rgba(255,107,53,0.1)' : 'transparent',
                    color:      isActive ? ACCENT : sb.navInactive,
                    border:     isActive ? '1px solid rgba(255,107,53,0.22)' : '1px solid transparent',
                    boxShadow:  isActive ? '0 0 14px rgba(255,107,53,0.06)' : 'none',
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
                      style={{ background: isActive ? 'rgba(255,107,53,0.18)' : sb.iconBg }}
                    >
                      <item.icon size={15} style={{ color: isActive ? ACCENT : sb.iconColor }} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={13} style={{ color: ACCENT }} />}
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
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #f97316 100%)` }}
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

            <div className="flex gap-1.5">
              <button
                onClick={toggleTheme}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                style={{ background: sb.btnBg, color: sb.btnColor, border: `1px solid ${sb.btnBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.color = sb.btnHoverColor; e.currentTarget.style.background = sb.btnHoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.color = sb.btnColor; e.currentTarget.style.background = sb.btnBg; }}
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
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
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-2 sm:gap-6 px-2 sm:px-8 py-2 sm:py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0e0e18] shadow-sm relative">
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center justify-center p-2 rounded-xl shadow-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 mr-2"
                  style={{ zIndex: 60 }}
                >
                  <Menu size={20} />
                </button>
              )}
            </div>
            <div className="flex-1 flex justify-start">
              <SearchBar />
            </div>
            <div className="flex items-center justify-end">
              <NotificationBell />
            </div>
          </header>

          {/* Page */}
          <main
            className="flex-1 overflow-y-auto pt-16 lg:pt-0"
            style={{ background: isDark ? '#09090b' : '#f0f0f2' }}
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
