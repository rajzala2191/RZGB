import { useMemo } from 'react';
import {
  Server,
  Database,
  Shield,
  Key,
  FileCode,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0] : '';

const EDGE_FUNCTIONS = [
  {
    name: 'approve-demo-request',
    description: 'Approves a demo request, stores token, and sends demo link email via Resend.',
    secrets: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SITE_URL', 'RESEND_API_KEY', 'RESEND_FROM'],
  },
  {
    name: 'admin-set-password',
    description: 'Sets or resets a user password (admin only).',
    secrets: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    name: 'invite-user',
    description: 'Sends workspace invite emails.',
    secrets: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SITE_URL'],
  },
  {
    name: 'delete-user',
    description: 'Deletes a user and related data (admin only).',
    secrets: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    name: 'scrub-drawing',
    description: 'Sanitises drawing files (e.g. metadata removal).',
    secrets: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
];

const MIGRATIONS = [
  '20260308_manufacturing_processes',
  '20260309_demo_isolation',
  '20260310_documents_fk_cascade_on_delete',
  '20260311_procurement_tier1',
  '20260312_* (procurement_tier2, supplier_*, multi_currency, webhooks, RLS, etc.)',
  '20260313_process_templates',
  '20260313_process_sub_steps',
  '20260314_workspace_tenancy_and_RLS',
  '20260315_demo_requests_and_RPCs',
  '20260316_super_admin_role_and_policies',
];

const RLS_SUMMARY = [
  { table: 'demo_requests', policies: 'SELECT/UPDATE: is_super_admin(); INSERT: anon/authenticated (pending only).' },
  { table: 'profiles', policies: 'Tenant-scoped and role-based; is_super_admin() for platform-wide access.' },
  { table: 'workspaces', policies: 'Super admin full access; workspace admins see own workspace.' },
  { table: 'orders, documents, etc.', policies: 'Workspace and role-based visibility.' },
];

const ALL_SECRET_NAMES = [...new Set(EDGE_FUNCTIONS.flatMap((f) => f.secrets))].sort();

export default function PlatformSettingsPage() {
  const [copied, setCopied] = useState(null);
  const [openSections, setOpenSections] = useState({
    project: true,
    functions: true,
    database: true,
    rls: true,
    env: true,
  });

  const maskedUrl = useMemo(() => {
    if (!SUPABASE_URL) return 'Not configured';
    try {
      const u = new URL(SUPABASE_URL);
      return `${u.origin.replace(/^https:\/\//, '')} • Project ref: ${PROJECT_REF || '—'}`;
    } catch {
      return 'Invalid URL';
    }
  }, []);

  const toggle = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform</p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Supabase configuration</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Project-level configuration, Edge Functions, database migrations, and security. All values are managed in your Supabase project.
        </p>
      </div>

      {/* Project overview */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('project')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-[#1f1f23] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Server size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Project overview</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Supabase project URL and identifier</p>
            </div>
          </div>
          {openSections.project ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>
        {openSections.project && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-[#232329]">
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="text-sm bg-gray-100 dark:bg-[#232329] text-gray-800 dark:text-slate-200 px-3 py-2 rounded-lg font-mono">
                {maskedUrl}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(SUPABASE_URL || '', 'project-url')}
                className="p-2 rounded-lg border border-gray-200 dark:border-[#2e2e35] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#232329]"
                title="Copy URL"
              >
                {copied === 'project-url' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              Used by the app and Edge Functions. Project ref is used in Supabase Dashboard URLs.
            </p>
          </div>
        )}
      </section>

      {/* Edge Functions */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('functions')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-[#1f1f23] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <FileCode size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Edge Functions</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{EDGE_FUNCTIONS.length} functions deployed</p>
            </div>
          </div>
          {openSections.functions ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>
        {openSections.functions && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-[#232329] overflow-x-auto">
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-[#232329]">
                  <th className="pb-2 pr-4">Function</th>
                  <th className="pb-2 pr-4">Purpose</th>
                  <th className="pb-2">Required secrets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#232329]">
                {EDGE_FUNCTIONS.map((fn) => (
                  <tr key={fn.name}>
                    <td className="py-3 pr-4 font-mono font-semibold text-gray-900 dark:text-slate-100">{fn.name}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-slate-300">{fn.description}</td>
                    <td className="py-3">
                      <span className="text-gray-500 dark:text-slate-400 font-mono text-xs">
                        {fn.secrets.join(', ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Database & migrations */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('database')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-[#1f1f23] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
              <Database size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Database & migrations</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Schema and RPCs</p>
            </div>
          </div>
          {openSections.database ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>
        {openSections.database && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-[#232329]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mt-4 mb-2">Migrations (apply via Supabase CLI or Dashboard)</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-300 space-y-1">
              {MIGRATIONS.map((m) => (
                <li key={m} className="font-mono text-xs">{m}</li>
              ))}
            </ul>
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mt-4 mb-2">Key RPCs</h3>
            <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
              <li><code className="bg-gray-100 dark:bg-[#232329] px-1.5 rounded">submit_demo_request(p_email)</code> — anon; inserts pending demo request.</li>
              <li><code className="bg-gray-100 dark:bg-[#232329] px-1.5 rounded">check_demo_token(p_token)</code> — anon/authenticated; returns true if token is approved.</li>
              <li><code className="bg-gray-100 dark:bg-[#232329] px-1.5 rounded">is_super_admin()</code> — used in RLS; true for role = super_admin or admin + platform scope.</li>
            </ul>
          </div>
        )}
      </section>

      {/* RLS summary */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('rls')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-[#1f1f23] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Shield size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Row Level Security (RLS)</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Policies summary</p>
            </div>
          </div>
          {openSections.rls ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>
        {openSections.rls && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-[#232329] overflow-x-auto">
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-[#232329]">
                  <th className="pb-2 pr-4">Table</th>
                  <th className="pb-2">Policies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#232329]">
                {RLS_SUMMARY.map((r) => (
                  <tr key={r.table}>
                    <td className="py-3 pr-4 font-mono font-semibold text-gray-900 dark:text-slate-100">{r.table}</td>
                    <td className="py-3 text-gray-600 dark:text-slate-300">{r.policies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Environment / secrets */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('env')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-[#1f1f23] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <Key size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Environment & secrets</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Variable names used by Edge Functions (values set in Supabase)</p>
            </div>
          </div>
          {openSections.env ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>
        {openSections.env && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-[#232329]">
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-4">
              Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets (or via CLI). Values are never shown here.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {ALL_SECRET_NAMES.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-xs font-mono bg-gray-100 dark:bg-[#232329] text-gray-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2e2e35]"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(name, `env-${name}`)}
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-[#2e2e35]"
                    title="Copy name"
                  >
                    {copied === `env-${name}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
              To edit secrets or other project settings, use{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                Supabase Dashboard
              </a>
              {PROJECT_REF && (
                <> → select project <strong>{PROJECT_REF}</strong></>
              )}
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
