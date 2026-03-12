import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchSpendBySupplier, fetchSpendByMaterial, fetchSpendOverTime, fetchSpendSummary, fetchBidSavings } from '@/services/spendAnalyticsService';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, Percent, Loader2,
} from 'lucide-react';

const COLORS = ['#FF6B35', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon size={16} /></div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

export default function SpendAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [bySupplier, setBySupplier] = useState([]);
  const [byMaterial, setByMaterial] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [savings, setSavings] = useState({});

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [summ, supp, mat, time, sav] = await Promise.all([
      fetchSpendSummary(),
      fetchSpendBySupplier(),
      fetchSpendByMaterial(),
      fetchSpendOverTime(12),
      fetchBidSavings(),
    ]);
    setSummary(summ);
    setBySupplier(supp);
    setByMaterial(mat);
    setOverTime(time);
    setSavings(sav);
    setLoading(false);
  };

  const fmt = (n) => n >= 1000 ? `£${(n / 1000).toFixed(1)}k` : `£${n.toFixed(0)}`;

  if (loading) {
    return (
      <ControlCentreLayout>
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Procurement</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Spend Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Procurement spend overview across suppliers, materials, and time.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Spend" value={fmt(summary.totalSpend || 0)} subtitle={`${summary.activeOrders + summary.deliveredOrders} orders`} icon={DollarSign} color="bg-orange-100 dark:bg-orange-950/30 text-orange-600" />
          <MetricCard title="Active Orders" value={summary.activeOrders || 0} icon={ShoppingCart} color="bg-blue-100 dark:bg-blue-950/30 text-blue-600" />
          <MetricCard title="Avg Order Value" value={fmt(summary.avgOrderValue || 0)} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" />
          <MetricCard title="Bid Savings" value={fmt(savings.totalSaved || 0)} subtitle={`${savings.ordersWithSavings || 0} orders`} icon={Percent} color="bg-purple-100 dark:bg-purple-950/30 text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Spend Over Time</h3>
            {overTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={overTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, 'Spend']} />
                  <Area type="monotone" dataKey="total" stroke="#FF6B35" fill="rgba(255,107,53,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Spend by Material</h3>
            {byMaterial.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byMaterial} dataKey="total" nameKey="material" cx="50%" cy="50%" outerRadius={100} label={({ material, percent }) => `${material} ${(percent * 100).toFixed(0)}%`}>
                    {byMaterial.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, 'Spend']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Spend by Supplier</h3>
          {bySupplier.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, bySupplier.length * 40)}>
              <BarChart data={bySupplier.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.15)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="supplier" tick={{ fontSize: 11, fill: '#9ca3af' }} width={110} />
                <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, 'Spend']} />
                <Bar dataKey="total" fill="#FF6B35" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Supplier Spend Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 dark:text-slate-500 uppercase border-b border-gray-200 dark:border-[#232329]">
                <tr><th className="pb-3 pr-4">Supplier</th><th className="pb-3 pr-4 text-right">Orders</th><th className="pb-3 pr-4 text-right">Total Spend</th><th className="pb-3 text-right">Avg Order</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#232329]">
                {bySupplier.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#232329]">
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-slate-100">{s.supplier}</td>
                    <td className="py-3 pr-4 text-right text-gray-600 dark:text-slate-400">{s.count}</td>
                    <td className="py-3 pr-4 text-right font-bold text-gray-900 dark:text-slate-100">£{Number(s.total).toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-slate-400">£{s.count ? Number(s.total / s.count).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </ControlCentreLayout>
  );
}
