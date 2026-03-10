import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/contexts/AuthContext';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import {
  User, Building2, Phone, Mail, Globe, MapPin,
  Briefcase, FileText, Users, Save, Loader2, Check, Camera,
} from 'lucide-react';

const TABS = [
  { key: 'contact', label: 'Contact Details',  icon: User      },
  { key: 'company', label: 'Company Info',      icon: Building2 },
];

const INDUSTRIES = [
  'Aerospace & Defence', 'Automotive', 'Oil & Gas', 'Marine',
  'Medical Devices', 'Energy & Renewables', 'Construction & Civil',
  'Rail & Transport', 'Electronics', 'Food & Beverage',
  'Pharmaceutical', 'General Engineering', 'Other',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

const ORDER_VOLUMES = [
  'One-off prototype', 'Occasional (<5/year)', 'Regular (5–20/year)', 'High volume (20+/year)',
];

const Field = ({ icon: Icon, label, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
      <Icon size={12} />
      {label}
    </label>
    {children}
  </div>
);

const inputCls = `w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800
  placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all`;

const ClientProfilePage = () => {
  const { currentUser, refreshProfile } = useAuth();
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
    industry: '', company_size: '', bio: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from('profiles')
        .select('company_name, contact_person, phone, address, website, industry, company_size, bio, logo_url')
        .eq('id', currentUser.id)
        .maybeSingle();
      if (data) {
        setForm({
          company_name:   data.company_name   || '',
          contact_person: data.contact_person || '',
          phone:          data.phone          || '',
          address:        data.address        || '',
          website:        data.website        || '',
          industry:       data.industry       || '',
          company_size:   data.company_size   || '',
          bio:            data.bio            || '',
        });
        setLogoUrl(data.logo_url || '');
      }
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Try update first
      const { error, count } = await supabaseAdmin
        .from('profiles')
        .update({ ...form })
        .eq('id', currentUser.id)
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      if (count === 0) {
        // No row updated, try insert (upsert)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert([{ id: currentUser.id, ...form }]);
        if (insertError) throw insertError;
      }
      toast({ title: 'Profile saved', description: 'Your company profile has been updated.' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.company_name || currentUser?.email || 'C')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const completionFields = [
    form.company_name, form.contact_person, form.phone, form.address,
    form.industry, form.company_size, form.bio,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <Helmet><title>My Profile - RZ Client Portal</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />

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
                style={{ background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #ea580c, #b45309)' }}
                title="Click to upload logo"
              >
                {logoUploading ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-xl">{initials}</span>
                )}
                {/* Hover overlay */}
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
                <span className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  <User size={11} /> Client
                </span>
              </div>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
              {form.industry && (
                <p className="text-xs text-orange-500 mt-1">{form.industry}</p>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-400 mb-1">Profile Completion</p>
              <p className="text-2xl font-bold text-slate-900">{completionPct}%</p>
              <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs + form */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-200 px-2 pt-2 gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative ${
                  activeTab === key
                    ? 'text-orange-600 bg-orange-50/60'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {label}
                {activeTab === key && (
                  <motion.div
                    layoutId="client-profile-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t"
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
                        onChange={e => set('company_name', e.target.value)} placeholder="Acme Engineering Ltd" />
                    </Field>
                    <Field icon={User} label="Contact Person">
                      <input className={inputCls} value={form.contact_person}
                        onChange={e => set('contact_person', e.target.value)} placeholder="Jane Doe" />
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
                        onChange={e => set('address', e.target.value)} placeholder="Manchester, UK" />
                    </Field>
                  </div>
                </motion.div>
              )}

              {activeTab === 'company' && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field icon={Briefcase} label="Industry Sector">
                      <select className={inputCls} value={form.industry}
                        onChange={e => set('industry', e.target.value)}>
                        <option value="">Select industry...</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </Field>
                    <Field icon={Users} label="Company Size">
                      <select className={inputCls} value={form.company_size}
                        onChange={e => set('company_size', e.target.value)}>
                        <option value="">Select size...</option>
                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field icon={FileText} label="About Your Company">
                    <textarea
                      className={inputCls + ' min-h-[120px] resize-y'}
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                      placeholder="Briefly describe your company, the types of components you typically need manufactured, and any specific requirements..."
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-6 pt-5 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                  saved
                    ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20'
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
    </ClientDashboardLayout>
  );
};

export default ClientProfilePage;
