import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import MilestoneUpdater from '@/components/MilestoneUpdater';
import { DocumentGallery } from '@/components/DocumentPreview';
import ShippingLabelGenerator from '@/components/ShippingLabelGenerator';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Loader2, ArrowLeft, AlertTriangle, Package,
  Layers, Hash, Calendar, ShieldCheck, Truck,
  Zap, Hourglass, CheckCircle2, FileCheck,
} from 'lucide-react';

const STAGE_CFG = {
  AWARDED:   { label: 'Awarded',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MATERIAL:  { label: 'Material',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  CASTING:   { label: 'Casting',   color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  MACHINING: { label: 'Machining', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  QC:        { label: 'QC',        color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  DISPATCH:  { label: 'Dispatch',  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'  },
  DELIVERED: { label: 'Delivered', color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
};
const getStage = (s) => STAGE_CFG[s] || { label: s?.replace(/_/g, ' ') || 'Unknown', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' };

const PIPELINE = [
  { id: 'AWARDED',   label: 'Awarded',   icon: CheckCircle2 },
  { id: 'MATERIAL',  label: 'Material',  icon: Package },
  { id: 'CASTING',   label: 'Casting',   icon: Zap },
  { id: 'MACHINING', label: 'Machining', icon: Hourglass },
  { id: 'QC',        label: 'QC',        icon: ShieldCheck },
  { id: 'DISPATCH',  label: 'Dispatch',  icon: Truck },
];

function SpecField({ label, value, icon: Icon }) {
  return value ? (
    <div className="flex items-center gap-2">
      {Icon && <Icon size={13} style={{ color: '#FF6B35', flexShrink: 0 }} />}
      <span className="text-xs" style={{ color: 'inherit' }}>
        <span style={{ opacity: 0.6 }}>{label}: </span>
        <span className="font-semibold">{value}</span>
      </span>
    </div>
  ) : null;
}

export default function JobDetailsPage() {
  const { rz_job_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [job,       setJob]       = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const card      = { bg: isDark ? '#18181b' : '#ffffff', border: isDark ? '#232329' : '#e5e5e5' };
  const textPrimary = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted   = isDark ? '#71717a' : '#737373';
  const divider     = isDark ? '#232329' : '#f0f0f0';
  const inner       = isDark ? '#232329' : '#f4f4f5';

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('rz_job_id', rz_job_id)
        .single();
      if (error) throw error;
      setJob(data);
      // Fetch associated documents
      const { data: docs } = await supabaseAdmin
        .from('documents')
        .select('id, file_name, file_path, file_type, file_size')
        .eq('order_id', data.id)
        .order('created_at', { ascending: true });
      if (docs) setDocuments(docs);
    } catch {
      setError('Job not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rz_job_id) return;
    fetchJob();

    // Realtime: re-fetch when this order's status changes from any portal
    const channel = supabase
      .channel(`job-${rz_job_id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `rz_job_id=eq.${rz_job_id}` }, fetchJob)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_updates', filter: `rz_job_id=eq.${rz_job_id}` }, fetchJob)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [rz_job_id]);

  if (loading) return (
    <SupplierHubLayout>
      <div className="flex justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#FF6B35' }} />
      </div>
    </SupplierHubLayout>
  );

  if (error || !job) return (
    <SupplierHubLayout>
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
          <AlertTriangle className="mx-auto mb-4" size={36} style={{ color: '#f97316' }} />
          <p className="font-semibold mb-1" style={{ color: textPrimary }}>Job not found</p>
          <p className="text-sm mb-5" style={{ color: textMuted }}>{error}</p>
          <button
            onClick={() => navigate('/supplier-hub')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#FF6B35' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </SupplierHubLayout>
  );

  const stage = getStage(job.order_status);
  const stageIndex = PIPELINE.findIndex(s => s.id === job.order_status);

  return (
    <SupplierHubLayout>
      <Helmet><title>{`${job.rz_job_id || 'Job'} — Supplier Hub`}</title></Helmet>

      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Back */}
        <button
          onClick={() => navigate('/supplier-hub')}
          className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: textMuted }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* Hero card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          {/* Status strip */}
          <div className="h-1" style={{ background: stage.color }} />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-black" style={{ color: '#FF6B35' }}>
                    {job.rz_job_id}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: stage.bg, color: stage.color }}
                  >
                    {stage.label}
                  </span>
                  {job.is_qc_approved && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      QC Approved
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-black" style={{ color: textPrimary }}>
                  {job.ghost_public_name || job.public_name || job.part_name || 'Unnamed Job'}
                </h1>
                <div className="flex flex-wrap gap-4" style={{ color: textMuted }}>
                  <SpecField label="Material" value={job.material}  icon={Layers} />
                  <SpecField label="Qty"      value={job.quantity && `${job.quantity.toLocaleString()} units`} icon={Hash} />
                  <SpecField label="Received" value={job.created_at && new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} icon={Calendar} />
                </div>
              </div>

              {/* QC badge */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl self-start flex-shrink-0"
                style={{ background: job.is_qc_approved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${job.is_qc_approved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}
              >
                <ShieldCheck size={15} style={{ color: job.is_qc_approved ? '#22c55e' : '#f59e0b' }} />
                <span className="text-xs font-bold" style={{ color: job.is_qc_approved ? '#22c55e' : '#f59e0b' }}>
                  {job.is_qc_approved ? 'QC Approved' : 'QC Pending'}
                </span>
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${divider}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>
                Manufacturing Pipeline
              </p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {PIPELINE.map((step, i) => {
                  const done    = i < stageIndex;
                  const current = i === stageIndex;
                  const StepIcon = step.icon;
                  const stepCfg  = getStage(step.id);
                  return (
                    <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: current ? stepCfg.bg : done ? 'rgba(34,197,94,0.08)' : inner,
                          border: `1px solid ${current ? stepCfg.color : done ? 'rgba(34,197,94,0.25)' : 'transparent'}`,
                        }}
                      >
                        <StepIcon size={11} style={{ color: current ? stepCfg.color : done ? '#22c55e' : textMuted }} />
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: current ? stepCfg.color : done ? '#22c55e' : textMuted }}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < PIPELINE.length - 1 && (
                        <div className="w-3 h-px flex-shrink-0" style={{ background: done ? '#22c55e' : divider }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Updater */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <p className="text-sm font-bold" style={{ color: textPrimary }}>Update Milestone</p>
          </div>
          <div className="p-5">
            <MilestoneUpdater
              orderId={job.id}
              rzJobId={job.rz_job_id}
              currentStatus={job.order_status}
              onUpdate={fetchJob}
            />
          </div>
        </div>

        {/* Documents / Drawings */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
            <p className="text-sm font-bold" style={{ color: textPrimary }}>Drawings &amp; Documents</p>
            {documents.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}>
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: inner }}>
                  <FileCheck size={18} style={{ color: textMuted }} />
                </div>
                <p className="text-sm" style={{ color: textMuted }}>No documents attached yet</p>
              </div>
            ) : (
              <DocumentGallery documents={documents} bucket="documents" />
            )}
          </div>
        </div>

        {/* Shipping + NCR */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <p className="text-sm font-bold" style={{ color: textPrimary }}>Shipping Label</p>
            </div>
            <div className="p-5">
              <ShippingLabelGenerator
                orderId={job.id}
                isQcApproved={job.is_qc_approved}
                rzJobId={job.rz_job_id}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: textPrimary }}>Report Issue (NCR)</p>
            <p className="text-xs mb-5" style={{ color: textMuted }}>
              Found a deviation or quality issue? Report it immediately.
            </p>
            <button
              onClick={() => navigate('/supplier-hub/ncr')}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              Open NCR Form
            </button>
          </div>
        </div>

      </div>
    </SupplierHubLayout>
  );
}
