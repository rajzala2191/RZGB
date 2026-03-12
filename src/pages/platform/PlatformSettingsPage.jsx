import PlatformAdminLayout from '@/components/PlatformAdminLayout';
import { Settings, ExternalLink } from 'lucide-react';

export default function PlatformSettingsPage() {
  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Platform-level configuration. Workspace and auth are managed in Supabase.</p>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <Settings size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Configuration</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Manage Supabase project, auth, and Edge Functions from the Supabase Dashboard.</p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-500"
          >
            Open Supabase Dashboard <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </PlatformAdminLayout>
  );
}
