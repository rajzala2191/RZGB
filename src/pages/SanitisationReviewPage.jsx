import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import DocumentPreview from '@/components/DocumentPreview';
import { scrubDrawingWithAI } from '@/lib/aiScrubber';
import {
  Shield, CheckSquare, FileText, Loader2, AlertTriangle,
  CheckCircle2, XCircle, User, MapPin, Mail, Phone,
  Building2, DollarSign, Package, ScanLine, Trash2,
  Lock, Percent, Eye, RefreshCw, Layers, ChevronRight,
  ArrowRight, Zap, Hash, Info,
} from 'lucide-react';

const ACCENT = '#FF6B35';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.3, delay: i * 0.06 } }),
};

const SCRUB_TARGETS = [
  { icon: Building2, label: 'Company name & logo' },
  { icon: User,      label: 'Contact person name' },
  { icon: Mail,      label: 'Email address' },
  { icon: Phone,     label: 'Phone number' },
  { icon: MapPin,    label: 'Location & address' },
];

const CHECKS_CONFIG = [
  { key: 'drawings_scrubbed',       icon: ScanLine,      label: 'All client drawings AI-scrubbed',        sub: 'Every drawing has had client identity removed via AI' },
  { key: 'client_identity_removed', icon: Shield,        label: 'Client identity verified removed',       sub: 'No client details appear in any supplier-visible document' },
  { key: 'public_identity_set',     icon: Hash,          label: 'Public project identity assigned',       sub: 'RZ project name and description confirmed for suppliers' },
  { key: 'pricing_verified',        icon: DollarSign,    label: 'Pricing & margin locked',                sub: 'Target sell price reviewed with correct markup applied' },
  { key: 'approved_for_release',    icon: CheckSquare,   label: 'Approved for supplier release',          sub: 'Admin sign-off: order is ready for the supplier pool' },
];

