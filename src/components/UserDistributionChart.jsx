import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const UserDistributionChart = ({ data, loading }) => {
  const COLORS = ['#FF6B35', '#2563EB', '#10B981', '#9CA3AF'];

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  // Ensure we have valid data, otherwise show empty state
  const hasData = data && data.some(item => item.value > 0);

  if (!hasData) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[300px] flex flex-col items-center justify-center text-gray-500">
        <p>No user data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 h-[350px] flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">User Distribution</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserDistributionChart;