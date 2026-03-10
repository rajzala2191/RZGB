import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Shield, User, Truck, MoreVertical, Loader2, AlertCircle, Edit, Mail } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const UsersTable = ({ users, loading, onUserDeleted, onUserUpdated }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-400" />;
      case 'supplier': return <Truck className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'deactivated': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(filteredUsers.map(u => u.id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    else setSelectedUsers([...selectedUsers, id]);
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    setProcessingId('bulk');
    try {
      const updates = selectedUsers.map(id => ({
        id, status: action === 'activate' ? 'active' : 'deactivated', updated_at: new Date()
      }));
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      toast({ title: "Bulk Action Complete", description: `Updated ${selectedUsers.length} users.` });
      onUserUpdated();
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Bulk action failed.", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setProcessingId(editUser.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editUser.role, company_name: editUser.company_name, status: editUser.status })
        .eq('id', editUser.id);
      if (error) throw error;
      toast({ title: "User Updated", description: "Profile saved successfully." });
      onUserUpdated();
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#FF6B35]" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-slate-900 w-full placeholder-slate-400 text-sm"
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm text-slate-500 mr-2">{selectedUsers.length} selected</span>
            <button
              onClick={() => handleBulkAction('activate')}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded hover:bg-green-100"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-100"
            >
              Deactivate
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    className="rounded border-slate-300 accent-[#FF6B35]"
                  />
                </th>
                <th className="p-4 font-medium">User / Email</th>
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-slate-300 accent-[#FF6B35]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-800 font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-500">{user.company_name || '—'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {getRoleIcon(user.role)}
                          <span className="capitalize text-sm text-slate-700">{user.role}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(user.status || 'pending')}`} />
                          <span className="text-sm capitalize text-slate-500">{user.status || 'pending'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white border-slate-200 text-slate-900">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => { setEditUser(user); setIsEditOpen(true); }}
                              className="hover:bg-slate-50 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer">
                              <Mail className="mr-2 h-4 w-4" /> Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-200" />
                            <DropdownMenuItem
                              onClick={() => onUserDeleted && onUserDeleted(user.id)}
                              className="text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        <p>No users found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Email (Read-only)</label>
                <input disabled value={editUser.email} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-400 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Company Name</label>
                <input
                  value={editUser.company_name || ''}
                  onChange={e => setEditUser({...editUser, company_name: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-slate-900 text-sm mt-1 focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Role</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser({...editUser, role: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-900 text-sm mt-1 focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Status</label>
                  <select
                    value={editUser.status || 'pending'}
                    onChange={e => setEditUser({...editUser, status: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-900 text-sm mt-1 focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <button type="submit" disabled={processingId === editUser.id} className="bg-[#FF6B35] text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-600">
                  {processingId === editUser.id ? 'Saving...' : 'Save Changes'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTable;
