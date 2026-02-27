import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Circle, MapPin, Package, Settings, ClipboardCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const stages = [
  { id: 1, key: 'po_received', label: 'PO Received', description: 'Order confirmed', icon: ClipboardCheck },
  { id: 2, key: 'material_sourced', label: 'Material Sourced', description: 'Supply secured', icon: Package },
  { id: 3, key: 'in_production', label: 'In Production', description: 'Manufacturing', icon: Settings },
  { id: 4, key: 'qc_certified', label: 'RZ Quality Certified', description: 'Verified', icon: MapPin }, // Using MapPin as placeholder for certification if needed, or stick to Check
  { id: 5, key: 'dispatched', label: 'Dispatched', description: 'En route', icon: Truck },
];

const EnhancedJourneyStepper = ({ orderId, currentStatus }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Map string status to stage number
  const getStageNumber = (status) => {
    switch (status) {
      case 'active': // mapped to Material Sourced for simplicity in this demo logic
      case 'material_sourced': return 2;
      case 'processing': 
      case 'in_production': return 3;
      case 'qc_approved':
      case 'sanitised': return 4;
      case 'dispatched':
      case 'completed': return 5;
      default: return 1;
    }
  };

  useEffect(() => {
    setCurrentStep(getStageNumber(currentStatus));
  }, [currentStatus]);

  // Real-time listener for this specific order
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase.channel(`order-stepper-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `id=eq.${orderId}` 
      }, (payload) => {
        if (payload.new && payload.new.status) {
          setCurrentStep(getStageNumber(payload.new.status));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <div className="w-full py-8 px-4">
      <div className="relative flex items-center justify-between w-full">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full" />
        
        {/* Active Progress Bar */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-cyan-500 -z-10 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {stages.map((stage, index) => {
          const isCompleted = currentStep > stage.id;
          const isCurrent = currentStep === stage.id;
          const StepIcon = stage.icon;

          return (
            <div key={stage.id} className="flex flex-col items-center relative group">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-[#020617] z-10",
                  isCompleted ? "border-emerald-500 text-emerald-500 bg-emerald-950/20" :
                  isCurrent ? "border-cyan-500 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] bg-cyan-950/20 scale-110" :
                  "border-slate-800 text-slate-700 bg-slate-950"
                )}
              >
                {isCompleted ? <Check size={20} strokeWidth={3} /> :
                 isCurrent ? <StepIcon size={20} className="animate-pulse" /> :
                 <Circle size={14} fill="currentColor" />}
              </motion.div>
              
              <div className="absolute top-16 text-center w-32">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300",
                  isCompleted ? "text-emerald-400" :
                  isCurrent ? "text-cyan-400" :
                  "text-slate-600"
                )}>
                  {stage.label}
                </p>
                <p className={cn(
                  "text-[10px] transition-colors duration-300",
                  isCurrent ? "text-slate-300" : "text-slate-600"
                )}>
                  {stage.description}
                </p>
                {isCurrent && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-[9px] font-mono text-cyan-600"
                  >
                    IN PROGRESS
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedJourneyStepper;