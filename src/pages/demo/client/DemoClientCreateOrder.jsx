import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { getLandingUrl } from '@/lib/portalConfig';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Package, Layers, MapPin, Settings2, Lock, X } from 'lucide-react';

const PROCESSES = ['MATERIAL', 'CASTING', 'MACHINING', 'QC'];
const MATERIALS = [
  'Stainless Steel 304', 'Stainless Steel 316L', 'Aluminium 6061-T6', 'Aluminium 7075',
  'Mild Steel S275', 'Hardened Steel EN36', 'Titanium Grade 5', 'Cast Iron GG25',
  'Bronze LG2', 'Brass CZ121', 'Copper ETP',
];

function LimitReachedModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-14 h-14 bg-orange-50 border border-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Demo Order Limit Reached</h2>
        <p className="text-sm text-slate-500 mb-6">
          You've already created a demo order this session. In the real portal, clients can create unlimited orders.
          Clear your browser's localStorage to reset the demo session.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => { window.location.href = getLandingUrl('/'); }}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DemoClientCreateOrder() {
  const navigate = useNavigate();
  const { createDemoOrder, hasCreatedDemoOrder } = useDemoContext();

  const [step, setStep] = useState(1);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    part_name: '',
    material: '',
    quantity: '',
    delivery_address: '',
    notes: '',
    selected_processes: [],
  });
  const [errors, setErrors] = useState({});

  function toggle(process) {
    setForm((f) => ({
      ...f,
      selected_processes: f.selected_processes.includes(process)
        ? f.selected_processes.filter((p) => p !== process)
        : [...f.selected_processes, process],
    }));
  }

  function validateStep1() {
    const e = {};
    if (!form.part_name.trim()) e.part_name = 'Part name is required';
    if (!form.material) e.material = 'Please select a material';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) < 1) e.quantity = 'Enter a valid quantity';
    return e;
  }

  function validateStep2() {
    const e = {};
    if (!form.delivery_address.trim()) e.delivery_address = 'Delivery address is required';
    if (form.selected_processes.length === 0) e.selected_processes = 'Select at least one process';
    return e;
  }

  function handleNext() {
    const e = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    if (hasCreatedDemoOrder) { setShowLimitModal(true); return; }
    const result = createDemoOrder({ ...form, quantity: Number(form.quantity) });
    if (!result.success) { setShowLimitModal(true); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Submitted!</h1>
          <p className="text-slate-500 text-sm mb-2">Job ID: <span className="text-orange-500 font-mono font-bold">RZ-JOB-DEMO1</span></p>
          <p className="text-slate-500 text-sm mb-8">
            Your order is now in the <strong className="text-slate-800">Pending Admin Review</strong> queue.
            The RZ admin team will sanitise your drawings before releasing to suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/demo/client/orders" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
              View My Orders
            </Link>
            <Link to="/demo/admin" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
              See Admin View →
            </Link>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      {showLimitModal && <LimitReachedModal onClose={() => setShowLimitModal(false)} />}

      <Link to="/demo/client" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Create New Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Step {step} of 3 — {step === 1 ? 'Part Details' : step === 2 ? 'Delivery & Processes' : 'Review & Submit'}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                s === step ? 'bg-orange-500 border-orange-500 text-white' :
                'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-1.5">Part Name <span className="text-red-500">*</span></label>
                <input
                  value={form.part_name}
                  onChange={(e) => setForm((f) => ({ ...f, part_name: e.target.value }))}
                  placeholder="e.g. Hydraulic Manifold Block"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
                />
                {errors.part_name && <p className="text-xs text-red-500 mt-1">{errors.part_name}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-1.5">Material <span className="text-red-500">*</span></label>
                <select
                  value={form.material}
                  onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
                >
                  <option value="">Select material...</option>
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.material && <p className="text-xs text-red-500 mt-1">{errors.material}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-1.5">Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
                />
                {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-1.5">Notes / Specifications</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Tolerances, surface finish, certifications required..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                <input
                  value={form.delivery_address}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_address: e.target.value }))}
                  placeholder="e.g. Birmingham, B1 1AA"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
                />
                {errors.delivery_address && <p className="text-xs text-red-500 mt-1">{errors.delivery_address}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-700 font-medium block mb-2">Manufacturing Processes <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {PROCESSES.map((p) => {
                    const selected = form.selected_processes.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggle(p)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                          selected ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                          {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        {p}
                      </button>
                    );
                  })}
                </div>
                {errors.selected_processes && <p className="text-xs text-red-500 mt-2">{errors.selected_processes}</p>}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Review Your Order</h3>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Part Name', value: form.part_name },
                  { label: 'Material', value: form.material },
                  { label: 'Quantity', value: `${form.quantity} pieces` },
                  { label: 'Delivery', value: form.delivery_address },
                  { label: 'Processes', value: form.selected_processes.join(', ') },
                  ...(form.notes ? [{ label: 'Notes', value: form.notes }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0 pt-0.5">{item.label}</span>
                    <span className="text-sm text-slate-800 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Demo mode: This order will be created in-memory only. No drawings will be uploaded.
                  After submission, you can view how the admin sanitisation queue looks.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1) : navigate('/demo/client')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Submit Order <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
