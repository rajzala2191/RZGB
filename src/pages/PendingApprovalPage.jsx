import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail, LogOut, Package, BarChart2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchWorkspaceById } from '@/services/workspaceService';

const BRAND = '#FF6B35';

const PROCUREMENT_CATEGORIES = [
  { id: 'raw_materials',  label: 'Raw Materials' },
  { id: 'metals',         label: 'Metal & Alloys' },
  { id: 'electronics',    label: 'Electronics & Components' },
  { id: 'plastics',       label: 'Plastics & Polymers' },
  { id: 'chemicals',      label: 'Chemicals' },
  { id: 'packaging',      label: 'Packaging' },
  { id: 'machinery',      label: 'Machinery & Equipment' },
  { id: 'safety',         label: 'Safety & PPE' },
  { id: 'office',         label: 'Office Supplies' },
  { id: 'logistics',      label: 'Logistics & Freight' },
  { id: 'it',             label: 'IT & Technology' },
  { id: 'other',          label: 'Other' },
];

function Tag({ label }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${BRAND}18`, color: BRAND, border: `1px solid ${BRAND}40` }}
    >
      {label}
    </span>
  );
}

function SummaryItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--edge)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND}18` }}>
        <Icon size={13} style={{ color: BRAND }} />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--caption)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--heading)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  const { currentUser, workspaceId, workspaceStatus, logout, loading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (workspaceStatus === 'active') {
      navigate('/control-centre', { replace: true });
      return;
    }
    // archived = rejected; stay on this page (ProtectedRoute redirects here)
    if (workspaceId) {
      fetchWorkspaceById(workspaceId).then(({ data }) => {
        if (data?.onboarding_data) setOnboardingData(data.onboarding_data);
      });
    }
  }, [currentUser, workspaceId, workspaceStatus, loading, navigate]);

  const glassCard = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--edge)',
    boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
  };

  const catLabels = onboardingData
    ? (onboardingData.categories || [])
        .map(id => PROCUREMENT_CATEGORIES.find(c => c.id === id)?.label)
        .filter(Boolean)
    : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Animated check icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `${BRAND}20`, border: `3px solid ${BRAND}` }}
          >
            <CheckCircle2 size={40} style={{ color: BRAND }} />
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-2xl p-6 sm:p-8"
          style={{ ...glassCard, borderTop: `3px solid ${BRAND}` }}
        >
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold" style={{ color: 'var(--heading)' }}>
              {workspaceStatus === 'archived' ? 'Application Not Approved' : 'Application Submitted'}
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--body)' }}>
              {workspaceStatus === 'archived'
                ? 'Your application was not approved. Please contact support if you believe this was an error.'
                : 'Your workspace is under review. Our team will verify your details and activate your account.'}
            </p>
          </div>

          {/* Status banner */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
            style={{
              background: workspaceStatus === 'archived' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              border: workspaceStatus === 'archived' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <Clock size={16} style={{ color: workspaceStatus === 'archived' ? '#ef4444' : '#f59e0b' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: workspaceStatus === 'archived' ? '#ef4444' : '#f59e0b' }}>
                {workspaceStatus === 'archived' ? 'Not approved' : 'Awaiting approval'}
              </p>
              <p className="text-xs" style={{ color: 'var(--body)' }}>
                {workspaceStatus === 'archived' ? 'Contact support for more information' : 'Typically reviewed within 24 hours'}
              </p>
            </div>
          </div>

          {/* Submitted summary */}
          {onboardingData && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--caption)' }}>
                What you submitted
              </p>
              <SummaryItem icon={Building2} label="Industry"       value={onboardingData.industry} />
              <SummaryItem icon={Building2} label="Company Size"   value={onboardingData.companySize} />
              <SummaryItem icon={BarChart2} label="Annual Spend"   value={onboardingData.annualSpend} />
              <SummaryItem icon={BarChart2} label="Orders / Month" value={onboardingData.ordersPerMonth} />
              {catLabels.length > 0 && (
                <div className="py-2.5" style={{ borderBottom: '1px solid var(--edge)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND}18` }}>
                      <Package size={13} style={{ color: BRAND }} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--caption)' }}>What You Procure</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-10">
                    {catLabels.map(l => <Tag key={l} label={l} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
            style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}
          >
            <Mail size={15} style={{ color: 'var(--caption)' }} />
            <p className="text-xs" style={{ color: 'var(--body)' }}>
              Questions?{' '}
              <a href="mailto:support@vrocure.io" style={{ color: BRAND, fontWeight: 600 }}>
                support@vrocure.io
              </a>
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={async () => { await logout(); window.location.assign('/login'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: '1px solid var(--edge)', color: 'var(--body)', background: 'transparent' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </motion.div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--caption)' }}>
          You'll receive an email notification when your workspace is approved.
        </p>
      </div>
    </div>
  );
}
