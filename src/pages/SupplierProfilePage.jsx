import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { useToast } from '@/components/ui/use-toast';
import {
  User, Building2, Phone, Mail, Globe, MapPin,
  Wrench, Award, BadgeCheck, Calendar, Users,
  Save, Loader2, Check, ChevronRight, Truck, FileText, Camera
} from 'lucide-react';

const TABS = [
  { key: 'contact',      label: 'Contact Details',       icon: User    },
  { key: 'capabilities', label: 'Capabilities',          icon: Wrench  },
  { key: 'overview',     label: 'Company Overview',      icon: Building2 },
];

const CAPABILITY_OPTIONS = [
  'CNC Machining', 'Casting', 'Forging', 'Sheet Metal', 'Welding',
  'Grinding', 'Turning', 'Milling', 'EDM', 'Injection Moulding',
  '3D Printing', 'Laser Cutting', 'Heat Treatment', 'Surface Treatment',
  'Assembly', 'Quality Inspection',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

const CERT_OPTIONS = [
  'ISO 9001', 'ISO 14001', 'ISO 45001', 'AS9100', 'IATF 16949',
  'ISO 13485', 'NADCAP', 'CE Marking', 'OHSAS 18001',
];

const Field = ({ icon: Icon, label, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      <Icon size={12} />
      {label}
    </label>
    {children}
  </div>
);

const inputCls = `w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900
  placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all`;

const SupplierProfilePage = () => {
  const { currentUser, userCompanyName, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = React.useRef(null);
  const [form, setForm] = useState({
    company_name: '', contact_person: '', phone: '', address: '', website: '',
    specialization: '', capabilities: '', certifications: '',
    years_in_business: '', company_size: '', bio: '',
    min_order_qty: '', max_order_qty: '', lead_time_days: '', country: '', region: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      // Load from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_name, contact_person, phone, address, website, specialization, capabilities, certifications, years_in_business, company_size, bio, logo_url')
        .eq('id', currentUser.id)
        .maybeSingle();
      // Load from supplier_capabilities
      const { data: capData } = await supabase
        .from('supplier_capabilities')
        .select('min_order_qty, max_order_qty, lead_time_days, country, region')
        .eq('supplier_id', currentUser.id)
        .maybeSingle();
      setForm({
        company_name:      profileData?.company_name      || '',
        contact_person:    profileData?.contact_person    || '',
        phone:             profileData?.phone             || '',
        address:           profileData?.address           || '',
        website:           profileData?.website           || '',
        specialization:    profileData?.specialization    || '',
        capabilities:      profileData?.capabilities      || '',
        certifications:    profileData?.certifications    || '',
        years_in_business: profileData?.years_in_business || '',
        company_size:      profileData?.company_size      || '',
        bio:               profileData?.bio               || '',
        min_order_qty:     capData?.min_order_qty         || '',
        max_order_qty:     capData?.max_order_qty         || '',
        lead_time_days:    capData?.lead_time_days        || '',
        country:           capData?.country               || '',
        region:            capData?.region                || '',
      });
      setLogoUrl(profileData?.logo_url || '');
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${currentUser.id}/logo.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseAdmin.storage.from('logos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', currentUser.id);
      if (updateError) throw updateError;
      setLogoUrl(publicUrl);
      await refreshProfile();
      toast({ title: 'Logo updated', description: 'Your company logo has been saved.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleChip = (field, value) => {
    const current = form[field] ? form[field].split(',').map(s => s.trim()).filter(Boolean) : [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    set(field, updated.join(', '));
  };

  const isSelected = (field, value) => {
    return form[field] ? form[field].split(',').map(s => s.trim()).includes(value) : false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save profile fields
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          company_name: form.company_name,
          contact_person: form.contact_person,
          phone: form.phone,
          address: form.address,
          website: form.website,
          specialization: form.specialization,
          capabilities: form.capabilities,
          certifications: form.certifications,
          years_in_business: form.years_in_business ? parseInt(form.years_in_business) : null,
          company_size: form.company_size,
          bio: form.bio,
        })
        .eq('id', currentUser.id);
      if (profileError) throw profileError;
      // Upsert supplier_capabilities
      const { error: capError } = await supabaseAdmin
        .from('supplier_capabilities')
        .upsert([
          {
            supplier_id: currentUser.id,
            min_order_qty: form.min_order_qty ? parseInt(form.min_order_qty) : null,
            max_order_qty: form.max_order_qty ? parseInt(form.max_order_qty) : null,
            lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
            country: form.country,
            region: form.region,
            processes: form.capabilities,
            certifications: form.certifications,
            updated_at: new Date().toISOString(),
          }
        ], { onConflict: ['supplier_id'] });
      if (capError) throw capError;
      toast({ title: 'Profile saved', description: 'Your company profile and capabilities have been updated.' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.company_name || currentUser?.email || 'S')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const completionFields = [
    form.company_name, form.contact_person, form.phone, form.address,
    form.specialization, form.capabilities, form.certifications, form.bio, form.company_size,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  if (loading) {
    return (
      <SupplierHubLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-[#FF6B35]" />
        </div>
      </SupplierHubLayout>
    );
  }

  return (
    <SupplierHubLayout>
      <Helmet><title>My Profile - RZ Supplier Hub</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-[#FF6B35] via-orange-400 to-orange-600" />

          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo upload zone */}
            <div className="relative shrink-0 group">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg focus:outline-none"
                style={{ background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #c2410c)' }}
                title="Click to upload logo"
              >
                {logoUploading ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-xl">{initials}</span>
                )}
                {!logoUploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 truncate">
                  {form.company_name || 'Your Company'}
                </h1>
                <span className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  <Truck size={11} /> Supplier
                </span>
              </div>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
              {form.specialization && (
                <p className="text-xs text-[#FF6B35] mt-1">{form.specialization}</p>
              )}
            </div>

            {/* Profile completion */}
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-500 mb-1">Profile Completion</p>
              <p className="text-2xl font-bold text-slate-900">{completionPct}%</p>
              <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-orange-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs + form */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-slate-200 px-2 pt-2 gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative whitespace-nowrap shrink-0 ${
                  activeTab === key
                    ? 'text-[#FF6B35] bg-orange-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {label}
                {activeTab === key && (
                  <motion.div
                    layoutId="supplier-profile-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] rounded-t"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'contact' && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field icon={Building2} label="Company Name">
                      <input className={inputCls} value={form.company_name}
                        onChange={e => set('company_name', e.target.value)} placeholder="Acme Manufacturing Ltd" />
                    </Field>
                    <Field icon={User} label="Contact Person">
                      <input className={inputCls} value={form.contact_person}
                        onChange={e => set('contact_person', e.target.value)} placeholder="John Smith" />
                    </Field>
                    <Field icon={Mail} label="Email (read-only)">
                      <input className={inputCls + ' opacity-50 cursor-not-allowed'} value={currentUser?.email || ''} disabled />
                    </Field>
                    <Field icon={Phone} label="Phone Number">
                      <input className={inputCls} value={form.phone}
                        onChange={e => set('phone', e.target.value)} placeholder="+44 7700 900000" />
                    </Field>
                    <Field icon={Globe} label="Website">
                      <input className={inputCls} value={form.website}
                        onChange={e => set('website', e.target.value)} placeholder="https://yourcompany.com" />
                    </Field>
                    <Field icon={MapPin} label="Address / Location">
                      <input className={inputCls} value={form.address}
                        onChange={e => set('address', e.target.value)} placeholder="Birmingham, UK" />
                    </Field>
                  </div>
                </motion.div>
              )}

              {activeTab === 'capabilities' && (
                <motion.div
                  key="capabilities"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <Field icon={Wrench} label="Primary Specialisation">
                    <input className={inputCls} value={form.specialization}
                      onChange={e => set('specialization', e.target.value)}
                      placeholder="e.g. Precision CNC Machining, Aluminium Casting..." />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field icon={Award} label="Min Order Qty">
                      <input className={inputCls} type="number" min="1" value={form.min_order_qty}
                        onChange={e => set('min_order_qty', e.target.value)} placeholder="e.g. 10" />
                    </Field>
                    <Field icon={Award} label="Max Order Qty">
                      <input className={inputCls} type="number" min="1" value={form.max_order_qty}
                        onChange={e => set('max_order_qty', e.target.value)} placeholder="e.g. 1000" />
                    </Field>
                    <Field icon={Calendar} label="Lead Time (days)">
                      <input className={inputCls} type="number" min="1" value={form.lead_time_days}
                        onChange={e => set('lead_time_days', e.target.value)} placeholder="e.g. 14" />
                    </Field>
                    <Field icon={Globe} label="Country">
                      <input className={inputCls} value={form.country}
                        onChange={e => set('country', e.target.value)} placeholder="e.g. UK" />
                    </Field>
                    <Field icon={MapPin} label="Region">
                      <input className={inputCls} value={form.region}
                        onChange={e => set('region', e.target.value)} placeholder="e.g. Midlands" />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Wrench size={12} /> Manufacturing Capabilities
                    </label>
                    <p className="text-xs text-slate-500">Select all that apply. This helps match you to the right jobs.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {CAPABILITY_OPTIONS.map(cap => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleChip('capabilities', cap)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                            isSelected('capabilities', cap)
                              ? 'bg-orange-50 border-orange-300 text-orange-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                          }`}
                        >
                          {isSelected('capabilities', cap) && <Check size={10} className="inline mr-1" />}
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <BadgeCheck size={12} /> Certifications & Standards
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {CERT_OPTIONS.map(cert => (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleChip('certifications', cert)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                            isSelected('certifications', cert)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                          }`}
                        >
                          {isSelected('certifications', cert) && <Check size={10} className="inline mr-1" />}
                          {cert}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field icon={Calendar} label="Years in Business">
                      <input className={inputCls} type="number" min="1" max="200" value={form.years_in_business}
                        onChange={e => set('years_in_business', e.target.value)} placeholder="e.g. 12" />
                    </Field>
                    <Field icon={Users} label="Company Size">
                      <select className={inputCls} value={form.company_size}
                        onChange={e => set('company_size', e.target.value)}>
                        <option value="">Select size...</option>
                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field icon={FileText} label="Company Bio / Description">
                    <textarea
                      className={inputCls + ' min-h-[120px] resize-y'}
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                      placeholder="Briefly describe your company, history, core strengths, and what sets you apart..."
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save button */}
            <div className="flex justify-end mt-6 pt-5 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                  saved
                    ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                    : 'bg-[#FF6B35] hover:bg-orange-500 text-white shadow-orange-900/20'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <><Loader2 size={15} className="animate-spin" /> Saving...</>
                ) : saved ? (
                  <><Check size={15} /> Saved</>
                ) : (
                  <><Save size={15} /> Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );
};

export default SupplierProfilePage;
