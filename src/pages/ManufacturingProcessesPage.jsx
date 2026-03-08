import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, ChevronUp, ChevronDown, X,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useTheme } from '@/contexts/ThemeContext';

const ACCENT = '#FF6B35';

const EMPTY_FORM = { name: '', status_key: '', description: '' };

export default function ManufacturingProcessesPage() {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const t = isDark ? {
    page: '#09090b', card: '#111117', border: 'rgba(255,255,255,0.08)',
    pri: '#f1f5f9', sec: '#94a3b8', mid: '#64748b',
    inputBg: '#1e1e2e', inputBorder: 'rgba(255,255,255,0.1)',
    inner: '#1a1a28', innerBorder: 'rgba(255,255,255,0.07)',
    row: 'rgba(255,255,255,0.02)', rowHover: 'rgba(255,255,255,0.04)',
    overlay: 'rgba(0,0,0,0.7)',
  } : {
    page: '#f0f0f2', card: '#ffffff', border: 'rgba(0,0,0,0.09)',
    pri: '#0f172a', sec: '#475569', mid: '#94a3b8',
    inputBg: '#f8fafc', inputBorder: '#cbd5e1',
    inner: '#f1f5f9', innerBorder: 'rgba(0,0,0,0.08)',
    row: 'rgba(0,0,0,0.01)', rowHover: 'rgba(0,0,0,0.03)',
    overlay: 'rgba(0,0,0,0.5)',
  };

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from('manufacturing_processes')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) toast({ title: 'Fetch failed', description: error.message, variant: 'destructive' });
    else setProcesses(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.status_key.trim()) {
      toast({ title: 'Required', description: 'Name and Status Key are required.', variant: 'destructive' });
      return;
    }
    const key = form.status_key.trim().toUpperCase().replace(/\s+/g, '_');
    setSaving(true);
    const maxOrder = processes.length > 0 ? Math.max(...processes.map(p => p.display_order)) : 0;
    const { error } = await supabaseAdmin.from('manufacturing_processes').insert({
      name: form.name.trim(),
      status_key: key,
      description: form.description.trim() || null,
      display_order: maxOrder + 1,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Process added', description: `"${form.name.trim()}" is now available for clients.` });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchProcesses();
    }
  };

  const handleToggle = async (process) => {
    setTogglingId(process.id);
    const { error } = await supabaseAdmin
      .from('manufacturing_processes')
      .update({ is_active: !process.is_active })
      .eq('id', process.id);
    setTogglingId(null);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: process.is_active ? 'Process deactivated' : 'Process activated' });
      fetchProcesses();
    }
  };

  const handleDelete = async (process) => {
    if (!window.confirm(`Delete "${process.name}"? This cannot be undone.`)) return;
    setDeletingId(process.id);
    const { error } = await supabaseAdmin.from('manufacturing_processes').delete().eq('id', process.id);
    setDeletingId(null);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Process deleted' });
      fetchProcesses();
    }
  };

  const moveOrder = async (process, direction) => {
    const sorted = [...processes].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(p => p.id === process.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapWith = sorted[swapIdx];
    await supabaseAdmin.from('manufacturing_processes').update({ display_order: swapWith.display_order }).eq('id', process.id);
    await supabaseAdmin.from('manufacturing_processes').update({ display_order: process.display_order }).eq('id', swapWith.id);
    fetchProcesses();
  };

  return (
    <ControlCentreLayout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,53,0.12)',
              border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cog size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: t.pri, margin: 0 }}>Manufacturing Processes</h1>
              <p style={{ fontSize: 13, color: t.sec, margin: 0 }}>Manage process presets shown to clients when ordering</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`,
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Process
          </button>
        </div>

        {/* Info banner */}
        <div style={{
          background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.18)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: t.sec, margin: 0, lineHeight: 1.6 }}>
            Active processes appear in the client order creation form. The <strong style={{ color: t.pri }}>Status Key</strong> (e.g. <code>MACHINING</code>) links the process to the order timeline. Inactive processes are hidden from clients but preserved for existing orders.
          </p>
        </div>

        {/* Process list */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10 }}>
              <Loader2 size={22} style={{ color: ACCENT }} className="animate-spin" />
              <span style={{ color: t.sec, fontSize: 13 }}>Loading processes…</span>
            </div>
          ) : processes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: t.mid }}>
              <Cog size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 14 }}>No processes yet. Add the first one.</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 120px 80px 60px 80px',
                padding: '10px 18px', borderBottom: `1px solid ${t.border}`,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: t.mid, alignItems: 'center', gap: 8,
              }}>
                <span>#</span>
                <span>Process</span>
                <span>Status Key</span>
                <span>State</span>
                <span>Order</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {processes.map((proc, idx) => (
                <motion.div
                  key={proc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '32px 1fr 120px 80px 60px 80px',
                    padding: '12px 18px', alignItems: 'center', gap: 8,
                    borderBottom: `1px solid ${t.border}`,
                    background: t.row,
                    opacity: proc.is_active ? 1 : 0.55,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.mid }}>{idx + 1}</span>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.pri }}>{proc.name}</p>
                    {proc.description && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: t.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proc.description}
                      </p>
                    )}
                  </div>

                  <code style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: 'rgba(255,107,53,0.1)', color: ACCENT,
                    border: '1px solid rgba(255,107,53,0.2)', display: 'inline-block',
                  }}>{proc.status_key}</code>

                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: proc.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
                      color: proc.is_active ? '#22c55e' : t.mid,
                      border: `1px solid ${proc.is_active ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.2)'}`,
                    }}>
                      {proc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveOrder(proc, 'up')} disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                        color: idx === 0 ? t.mid : t.sec, padding: '1px 4px', opacity: idx === 0 ? 0.3 : 1 }}>
                      <ChevronUp size={13} />
                    </button>
                    <button onClick={() => moveOrder(proc, 'down')} disabled={idx === processes.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === processes.length - 1 ? 'default' : 'pointer',
                        color: idx === processes.length - 1 ? t.mid : t.sec, padding: '1px 4px',
                        opacity: idx === processes.length - 1 ? 0.3 : 1 }}>
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggle(proc)}
                      disabled={togglingId === proc.id}
                      title={proc.is_active ? 'Deactivate' : 'Activate'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sec, padding: 4 }}
                    >
                      {togglingId === proc.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : proc.is_active
                          ? <ToggleRight size={18} style={{ color: '#22c55e' }} />
                          : <ToggleLeft size={18} style={{ color: t.mid }} />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(proc)}
                      disabled={deletingId === proc.id}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, opacity: deletingId === proc.id ? 0.5 : 1 }}
                    >
                      {deletingId === proc.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Add Process Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 50 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%', maxWidth: 480,
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: 16, padding: 28, zIndex: 51,
                  boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: t.pri, margin: 0 }}>Add Manufacturing Process</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, marginBottom: 6 }}>
                      Process Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. 3D Printing"
                      style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8,
                        padding: '9px 13px', fontSize: 13, color: t.pri, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, marginBottom: 6 }}>
                      Status Key <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={form.status_key}
                      onChange={e => setForm(f => ({ ...f, status_key: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                      placeholder="e.g. PRINTING"
                      style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8,
                        padding: '9px 13px', fontSize: 13, color: t.pri, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <p style={{ fontSize: 11, color: t.mid, marginTop: 4 }}>Uppercase identifier used in the order timeline (e.g. MACHINING, CASTING)</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, marginBottom: 6 }}>
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description shown to clients"
                      rows={3}
                      style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8,
                        padding: '9px 13px', fontSize: 13, color: t.pri, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.border}`,
                        background: 'none', color: t.sec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleAdd} disabled={saving}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                        background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`,
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {saving ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add Process'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </ControlCentreLayout>
  );
}
