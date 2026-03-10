import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import UserCard from '@/components/UserCard';
import UserDetailDrawer from '@/components/UserDetailDrawer';
import InviteUserModal from '@/components/InviteUserModal';
import {
  Users, Shield, User, Truck, Plus, Search,
  Loader2, UserCheck, Clock, AlertCircle, Lock
} from 'lucide-react';

const FILTER_TABS = [
  { key: 'all',      label: 'All',       icon: Users  },
  { key: 'client',   label: 'Clients',   icon: User   },
  { key: 'supplier', label: 'Suppliers', icon: Truck  },
  { key: 'admin',    label: 'Admins',    icon: Shield },
];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </motion.div>
);

const DEMO_ADMIN_EMAIL = 'demo.admin@rzglobalsolutions.co.uk';

const UserManagementPage = () => {
  const { currentUser, isDemo } = useAuth();
  const isDemoAdmin = isDemo || currentUser?.email === DEMO_ADMIN_EMAIL;
  const [users, setUsers]               = useState([]);
  const [orderCounts, setOrderCounts]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInvite, setShowInvite]     = useState(false);
  const [showDemoBlock, setShowDemoBlock] = useState(false);

  const fetchUsers = async () => {
    try {
      const query = supabase
        .from('profiles')
        .select('id, email, company_name, role, status, created_at, logo_url')
        .order('created_at', { ascending: false });
      if (isDemoAdmin) query.eq('is_demo', true);
      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('client_id');
      if (error) throw error;
      const counts = {};
      (data || []).forEach(({ client_id }) => {
        if (client_id) counts[client_id] = (counts[client_id] || 0) + 1;
      });
      setOrderCounts(counts);
    } catch (err) {
      console.error('Error fetching order counts:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrderCounts();
  }, []);

  // Re-select updated user from fresh list after update
  const handleUpdated = () => {
    fetchUsers();
    if (selectedUser) {
      // Defer so users state refreshes first
      setTimeout(() => {
        setUsers(prev => {
          const refreshed = prev.find(u => u.id === selectedUser.id);
          if (refreshed) setSelectedUser(refreshed);
          return prev;
        });
      }, 300);
    }
  };

  const handleDeleted = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setSelectedUser(null);
  };

  const stats = useMemo(() => ({
    total:      users.length,
    active:     users.filter(u => u.status === 'active').length,
    pending:    users.filter(u => !u.status || u.status === 'pending').length,
    admins:     users.filter(u => u.role === 'admin').length,
    clients:    users.filter(u => u.role === 'client').length,
    suppliers:  users.filter(u => u.role === 'supplier').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        u.email?.toLowerCase().includes(q) ||
        u.company_name?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>User Management - RZ Global Solutions</title>
      </Helmet>

      <div className="space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Users size={24} className="text-orange-400" />
              User Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage access, roles, and permissions across the portal.</p>
          </div>
          <button
            onClick={() => isDemoAdmin ? setShowDemoBlock(true) : setShowInvite(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-900/20 shrink-0"
          >
            {isDemoAdmin ? <Lock size={16} /> : <Plus size={16} />}
            Invite User
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}     label="Total Users"  value={stats.total}   color="bg-slate-100 text-slate-600" />
          <StatCard icon={UserCheck} label="Active"       value={stats.active}  color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Clock}     label="Pending"      value={stats.pending} color="bg-amber-50 text-amber-600" />
          <StatCard icon={Shield}    label="Admins"       value={stats.admins}  color="bg-orange-50 text-orange-600" />
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all shadow-sm"
            />
          </div>

          {/* Role filter pills */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {FILTER_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${roleFilter === key
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                <Icon size={12} />
                {label}
                {key !== 'all' && (
                  <span className={`text-[10px] ${roleFilter === key ? 'opacity-70' : 'opacity-50'}`}>
                    {key === 'client' ? stats.clients : key === 'supplier' ? stats.suppliers : stats.admins}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User card grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 size={32} className="animate-spin mb-3 text-orange-500" />
            <p className="text-sm">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <AlertCircle size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No users found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  orderCount={orderCounts[user.id] || 0}
                  index={index}
                  onClick={() => setSelectedUser(user)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailDrawer
            user={selectedUser}
            orderCount={orderCounts[selectedUser.id] || 0}
            onClose={() => setSelectedUser(null)}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && !isDemoAdmin && (
          <InviteUserModal
            onClose={() => setShowInvite(false)}
            onSuccess={fetchUsers}
          />
        )}
      </AnimatePresence>

      {/* Demo block modal */}
      <AnimatePresence>
        {showDemoBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowDemoBlock(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
                <Lock size={22} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Not available in demo</h3>
              <p className="text-sm text-slate-500 mb-5">
                Inviting users is disabled in the demo environment. In the live portal, admins can invite clients and suppliers who receive a password setup email.
              </p>
              <button
                onClick={() => setShowDemoBlock(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ControlCentreLayout>
  );
};

export default UserManagementPage;
