import { useEffect, useState } from 'react';
import { fetchDemoRequests } from '@/services/demoRequestService';
import { fetchAllWorkspaces } from '@/services/workspaceService';
import { format } from 'date-fns';
import { Mail, Loader2, Building2 } from 'lucide-react';

export default function PlatformActivityPage() {
  const [demoRequests, setDemoRequests] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [demoRes, wsRes] = await Promise.all([
          fetchDemoRequests().catch(() => []),
          fetchAllWorkspaces().then((r) => r.data || []),
        ]);
        setDemoRequests(Array.isArray(demoRes) ? demoRes : []);
        setWorkspaces(Array.isArray(wsRes) ? wsRes : []);
      } catch {
        setDemoRequests([]);
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const events = [
    ...demoRequests.map((r) => ({
      id: `demo-${r.id}`,
      type: 'demo_request',
      label: r.status === 'pending' ? 'Demo requested' : r.status === 'approved' ? 'Demo approved' : 'Demo rejected',
      detail: r.email,
      at: r.approved_at || r.updated_at || r.requested_at,
      icon: Mail,
    })),
    ...workspaces.slice(0, 20).map((w) => ({
      id: `ws-${w.id}`,
      type: 'workspace',
      label: 'Workspace',
      detail: w.name,
      at: w.created_at,
      icon: Building2,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Activity</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Recent demo requests and workspace activity (from Supabase).</p>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
          {events.length === 0 ? (
            <p className="p-8 text-sm text-gray-500 dark:text-slate-400 text-center">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#232329]">
              {events.slice(0, 50).map((ev) => {
                const Icon = ev.icon;
                return (
                  <li key={ev.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-[#131316]">
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{ev.label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{ev.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{format(new Date(ev.at), 'dd MMM yyyy, HH:mm')}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
  );
}
