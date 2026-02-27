import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import UserInvitationForm from '@/components/UserInvitationForm';
import UsersTable from '@/components/UsersTable';
import { Users } from 'lucide-react';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserDeleted = (deletedId) => {
    // Optimistic update
    setUsers(users.filter(u => u.id !== deletedId));
    // Re-fetch to ensure sync (optional)
    fetchUsers();
  };

  const handleUserAdded = () => {
    fetchUsers(); // Refresh the list to show new user
  };
  
  const handleUserUpdated = () => {
    fetchUsers();
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>User Management - Ghost Portal</title>
        <meta name="description" content="Manage users and permissions for RZ Global Solutions Ghost Portal" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#FF6B35]" />
              User Management
            </h1>
            <p className="text-gray-400 mt-1">Invite new users and manage existing access permissions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Invite Form */}
          <div className="xl:col-span-1">
            <UserInvitationForm onSuccess={handleUserAdded} />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-xl p-6"
            >
              <h4 className="text-white font-semibold mb-2">Access Control Notes</h4>
              <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
                <li>Admins have full system access.</li>
                <li>Clients can only see their own projects.</li>
                <li>Suppliers are restricted to assigned jobs.</li>
                <li>Invited users receive an email to set their password.</li>
              </ul>
            </motion.div>
          </div>

          {/* Right Column - Users Table */}
          <div className="xl:col-span-2">
            <UsersTable 
              users={users} 
              loading={loading} 
              onUserDeleted={handleUserDeleted} 
              onUserUpdated={handleUserUpdated}
            />
          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default UserManagementPage;