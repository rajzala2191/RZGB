import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import {
  fetchAllContracts, fetchContractsExpiringSoon, createContract,
  transitionContractStatus, renewContract,
} from '@/services/contractService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { format, differenceInDays } from 'date-fns';
import {
  FileSignature, Plus, Search, AlertTriangle, CheckCircle2,
  XCircle, Clock, RefreshCw, ChevronDown, ChevronUp, X,
} from 'lucide-react';

const CONTRACT_TYPES = [
  { value: 'supply_agreement', label: 'Supply Agreement' },
  { value: 'nda', label: 'NDA' },
  { value: 'sla', label: 'SLA' },
  { value: 'framework', label: 'Framework Agreement' },
  { value: 'other', label: 'Other' },
];

const STATUS_META = {
  draft:      { label: 'Draft',      cls: 'bg-slate-100 text-slate-600' },
  active:     { label: 'Active',     cls: 'bg-emerald-100 text-emerald-700' },
  expired:    { label: 'Expired',    cls: 'bg-amber-100 text-amber-700' },
  terminated: { label: 'Terminated', cls: 'bg-red-100 text-red-700' },
  renewed:    { label: 'Renewed',    cls: 'bg-blue-100 text-blue-700' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

const EMPTY_FORM = {
  title: '', description: '', contractType: 'supply_agreement', supplierId: '',
  totalValue: '', currency: 'GBP', startDate: '', endDate: '',
  renewalNoticeDays: 30, autoRenew: false, notes: '',
};

export default function ContractManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState('contracts');
  const [contracts, setContracts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: e }, { data: s }] = await Promise.all([
      fetchAllContracts(),
      fetchContractsExpiringSoon(60),
      supabaseAdmin.from('profiles').select('id, company_name').eq('role', 'supplier').order('company_name'),
    ]);
    if (c) setContracts(c);
    if (e) setExpiring(e);
    if (s) setSuppliers(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contracts.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supplier?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await createContract({ ...form, createdBy: currentUser.id });
      toast({ title: 'Contract created', description: form.title });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast({ title: 'Failed to create contract', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleTransition = async (contractId, toStatus) => {
    const labels = { active: 'Activated', terminated: 'Terminated', expired: 'Marked expired' };
    try {
      await transitionContractStatus(contractId, toStatus, currentUser.id);
      toast({ title: `${labels[toStatus] || toStatus} successfully` });
      load();
    } catch (err) {
      toast({ title: 'Transition failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleRenew = async (contractId) => {
    try {
      const { data: newC } = await renewContract(contractId, { performedBy: currentUser.id });
      toast({ title: 'Contract renewed', description: `New draft: ${newC.contract_number}` });
      load();
    } catch (err) {
      toast({ title: 'Renewal failed', description: err.message, variant: 'destructive' });
    }
  };

  const daysUntil = (dateStr) => differenceInDays(new Date(dateStr), new Date());

  return (
    <ControlCentreLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-[#FF6B35]" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Contract Management</h1>
              <p className="text-sm text-slate-500">{contracts.length} contracts · {expiring.length} expiring within 60 days</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#FF6B35] hover:bg-[#e55a24] text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Contract
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {[
            { key: 'contracts', label: 'All Contracts' },
            { key: 'renewal', label: `Renewal Alerts${expiring.length ? ` (${expiring.length})` : ''}` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Contracts tab ─────────────────────────────────────────────────── */}
        {tab === 'contracts' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by title, number or supplier…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-16 text-slate-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No contracts found.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map(c => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Row */}
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 truncate">{c.title}</span>
                          <span className="text-xs text-slate-400 font-mono">{c.contract_number}</span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 flex gap-4 flex-wrap">
                          {c.supplier?.company_name && <span>{c.supplier.company_name}</span>}
                          {c.total_value && <span>{Number(c.total_value).toLocaleString()} {c.currency}</span>}
                          {c.end_date && <span>Expires {format(new Date(c.end_date), 'dd MMM yyyy')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Action buttons */}
                        {c.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleTransition(c.id, 'active'); }}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
                          </Button>
                        )}
                        {c.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleTransition(c.id, 'terminated'); }}
                              className="text-red-600 border-red-200 hover:bg-red-50">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Terminate
                            </Button>
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleRenew(c.id); }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Renew
                            </Button>
                          </>
                        )}
                        {c.status === 'expired' && (
                          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleRenew(c.id); }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Renew
                          </Button>
                        )}
                        {expandedId === c.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedId === c.id && (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><span className="text-slate-400">Type</span><p className="font-medium text-slate-700 capitalize">{c.contract_type.replace('_', ' ')}</p></div>
                          <div><span className="text-slate-400">Start</span><p className="font-medium text-slate-700">{c.start_date ? format(new Date(c.start_date), 'dd MMM yyyy') : '—'}</p></div>
                          <div><span className="text-slate-400">End</span><p className="font-medium text-slate-700">{c.end_date ? format(new Date(c.end_date), 'dd MMM yyyy') : '—'}</p></div>
                          <div><span className="text-slate-400">Notice period</span><p className="font-medium text-slate-700">{c.renewal_notice_days} days</p></div>
                          <div><span className="text-slate-400">Auto-renew</span><p className="font-medium text-slate-700">{c.auto_renew ? 'Yes' : 'No'}</p></div>
                          <div><span className="text-slate-400">Signed</span><p className="font-medium text-slate-700">{c.signed_at ? format(new Date(c.signed_at), 'dd MMM yyyy') : '—'}</p></div>
                          {c.order && <div><span className="text-slate-400">Linked order</span><p className="font-medium text-slate-700">{c.order.rz_job_id || c.order.id}</p></div>}
                        </div>
                        {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
                        {Array.isArray(c.terms) && c.terms.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Clauses</p>
                            <div className="space-y-2">
                              {c.terms.map((term, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3">
                                  {term.title && <p className="text-xs font-semibold text-slate-700 mb-1">{term.title}</p>}
                                  <p className="text-sm text-slate-600">{term.content || term}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.notes && <p className="text-sm text-slate-500 italic">{c.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Renewal Alerts tab ────────────────────────────────────────────── */}
        {tab === 'renewal' && (
          <div className="space-y-3">
            {expiring.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No contracts expiring within 60 days.</div>
            ) : expiring.map(c => {
              const days = daysUntil(c.end_date);
              const urgency = days <= 14 ? 'text-red-600 bg-red-50 border-red-200'
                : days <= 30 ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-slate-600 bg-slate-50 border-slate-200';
              return (
                <div key={c.id} className={`border rounded-xl p-4 flex items-center gap-4 ${urgency}`}>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.title} <span className="font-normal text-sm opacity-70">({c.contract_number})</span></p>
                    <p className="text-sm opacity-80">{c.supplier?.company_name} · Expires {format(new Date(c.end_date), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold">{days}d remaining</span>
                    <Button size="sm" variant="outline" onClick={() => handleRenew(c.id)}
                      className="border-current hover:bg-white/50">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Renew
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Contract Modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">New Contract</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Machining Supply Agreement" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Type</label>
                  <select
                    value={form.contractType}
                    onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Supplier</label>
                  <select
                    value={form.supplierId}
                    onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">— Select supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Total Value</label>
                  <Input type="number" value={form.totalValue} onChange={e => setForm(f => ({ ...f, totalValue: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {['GBP','USD','EUR','JPY','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Start Date</label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">End Date</label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Renewal Notice (days)</label>
                  <Input type="number" value={form.renewalNoticeDays} onChange={e => setForm(f => ({ ...f, renewalNoticeDays: parseInt(e.target.value) || 30 }))} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))} className="w-4 h-4 accent-[#FF6B35]" />
                    <span className="text-sm font-medium text-slate-700">Auto-renew</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Optional description…"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Internal notes…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-[#FF6B35] hover:bg-[#e55a24] text-white">
                {saving ? 'Creating…' : 'Create Contract'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ControlCentreLayout>
  );
}
