import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAllWorkspaces, setUserAdminScope, updateWorkspaceStatus } from '@/services/workspaceService';
import {
  Lock, Shield, Users, AlertTriangle, ChevronDown,
  Loader2, CheckCircle, XCircle,
} from 'lucide-react';
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

/* ─── Small action button ───────────────────────────────── */
function ActionBtn({ onClick, loading, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: danger ? 'rgba(239,68,68,0.06)' : SURFACE.raised,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : SURFACE.edge}`,
        color: danger ? '#ef4444' : SURFACE.body,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Main component ────────────────────────────────────── */
export default function PlatformSecurityPage() {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState(null);

  // Promote/demote select
  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteRole, setPromoteRole] = useState('admin');

  // Suspend workspace select
  const [suspendWsId, setSuspendWsId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesRes, wsRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
        fetchAllWorkspaces(),
      ]);
      const profiles = profilesRes.data || [];
      setAllProfiles(profiles);
      setSuperAdmins(profiles.filter(p => p.role === 'super_admin'));
      if (wsRes.data) setWorkspaces(wsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePromote = async () => {
    if (!promoteUserId) return;
    setActionLoading(prev => ({ ...prev, promote: true }));
    try {
      const { error } = await setUserAdminScope(promoteUserId, promoteRole);
      if (error) throw error;
      flash(`Role updated to ${promoteRole}`);
      loadData();
    } catch (e) {
      flash(e.message || 'Failed to update role', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, promote: false }));
    }
  };

  const handleSuspend = async () => {
    if (!suspendWsId) return;
    const ws = workspaces.find(w => w.id === suspendWsId);
    const newStatus = ws?.status === 'suspended' ? 'active' : 'suspended';
    if (!window.confirm(`${newStatus === 'suspended' ? 'Suspend' : 'Reactivate'} workspace "${ws?.name}"?`)) return;

    setActionLoading(prev => ({ ...prev, suspend: true }));
    try {
      const { error } = await updateWorkspaceStatus(suspendWsId, newStatus);
      if (error) throw error;
      flash(`Workspace ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      loadData();
    } catch (e) {
      flash(e.message || 'Failed to update workspace status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, suspend: false }));
    }
  };

  const selectStyle = {
    background: SURFACE.raised,
    border: `1px solid ${SURFACE.edge}`,
    borderRadius: 8,
    color: SURFACE.heading,
    fontSize: 12,
    padding: '6px 10px',
    outline: 'none',
    flex: 1,
    minWidth: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin" size={28} style={{ color: SURFACE.caption }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: SURFACE.caption }}>
          System
        </p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: SURFACE.heading }}>
          Security
        </h1>
        <p className="text-sm mt-0.5" style={{ color: SURFACE.caption }}>
          Platform-level access controls, role management, and workspace suspension
        </p>
      </div>

      {/* Flash message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {message.type === 'success'
            ? <CheckCircle size={14} />
            : <XCircle size={14} />
          }
          {message.text}
        </motion.div>
      )}

      {/* Session policy */}
      <Section
        title="Session Policy"
        icon={Lock}
        description="Current authentication & session configuration"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Session timeout', value: '1 hour' },
            { label: 'Idle timeout', value: '30 minutes' },
            { label: 'Auth provider', value: 'Supabase Auth' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-4"
              style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: SURFACE.caption }}>
                {item.label}
              </p>
              <p className="text-sm font-semibold" style={{ color: SURFACE.heading }}>{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: SURFACE.faint }}>
          Session policy is managed in Supabase Auth settings. Values shown are defaults.
        </p>
      </Section>

      {/* Admin scope management */}
      <Section
        title="Admin Scope Management"
        icon={Users}
        description="Promote or demote a user's platform role"
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={promoteUserId}
            onChange={e => setPromoteUserId(e.target.value)}
            style={{ ...selectStyle, maxWidth: 280 }}
          >
            <option value="">Select user…</option>
            {allProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.company_name || p.email} ({p.role})
              </option>
            ))}
          </select>

          <select
            value={promoteRole}
            onChange={e => setPromoteRole(e.target.value)}
            style={{ ...selectStyle, maxWidth: 150 }}
          >
            <option value="super_admin">super_admin</option>
            <option value="admin">admin</option>
            <option value="client">client</option>
            <option value="supplier">supplier</option>
          </select>

          <ActionBtn onClick={handlePromote} loading={actionLoading.promote}>
            Apply role
          </ActionBtn>
        </div>
      </Section>

      {/* Super admin accounts */}
      <Section
        title="Super Admin Accounts"
        icon={Shield}
        description={`${superAdmins.length} account${superAdmins.length !== 1 ? 's' : ''} with super_admin role`}
      >
        {superAdmins.length === 0 ? (
          <p className="text-sm" style={{ color: SURFACE.caption }}>No super admins found</p>
        ) : (
          <div className="space-y-2">
            {superAdmins.map(admin => (
              <div
                key={admin.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--surface-inset)', border: `1px solid ${SURFACE.edge}`, color: SURFACE.heading }}
                  >
                    {(admin.company_name || admin.email || 'SA').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: SURFACE.heading }}>
                      {admin.company_name || admin.email}
                    </p>
                    <p className="text-xs" style={{ color: SURFACE.caption }}>{admin.email}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  super_admin
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <Section
        title="Danger Zone"
        icon={AlertTriangle}
        description="Destructive workspace operations — cannot be undone without manual intervention"
      >
        <div
          className="p-4 rounded-xl space-y-4"
          style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: SURFACE.heading }}>
              Suspend / Reactivate Workspace
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={suspendWsId}
                onChange={e => setSuspendWsId(e.target.value)}
                style={{ ...selectStyle, maxWidth: 280 }}
              >
                <option value="">Select workspace…</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} — {ws.status}
                  </option>
                ))}
              </select>
              <ActionBtn onClick={handleSuspend} loading={actionLoading.suspend} danger>
                {workspaces.find(w => w.id === suspendWsId)?.status === 'suspended'
                  ? 'Reactivate'
                  : 'Suspend'
                }
              </ActionBtn>
            </div>
            <p className="text-xs mt-2" style={{ color: SURFACE.faint }}>
              Suspended workspaces cannot be accessed by their members until reactivated.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
