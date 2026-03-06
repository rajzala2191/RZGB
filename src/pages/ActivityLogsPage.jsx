import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { format } from 'date-fns';
import { Search, Filter, Loader2, AlertCircle, RefreshCw, Mail } from 'lucide-react';

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
  });
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchLogsAndProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const { data: profileData } = await supabase.from('profiles').select('id, email, company_name');
      const profileMap = profileData?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};
      
      setProfiles(profileMap);
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('RZ Global Solutions failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndProfiles();
  }, [page, filters.status]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const filteredLogs = logs.filter(log => {
    const adminEmail = profiles[log.admin_id]?.email || '';
    const matchesSearch = 
      log.action?.toLowerCase().includes(filters.search.toLowerCase()) ||
      adminEmail.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.details?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || (
      filters.type === 'email' && (
        log.action?.toLowerCase().includes('email') || 
        log.action?.toLowerCase().includes('verification') || 
        log.action?.toLowerCase().includes('sign up')
      )
    );

    return matchesSearch && matchesType;
  });

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Activity Logs - RZ Global Solutions</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <button 
            onClick={fetchLogsAndProfiles}
            className="flex items-center gap-2 text-[#FF6B35] hover:text-orange-400 text-sm font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
          <div className="flex-1 flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-800">
            <Search size={18} className="text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by action, user, or details..." 
              value={filters.search}
              onChange={handleSearch}
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="all">All Activities</option>
              <option value="email">Email Logs Only</option>
            </select>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {filters.type === 'email' && (
          <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg flex items-center gap-3 text-blue-200">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Viewing email delivery and verification logs only.</span>
          </div>
        )}

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 mb-4 animate-pulse" />
              <Loader2 className="animate-spin text-sky-500 w-8 h-8 mb-2" />
              <p className="text-slate-400 font-medium">RZ Global Solutions is loading data...</p>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center text-red-400 gap-4">
              <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
              <div className="flex items-center gap-2 text-lg font-bold">
                <AlertCircle size={24} /> RZ Global Solutions Error
              </div>
              <p>{error}</p>
              <button onClick={fetchLogsAndProfiles} className="text-sm underline hover:text-red-300">Try Again</button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Details</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="p-4 text-gray-400 whitespace-nowrap">
                        {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm') : 'N/A'}
                      </td>
                      <td className="p-4 text-white font-medium">
                        {profiles[log.admin_id]?.email || log.admin_id || 'System / Unauth'}
                      </td>
                      <td className="p-4 text-gray-300">
                        {log.action}
                      </td>
                      <td className="p-4 text-gray-400 text-xs max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (log.status || '').toLowerCase() === 'success' 
                            ? 'bg-green-900/30 text-green-400 border border-green-800' 
                            : 'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {log.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No logs found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-400">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="disabled:opacity-50 hover:text-white"
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button 
            disabled={logs.length < ITEMS_PER_PAGE}
            onClick={() => setPage(p => p + 1)}
            className="disabled:opacity-50 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default ActivityLogsPage;