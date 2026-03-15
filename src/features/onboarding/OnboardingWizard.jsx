import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Package, BarChart2, AlertCircle,
  ClipboardList, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { saveOnboardingData, completeOnboarding } from '@/services/workspaceService';

const BRAND = '#FF6B35';

const STEPS = [
  { n: 1, label: 'Company Profile',    icon: Building2 },
  { n: 2, label: 'What You Procure',   icon: Package },
  { n: 3, label: 'Procurement Scale',  icon: BarChart2 },
  { n: 4, label: 'Challenges',         icon: AlertCircle },
  { n: 5, label: 'Review & Submit',    icon: ClipboardList },
];

const INDUSTRIES = [
  'Manufacturing', 'Distribution', 'Retail', 'Construction',
  'Healthcare', 'Technology', 'Energy & Utilities', 'Food & Beverage', 'Other',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

const PROCUREMENT_CATEGORIES = [
  { id: 'raw_materials',  label: 'Raw Materials' },
  { id: 'metals',         label: 'Metal & Alloys' },
  { id: 'electronics',    label: 'Electronics & Components' },
  { id: 'plastics',       label: 'Plastics & Polymers' },
  { id: 'chemicals',      label: 'Chemicals' },
  { id: 'packaging',      label: 'Packaging' },
  { id: 'machinery',      label: 'Machinery & Equipment' },
  { id: 'safety',         label: 'Safety & PPE' },
  { id: 'office',         label: 'Office Supplies' },
  { id: 'logistics',      label: 'Logistics & Freight' },
  { id: 'it',             label: 'IT & Technology' },
  { id: 'other',          label: 'Other' },
];

const SUPPLIER_REGIONS = [
  'Local / Domestic', 'Asia-Pacific', 'Europe', 'North America', 'Middle East', 'Africa', 'Global',
];

const SPEND_RANGES = ['< $50K', '$50K – $200K', '$200K – $1M', '$1M – $5M', '$5M+'];
const ACTIVE_SUPPLIERS = ['1–5', '6–20', '21–50', '51–100', '100+'];
const ORDERS_PER_MONTH = ['1–10', '11–30', '31–100', '100+'];

const PAIN_POINTS = [
  'Supplier discovery',
  'Price transparency',
  'Lead time visibility',
  'Quality control',
  'Invoice disputes',
  'Approval bottlenecks',
  'Compliance & documentation',
  'Manual procurement processes',
  'Poor spend visibility',
  'Fragmented communication',
];

const CURRENT_TOOLS = [
  'Spreadsheets only',
  'Basic ERP (e.g. Sage, QuickBooks)',
  'Dedicated procurement software',
  'None / ad hoc',
];

// ── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {STEPS.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        const Icon   = s.icon;
        return (
          <div key={s.n} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  background: done ? BRAND : active ? 'var(--surface)' : 'var(--surface)',
                  borderColor: done || active ? BRAND : 'var(--edge)',
                  color: done ? '#fff' : active ? BRAND : 'var(--caption)',
                }}
              >
                {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <span
                className="text-xs font-semibold hidden sm:block whitespace-nowrap"
                style={{ color: active ? BRAND : done ? 'var(--body)' : 'var(--caption)' }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mt-[-14px] transition-colors"
                style={{ background: done ? BRAND : 'var(--edge)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--heading)' }}>
      {children}{required && <span style={{ color: BRAND }}> *</span>}
    </label>
  );
}

function inputStyle(isDark) {
  return {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--surface)',
    border: `1px solid var(--edge)`,
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--heading)',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };
}

