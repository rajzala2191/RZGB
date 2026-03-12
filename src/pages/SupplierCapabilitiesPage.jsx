import { useState, useEffect } from 'react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, CheckCircle2, Loader2, Save } from 'lucide-react';

const PROCESSES = [
  'CNC Machining', 'Casting', 'Forging', 'Welding', 'Sheet Metal',
  'Injection Moulding', 'Heat Treatment', 'Surface Finishing', '3D Printing',
];
const MATERIALS = [
  'Aluminium', 'Stainless Steel', 'Mild Steel', 'Titanium', 'Brass',
  'Copper', 'Inconel', 'Plastics', 'Composites',
];
const CERTIFICATIONS = [
  'ISO 9001', 'AS9100', 'IATF 16949', 'ISO 14001', 'NADCAP', 'CE Marking',
];

function TagToggle({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
        selected
          ? 'bg-orange-600 border-orange-600 text-white'
          : 'bg-transparent border-slate-700 text-slate-400 hover:border-orange-500 hover:text-orange-400'
      }`}
    >
      {selected && <CheckCircle2 size={12} />}
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{children}</p>
  );
}

export default function SupplierCapabilitiesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processes, setProcesses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [minOrderQty, setMinOrderQty] = useState('');
  const [maxOrderQty, setMaxOrderQty] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchCaps = async () => {
      const { data } = await supabase
        .from('supplier_capabilities')
        .select('*')
        .eq('supplier_id', currentUser.id)
        .maybeSingle();
      if (data) {
        setProcesses(data.processes || []);
        setMaterials(data.materials || []);
        setCertifications(data.certifications || []);
        setMinOrderQty(data.min_order_qty != null ? String(data.min_order_qty) : '');
        setMaxOrderQty(data.max_order_qty != null ? String(data.max_order_qty) : '');
        setLeadTimeDays(data.lead_time_days != null ? String(data.lead_time_days) : '');
        setCountry(data.country || '');
        setRegion(data.region || '');
      }
      setLoading(false);
    };
    fetchCaps();
  }, [currentUser]);

  const toggle = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('supplier_capabilities').upsert({
        supplier_id:    currentUser.id,
        processes,
        materials,
        certifications,
        min_order_qty:  minOrderQty ? parseInt(minOrderQty, 10) : null,
        max_order_qty:  maxOrderQty ? parseInt(maxOrderQty, 10) : null,
        lead_time_days: leadTimeDays ? parseInt(leadTimeDays, 10) : null,
        country:        country || null,
        region:         region || null,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'supplier_id' });
      if (error) throw error;
      toast({ title: 'Capabilities Saved', description: 'Your capability profile has been updated.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SupplierHubLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </SupplierHubLayout>
    );
  }

  return (
    <SupplierHubLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Supplier Hub</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench className="text-orange-500" size={24} /> My Capabilities
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Declare your manufacturing capabilities so admins can match you to relevant orders.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold shrink-0"
          >
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Save
          </Button>
        </div>

        {/* Processes */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#232329] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Manufacturing Processes</h2>
          </div>
          <SectionLabel>Select all that apply</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {PROCESSES.map(p => (
              <TagToggle key={p} label={p} selected={processes.includes(p)} onToggle={() => toggle(processes, setProcesses, p)} />
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#232329] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Materials</h2>
          </div>
          <SectionLabel>Select all that apply</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {MATERIALS.map(m => (
              <TagToggle key={m} label={m} selected={materials.includes(m)} onToggle={() => toggle(materials, setMaterials, m)} />
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#232329] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Certifications</h2>
          </div>
          <SectionLabel>Select all held certifications</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATIONS.map(c => (
              <TagToggle key={c} label={c} selected={certifications.includes(c)} onToggle={() => toggle(certifications, setCertifications, c)} />
            ))}
          </div>
        </div>

        {/* Capacity & Location */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#232329] rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Capacity & Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Min Order Qty</label>
              <Input
                type="number" min="1" value={minOrderQty}
                onChange={e => setMinOrderQty(e.target.value)}
                className="bg-slate-50 dark:bg-[#13131f] border-slate-200 dark:border-[#232329] text-slate-900 dark:text-slate-100"
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Max Order Qty</label>
              <Input
                type="number" min="1" value={maxOrderQty}
                onChange={e => setMaxOrderQty(e.target.value)}
                className="bg-slate-50 dark:bg-[#13131f] border-slate-200 dark:border-[#232329] text-slate-900 dark:text-slate-100"
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Lead Time (days)</label>
              <Input
                type="number" min="1" value={leadTimeDays}
                onChange={e => setLeadTimeDays(e.target.value)}
                className="bg-slate-50 dark:bg-[#13131f] border-slate-200 dark:border-[#232329] text-slate-900 dark:text-slate-100"
                placeholder="e.g. 14"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Country</label>
              <Input
                value={country} onChange={e => setCountry(e.target.value)}
                className="bg-slate-50 dark:bg-[#13131f] border-slate-200 dark:border-[#232329] text-slate-900 dark:text-slate-100"
                placeholder="e.g. United Kingdom"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Region</label>
              <Input
                value={region} onChange={e => setRegion(e.target.value)}
                className="bg-slate-50 dark:bg-[#13131f] border-slate-200 dark:border-[#232329] text-slate-900 dark:text-slate-100"
                placeholder="e.g. West Midlands"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8"
          >
            {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
            Save Capabilities
          </Button>
        </div>
      </div>
    </SupplierHubLayout>
  );
}
