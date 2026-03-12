import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useToast } from '@/components/ui/use-toast';
import { BarChart2, Search, Loader2, Trophy, AlertCircle, ChevronDown, ChevronUp, Package, Clock, ShieldAlert, Gavel } from 'lucide-react';

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

// Inline colour helpers returning CSS colour strings for inline styles
function metricColor(pct, invert = false) {
  if (pct == null) return 'var(--caption)';
  if (!invert) {
    if (pct >= 90) return '#34d399';
    if (pct >= 70) return '#fbbf24';
    return '#f87171';
  } else {
    if (pct <= 2)  return '#34d399';
    if (pct <= 5)  return '#fbbf24';
    return '#f87171';
  }
}

function metricBg(pct, invert = false) {
  if (pct == null) return 'rgba(100,116,139,0.1)';
  if (!invert) {
    if (pct >= 90) return 'rgba(6,95,70,0.2)';
    if (pct >= 70) return 'rgba(92,67,0,0.25)';
    return 'rgba(127,29,29,0.25)';
  } else {
    if (pct <= 2)  return 'rgba(6,95,70,0.2)';
    if (pct <= 5)  return 'rgba(92,67,0,0.25)';
    return 'rgba(127,29,29,0.25)';
  }
}

function DetailPanel({ r }) {
  const winRate = r.total_bids > 0 ? Math.round((r.won_bids / r.total_bids) * 100) : null;

  const cards = [
    {
      icon: Package,
      label: 'Total Delivered',
      value: r.total_delivered ?? 0,
      sub: null,
      color: 'var(--brand)',
      bg: 'rgba(255,107,53,0.1)',
    },
    {
      icon: Clock,
      label: 'On-Time Delivery',
      value: r.on_time_pct != null ? `${r.on_time_pct}%` : '—',
      sub: r.on_time_pct != null
        ? `${r.on_time_delivered ?? 0} of ${r.total_delivered ?? 0} on time`
        : 'No deliveries recorded',
      color: metricColor(r.on_time_pct),
      bg: metricBg(r.on_time_pct),
    },
    {
      icon: ShieldAlert,
      label: 'NCR Rate',
      value: r.ncr_rate_pct != null ? `${r.ncr_rate_pct}%` : '—',
      sub: `${r.ncr_count ?? 0} non-conformance report${r.ncr_count === 1 ? '' : 's'}`,
      color: metricColor(r.ncr_rate_pct, true),
      bg: metricBg(r.ncr_rate_pct, true),
    },
    {
      icon: Gavel,
      label: 'Bid Win Rate',
      value: winRate != null ? `${winRate}%` : '—',
      sub: `${r.won_bids ?? 0} won of ${r.total_bids ?? 0} submitted`,
      color: '#fbbf24',
      bg: 'rgba(92,67,0,0.2)',
    },
  ];

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, background: 'var(--surface-raised)', borderTop: '1px solid var(--edge)' }}>
        <div className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--caption)' }}>
            Detailed Overview — {r.company_name}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map(c => (
              <div
                key={c.label}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: c.bg, border: `1px solid ${c.color}22` }}
              >
                <div className="flex items-center gap-2">
                  <c.icon size={14} style={{ color: c.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--caption)' }}>{c.label}</span>
                </div>
                <p className="text-2xl font-black leading-none" style={{ color: c.color }}>{c.value}</p>
                {c.sub && <p className="text-[11px]" style={{ color: 'var(--caption)' }}>{c.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function SupplierScorecardPage() {
  const { toast } = useToast();
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(supplierId || null);
  const autoScrollRef = useRef(null);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const { data, error } = await supabaseAdmin.from('supplier_scorecard').select('*');
        if (error) throw error;
        setRows(data || []);
      } catch (err) {
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

  // Auto-scroll to the supplier coming from SupplierManagementPage
  useEffect(() => {
    if (supplierId && autoScrollRef.current) {
      setTimeout(() => autoScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    }
  }, [supplierId, rows]);

  const filtered = rows.filter(r =>
    !search.trim() ||
    r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand)' }}>Performance</p>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3" style={{ color: 'var(--heading)' }}>
              <BarChart2 style={{ color: 'var(--brand)' }} size={28} /> Supplier Scorecard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>
              Track delivery performance, NCR rates and bid activity. Click a row for a detailed breakdown.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--caption)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Good
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Warning
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-2" /> Poor
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--caption)' }} />
          <input
            placeholder="Search by supplier name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--edge)',
              color: 'var(--heading)',
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--caption)' }}>
            <AlertCircle size={36} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No suppliers found.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--edge)', background: 'var(--surface)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="text-xs uppercase" style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--edge)', color: 'var(--caption)' }}>
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
                <tbody style={{ color: 'var(--body)' }}>
                  {filtered.map((r, i) => {
                    const isExpanded = expanded === r.supplier_id;
                    const isTarget = supplierId === r.supplier_id;
                    return (
                      <>
                        <tr
                          key={r.supplier_id}
                          ref={isTarget ? autoScrollRef : null}
                          className="transition-colors cursor-pointer"
                          style={{
                            borderTop: i > 0 ? '1px solid var(--edge)' : undefined,
                            background: isExpanded ? 'var(--surface-raised)' : undefined,
                          }}
                          onClick={() => toggle(r.supplier_id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--heading)' }}>{r.company_name || 'Unknown'}</p>
                                <p className="text-xs" style={{ color: 'var(--caption)' }}>{r.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold" style={{ color: 'var(--heading)' }}>{r.total_delivered ?? 0}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {r.on_time_pct != null ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${pctBg(r.on_time_pct)} ${pctColor(r.on_time_pct)}`}>
                                {r.on_time_pct}%
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--caption)' }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold" style={{ color: 'var(--body)' }}>{r.ncr_count ?? 0}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {r.ncr_rate_pct != null ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${pctBg(r.ncr_rate_pct, true)} ${pctColor(r.ncr_rate_pct, true)}`}>
                                {r.ncr_rate_pct}%
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--caption)' }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Trophy size={12} className="text-amber-500" />
                              <span className="font-bold text-amber-400">{r.won_bids ?? 0}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span style={{ color: 'var(--caption)' }}>{r.total_bids ?? 0}</span>
                              {isExpanded
                                ? <ChevronUp size={13} style={{ color: 'var(--caption)' }} />
                                : <ChevronDown size={13} style={{ color: 'var(--caption)' }} />}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && <DetailPanel key={`detail-${r.supplier_id}`} r={r} />}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
