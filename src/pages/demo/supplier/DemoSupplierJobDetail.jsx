import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDemoContext } from '@/contexts/DemoContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES } from '@/demo/demoData';
import {
  ArrowLeft, Package, MapPin, Calendar, Hash, Layers, MessageSquare, CheckCircle2, Clock,
  ChevronRight, Wrench,
} from 'lucide-react';

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: 'bg-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Production stages only
const PROD_STAGES = ['MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED'];

export default function DemoSupplierJobDetail() {
  const { id } = useParams();
  const { getDemoOrderById, getUpdatesForOrder, updateDemoOrderStatus } = useDemoContext();

  const order = getDemoOrderById(id);
  const updates = order ? getUpdatesForOrder(order.id) : [];

  if (!order) {
    return (
      <SupplierHubLayout>
        <div className="text-center py-20">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Job not found</p>
          <Link to="/demo/supplier/jobs" className="text-purple-600 text-sm mt-2 inline-block hover:underline">← Back</Link>
        </div>
      </SupplierHubLayout>
    );
  }

  const currentProdIdx = PROD_STAGES.indexOf(order.order_status);
  const nextStage = currentProdIdx >= 0 && currentProdIdx < PROD_STAGES.length - 1
    ? PROD_STAGES[currentProdIdx + 1]
    : null;

  const canProgress = nextStage && order.order_status !== 'DELIVERED';

  return (
    <SupplierHubLayout>
      <Link to="/demo/supplier/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-500 font-mono font-bold text-sm">{order.rz_job_id}</span>
            <StatusBadge status={order.order_status} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{order.part_name}</h1>
        </div>
        {canProgress && (
          <button
            onClick={() => updateDemoOrderStatus(order.id, nextStage)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Wrench className="w-4 h-4" />
            Advance to {STATUS_LABELS[nextStage]}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Production progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              Production Stages
            </h3>
            <div className="flex flex-wrap gap-3">
              {order.selected_processes?.concat(['QC', 'DISPATCH', 'DELIVERED']).filter((s, i, a) => a.indexOf(s) === i).map((stage) => {
                const stageIdx = ORDER_STATUSES.indexOf(stage);
                const currentIdx = ORDER_STATUSES.indexOf(order.order_status);
                const done = stageIdx < currentIdx;
                const active = stage === order.order_status;
                return (
                  <div key={stage} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                    done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    active ? 'bg-purple-50 border-purple-300 text-purple-700 ring-1 ring-purple-200' :
                    'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     active ? <Clock className="w-3.5 h-3.5" /> :
                     <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />}
                    {STATUS_LABELS[stage] || stage}
                  </div>
                );
              })}
            </div>
            {canProgress && (
              <p className="text-xs text-slate-500 mt-4">
                Click "Advance to {STATUS_LABELS[nextStage]}" above to simulate progressing this job to the next stage.
              </p>
            )}
          </div>

          {/* Updates */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Job Updates
            </h3>
            {updates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No updates yet</p>
            ) : (
              <div className="space-y-4">
                {updates.map((u) => (
                  <div key={u.id} className="flex gap-3">
                    <div className="w-1.5 bg-slate-200 rounded-full flex-shrink-0 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400 border border-purple-500 absolute -left-0.5 top-1" />
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm text-slate-800">{u.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{u.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details sidebar */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Job Details</h3>
            {[
              { icon: Hash, label: 'Job ID', value: order.rz_job_id },
              { icon: Layers, label: 'Material', value: order.material },
              { icon: Package, label: 'Quantity', value: `${order.quantity} pieces` },
              { icon: MapPin, label: 'Delivery', value: order.delivery_address },
              { icon: Calendar, label: 'Created', value: formatDate(order.created_at) },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm text-slate-800 font-medium">{item.value}</p>
                </div>
              </div>
            ))}
            {order.estimated_value && (
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Contract Value</p>
                <p className="text-lg font-bold text-emerald-600">£{order.estimated_value.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
