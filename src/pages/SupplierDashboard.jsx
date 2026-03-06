import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, Briefcase, FileText, CheckCircle, Package, Clock, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SupplierDashboard = () => {
  const { currentUser, userCompanyName } = useAuth();
  const [stats, setStats] = useState({ awarded: 0, completed: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        const [awardedRes, completedRes, activityRes] = await Promise.all([
          supabase.from('orders').select('id', {count: 'exact'}).eq('supplier_id', currentUser.id).in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH']),
          supabase.from('orders').select('id', {count: 'exact'}).eq('supplier_id', currentUser.id).eq('order_status', 'DELIVERED'),
          supabase.from('orders').select('id, public_name, order_status, updated_at').eq('supplier_id', currentUser.id).order('updated_at', { ascending: false }).limit(5)
        ]);

        setStats({
          awarded: awardedRes.count || 0,
          completed: completedRes.count || 0
        });
        
        if (activityRes.data) setActivities(activityRes.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please refresh the page.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const StatCard = ({ icon: Icon, title, value, color, path }) => (
    <div 
      onClick={() => navigate(path)}
      className="bg-[#0f172a] border border-slate-800 p-6 rounded-xl shadow-lg hover:border-orange-500/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <SupplierHubLayout>
      <Helmet><title>Dashboard - RZ Supplier Hub</title></Helmet>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome back, {userCompanyName || 'Supplier'}</h1>
          <p className="text-slate-400">Here's what's happening with your manufacturing pipeline today.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-20 h-full">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">Unable to Load Dashboard</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatCard icon={Package} title="Active Orders" value={stats.awarded} color="text-emerald-400" path="/supplier-hub/orders" />
            <StatCard icon={CheckCircle} title="Completed Jobs" value={stats.completed} color="text-orange-400" path="/supplier-hub/orders" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Clock size={20} className="text-orange-500" /> Recent Activity</h2>
               </div>
               <div className="space-y-4">
                 {activities.map((act, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg border border-slate-800">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                         <LayoutDashboard size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-200">{act.public_name || 'Unnamed Order'}</p>
                         <p className="text-xs text-slate-400">Status changed to <span className="text-orange-400">{act.order_status?.replace(/_/g, ' ')}</span></p>
                       </div>
                     </div>
                     <span className="text-xs text-slate-500">{new Date(act.updated_at).toLocaleDateString()}</span>
                   </div>
                 ))}
                 {activities.length === 0 && (
                   <div className="text-center py-8 text-slate-500">No recent activity found.</div>
                 )}
               </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-xl">
               <h2 className="text-lg font-bold text-slate-100 mb-6">Quick Actions</h2>
               <div className="space-y-3">
                 <Button onClick={() => navigate('/supplier-hub/orders')} className="w-full justify-between bg-[#1e293b] hover:bg-orange-900/30 text-slate-300 hover:text-orange-400 border border-slate-800 hover:border-orange-800">
                   View My Orders <ArrowRight size={16} />
                 </Button>
                 <Button onClick={() => navigate('/supplier-hub/documents')} className="w-full justify-between bg-[#1e293b] hover:bg-orange-900/30 text-slate-300 hover:text-orange-400 border border-slate-800 hover:border-orange-800">
                   Document Portal <ArrowRight size={16} />
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </SupplierHubLayout>
  );
};

export default SupplierDashboard;