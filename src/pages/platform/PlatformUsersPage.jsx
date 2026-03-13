import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { setUserAdminScope } from '@/services/workspaceService';
import { format } from 'date-fns';
import {
  Users, Search, Shield, ShieldCheck, Building2, UserCircle,
} from 'lucide-react';

export default function PlatformUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, company_name, admin_scope, workspace_id, status, created_at, workspace:workspace_id(name)')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const toggleScope = async (user) => {
    const newScope = user.admin_scope === 'platform' ? 'workspace' : 'platform';
    try {
      const { error } = await setUserAdminScope(user.id, newScope);
      if (error) throw error;
      toast({ title: 'Updated', description: `${user.email} → ${newScope} scope` });
      loadUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.company_name || '').toLowerCase().includes(term) ||
      (u.workspace?.name || '').toLowerCase().includes(term);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role, scope) => {
    if (role === 'super_admin' || (role === 'admin' && scope === 'platform')) return { label: 'SUPER ADMIN', cls: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' };
    if (role === 'admin') return { label: 'CUSTOMER ADMIN', cls: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' };
    if (role === 'client') return { label: 'CLIENT', cls: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' };
    if (role === 'supplier') return { label: 'SUPPLIER', cls: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400' };
    return { label: role?.toUpperCase(), cls: 'bg-gray-100 border-gray-300 text-gray-500' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Platform</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">All Users</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cross-tenant user directory. Promote/demote admin scope.</p>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search email, company, workspace…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100">
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Customer Admin</option>
            <option value="client">Client</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading users…</div>
        ) : (
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 dark:text-slate-500 uppercase border-b border-gray-200 dark:border-[#232329]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Workspace</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#232329]">
                  {filtered.map(u => {
                    const badge = roleBadge(u.role, u.admin_scope);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#232329]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <UserCircle size={18} className="text-gray-400" />
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-slate-100">{u.email}</p>
                              {u.company_name && <p className="text-xs text-gray-400">{u.company_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 size={11} /> {u.workspace?.name || 'None'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                        <td className="p-4 text-right">
                          {u.role === 'admin' && (
                            <button
                              onClick={() => toggleScope(u)}
                              className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                                u.admin_scope === 'platform'
                                  ? 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                              }`}
                            >
                              {u.admin_scope === 'platform' ? 'Demote to Workspace' : 'Promote to Platform'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}
