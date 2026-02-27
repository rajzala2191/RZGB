import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
  { id: 1, label: 'PO Received', description: 'Order confirmed' },
  { id: 2, label: 'Material Sourced', description: 'Supply secured' },
  { id: 3, label: 'In Production', description: 'Manufacturing' },
  { id: 4, label: 'Quality Certified', description: 'RZ Verified' },
  { id: 5, label: 'Dispatched', description: 'En route' },
];

const JourneyStepper = ({ currentStage }) => {
  // Map string status to stage number for demonstration
  // Adjust mapping based on your actual status values
  const getStageNumber = (status) => {
    switch (status) {
      case 'active': return 2;
      case 'processing': return 3;
      case 'sanitised': return 4;
      case 'completed': return 5;
      default: return 1;
    }
  };

  const currentStep = typeof currentStage === 'number' ? currentStage : getStageNumber(currentStage);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between w-full">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10" />
        
        {/* Active Progress Bar */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-cyan-500 -z-10"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {stages.map((stage, index) => {
          const isCompleted = currentStep > stage.id;
          const isCurrent = currentStep === stage.id;
          const isPending = currentStep < stage.id;

          return (
            <div key={stage.id} className="flex flex-col items-center relative group">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-300 bg-[#020617]",
                  isCompleted ? "border-emerald-500 text-emerald-500" :
                  isCurrent ? "border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" :
                  "border-slate-700 text-slate-700"
                )}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> :
                 isCurrent ? <Clock size={18} className="animate-pulse" /> :
                 <Circle size={12} fill="currentColor" />}
              </motion.div>
              
              <div className="absolute top-12 text-center w-32">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-1",
                  isCompleted ? "text-emerald-500" :
                  isCurrent ? "text-cyan-400" :
                  "text-slate-500"
                )}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-slate-400"
                  >
                    {stage.description}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JourneyStepper;