import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Send, Search, Package, Layers, Hash, Calendar, ChevronRight } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import ReleaseToSuppliersModal from '@/components/ReleaseToSuppliersModal';
import { format } from 'date-fns';

export default function SupplierPoolPage() {
  const [orders,        setOrders]        = useState([]);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [loading,       setLoading]       = useState(true);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchSanitizedOrders(); }, []);

  const fetchSanitizedOrders = async () => {
    setLoading(true);
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_status', 'SANITIZED')
      .order('updated_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const filtered = orders.filter(o =>
    (o.rz_job_id || o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.public_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.material?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Supplier Management</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Assign to Supplier</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Release sanitised orders to the supplier pool for bidding.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 self-start sm:self-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{orders.length} Ready to Assign</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            placeholder="Search by job ID, name or material…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Cards */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 dark:text-slate-500 text-sm">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              {searchTerm ? 'No orders match your search.' : 'No sanitised orders ready to assign.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Orders appear here once sanitisation is complete.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
              >
                {/* Left accent */}
                <div className="w-1 self-stretch rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.rz_job_id && (
                      <span className="font-mono text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">
                        {order.rz_job_id}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-purple-600 dark:text-purple-400">
                      SANITIZED
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                    {order.public_name || order.part_name || 'Unnamed Order'}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
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
                    {order.updated_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> Sanitised {format(new Date(order.updated_at), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleOpenModal(order)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex-shrink-0 active:scale-95"
                >
                  <Send size={14} /> Assign Supplier <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReleaseToSuppliersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onRefresh={fetchSanitizedOrders}
      />
    </ControlCentreLayout>
  );
}
