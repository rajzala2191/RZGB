import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, Shield, Truck, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role, created_at, company_name')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities(data || []);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const getIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-400" />;
      case 'supplier': return <Truck className="w-4 h-4 text-blue-400" />;
      case 'client': return <Briefcase className="w-4 h-4 text-green-500" />;
      default: return <UserPlus className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-[400px] flex flex-col items-center justify-center text-red-500 gap-2">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="mt-1 bg-slate-100 p-2 rounded-full border border-slate-200">
                {getIcon(activity.role)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium truncate">
                  New <span className="capitalize text-[#FF6B35]">{activity.role}</span> joined
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {activity.email}
                  {activity.company_name && <span className="text-slate-300"> • {activity.company_name}</span>}
                </p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 py-8">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
