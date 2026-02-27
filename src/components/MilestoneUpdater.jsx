import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Circle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logMilestoneUpdate } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';

const milestones = [
  { id: 'material_arrived', label: 'Material Arrived' },
  { id: 'machining_started', label: 'Machining Started' },
  { id: 'post_processing', label: 'Post-Processing' },
  { id: 'inspection_ready', label: 'Inspection Ready' },
];

const MilestoneUpdater = ({ orderId, currentMilestone, onUpdate }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const currentIndex = milestones.findIndex(m => m.id === currentMilestone);
  const nextMilestone = milestones[currentIndex + 1];

  const handleUpdate = async () => {
    if (!nextMilestone) return;
    
    if (!confirm(`Are you sure you want to mark "${nextMilestone.label}" as complete?`)) return;

    setUpdating(true);
    try {
      // 1. Update Orders Table
      const { error: orderError } = await supabase
        .from('orders')
        .update({ current_milestone: nextMilestone.id })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 2. Insert into Job Milestones
      const { error: milestoneError } = await supabase
        .from('job_milestones')
        .insert({
          order_id: orderId,
          milestone_type: nextMilestone.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (milestoneError) throw milestoneError;

      // 3. Log Audit
      await logMilestoneUpdate(currentUser.id, orderId, nextMilestone.label);

      toast({
        title: "Milestone Updated",
        description: `${nextMilestone.label} has been marked as complete.`,
        className: "bg-emerald-600 border-emerald-700 text-white"
      });

      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Failed to update milestone:', error);
      toast({
        title: "Update Failed",
        description: "Could not update milestone. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-100">Production Progress</h3>
        {nextMilestone ? (
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Mark {nextMilestone.label} Complete
          </button>
        ) : (
          <span className="text-emerald-500 font-bold text-sm flex items-center gap-2">
            <Check size={16} /> All Milestones Complete
          </span>
        )}
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0">
        {/* Connector Line */}
        <div className="hidden md:block absolute left-0 top-[18px] w-full h-1 bg-slate-800 -z-0" />
        
        {milestones.map((m, index) => {
          const isCompleted = index <= currentIndex;
          const isNext = index === currentIndex + 1;
          
          return (
            <div key={m.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-[#0f172a] border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : isNext
                      ? 'bg-[#0f172a] border-sky-500 text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse'
                      : 'bg-[#0f172a] border-slate-700 text-slate-700'
                  }
                `}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <Circle size={14} fill="currentColor" />}
              </div>
              <div className="md:text-center md:absolute md:top-14 md:w-32">
                <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : isNext ? 'text-sky-400' : 'text-slate-500'}`}>
                  {m.label}
                </p>
                {isCompleted && (
                  <p className="text-[10px] text-slate-500 mt-1">Completed</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneUpdater;