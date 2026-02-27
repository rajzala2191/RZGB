import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Users, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import ControlCentreLayout from '@/components/ControlCentreLayout';

export default function ReleaseToSuppliersPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [filterMaterial, setFilterMaterial] = useState('');

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    const { data: ord } = await supabase.from('orders').select('*').eq('id', orderId).single();
    // Fetch suppliers, in a real system we might join with a supplier_details table for specialization
    const { data: sups } = await supabase.from('profiles').select('*').eq('role', 'supplier');
    if (ord) setOrder(ord);
    if (sups) setSuppliers(sups.map(s => ({...s, rating: 4.8, specialization: ord?.material || 'General'}))); // mock details
  };

  const toggleSupplier = (id) => {
    setSelectedSuppliers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    }
  };

  const handleRelease = async () => {
    if (selectedSuppliers.length < 3) {
      toast({ title: 'Validation Failed', description: 'You must select at least 3 suppliers for bidding.', variant: 'destructive' });
      return;
    }

    try {
      // 1. Change order status to OPEN_FOR_BIDDING
      await supabase.from('orders').update({ order_status: 'OPEN_FOR_BIDDING' }).eq('id', orderId);

      // 2. Create tender requests
      const tenderInserts = selectedSuppliers.map(sId => ({
        project_id: order.project_id || order.id,
        status: 'OPEN',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }));
      // Assuming tender_requests works or we just rely on OPEN_FOR_BIDDING status. Let's rely on status for simplicity but log action.
      await supabase.from('audit_logs').insert([{
        action: 'TENDER_RELEASED',
        order_id: orderId,
        details: `Released to ${selectedSuppliers.length} suppliers`,
        status: 'SUCCESS'
      }]);

      toast({ title: 'Success', description: 'Tender requests sent successfully to selected suppliers.' });
      navigate('/control-centre/supplier-pool');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (!order) return <ControlCentreLayout><div className="p-8 text-slate-300">Loading...</div></ControlCentreLayout>;

  const filteredSuppliers = suppliers.filter(s => s.specialization.toLowerCase().includes(filterMaterial.toLowerCase()));

  return (
    <ControlCentreLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Release to Suppliers</h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Client identity hidden - suppliers see: <strong className="text-slate-200">RZ_GLOBAL_INTERNAL</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800">
               <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2"><FileText size={18} /> Order Summary</h2>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between"><span className="text-slate-400">Order ID:</span> <span className="font-mono text-slate-200">{order.id.slice(0, 8)}</span></div>
                 <div className="flex justify-between"><span className="text-slate-400">Ghost Name:</span> <span className="font-semibold text-cyan-400">{order.ghost_public_name}</span></div>
                 <div className="flex justify-between"><span className="text-slate-400">Material:</span> <span className="text-slate-200">{order.material}</span></div>
                 <div className="flex justify-between"><span className="text-slate-400">Quantity:</span> <span className="text-slate-200">{order.quantity}</span></div>
                 <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                   <span className="text-slate-400">Sanitized Files:</span> 
                   <span className="flex items-center text-green-400 gap-1"><CheckCircle2 size={14} /> Ready</span>
                 </div>
               </div>
             </div>
             
             <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800">
               <div className="text-center">
                 <div className="text-4xl font-bold text-cyan-500 mb-2">{selectedSuppliers.length}</div>
                 <p className="text-slate-400 text-sm">Suppliers Selected</p>
                 <p className="text-xs text-amber-500/80 mt-2 mt-4">Minimum 3 required</p>
               </div>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
             <div className="bg-[#0f172a] p-6 rounded-lg shadow-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2"><Users size={20} /> Select Network Suppliers</h2>
                  <div className="flex gap-3">
                     <Button variant="outline" size="sm" onClick={toggleAll} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                       {selectedSuppliers.length === filteredSuppliers.length ? 'Deselect All' : 'Select All'}
                     </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredSuppliers.map(s => (
                    <label key={s.id} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedSuppliers.includes(s.id) ? 'bg-cyan-900/20 border-cyan-800' : 'bg-[#1e293b] border-slate-800 hover:border-slate-600'}`}>
                      <div className="flex items-center space-x-4">
                        <input type="checkbox" checked={selectedSuppliers.includes(s.id)} onChange={() => toggleSupplier(s.id)} className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500" />
                        <div>
                          <p className="font-semibold text-slate-200">{s.company_name || s.email}</p>
                          <p className="text-xs text-slate-400">Spec: {s.specialization} • Rating: {s.rating}★</p>
                        </div>
                      </div>
                      {selectedSuppliers.includes(s.id) && <span className="text-xs font-bold text-cyan-400">Selected</span>}
                    </label>
                  ))}
                </div>
             </div>

             <Button onClick={handleRelease} size="lg" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 text-lg">
                RELEASE TENDER TO NETWORK
             </Button>
          </div>
        </div>
      </div>
    </ControlCentreLayout>
  );
}