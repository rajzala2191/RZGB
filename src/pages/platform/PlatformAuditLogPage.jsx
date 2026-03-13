import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAllWorkspaces } from '@/services/workspaceService';
import { ScrollText, Filter, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { SURFACE } from '@/lib/theme';

const PAGE_SIZE = 50;

const ACTION_COLORS = {
  create:  { bg: 'rgba(16,185,129,0.08)',  text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  update:  { bg: 'rgba(59,130,246,0.08)',  text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  delete:  { bg: 'rgba(239,68,68,0.08)',   text: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
  approve: { bg: 'rgba(16,185,129,0.08)',  text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  reject:  { bg: 'rgba(239,68,68,0.08)',   text: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
  login:   { bg: 'var(--surface-raised)',  text: 'var(--caption)', border: 'var(--edge)'   },
};

function actionStyle(action = '') {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return ACTION_COLORS[key] || ACTION_COLORS.login;
}

function StatusBadge({ status }) {
  const isSuccess = status === 'success' || !status;
  return (
    <span
      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
      style={{
        background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        color:      isSuccess ? '#10b981' : '#ef4444',
        border:     `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      {isSuccess ? 'ok' : 'error'}
    </span>
  );
}

export default function PlatformAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  // Filters
  const [filterWorkspace, setFilterWorkspace] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchAllWorkspaces().then(r => { if (r.data) setWorkspaces(r.data); });
  }, []);

  const fetchLogs = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      let q = supabaseAdmin
        .from('audit_logs')
        .select('*, profiles(email, company_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(reset ? 0 : page * PAGE_SIZE, (reset ? 0 : page * PAGE_SIZE) + PAGE_SIZE - 1);

      if (filterWorkspace) q = q.eq('workspace_id', filterWorkspace);
      if (filterAction)    q = q.ilike('action', `%${filterAction}%`);
      if (filterDateFrom)  q = q.gte('created_at', filterDateFrom);
      if (filterDateTo)    q = q.lte('created_at', filterDateTo + 'T23:59:59');

      const { data, count } = await q;
      const rows = data || [];

      if (reset) {
        setLogs(rows);
        setPage(1);
      } else {
        setLogs(prev => [...prev, ...rows]);
        setPage(p => p + 1);
      }
      setHasMore((reset ? rows.length : logs.length + rows.length) < (count || 0));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterWorkspace, filterAction, filterDateFrom, filterDateTo, page, logs.length]);

  useEffect(() => { fetchLogs(true); }, [filterWorkspace, filterAction, filterDateFrom, filterDateTo]); // eslint-disable-line

  const inputStyle = {
    background: SURFACE.raised,
    border: `1px solid ${SURFACE.edge}`,
    borderRadius: 8,
    color: SURFACE.heading,
    fontSize: 12,
    padding: '6px 10px',
    outline: 'none',
    minWidth: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: SURFACE.caption }}>
            Monitoring
          </p>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: SURFACE.heading }}>
            Audit Log
          </h1>
          <p className="text-sm mt-0.5" style={{ color: SURFACE.caption }}>
            Cross-tenant activity trail — who did what, when, and from which workspace
          </p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}`, color: SURFACE.body }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: SURFACE.bg, border: `1px solid ${SURFACE.edge}` }}
      >
        <Filter size={13} style={{ color: SURFACE.caption, flexShrink: 0 }} />

        <select
          value={filterWorkspace}
          onChange={e => setFilterWorkspace(e.target.value)}
          style={inputStyle}
        >
          <option value="">All workspaces</option>
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Action keyword…"
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ ...inputStyle, width: 160 }}
        />

        <input
          type="date"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          style={inputStyle}
        />
        <span style={{ color: SURFACE.caption, fontSize: 11 }}>to</span>
        <input
          type="date"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          style={inputStyle}
        />

        {(filterWorkspace || filterAction || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterWorkspace(''); setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-xs font-semibold"
            style={{ color: SURFACE.caption }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: SURFACE.bg, border: `1px solid ${SURFACE.edge}` }}
      >
        {/* Table header */}
        <div
          className="grid text-[10px] font-bold uppercase tracking-[0.1em] px-5 py-3"
          style={{
            gridTemplateColumns: '160px 1fr 200px 200px 80px',
            borderBottom: `1px solid ${SURFACE.edge}`,
            color: SURFACE.caption,
            background: SURFACE.raised,
          }}
        >
          <span>Timestamp</span>
          <span>Action</span>
          <span>User</span>
          <span>Workspace</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={22} style={{ color: SURFACE.caption }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ScrollText size={32} style={{ color: SURFACE.faint }} />
            <p className="text-sm font-medium" style={{ color: SURFACE.caption }}>No audit logs found</p>
            <p className="text-xs" style={{ color: SURFACE.faint }}>Logs appear here as users perform actions in the platform</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const as = actionStyle(log.action);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="grid items-center px-5 py-3"
                  style={{
                    gridTemplateColumns: '160px 1fr 200px 200px 80px',
                    borderBottom: i < logs.length - 1 ? `1px solid ${SURFACE.edgeSubtle}` : 'none',
                  }}
                >
                  {/* Timestamp */}
                  <span className="font-mono text-[11px]" style={{ color: SURFACE.caption }}>
                    {log.created_at ? format(new Date(log.created_at), 'dd MMM HH:mm:ss') : '—'}
                  </span>

                  {/* Action */}
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-[11px] px-2 py-0.5 rounded-md"
                      style={{ background: as.bg, color: as.text, border: `1px solid ${as.border}` }}
                    >
                      {log.action || '—'}
                    </span>
                    {log.entity_type && (
                      <span className="text-xs" style={{ color: SURFACE.caption }}>
                        {log.entity_type}
                        {log.entity_id ? ` #${String(log.entity_id).slice(0, 8)}` : ''}
                      </span>
                    )}
                  </div>

                  {/* User */}
                  <span className="text-xs truncate" style={{ color: SURFACE.body }}>
                    {log.profiles?.email || log.user_id?.slice(0, 12) || '—'}
                  </span>

                  {/* Workspace */}
                  <span className="text-xs truncate" style={{ color: SURFACE.body }}>
                    {workspaces.find(w => w.id === log.workspace_id)?.name || log.workspace_id?.slice(0, 12) || 'Platform'}
                  </span>

                  {/* Status */}
                  <StatusBadge status={log.status} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div
            className="flex items-center justify-center py-4"
            style={{ borderTop: `1px solid ${SURFACE.edge}` }}
          >
            <button
              onClick={() => fetchLogs(false)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}`, color: SURFACE.body }}
            >
              {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              Load more
            </button>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: SURFACE.faint }}>
        Showing {logs.length} entries · logs are written by <code className="font-mono">auditLogger.js</code>
      </p>
    </div>
  );
}
