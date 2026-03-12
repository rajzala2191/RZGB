import { useState, useEffect } from 'react';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useToast } from '@/components/ui/use-toast';
import { BarChart2, Search, Loader2, Trophy, AlertCircle } from 'lucide-react';

export function pctColor(pct, invert = false) {
  if (pct == null) return 'text-slate-500';
  if (!invert) {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  } else {
    // lower is better (NCR rate)
    if (pct <= 2)  return 'text-emerald-400';
    if (pct <= 5)  return 'text-amber-400';
    return 'text-red-400';
  }
}

export function pctBg(pct, invert = false) {
  if (pct == null) return 'bg-slate-800/40';
  if (!invert) {
    if (pct >= 90) return 'bg-emerald-950/30';
    if (pct >= 70) return 'bg-amber-950/30';
    return 'bg-red-950/30';
  } else {
    if (pct <= 2)  return 'bg-emerald-950/30';
    if (pct <= 5)  return 'bg-amber-950/30';
    return 'bg-red-950/30';
  }
}

export default function SupplierScorecardPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('supplier_scorecard')
          .select('*');
        if (error) throw error;
        setRows(data || []);
      } catch (err) {
        // fallback: fetch from profiles + manual aggregation if view doesn't exist yet
        try {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, company_name, email')
            .eq('role', 'supplier');
          setRows((profiles || []).map(p => ({
            supplier_id: p.id,
            company_name: p.company_name,
            email: p.email,
            total_delivered: 0,
            on_time_delivered: 0,
            on_time_pct: null,
            ncr_count: 0,
            ncr_rate_pct: null,
            total_bids: 0,
            won_bids: 0,
          })));
        } catch (e2) {
          toast({ title: 'Error loading scorecard', description: e2.message, variant: 'destructive' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, []);

  const filtered = rows.filter(r =>
    !search.trim() ||
    r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Performance</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-3">
              <BarChart2 className="text-orange-500" size={28} /> Supplier Scorecard
            </h1>
            <p className="text-sm text-slate-400 mt-1">Track delivery performance, NCR rates and bid activity per supplier.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Good
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Warning
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-2" /> Poor
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search by supplier name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#13131f] border border-[#1e1e30] text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <AlertCircle size={36} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No suppliers found.</p>
          </div>
        ) : (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3 text-center">Delivered</th>
                    <th className="px-5 py-3 text-center">On-Time %</th>
                    <th className="px-5 py-3 text-center">NCR Count</th>
                    <th className="px-5 py-3 text-center">NCR Rate %</th>
                    <th className="px-5 py-3 text-center">Bids Won</th>
                    <th className="px-5 py-3 text-center">Total Bids</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filtered.map(r => (
                    <tr key={r.supplier_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{r.company_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{r.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-slate-200">{r.total_delivered ?? 0}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {r.on_time_pct != null ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${pctBg(r.on_time_pct)} ${pctColor(r.on_time_pct)}`}>
                            {r.on_time_pct}%
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-slate-300">{r.ncr_count ?? 0}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {r.ncr_rate_pct != null ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${pctBg(r.ncr_rate_pct, true)} ${pctColor(r.ncr_rate_pct, true)}`}>
                            {r.ncr_rate_pct}%
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy size={12} className="text-amber-500" />
                          <span className="font-bold text-amber-400">{r.won_bids ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-slate-400">{r.total_bids ?? 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
