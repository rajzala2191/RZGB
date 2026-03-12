import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, ChevronUp, ChevronDown, X,
  LayoutTemplate, ChevronRight, Check, Pencil, ListChecks,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  fetchProcessTemplates, createProcessTemplate, updateProcessTemplate, deleteProcessTemplate,
  fetchSubStepsForProcess, createSubStep, updateSubStep, deleteSubStep,
} from '@/services/orderService';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useTheme } from '@/contexts/ThemeContext';

const ACCENT = 'var(--brand)';
const EMPTY_PROCESS_FORM = { name: '', status_key: '', description: '' };
const EMPTY_TEMPLATE_FORM = { name: '', description: '', process_keys: [], is_default: false };
const EMPTY_SUBSTEP_FORM = { name: '', description: '', is_required: true };

export default function ManufacturingProcessesPage() {
  const { isDark } = useTheme();
  const { toast } = useToast();

  // ─── Theme tokens ────────────────────────────────────────────────────────────
  const t = {
    page: 'var(--app-bg)', card: 'var(--surface)', border: 'var(--edge-subtle)',
    pri: 'var(--heading)', sec: 'var(--body)', mid: 'var(--caption)',
    inputBg: 'var(--surface-raised)', inputBorder: 'var(--edge)',
    inner: 'var(--surface-raised)', innerBorder: 'var(--edge-subtle)',
    row: 'var(--edge-subtle)', rowHover: 'var(--surface-raised)',
    overlay: 'rgba(0,0,0,0.7)', chip: 'var(--edge-subtle)',
  };

  // ─── Tab ─────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('processes');

  // ─── Processes state ─────────────────────────────────────────────────────────
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState(EMPTY_PROCESS_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // ─── Sub-steps state ─────────────────────────────────────────────────────────
  const [expandedProcessId, setExpandedProcessId] = useState(null);
  const [subStepsByProcess, setSubStepsByProcess] = useState({});
  const [loadingSubStepsFor, setLoadingSubStepsFor] = useState(new Set());
  const [showSubStepFormFor, setShowSubStepFormFor] = useState(null);
  const [subStepForm, setSubStepForm] = useState(EMPTY_SUBSTEP_FORM);
  const [savingSubStep, setSavingSubStep] = useState(false);
  const [deletingSubStepId, setDeletingSubStepId] = useState(null);
  const [editingSubStep, setEditingSubStep] = useState(null);

  // ─── Templates state ─────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);

  // ─── Fetch processes ──────────────────────────────────────────────────────────
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

  // ─── Fetch templates ──────────────────────────────────────────────────────────
  const fetchTemplatesData = useCallback(async () => {
    setTemplatesLoading(true);
    const { data, error } = await fetchProcessTemplates();
    if (error) toast({ title: 'Fetch failed', description: error.message, variant: 'destructive' });
    else setTemplates(data || []);
    setTemplatesLoading(false);
  }, [toast]);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);
  useEffect(() => { if (activeTab === 'templates') fetchTemplatesData(); }, [activeTab, fetchTemplatesData]);

  // ─── Process CRUD ─────────────────────────────────────────────────────────────
  const handleAddProcess = async () => {
    if (!processForm.name.trim() || !processForm.status_key.trim()) {
      toast({ title: 'Required', description: 'Name and Status Key are required.', variant: 'destructive' });
      return;
    }
    const key = processForm.status_key.trim().toUpperCase().replace(/\s+/g, '_');
    setSaving(true);
    const maxOrder = processes.length > 0 ? Math.max(...processes.map(p => p.display_order)) : 0;
    const { error } = await supabaseAdmin.from('manufacturing_processes').insert({
      name: processForm.name.trim(),
      status_key: key,
      description: processForm.description.trim() || null,
      display_order: maxOrder + 1,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Process added' });
      setShowProcessModal(false);
      setProcessForm(EMPTY_PROCESS_FORM);
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

  const handleDeleteProcess = async (process) => {
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

  // ─── Sub-step CRUD ────────────────────────────────────────────────────────────
  const loadSubSteps = useCallback(async (processId) => {
    setLoadingSubStepsFor(prev => new Set(prev).add(processId));
    const { data, error } = await fetchSubStepsForProcess(processId);
    setLoadingSubStepsFor(prev => { const s = new Set(prev); s.delete(processId); return s; });
    if (!error) setSubStepsByProcess(prev => ({ ...prev, [processId]: data || [] }));
  }, []);

  const toggleExpandProcess = (processId) => {
    if (expandedProcessId === processId) {
      setExpandedProcessId(null);
    } else {
      setExpandedProcessId(processId);
      if (!subStepsByProcess[processId]) loadSubSteps(processId);
    }
    setShowSubStepFormFor(null);
  };

  const handleAddSubStep = async (processId) => {
    if (!subStepForm.name.trim()) {
      toast({ title: 'Required', description: 'Step name is required.', variant: 'destructive' });
      return;
    }
    setSavingSubStep(true);
    const existing = subStepsByProcess[processId] || [];
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(s => s.display_order)) : 0;
    const payload = {
      process_id: processId,
      name: subStepForm.name.trim(),
      description: subStepForm.description.trim() || null,
      is_required: subStepForm.is_required,
      display_order: maxOrder + 1,
    };
    const { error } = editingSubStep
      ? await updateSubStep(editingSubStep.id, { name: payload.name, description: payload.description, is_required: payload.is_required })
      : await createSubStep(payload);
    setSavingSubStep(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingSubStep ? 'Sub-step updated' : 'Sub-step added' });
      setShowSubStepFormFor(null);
      setSubStepForm(EMPTY_SUBSTEP_FORM);
      setEditingSubStep(null);
      loadSubSteps(processId);
    }
  };

  const handleDeleteSubStep = async (subStepId, processId) => {
    if (!window.confirm('Delete this sub-step? This cannot be undone.')) return;
    setDeletingSubStepId(subStepId);
    const { error } = await deleteSubStep(subStepId);
    setDeletingSubStepId(null);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Sub-step deleted' });
      loadSubSteps(processId);
    }
  };

  const moveSubStep = async (subStep, direction, processId) => {
    const steps = [...(subStepsByProcess[processId] || [])].sort((a, b) => a.display_order - b.display_order);
    const idx = steps.findIndex(s => s.id === subStep.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    const swapWith = steps[swapIdx];
    await updateSubStep(subStep.id, { display_order: swapWith.display_order });
    await updateSubStep(swapWith.id, { display_order: subStep.display_order });
    loadSubSteps(processId);
  };

  const startEditSubStep = (subStep, processId) => {
    setEditingSubStep(subStep);
    setSubStepForm({ name: subStep.name, description: subStep.description || '', is_required: subStep.is_required });
    setShowSubStepFormFor(processId);
  };

  // ─── Template CRUD ────────────────────────────────────────────────────────────
  const openTemplateModal = (template = null) => {
    setEditingTemplate(template);
    setTemplateForm(template
      ? { name: template.name, description: template.description || '', process_keys: template.process_keys || [], is_default: template.is_default }
      : EMPTY_TEMPLATE_FORM
    );
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({ title: 'Required', description: 'Template name is required.', variant: 'destructive' });
      return;
    }
    if (!templateForm.process_keys.length) {
      toast({ title: 'Required', description: 'Select at least one process.', variant: 'destructive' });
      return;
    }
    setSavingTemplate(true);
    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim() || null,
      process_keys: templateForm.process_keys,
      is_default: templateForm.is_default,
    };
    const { error } = editingTemplate
      ? await updateProcessTemplate(editingTemplate.id, payload)
      : await createProcessTemplate(payload);
    setSavingTemplate(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingTemplate ? 'Template updated' : 'Template created' });
      setShowTemplateModal(false);
      setEditingTemplate(null);
      fetchTemplatesData();
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    setDeletingTemplateId(template.id);
    const { error } = await deleteProcessTemplate(template.id);
    setDeletingTemplateId(null);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Template deleted' });
      fetchTemplatesData();
    }
  };

  const toggleTemplateProcessKey = (statusKey) => {
    setTemplateForm(f => {
      const keys = f.process_keys.includes(statusKey)
        ? f.process_keys.filter(k => k !== statusKey)
        : [...f.process_keys, statusKey];
      return { ...f, process_keys: keys };
    });
  };

  const moveTemplateKey = (idx, direction) => {
    setTemplateForm(f => {
      const keys = [...f.process_keys];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= keys.length) return f;
      [keys[idx], keys[swapIdx]] = [keys[swapIdx], keys[idx]];
      return { ...f, process_keys: keys };
    });
  };

  // ─── Shared modal styles ──────────────────────────────────────────────────────
  const modalOverlayStyle = {
    position: 'fixed', inset: 0, background: t.overlay, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const modalBoxStyle = {
    width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    background: t.card, border: `1px solid ${t.border}`, borderRadius: 16,
    padding: 28, zIndex: 51, boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  };
  const fieldLabel = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, marginBottom: 6 };
  const inputStyle = { width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: t.pri, outline: 'none', boxSizing: 'border-box' };

  const activeProcesses = processes.filter(p => p.is_active);

  return (
    <ControlCentreLayout>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-glow)', border: '1px solid var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cog size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: t.pri, margin: 0 }}>Manufacturing Processes</h1>
              <p style={{ fontSize: 13, color: t.sec, margin: 0 }}>Manage process presets and reusable templates</p>
            </div>
          </div>
          {activeTab === 'processes' && (
            <button onClick={() => setShowProcessModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={15} /> Add Process
            </button>
          )}
          {activeTab === 'templates' && (
            <button onClick={() => openTemplateModal()} style={{ display: 'flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={15} /> New Template
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: t.inner, borderRadius: 12, padding: 4, border: `1px solid ${t.innerBorder}`, alignSelf: 'flex-start', width: 'fit-content' }}>
          {[
            { key: 'processes', label: 'Processes', icon: <Cog size={14} /> },
            { key: 'templates', label: 'Templates', icon: <LayoutTemplate size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: activeTab === tab.key ? ACCENT : 'transparent',
                color: activeTab === tab.key ? '#fff' : t.sec,
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══ PROCESSES TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'processes' && (
          <>
            <div style={{ background: 'var(--brand-glow)', border: '1px solid var(--brand-glow)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: t.sec, margin: 0, lineHeight: 1.6 }}>
                Active processes appear in the client order creation form. The <strong style={{ color: t.pri }}>Status Key</strong> (e.g. <code>MACHINING</code>) links the process to the order timeline. Expand a row to manage its sub-steps.
              </p>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10 }}>
                  <Loader2 size={22} style={{ color: ACCENT }} className="animate-spin" />
                  <span style={{ color: t.sec, fontSize: 13 }}>Loading…</span>
                </div>
              ) : processes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: t.mid }}>
                  <Cog size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No processes yet. Add the first one.</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 80px 60px 80px', padding: '10px 18px', borderBottom: `1px solid ${t.border}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, alignItems: 'center', gap: 8 }}>
                    <span>#</span><span>Process</span><span>Status Key</span><span>State</span><span>Order</span><span style={{ textAlign: 'right' }}>Actions</span>
                  </div>

                  {processes.map((proc, idx) => (
                    <div key={proc.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 80px 60px 80px', padding: '12px 18px', alignItems: 'center', gap: 8, borderBottom: expandedProcessId === proc.id ? 'none' : `1px solid ${t.border}`, background: t.row, opacity: proc.is_active ? 1 : 0.55 }}
                      >
                        <button onClick={() => toggleExpandProcess(proc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid, padding: 2, display: 'flex', alignItems: 'center' }}>
                          <motion.span animate={{ rotate: expandedProcessId === proc.id ? 90 : 0 }} transition={{ duration: 0.15 }}>
                            <ChevronRight size={13} />
                          </motion.span>
                        </button>

                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.pri }}>{proc.name}</p>
                          {proc.description && (
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: t.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proc.description}</p>
                          )}
                        </div>

                        <code style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'var(--brand-glow)', color: ACCENT, border: '1px solid var(--brand-glow)', display: 'inline-block' }}>{proc.status_key}</code>

                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: proc.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)', color: proc.is_active ? '#22c55e' : t.mid, border: `1px solid ${proc.is_active ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.2)'}` }}>
                            {proc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => moveOrder(proc, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? t.mid : t.sec, padding: '1px 4px', opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp size={13} /></button>
                          <button onClick={() => moveOrder(proc, 'down')} disabled={idx === processes.length - 1} style={{ background: 'none', border: 'none', cursor: idx === processes.length - 1 ? 'default' : 'pointer', color: idx === processes.length - 1 ? t.mid : t.sec, padding: '1px 4px', opacity: idx === processes.length - 1 ? 0.3 : 1 }}><ChevronDown size={13} /></button>
                        </div>

                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={() => handleToggle(proc)} disabled={togglingId === proc.id} title={proc.is_active ? 'Deactivate' : 'Activate'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sec, padding: 4 }}>
                            {togglingId === proc.id ? <Loader2 size={14} className="animate-spin" /> : proc.is_active ? <ToggleRight size={18} style={{ color: '#22c55e' }} /> : <ToggleLeft size={18} style={{ color: t.mid }} />}
                          </button>
                          <button onClick={() => handleDeleteProcess(proc)} disabled={deletingId === proc.id} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, opacity: deletingId === proc.id ? 0.5 : 1 }}>
                            {deletingId === proc.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </motion.div>

                      {/* ── Sub-steps panel ── */}
                      <AnimatePresence>
                        {expandedProcessId === proc.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden', borderBottom: `1px solid ${t.border}` }}
                          >
                            <div style={{ background: t.inner, borderTop: `1px solid ${t.innerBorder}`, padding: '14px 18px 14px 52px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.mid, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <ListChecks size={13} /> Sub-steps
                                </span>
                                <button
                                  onClick={() => { setShowSubStepFormFor(proc.id); setEditingSubStep(null); setSubStepForm(EMPTY_SUBSTEP_FORM); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--brand-glow)', border: '1px solid var(--brand-glow)', color: ACCENT, borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <Plus size={12} /> Add Sub-step
                                </button>
                              </div>

                              {loadingSubStepsFor.has(proc.id) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.sec, fontSize: 12, padding: '8px 0' }}>
                                  <Loader2 size={13} className="animate-spin" /> Loading…
                                </div>
                              ) : (subStepsByProcess[proc.id] || []).length === 0 && showSubStepFormFor !== proc.id ? (
                                <p style={{ fontSize: 12, color: t.mid, margin: '4px 0 8px', fontStyle: 'italic' }}>No sub-steps defined. Add the first one.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                                  {(subStepsByProcess[proc.id] || []).map((step, si) => (
                                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: t.card, borderRadius: 8, border: `1px solid ${t.border}` }}>
                                      <span style={{ fontSize: 11, color: t.mid, minWidth: 16 }}>{si + 1}.</span>
                                      <span style={{ flex: 1, fontSize: 12, color: t.pri, fontWeight: 500 }}>{step.name}</span>
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: step.is_required ? 'var(--brand-glow)' : 'var(--edge-subtle)', color: step.is_required ? ACCENT : t.mid, border: `1px solid ${step.is_required ? 'var(--brand-glow)' : 'var(--edge-subtle)'}` }}>
                                        {step.is_required ? 'Required' : 'Optional'}
                                      </span>
                                      <div style={{ display: 'flex', gap: 2 }}>
                                        <button onClick={() => moveSubStep(step, 'up', proc.id)} disabled={si === 0} style={{ background: 'none', border: 'none', cursor: si === 0 ? 'default' : 'pointer', color: t.mid, padding: 2, opacity: si === 0 ? 0.3 : 1 }}><ChevronUp size={12} /></button>
                                        <button onClick={() => moveSubStep(step, 'down', proc.id)} disabled={si === (subStepsByProcess[proc.id] || []).length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid, padding: 2, opacity: si === (subStepsByProcess[proc.id] || []).length - 1 ? 0.3 : 1 }}><ChevronDown size={12} /></button>
                                        <button onClick={() => startEditSubStep(step, proc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sec, padding: 2 }}><Pencil size={11} /></button>
                                        <button onClick={() => handleDeleteSubStep(step.id, proc.id)} disabled={deletingSubStepId === step.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                                          {deletingSubStepId === step.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add / edit sub-step inline form */}
                              <AnimatePresence>
                                {showSubStepFormFor === proc.id && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                    style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                                    <input
                                      value={subStepForm.name}
                                      onChange={e => setSubStepForm(f => ({ ...f, name: e.target.value }))}
                                      placeholder="Sub-step name *"
                                      style={{ ...inputStyle, fontSize: 12, padding: '7px 11px' }}
                                      autoFocus
                                    />
                                    <input
                                      value={subStepForm.description}
                                      onChange={e => setSubStepForm(f => ({ ...f, description: e.target.value }))}
                                      placeholder="Description (optional)"
                                      style={{ ...inputStyle, fontSize: 12, padding: '7px 11px' }}
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.sec, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={subStepForm.is_required} onChange={e => setSubStepForm(f => ({ ...f, is_required: e.target.checked }))} />
                                      Required sub-step
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button onClick={() => { setShowSubStepFormFor(null); setEditingSubStep(null); setSubStepForm(EMPTY_SUBSTEP_FORM); }} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${t.border}`, background: 'none', color: t.sec, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                      <button onClick={() => handleAddSubStep(proc.id)} disabled={savingSubStep} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: savingSubStep ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        {savingSubStep ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        {editingSubStep ? 'Update' : 'Add'}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* ══ TEMPLATES TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'templates' && (
          <>
            <div style={{ background: 'var(--brand-glow)', border: '1px solid var(--brand-glow)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: t.sec, margin: 0, lineHeight: 1.6 }}>
                Templates are reusable process presets. Clients see them as one-click shortcuts when creating orders. Mark one as <strong style={{ color: t.pri }}>Default</strong> to pre-select it automatically.
              </p>
            </div>

            {templatesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10 }}>
                <Loader2 size={22} style={{ color: ACCENT }} className="animate-spin" />
                <span style={{ color: t.sec, fontSize: 13 }}>Loading templates…</span>
              </div>
            ) : templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: t.mid, background: t.card, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                <LayoutTemplate size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: 14 }}>No templates yet. Create the first one.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {templates.map((tpl, idx) => (
                  <motion.div key={tpl.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: t.pri }}>{tpl.name}</span>
                          {tpl.is_default && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--brand-glow)', color: ACCENT, border: '1px solid var(--brand-glow)' }}>Default</span>
                          )}
                        </div>
                        {tpl.description && <p style={{ fontSize: 12, color: t.sec, margin: '0 0 10px' }}>{tpl.description}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(tpl.process_keys || []).map(key => (
                            <code key={key} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--brand-glow)', color: ACCENT, border: '1px solid var(--brand-glow)' }}>{key}</code>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openTemplateModal(tpl)} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: t.sec, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteTemplate(tpl)} disabled={deletingTemplateId === tpl.id} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: deletingTemplateId === tpl.id ? 0.5 : 1 }}>
                          {deletingTemplateId === tpl.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ ADD PROCESS MODAL ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showProcessModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProcessModal(false)} style={modalOverlayStyle}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} style={modalBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: t.pri, margin: 0 }}>Add Manufacturing Process</h2>
                  <button onClick={() => setShowProcessModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={fieldLabel}>Process Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={processForm.name} onChange={e => setProcessForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 3D Printing" style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Status Key <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={processForm.status_key} onChange={e => setProcessForm(f => ({ ...f, status_key: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} placeholder="e.g. PRINTING" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                    <p style={{ fontSize: 11, color: t.mid, marginTop: 4 }}>Uppercase identifier used in the order timeline (e.g. MACHINING, CASTING)</p>
                  </div>
                  <div>
                    <label style={fieldLabel}>Description</label>
                    <textarea value={processForm.description} onChange={e => setProcessForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description shown to clients" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button onClick={() => setShowProcessModal(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.border}`, background: 'none', color: t.sec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleAddProcess} disabled={saving} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {saving ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add Process'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ TEMPLATE MODAL ═════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showTemplateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTemplateModal(false)} style={modalOverlayStyle}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} style={{ ...modalBoxStyle, maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: t.pri, margin: 0 }}>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
                  <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={fieldLabel}>Template Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CNC Flow" style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Description</label>
                    <input value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Select Processes <span style={{ color: '#ef4444' }}>*</span></label>
                    <p style={{ fontSize: 11, color: t.mid, margin: '0 0 8px' }}>Click to toggle. The order below determines pipeline order.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {activeProcesses.map(proc => {
                        const selected = templateForm.process_keys.includes(proc.status_key);
                        return (
                          <button key={proc.id} onClick={() => toggleTemplateProcessKey(proc.status_key)}
                            style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${selected ? ACCENT : t.inputBorder}`, background: selected ? 'var(--brand-glow)' : t.inputBg, color: selected ? ACCENT : t.sec, fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                            {selected && <Check size={11} />} {proc.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {templateForm.process_keys.length > 0 && (
                    <div>
                      <label style={fieldLabel}>Pipeline Order</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {templateForm.process_keys.map((key, ki) => (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: t.inner, borderRadius: 8, border: `1px solid ${t.innerBorder}` }}>
                            <span style={{ fontSize: 11, color: t.mid, minWidth: 18 }}>{ki + 1}.</span>
                            <code style={{ flex: 1, fontSize: 12, fontWeight: 700, color: ACCENT }}>{key}</code>
                            <button onClick={() => moveTemplateKey(ki, 'up')} disabled={ki === 0} style={{ background: 'none', border: 'none', cursor: ki === 0 ? 'default' : 'pointer', color: t.mid, padding: 2, opacity: ki === 0 ? 0.3 : 1 }}><ChevronUp size={13} /></button>
                            <button onClick={() => moveTemplateKey(ki, 'down')} disabled={ki === templateForm.process_keys.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid, padding: 2, opacity: ki === templateForm.process_keys.length - 1 ? 0.3 : 1 }}><ChevronDown size={13} /></button>
                            <button onClick={() => toggleTemplateProcessKey(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.sec, cursor: 'pointer' }}>
                    <input type="checkbox" checked={templateForm.is_default} onChange={e => setTemplateForm(f => ({ ...f, is_default: e.target.checked }))} />
                    Set as default template (pre-selected for new orders)
                  </label>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button onClick={() => setShowTemplateModal(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.border}`, background: 'none', color: t.sec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSaveTemplate} disabled={savingTemplate} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #c2410c)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingTemplate ? 'not-allowed' : 'pointer', opacity: savingTemplate ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {savingTemplate ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ControlCentreLayout>
  );
}
