import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Eye, PenTool } from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';

export default function SupplierJobsPage() {
  const [tenders, setTenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    const { data } = await supabase.from('orders').select('*').eq('order_status', 'OPEN_FOR_BIDDING').order('updated_at', { ascending: false });
    if (data) setTenders(data);
  };

  const filteredTenders = tenders.filter(t => 
    t.ghost_public_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.includes(searchTerm)
  );

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Open Tenders</h1>
            <p className="text-slate-400">Available manufacturing jobs ready for bidding.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <Input 
                placeholder="Search tender..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0f172a] border-slate-800 text-slate-200"
              />
            </div>
            <Button variant="outline" className="border-slate-800 bg-[#0f172a] text-slate-300">
              <Filter size={18} className="mr-2" /> Filter
            </Button>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Tender ID</th>
                <th className="p-4">Ghost Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Released Date</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredTenders.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 font-mono text-xs text-slate-500">{t.id.slice(0, 8)}</td>
                  <td className="p-4 font-semibold text-cyan-400">{t.ghost_public_name}</td>
                  <td className="p-4">{t.material}</td>
                  <td className="p-4">{t.quantity}</td>
                  <td className="p-4 text-slate-400">{new Date(t.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Button onClick={() => navigate(`/supplier-hub/jobs/${t.id}`)} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20">
                      <PenTool size={14} className="mr-2" /> View & Bid
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredTenders.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No open tenders found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SupplierHubLayout>
  );
}