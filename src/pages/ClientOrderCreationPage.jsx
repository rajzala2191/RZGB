import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormSection, FormField,
  SelectField, TextareaField,
} from '@/components/ui/FormSection';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import ThreeDModelViewer from '@/components/ThreeDModelViewer';
import {
  ClipboardList, Wrench, UploadCloud, Eye,
  CheckCircle2, AlertCircle, X, Loader2,
  Box, MapPin, ChevronRight, ChevronLeft,
  FileText, ArrowRight, Cog,
} from 'lucide-react';
import {
  createOrder,
  createOrderDocumentRecord,
  fetchActiveManufacturingProcesses,
  fetchProcessTemplates,
  generateOrderStepProgress,
  uploadDocumentToStorage,
} from '@/services/orderService';

// ─── Constants ────────────────────────────────────────────────────────────────
const FORBIDDEN = ['confidential', 'internal', 'secret', 'proprietary'];
const MODEL_EXT = ['.stl', '.obj', '.gltf', '.glb', '.x_t'];

const STEPS = [
  { n: 1, label: 'Order Details',            icon: ClipboardList },
  { n: 2, label: 'Specifications',            icon: Wrench },
  { n: 3, label: 'Manufacturing Processes',   icon: Cog },
  { n: 4, label: 'Files & Models',            icon: UploadCloud },
  { n: 5, label: 'Review',                    icon: Eye },
];

