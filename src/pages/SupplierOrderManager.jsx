import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Loader2, AlertCircle, CheckCircle2, Clock, Upload, FileText,
  ChevronRight, ChevronDown, Package, Zap, Hourglass, ShieldCheck, Truck,
  AlertTriangle, Eye, Box,
} from 'lucide-react';
import ThreeDModelViewer from '@/components/ThreeDModelViewer';
import { format } from 'date-fns';
import OrderTimeline from '@/components/OrderTimeline';
import DocumentPreview from '@/components/DocumentPreview';

const ACCENT = '#FF6B35';

// Build the per-order pipeline dynamically from selected_processes
function buildPipeline(selectedProcesses) {
  const mid = (selectedProcesses && selectedProcesses.length > 0)
    ? selectedProcesses
    : ['MATERIAL', 'MACHINING'];
  return ['AWARDED', ...mid, 'QC', 'DISPATCH', 'DELIVERED'];
}

// Stage metadata for display (label, icon, hex colour)
const STAGES = [
  { id: 'AWARDED',   label: 'Supplier Assigned', icon: CheckCircle2, hex: '#f59e0b' },
  { id: 'MATERIAL',  label: 'Material Sourcing',  icon: Package,      hex: '#0ea5e9' },
  { id: 'CASTING',   label: 'Casting',             icon: Zap,          hex: '#f97316' },
  { id: 'MACHINING', label: 'Machining',            icon: Hourglass,    hex: '#8b5cf6' },
  { id: 'QC',        label: 'Quality Control',      icon: ShieldCheck,  hex: '#22c55e' },
  { id: 'DISPATCH',  label: 'Dispatch',             icon: Truck,        hex: '#06b6d4' },
  { id: 'DELIVERED', label: 'Delivered',            icon: CheckCircle2, hex: '#22c55e' },
];

