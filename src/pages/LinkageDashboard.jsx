import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { useOrders } from '@/contexts/AdminContext';
import { Search, Filter, Download, ArrowUpDown, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';

const LinkageDashboard = () => {
  const { orders, loading, error } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.rz_job_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.supplier?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (aVal === null) aVal = '';
    if (bVal === null) bVal = '';

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "RZ-Job-ID,Client,Supplier,Buy Price,Sell Price,Margin,Margin %,Status,Created At\n"
        + sortedOrders.map(row => {
            const marginPercent = row.sell_price ? ((row.margin / row.sell_price) * 100).toFixed(2) : '0';
            return `${row.rz_job_id || ''},${row.client?.email || ''},${row.supplier?.email || ''},${row.buy_price || 0},${row.sell_price || 0},${row.margin || 0},${marginPercent}%,${row.status || ''},${row.created_at || ''}`;
          }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pipeline_linkage_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const getMarginColor = (margin, sellPrice) => {
    if (!sellPrice) return 'text-slate-400';
    const percent = (margin / sellPrice) * 100;
    if (percent >= 20) return 'text-emerald-500';
    if (percent >= 10) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Linkage Dashboard - Ghost Portal</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <LinkIcon className="text-sky-500" size={32} />
              Linkage Pipelines
            </h1>
            <p className="text-slate-400 mt-1">Master view of active supplier-client connections.</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by RZ-Job-ID, Client, or Ghost ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter size={18} className="text-slate-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl flex flex-col items-center text-red-200 gap-4">
            <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-12 h-12 grayscale opacity-60" />
            <div className="flex items-center gap-2 font-bold"><AlertCircle /> RZ Global Solutions Error</div>
            <p>Error loading pipelines: {error}</p>
          </div>
        )}

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 mb-4 animate-pulse" />
              <Loader2 className="animate-spin text-sky-500 w-8 h-8 mb-2" />
              <p className="text-slate-400 font-medium">RZ Global Solutions is loading linkages...</p>
            </div>
          ) : !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="p-4 cursor-pointer hover:text-sky-400" onClick={() => requestSort('rz_job_id')}>
                      <div className="flex items-center gap-1">RZ-Job-ID <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Ghost ID (Supplier)</th>
                    <th className="p-4 text-right cursor-pointer hover:text-sky-400" onClick={() => requestSort('buy_price')}>
                      <div className="flex items-center justify-end gap-1">Buy Price <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-4 text-right cursor-pointer hover:text-sky-400" onClick={() => requestSort('sell_price')}>
                      <div className="flex items-center justify-end gap-1">Sell Price <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-4 text-right">Real-time Margin</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const marginPercent = order.sell_price ? ((order.margin / order.sell_price) * 100).toFixed(1) : 0;
                      return (
                        <tr key={order.id} className="hover:bg-slate-900/50 transition-colors group">
                          <td className="p-4 font-mono text-sky-400 font-medium">{order.rz_job_id || 'PENDING'}</td>
                          <td className="p-4 text-slate-300">{order.client?.company_name || order.client?.email || 'N/A'}</td>
                          <td className="p-4 text-slate-400 italic">{order.supplier?.email ? `GHOST-${order.supplier.email.substring(0,4).toUpperCase()}` : 'Unassigned'}</td>
                          <td className="p-4 text-right text-slate-400">£{order.buy_price || 0}</td>
                          <td className="p-4 text-right text-slate-200 font-medium">£{order.sell_price || 0}</td>
                          <td className="p-4 text-right">
                             <div className={`font-bold ${getMarginColor(order.margin, order.sell_price)}`}>
                               £{order.margin || 0}
                               <span className="text-xs opacity-70 ml-1">({marginPercent}%)</span>
                             </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                              order.status === 'active' ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-900' :
                              order.status === 'completed' ? 'bg-sky-950/40 text-sky-500 border border-sky-900' :
                              'bg-amber-950/40 text-amber-500 border border-amber-900'
                            }`}>
                              {(order.status || 'Unknown').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No active pipelines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default LinkageDashboard;