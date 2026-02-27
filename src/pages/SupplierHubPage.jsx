import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Package, LogOut, ClipboardList, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SupplierHubPage = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, userCompanyName, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    // Validate user exists before attempting logout
    if (currentUser) {
      await logout();
    }
    navigate('/login');
  };

  const handleFeatureClick = () => {
    toast({
      title: "🚧 Feature Coming Soon",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Supplier Hub - RZ Global Solutions Ghost Portal</title>
        <meta name="description" content="Supplier hub for RZ Global Solutions Ghost Portal. Manage jobs, track deliveries, and communicate with clients." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold">Supplier Hub</h1>
                  <p className="text-sm text-gray-400">
                    Role: <span className="text-orange-500 font-semibold capitalize">{userRole}</span>
                    {userCompanyName && ` • ${userCompanyName}`}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome back{userCompanyName && `, ${userCompanyName}`}</h2>
              <p className="text-gray-400">Manage your jobs and deliveries efficiently</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                onClick={handleFeatureClick}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 cursor-pointer hover:border-orange-500 transition-all"
              >
                <ClipboardList className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Active Jobs</h3>
                <p className="text-gray-400 text-sm">View and manage your assigned jobs and tasks</p>
              </motion.div>

              <motion.div
                onClick={handleFeatureClick}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 cursor-pointer hover:border-orange-500 transition-all"
              >
                <Clock className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Deadlines</h3>
                <p className="text-gray-400 text-sm">Track upcoming deadlines and priorities</p>
              </motion.div>

              <motion.div
                onClick={handleFeatureClick}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 cursor-pointer hover:border-orange-500 transition-all"
              >
                <CheckCircle className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Completed Jobs</h3>
                <p className="text-gray-400 text-sm">Review your completed deliveries and feedback</p>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default SupplierHubPage;