function SelectOption({ value, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
      style={{
        background: selected ? `${BRAND}22` : 'var(--app-bg)',
        border: `1.5px solid ${selected ? BRAND : 'var(--edge)'}`,
        color: selected ? BRAND : 'var(--body)',
      }}
    >
      {selected && <CheckCircle2 size={14} />}
      {label}
    </button>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1({ data, onChange }) {
  const { isDark } = useTheme();
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Industry</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map(ind => (
            <SelectOption
              key={ind} value={ind} label={ind}
              selected={data.industry === ind}
              onClick={() => onChange('industry', ind)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Country</FieldLabel>
          <input
            style={inputStyle(isDark)}
            placeholder="e.g. United Kingdom"
            value={data.country || ''}
            onChange={e => onChange('country', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Year Founded</FieldLabel>
          <input
            style={inputStyle(isDark)}
            placeholder="e.g. 2010"
            value={data.yearFounded || ''}
            onChange={e => onChange('yearFounded', e.target.value)}
          />
        </div>
      </div>

      <div>
        <FieldLabel required>Company Size (employees)</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {COMPANY_SIZES.map(sz => (
            <SelectOption
              key={sz} value={sz} label={sz}
              selected={data.companySize === sz}
              onClick={() => onChange('companySize', sz)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, onChange }) {
  const toggle = (field, val) => {
    const arr = data[field] || [];
    onChange(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel required>What do you procure? (select all that apply)</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {PROCUREMENT_CATEGORIES.map(cat => (
            <SelectOption
              key={cat.id} value={cat.id} label={cat.label}
              selected={(data.categories || []).includes(cat.id)}
              onClick={() => toggle('categories', cat.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Preferred supplier regions</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUPPLIER_REGIONS.map(r => (
            <SelectOption
              key={r} value={r} label={r}
              selected={(data.supplierRegions || []).includes(r)}
              onClick={() => toggle('supplierRegions', r)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel required>Annual procurement spend</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {SPEND_RANGES.map(s => (
            <SelectOption
              key={s} value={s} label={s}
              selected={data.annualSpend === s}
              onClick={() => onChange('annualSpend', s)}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>Active suppliers</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {ACTIVE_SUPPLIERS.map(s => (
            <SelectOption
              key={s} value={s} label={s}
              selected={data.activeSuppliers === s}
              onClick={() => onChange('activeSuppliers', s)}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>Purchase orders per month</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {ORDERS_PER_MONTH.map(s => (
            <SelectOption
              key={s} value={s} label={s}
              selected={data.ordersPerMonth === s}
              onClick={() => onChange('ordersPerMonth', s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ data, onChange }) {
  const { isDark } = useTheme();
  const toggle = (val) => {
    const arr = data.painPoints || [];
    onChange('painPoints', arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Current pain points (select all that apply)</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {PAIN_POINTS.map(p => (
            <SelectOption
              key={p} value={p} label={p}
              selected={(data.painPoints || []).includes(p)}
              onClick={() => toggle(p)}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>What tools do you currently use?</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {CURRENT_TOOLS.map(t => (
            <SelectOption
              key={t} value={t} label={t}
              selected={data.currentTools === t}
              onClick={() => onChange('currentTools', t)}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>What do you hope to achieve with Vrocure?</FieldLabel>
        <textarea
          rows={4}
          placeholder="Describe your key goals and expectations..."
          value={data.goals || ''}
          onChange={e => onChange('goals', e.target.value)}
          style={{
            ...inputStyle(isDark),
            resize: 'vertical',
            minHeight: 100,
          }}
        />
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2" style={{ borderBottom: '1px solid var(--edge)' }}>
      <span className="text-sm font-semibold w-48 shrink-0" style={{ color: 'var(--caption)' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--heading)' }}>
        {Array.isArray(value)
          ? value.join(', ')
          : value}
      </span>
    </div>
  );
}

function Step5({ data, onEditStep }) {
  const catLabels = (data.categories || []).map(id => PROCUREMENT_CATEGORIES.find(c => c.id === id)?.label).filter(Boolean);

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--body)' }}>
        Review your details below. Click a section header to edit.
      </p>

      {/* Company Profile */}
      <div className="rounded-xl p-4" style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heading)' }}>
            <Building2 size={14} style={{ color: BRAND }} /> Company Profile
          </span>
          <button onClick={() => onEditStep(1)} className="text-xs font-semibold" style={{ color: BRAND }}>Edit</button>
        </div>
        <ReviewRow label="Industry"      value={data.industry} />
        <ReviewRow label="Country"       value={data.country} />
        <ReviewRow label="Company Size"  value={data.companySize} />
        <ReviewRow label="Year Founded"  value={data.yearFounded} />
      </div>

      {/* Procurement */}
      <div className="rounded-xl p-4" style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heading)' }}>
            <Package size={14} style={{ color: BRAND }} /> What You Procure
          </span>
          <button onClick={() => onEditStep(2)} className="text-xs font-semibold" style={{ color: BRAND }}>Edit</button>
        </div>
        <ReviewRow label="Categories"       value={catLabels} />
        <ReviewRow label="Supplier Regions" value={data.supplierRegions} />
      </div>

      {/* Scale */}
      <div className="rounded-xl p-4" style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heading)' }}>
            <BarChart2 size={14} style={{ color: BRAND }} /> Procurement Scale
          </span>
          <button onClick={() => onEditStep(3)} className="text-xs font-semibold" style={{ color: BRAND }}>Edit</button>
        </div>
        <ReviewRow label="Annual Spend"       value={data.annualSpend} />
        <ReviewRow label="Active Suppliers"   value={data.activeSuppliers} />
        <ReviewRow label="Orders / Month"     value={data.ordersPerMonth} />
      </div>

      {/* Challenges */}
      <div className="rounded-xl p-4" style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heading)' }}>
            <AlertCircle size={14} style={{ color: BRAND }} /> Challenges
          </span>
          <button onClick={() => onEditStep(4)} className="text-xs font-semibold" style={{ color: BRAND }}>Edit</button>
        </div>
        <ReviewRow label="Pain Points"    value={data.painPoints} />
        <ReviewRow label="Current Tools"  value={data.currentTools} />
        <ReviewRow label="Goals"          value={data.goals} />
      </div>
    </div>
  );
}

// ── Wizard container ──────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const { currentUser, workspaceId, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  const glassCard = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--edge)',
    boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
  };

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const validateStep = () => {
    if (step === 1) return formData.industry && formData.country && formData.companySize;
    if (step === 2) return (formData.categories || []).length > 0;
    if (step === 3) return formData.annualSpend && formData.activeSuppliers && formData.ordersPerMonth;
    if (step === 4) return !!formData.currentTools;
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast({ title: 'Required fields missing', description: 'Please fill all required fields before continuing.', variant: 'destructive' });
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error: saveErr } = await saveOnboardingData(workspaceId, formData);
      if (saveErr) throw saveErr;

      const { error: completeErr } = await completeOnboarding(currentUser.id);
      if (completeErr) throw completeErr;

      await refreshProfile();
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      toast({ title: 'Submission failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Tell us about your company',
    'What do you procure?',
    'What is your procurement scale?',
    'What are your current challenges?',
    'Review your application',
  ];

  const stepDescriptions = [
    'Help us understand your business so we can tailor Vrocure to your needs.',
    'Select the categories of goods and services you typically source.',
    'Give us an idea of your procurement volume and supplier base.',
    'Understanding your pain points helps us prioritise what matters most.',
    'Everything looks good? Submit your application for review.',
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: BRAND }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: BRAND }}>
              Workspace Setup
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--heading)' }}>
            {stepTitles[step - 1]}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>
            {stepDescriptions[step - 1]}
          </p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="rounded-2xl p-6 sm:p-8"
          style={{ ...glassCard, borderTop: `3px solid ${BRAND}` }}
        >
          <StepBar current={step} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <Step1 data={formData} onChange={update} />}
              {step === 2 && <Step2 data={formData} onChange={update} />}
              {step === 3 && <Step3 data={formData} onChange={update} />}
              {step === 4 && <Step4 data={formData} onChange={update} />}
              {step === 5 && <Step5 data={formData} onEditStep={setStep} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--edge)' }}>
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
              style={{ color: 'var(--body)', border: '1px solid var(--edge)', background: 'transparent' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
                style={{ background: BRAND }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background: BRAND }}
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><CheckCircle2 size={16} /> Submit Application</>}
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--caption)' }}>
          Step {step} of {STEPS.length} · Your progress is saved automatically
        </p>
      </div>
    </div>
  );
}
