import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { Download, Users, UserPlus, Activity, Calendar, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const SystemAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [roleStats, setRoleStats] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, new: 0 });
  
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (error) throw error;

      const totalUsers = profiles.length;
      const activeUsers = profiles.filter(p => p.status === 'active').length; 
      const currentMonth = new Date().getMonth();
      const newUsers = profiles.filter(p => new Date(p.created_at).getMonth() === currentMonth).length;

      setMetrics({ total: totalUsers, active: activeUsers, new: newUsers });

      const roles = profiles.reduce((acc, curr) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
      }, {});
      
      const roleData = Object.keys(roles).map(key => ({ name: key, value: roles[key] }));
      setRoleStats(roleData);

      const months = {};
      profiles.forEach(p => {
        const month = format(new Date(p.created_at), 'MMM yyyy');
        months[month] = (months[month] || 0) + 1;
      });

      let runningTotal = 0;
      const growthData = Object.keys(months).map(month => {
        runningTotal += months[month];
        return { name: month, users: runningTotal };
      });
      setUserStats(growthData);

    } catch (err) {
      console.error('Analytics Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('RZ Global Solutions System Analytics', 14, 15);
    doc.text(`Generated on ${format(new Date(), 'PP')}`, 14, 25);
    
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', metrics.total],
        ['Active Users', metrics.active],
        ['New Users (This Month)', metrics.new],
      ],
      startY: 35,
    });
    
    doc.save('rz-analytics-report.pdf');
  };

  const COLORS = ['#FF6B35', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <ControlCentreLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-20 h-20 mb-6 animate-pulse" />
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mb-4" />
          <p className="text-slate-400 font-medium text-lg">RZ Global Solutions is analyzing data...</p>
        </div>
      </ControlCentreLayout>
    );
  }

  if (error) {
    return (
      <ControlCentreLayout>
        <div className="p-16 flex flex-col items-center text-red-400 gap-4 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle size={24} /> RZ Global Solutions Error
          </div>
          <p>Failed to load analytics: {error}</p>
        </div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>System Analytics - RZ Global Solutions</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-white">System Analytics</h1>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 p-2 rounded-lg">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                className="bg-transparent text-white text-sm focus:outline-none"
              />
              <span className="text-gray-500">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                className="bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Users" value={metrics.total} icon={Users} color="text-blue-500" />
          <MetricCard title="Active Users" value={metrics.active} icon={Activity} color="text-green-500" />
          <MetricCard title="New This Month" value={metrics.new} icon={UserPlus} color="text-[#FF6B35]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">User Growth</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userStats}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#FF6B35' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#FF6B35" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">Role Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

const MetricCard = ({ title, value, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-gray-900 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default SystemAnalyticsPage;