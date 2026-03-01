import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupplierHubLayout from '@/components/SupplierHubLayout';

export default function SupplierBidsPage() {
  const [bids, setBids] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBids();
  }, [currentUser]);

  const fetchBids = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('bid_submissions').select('*, order:order_id(ghost_public_name, id)').eq('supplier_id', currentUser.id).order('created_at', { ascending: false });
    if (data) setBids(data);
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    switch(s) {
      case 'SUBMITTED':
      case 'PENDING': return <span className="bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded-full text-xs font-bold">Under Review</span>;
      case 'AWARDED':
      case 'ACCEPTED': return <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-2 py-1 rounded-full text-xs font-bold">Awarded</span>;
      case 'REJECTED': return <span className="bg-red-900/30 text-red-400 border border-red-800 px-2 py-1 rounded-full text-xs font-bold">Rejected</span>;
      default: return <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-full text-xs">{status || 'Unknown'}</span>;
    }
  };

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-slate-100">My Submitted Bids</h1>
          <p className="text-slate-400">Track and manage your quotations for RZ Global jobs.</p>
        </div>

        <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e293b] border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Ghost Name</th>
                <th className="p-4">Quoted COGS</th>
                <th className="p-4">Lead Time</th>
                <th className="p-4">Submission Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {bids.map(bid => (
                <tr key={bid.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{bid.order?.id?.slice(0, 8) || bid.order_id?.slice(0, 8)}</td>
                  <td className="p-4 font-semibold text-cyan-400">{bid.order?.ghost_public_name || 'N/A'}</td>
                  <td className="p-4 font-bold">${bid.unit_price}</td>
                  <td className="p-4">{bid.lead_time_days} days</td>
                  <td className="p-4 text-slate-400">{new Date(bid.created_at).toLocaleDateString()}</td>
                  <td className="p-4">{getStatusBadge(bid.status)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button onClick={() => navigate(`/supplier-hub/jobs/${bid.order_id}`)} size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white">
                        <Eye size={14} className="mr-1"/> View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500">You haven't submitted any bids yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SupplierHubLayout>
  );
}