import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchWorkflows, createWorkflow, deleteWorkflow, fetchApprovalRequests, makeDecision } from '@/services/approvalService';
import { createNotification } from '@/lib/createNotification';
import { format } from 'date-fns';
import {
  GitBranch, Plus, X, Trash2, Search, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Clock, AlertCircle, Users,
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'purchase_order', label: 'Purchase Orders' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'rfq', label: 'RFQs' },
  { value: 'contract', label: 'Contracts' },
  { value: 'requisition', label: 'Requisitions' },
];

export default function ApprovalWorkflowsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', entityType: 'purchase_order' });
  const [steps, setSteps] = useState([{ approverRole: 'admin', thresholdAmount: '', escalationHours: 48 }]);
  const [requestFilter, setRequestFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [wfRes, reqRes] = await Promise.all([fetchWorkflows(), fetchApprovalRequests('all')]);
    if (wfRes.data) setWorkflows(wfRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Workflow name is required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      await createWorkflow({ name: form.name, entityType: form.entityType, steps, createdBy: currentUser.id });
      toast({ title: 'Workflow Created', description: `"${form.name}" is now active.` });
      setShowCreate(false);
      setForm({ name: '', entityType: 'purchase_order' });
      setSteps([{ approverRole: 'admin', thresholdAmount: '', escalationHours: 48 }]);
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDecision = async (req, decision) => {
    try {
      await makeDecision({ requestId: req.id, stepOrder: req.current_step, decidedBy: currentUser.id, decision });
      toast({ title: decision === 'approved' ? 'Approved' : 'Rejected', description: `Request updated.` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredRequests = requests.filter(r => requestFilter === 'all' || r.status === requestFilter);

  const statusStyles = {
    pending:    'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600',
    in_progress:'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600',
    approved:   'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600',
    rejected:   'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500',
  };

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Governance</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Approval Workflows</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Configure approval chains and review pending requests.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {['workflows', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t ? 'bg-orange-600 text-white' : 'bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-gray-600 dark:text-slate-400 hover:border-orange-300'}`}>
              {t === 'workflows' ? `Workflows (${workflows.length})` : `Requests (${requests.length})`}
            </button>
          ))}
        </div>

        {tab === 'workflows' ? (
          <>
            <div className="flex justify-end">
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors active:scale-95">
                {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Workflow</>}
              </button>
            </div>

            {showCreate && (
              <div className="bg-white dark:bg-[#18181b] border border-orange-200 dark:border-orange-900/40 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Create Approval Workflow</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Name *</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PO Approval Chain"
                      className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Entity Type</label>
                    <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
                      {ENTITY_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Approval Steps</label>
                    <button onClick={() => setSteps(s => [...s, { approverRole: 'admin', thresholdAmount: '', escalationHours: 48 }])}
                      className="text-xs text-orange-500 font-bold flex items-center gap-1"><Plus size={12} /> Add Step</button>
                  </div>
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <span className="text-xs font-bold text-gray-400 w-6 text-center">{idx + 1}</span>
                      <select value={step.approverRole} onChange={e => setSteps(s => s.map((st, i) => i === idx ? { ...st, approverRole: e.target.value } : st))}
                        className="h-9 px-2 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100">
                        <option value="admin">Admin</option>
                        <option value="client">Client</option>
                        <option value="director">Director</option>
                      </select>
                      <Input type="number" value={step.thresholdAmount} onChange={e => setSteps(s => s.map((st, i) => i === idx ? { ...st, thresholdAmount: e.target.value } : st))}
                        placeholder="Threshold £" className="w-32 text-sm bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
                      <Input type="number" value={step.escalationHours} onChange={e => setSteps(s => s.map((st, i) => i === idx ? { ...st, escalationHours: parseInt(e.target.value) || 48 } : st))}
                        placeholder="Escalation hrs" className="w-28 text-sm bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
                      <button onClick={() => setSteps(s => s.filter((_, i) => i !== idx))} disabled={steps.length === 1} className="text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreate} disabled={creating} className="bg-orange-600 hover:bg-orange-500 text-white">
                    {creating ? 'Creating…' : 'Create Workflow'}
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
            ) : workflows.length === 0 ? (
              <div className="py-20 text-center">
                <GitBranch className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-gray-500">No workflows configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map(wf => (
                  <div key={wf.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                        <GitBranch size={14} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{wf.name}</p>
                        <p className="text-xs text-gray-500">{ENTITY_TYPES.find(e => e.value === wf.entity_type)?.label} • {wf.steps?.length || 0} steps</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)} className="text-gray-400">
                          {expandedId === wf.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={async () => { await deleteWorkflow(wf.id); loadData(); }} className="text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {expandedId === wf.id && wf.steps?.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-[#232329] p-4 bg-gray-50/50 dark:bg-[#131316]">
                        <p className="text-xs font-bold text-gray-500 mb-2">Steps</p>
                        <div className="space-y-2">
                          {wf.steps.sort((a, b) => a.step_order - b.step_order).map(step => (
                            <div key={step.id} className="flex items-center gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-xs font-bold text-orange-600">{step.step_order}</span>
                              <span className="font-semibold text-gray-700 dark:text-slate-300 capitalize">{step.approver_role}</span>
                              {step.threshold_amount && <span className="text-xs text-gray-400">≥ £{Number(step.threshold_amount).toLocaleString()}</span>}
                              <span className="text-xs text-gray-400">Escalate: {step.escalation_hours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button key={f} onClick={() => setRequestFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${requestFilter === f ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 border border-orange-200 dark:border-orange-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="py-20 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-gray-500">No approval requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(req => (
                  <div key={req.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{req.workflow?.name || 'Workflow'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusStyles[req.status] || statusStyles.pending}`}>{req.status.toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Step {req.current_step} • {req.entity_type} • {format(new Date(req.created_at), 'dd MMM yyyy')}
                        {req.requester && ` • by ${req.requester.company_name || req.requester.email}`}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleDecision(req, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"><CheckCircle2 size={14} className="mr-1" /> Approve</Button>
                        <Button onClick={() => handleDecision(req, 'rejected')} variant="outline" className="border-red-300 text-red-500 text-xs"><XCircle size={14} className="mr-1" /> Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ControlCentreLayout>
  );
}
