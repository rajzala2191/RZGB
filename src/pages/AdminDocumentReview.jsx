import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import DocumentPreview from '@/components/DocumentPreview';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FileText, CheckCircle2, XCircle, Send, Clock, Loader2,
  AlertTriangle, ChevronRight, ChevronDown, Package, Layers,
  Eye, Sparkles, Star, AlertCircle, ArrowRight, RotateCcw,
  Filter, Search, RefreshCw, Info, ZapOff, Zap, FolderOpen,
  FileCheck, FileMinus, TrendingUp, Inbox,
} from 'lucide-react';

const ACCENT = '#FF6B35';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending_admin_review: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: Clock },
  PENDING_SCRUB:        { label: 'Pending Scrub',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', icon: Zap },
  SCRUBBED:             { label: 'Scrubbed',        color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)',  icon: FileCheck },
  approved:             { label: 'Approved',        color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  icon: CheckCircle2 },
  rejected:             { label: 'Rejected',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: XCircle },
  sent_to_client:       { label: 'Sent to Client', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: Send },
};

const FILE_TYPE = {
  client_drawing:      { label: 'Client Drawing',      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  supplier_submission: { label: 'Supplier Submission',  color: ACCENT,    bg: 'rgba(255,107,53,0.1)'  },
  certificate:         { label: 'Certificate',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  report:              { label: 'Report',               color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
};

const FILTERS = [
  { key: 'all',                  label: 'All',              icon: Layers     },
  { key: 'needs_action',         label: 'Needs Action',     icon: AlertCircle },
  { key: 'ready_to_send',        label: 'Ready to Send',    icon: Send        },
  { key: 'approved',             label: 'Approved',         icon: CheckCircle2},
  { key: 'rejected',             label: 'Rejected',         icon: XCircle     },
  { key: 'sent_to_client',       label: 'Sent to Client',   icon: FileCheck   },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.25, delay: i * 0.05 } }),
};

// ── Group documents by order ──────────────────────────────────────────────────
function groupByOrder(docs) {
  const map = new Map();
  docs.forEach(doc => {
    const oid = doc.order_id || 'unknown';
    if (!map.has(oid)) {
      map.set(oid, {
        orderId:  oid,
        partName: doc.order?.part_name || 'Unknown Part',
        rzJobId:  doc.order?.rz_job_id || '—',
        supplier: doc.supplierName || null,
        docs: [],
      });
    }
    map.get(oid).docs.push(doc);
  });
  return Array.from(map.values());
}

// ── Smart recommendations engine ──────────────────────────────────────────────
function getRecommendations(orders) {
  const recs = [];
  const readyToSend = orders.filter(o =>
    o.docs.length > 0 && o.docs.every(d => d.status === 'approved')
  );
  const hasRejected = orders.filter(o => o.docs.some(d => d.status === 'rejected'));
  const pendingHigh = orders.filter(o =>
    o.docs.filter(d => d.status === 'pending_admin_review').length >= 3
  );

  if (readyToSend.length)
    recs.push({ type: 'success', icon: Send,         msg: `${readyToSend.length} order${readyToSend.length > 1 ? 's have' : ' has'} all documents approved and ready to send to client.`, orders: readyToSend });
  if (hasRejected.length)
    recs.push({ type: 'warn',    icon: RotateCcw,    msg: `${hasRejected.length} order${hasRejected.length > 1 ? 's have' : ' has'} rejected documents awaiting supplier resubmission.`, orders: hasRejected });
  if (pendingHigh.length)
    recs.push({ type: 'info',    icon: AlertTriangle, msg: `${pendingHigh.length} order${pendingHigh.length > 1 ? 's have' : ' has'} 3+ documents pending — prioritise review.`, orders: pendingHigh });

  return recs;
}

