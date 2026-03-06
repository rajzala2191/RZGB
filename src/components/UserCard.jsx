import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Truck, MoreVertical, Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    border: 'border-orange-500/40',
    glow: 'shadow-orange-500/10',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dot: 'bg-orange-400',
    avatar: 'from-orange-600 to-orange-800',
  },
  client: {
    label: 'Client',
    icon: User,
    border: 'border-orange-500/40',
    glow: 'shadow-orange-500/10',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dot: 'bg-orange-400',
    avatar: 'from-orange-600 to-orange-800',
  },
  supplier: {
    label: 'Supplier',
    icon: Truck,
    border: 'border-blue-500/40',
    glow: 'shadow-blue-500/10',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    avatar: 'from-blue-600 to-blue-800',
  },
};

const STATUS_CONFIG = {
  active: { dot: 'bg-emerald-400', label: 'Active', text: 'text-emerald-400' },
  pending: { dot: 'bg-yellow-400 animate-pulse', label: 'Pending', text: 'text-yellow-400' },
  deactivated: { dot: 'bg-red-500', label: 'Deactivated', text: 'text-red-400' },
};

const UserCard = ({ user, orderCount, onClick, index }) => {
  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.client;
  const status = STATUS_CONFIG[user.status || 'pending'];
  const RoleIcon = role.icon;
  const initials = (user.company_name || user.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      className={`
        relative cursor-pointer group rounded-xl border bg-[#0f172a]
        ${role.border} shadow-lg ${role.glow}
        hover:bg-slate-800/60 hover:border-opacity-80
        transition-all duration-200 overflow-hidden
      `}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${
        user.role === 'admin' ? 'from-orange-500 to-orange-300' :
        user.role === 'supplier' ? 'from-blue-500 to-blue-300' :
        'from-orange-500 to-orange-300'
      }`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.avatar} flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0`}>
              {user.logo_url
                ? <img src={user.logo_url} alt="logo" className="w-full h-full object-contain rounded-xl" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-slate-100 font-semibold text-sm truncate max-w-[140px]">
                {user.company_name || 'No Company'}
              </p>
              <p className="text-slate-500 text-xs truncate max-w-[140px]">{user.email}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1 shrink-0" />
        </div>

        {/* Role + Status badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${role.badge}`}>
            <RoleIcon size={11} />
            {role.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={status.text}>{status.label}</span>
          </span>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5">
            <Package size={11} />
            <span>{orderCount ?? 0} order{orderCount !== 1 ? 's' : ''}</span>
          </div>
          <span>
            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
