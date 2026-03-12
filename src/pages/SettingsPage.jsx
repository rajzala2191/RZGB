import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useToast } from '@/components/ui/use-toast';
import { Save, Shield, Mail, Bell, Monitor, Loader2, MessageSquare, Users, LifeBuoy, ChevronRight, Palette } from 'lucide-react';
import { saveSlackWebhookUrl, saveSlackChannel } from '@/services/slackService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ACCENT, ACCENT_GLOW } from '@/lib/theme';

const QUICK_LINKS = [
  { icon: Users,   label: 'User Management',  desc: 'Manage portal users, roles and access',           path: '/control-centre/users' },
  { icon: Shield,  label: 'Account Security', desc: 'Password policies, 2FA and session management',    path: '/control-centre/account-security' },
  { icon: LifeBuoy,label: 'Support',          desc: 'View and respond to client & supplier tickets',    path: '/control-centre/support' },
];

const SettingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}>
                <div>
                   <label className="text-sm font-medium block" style={{ color: 'var(--heading)' }}>Two-Factor Authentication</label>
                   <p className="text-xs" style={{ color: 'var(--body)' }}>Enforce 2FA for all admin users</p>
                </div>
                <button
                  onClick={() => handleChange('mfa_enabled', !settings.mfa_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.mfa_enabled ? '' : 'bg-gray-700'}`}
                  style={settings.mfa_enabled ? { background: 'var(--brand)' } : {}}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.mfa_enabled ? 'left-7' : 'left-1'}`} />
                </button>
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

        {/* Section 4: Slack Integration */}
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