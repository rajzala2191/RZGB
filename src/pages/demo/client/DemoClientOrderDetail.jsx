import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import OrderTimeline from '@/components/OrderTimeline';
import { useDemoContext } from '@/contexts/DemoContext';
import { FormSection, DisplayField } from '@/components/ui/FormSection';
import {
  ArrowLeft, FileText, ListTree, Loader2, ClipboardList, PoundSterling, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const WITHDRAWABLE = ['PENDING_ADMIN_SCRUB', 'SANITIZED', 'OPEN_FOR_BIDDING', 'BID_RECEIVED', 'AWARDED'];

export default function DemoClientOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getDemoOrderById, getUpdatesForOrder } = useDemoContext();

  const order = getDemoOrderById(orderId);
  const updates = order ? getUpdatesForOrder(order.id) : [];

  if (!order) {
    return (
      <ClientDashboardLayout>
        <div className="p-8 text-slate-400">Order not found.</div>
      </ClientDashboardLayout>
    );
  }

  const currentStatus = order.order_status || 'PENDING_ADMIN_SCRUB';

  return (
    <ClientDashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">

        {/* Back Button */}
        <button
          onClick={() => navigate('/client-dashboard/orders')}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{order.part_name || 'Unnamed Order'}</h1>
            <p className="text-slate-500 mt-1 font-mono">Job ID: {order.rz_job_id}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider border bg-orange-50 border-orange-200 text-orange-600">
              {currentStatus.replace(/_/g, ' ')}
            </span>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                onClick={() => navigate(`/client-dashboard/orders/${order.id}/tracking`)}
                className="bg-slate-100 hover:bg-slate-200 text-orange-600 font-bold border border-slate-200"
              >
                <ListTree className="w-4 h-4 mr-2" /> View Workflow Tracking
              </Button>
              {WITHDRAWABLE.includes(currentStatus) && (
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                  title="Not available in demo"
                >
                  Withdraw (Demo)
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            <FormSection title="Order Specifications" icon={ClipboardList}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <DisplayField label="Material"       value={order.material       || 'Not specified'} />
                <DisplayField label="Quantity"       value={order.quantity       || 'Not specified'} />
                <DisplayField label="Tolerance"      value={order.tolerance      || 'Standard'} />
                <DisplayField label="Surface Finish" value={order.surface_finish || 'As Machined'} />
                {order.estimated_value && (
                  <DisplayField label="Contract Value">
                    <p className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                      <PoundSterling size={13} />
                      {order.estimated_value.toLocaleString('en-GB')}
                    </p>
                  </DisplayField>
                )}
                {order.delivery_address && (
                  <DisplayField label="Delivery Location">
                    <p className="text-slate-800 text-sm flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {order.delivery_address}
                    </p>
                  </DisplayField>
                )}
                <div className="col-span-2">
                  <DisplayField label="Description">
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 min-h-[60px] text-sm">
                      {order.description || 'CNC machined component manufactured to tight tolerances for industrial application. All dimensions to be held within ±0.05mm unless otherwise specified on drawing.'}
                    </p>
                  </DisplayField>
                </div>
                <div className="col-span-2">
                  <DisplayField label="Special Requirements">
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 min-h-[60px] text-sm">
                      {order.special_requirements || 'Material certification required. Parts to be individually tagged with batch number.'}
                    </p>
                  </DisplayField>
                </div>
              </div>
            </FormSection>

            <FormSection title="Documents & Files" icon={FileText}>
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Technical drawings are secured by the RZ anti-poaching layer.</p>
                <p className="text-xs mt-1 text-slate-600">Documents visible to suppliers only after sanitisation.</p>
              </div>
            </FormSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FormSection title="Status">
              <div className="text-center py-4 space-y-3">
                <Loader2 className="w-10 h-10 text-orange-500 mx-auto animate-spin" />
                <p className="text-sm text-slate-300 font-medium">Order is locked for processing.</p>
                <p className="text-xs text-slate-500">Awaiting update from our engineering team.</p>
              </div>
            </FormSection>

            <FormSection title="Order Timeline">
              <OrderTimeline
                currentStatus={currentStatus}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
                updates={updates}
                selectedProcesses={order.selected_processes}
              />
            </FormSection>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
