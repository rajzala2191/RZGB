import React from 'react';
import { useDemoContext } from '@/contexts/DemoContext';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES } from '@/demo/demoData';
import { GitBranch } from 'lucide-react';

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' };
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
  );
}

const COLUMN_COLORS = {
  PENDING_ADMIN_SCRUB: 'border-t-yellow-500',
  SANITIZED: 'border-t-blue-500',
  OPEN_FOR_BIDDING: 'border-t-purple-500',
  BID_RECEIVED: 'border-t-indigo-500',
  AWARDED: 'border-t-orange-500',
  MATERIAL: 'border-t-cyan-500',
  CASTING: 'border-t-teal-500',
  MACHINING: 'border-t-green-500',
  QC: 'border-t-lime-500',
  DISPATCH: 'border-t-amber-500',
  DELIVERED: 'border-t-emerald-500',
};

const COLUMN_HEADER_COLORS = {
  PENDING_ADMIN_SCRUB: 'text-yellow-600',
  SANITIZED: 'text-blue-600',
  OPEN_FOR_BIDDING: 'text-purple-600',
  BID_RECEIVED: 'text-indigo-600',
  AWARDED: 'text-orange-600',
  MATERIAL: 'text-cyan-600',
  CASTING: 'text-teal-600',
  MACHINING: 'text-green-600',
  QC: 'text-lime-600',
  DISPATCH: 'text-amber-600',
  DELIVERED: 'text-emerald-600',
};

export default function DemoAdminPipeline() {
  const { allOrders, DEMO_CLIENTS, updateDemoOrderStatus } = useDemoContext();

  const columns = ORDER_STATUSES.map((status) => ({
    status,
    orders: allOrders.filter((o) => o.order_status === status),
  }));

  return (
    <ControlCentreLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-500" />
          Pipeline Board
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{allOrders.length} orders across {ORDER_STATUSES.length} stages</p>
      </div>

      {/* Horizontal scrollable Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {columns.map(({ status, orders }) => (
            <div
              key={status}
              className={`w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden border-t-2 shadow-sm ${COLUMN_COLORS[status]}`}
            >
              {/* Column header */}
              <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge status={status} />
                  <span className={`text-xs font-semibold truncate ${COLUMN_HEADER_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-bold ml-1 flex-shrink-0">{orders.length}</span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[80px]">
                {orders.length === 0 && (
                  <p className="text-[10px] text-slate-300 text-center py-4">Empty</p>
                )}
                {orders.map((order) => {
                  const client = DEMO_CLIENTS.find((c) => c.id === order.client_id);
                  return (
                    <div
                      key={order.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors cursor-default"
                    >
                      <p className="text-[10px] text-orange-500 font-mono font-bold mb-1">{order.rz_job_id}</p>
                      <p className="text-xs text-slate-800 font-medium leading-snug mb-1.5">{order.part_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 truncate">{client?.company}</span>
                        {order.estimated_value && (
                          <span className="text-[10px] text-emerald-600 font-semibold ml-1 flex-shrink-0">
                            £{(order.estimated_value / 1000).toFixed(1)}k
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Summary</h3>
        <div className="flex flex-wrap gap-3">
          {columns.filter((c) => c.orders.length > 0).map(({ status, orders }) => (
            <div key={status} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]?.dot || 'bg-slate-400'}`} />
              <span className="text-xs text-slate-700">{STATUS_LABELS[status]}</span>
              <span className={`text-xs font-bold ${COLUMN_HEADER_COLORS[status]}`}>{orders.length}</span>
            </div>
          ))}
        </div>
      </div>
    </ControlCentreLayout>
  );
}