const MATERIALS = [
  'Aluminum 6061', 'Stainless Steel 304', 'Titanium',
  'Brass', 'Copper', 'ABS Plastic', 'Nylon (PA12)', 'PEEK', 'Other',
];
const FINISHES = [
  'As Machined', 'Bead Blast', 'Anodized (Clear)',
  'Anodized (Color)', 'Powder Coat', 'Electropolished', 'Passivated',
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        const Icon   = s.icon;
        return (
          <div key={s.n} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${done   ? 'bg-orange-600 border-orange-600 text-white'
                : active ? 'bg-[#0f172a] border-orange-500 text-orange-400'
                :          'bg-[#0f172a] border-slate-700 text-slate-600'}`}>
                {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs font-bold hidden sm:block whitespace-nowrap
                ${active ? 'text-orange-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mt-[-14px] ${done ? 'bg-orange-600' : 'bg-slate-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Navigation row ───────────────────────────────────────────────────────────
function StepNav({ step, onBack, onNext, onSubmit, loading, canSubmit }) {
  const last = step === STEPS.length;
  return (
    <div className="flex gap-3 pt-6 border-t border-slate-800 mt-6">
      {step > 1 && (
        <Button type="button" variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>
      )}
      <div className="flex-1" />
      {last ? (
        <Button type="button" onClick={onSubmit} disabled={loading || !canSubmit}
          className="bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-bold px-8 shadow-sm hover:shadow transition-all">
          {loading
            ? <><Loader2 size={16} className="animate-spin mr-2" /> Submitting…</>
            : <><CheckCircle2 size={16} className="mr-2" /> Submit Order</>}
        </Button>
      ) : (
        <Button type="button" onClick={onNext}
          className="bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-bold px-8 shadow-sm hover:shadow transition-all">
          Continue <ChevronRight size={16} className="ml-1" />
        </Button>
      )}
    </div>
  );
}

// ─── File row ─────────────────────────────────────────────────────────────────
function FileRow({ name, size, onRemove, active, onClick, icon: Icon, iconClass }) {
  return (
    <div onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${active ? 'bg-orange-900/20 border-orange-600' : 'bg-[#1e293b] border-slate-700 hover:border-slate-600'}`}>
      <div className="flex items-center gap-3 text-sm text-slate-200 min-w-0">
        <Icon size={18} className={iconClass || 'text-slate-400'} />
        <span className="truncate">{name}</span>
        <span className="text-slate-500 shrink-0">{(size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
        className="ml-3 text-slate-500 hover:text-red-400 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ onDrop, inputId, accept, icon: Icon, title, subtitle }) {
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={onDrop}
      onClick={() => document.getElementById(inputId).click()}
      className="border-2 border-dashed border-slate-700 rounded-xl py-10 text-center
        hover:bg-[#1e293b] hover:border-orange-500 transition-colors cursor-pointer">
      <Icon className="mx-auto h-10 w-10 text-orange-500 mb-3" />
      <p className="text-slate-200 font-bold text-sm mb-1">{title}</p>
      <p className="text-slate-500 text-xs">{subtitle}</p>
      <input id={inputId} type="file" multiple {...(accept && accept !== '*' ? { accept } : {})} className="hidden" onChange={onDrop} />
    </div>
  );
}

// ─── Review summary row ───────────────────────────────────────────────────────
function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 text-right">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ClientOrderCreationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state — every key maps to an orders table column
  const [form, setForm] = useState({
    part_name:            '',   // orders.part_name            TEXT NOT NULL
    description:          '',   // orders.description           TEXT
    material:             '',   // orders.material              TEXT
    quantity:             '',   // orders.quantity              INTEGER
    tolerance:            '',   // orders.tolerance             TEXT
    surface_finish:       '',   // orders.surface_finish        TEXT
    special_requirements: '',   // orders.special_requirements  TEXT
    buy_price:            '',   // orders.buy_price              NUMERIC (GBP per part)
    delivery_location:    '',   // orders.delivery_location     TEXT
  });

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  // Manufacturing process selection
  const [availableProcesses, setAvailableProcesses] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [processTemplates, setProcessTemplates] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchActiveManufacturingProcesses(),
      fetchProcessTemplates(),
    ]).then(([{ data: procs }, { data: tpls }]) => {
      if (procs) {
        setAvailableProcesses(procs);
        const defaultTpl = (tpls || []).find(t => t.is_default);
        setSelectedProcesses(defaultTpl ? defaultTpl.process_keys : procs.map(p => p.status_key));
      }
      if (tpls) setProcessTemplates(tpls);
    });
  }, []);

  const toggleProcess = (statusKey) => {
    setSelectedProcesses(prev =>
      prev.includes(statusKey) ? prev.filter(k => k !== statusKey) : [...prev, statusKey]
    );
  };

  // File state — each file becomes a documents table row
  const [drawingFiles, setDrawingFiles] = useState([]); // file_type = 'client_drawing'
  const [modelFiles,   setModelFiles]   = useState([]); // file_type = '3d_model'
  const [previewModel, setPreviewModel] = useState(null);

  // ── Step validation ─────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.part_name.trim()) {
      toast({ title: 'Required', description: 'Part name is required.', variant: 'destructive' });
      return false;
    }
    if (!form.material) {
      toast({ title: 'Required', description: 'Please select a material.', variant: 'destructive' });
      return false;
    }
    if (!form.quantity || parseInt(form.quantity) < 1) {
      toast({ title: 'Required', description: 'Quantity must be at least 1.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (selectedProcesses.length === 0) {
      toast({ title: 'Required', description: 'Select at least one manufacturing process.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => Math.min(s + 1, STEPS.length));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // ── File handlers ───────────────────────────────────────────────────────────
  const handleFileDrop = e => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || e.target.files);
    const drawings = [];
    const models = [];
    dropped.forEach(f => {
      const nameLow = f.name.toLowerCase();
      if (FORBIDDEN.some(w => nameLow.includes(w))) {
        toast({ title: 'Rejected', description: `"${f.name}" contains a forbidden keyword.`, variant: 'destructive' });
        return;
      }
      if (MODEL_EXT.some(ext => nameLow.endsWith(ext))) {
        models.push(f);
      } else {
        drawings.push(f);
      }
    });
    if (drawings.length) setDrawingFiles(prev => [...prev, ...drawings]);
    if (models.length) {
      setModelFiles(prev => [...prev, ...models]);
      setPreviewModel(models[models.length - 1]);
    }
  };

  const removeDrawing = i => setDrawingFiles(prev => prev.filter((_, j) => j !== i));
  const removeModel = i => {
    const upd = modelFiles.filter((_, j) => j !== i);
    setModelFiles(upd);
    if (previewModel === modelFiles[i]) setPreviewModel(upd[upd.length - 1] || null);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep1()) { setStep(1); return; }
    setLoading(true);
    try {
      // 1. Insert order row
      const { data: order, error } = await createOrder({
        client_id:            currentUser.id,
        user_id:              currentUser.id,              // legacy alias
        part_name:            form.part_name.trim(),
        description:          form.description || null,
        material:             form.material,
        quantity:             parseInt(form.quantity, 10),
        tolerance:            form.tolerance || null,
        surface_finish:       form.surface_finish || null,
        special_requirements: form.special_requirements || null,
        buy_price:            form.buy_price ? parseFloat(form.buy_price) : null,
        delivery_location:    form.delivery_location || null,
        order_status:         'PENDING_ADMIN_SCRUB',
        selected_processes:   selectedProcesses.length > 0 ? selectedProcesses : ['MACHINING'],
      });

      if (error) throw error;

      // Auto-generate order_step_progress rows for selected processes
      const selectedProcessObjects = availableProcesses.filter(p => selectedProcesses.includes(p.status_key));
      await generateOrderStepProgress(order.id, selectedProcessObjects);

      // 2. Upload technical drawings → documents.file_type = 'client_drawing'
      for (const file of drawingFiles) {
        const path = `${currentUser.id}/${order.id}/${file.name}`;
        const { error: upErr } = await uploadDocumentToStorage({ path, file });
        if (upErr) { toast({ title: 'Upload Warning', description: `${file.name}: ${upErr.message}`, variant: 'destructive' }); continue; }
        await createOrderDocumentRecord({
          order_id:    order.id,
          client_id:   currentUser.id,
          uploaded_by: currentUser.id,
          file_name:   file.name,
          file_path:   path,
          file_type:   'client_drawing',
          status:      'PENDING_SCRUB',
        });
      }

      // 3. Upload 3D models → documents.file_type = '3d_model'
      for (const file of modelFiles) {
        const path = `${currentUser.id}/${order.id}/models/${file.name}`;
        const { error: upErr } = await uploadDocumentToStorage({ path, file });
        if (upErr) { toast({ title: 'Upload Warning', description: `${file.name}: ${upErr.message}`, variant: 'destructive' }); continue; }
        await createOrderDocumentRecord({
          order_id:    order.id,
          client_id:   currentUser.id,
          uploaded_by: currentUser.id,
          file_name:   file.name,
          file_path:   path,
          file_type:   '3d_model',
          status:      'ACTIVE',
        });
      }

      toast({ title: 'Order Submitted', description: 'Your order is now pending admin review.' });
      navigate(`/client-dashboard/orders/${order.id}/tracking`);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ClientDashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-100 mb-1">Create New Order</h1>
          <p className="text-slate-400 text-sm">Complete each step to submit your manufacturing request.</p>
        </div>

        <StepIndicator current={step} />

        {/* ── STEP 1: Order Details ──────────────────────────────────────────── */}
        {step === 1 && (
          <FormSection title="Order Details" icon={ClipboardList}>
            <div className="space-y-6">
              <FormField label="Part Name" required hint="A clear name for the part or assembly.">
                <Input required value={form.part_name} onChange={set('part_name')}
                  className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                  placeholder="e.g. Aluminium Enclosure V2" />
              </FormField>

              <FormField label="Description" hint="Describe the part, its function, and critical features.">
                <TextareaField value={form.description} onChange={set('description')} rows={4}
                  placeholder="Brief description of the part and its intended application" />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Material" required>
                  <SelectField required value={form.material} onChange={set('material')} placeholder="Select material">
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </SelectField>
                </FormField>

                <FormField label="Quantity" required hint="Total units required.">
                  <Input type="number" min="1" required value={form.quantity} onChange={set('quantity')}
                    className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                    placeholder="e.g. 500" />
                </FormField>
              </div>
            </div>
            <StepNav step={step} onNext={nextStep} />
          </FormSection>
        )}

        {/* ── STEP 2: Specifications ─────────────────────────────────────────── */}
        {step === 2 && (
          <FormSection title="Specifications" icon={Wrench}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Tolerance" hint="e.g. ±0.05 mm · ISO 2768-m">
                  <Input value={form.tolerance} onChange={set('tolerance')}
                    className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                    placeholder="e.g. ±0.05 mm" />
                </FormField>

                <FormField label="Surface Finish">
                  <SelectField value={form.surface_finish} onChange={set('surface_finish')} placeholder="Select finish (optional)">
                    {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                  </SelectField>
                </FormField>

                <FormField label="Target Price per Part (£)" hint="Optional — your target unit price per piece.">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold pointer-events-none">£</span>
                    <Input type="number" min="0" step="0.01" value={form.buy_price} onChange={set('buy_price')}
                      className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500 pl-7"
                      placeholder="0.00" />
                  </div>
                </FormField>

                <FormField label="Delivery Location" hint="City, postcode, or full address.">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <Input value={form.delivery_location} onChange={set('delivery_location')}
                      className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500 pl-8"
                      placeholder="e.g. Manchester, M1 1AE" />
                  </div>
                </FormField>
              </div>

              <FormField label="Special Requirements" hint="Certifications, packaging, marking, inspection level, etc.">
                <TextareaField value={form.special_requirements} onChange={set('special_requirements')} rows={4}
                  placeholder="Any additional notes, packaging requests, or certifications required" />
              </FormField>
            </div>
            <StepNav step={step} onBack={prevStep} onNext={nextStep} />
          </FormSection>
        )}

        {/* ── STEP 3: Manufacturing Processes ───────────────────────────────── */}
        {step === 3 && (
          <FormSection title="Manufacturing Processes" icon={Cog}>
            <p className="text-slate-400 text-sm mb-5">
              Select the manufacturing processes required for your part. Only the stages you choose will appear in your order timeline.
            </p>

            {/* Quick Templates */}
            {processTemplates.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Quick Templates</p>
                <div className="flex flex-wrap gap-2">
                  {processTemplates.map(tpl => {
                    const isActive = JSON.stringify(selectedProcesses) === JSON.stringify(tpl.process_keys);
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedProcesses(tpl.process_keys)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                          isActive
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-transparent border-slate-600 text-slate-400 hover:border-orange-400 hover:text-orange-400'
                        }`}
                      >
                        {tpl.name}
                        {tpl.is_default && !isActive && <span className="ml-1 opacity-60">(default)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {availableProcesses.length === 0 ? (
              <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700 rounded-lg p-4">
                <Loader2 size={16} className="animate-spin text-orange-500 shrink-0" />
                <span className="text-sm text-slate-400">Loading available processes…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProcesses.map(proc => {
                  const selected = selectedProcesses.includes(proc.status_key);
                  return (
                    <button
                      key={proc.status_key}
                      type="button"
                      onClick={() => toggleProcess(proc.status_key)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                        selected
                          ? 'border-orange-500 bg-orange-900/20'
                          : 'border-slate-700 bg-[#1e293b] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'border-orange-500 bg-orange-500' : 'border-slate-600 bg-transparent'
                        }`}>
                          {selected && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${selected ? 'text-orange-300' : 'text-slate-200'}`}>{proc.name}</p>
                          {proc.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{proc.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedProcesses.length === 0 && (
              <div className="flex gap-2 mt-4 bg-red-950/30 border border-red-800/40 rounded-lg p-3">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">Please select at least one process to continue.</p>
              </div>
            )}

            <StepNav step={step} onBack={prevStep} onNext={nextStep} />
          </FormSection>
        )}

        {/* ── STEP 4: Files & Models ─────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <FormSection title="Files & Attachments" icon={UploadCloud}>
              <div className="flex gap-3 bg-[#1e293b] border border-amber-900/40 rounded-lg p-4 mb-5">
                <AlertCircle size={18} className="text-amber-500/80 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500/80 leading-relaxed">
                  Files named with <strong>confidential, internal, secret</strong> or <strong>proprietary</strong> are rejected.
                  All drawings are AI-sanitised before reaching suppliers. 3D models (.stl .obj .gltf .glb .x_t) are auto-detected.
                </p>
              </div>

              <DropZone onDrop={handleFileDrop} inputId="file-upload"
                icon={UploadCloud} title="Drag and drop files here"
                subtitle="PDF · DXF · DWG · STEP · IGES · STL · OBJ · GLTF · GLB · X_T · or any engineering file" />

              {drawingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drawings & Documents ({drawingFiles.length})</p>
                  {drawingFiles.map((f, i) => (
                    <FileRow key={i} name={f.name} size={f.size}
                      onRemove={() => removeDrawing(i)}
                      icon={FileText} iconClass="text-slate-400" />
                  ))}
                </div>
              )}

              {modelFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">3D Models ({modelFiles.length}) — click to preview</p>
                  {modelFiles.map((f, i) => (
                    <FileRow key={i} name={f.name} size={f.size}
                      active={previewModel === f}
                      onClick={() => setPreviewModel(f)}
                      onRemove={() => removeModel(i)}
                      icon={Box} iconClass="text-orange-500" />
                  ))}
                  {previewModel && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preview — {previewModel.name}</p>
                      <ThreeDModelViewer file={previewModel} />
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            <StepNav step={step} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* ── STEP 5: Review & Submit ────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5">
            <FormSection title="Order Summary" icon={Eye}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order Details</p>
                  <SummaryRow label="Part Name"   value={form.part_name} />
                  <SummaryRow label="Description" value={form.description} />
                  <SummaryRow label="Material"    value={form.material} />
                  <SummaryRow label="Quantity"    value={form.quantity} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specifications</p>
                  <SummaryRow label="Tolerance"      value={form.tolerance} />
                  <SummaryRow label="Surface Finish" value={form.surface_finish} />
                  <SummaryRow label="Price per Part"
                    value={form.buy_price ? `£${parseFloat(form.buy_price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : null} />
                  <SummaryRow label="Delivery"       value={form.delivery_location} />
                </div>
                {selectedProcesses.length > 0 && (
                  <div className="col-span-2 pt-3 mt-3 border-t border-slate-800">
                    <SummaryRow label="Manufacturing Processes" value={
                      availableProcesses
                        .filter(p => selectedProcesses.includes(p.status_key))
                        .map(p => p.name).join(' → ')
                    } />
                  </div>
                )}
                {form.special_requirements && (
                  <div className="col-span-2 pt-3 mt-3 border-t border-slate-800">
                    <SummaryRow label="Special Requirements" value={form.special_requirements} />
                  </div>
                )}
              </div>
            </FormSection>

            {(drawingFiles.length > 0 || modelFiles.length > 0) && (
              <FormSection title="Attached Files" icon={UploadCloud}>
                <div className="space-y-1.5">
                  {drawingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300 py-1">
                      <FileText size={14} className="text-slate-500 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-slate-600 text-xs ml-auto shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                  {modelFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300 py-1">
                      <Box size={14} className="text-orange-600 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-slate-600 text-xs ml-auto shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </FormSection>
            )}

            <div className="bg-[#0f172a] border border-orange-900/40 rounded-xl p-4 flex gap-3">
              <ArrowRight size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400 leading-relaxed">
                Once submitted, your order enters <span className="text-orange-400 font-bold">Admin Review</span>.
                Drawings are AI-sanitised before sharing with suppliers.
                You can track progress in real time from your dashboard.
              </p>
            </div>

            <StepNav step={step} onBack={prevStep} onSubmit={handleSubmit} loading={loading}
              canSubmit={!!form.part_name && !!form.material && !!form.quantity && selectedProcesses.length > 0} />
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