export default function AdminDocumentReview() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [documents,    setDocuments]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [selectedDoc,  setSelectedDoc]  = useState(null);
  const [notes,        setNotes]        = useState('');
  const [actionLoading,setActionLoading]= useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const t = isDark ? {
    page: '#0d0d1a', card: '#13131f', cardBorder: '#1e1e30',
    inner: '#0a0a14', innerBorder: '#1a1a28',
    pri: '#f1f5f9', sec: '#94a3b8', mid: '#64748b',
    inputBg: '#0d0d1a', inputBorder: '#1e1e30', divider: '#1e1e30',
    panelBg: '#0f0f1e', chipBg: '#1a1a2e',
  } : {
    page: '#f1f5f9', card: '#ffffff', cardBorder: '#e2e8f0',
    inner: '#f8fafc', innerBorder: '#e2e8f0',
    pri: '#0f172a', sec: '#475569', mid: '#94a3b8',
    inputBg: '#f8fafc', inputBorder: '#cbd5e1', divider: '#e2e8f0',
    panelBg: '#f1f5f9', chipBg: '#f1f5f9',
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      // Step 1: documents + basic order info
      const { data: docs, error } = await supabaseAdmin
        .from('documents')
        .select('id, order_id, file_name, file_path, file_type, status, created_at, order:order_id(id, part_name, rz_job_id, supplier_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Step 2: resolve supplier names from profiles for any assigned supplier_ids
      const supplierIds = [...new Set((docs || []).map(d => d.order?.supplier_id).filter(Boolean))];
      let supplierMap = {};
      if (supplierIds.length) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, company_name')
          .in('id', supplierIds);
        (profiles || []).forEach(p => { supplierMap[p.id] = p.company_name; });
      }

      // Step 3: merge supplier name into each doc
      const enriched = (docs || []).map(d => ({
        ...d,
        supplierName: d.order?.supplier_id ? (supplierMap[d.order.supplier_id] || 'Unknown Supplier') : null,
      }));

      setDocuments(enriched);
    } catch (err) {
      toast({ title: 'Fetch Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const sub = supabaseAdmin
      .channel('doc-review-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchDocuments)
      .subscribe();
    return () => supabaseAdmin.removeChannel(sub);
  }, [fetchDocuments]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const allOrders = useMemo(() => groupByOrder(documents), [documents]);

  const filteredOrders = useMemo(() => {
    let orders = allOrders;

    if (search.trim()) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        o.partName.toLowerCase().includes(q) ||
        o.rzJobId.toLowerCase().includes(q) ||
        o.supplier.toLowerCase().includes(q) ||
        o.docs.some(d => d.file_name.toLowerCase().includes(q))
      );
    }

    if (activeFilter === 'all') return orders;
    if (activeFilter === 'needs_action')
      return orders.filter(o => o.docs.some(d => d.status === 'pending_admin_review'));
    if (activeFilter === 'ready_to_send')
      return orders.filter(o => o.docs.length > 0 && o.docs.every(d => d.status === 'approved'));
    return orders.filter(o => o.docs.some(d => d.status === activeFilter));
  }, [allOrders, activeFilter, search]);

  const recommendations = useMemo(() => getRecommendations(allOrders), [allOrders]);

  const stats = useMemo(() => ({
    pending:  documents.filter(d => d.status === 'pending_admin_review').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
    sent:     documents.filter(d => d.status === 'sent_to_client').length,
    total:    documents.length,
  }), [documents]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const runAction = async (action, doc) => {
    setActionLoading(action + doc.id);
    const statusMap = {
      approve:       'approved',
      reject:        'rejected',
      send_to_client:'sent_to_client',
    };
    try {
      await supabaseAdmin.from('documents').update({
        status: statusMap[action],
      }).eq('id', doc.id);

      await supabaseAdmin.from('audit_logs').insert({
        action:        `document_${action}`,
        resource_type: 'document',
        resource_id:   doc.id,
        details:       `${action} document: ${doc.file_name}${notes ? ` — ${notes}` : ''}`,
        created_at:    new Date().toISOString(),
      });

      toast({
        title: action === 'approve' ? 'Document Approved' : action === 'reject' ? 'Document Rejected' : 'Sent to Client',
        description: `${doc.file_name} updated.`,
        variant: action === 'reject' ? 'destructive' : 'success',
      });

      setSelectedDoc(null);
      setNotes('');
      fetchDocuments();
    } catch (err) {
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const Badge = ({ status }) => {
    const s = STATUS[status] || STATUS.pending_admin_review;
    const Icon = s.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
        padding: '2px 8px', borderRadius: 999,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>
        <Icon size={10} /> {s.label.toUpperCase()}
      </span>
    );
  };

  const TypeChip = ({ fileType }) => {
    const ft = FILE_TYPE[fileType] || { label: fileType || 'Document', color: t.mid, bg: t.chipBg };
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
        background: ft.bg, color: ft.color,
      }}>{ft.label}</span>
    );
  };

  const inputStyle = {
    width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 13, color: t.pri, outline: 'none',
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ControlCentreLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, gap: 10 }}>
          <Loader2 size={28} style={{ color: ACCENT }} className="animate-spin" />
          <span style={{ color: t.sec, fontSize: 14 }}>Loading documents…</span>
        </div>
      </ControlCentreLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ControlCentreLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,107,53,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,107,53,0.25)' }}>
                <FileText size={20} style={{ color: ACCENT }} />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: t.pri, margin: 0 }}>Drawing Review Hub</h1>
                <p style={{ fontSize: 13, color: t.sec, margin: 0 }}>Review, approve & release supplier documents — grouped by order</p>
              </div>
            </div>
            <button onClick={fetchDocuments}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 8,
                fontSize: 12, fontWeight: 600, color: t.sec, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Pending Review', val: stats.pending,  color: '#f59e0b', icon: Clock },
              { label: 'Approved',       val: stats.approved, color: '#22c55e', icon: CheckCircle2 },
              { label: 'Rejected',       val: stats.rejected, color: '#ef4444', icon: XCircle },
              { label: 'Sent to Client', val: stats.sent,     color: '#10b981', icon: Send },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} style={{ background: t.card, border: `1px solid ${t.cardBorder}`,
                borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: t.pri, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: t.mid, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Smart Recommendations ────────────────────────────────── */}
        <AnimatePresence>
          {recommendations.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Sparkles size={13} style={{ color: ACCENT }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Smart Recommendations
                </span>
              </div>
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                const colors = {
                  success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' },
                  warn:    { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
                  info:    { bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)', color: ACCENT },
                }[rec.type];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    borderRadius: 10, padding: '10px 14px' }}>
                    <Icon size={15} style={{ color: colors.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: t.sec, flex: 1 }}>{rec.msg}</span>
                    {rec.type === 'success' && (
                      <button onClick={() => setActiveFilter('ready_to_send')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                          color: colors.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        View <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter + Search bar ──────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: t.mid }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by part name, job ID, supplier, or filename…"
              style={{ ...inputStyle, paddingLeft: 32, borderRadius: 9 }}
            />
          </div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const Icon = f.icon;
              const active = activeFilter === f.key;
              const count = f.key === 'all' ? documents.length
                : f.key === 'needs_action' ? documents.filter(d => d.status === 'pending_admin_review').length
                : f.key === 'ready_to_send' ? allOrders.filter(o => o.docs.length > 0 && o.docs.every(d => d.status === 'approved')).length
                : documents.filter(d => d.status === f.key).length;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: active ? ACCENT : t.card,
                    color: active ? '#fff' : t.sec,
                    border: `1px solid ${active ? 'transparent' : t.cardBorder}`,
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={12} />
                  {f.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,0.25)' : t.chipBg,
                      color: active ? '#fff' : t.mid,
                      padding: '1px 6px', borderRadius: 999,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Main: Order list + Preview panel ─────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '420px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>

          {/* ── Order list ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredOrders.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show"
                style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
                  padding: '48px 24px', textAlign: 'center' }}>
                <Inbox size={36} style={{ color: t.mid, opacity: 0.5, margin: '0 auto 10px' }} />
                <p style={{ color: t.mid, fontSize: 14, margin: 0 }}>No orders match this filter</p>
              </motion.div>
            ) : filteredOrders.map((order, oi) => {
              const isExpanded = expandedOrders.has(order.orderId);
              const pendingCount  = order.docs.filter(d => d.status === 'pending_admin_review').length;
              const approvedCount = order.docs.filter(d => d.status === 'approved').length;
              const rejectedCount = order.docs.filter(d => d.status === 'rejected').length;
              const allApproved   = order.docs.length > 0 && order.docs.every(d => d.status === 'approved');
              const hasRejected   = rejectedCount > 0;

              return (
                <motion.div key={order.orderId} variants={fadeUp} initial="hidden" animate="show" custom={oi}
                  style={{
                    background: t.card,
                    border: `1px solid ${allApproved ? 'rgba(34,197,94,0.3)' : hasRejected ? 'rgba(239,68,68,0.2)' : t.cardBorder}`,
                    borderRadius: 14, overflow: 'hidden',
                  }}>
                  {/* Order header */}
                  <button onClick={() => toggleOrder(order.orderId)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    {/* Collapse arrow */}
                    <ChevronRight size={15} style={{ color: t.mid, flexShrink: 0,
                      transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />

                    {/* Order icon */}
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: allApproved ? 'rgba(34,197,94,0.12)' : hasRejected ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,53,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${allApproved ? 'rgba(34,197,94,0.25)' : hasRejected ? 'rgba(239,68,68,0.2)' : 'rgba(255,107,53,0.2)'}` }}>
                      <Package size={15} style={{ color: allApproved ? '#22c55e' : hasRejected ? '#ef4444' : ACCENT }} />
                    </div>

                    {/* Order info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: t.pri }}
                          className="truncate">{order.partName}</span>
                        {order.rzJobId !== '—' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT,
                            background: 'rgba(255,107,53,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                            {order.rzJobId}
                          </span>
                        )}
                        {allApproved && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e',
                            background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                            READY TO SEND
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: t.mid, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {order.supplier
                          ? <span style={{ color: '#22c55e', fontWeight: 600 }}>{order.supplier}</span>
                          : <span style={{ color: t.mid, fontStyle: 'italic' }}>No supplier assigned</span>
                        }
                        <span>&bull;</span>
                        <span>{order.docs.length} doc{order.docs.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Doc count chips */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {pendingCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                          {pendingCount} pending
                        </span>
                      )}
                      {approvedCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                          {approvedCount} approved
                        </span>
                      )}
                      {rejectedCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {rejectedCount} rejected
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Document rows */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${t.divider}` }}>
                        {order.docs.map((doc, di) => {
                          const isSelected = selectedDoc?.id === doc.id;
                          return (
                            <div key={doc.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 16px 10px 52px',
                                background: isSelected ? 'rgba(255,107,53,0.06)' : di % 2 === 0 ? 'transparent' : `${t.inner}88`,
                                borderBottom: di < order.docs.length - 1 ? `1px solid ${t.divider}` : 'none',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                              onClick={() => {
                                setSelectedDoc(isSelected ? null : doc);
                                setNotes('');
                              }}>
                              <FileText size={13} style={{ color: ACCENT, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: t.pri }} className="truncate">
                                  {doc.file_name}
                                </div>
                                <div style={{ fontSize: 10, color: t.mid, marginTop: 1 }}>
                                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                                </div>
                              </div>
                              <TypeChip fileType={doc.file_type} />
                              <Badge status={doc.status} />
                              <Eye size={13} style={{ color: isSelected ? ACCENT : t.mid, flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* ── Preview + Action panel ──────────────────────────────── */}
          <AnimatePresence>
            {selectedDoc && (
              <motion.div
                key="preview-panel"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'sticky', top: 24,
                  background: t.card, border: `1px solid ${t.cardBorder}`,
                  borderRadius: 16, overflow: 'hidden',
                }}>
                {/* Panel header */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`,
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={15} style={{ color: ACCENT }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.pri }} className="truncate">
                      {selectedDoc.file_name}
                    </div>
                    <div style={{ fontSize: 11, color: t.mid }}>
                      {selectedDoc.order?.part_name} &bull; {selectedDoc.order?.rz_job_id || '—'}
                    </div>
                  </div>
                  <Badge status={selectedDoc.status} />
                  <button onClick={() => setSelectedDoc(null)}
                    style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: t.mid, borderRadius: 6 }}>
                    <XCircle size={15} />
                  </button>
                </div>

                {/* Document preview */}
                <div style={{ padding: 16 }}>
                  <DocumentPreview
                    filePath={selectedDoc.file_path}
                    fileName={selectedDoc.file_name}
                    compact
                  />
                </div>

                {/* Notes input */}
                <div style={{ padding: '0 16px 14px' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.mid,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Review Note (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add approval notes, correction details, or rejection reason…"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedDoc.status === 'pending_admin_review' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        onClick={() => runAction('approve', selectedDoc)}
                        disabled={actionLoading === `approve${selectedDoc.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                          background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                          border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer',
                          opacity: actionLoading ? 0.6 : 1,
                        }}>
                        {actionLoading === `approve${selectedDoc.id}`
                          ? <><Loader2 size={14} className="animate-spin" /> Approving…</>
                          : <><CheckCircle2 size={14} /> Approve</>}
                      </button>
                      <button
                        onClick={() => runAction('reject', selectedDoc)}
                        disabled={!!actionLoading}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                          opacity: actionLoading ? 0.6 : 1,
                        }}>
                        {actionLoading === `reject${selectedDoc.id}`
                          ? <><Loader2 size={14} className="animate-spin" /> Rejecting…</>
                          : <><XCircle size={14} /> Reject</>}
                      </button>
                    </div>
                  )}

                  {selectedDoc.status === 'approved' && (
                    <button
                      onClick={() => runAction('send_to_client', selectedDoc)}
                      disabled={!!actionLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`,
                        color: '#fff', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(255,107,53,0.25)',
                        opacity: actionLoading ? 0.6 : 1,
                      }}>
                      {actionLoading === `send_to_client${selectedDoc.id}`
                        ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                        : <><Send size={14} /> Send to Client</>}
                    </button>
                  )}

                  {selectedDoc.status === 'rejected' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 9, padding: '10px 12px' }}>
                      <RotateCcw size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#ef4444' }}>
                        Awaiting supplier resubmission. A new document will appear here once uploaded.
                      </span>
                    </div>
                  )}

                  {selectedDoc.status === 'sent_to_client' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 9, padding: '10px 12px' }}>
                      <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#10b981' }}>Document has been sent to the client.</span>
                    </div>
                  )}
                </div>

                {/* Metadata footer */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.divider}`,
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Uploaded', value: format(new Date(selectedDoc.created_at), 'dd MMM yyyy HH:mm') },
                    { label: 'File Type', value: FILE_TYPE[selectedDoc.file_type]?.label || selectedDoc.file_type },
                    { label: 'Status', value: STATUS[selectedDoc.status]?.label || selectedDoc.status },
                    { label: 'Doc ID', value: selectedDoc.id.slice(0, 8).toUpperCase() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: t.mid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontSize: 11, color: t.sec, marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </ControlCentreLayout>
  );
}
