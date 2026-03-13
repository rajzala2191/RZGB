import { useState } from 'react';
import { Bell, Mail, Zap, CheckCircle, XCircle, Eye } from 'lucide-react';
import { SURFACE } from '@/lib/theme';

/* ─── Section card ──────────────────────────────────────── */
function Section({ title, icon: Icon, description, children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: SURFACE.bg, border: `1px solid ${SURFACE.edge}` }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${SURFACE.edge}`, background: SURFACE.raised }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: SURFACE.bg, border: `1px solid ${SURFACE.edge}` }}
        >
          <Icon size={14} style={{ color: SURFACE.body }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: SURFACE.heading }}>{title}</p>
          {description && (
            <p className="text-xs" style={{ color: SURFACE.caption }}>{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Toggle row ────────────────────────────────────────── */
function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${SURFACE.edgeSubtle}` }}>
      <div>
        <p className="text-sm font-medium" style={{ color: SURFACE.heading }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: SURFACE.caption }}>{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-4"
        style={{
          background: value ? 'var(--heading)' : 'var(--edge-strong)',
        }}
        aria-label={value ? 'Disable' : 'Enable'}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
          style={{
            background: 'var(--app-bg)',
            transform: value ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

/* ─── Edge function list ─────────────────────────────────── */
const EDGE_FUNCTIONS = [
  { name: 'approve-demo-request', description: 'Approves demo request, creates workspace + admin user', status: 'active' },
  { name: 'send-demo-email',      description: 'Sends approval/rejection emails via Resend',           status: 'active' },
  { name: 'admin-set-password',   description: 'Forces password reset for any user (super_admin only)', status: 'active' },
  { name: 'verify-jwt',           description: 'JWT verification middleware for protected calls',       status: 'active' },
  { name: 'create-audit-log',     description: 'Writes structured events to the audit_logs table',     status: 'active' },
];

/* ─── Notification types ─────────────────────────────────── */
const NOTIFICATION_TYPES = [
  { key: 'BID_AWARDED',        label: 'Bid Awarded',        description: 'Notify supplier when a bid is accepted' },
  { key: 'BID_REJECTED',       label: 'Bid Rejected',       description: 'Notify supplier when a bid is declined' },
  { key: 'ORDER_CREATED',      label: 'Order Created',      description: 'Notify admins when a new order is placed' },
  { key: 'ORDER_STATUS_CHANGE',label: 'Order Status Change',description: 'Notify client when order status updates' },
  { key: 'DEMO_REQUESTED',     label: 'Demo Requested',     description: 'Notify super_admin when a demo request comes in' },
  { key: 'DEMO_APPROVED',      label: 'Demo Approved',      description: 'Send welcome email to newly approved workspace' },
  { key: 'INVOICE_ISSUED',     label: 'Invoice Issued',     description: 'Notify client when a new invoice is available' },
  { key: 'PO_CREATED',         label: 'PO Created',         description: 'Notify supplier when a purchase order is issued' },
];

const LS_KEY = 'rzgb-notification-toggles';

function loadToggles() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return Object.fromEntries(NOTIFICATION_TYPES.map(n => [n.key, true]));
}

/* ─── Email template preview ─────────────────────────────── */
const EMAIL_PREVIEW = `
Subject: Your Zaproc access is ready 🎉

Hi [First Name],

Great news — your demo access to Zaproc has been approved.

Platform: [Company Name]
Login:    [email]
Password: (set at first login)

What's next:
  1. Log in at app.zaproc.com
  2. Create your first order
  3. Invite your team members

If you have any questions, reply to this email.

— The Zaproc Team
`.trim();

/* ─── Main component ────────────────────────────────────── */
export default function PlatformNotificationsPage() {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [toggles, setToggles] = useState(loadToggles);

  const setToggle = (key, val) => {
    const next = { ...toggles, [key]: val };
    setToggles(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: SURFACE.caption }}>
          System
        </p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: SURFACE.heading }}>
          Notifications
        </h1>
        <p className="text-sm mt-0.5" style={{ color: SURFACE.caption }}>
          Email provider status, Edge Function health, and notification configuration
        </p>
      </div>

      {/* Email provider status */}
      <Section
        title="Email Provider"
        icon={Mail}
        description="Resend API configuration"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Provider',    value: 'Resend' },
            { label: 'API key',     value: 'RESEND_API_KEY  •••••••••••••••' },
            { label: 'From address',value: 'RESEND_FROM env var' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-4"
              style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: SURFACE.caption }}>
                {item.label}
              </p>
              <p className="text-sm font-mono font-semibold truncate" style={{ color: SURFACE.heading }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: SURFACE.faint }}>
          Configure <code className="font-mono">RESEND_API_KEY</code> and <code className="font-mono">RESEND_FROM</code> in your Supabase Edge Function secrets.
        </p>
      </Section>

      {/* Edge function health */}
      <Section
        title="Edge Function Health"
        icon={Zap}
        description="Supabase Edge Functions deployed in this project"
      >
        <div className="space-y-2">
          {EDGE_FUNCTIONS.map(fn => (
            <div
              key={fn.name}
              className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}` }}
            >
              <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-semibold" style={{ color: SURFACE.heading }}>
                  {fn.name}
                </p>
                <p className="text-xs" style={{ color: SURFACE.caption }}>{fn.description}</p>
              </div>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                deployed
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: SURFACE.faint }}>
          Live invocation logs available in the Supabase dashboard → Edge Functions.
        </p>
      </Section>

      {/* Demo email template preview */}
      <Section
        title="Demo Approval Email Template"
        icon={Eye}
        description="Email sent automatically when a demo request is approved"
      >
        <button
          type="button"
          onClick={() => setShowEmailPreview(v => !v)}
          className="flex items-center gap-2 text-xs font-semibold mb-4"
          style={{ color: SURFACE.body }}
        >
          <Eye size={12} />
          {showEmailPreview ? 'Hide preview' : 'Show preview'}
        </button>
        {showEmailPreview && (
          <pre
            className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-5 font-mono overflow-x-auto"
            style={{
              background: SURFACE.raised,
              border: `1px solid ${SURFACE.edge}`,
              color: SURFACE.body,
            }}
          >
            {EMAIL_PREVIEW}
          </pre>
        )}
      </Section>

      {/* Notification types */}
      <Section
        title="Notification Types"
        icon={Bell}
        description="Toggle which notification events are sent — stored locally"
      >
        <div>
          {NOTIFICATION_TYPES.map(n => (
            <ToggleRow
              key={n.key}
              label={n.label}
              description={n.description}
              value={toggles[n.key] ?? true}
              onChange={val => setToggle(n.key, val)}
            />
          ))}
          <div style={{ borderBottom: 'none', paddingBottom: 0 }} />
        </div>
        <p className="text-xs mt-4" style={{ color: SURFACE.faint }}>
          Toggle state is stored in <code className="font-mono">localStorage</code>. Connect to a DB column to persist across sessions.
        </p>
      </Section>
    </div>
  );
}
