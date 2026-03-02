import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Loader2, AlertCircle, CheckCircle2, Clock, Upload, FileText,
  ChevronRight, Package, Zap, Hourglass, ShieldCheck, Truck, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import OrderTimeline from '@/components/OrderTimeline';

// Full pipeline including AWARDED so index math works correctly
const STAGES = [
  { id: 'AWARDED', label: 'Supplier Assigned', icon: CheckCircle2, color: 'amber' },
  { id: 'MATERIAL', label: 'Material Sourcing', icon: Package, color: 'sky' },
  { id: 'CASTING', label: 'Casting', icon: Zap, color: 'orange' },
  { id: 'MACHINING', label: 'Machining', icon: Hourglass, color: 'violet' },
  { id: 'QC', label: 'Quality Control', icon: ShieldCheck, color: 'emerald' },
  { id: 'DISPATCH', label: 'Dispatch', icon: Truck, color: 'blue' },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, color: 'green' },
];

export default function SupplierOrderManager() {
  const { currentUser, userCompanyName } = useAuth();
  const [orders, setOrders] = useState([]);
  const [jobUpdates, setJobUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [savingNotes, setSavingNotes] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, newStatus: null, orderName: '' });

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
          created_at, updated_at, ghost_public_name, quantity
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

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchAwardedOrders();
    fetchJobUpdates();

    // Realtime subscription — syncs across all portals (client, admin, supplier)
    const channel = supabase
      .channel('supplier-order-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAwardedOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_updates' }, () => {
        fetchJobUpdates();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchAwardedOrders, fetchJobUpdates]);

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
    });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '' });
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

      // Step 3: Add job update record (visible to client & admin dashboards via realtime)
      if (order?.rz_job_id) {
        await supabaseAdmin.from('job_updates').insert({
          rz_job_id: order.rz_job_id,
          stage: newStatus,
          status: 'in_progress',
          notes: `Supplier moved order to ${stageName}`,
          created_by: currentUser?.email,
        }).then(({ error: jobErr }) => {
          if (jobErr) console.warn('[SupplierOrderManager] job_updates insert warning:', jobErr);
        });
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

  if (loading) {
    return (
      <SupplierHubLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin w-12 h-12 text-cyan-500" />
        </div>
      </SupplierHubLayout>
    );
  }

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Awarded Orders</h1>
          <p className="text-slate-400 mt-1">
            Manage your manufacturing workflow for awarded orders
          </p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-semibold">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-lg p-4 flex gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-300 font-semibold">Stage Updated</p>
              <p className="text-emerald-300 text-sm mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Stage Change Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '' }); }}>
          <DialogContent className="bg-[#0f172a] border-slate-700 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                Confirm Stage Change
              </DialogTitle>
              <DialogDescription className="text-slate-400 pt-2">
                You are about to move this order to the next manufacturing stage. This action will be visible to the client and admin.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-3">
              <div className="bg-[#1e293b] rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Order</p>
                <p className="text-lg font-bold text-white">{confirmDialog.orderName}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-800/80 rounded-lg p-3 text-center border border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Current</p>
                  <p className="text-sm font-semibold text-slate-300">{confirmDialog.fromStage}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 bg-cyan-950/40 rounded-lg p-3 text-center border border-cyan-700/50">
                  <p className="text-[10px] uppercase tracking-wider text-cyan-500 mb-1">Moving to</p>
                  <p className="text-sm font-semibold text-cyan-300">{confirmDialog.toStage}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                This update will be reflected on the client tracking page and admin dashboard in real-time.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setConfirmDialog({ open: false, orderId: null, newStatus: null, orderName: '' })}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateOrderStatus(confirmDialog.orderId, confirmDialog.newStatus)}
                disabled={updatingOrder}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {updatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Confirm & Move Forward
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {orders.length === 0 && !error ? (
          <Card className="bg-[#0f172a] border-slate-800 rounded-2xl shadow-xl">
            <CardContent className="pt-12 text-center">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No awarded orders yet</p>
              <p className="text-slate-500 text-sm mt-2">Check back after your bids are accepted</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => {
              const currentStage = STAGES.find(s => s.id === order.order_status);
              const isExpanded = expandedOrder === order.id;

              return (
                <Card
                  key={order.id}
                  className="bg-[#0f172a] border-slate-800 rounded-2xl shadow-xl hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : order.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <span className="font-mono text-sm bg-slate-800/80 text-cyan-400 px-2.5 py-1 rounded-lg border border-slate-700">
                            {order.id.slice(0, 8).toUpperCase()}
                          </span>
                          {order.part_name}
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          {order.ghost_public_name || 'RZ Order'} • Material: {order.material}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                            order.order_status === 'DELIVERED'
                              ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                              : 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                          }`}
                        >
                          {currentStage?.icon && (
                            <currentStage.icon className="w-3 h-3" />
                          )}
                          {currentStage?.label || order.order_status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-6 border-t border-slate-800 space-y-4" onClick={e => e.stopPropagation()}>
                      {/* Pipeline Progress */}
                      <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Manufacturing Pipeline
                        </label>
                        <OrderTimeline
                          currentStatus={order.order_status}
                          createdAt={order.created_at}
                          updatedAt={order.updated_at}
                          updates={order.rz_job_id ? (jobUpdates[order.rz_job_id] || []) : []}
                          compact={true}
                        />
                      </div>

                      {/* Stage Progress Summary */}
                      {order.order_status !== 'DELIVERED' && (() => {
                        const currentIndex = STAGES.findIndex(s => s.id === order.order_status);
                        const nextStage = STAGES[currentIndex + 1];
                        return nextStage ? (
                          <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {STAGES.map((stage, idx) => {
                                    const isDone = idx <= currentIndex;
                                    const isCurrent = idx === currentIndex;
                                    return (
                                      <div key={stage.id} className="flex items-center gap-1">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                          isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                          isCurrent ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                                          'bg-slate-800 text-slate-500 border border-slate-700'
                                        }`}>
                                          {isDone && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                        </div>
                                        {idx < STAGES.length - 1 && (
                                          <div className={`w-4 h-0.5 ${idx < currentIndex ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Next step</p>
                                <p className="text-sm font-semibold text-cyan-300 flex items-center gap-1">
                                  <nextStage.icon className="w-3.5 h-3.5" />
                                  {nextStage.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {order.order_status === 'DELIVERED' && (
                        <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-4 text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-green-300 font-semibold">Order Delivered Successfully</p>
                          <p className="text-green-400/60 text-sm mt-1">This order has completed all manufacturing stages.</p>
                        </div>
                      )}

                      {/* Document Upload — only show after AWARDED stage */}
                      {order.order_status !== 'AWARDED' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Upload Stage Documents
                          </label>
                          <div
                            className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-cyan-500/30 transition-colors cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!uploadingDoc) {
                                triggerFileUpload(order.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
                              {uploadingDoc ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Click to upload documents
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Update Notes
                        </label>
                        <textarea
                          rows="3"
                          placeholder="Add notes about this stage..."
                          value={localNotes[order.id] || ''}
                          onChange={e => {
                            setLocalNotes(prev => ({ ...prev, [order.id]: e.target.value }));
                          }}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            saveNotes(order.id);
                          }}
                          disabled={savingNotes[order.id]}
                          size="sm"
                          className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          {savingNotes[order.id] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Notes'
                          )}
                        </Button>
                      </div>

                      {/* Status Info */}
                      <div className="bg-[#1e293b]/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-800 space-y-1">
                        <p>
                          <strong>Current Stage:</strong>{' '}
                          {STAGES.find(s => s.id === order.order_status)?.label || order.order_status}
                        </p>
                        <p className="text-xs text-slate-500">
                          RZ Job ID: <span className="font-mono text-slate-400">{order.rz_job_id || 'Pending'}</span>
                          {order.updated_at && <> • Last updated: {format(new Date(order.updated_at), 'dd MMM yyyy, HH:mm')}</>}
                        </p>
                      </div>

                      {/* ── Move to Next Stage CTA (bottom) ── */}
                      {order.order_status !== 'DELIVERED' && (() => {
                        const ci = STAGES.findIndex(s => s.id === order.order_status);
                        const next = STAGES[ci + 1];
                        if (!next) return null;
                        const NextIcon = next.icon;
                        return (
                          <Button
                            onClick={e => {
                              e.stopPropagation();
                              confirmStageChange(order.id, next.id);
                            }}
                            disabled={updatingOrder === order.id}
                            className="w-full py-6 text-base font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-900/30 transition-all"
                          >
                            {updatingOrder === order.id ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Updating stage…
                              </>
                            ) : (
                              <>
                                <NextIcon className="w-5 h-5 mr-2" />
                                Move to {next.label}
                                <ChevronRight className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        );
                      })()}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SupplierHubLayout>
  );
}
