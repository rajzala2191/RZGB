import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useToast } from '@/components/ui/use-toast';
import { Save, Shield, Mail, Bell, Monitor, Loader2, MessageSquare, Users, LifeBuoy, ChevronRight, Palette, Webhook, X, Plus, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Zap, Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLAN_LABELS, PLAN_ORDER, getPlanLimits } from '@/lib/planLimits';
import { saveSlackWebhookUrl, saveSlackChannel } from '@/services/slackService';
import { fetchDeliveriesForWebhook, retryDelivery, fetchAndFirePendingRetries } from '@/services/webhookService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';

const QUICK_LINKS = [
  { icon: Users,   label: 'User Management',  desc: 'Manage portal users, roles and access',           path: '/control-centre/users' },
  { icon: Shield,  label: 'Account Security', desc: 'Password policies, 2FA and session management',    path: '/control-centre/account-security' },
  { icon: LifeBuoy,label: 'Support',          desc: 'View and respond to client & supplier tickets',    path: '/control-centre/support' },
];

const PLAN_ACCENT = { free: '#6b7280', starter: '#FF6B35', growth: '#3b82f6', enterprise: '#8b5cf6' };

const SettingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { plan, planStatus, monthlyOrders, userCount, limits } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 2FA enrollment state
  const [enrolling2FA, setEnrolling2FA] = useState(false);
  const [totpData, setTotpData] = useState(null); // { qr_code, secret, factorId }

  // Webhook state
  const [webhooks, setWebhooks] = useState([]);
  const [webhookForm, setWebhookForm] = useState({ event_type: 'order.status_changed', endpoint_url: '', secret: '' });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [expandedWebhook, setExpandedWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState({});
  const [loadingDeliveries, setLoadingDeliveries] = useState({});
  const [retryingDelivery, setRetryingDelivery] = useState({});
  const [firingRetries, setFiringRetries] = useState(false);

  const [settings, setSettings] = useState({
    company_name: 'RZ Global Solutions',
    company_email: '',
    support_contact: '',
    timezone: 'UTC',
    password_policy: 'Minimum 8 characters, at least one number and special character.',
    session_timeout: 60,
    mfa_enabled: false,
    smtp_host: 'smtp.example.com',
    alert_admins: true,
    email_notifications: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_key, setting_value');

        if (error) throw error;

        // Transform array to object
        const loadedSettings = {};
        if (data) {
          data.forEach(item => {
            // Parse boolean/numbers if possible
            let val = item.setting_value;
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            if (!isNaN(val) && val !== '') val = Number(val);
            loadedSettings[item.setting_key] = val;
          });
          setSettings(prev => ({ ...prev, ...loadedSettings }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert settings one by one
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
        updated_at: new Date()
      }));

      const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "System configuration updated successfully.",
        className: "bg-green-600 border-green-700 text-white"
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'UPDATE_SETTINGS',
        details: 'System configuration updated by admin'
      });

    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 2FA handler
  const handle2FAToggle = async (enable) => {
    if (!enable) { handleChange('mfa_enabled', false); setTotpData(null); return; }
    setEnrolling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setTotpData({ qr_code: data.totp.qr_code, secret: data.totp.secret, factorId: data.id });
      handleChange('mfa_enabled', true);
      toast({ title: '2FA Setup', description: 'Scan the QR code with your authenticator app.' });
    } catch (err) {
      toast({ title: '2FA Error', description: err.message, variant: 'destructive' });
    } finally {
      setEnrolling2FA(false);
    }
  };

  // Webhook handlers
  const loadDeliveries = async (webhookId) => {
    setLoadingDeliveries(prev => ({ ...prev, [webhookId]: true }));
    const { data } = await fetchDeliveriesForWebhook(webhookId, 8);
    setDeliveries(prev => ({ ...prev, [webhookId]: data || [] }));
    setLoadingDeliveries(prev => ({ ...prev, [webhookId]: false }));
  };

  const toggleExpand = (webhookId) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null);
    } else {
      setExpandedWebhook(webhookId);
      loadDeliveries(webhookId);
    }
  };

  const handleRetryDelivery = async (deliveryId, webhookId) => {
    setRetryingDelivery(prev => ({ ...prev, [deliveryId]: true }));
    try {
      await retryDelivery(deliveryId);
      toast({ title: 'Retry queued', description: 'Delivery retry has been initiated.' });
      await loadDeliveries(webhookId);
    } catch (err) {
      toast({ title: 'Retry failed', description: err.message, variant: 'destructive' });
    } finally {
      setRetryingDelivery(prev => ({ ...prev, [deliveryId]: false }));
    }
  };

  const handleFirePendingRetries = async () => {
    setFiringRetries(true);
    try {
      const fired = await fetchAndFirePendingRetries();
      toast({ title: 'Pending retries fired', description: `${fired} overdue deliver${fired === 1 ? 'y' : 'ies'} queued.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setFiringRetries(false);
    }
  };

  const fetchWebhooks = async () => {
    const { data } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });
    setWebhooks(data || []);
  };

  useEffect(() => { if (!loading) fetchWebhooks(); }, [loading]);

  const handleAddWebhook = async () => {
    if (!webhookForm.endpoint_url) {
      toast({ title: 'Validation', description: 'Endpoint URL is required.', variant: 'destructive' }); return;
    }
    setSavingWebhook(true);
    try {
      const { error } = await supabase.from('webhooks').insert({
        event_type:   webhookForm.event_type,
        endpoint_url: webhookForm.endpoint_url,
        secret:       webhookForm.secret || null,
        active:       true,
      });
      if (error) throw error;
      toast({ title: 'Webhook Added', description: 'Webhook endpoint registered.' });
      setWebhookForm({ event_type: 'order.status_changed', endpoint_url: '', secret: '' });
      fetchWebhooks();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingWebhook(false);
    }
  };

  const toggleWebhook = async (id, active) => {
    await supabase.from('webhooks').update({ active }).eq('id', id);
    fetchWebhooks();
  };

  const deleteWebhook = async (id) => {
    await supabase.from('webhooks').delete().eq('id', id);
    fetchWebhooks();
  };

  if (loading) {
    return (
      <ControlCentreLayout>
         <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
         </div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Settings - RZ Global Solutions</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6 pb-20">

        {/* ── Subscription Plan ─────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--caption)' }}>
            Subscription
          </p>
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${PLAN_ACCENT[plan] ?? '#6b7280'}18`, border: `1px solid ${PLAN_ACCENT[plan] ?? '#6b7280'}30` }}>
                  {plan === 'enterprise' ? <Crown size={20} style={{ color: PLAN_ACCENT[plan] }} /> : <Zap size={20} style={{ color: PLAN_ACCENT[plan] }} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg" style={{ color: 'var(--heading)' }}>{PLAN_LABELS[plan] ?? plan} Plan</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: planStatus === 'active' ? '#d1fae5' : '#fee2e2', color: planStatus === 'active' ? '#065f46' : '#991b1b' }}>
                      {planStatus}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--body)' }}>
                    {limits.maxOrdersPerMonth === Infinity ? 'Unlimited orders' : `${monthlyOrders} / ${limits.maxOrdersPerMonth} orders this month`}
                    {' · '}
                    {limits.maxUsers === Infinity ? 'Unlimited users' : `${userCount} / ${limits.maxUsers} users`}
                  </p>
                </div>
              </div>
              {plan !== 'enterprise' && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all active:scale-[0.98]"
                  style={{ background: PLAN_ACCENT[plan] ?? '#FF6B35' }}>
                  Upgrade <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Usage bars */}
            {limits.maxOrdersPerMonth !== Infinity && (
              <div className="mt-4 space-y-2.5">
                {/* Orders bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--caption)' }}>
                    <span>Orders this month</span>
                    <span>{monthlyOrders} / {limits.maxOrdersPerMonth}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--edge-strong)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (monthlyOrders / limits.maxOrdersPerMonth) * 100)}%`,
                        background: monthlyOrders >= limits.maxOrdersPerMonth ? '#ef4444' : PLAN_ACCENT[plan],
                      }} />
                  </div>
                </div>
                {/* Users bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--caption)' }}>
                    <span>Users</span>
                    <span>{userCount} / {limits.maxUsers}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--edge-strong)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (userCount / limits.maxUsers) * 100)}%`,
                        background: userCount >= limits.maxUsers ? '#ef4444' : PLAN_ACCENT[plan],
                      }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick-access: moved nav items */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--caption)' }}>
            Administration
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {QUICK_LINKS.map(({ icon: Icon, label, desc, path }, i) => (
              <motion.button
                key={path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-150 group"
                style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT_GLOW}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--edge)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT_GLOW, border: `1px solid ${ACCENT}30` }}>
                  <Icon size={16} style={{ color: ACCENT }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>{label}</p>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--body)' }}>{desc}</p>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--caption)' }} className="shrink-0" />
              </motion.button>
            ))}
          </div>

          {/* Appearance row */}
          <div className="flex items-center justify-between p-4 rounded-xl mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Palette size={16} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--heading)' }}>Theme</p>
                <p className="text-[11px]" style={{ color: 'var(--body)' }}>Light, dark, or system default</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--heading)' }}>Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50" style={{ background: 'var(--brand)' }}
          >
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        {/* Section 1: System Config */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--edge)' }}>
            <Monitor size={24} style={{ color: 'var(--brand)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>System Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--body)' }}>Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full rounded-lg p-3 focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--body)' }}>Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full rounded-lg p-3 focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--body)' }}>Company Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="w-full rounded-lg p-3 focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Security */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
           <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--edge)' }}>
            <Shield size={24} style={{ color: 'var(--brand)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>Security Settings</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--body)' }}>Password Policy Requirements</label>
              <textarea
                value={settings.password_policy}
                onChange={(e) => handleChange('password_policy', e.target.value)}
                className="w-full rounded-lg p-3 focus:outline-none h-24 resize-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--body)' }}>Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', e.target.value)}
                  className="w-full rounded-lg p-3 focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                  <div>
                     <label className="text-sm font-medium block" style={{ color: 'var(--heading)' }}>Two-Factor Authentication</label>
                     <p className="text-xs" style={{ color: 'var(--body)' }}>Enforce 2FA for all admin users</p>
                  </div>
                  <button
                    onClick={() => handle2FAToggle(!settings.mfa_enabled)}
                    disabled={enrolling2FA}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.mfa_enabled ? '' : 'bg-gray-700'} ${enrolling2FA ? 'opacity-50' : ''}`}
                    style={settings.mfa_enabled ? { background: 'var(--brand)' } : {}}
                  >
                    {enrolling2FA
                      ? <Loader2 size={12} className="animate-spin absolute top-1.5 left-2.5 text-white" />
                      : <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.mfa_enabled ? 'left-7' : 'left-1'}`} />
                    }
                  </button>
                </div>
                {totpData && (
                  <div className="p-4 rounded-lg border" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--heading)' }}>Scan this QR code with your authenticator app (e.g. Google Authenticator):</p>
                    {totpData.qr_code && (
                      <img src={totpData.qr_code} alt="TOTP QR Code" className="w-40 h-40 mx-auto rounded-lg bg-white p-1 mb-3" />
                    )}
                    <p className="text-xs text-center" style={{ color: 'var(--body)' }}>
                      Or enter the secret manually: <span className="font-mono font-bold" style={{ color: 'var(--brand)' }}>{totpData.secret}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-400">2FA enrollment initiated. Verify with a code from your app to complete setup.</p>
                    </div>
                    <button onClick={() => setTotpData(null)} className="mt-2 text-xs" style={{ color: 'var(--body)' }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Email & Notifications */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
           <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--edge)' }}>
            <Bell size={24} style={{ color: 'var(--brand)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>Notifications</h2>
          </div>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                <div>
                   <label className="text-sm font-medium block" style={{ color: 'var(--heading)' }}>Admin Alerts</label>
                   <p className="text-xs" style={{ color: 'var(--body)' }}>Receive system alerts for critical failures</p>
                </div>
                <button
                  onClick={() => handleChange('alert_admins', !settings.alert_admins)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.alert_admins ? '' : 'bg-gray-700'}`}
                  style={settings.alert_admins ? { background: 'var(--brand)' } : {}}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.alert_admins ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                <div>
                   <label className="text-sm font-medium block" style={{ color: 'var(--heading)' }}>Email Notifications</label>
                   <p className="text-xs" style={{ color: 'var(--body)' }}>Send automatic emails to users for account events</p>
                </div>
                <button
                  onClick={() => handleChange('email_notifications', !settings.email_notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.email_notifications ? '' : 'bg-gray-700'}`}
                  style={settings.email_notifications ? { background: 'var(--brand)' } : {}}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.email_notifications ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Section 4: Webhook Integrations */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--edge)' }}>
            <Webhook size={24} style={{ color: 'var(--brand)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>Webhook Integrations</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--body)' }}>
            Register ERP or third-party endpoints to receive real-time event notifications.
          </p>

          {/* Add form */}
          <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--caption)' }}>New Webhook</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--body)' }}>Event Type</label>
                <select
                  value={webhookForm.event_type}
                  onChange={e => setWebhookForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                >
                  <option value="order.status_changed">order.status_changed</option>
                  <option value="bid.awarded">bid.awarded</option>
                  <option value="po.issued">po.issued</option>
                  <option value="invoice.created">invoice.created</option>
                  <option value="invoice.approved">invoice.approved</option>
                  <option value="invoice.paid">invoice.paid</option>
                  <option value="contract.activated">contract.activated</option>
                  <option value="contract.terminated">contract.terminated</option>
                  <option value="contract.renewed">contract.renewed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--body)' }}>Endpoint URL *</label>
                <input
                  type="url"
                  value={webhookForm.endpoint_url}
                  onChange={e => setWebhookForm(f => ({ ...f, endpoint_url: e.target.value }))}
                  placeholder="https://your-erp.com/webhook"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--body)' }}>Secret (optional)</label>
                <input
                  type="text"
                  value={webhookForm.secret}
                  onChange={e => setWebhookForm(f => ({ ...f, secret: e.target.value }))}
                  placeholder="signing secret"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                />
              </div>
            </div>
            <button
              onClick={handleAddWebhook}
              disabled={savingWebhook}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors" style={{ background: 'var(--brand)' }}
            >
              {savingWebhook ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Webhook
            </button>
          </div>

          {/* Fire pending retries */}
          <div className="flex justify-end mb-3">
            <button
              onClick={handleFirePendingRetries}
              disabled={firingRetries}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--body)' }}
            >
              {firingRetries ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Fire pending retries
            </button>
          </div>

          {/* Webhook list */}
          {webhooks.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--caption)' }}>No webhooks registered yet.</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map(wh => (
                <div key={wh.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--edge)' }}>
                  {/* Row */}
                  <div className="flex items-center gap-3 p-3" style={{ background: 'var(--surface-raised)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,53,0.12)', color: 'var(--brand)' }}>{wh.event_type}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${wh.active ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
                          {wh.active ? 'Active' : 'Inactive'}
                        </span>
                        {(wh.delivery_success_count > 0 || wh.delivery_failure_count > 0) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--caption)' }}>
                            ✓{wh.delivery_success_count || 0} ✗{wh.delivery_failure_count || 0}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--body)' }}>{wh.endpoint_url}</p>
                    </div>
                    <button
                      onClick={() => toggleExpand(wh.id)}
                      className="text-xs px-2 py-1 rounded-lg font-medium transition-colors flex items-center gap-1"
                      style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--caption)' }}
                    >
                      {expandedWebhook === wh.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      History
                    </button>
                    <button
                      onClick={() => toggleWebhook(wh.id, !wh.active)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                      style={{ background: 'var(--surface)', border: '1px solid var(--edge)', color: 'var(--body)' }}
                    >
                      {wh.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteWebhook(wh.id)}
                      className="text-red-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Delivery history panel */}
                  {expandedWebhook === wh.id && (
                    <div className="p-3 pt-0" style={{ background: 'var(--surface)' }}>
                      <div className="pt-3" style={{ borderTop: '1px solid var(--edge)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--caption)' }}>Recent Deliveries</p>
                        {loadingDeliveries[wh.id] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--caption)' }} />
                          </div>
                        ) : !deliveries[wh.id]?.length ? (
                          <p className="text-xs py-3 text-center" style={{ color: 'var(--caption)' }}>No deliveries yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {deliveries[wh.id].map(d => {
                              const statusColor = d.status === 'success'
                                ? 'text-emerald-400 bg-emerald-950/40'
                                : d.status === 'dead_lettered'
                                  ? 'text-red-400 bg-red-950/40'
                                  : d.status === 'failed'
                                    ? 'text-amber-400 bg-amber-950/40'
                                    : 'text-slate-400 bg-slate-800/40';
                              const canRetry = d.status === 'failed' || d.status === 'dead_lettered';
                              return (
                                <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${statusColor}`}>{d.status}</span>
                                  <span className="text-[10px] shrink-0" style={{ color: 'var(--caption)' }}>
                                    {d.response_status ? `HTTP ${d.response_status}` : '—'}
                                  </span>
                                  <span className="text-[10px] shrink-0" style={{ color: 'var(--caption)' }}>
                                    attempt {d.attempt_count}
                                  </span>
                                  {d.error_message && (
                                    <span className="text-[10px] truncate flex-1 text-amber-400 flex items-center gap-1">
                                      <AlertTriangle size={10} className="shrink-0" />
                                      {d.error_message}
                                    </span>
                                  )}
                                  <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--caption)' }}>
                                    {d.last_attempted_at ? new Date(d.last_attempted_at).toLocaleString() : new Date(d.created_at).toLocaleString()}
                                  </span>
                                  {canRetry && (
                                    <button
                                      onClick={() => handleRetryDelivery(d.id, wh.id)}
                                      disabled={retryingDelivery[d.id]}
                                      className="shrink-0 text-[10px] px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1"
                                      style={{ background: 'rgba(255,107,53,0.12)', color: 'var(--brand)', border: '1px solid rgba(255,107,53,0.2)' }}
                                    >
                                      {retryingDelivery[d.id] ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                      Retry
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Slack Integration */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--edge)' }}>
            <MessageSquare size={24} style={{ color: 'var(--brand)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>Slack Integration</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--body)' }}>
            Connect Slack to receive real-time notifications for order status changes, bids, and purchase orders.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--heading)' }}>Webhook URL</label>
              <input
                type="url"
                value={settings.slack_webhook_url || ''}
                onChange={e => handleChange('slack_webhook_url', e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--body)' }}>Create an Incoming Webhook in your Slack workspace settings.</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--heading)' }}>Channel (optional)</label>
              <input
                type="text"
                value={settings.slack_channel || ''}
                onChange={e => handleChange('slack_channel', e.target.value)}
                placeholder="#procurement-alerts"
                className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
              />
            </div>
            <button
              onClick={async () => {
                try {
                  if (settings.slack_webhook_url) await saveSlackWebhookUrl(settings.slack_webhook_url);
                  if (settings.slack_channel) await saveSlackChannel(settings.slack_channel);
                  toast({ title: 'Slack Settings Saved', description: 'Slack integration configured successfully.' });
                } catch (err) {
                  toast({ title: 'Error', description: 'Failed to save Slack settings.', variant: 'destructive' });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors" style={{ background: 'var(--brand)' }}
            >
              <Save size={16} /> Save Slack Settings
            </button>
          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default SettingsPage;