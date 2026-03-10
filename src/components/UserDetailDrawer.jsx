import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Shield, User, Truck, Mail, Building2, Calendar,
  Package, Edit2, Check, Trash2, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  admin:    { icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200' },
  client:   { icon: User,   color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200' },
  supplier: { icon: Truck,  color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-200' },
};

const UserDetailDrawer = ({ user, orderCount, onClose, onUpdated, onDeleted }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ role: '', company_name: '', status: '' });

  useEffect(() => {
    if (user) {
      setForm({ role: user.role, company_name: user.company_name || '', status: user.status || 'pending' });
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: form.role, company_name: form.company_name, status: form.status })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'User updated', description: 'Changes saved successfully.' });
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
      if (error) throw error;
      toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
      onUpdated();
    } catch (err) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', { body: { user_id: user.id } });
      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        throw new Error(body?.error || error.message);
      }
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User deleted', description: 'User fully removed from the system.' });
      onDeleted(user.id);
      onClose();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.client;
  const RoleIcon = role.icon;
  const initials = (user.company_name || user.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
              user.role === 'supplier' ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                : 'bg-gradient-to-br from-orange-500 to-orange-700'
            }`}>
              {initials}
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-sm">{user.company_name || 'No Company'}</p>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Orders', value: orderCount ?? 0, icon: Package },
              { label: 'Role', value: user.role, icon: RoleIcon },
              { label: 'Status', value: user.status || 'pending', icon: null },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-slate-900 font-bold text-sm capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Profile details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile Details</p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <Mail size={15} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm text-slate-700 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <Building2 size={15} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Company</p>
                  {editing ? (
                    <input
                      value={form.company_name}
                      onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                      className="w-full bg-transparent text-sm text-slate-900 focus:outline-none border-b border-orange-400 pb-0.5"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{user.company_name || '—'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <RoleIcon size={15} className={`${role.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Role</p>
                  {editing ? (
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full bg-white text-sm text-slate-900 focus:outline-none rounded border border-slate-200 px-2 py-1 mt-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="client">Client</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  ) : (
                    <p className={`text-sm capitalize ${role.color}`}>{user.role}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  user.status === 'active' ? 'bg-emerald-500' :
                  user.status === 'deactivated' ? 'bg-red-500' : 'bg-yellow-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Status</p>
                  {editing ? (
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full bg-white text-sm text-slate-900 focus:outline-none rounded border border-slate-200 px-2 py-1 mt-1"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="deactivated">Deactivated</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-700 capitalize">{user.status || 'pending'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <Calendar size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Joined</p>
                  <p className="text-sm text-slate-700">
                    {user.created_at ? format(new Date(user.created_at), 'PPP') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 space-y-3">
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  user.status === 'active'
                    ? 'border border-red-200 text-red-500 hover:bg-red-50'
                    : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {user.status === 'active'
                  ? <><ToggleLeft size={14} /> Deactivate</>
                  : <><ToggleRight size={14} /> Activate</>
                }
              </button>
            </div>
          )}

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-500 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={13} />}
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={13} /> Delete User
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default UserDetailDrawer;