export default function SanitisationReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [scrubStatus, setScrubStatus] = useState({});   // docId → 'idle'|'scrubbing'|'scrubbed'|'error'
  const [docViewMode, setDocViewMode] = useState({});   // docId → 'original'|'scrubbed'
  const [scrubbingAll, setScrubbingAll] = useState(false);
  const [formData, setFormData] = useState({ public_name: '', description: '', markup_pct: 20 });
  const [checks, setChecks] = useState({
    drawings_scrubbed: false, client_identity_removed: false,
    public_identity_set: false, pricing_verified: false, approved_for_release: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────
  const t = isDark ? {
    page:        '#0d0d1a',
    card:        '#13131f',
    cardBorder:  '#1e1e30',
    inner:       '#0a0a14',
    innerBorder: '#1a1a28',
    pri:         '#f1f5f9',
    sec:         '#94a3b8',
    mid:         '#64748b',
    inputBg:     '#0d0d1a',
    inputBorder: '#1e1e30',
    divider:     '#1e1e30',
    chipBg:      '#1a1a2e',
    warnBg:      'rgba(239,68,68,0.08)',
    warnBorder:  'rgba(239,68,68,0.25)',
    infoBg:      'rgba(255,107,53,0.08)',
    infoBorder:  'rgba(255,107,53,0.2)',
  } : {
    page:        '#f1f5f9',
    card:        '#ffffff',
    cardBorder:  '#e2e8f0',
    inner:       '#f8fafc',
    innerBorder: '#e2e8f0',
    pri:         '#0f172a',
    sec:         '#475569',
    mid:         '#94a3b8',
    inputBg:     '#f8fafc',
    inputBorder: '#cbd5e1',
    divider:     '#e2e8f0',
    chipBg:      '#f1f5f9',
    warnBg:      'rgba(239,68,68,0.05)',
    warnBorder:  'rgba(239,68,68,0.2)',
    infoBg:      'rgba(255,107,53,0.06)',
    infoBorder:  'rgba(255,107,53,0.18)',
  };

  // ── Derived ───────────────────────────────────────────────────────
  const drawings   = documents.filter(d => d.file_type === 'client_drawing');
  const otherDocs  = documents.filter(d => d.file_type !== 'client_drawing');

  const getDocScrubbed = (doc) =>
    doc.is_sanitised === true || doc.status === 'SCRUBBED' || scrubStatus[doc.id] === 'scrubbed';

  const allDrawingsScrubbed =
    drawings.length > 0 && drawings.every(getDocScrubbed);

  const targetSellPrice = order?.buy_price
    ? (parseFloat(order.buy_price) * (1 + Number(formData.markup_pct) / 100)).toFixed(2)
    : '';

  const allChecksComplete = CHECKS_CONFIG.every(c => checks[c.key]);

  // ── Data fetching ─────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ord } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (ord) {
        setOrder(ord);
        const tag = `RZ-PRJ-${Date.now().toString(36).toUpperCase().slice(-4)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
        setFormData(f => ({
          ...f,
          public_name:  tag,
          description:  `Precision machined ${ord.material || 'components'} — ${ord.part_name || 'custom parts'}`,
          markup_pct:   20,
        }));
        if (ord.client_id) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('company_name, contact_person, email, phone, address')
            .eq('id', ord.client_id)
            .maybeSingle();
          setClientProfile(prof);
        }
      }

      const { data: docs } = await supabaseAdmin
        .from('documents')
        .select('id, order_id, file_name, file_path, file_type, status, is_sanitised, redaction_notes, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      const docList = docs || [];
      setDocuments(docList);

      const initStatus = {}, initView = {};
      docList.forEach(d => {
        const done = d.is_sanitised === true || d.status === 'SCRUBBED';
        initStatus[d.id] = done ? 'scrubbed' : 'idle';
        initView[d.id]   = done ? 'scrubbed' : 'original';
      });
      setScrubStatus(initStatus);
      setDocViewMode(initView);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Scrub single document ─────────────────────────────────────────
  const handleScrubDoc = async (doc) => {
    setScrubStatus(s => ({ ...s, [doc.id]: 'scrubbing' }));
    try {
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('documents').download(doc.file_path);
      if (dlErr) throw dlErr;

      const clientInfo = {
        company_name:   clientProfile?.company_name   || '',
        contact_person: clientProfile?.contact_person || '',
        email:          clientProfile?.email          || '',
        phone:          clientProfile?.phone          || '',
        address:        clientProfile?.address        || '',
      };

      const scrubbedBlob = await scrubDrawingWithAI(fileData, clientInfo);

      const scrubbedPath = doc.file_path.replace(/(\.[^.]+)$/, '_scrubbed$1');
      const { error: upErr } = await supabaseAdmin.storage
        .from('documents').upload(scrubbedPath, scrubbedBlob, { upsert: true });
      if (upErr) throw upErr;

      await supabaseAdmin.from('documents').update({
        status: 'SCRUBBED', is_sanitised: true,
        redaction_notes: `Scrubbed via AI — path: ${scrubbedPath}`,
      }).eq('id', doc.id);

      setScrubStatus(s => ({ ...s, [doc.id]: 'scrubbed' }));
      setDocViewMode(v => ({ ...v, [doc.id]: 'scrubbed' }));
      setDocuments(prev => prev.map(d =>
        d.id === doc.id ? { ...d, status: 'SCRUBBED', is_sanitised: true } : d
      ));
      toast({ title: 'Scrubbing Complete', description: `${doc.file_name} sanitised successfully.`, variant: 'success' });
    } catch (err) {
      setScrubStatus(s => ({ ...s, [doc.id]: 'error' }));
      toast({ title: 'Scrubbing Failed', description: err.message, variant: 'destructive' });
    }
  };

  // ── Scrub all drawings ────────────────────────────────────────────
  const handleScrubAll = async () => {
    const pending = drawings.filter(d => !getDocScrubbed(d));
    if (!pending.length) return;
    setScrubbingAll(true);
    for (const doc of pending) await handleScrubDoc(doc);
    setScrubbingAll(false);
  };

  // ── Remove document ───────────────────────────────────────────────
  const handleRemoveDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    try {
      await supabaseAdmin.storage.from('documents').remove([doc.file_path]);
      // Also remove scrubbed copy if it was stored (path is reconstructed from original)
      const scrubbedPath = doc.file_path.replace(/(\.[^.]+)$/, '_scrubbed$1');
      await supabaseAdmin.storage.from('documents').remove([scrubbedPath]).catch(() => {});
      await supabaseAdmin.from('documents').delete().eq('id', doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: 'Document Removed' });
    } catch (err) {
      toast({ title: 'Remove Failed', description: err.message, variant: 'destructive' });
    }
  };

  // ── Authorise ─────────────────────────────────────────────────────
  const handleAuthorise = async () => {
    if (!allChecksComplete) {
      toast({ title: 'Checklist Incomplete', description: 'Complete all 5 verification items before authorising.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await supabase.from('orders').update({
        public_name: formData.public_name,
        description: formData.description,
        target_sell_price: targetSellPrice,
        order_status: 'SANITIZED',
      }).eq('id', orderId);

      await supabase.from('sanitization_records').insert([{
        order_id: orderId, admin_id: currentUser.id,
        name: formData.public_name, status: 'COMPLETED',
      }]);

      toast({ title: 'Order Sanitised', description: 'Order is ready for supplier bidding.', variant: 'success' });
      navigate('/control-centre/supplier-pool');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <ControlCentreLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10 }}>
          <Loader2 size={28} style={{ color: ACCENT }} className="animate-spin" />
          <span style={{ color: t.sec, fontSize: 14 }}>Loading order…</span>
        </div>
      </ControlCentreLayout>
    );
  }

  if (!order) {
    return (
      <ControlCentreLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10 }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          <span style={{ color: t.sec }}>Order not found.</span>
        </div>
      </ControlCentreLayout>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const map = {
      idle:      { label: 'Pending Scrub', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
      scrubbing: { label: 'Scrubbing…',    bg: 'rgba(255,107,53,0.12)', color: ACCENT,    border: 'rgba(255,107,53,0.3)' },
      scrubbed:  { label: 'Scrubbed',      bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
      error:     { label: 'Error',         bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    };
    const s = map[status] || map.idle;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        padding: '2px 8px', borderRadius: 999,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>{s.label.toUpperCase()}</span>
    );
  };

  const inputStyle = {
    width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '9px 13px', fontSize: 13, color: t.pri,
    outline: 'none', transition: 'border-color 0.15s',
  };

  const cardStyle = {
    background: t.card, border: `1px solid ${t.cardBorder}`,
    borderRadius: 16, overflow: 'hidden',
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ControlCentreLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 48 }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
          style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button onClick={() => navigate(-1)}
              style={{ color: t.mid, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Control Centre
            </button>
            <ChevronRight size={12} style={{ color: t.mid }} />
            <button onClick={() => navigate('/control-centre/sanitisation-gate')}
              style={{ color: t.mid, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Sanitisation Gate
            </button>
            <ChevronRight size={12} style={{ color: t.mid }} />
            <span style={{ fontSize: 12, color: ACCENT }}>Review</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(255,107,53,0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(255,107,53,0.25)` }}>
              <Shield size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: t.pri, margin: 0 }}>
                Sanitisation Review
              </h1>
              <p style={{ fontSize: 13, color: t.sec, margin: 0 }}>
                {order.part_name} &mdash; Review, scrub and publish securely
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.06em',
              }}>PENDING SCRUB</span>
            </div>
          </div>
        </motion.div>

        {/* ── Section 1: Order Intel + Client Identity ─────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Order details */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={15} style={{ color: ACCENT }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>Order Details</span>
            </div>
            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Part Name',  value: order.part_name },
                { label: 'Material',   value: order.material },
                { label: 'Quantity',   value: order.quantity ? `${order.quantity} pcs` : '—' },
                { label: 'Buy Price',  value: order.buy_price ? `£${parseFloat(order.buy_price).toFixed(2)}` : '—' },
                { label: 'Finish',     value: order.surface_finish || '—' },
                { label: 'Tolerance',  value: order.tolerance || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: t.inner, border: `1px solid ${t.innerBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: t.mid, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            {order.notes && (
              <div style={{ margin: '0 18px 18px', background: t.inner, border: `1px solid ${t.innerBorder}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: t.mid, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Client Notes</div>
                <p style={{ fontSize: 12, color: t.sec, margin: 0, lineHeight: 1.5 }}>{order.notes}</p>
              </div>
            )}
          </div>

          {/* Client identity — confidential */}
          <div style={{ ...cardStyle, border: `1px solid ${t.warnBorder}` }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.warnBorder}`, background: t.warnBg, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Client Identity</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                padding: '2px 8px', borderRadius: 999 }}>CONFIDENTIAL</span>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: 11, color: '#ef4444', marginBottom: 14, lineHeight: 1.5, opacity: 0.85 }}>
                This information is <strong>never</strong> shared with suppliers. AI scrubbing will remove all of the below from drawings.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: Building2, label: 'Company',  value: clientProfile?.company_name   || '—' },
                  { icon: User,      label: 'Contact',  value: clientProfile?.contact_person || '—' },
                  { icon: Mail,      label: 'Email',    value: clientProfile?.email          || '—' },
                  { icon: Phone,     label: 'Phone',    value: clientProfile?.phone          || '—' },
                  { icon: MapPin,    label: 'Address',  value: clientProfile?.address        || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    background: t.warnBg, border: `1px solid ${t.warnBorder}`, borderRadius: 8, padding: '7px 11px' }}>
                    <Icon size={13} style={{ color: '#ef4444', opacity: 0.75, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: t.mid, minWidth: 52 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.sec }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Section 2: Drawing Scrubbing ─────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}
          style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScanLine size={16} style={{ color: ACCENT }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>Drawing Scrubbing</span>
              <span style={{ fontSize: 11, color: t.mid, marginLeft: 8 }}>
                {drawings.length} drawing{drawings.length !== 1 ? 's' : ''} &bull; {drawings.filter(getDocScrubbed).length} scrubbed
              </span>
            </div>
            {drawings.length > 0 && !drawings.every(getDocScrubbed) && (
              <button
                onClick={handleScrubAll}
                disabled={scrubbingAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`,
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  cursor: scrubbingAll ? 'not-allowed' : 'pointer', opacity: scrubbingAll ? 0.6 : 1,
                }}
              >
                {scrubbingAll
                  ? <><Loader2 size={13} className="animate-spin" /> Scrubbing All…</>
                  : <><Zap size={13} /> Scrub All Drawings</>}
              </button>
            )}
            {drawings.every(getDocScrubbed) && drawings.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> All Clean
              </span>
            )}
          </div>

          {/* What AI removes info bar */}
          <div style={{ padding: '10px 20px', background: t.infoBg, borderBottom: `1px solid ${t.infoBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: ACCENT, fontWeight: 600 }}>
              <Info size={12} /> AI will remove:
            </div>
            {SCRUB_TARGETS.map(({ icon: Icon, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: t.sec,
                background: t.chipBg, border: `1px solid ${t.innerBorder}`, padding: '2px 8px', borderRadius: 6 }}>
                <Icon size={11} style={{ color: ACCENT, opacity: 0.8 }} /> {label}
              </span>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {drawings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: t.mid, fontSize: 13 }}>
                <Layers size={28} style={{ color: t.mid, opacity: 0.4, margin: '0 auto 8px' }} />
                <p style={{ margin: 0 }}>No client drawings uploaded for this order.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {drawings.map((doc) => {
                  const status = scrubStatus[doc.id] || 'idle';
                  const isScrubbed = status === 'scrubbed';
                  const isScrubbing = status === 'scrubbing';
                  const viewMode = docViewMode[doc.id] || 'original';
                  const filePath = viewMode === 'scrubbed' && doc.scrubbed_file_path ? doc.scrubbed_file_path : doc.file_path;

                  return (
                    <motion.div key={doc.id} variants={fadeUp} initial="hidden" animate="show"
                      style={{ background: t.inner, border: `1px solid ${isScrubbed ? 'rgba(34,197,94,0.25)' : t.innerBorder}`, borderRadius: 12, overflow: 'hidden' }}>
                      {/* Doc header */}
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${t.divider}` }}>
                        <FileText size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.pri, flex: 1, minWidth: 0 }}
                          className="truncate">{doc.file_name}</span>
                        <StatusBadge status={status} />

                        {/* View toggle */}
                        {isScrubbed && (
                          <div style={{ display: 'flex', border: `1px solid ${t.cardBorder}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                            {['original', 'scrubbed'].map(mode => (
                              <button key={mode} onClick={() => setDocViewMode(v => ({ ...v, [doc.id]: mode }))}
                                style={{
                                  padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                                  background: viewMode === mode ? ACCENT : t.chipBg,
                                  color: viewMode === mode ? '#fff' : t.sec,
                                  transition: 'all 0.15s',
                                }}>
                                {mode === 'original' ? 'Before' : 'After'}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Scrub button */}
                        {!isScrubbed && (
                          <button onClick={() => handleScrubDoc(doc)} disabled={isScrubbing}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: isScrubbing ? t.chipBg : `rgba(255,107,53,0.12)`,
                              color: isScrubbing ? t.mid : ACCENT,
                              border: `1px solid ${isScrubbing ? t.cardBorder : 'rgba(255,107,53,0.3)'}`,
                              borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600,
                              cursor: isScrubbing ? 'not-allowed' : 'pointer', flexShrink: 0,
                            }}>
                            {isScrubbing
                              ? <><Loader2 size={12} className="animate-spin" /> Scrubbing…</>
                              : <><ScanLine size={12} /> Scrub Drawing</>}
                          </button>
                        )}

                        {/* Retry on error */}
                        {status === 'error' && (
                          <button onClick={() => handleScrubDoc(doc)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.12)',
                              color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7,
                              padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                            <RefreshCw size={12} /> Retry
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => handleRemoveDoc(doc)}
                          style={{ padding: '5px 7px', background: 'none', border: 'none',
                            color: t.mid, cursor: 'pointer', borderRadius: 6, flexShrink: 0 }}
                          title="Delete document">
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Preview */}
                      <div style={{ padding: 12 }}>
                        {isScrubbing ? (
                          <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: 10, background: t.card, borderRadius: 8,
                            border: `1px solid ${t.cardBorder}` }}>
                            <Loader2 size={24} style={{ color: ACCENT }} className="animate-spin" />
                            <span style={{ fontSize: 12, color: t.mid }}>AI is removing client identity…</span>
                          </div>
                        ) : (
                          <DocumentPreview filePath={filePath} fileName={doc.file_name} compact />
                        )}
                        {isScrubbed && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                            <CheckCircle2 size={12} />
                            {viewMode === 'scrubbed'
                              ? 'Viewing scrubbed version — client identity removed'
                              : 'Viewing original — switch to "After" to see scrubbed version'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Other docs */}
            {otherDocs.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${t.divider}`, paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: t.mid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Other Documents ({otherDocs.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {otherDocs.map(doc => (
                    <div key={doc.id} style={{ position: 'relative' }}>
                      <DocumentPreview filePath={doc.file_path} fileName={doc.file_name} compact />
                      <button onClick={() => handleRemoveDoc(doc)}
                        style={{ position: 'absolute', top: 8, right: 8, padding: '3px 5px',
                          background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 5,
                          color: '#fff', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Section 3: Public Identity + Pricing ─────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Public identity */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={15} style={{ color: ACCENT }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>Public Project Identity</span>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 11, color: t.mid, margin: 0, lineHeight: 1.5 }}>
                Suppliers see only this information. Client details are completely hidden.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Project Name (Public)
                </label>
                <input
                  style={inputStyle}
                  value={formData.public_name}
                  onChange={e => setFormData(f => ({ ...f, public_name: e.target.value }))}
                  placeholder="e.g. RZ-PRJ-AB12"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Supplier-Facing Description
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description visible to suppliers..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & margin */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={15} style={{ color: ACCENT }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>Pricing & Margin</span>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Buy price readonly */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Client Buy Price (per piece)
                </label>
                <div style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={12} style={{ color: t.mid }} />
                  {order.buy_price ? `£${parseFloat(order.buy_price).toFixed(2)}` : 'Not specified'}
                </div>
              </div>

              {/* Markup */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Markup Percentage
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0" max="200" step="1"
                    style={{ ...inputStyle, paddingRight: 36 }}
                    value={formData.markup_pct}
                    onChange={e => setFormData(f => ({ ...f, markup_pct: e.target.value }))}
                  />
                  <Percent size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: t.mid }} />
                </div>
              </div>

              {/* Target sell price computed */}
              <div style={{ background: t.infoBg, border: `1px solid ${t.infoBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: ACCENT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Target Sell Price (per piece)
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: ACCENT, letterSpacing: '-0.02em' }}>
                  {targetSellPrice ? `£${targetSellPrice}` : '—'}
                </div>
                {order.buy_price && targetSellPrice && (
                  <div style={{ fontSize: 11, color: t.sec, marginTop: 4 }}>
                    £{parseFloat(order.buy_price).toFixed(2)} &times; {Number(formData.markup_pct) + 100}% = £{targetSellPrice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Section 4: Verification Checklist + Authorise ────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
          style={cardStyle}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={15} style={{ color: ACCENT }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.pri }}>Verification Checklist</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: allChecksComplete ? '#22c55e' : t.mid, fontWeight: 600 }}>
              {CHECKS_CONFIG.filter(c => checks[c.key]).length} / {CHECKS_CONFIG.length} complete
            </span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {CHECKS_CONFIG.map((item, i) => {
                const Icon = item.icon;
                const checked = checks[item.key];
                return (
                  <motion.label key={item.key} variants={fadeUp} initial="hidden" animate="show" custom={i * 0.5}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                      borderRadius: 10, cursor: 'pointer', border: `1px solid ${checked ? 'rgba(34,197,94,0.25)' : t.innerBorder}`,
                      background: checked ? 'rgba(34,197,94,0.05)' : t.inner, transition: 'all 0.2s',
                    }}>
                    <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0, marginTop: 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setChecks(c => ({ ...c, [item.key]: e.target.checked }))}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', margin: 0 }}
                      />
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? '#22c55e' : t.inputBorder}`,
                        background: checked ? '#22c55e' : t.inputBg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'all 0.15s',
                      }}>
                        {checked && <CheckCircle2 size={11} style={{ color: '#fff' }} />}
                      </div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: checked ? 'rgba(34,197,94,0.12)' : `rgba(255,107,53,0.1)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} style={{ color: checked ? '#22c55e' : ACCENT }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.pri, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: t.mid }}>{item.sub}</div>
                    </div>
                    {checked && <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />}
                  </motion.label>
                );
              })}
            </div>

            {/* Authorise button */}
            <button
              onClick={handleAuthorise}
              disabled={saving || !allChecksComplete}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: allChecksComplete
                  ? `linear-gradient(135deg, ${ACCENT}, #c2410c)`
                  : t.chipBg,
                color: allChecksComplete ? '#fff' : t.mid,
                border: `1px solid ${allChecksComplete ? 'transparent' : t.cardBorder}`,
                borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 700,
                cursor: allChecksComplete && !saving ? 'pointer' : 'not-allowed',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: allChecksComplete ? '0 4px 24px rgba(255,107,53,0.3)' : 'none',
              }}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Authorising…</>
              ) : (
                <><Shield size={16} /> Authorise & Mark Sanitised <ArrowRight size={15} /></>
              )}
            </button>
            {!allChecksComplete && (
              <p style={{ textAlign: 'center', fontSize: 11, color: t.mid, marginTop: 8 }}>
                Complete all {CHECKS_CONFIG.length} checklist items to authorise
              </p>
            )}
          </div>
        </motion.div>

      </div>
    </ControlCentreLayout>
  );
}

// Fix missing import
function ClipboardCheck(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  );
}
