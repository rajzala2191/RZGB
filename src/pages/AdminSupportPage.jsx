import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { LifeBuoy, Search, Loader2, MessageSquare, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getPriorityColor, getStatusColor, TICKET_STATUSES } from '@/lib/ticketHelpers';

const STATUS_TABS = ['all', ...TICKET_STATUSES];

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .select('*, profile:user_id(company_name, email, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('AdminSupportPage fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabaseAdmin
      .channel('admin-support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();

    return () => supabaseAdmin.removeChannel(channel);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
  };

  const filtered = useMemo(() => {
    let result = tickets;

    if (activeTab !== 'all') {
      result = result.filter(t => t.status === activeTab);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.subject || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.user_role || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tickets, activeTab, priorityFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const counts = { open: 0, 'in-progress': 0, resolved: 0, closed: 0 };
    tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [tickets]);

  return (
    <ControlCentreLayout>
      <Helmet><title>Support Tickets — Admin</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LifeBuoy className="text-orange-500" size={30} /> Support Tickets
            </h1>
            <p className="text-slate-500 mt-1">Manage client and supplier support requests.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', key: 'open', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'In Progress', key: 'in-progress', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
            { label: 'Resolved', key: 'resolved', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
            { label: 'Closed', key: 'closed', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
          ].map(s => (
            <div key={s.key} className={`${s.bg} border rounded-xl p-4 shadow-sm`}>
              <p className="text-2xl font-black text-slate-900">{stats[s.key]}</p>
              <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by company, subject..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-all"
            />
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-xl">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400">No tickets found.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/control-centre/support/${ticket.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-slate-800">
                      {ticket.profile?.company_name || ticket.profile?.email || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        ticket.user_role === 'supplier'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {ticket.user_role || 'client'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 max-w-[200px] truncate">{ticket.subject}</td>
                    <td className="p-4 text-slate-500 text-xs">{ticket.category}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority || 'medium')}`}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 text-slate-300">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
