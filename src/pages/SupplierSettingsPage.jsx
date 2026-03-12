import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, LifeBuoy, ChevronRight, Palette, Shield } from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import AccountSecuritySection from '@/components/AccountSecuritySection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';

const QUICK_LINKS = [
  {
    icon: UserCircle,
    label: 'My Profile',
    desc: 'Update your company profile, capabilities and certifications',
    path: '/supplier-hub/profile',
  },
  {
    icon: LifeBuoy,
    label: 'Support',
    desc: 'Raise a ticket or view your existing support requests',
    path: '/supplier-hub/support',
  },
];

export default function SupplierSettingsPage() {
  const navigate = useNavigate();

  return (
    <SupplierHubLayout>
      <Helmet>
        <title>Settings - RZ Global Solutions</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-8 pb-20">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--heading)' }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>
            Manage your account, appearance and support preferences.
          </p>
        </div>

        {/* Quick-access cards */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--caption)' }}>
            Account
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map(({ icon: Icon, label, desc, path }, i) => (
              <motion.button
                key={path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(path)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 group"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--edge)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_GLOW}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--edge)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: ACCENT_GLOW, border: `1px solid ${ACCENT}30` }}
                >
                  <Icon size={18} style={{ color: ACCENT }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--body)' }}>{desc}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--caption)' }} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--caption)' }}>
            Appearance
          </p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <Palette size={18} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Theme</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--body)' }}>
                  Switch between light, dark, or system default
                </p>
              </div>
            </div>
            <ThemeToggle />
          </motion.div>
        </section>

        {/* Security — embedded */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--caption)' }}>
            Security
          </p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--edge)' }}
            >
              <Shield size={16} style={{ color: ACCENT }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>
                Account Security
              </p>
            </div>
            <div className="p-5">
              <AccountSecuritySection variant="themed" />
            </div>
          </motion.div>
        </section>

      </div>
    </SupplierHubLayout>
  );
}
