import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchTemplates, saveRFQTemplate, deleteTemplate } from '@/services/rfqService';
import { format } from 'date-fns';
import {
  FileStack, Plus, Trash2, Search, Copy, Eye,
  ChevronDown, ChevronUp, X, Loader2,
} from 'lucide-react';

export default function RFQTemplatesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', material: '', quantity: '', tolerance: '', surface_finish: '', special_requirements: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (currentUser) loadTemplates(); }, [currentUser]);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await fetchTemplates(currentUser.id);
    if (data) setTemplates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Template name is required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { name, description, ...templateFields } = form;
      const { error } = await saveRFQTemplate({
        name: name.trim(),
        description: description.trim(),
        templateData: templateFields,
        createdBy: currentUser.id,
      });
      if (error) throw error;
      toast({ title: 'Template Saved', description: `"${name}" saved successfully.` });
      setForm({ name: '', description: '', material: '', quantity: '', tolerance: '', surface_finish: '', special_requirements: '' });
      setShowCreate(false);
      loadTemplates();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await deleteTemplate(id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Template removed.' });
      loadTemplates();
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ControlCentreLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">RFQ Enhancement</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">RFQ Templates</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Save and reuse templates for common order types.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors active:scale-95 self-start sm:self-auto">
            {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Template</>}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white dark:bg-[#18181b] border border-orange-200 dark:border-orange-900/40 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Create New Template</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Template Name *</label>
                <Input value={form.name} onChange={set('name')} placeholder="e.g. Standard CNC Aluminium Part"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Description</label>
                <Input value={form.description} onChange={set('description')} placeholder="Brief description of this template"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Material</label>
                <Input value={form.material} onChange={set('material')} placeholder="e.g. Aluminum 6061"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Quantity</label>
                <Input type="number" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 100"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Tolerance</label>
                <Input value={form.tolerance} onChange={set('tolerance')} placeholder="e.g. ±0.05mm"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Surface Finish</label>
                <Input value={form.surface_finish} onChange={set('surface_finish')} placeholder="e.g. Anodized"
                  className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 block">Special Requirements</label>
                <textarea value={form.special_requirements} onChange={set('special_requirements')} rows={2} placeholder="Any special requirements…"
                  className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-orange-600 hover:bg-orange-500 text-white">
                {saving ? 'Saving…' : 'Save Template'}
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input placeholder="Search templates…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading templates…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileStack className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No templates found.</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Create a template to speed up RFQ creation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                    <FileStack size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{t.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">{format(new Date(t.created_at), 'dd MMM yyyy')}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232329] text-gray-400">
                      {expandedId === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expandedId === t.id && t.template_data && (
                  <div className="border-t border-gray-100 dark:border-[#232329] p-4 bg-gray-50/50 dark:bg-[#131316]">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(t.template_data).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                          <p className="text-gray-800 dark:text-slate-200">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
