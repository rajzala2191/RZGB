import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, UserPlus, Loader2, Mail, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ company_name: '', email: '', contact_person: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedCaps, setExpandedCaps] = useState({});
  const [capsData, setCapsData] = useState({});
  const [loadingCaps, setLoadingCaps] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [onboardingQueue, setOnboardingQueue] = useState([]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [updatingOnboarding, setUpdatingOnboarding] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleCaps = async (supplierId) => {
    if (expandedCaps[supplierId]) {
      setExpandedCaps(prev => ({ ...prev, [supplierId]: false }));
      return;
    }
    setLoadingCaps(prev => ({ ...prev, [supplierId]: true }));
    const { data } = await supabase
      .from('supplier_capabilities')
      .select('*')
      .eq('supplier_id', supplierId)
      .maybeSingle();
    setCapsData(prev => ({ ...prev, [supplierId]: data || null }));
    setLoadingCaps(prev => ({ ...prev, [supplierId]: false }));
    setExpandedCaps(prev => ({ ...prev, [supplierId]: true }));
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'supplier').order('created_at', { ascending: false });
    setSuppliers(data || []);
    setLoading(false);
  };

  const fetchOnboardingQueue = async () => {
    setOnboardingLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'supplier')
      .in('onboarding_status', ['docs_submitted', 'under_review'])
      .order('created_at', { ascending: false });
    setOnboardingQueue(data || []);
    setOnboardingLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchOnboardingQueue();
  }, []);

  const updateOnboardingStatus = async (supplierId, status) => {
    setUpdatingOnboarding(supplierId + status);
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_status: status })
      .eq('id', supplierId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? 'Supplier Approved' : 'Supplier Rejected', description: `Onboarding status updated.` });
      fetchOnboardingQueue();
    }
    setUpdatingOnboarding(null);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { ...formData, role: 'supplier' }
      });
      if (error) throw new Error("Failed to invoke invite function: " + error.message);
      toast({ title: "Invitation Sent", description: `Invite sent to ${formData.email}` });
      setIsDialogOpen(false);
      setFormData({ company_name: '', email: '', contact_person: '', phone: '' });
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toast({ title: "Invitation Error", description: "Could not send invite (Edge function required). Inserting raw profile for demo.", variant: "destructive" });
      await supabase.from('profiles').insert({
        email: formData.email,
        company_name: formData.company_name,
        role: 'supplier',
        status: 'pending_verification'
      });
      setIsDialogOpen(false);
      fetchSuppliers();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none";
  const inputStyle = { background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' };

  return (
    <ControlCentreLayout>
      <Helmet><title>Supplier Management - Admin</title></Helmet>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--heading)' }}>
            <Users style={{ color: 'var(--brand)' }} size={32} /> Supplier Management
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--body)' }}>Manage network partners and access.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: 'var(--brand)' }}
            >
              <UserPlus size={16} /> Add Supplier
            </button>
          </DialogTrigger>
          <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--heading)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--heading)' }}>Invite New Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--caption)' }}>Company Name *</label>
                <input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--caption)' }}>Email Address *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--caption)' }}>Contact Person</label>
                  <input required value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--caption)' }}>Phone</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg font-semibold text-white flex justify-center items-center gap-2 mt-2"
                style={{ background: 'var(--brand)' }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Send Invitation'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'All Suppliers' },
          { key: 'onboarding', label: `Onboarding Queue${onboardingQueue.length > 0 ? ` (${onboardingQueue.length})` : ''}` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={
              activeTab === tab.key
                ? { background: 'var(--brand)', color: '#fff' }
                : { background: 'var(--surface-raised)', color: 'var(--body)', border: '1px solid var(--edge)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onboarding Queue */}
      {activeTab === 'onboarding' && (
        <div className="rounded-xl overflow-hidden mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          {onboardingLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : onboardingQueue.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--caption)' }}>No suppliers pending onboarding review.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead style={{ background: 'var(--surface-raised)' }}>
                  <tr>
                    {['Company', 'Email', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 text-xs font-semibold uppercase tracking-wider${h === 'Actions' ? ' text-right' : ''}`} style={{ color: 'var(--caption)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {onboardingQueue.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--edge)' : undefined }}>
                      <td className="p-4 font-semibold text-sm" style={{ color: 'var(--heading)' }}>{s.company_name || s.email}</td>
                      <td className="p-4 text-sm" style={{ color: 'var(--body)' }}>{s.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-amber-950/50 text-amber-400">
                          {s.onboarding_status?.replace(/_/g, ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateOnboardingStatus(s.id, 'approved')}
                            disabled={!!updatingOnboarding}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 disabled:opacity-50 transition-colors hover:bg-emerald-900/50"
                          >
                            {updatingOnboarding === s.id + 'approved' && <Loader2 size={12} className="animate-spin" />}
                            Approve
                          </button>
                          <button
                            onClick={() => updateOnboardingStatus(s.id, 'rejected')}
                            disabled={!!updatingOnboarding}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 text-red-400 border border-red-800/50 disabled:opacity-50 transition-colors hover:bg-red-900/50"
                          >
                            {updatingOnboarding === s.id + 'rejected' && <Loader2 size={12} className="animate-spin" />}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Suppliers Table */}
      <div className={`rounded-xl overflow-hidden ${activeTab !== 'all' ? 'hidden' : ''}`} style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead style={{ background: 'var(--surface-raised)' }}>
                <tr>
                  {['Company', 'Email', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`p-4 text-xs font-semibold uppercase tracking-wider${h === 'Actions' ? ' text-right' : ''}`} style={{ color: 'var(--caption)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderTop: i > 0 ? '1px solid var(--edge)' : undefined }}>
                      <td className="p-4 font-semibold text-sm" style={{ color: 'var(--heading)' }}>{s.company_name}</td>
                      <td className="p-4 text-sm" style={{ color: 'var(--body)' }}>{s.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${s.status === 'active' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-amber-950/50 text-amber-400'}`}>
                          {s.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleCaps(s.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--body)' }}
                            title="View Capabilities"
                          >
                            {loadingCaps[s.id] ? <Loader2 size={12} className="animate-spin" /> : expandedCaps[s.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Capabilities
                          </button>
                          <button
                            onClick={() => navigate(`/control-centre/supplier-scorecard/${s.id}`)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--body)' }}
                            title="View Scorecard"
                          >
                            <BarChart2 size={12} /> Scorecard
                          </button>
                          <button className="p-2 transition-colors" style={{ color: 'var(--brand)' }} title="Email supplier">
                            <Mail size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedCaps[s.id] && (
                      <tr style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface-raised)' }}>
                        <td colSpan={4} className="px-6 py-4">
                          {capsData[s.id] ? (
                            <div className="space-y-1.5 text-xs" style={{ color: 'var(--body)' }}>
                              {capsData[s.id].processes?.length > 0 && (
                                <div><span className="font-semibold mr-2" style={{ color: 'var(--heading)' }}>Processes:</span>{capsData[s.id].processes.join(', ')}</div>
                              )}
                              {capsData[s.id].materials?.length > 0 && (
                                <div><span className="font-semibold mr-2" style={{ color: 'var(--heading)' }}>Materials:</span>{capsData[s.id].materials.join(', ')}</div>
                              )}
                              {capsData[s.id].certifications?.length > 0 && (
                                <div><span className="font-semibold mr-2" style={{ color: 'var(--heading)' }}>Certifications:</span>{capsData[s.id].certifications.join(', ')}</div>
                              )}
                              <div className="flex gap-6">
                                {capsData[s.id].min_order_qty != null && <span><span className="font-semibold mr-1" style={{ color: 'var(--heading)' }}>Min Qty:</span>{capsData[s.id].min_order_qty}</span>}
                                {capsData[s.id].max_order_qty != null && <span><span className="font-semibold mr-1" style={{ color: 'var(--heading)' }}>Max Qty:</span>{capsData[s.id].max_order_qty}</span>}
                                {capsData[s.id].lead_time_days != null && <span><span className="font-semibold mr-1" style={{ color: 'var(--heading)' }}>Lead Time:</span>{capsData[s.id].lead_time_days} days</span>}
                                {capsData[s.id].country && <span><span className="font-semibold mr-1" style={{ color: 'var(--heading)' }}>Location:</span>{[capsData[s.id].country, capsData[s.id].region].filter(Boolean).join(', ')}</span>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs italic" style={{ color: 'var(--caption)' }}>No capability profile submitted yet.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
};

export default SupplierManagementPage;
