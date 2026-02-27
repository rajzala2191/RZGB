import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const MILESTONES = [
  { key: 'material_arrived', label: 'Material Arrived' },
  { key: 'machining_started', label: 'Machining Started' },
  { key: 'post_processing', label: 'Post-Processing' },
  { key: 'inspection_ready', label: 'Inspection Ready' }
];

const MilestoneTrackingDetails = ({ orderId }) => {
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async () => {
    if (!orderId) return;
    try {
      const { data, error } = await supabase
        .from('job_milestones')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;

      // Transform array to object keyed by type
      const milestoneMap = {};
      data?.forEach(m => {
        milestoneMap[m.milestone_type] = m;
      });
      setMilestones(milestoneMap);
    } catch (err) {
      console.error("Error fetching milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();

    const channel = supabase.channel(`milestones-${orderId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'job_milestones', 
        filter: `order_id=eq.${orderId}` 
      }, () => {
        fetchMilestones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) return <div className="h-24 bg-slate-900/50 animate-pulse rounded-lg"></div>;

  // Determine current active index based on completed milestones
  let activeIndex = -1;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (milestones[MILESTONES[i].key]) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Manufacturing Milestones</h3>
        <span className="text-xs text-cyan-500 font-mono animate-pulse">● Live Updates</span>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 pb-2">
        {MILESTONES.map((step, index) => {
          const milestone = milestones[step.key];
          const isCompleted = !!milestone;
          const isNext = !isCompleted && index === activeIndex + 1;

          return (
            <div key={step.key} className="relative pl-8 group">
              {/* Dot Indicator */}
              <div className={`
                absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 bg-[#0f172a]
                ${isCompleted ? 'border-emerald-500 text-emerald-500' : 
                  isNext ? 'border-cyan-500 text-cyan-500 animate-pulse' : 'border-slate-700 text-slate-700'}
              `}>
                {isCompleted && <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                    {step.label}
                  </h4>
                  {isCompleted && (
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {milestone.completed_at ? format(new Date(milestone.completed_at), 'MMM dd, HH:mm') : '-'}
                      </span>
                    </div>
                  )}
                  {isNext && (
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <Clock size={12} /> Pending Supplier
                      </span>
                    </div>
                  )}
                  {!isCompleted && !isNext && (
                    <div className="flex flex-col mt-1 opacity-50">
                       <span className="text-xs text-slate-600 flex items-center gap-1">
                         <Circle size={10} /> Queued
                       </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTrackingDetails;