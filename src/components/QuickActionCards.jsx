import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const QuickActionCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSettingsClick = () => {
    toast({
      title: "Settings Unavailable",
      description: "System settings panel is currently under maintenance.",
    });
  };

  const actions = [
    {
      title: 'Invite New User',
      description: 'Add a new client, supplier, or admin',
      icon: UserPlus,
      onClick: () => navigate('/control-centre/users'),
      color: 'text-green-500',
    },
    {
      title: 'View All Users',
      description: 'Manage existing accounts and permissions',
      icon: Users,
      onClick: () => navigate('/control-centre/users'),
      color: 'text-blue-500',
    },
    {
      title: 'System Settings',
      description: 'Configure platform preferences',
      icon: Settings,
      onClick: handleSettingsClick,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -4, borderColor: '#FF6B35' }}
          onClick={action.onClick}
          className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 cursor-pointer group transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg bg-gray-900 group-hover:bg-[#FF6B35]/10 transition-colors ${action.color} group-hover:text-[#FF6B35]`}>
              <action.icon size={20} />
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-[#FF6B35] transition-colors -rotate-45 group-hover:rotate-0" />
          </div>
          <h4 className="text-white font-semibold mb-1">{action.title}</h4>
          <p className="text-xs text-gray-400">{action.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActionCards;