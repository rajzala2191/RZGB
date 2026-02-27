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
        // Since we don't have a dedicated activity log table populated yet in the prompt context,
        // we'll simulate activity using the 'profiles' table created_at dates.
        // In a real app, this would query an 'audit_logs' or 'events' table.
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
      case 'client': return <Briefcase className="w-4 h-4 text-green-400" />;
      default: return <UserPlus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[400px] flex flex-col items-center justify-center text-red-400 gap-2">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start pb-4 border-b border-gray-800 last:border-0 last:pb-0">
              <div className="mt-1 bg-gray-900 p-2 rounded-full border border-gray-800">
                {getIcon(activity.role)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 font-medium truncate">
                  New <span className="capitalize text-[#FF6B35]">{activity.role}</span> joined
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {activity.email} 
                  {activity.company_name && <span className="text-gray-600"> • {activity.company_name}</span>}
                </p>
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;