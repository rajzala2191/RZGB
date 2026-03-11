import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DEMO_ORDERS, DEMO_CLIENTS, STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES } from '@/demo/demoData';
import { GitBranch } from 'lucide-react';

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

export default function EmbeddedPipelineDemo() {
  const columns = ORDER_STATUSES.map((status) => ({
    status,
    orders: DEMO_ORDERS.filter((o) => o.order_status === status),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-500" />
          Live Pipeline Board
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{DEMO_ORDERS.length} orders across {ORDER_STATUSES.length} stages</p>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max">
          {columns.map(({ status, orders }) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-44 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden border-t-2 shadow-sm ${COLUMN_COLORS[status]}`}
            >
              <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[status]?.dot || 'bg-slate-400'}`} />
                  <span className={`text-[10px] font-semibold truncate ${COLUMN_HEADER_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold ml-1 flex-shrink-0">{orders.length}</span>
              </div>

              <div className="p-2 space-y-2 min-h-[60px]">
                {orders.length === 0 && (
                  <p className="text-[9px] text-slate-300 text-center py-3">Empty</p>
                )}
                {orders.slice(0, 3).map((order) => {
                  const client = DEMO_CLIENTS.find((c) => c.id === order.client_id);
                  return (
                    <div
                      key={order.id}
                      className="bg-slate-50 border border-slate-100 rounded-lg p-2"
                    >
                      <p className="text-[9px] text-orange-500 font-mono font-bold mb-0.5 truncate">{order.rz_job_id}</p>
                      <p className="text-[10px] text-slate-800 font-medium leading-snug truncate">{order.part_name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-slate-500 truncate">{client?.company}</span>
                        {order.estimated_value && (
                          <span className="text-[9px] text-emerald-600 font-semibold flex-shrink-0">
                            £{(order.estimated_value / 1000).toFixed(1)}k
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {orders.length > 3 && (
                  <p className="text-[9px] text-slate-400 text-center">+{orders.length - 3} more</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
