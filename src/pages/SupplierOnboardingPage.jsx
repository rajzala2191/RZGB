import { useState } from 'react';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Building2, Wrench, UploadCloud, Shield, PartyPopper,
} from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Company Info',     icon: Building2 },
  { n: 2, label: 'Capabilities',     icon: Wrench },
  { n: 3, label: 'Certifications',   icon: UploadCloud },
  { n: 4, label: 'T&C Acceptance',   icon: Shield },
  { n: 5, label: 'Submitted',        icon: PartyPopper },
];

const DUMMY_TCS = `
RZ Global Solutions — Supplier Terms & Conditions

1. The supplier agrees to maintain quality standards in line with ISO 9001.
2. All materials and components must comply with applicable regulatory standards.
3. Intellectual property shared by clients is strictly confidential.
4. Delivery timelines agreed upon during bidding are binding commitments.
5. RZ Global Solutions reserves the right to audit supplier facilities.
6. Payment terms are net 30 days from invoice acceptance.
7. Disputes shall be resolved under English law.

By accepting, the supplier acknowledges and agrees to these terms.
`.trim();

function StepBar({ current }) {
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

export default function SupplierOnboardingPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Company Info
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3 — Cert upload
  const [certFiles, setCertFiles] = useState([]);
  const [uploadingCerts, setUploadingCerts] = useState(false);

  // Step 4 — T&C
  const [tcAccepted, setTcAccepted] = useState(false);

  const uploadCompanyCerts = async () => {
    if (certFiles.length === 0) return;
    setUploadingCerts(true);
    for (const file of certFiles) {
      const path = `${currentUser.id}/company-certs/${file.name}`;
      await supabase.storage.from('certificates').upload(path, file, { upsert: true });
    }
    setUploadingCerts(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Upload any certs
      await uploadCompanyCerts();

      // Update profile
      const updates = {
        onboarding_status: 'docs_submitted',
      };
      if (companyName) updates.company_name = companyName;
      if (country) updates.country = country;
      if (phone) updates.phone = phone;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);
      if (error) throw error;

      setStep(5);
      toast({ title: 'Application Submitted', description: 'Your onboarding documents have been submitted for review.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupplierHubLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-black text-slate-100 mb-1">Supplier Onboarding</h1>
          <p className="text-slate-400 text-sm">Complete your supplier profile to gain full access to the platform.</p>
        </div>

        <StepBar current={step} />

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 size={18} className="text-orange-500" /> Company Information
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Company Name *</label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                placeholder="e.g. Precision Parts Ltd" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Country *</label>
              <Input value={country} onChange={e => setCountry(e.target.value)}
                className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                placeholder="e.g. United Kingdom" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)}
                className="bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
                placeholder="+44 7700 900000" />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => { if (!companyName || !country) { toast({ title: 'Required', description: 'Company name and country are required.', variant: 'destructive' }); return; } setStep(2); }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Capabilities */}
        {step === 2 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Wrench size={18} className="text-orange-500" /> Capabilities
            </h2>
            <p className="text-slate-400 text-sm">
              You can declare your manufacturing capabilities in detail from the <strong className="text-orange-400">My Capabilities</strong> page in the sidebar.
              For now, you can proceed to the next step — your capability profile can be updated at any time.
            </p>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="border-slate-700 text-slate-300">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-orange-600 hover:bg-orange-500 text-white font-bold">
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Certifications */}
        {step === 3 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UploadCloud size={18} className="text-orange-500" /> Company Certifications
            </h2>
            <p className="text-slate-400 text-sm">Upload company-level certificates (ISO, NADCAP, etc.). Optional but recommended.</p>
            <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-orange-500 cursor-pointer transition-colors">
              <UploadCloud size={28} className="text-orange-500 mb-2" />
              <span className="text-sm text-slate-400">Click to select files</span>
              <input type="file" multiple className="hidden"
                onChange={e => setCertFiles(Array.from(e.target.files || []))} />
            </label>
            {certFiles.length > 0 && (
              <ul className="space-y-1.5">
                {certFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300 bg-[#1e293b] rounded-lg px-3 py-2 border border-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="border-slate-700 text-slate-300">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="bg-orange-600 hover:bg-orange-500 text-white font-bold">
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: T&C */}
        {step === 4 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield size={18} className="text-orange-500" /> Terms & Conditions
            </h2>
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto text-xs text-slate-400 leading-relaxed whitespace-pre-line">
              {DUMMY_TCS}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tcAccepted}
                onChange={e => setTcAccepted(e.target.checked)}
                className="w-4 h-4 accent-orange-600"
              />
              <span className="text-sm text-slate-300">I have read and agree to the RZ Global Solutions Supplier Terms & Conditions</span>
            </label>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="border-slate-700 text-slate-300">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!tcAccepted || submitting}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
              >
                {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                Submit Application
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-slate-100">Application Submitted!</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your onboarding documents have been submitted for admin review. You will be notified when your account is approved.
              In the meantime, you can explore the platform in read-only mode.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-amber-950/30 border border-amber-800/40 rounded-lg">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Status: Pending Review</span>
            </div>
          </div>
        )}
      </div>
    </SupplierHubLayout>
  );
}
