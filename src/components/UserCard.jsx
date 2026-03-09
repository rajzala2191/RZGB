import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Truck, Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    border: 'border-orange-200',
    glow: 'shadow-orange-100',
    badge: 'bg-orange-50 text-orange-600 border-orange-200',
    avatar: 'from-orange-500 to-orange-700',
    accent: 'from-orange-500 to-orange-300',
  },
  client: {
    label: 'Client',
    icon: User,
    border: 'border-orange-200',
    glow: 'shadow-orange-100',
    badge: 'bg-orange-50 text-orange-600 border-orange-200',
    avatar: 'from-orange-500 to-orange-700',
    accent: 'from-orange-500 to-orange-300',
  },
  supplier: {
    label: 'Supplier',
    icon: Truck,
    border: 'border-blue-200',
    glow: 'shadow-blue-100',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    avatar: 'from-blue-500 to-blue-700',
    accent: 'from-blue-500 to-blue-300',
  },
};

const STATUS_CONFIG = {
  active:      { dot: 'bg-emerald-500', label: 'Active',      text: 'text-emerald-600' },
  pending:     { dot: 'bg-amber-400 animate-pulse', label: 'Pending',     text: 'text-amber-600' },
  deactivated: { dot: 'bg-red-500',     label: 'Deactivated', text: 'text-red-600' },
};

const UserCard = ({ user, orderCount, onClick, index }) => {
  const role   = ROLE_CONFIG[user.role] || ROLE_CONFIG.client;
  const status = STATUS_CONFIG[user.status || 'pending'];
  const RoleIcon = role.icon;
  const initials = (user.company_name || user.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      className={`
        relative cursor-pointer group rounded-xl border bg-white
        ${role.border} shadow-sm ${role.glow}
        hover:shadow-md hover:border-opacity-80
        transition-all duration-200 overflow-hidden
      `}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${role.accent}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.avatar} flex items-center justify-center text-white font-bold text-sm shadow shrink-0`}>
              {user.logo_url
                ? <img src={user.logo_url} alt="logo" className="w-full h-full object-contain rounded-xl" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 font-semibold text-sm truncate max-w-[140px]">
                {user.company_name || 'No Company'}
              </p>
              <p className="text-slate-400 text-xs truncate max-w-[140px]">{user.email}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1 shrink-0" />
        </div>

        {/* Role + Status badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${role.badge}`}>
            <RoleIcon size={11} />
            {role.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={status.text}>{status.label}</span>
          </span>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
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
