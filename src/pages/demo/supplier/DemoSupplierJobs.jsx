import React from 'react';
import { Link } from 'react-router-dom';
import { useDemoContext } from '@/contexts/DemoContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { STATUS_LABELS, STATUS_COLORS } from '@/demo/demoData';
import { Package, ArrowRight, Briefcase } from 'lucide-react';

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DemoSupplierJobs() {
  const { myOrders, activeDemoUser } = useDemoContext();

  const active = myOrders.filter((o) => !['DELIVERED'].includes(o.order_status));
  const completed = myOrders.filter((o) => o.order_status === 'DELIVERED');

  return (
    <SupplierHubLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-500" />
          My Jobs
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeDemoUser?.company} · {myOrders.length} total jobs</p>
      </div>

      {/* Active jobs */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Active ({active.length})</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {active.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No active jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {active.map((order) => (
                <Link
                  key={order.id}
                  to={`/demo/supplier/job/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-orange-500 font-mono font-bold">{order.rz_job_id}</span>
                      <StatusBadge status={order.order_status} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{order.part_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.material} · {order.quantity} pcs · {formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {order.estimated_value && (
                      <span className="text-sm font-bold text-emerald-600">£{order.estimated_value.toLocaleString()}</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed jobs */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Completed ({completed.length})</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {completed.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-slate-400">No completed jobs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {completed.map((order) => (
                <Link
                  key={order.id}
                  to={`/demo/supplier/job/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group opacity-70 hover:opacity-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-orange-500 font-mono font-bold">{order.rz_job_id}</span>
                      <StatusBadge status={order.order_status} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 truncate">{order.part_name}</p>
                  </div>
                  {order.estimated_value && (
                    <span className="text-sm font-bold text-emerald-600 ml-4">£{order.estimated_value.toLocaleString()}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SupplierHubLayout>
  );
}
