/**
 * DemoBanner — floating FAB at bottom-right while a demo session is active.
 * Click to open an upward menu: switch portal or exit demo.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { ACCENT } from '@/lib/theme';
import { FlaskConical, Loader2, X, ChevronRight, LogOut } from 'lucide-react';

const DEMO_ROLES = [
  { key: 'client',   label: 'Client Portal',  icon: '🧑‍💼', email: 'demo.client@vrocure.co.uk',   dash: '/client-dashboard' },
  { key: 'admin',    label: 'Control Centre', icon: '🛡️',  email: 'demo.admin@vrocure.co.uk',    dash: '/control-centre' },
  { key: 'supplier', label: 'Supplier Hub',   icon: '🏭',  email: 'demo.supplier@vrocure.co.uk', dash: '/supplier-hub' },
];
const DEMO_PASSWORD = 'RZDemo2024!';

export default function DemoBanner() {
  const { logout }  = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [open, setOpen]       = useState(false);
  const [switching, setSwitching] = useState(null);
  const menuRef = useRef(null);

  // Close menu on outside click — must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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

  const activeRoleObj = DEMO_ROLES.find(r => r.key === activeRole);

  async function handleRoleSwitch(role) {
    if (switching) return;
    const target = DEMO_ROLES.find(r => r.key === role);
    if (!target) return;
    setSwitching(role);
    setOpen(false);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: target.email, password: DEMO_PASSWORD });
    setSwitching(null);
    if (!error) navigate(target.dash);
  }

  async function handleExit() {
    setOpen(false);
    await logout();
    localStorage.removeItem('rzgb-demo-session');
    navigate('/landing');
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2">

      {/* ── Upward menu ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col gap-1 p-2 rounded-2xl min-w-[200px]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--edge-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {/* Label */}
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1" style={{ color: 'var(--faint)' }}>
              Switch portal
            </p>

            {/* Role buttons */}
            {DEMO_ROLES.map(role => {
              const isActive = activeRole === role.key;
              const isLoading = switching === role.key;
              return (
                <button
                  key={role.key}
                  onClick={() => handleRoleSwitch(role.key)}
                  disabled={!!switching}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-60"
                  style={{
                    background: isActive ? 'rgba(255,107,53,0.08)' : 'transparent',
                    color: isActive ? ACCENT : 'var(--body)',
                    border: isActive ? '1px solid rgba(255,107,53,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-nav-hover-bg)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                  {isLoading
                    ? <Loader2 size={13} className="animate-spin" style={{ color: ACCENT }} />
                    : isActive
                      ? <ChevronRight size={13} style={{ color: ACCENT }} />
                      : null
                  }
                </button>
              );
            })}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--edge-subtle)', margin: '2px 4px' }} />

            {/* Exit */}
            <button
              onClick={handleExit}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={14} />
              Exit Demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB trigger ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg"
        style={{
          background: open
            ? 'linear-gradient(135deg, #e85a1f, #e8700f)'
            : 'linear-gradient(135deg, #FF6B35, #f97316)',
          boxShadow: '0 4px 20px rgba(255,107,53,0.45)',
        }}
      >
        {switching
          ? <Loader2 size={15} className="animate-spin" />
          : open
            ? <X size={15} />
            : <FlaskConical size={15} />
        }
        <span>DEMO</span>
        {activeRoleObj && !open && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {activeRoleObj.label.split(' ')[0]}
          </span>
        )}
      </motion.button>
    </div>
  );
}
