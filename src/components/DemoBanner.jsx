/**
 * DemoBanner — shown on every page while a demo session is active.
 * Sits outside the route tree so it persists on all production routes.
 * Uses real Supabase auth to switch between demo roles.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { X, FlaskConical, Loader2 } from 'lucide-react';

const DEMO_ROLES = [
  { key: 'client',   label: 'Client Portal',  shortLabel: 'Client',   email: 'demo.client@rzglobalsolutions.co.uk',   dash: '/client-dashboard' },
  { key: 'admin',    label: 'Control Centre', shortLabel: 'Admin',    email: 'demo.admin@rzglobalsolutions.co.uk',    dash: '/control-centre' },
  { key: 'supplier', label: 'Supplier Hub',   shortLabel: 'Supplier', email: 'demo.supplier@rzglobalsolutions.co.uk', dash: '/supplier-hub' },
];
const DEMO_PASSWORD = 'RZDemo2024!';

export default function DemoBanner() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [switching, setSwitching] = useState(null);

  // Only show when demo session flag is set
  const isDemo = !!localStorage.getItem('rzgb-demo-session');
  if (!isDemo) return null;

  // Hide on landing, demo entry, login, and auth pages
  const hiddenPaths = ['/landing', '/demo', '/login', '/reset-password', '/set-password', '/create-password'];
  if (hiddenPaths.some((p) => location.pathname === p || location.pathname.startsWith('/demo/'))) return null;

  // Detect active role from current path
  const activeRole = location.pathname.startsWith('/client-dashboard') ? 'client'
    : location.pathname.startsWith('/control-centre') ? 'admin'
    : location.pathname.startsWith('/supplier-hub') ? 'supplier'
    : null;

  async function handleRoleSwitch(role) {
    if (switching) return;
    const target = DEMO_ROLES.find((r) => r.key === role);
    if (!target) return;
    setSwitching(role);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: target.email, password: DEMO_PASSWORD });
    setSwitching(null);
    if (!error) navigate(target.dash);
  }

  async function handleExit() {
    await logout();
    localStorage.removeItem('rzgb-demo-session');
    navigate('/landing');
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-12 flex items-center justify-between px-4 gap-2"
      style={{ background: 'linear-gradient(90deg, #FF6B35 0%, #f97316 50%, #fb923c 100%)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex items-center gap-1.5 bg-black/20 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
          <FlaskConical className="w-3 h-3" />
          DEMO
        </span>
        <span className="text-white/90 text-xs hidden sm:block truncate">
          Sandbox — no real data affected
        </span>
      </div>

      {/* Mobile/tablet: dropdown select */}
      <div className="lg:hidden flex items-center gap-1.5 bg-black/20 rounded-full px-2 py-1 flex-shrink-0">
        {switching && <Loader2 className="w-3 h-3 animate-spin text-white" />}
        <select
          value={activeRole || ''}
          onChange={(e) => e.target.value && handleRoleSwitch(e.target.value)}
          disabled={!!switching}
          className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer appearance-none pr-1"
        >
          {!activeRole && <option value="" disabled>Switch portal</option>}
          {DEMO_ROLES.map((r) => (
            <option key={r.key} value={r.key} className="text-black bg-white">
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: pill buttons */}
      <div className="hidden lg:flex items-center gap-1 bg-black/20 rounded-full p-1 flex-shrink-0">
        {DEMO_ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => handleRoleSwitch(r.key)}
            disabled={!!switching}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
              activeRole === r.key
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {switching === r.key && <Loader2 className="w-3 h-3 animate-spin" />}
            {r.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-semibold whitespace-nowrap transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit Demo</span>
      </button>
    </div>
  );
}