export default function SupplierOrderManager() {
  const { currentUser, userCompanyName } = useAuth();
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [jobUpdates, setJobUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [savingNotes, setSavingNotes] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [orderDocuments, setOrderDocuments] = useState({});
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, newStatus: null, orderName: '', note: '' });

  // Parameter: clearErrors — set false when called from catch blocks so errors remain visible
  const fetchAwardedOrders = useCallback(async (clearErrors = true) => {
    try {
      if (!currentUser?.id) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id, rz_job_id, part_name, material, order_status, client_id,
          created_at, updated_at, ghost_public_name, quantity, selected_processes
        `)
        .eq('supplier_id', currentUser.id)
        .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED'])
        .order('created_at', { ascending: false });

      if (err) throw err;

      setOrders(data || []);
      if (clearErrors) setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchJobUpdates = useCallback(async () => {
    if (!currentUser?.id) return;
    const { data } = await supabase
      .from('job_updates')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      const grouped = {};
      data.forEach(u => {
        if (!grouped[u.rz_job_id]) grouped[u.rz_job_id] = [];
        grouped[u.rz_job_id].push(u);
      });
      setJobUpdates(grouped);
    }
  }, [currentUser]);

  // Fetch documents uploaded for each order
  const fetchOrderDocuments = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error: err } = await supabaseAdmin
        .from('documents')
        .select('id, order_id, file_name, file_path, file_type, status, created_at')
        .or(`uploaded_by.eq.${currentUser.id},supplier_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (err) throw err;
      const grouped = {};
      (data || []).forEach(doc => {
        if (!grouped[doc.order_id]) grouped[doc.order_id] = [];
        grouped[doc.order_id].push(doc);
      });
      setOrderDocuments(grouped);
    } catch (err) {
      console.error('Error fetching order documents:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchAwardedOrders();
    fetchJobUpdates();
    fetchOrderDocuments();

    // Realtime subscription — syncs across all portals (client, admin, supplier)
    const channel = supabase
      .channel('supplier-order-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAwardedOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_updates' }, () => {
        fetchJobUpdates();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchOrderDocuments();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchAwardedOrders, fetchJobUpdates, fetchOrderDocuments]);

  const confirmStageChange = (orderId, newStatus) => {
    const order = orders.find(p => p.id === orderId);
    const currentStage = STAGES.find(s => s.id === order?.order_status);
    const nextStage = STAGES.find(s => s.id === newStatus);
    setConfirmDialog({
      open: true,
      orderId,
      newStatus,
      orderName: order?.part_name || order?.id?.slice(0, 8) || 'Order',
      fromStage: currentStage?.label || order?.order_status,
      toStage: nextStage?.label || newStatus,
      ToIcon: nextStage?.icon || Package,
      note: localNotes[orderId] || '',
    });
  };

  const updateOrderStatus = async (orderId, newStatus, supplierNote = '') => {
    setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '', note: '' });
    setUpdatingOrder(orderId);
    setError(null);
    setSuccessMessage(null);

    const order = orders.find(p => p.id === orderId);
    const stageName = STAGES.find(s => s.id === newStatus)?.label || newStatus;

    try {
      console.log('[SupplierOrderManager] Updating order', orderId, 'to', newStatus);

      // Use admin client to bypass RLS (suppliers don't have UPDATE policy on orders)
      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('supplier_id', currentUser.id); // ensure supplier can only update their own orders

      if (updateErr) {
        console.error('[SupplierOrderManager] Update error:', updateErr);
        throw new Error(`Database error: ${updateErr.message}`);
      }

      // Verify the change went through
      const { data: verified, error: verifyErr } = await supabaseAdmin
        .from('orders')
        .select('id, order_status')
        .eq('id', orderId)
        .maybeSingle();

      if (verifyErr) {
        console.error('[SupplierOrderManager] Verify error:', verifyErr);
      }

      if (verified && verified.order_status !== newStatus) {
        throw new Error(`Stage did not change (still ${verified.order_status}). Please try again.`);
      }

      console.log('[SupplierOrderManager] Update verified:', verified);

      // Step 3: Add job update record with supplier note (visible to client & admin via realtime)
      if (order?.rz_job_id) {
        const noteText = supplierNote?.trim()
          ? supplierNote.trim()
          : `Stage advanced to ${stageName}`;
        await supabaseAdmin.from('job_updates').insert({
          rz_job_id: order.rz_job_id,
          stage: newStatus,
          status: 'in_progress',
          notes: noteText,
          created_by: currentUser?.email,
        }).then(({ error: jobErr }) => {
          if (jobErr) console.warn('[SupplierOrderManager] job_updates insert warning:', jobErr);
        });
        // Clear the local note textarea after it's been sent with the stage
        setLocalNotes(prev => ({ ...prev, [orderId]: '' }));
      }

      // Step 4: Immediately update local state so UI reflects the change
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o
      ));

      setSuccessMessage(`✓ Order "${order?.part_name || orderId.slice(0, 8)}" moved to ${stageName}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('[SupplierOrderManager] Stage change failed:', err);
      setError(`Failed to update: ${err.message}`);
      // Don't clear error — let the user see it. Refetch in background.
      try { await fetchAwardedOrders(false); } catch (_) {}
    } finally {
      setUpdatingOrder(null);
    }
  };

  const triggerFileUpload = (orderId) => {
    // Create a detached file input NOT in the DOM
    // This bypasses all document-level event interception (visual editor plugin etc.)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.csv';
    input.onchange = (e) => {
      handleDocumentUpload(e, orderId);
      input.remove(); // cleanup just in case
    };
    input.click();
  };

  const handleDocumentUpload = async (e, orderId) => {
    const file = e.target?.files?.[0] || e?.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const storagePath = `supplier-docs/${fileName}`;

      // Upload to storage
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) {
        // If bucket doesn't exist or permission denied, show helpful message
        if (uploadErr.message?.includes('Bucket not found') || uploadErr.statusCode === '404') {
          throw new Error('Storage bucket "documents" not found. Please create it in Supabase Dashboard > Storage.');
        }
        if (uploadErr.message?.includes('security') || uploadErr.message?.includes('policy') || uploadErr.statusCode === '403') {
          throw new Error('Storage permission denied. Please check RLS policies on the "documents" bucket in Supabase.');
        }
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      // Save document record (columns aligned with documents table schema)
      const { error: dbErr } = await supabaseAdmin.from('documents').insert({
        order_id: orderId,
        client_id: orders.find(o => o.id === orderId)?.client_id || null,
        file_name: file.name,
        file_path: storagePath,
        uploaded_by: currentUser.id,
        file_type: 'supplier_submission',
        status: 'pending_admin_review',
      });

      if (dbErr) {
        throw new Error(`Database error: ${dbErr.message}${dbErr.details ? ` (${dbErr.details})` : ''}`);
      }

      setSuccessMessage('Document uploaded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchAwardedOrders();
      fetchOrderDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Local notes state (not stored as a column — persisted via job_updates)
  const [localNotes, setLocalNotes] = useState({});

  const saveNotes = async (orderId) => {
    const notes = localNotes[orderId];
    if (!notes?.trim()) return;
    setSavingNotes(prev => ({ ...prev, [orderId]: true }));
    try {
      setError(null);
      const order = orders.find(o => o.id === orderId);

      // Create a job_update so the note appears in client/admin timeline in real-time
      if (order?.rz_job_id) {
        const { error: insertErr } = await supabaseAdmin.from('job_updates').insert({
          rz_job_id: order.rz_job_id,
          stage: order.order_status,
          status: 'note_added',
          notes: notes.trim(),
          created_by: currentUser?.email,
        });
        if (insertErr) throw insertErr;
      } else {
        throw new Error('Order has no RZ Job ID yet. Notes can be added after the order is assigned a job ID.');
      }

      setLocalNotes(prev => ({ ...prev, [orderId]: '' }));
      setSuccessMessage('Notes saved and visible to client & admin.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingNotes(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const cardBg      = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const innerBg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const innerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textPri     = isDark ? '#ffffff' : '#0f0f0f';
  const textSec     = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const textMid     = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const dialogBg    = isDark ? '#18181b' : '#ffffff';
  const dialogBord  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  if (loading) {
    return (
      <SupplierHubLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)' }}>
            <Loader2 className="animate-spin w-6 h-6" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-medium" style={{ color: textSec }}>Loading your awarded orders…</p>
        </div>
      </SupplierHubLayout>
    );
  }

  return (
    <SupplierHubLayout>
      <div className="space-y-5">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
              Supplier Hub
            </p>
            <h1 className="text-2xl font-bold" style={{ color: textPri }}>Awarded Orders</h1>
            <p className="text-sm mt-0.5" style={{ color: textSec }}>
              Manage your manufacturing workflow
            </p>
          </div>
          {orders.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,107,53,0.1)', color: ACCENT, border: '1px solid rgba(255,107,53,0.25)' }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </div>
          )}
        </div>

        {/* ── Alerts ───────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Error</p>
              <p className="text-sm mt-0.5" style={{ color: '#ef4444', opacity: 0.8 }}>{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
            <p className="text-sm font-medium" style={{ color: '#22c55e' }}>{successMessage}</p>
          </div>
        )}

        {/* ── Stage Change Confirmation Dialog ─────────────────────────── */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '' });
        }}>
          <DialogContent style={{ background: dialogBg, border: `1px solid ${dialogBord}`, color: textPri }}
            className="sm:max-w-md rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg font-bold" style={{ color: textPri }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                Confirm Stage Change
              </DialogTitle>
              <DialogDescription className="text-sm mt-1" style={{ color: textSec }}>
                This action will be visible to the client and admin in real-time.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3">
              {/* Order name */}
              <div className="p-3 rounded-xl" style={{ background: innerBg, border: `1px solid ${innerBorder}` }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSec }}>Order</p>
                <p className="text-base font-bold" style={{ color: textPri }}>{confirmDialog.orderName}</p>
              </div>

              {/* Stage transition */}
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl text-center" style={{ background: innerBg, border: `1px solid ${innerBorder}` }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: textSec }}>Current</p>
                  <p className="text-sm font-semibold" style={{ color: textMid }}>{confirmDialog.fromStage}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                <div className="flex-1 p-3 rounded-xl text-center"
                  style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Moving to</p>
                  <p className="text-sm font-semibold" style={{ color: ACCENT }}>{confirmDialog.toStage}</p>
                </div>
              </div>

              {/* Note textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textSec }}>
                  Stage Note <span className="font-normal normal-case opacity-60">(sent to admin & client)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what was completed, any issues, or next steps…"
                  value={confirmDialog.note}
                  onChange={e => setConfirmDialog(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{
                    background: inputBg, border: `1px solid ${inputBorder}`,
                    color: textPri,
                  }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <button
                onClick={() => setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '' })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: innerBg, border: `1px solid ${innerBorder}`, color: textMid }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderStatus(confirmDialog.orderId, confirmDialog.newStatus, confirmDialog.note)}
                disabled={!!updatingOrder}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #f97316)`, boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}
              >
                {updatingOrder ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><ChevronRight className="w-4 h-4" /> Confirm & Advance</>
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {orders.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: innerBg, border: `1px solid ${innerBorder}` }}>
              <Package className="w-7 h-7" style={{ color: textSec }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: textMid }}>No awarded orders yet</p>
            <p className="text-xs mt-1" style={{ color: textSec }}>Check back after your bids are accepted</p>
          </div>
        )}

        {/* ── Order Cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {orders.map(order => {
            const stage       = STAGES.find(s => s.id === order.order_status);
            const stageColor  = stage?.hex || ACCENT;
            const isExpanded   = expandedOrder === order.id;
            const pipeline     = buildPipeline(order.selected_processes);
            const currentIdx   = pipeline.indexOf(order.order_status);
            const nextStageId  = currentIdx >= 0 && currentIdx < pipeline.length - 1 ? pipeline[currentIdx + 1] : null;
            const nextStage    = nextStageId ? (STAGES.find(s => s.id === nextStageId) || { id: nextStageId, label: nextStageId, icon: Package, hex: ACCENT }) : null;
            const isDelivered  = order.order_status === 'DELIVERED';

            return (
              <div key={order.id} className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: cardBg, border: `1px solid ${isExpanded ? stageColor + '44' : cardBorder}` }}>

                {/* ── Card Header ── */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {/* Stage color indicator */}
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: stageColor }} />

                  {/* Job ID chip */}
                  <div className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0"
                    style={{ background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}30` }}>
                    {order.rz_job_id || order.id.slice(0, 8).toUpperCase()}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate" style={{ color: textPri }}>
                      {order.part_name || order.ghost_public_name || 'Unnamed Order'}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: textSec }}>
                      {order.ghost_public_name && order.part_name ? `${order.ghost_public_name} · ` : ''}
                      {order.material && `Material: ${order.material}`}
                      {order.quantity && ` · Qty: ${order.quantity}`}
                    </p>
                  </div>

                  {/* Stage badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
                    style={{ background: `${stageColor}12`, color: stageColor, border: `1px solid ${stageColor}30` }}>
                    {stage?.icon && <stage.icon className="w-3 h-3" />}
                    {stage?.label || order.order_status.replace(/_/g, ' ')}
                  </div>

                  {/* Expand toggle */}
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform duration-200"
                    style={{ color: textSec, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </div>

                {/* ── Expanded Content ── */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: innerBorder }}
                    onClick={e => e.stopPropagation()}>

                    {/* Pipeline stepper */}
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSec }}>
                        Manufacturing Pipeline
                      </p>
                      <div className="flex items-center gap-0 overflow-x-auto">
                        {STAGES.map((s, idx) => {
                          const done    = idx < currentIdx;
                          const current = idx === currentIdx;
                          const pending = idx > currentIdx;
                          const dotColor = done ? '#22c55e' : current ? s.hex : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
                          return (
                            <React.Fragment key={s.id}>
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                  style={{
                                    background: done ? 'rgba(34,197,94,0.15)' : current ? `${s.hex}20` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                    border: `1.5px solid ${dotColor}`,
                                  }}>
                                  {done
                                    ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                                    : <s.icon className="w-3 h-3" style={{ color: current ? s.hex : textSec }} />
                                  }
                                </div>
                                <p className="text-[9px] font-semibold text-center leading-tight"
                                  style={{ color: current ? s.hex : done ? '#22c55e' : textSec }}>
                                  {s.label}
                                </p>
                              </div>
                              {idx < STAGES.length - 1 && (
                                <div className="flex-1 h-px mx-1 mb-4"
                                  style={{ background: idx < currentIdx ? '#22c55e50' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl p-4" style={{ background: innerBg, border: `1px solid ${innerBorder}` }}>
                      <OrderTimeline
                        currentStatus={order.order_status}
                        createdAt={order.created_at}
                        updatedAt={order.updated_at}
                        updates={order.rz_job_id ? (jobUpdates[order.rz_job_id] || []) : []}
                        selectedProcesses={order.selected_processes}
                        compact={true}
                      />
                    </div>

                    {/* Delivered banner */}
                    {isDelivered && (
                      <div className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#22c55e' }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Order Delivered Successfully</p>
                          <p className="text-xs mt-0.5" style={{ color: '#22c55e', opacity: 0.7 }}>All manufacturing stages complete.</p>
                        </div>
                      </div>
                    )}

                    {/* Document Upload */}
                    {order.order_status !== 'AWARDED' && !isDelivered && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textSec }}>
                          Upload Stage Documents
                        </p>
                        <div
                          className="flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-150"
                          style={{
                            background: inputBg,
                            border: `2px dashed ${inputBorder}`,
                            color: textMid,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.color = textMid; }}
                          onClick={e => { e.stopPropagation(); e.preventDefault(); if (!uploadingDoc) triggerFileUpload(order.id); }}
                        >
                          {uploadingDoc
                            ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Uploading…</span></>
                            : <><Upload className="w-4 h-4" /><span className="text-sm font-medium">Click to upload documents</span></>
                          }
                        </div>
                      </div>
                    )}

                    {/* Technical Drawings */}
                    {(() => {
                      const clientDocs = (orderDocuments[order.id] || []).filter(d =>
                        d.file_type === 'client_drawing' || d.file_type === '3d_model'
                      );
                      if (!clientDocs.length) return null;
                      const drawings = clientDocs.filter(d => d.file_type === 'client_drawing');
                      const models   = clientDocs.filter(d => d.file_type === '3d_model');
                      return (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: textSec }}>
                            <FileText className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                            Technical Drawings & Files ({clientDocs.length})
                          </p>
                          {drawings.map(doc => <DocumentPreview key={doc.id} filePath={doc.file_path} fileName={doc.file_name} compact={true} />)}
                          {models.map(doc => (
                            <div key={doc.id} className="space-y-1">
                              <div className="flex items-center gap-2 text-xs" style={{ color: textSec }}>
                                <Box className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                                {doc.file_name}
                              </div>
                              <ThreeDModelViewer url={doc.file_url} fileName={doc.file_name} />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Admin Documents */}
                    {(orderDocuments[order.id] || []).filter(d => d.file_type === 'admin_document').length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: textSec }}>
                          <FileText className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                          From RZ Engineering ({(orderDocuments[order.id] || []).filter(d => d.file_type === 'admin_document').length})
                        </p>
                        {(orderDocuments[order.id] || []).filter(d => d.file_type === 'admin_document').map(doc => (
                          <DocumentPreview key={doc.id} filePath={doc.file_path} fileName={doc.file_name} compact={true} />
                        ))}
                      </div>
                    )}

                    {/* Supplier Submissions */}
                    {(orderDocuments[order.id] || []).filter(d => d.file_type === 'supplier_submission').length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: textSec }}>
                          <Eye className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
                          Your Submissions ({(orderDocuments[order.id] || []).filter(d => d.file_type === 'supplier_submission').length})
                        </p>
                        {(orderDocuments[order.id] || []).filter(d => d.file_type === 'supplier_submission').map(doc => (
                          <DocumentPreview key={doc.id} filePath={doc.file_path} fileName={doc.file_name} compact={true} />
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textSec }}>
                        Stage Notes <span className="font-normal normal-case opacity-60">(visible to client & admin)</span>
                      </p>
                      <textarea
                        rows={3}
                        placeholder="Describe progress, issues, or next steps…"
                        value={localNotes[order.id] || ''}
                        onChange={e => setLocalNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all"
                        style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPri }}
                        onFocus={e => { e.target.style.borderColor = ACCENT; }}
                        onBlur={e => { e.target.style.borderColor = inputBorder; }}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); saveNotes(order.id); }}
                        disabled={savingNotes[order.id] || !localNotes[order.id]?.trim()}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #f97316)` }}
                      >
                        {savingNotes[order.id]
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                          : 'Save Note'
                        }
                      </button>
                    </div>

                    {/* Meta info strip */}
                    <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl flex-wrap"
                      style={{ background: innerBg, border: `1px solid ${innerBorder}` }}>
                      <span className="text-xs" style={{ color: textSec }}>
                        Stage: <span className="font-semibold" style={{ color: stageColor }}>{stage?.label}</span>
                      </span>
                      <span className="text-xs" style={{ color: textSec }}>
                        RZ ID: <span className="font-mono" style={{ color: textMid }}>{order.rz_job_id || 'Pending'}</span>
                      </span>
                      {order.updated_at && (
                        <span className="text-xs" style={{ color: textSec }}>
                          Updated: <span style={{ color: textMid }}>{format(new Date(order.updated_at), 'dd MMM yyyy, HH:mm')}</span>
                        </span>
                      )}
                    </div>

                    {/* Move to Next Stage CTA */}
                    {!isDelivered && nextStage && (
                      <button
                        onClick={e => { e.stopPropagation(); confirmStageChange(order.id, nextStage.id); }}
                        disabled={updatingOrder === order.id}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}, #f97316)`,
                          boxShadow: `0 4px 20px rgba(255,107,53,0.3)`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,107,53,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,53,0.3)'; }}
                      >
                        {updatingOrder === order.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Updating stage…</>
                        ) : (
                          <>
                            <nextStage.icon className="w-4 h-4" />
                            Move to {nextStage.label}
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SupplierHubLayout>
  );
}
