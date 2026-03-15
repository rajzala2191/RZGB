import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchAllWorkspaces, createWorkspace, updateWorkspaceStatus,
  fetchWorkspaceStats,
} from '@/services/workspaceService';
import { upgradeWorkspacePlan } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_ORDER, PLAN_LABELS } from '@/lib/planLimits';
import { format } from 'date-fns';
import {
  Building2, Plus, X, Search, Users, ShoppingCart, FileText,
  Receipt, Pause, Play, Archive, ChevronDown, ChevronUp, Loader2, Zap,
} from 'lucide-react';

const PLAN_BADGE_STYLE = {
  free:       'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600',
  starter:    'bg-orange-50 dark:bg-orange-950/30 text-orange-600 border-orange-200 dark:border-orange-800',
  growth:     'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200 dark:border-blue-800',
  enterprise: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-200 dark:border-purple-800',
};

export default function PlatformWorkspacesPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [upgradingId, setUpgradingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [wsStats, setWsStats] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchAllWorkspaces();
    if (data) setWorkspaces(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { error } = await createWorkspace({ name: newName.trim() });
      if (error) throw error;
      toast({ title: 'Workspace Created', description: `"${newName}" is now active.` });
      setNewName('');
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (ws, status) => {
    try {
      const { error } = await updateWorkspaceStatus(ws.id, status);
      if (error) throw error;
      toast({ title: 'Updated', description: `${ws.name} → ${status}` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpgradePlan = async (ws, plan) => {
    setUpgradingId(ws.id);
    try {
      const { error } = await upgradeWorkspacePlan({
        workspaceId: ws.id,
        plan,
        changedBy: currentUser?.id,
        note: `Manual upgrade by platform admin`,
      });
      if (error) throw error;
      toast({ title: 'Plan Updated', description: `${ws.name} → ${PLAN_LABELS[plan]}` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpgradingId(null);
    }
  };

  const handleExpand = async (wsId) => {
    if (expandedId === wsId) { setExpandedId(null); return; }
    setExpandedId(wsId);
    if (!wsStats[wsId]) {
      const stats = await fetchWorkspaceStats(wsId);
      setWsStats(prev => ({ ...prev, [wsId]: stats }));
    }
  };

  const filtered = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusStyles = {
    active:    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600',
    suspended: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600',
    archived:  'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Workspaces</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage customer workspaces and tenant lifecycle.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors active:scale-95 self-start sm:self-auto">
            {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Workspace</>}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white dark:bg-[#18181b] border border-red-200 dark:border-red-900/40 rounded-xl p-5 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Company / Workspace Name</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Acme Manufacturing"
                className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-red-600 hover:bg-red-500 text-white">
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        )}

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search workspaces…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors" />
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-red-500" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">No workspaces found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ws => {
              const stats = wsStats[ws.id];
              return (
                <div key={ws.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{ws.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusStyles[ws.status]}`}>{ws.status.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE_STYLE[ws.plan ?? 'free']}`}>
                          {PLAN_LABELS[ws.plan ?? 'free']}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{ws.slug} | Created {format(new Date(ws.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ws.status === 'active' && (
                        <button onClick={() => handleStatusChange(ws, 'suspended')} className="p-2 rounded-lg border border-gray-200 dark:border-[#232329] text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30" title="Suspend">
                          <Pause size={14} />
                        </button>
                      )}
                      {ws.status === 'suspended' && (
                        <button onClick={() => handleStatusChange(ws, 'active')} className="p-2 rounded-lg border border-gray-200 dark:border-[#232329] text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" title="Activate">
                          <Play size={14} />
                        </button>
                      )}
                      {ws.status !== 'archived' && (
                        <button onClick={() => handleStatusChange(ws, 'archived')} className="p-2 rounded-lg border border-gray-200 dark:border-[#232329] text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" title="Archive">
                          <Archive size={14} />
                        </button>
                      )}
                      <button onClick={() => handleExpand(ws.id)} className="text-gray-400 hover:text-gray-600">
                        {expandedId === ws.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                  {expandedId === ws.id && (
                    <div className="border-t border-gray-100 dark:border-[#232329] p-4 bg-gray-50/50 dark:bg-[#131316] space-y-4">
                      {stats ? (
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Users', value: stats.users, icon: Users },
                            { label: 'Orders', value: stats.orders, icon: ShoppingCart },
                            { label: 'POs', value: stats.purchaseOrders, icon: FileText },
                            { label: 'Invoices', value: stats.invoices, icon: Receipt },
                          ].map((s, i) => (
                            <div key={i} className="text-center p-3 rounded-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329]">
                              <s.icon size={14} className="mx-auto mb-1 text-gray-400" />
                              <p className="text-lg font-black text-gray-900 dark:text-slate-100">{s.value}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Loading stats…</p>
                      )}
                      {/* Plan upgrade controls */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                          <Zap size={12} /> Change Plan:
                        </div>
                        {PLAN_ORDER.map(p => (
                          <button
                            key={p}
                            disabled={ws.plan === p || upgradingId === ws.id}
                            onClick={() => handleUpgradePlan(ws, p)}
                            className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all disabled:opacity-40 disabled:cursor-default ${
                              ws.plan === p
                                ? PLAN_BADGE_STYLE[p] + ' cursor-default'
                                : 'bg-white dark:bg-[#18181b] border-gray-200 dark:border-[#232329] text-gray-600 dark:text-slate-300 hover:border-red-400 hover:text-red-500'
                            }`}
                          >
                            {upgradingId === ws.id && ws.plan !== p ? '…' : PLAN_LABELS[p]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
