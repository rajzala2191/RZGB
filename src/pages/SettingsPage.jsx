import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useToast } from '@/components/ui/use-toast';
import { Save, Shield, Mail, Bell, Monitor, Loader2, MessageSquare } from 'lucide-react';
import { saveSlackWebhookUrl, saveSlackChannel } from '@/services/slackService';

const SettingsPage = () => {
  const { toast } = useToast();
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
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        {/* Section 1: System Config */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <Monitor className="text-[#FF6B35]" size={24} />
            <h2 className="text-xl font-semibold text-white">System Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Company Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Security */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
           <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <Shield className="text-[#FF6B35]" size={24} />
            <h2 className="text-xl font-semibold text-white">Security Settings</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Password Policy Requirements</label>
              <textarea
                value={settings.password_policy}
                onChange={(e) => handleChange('password_policy', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35] h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-800">
                <div>
                   <label className="text-sm font-medium text-white block">Two-Factor Authentication</label>
                   <p className="text-xs text-gray-500">Enforce 2FA for all admin users</p>
                </div>
                <button
                  onClick={() => handleChange('mfa_enabled', !settings.mfa_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.mfa_enabled ? 'bg-[#FF6B35]' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.mfa_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Email & Notifications */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
           <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <Bell className="text-[#FF6B35]" size={24} />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div>
                   <label className="text-sm font-medium text-white block">Admin Alerts</label>
                   <p className="text-xs text-gray-500">Receive system alerts for critical failures</p>
                </div>
                <button
                  onClick={() => handleChange('alert_admins', !settings.alert_admins)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.alert_admins ? 'bg-[#FF6B35]' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.alert_admins ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div>
                   <label className="text-sm font-medium text-white block">Email Notifications</label>
                   <p className="text-xs text-gray-500">Send automatic emails to users for account events</p>
                </div>
                <button
                  onClick={() => handleChange('email_notifications', !settings.email_notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.email_notifications ? 'bg-[#FF6B35]' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.email_notifications ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Section 4: Slack Integration */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <MessageSquare className="text-[#FF6B35]" size={24} />
            <h2 className="text-xl font-semibold text-white">Slack Integration</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Connect Slack to receive real-time notifications for order status changes, bids, and purchase orders.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white block mb-1">Webhook URL</label>
              <input
                type="url"
                value={settings.slack_webhook_url || ''}
                onChange={e => handleChange('slack_webhook_url', e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF6B35]"
              />
              <p className="text-xs text-gray-500 mt-1">Create an Incoming Webhook in your Slack workspace settings.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-white block mb-1">Channel (optional)</label>
              <input
                type="text"
                value={settings.slack_channel || ''}
                onChange={e => handleChange('slack_channel', e.target.value)}
                placeholder="#procurement-alerts"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF6B35]"
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-orange-600 text-white text-sm font-medium transition-colors"
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