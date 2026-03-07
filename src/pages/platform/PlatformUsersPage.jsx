import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PlatformOwnerLayout from '@/components/PlatformOwnerLayout';
import { useToast } from '@/components/ui/use-toast';

const ROLES = ['client', 'supplier', 'admin', 'platform_owner'];

const roleStyle = {
  client: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  supplier: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  admin: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  platform_owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const PlatformUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'client', company_name: '', status: 'beta' });
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, company_name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.company_name || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const createUser = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Email and password are required.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      // Create auth user via Supabase admin (signUp with auto-confirm)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { role: form.role, company_name: form.company_name },
        },
      });

      if (authError) throw authError;

      // Update profile with role, company, status
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: form.email,
          role: form.role,
          company_name: form.company_name,
          status: form.status,
        });
      }

      toast({ title: 'User created', description: `${form.email} created as ${form.role}` });
      setShowForm(false);
      setForm({ email: '', password: '', role: 'client', company_name: '', status: 'beta' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error creating user', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (id, newRole) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated', description: `Role changed to ${newRole}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PlatformOwnerLayout>
      <Helmet><title>Users — Platform Owner</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={26} className="text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Users</h1>
              <p className="text-slate-400 text-sm">Create and manage all platform users</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
            >
              <Plus size={16} />
              New User
            </button>
          </div>
        </div>

        {/* Create User Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#12121e] border border-amber-500/20 rounded-xl p-6"
          >
            <h2 className="text-base font-semibold text-slate-200 mb-4">Create New User</h2>
            <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                  placeholder="Acme Ltd"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Plan Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50"
                >
                  {['beta', 'trial', 'active', 'suspended'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm transition-colors"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#12121e] border border-amber-500/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Table */}
        <div className="bg-[#12121e] border border-amber-500/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-200 font-medium">{u.company_name || u.email}</p>
                      {u.company_name && <p className="text-xs text-slate-500">{u.email}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${roleStyle[u.role] || 'bg-slate-700/50 text-slate-400 border-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{u.status || '—'}</td>
                    <td className="px-6 py-4">
                      <select
                        disabled={updatingId === u.id}
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer disabled:opacity-50"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} shown
          </div>
        </div>

      </motion.div>
    </PlatformOwnerLayout>
  );
};

export default PlatformUsersPage;
