import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import {
  ShieldCheck, Search, ArrowRight, Package,
  Layers, Hash, Calendar, User, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

export default function SanitisationGatePage() {
  const navigate = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchPendingOrders(); }, []);

  const fetchPendingOrders = async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_status', 'PENDING_ADMIN_SCRUB')
      .order('created_at', { ascending: false });

    if (error) { setLoading(false); return; }
    if (data?.length) {
      const clientIds = [...new Set(data.map(o => o.client_id).filter(Boolean))];
      const { data: profiles } = await supabaseAdmin
        .from('profiles').select('id, company_name').in('id', clientIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.company_name]));
      setOrders(data.map(o => ({ ...o, client_company_name: profileMap[o.client_id] || '—' })));
    } else {
      setOrders([]);
    }
    setLoading(false);
  };

  const filtered = orders.filter(o =>
    (o.rz_job_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.part_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.client_company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ControlCentreLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Review Queue</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Sanitisation Gate</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Review and AI-scrub client drawings before releasing to suppliers.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 self-start sm:self-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {orders.length} Pending Review
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            placeholder="Search by job ID, part name or client…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              {searchTerm ? 'No orders match your search.' : 'No orders pending sanitisation.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              New orders from clients will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors group"
              >
                {/* Amber left strip */}
                <div className="w-1 self-stretch rounded-full bg-amber-400 flex-shrink-0 hidden sm:block" />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.rz_job_id ? (
                      <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">
                        {order.rz_job_id}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-[#232329] px-2 py-0.5 rounded-lg">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      Pending Scrub
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                    {order.part_name || 'Unnamed Part'}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
                    {order.client_company_name && (
                      <span className="flex items-center gap-1">
                        <User size={11} className="text-orange-500" /> {order.client_company_name}
                      </span>
                    )}
                    {order.material && (
                      <span className="flex items-center gap-1">
                        <Layers size={11} className="text-orange-500" /> {order.material}
                      </span>
                    )}
                    {order.quantity && (
                      <span className="flex items-center gap-1">
                        <Hash size={11} className="text-orange-500" /> {order.quantity} units
                      </span>
                    )}
                    {order.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(`/control-centre/sanitisation-gate/review/${order.id}`)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex-shrink-0 active:scale-95"
                >
                  <ShieldCheck size={14} /> Review & Scrub <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
