import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricsCard = ({ title, value, change, icon: Icon, onClick }) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      whileHover={{ y: -5, borderColor: '#FF6B35' }}
      onClick={onClick}
      className={`
        bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 
        flex flex-col justify-between relative overflow-hidden group
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-[#FF6B35]/10 group-hover:text-[#FF6B35] transition-colors text-gray-400">
            <Icon size={24} />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`flex items-center font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change)}%
          </span>
          <span className="text-gray-500">vs last month</span>
        </div>
      )}
      
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#FF6B35]/5 rounded-full blur-2xl group-hover:bg-[#FF6B35]/10 transition-colors pointer-events-none" />
    </motion.div>
  );
};

export default MetricsCard;