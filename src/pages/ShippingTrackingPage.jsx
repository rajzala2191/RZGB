import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, Search, Package, ExternalLink, MapPin } from 'lucide-react';

const ShippingTrackingPage = () => {
  const { currentUser } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
       if (!currentUser) return;
       // We need to fetch shipping_labels joined with orders filtered by client_id
       const { data, error } = await supabase
         .from('shipping_labels')
         .select('*, order:order_id!inner(rz_job_id, client_id)')
         .eq('order.client_id', currentUser.id)
         .order('created_at', { ascending: false });
         
       if (!error && data) setShipments(data);
       setLoading(false);
    };
    fetchShipments();
  }, [currentUser]);

  const filtered = shipments.filter(s => 
     s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.order?.rz_job_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ClientDashboardLayout>
      <Helmet><title>Shipping - Client Portal</title></Helmet>

      <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Truck className="text-sky-500" size={32} />
            Shipment Tracking
         </h1>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 mb-6">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
               type="text" 
               placeholder="Search tracking number or Job ID..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
         </div>
      </div>

      {loading ? (
         <div className="text-center text-slate-500 py-12">Checking tracking status...</div>
      ) : filtered.length === 0 ? (
         <div className="text-center py-20 bg-[#0f172a] border border-slate-800 rounded-xl">
            <Package size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No active shipments found.</p>
         </div>
      ) : (
         <div className="grid gap-6">
            {filtered.map(shipment => (
               <div key={shipment.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 hover:border-sky-500/50 transition-all">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                     <div>
                        <div className="text-sm text-slate-500 font-bold uppercase mb-1">{shipment.carrier} Express</div>
                        <div className="text-xl text-white font-mono font-bold tracking-wide">{shipment.tracking_number}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Status</div>
                        <div className="px-3 py-1 rounded bg-sky-950 text-sky-400 border border-sky-900 text-sm font-bold uppercase inline-block">
                           {shipment.status || 'In Transit'}
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 flex justify-between items-center">
                     <div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Contents</div>
                        <div className="text-slate-300 font-mono">Job: {shipment.order?.rz_job_id}</div>
                     </div>
                     <a href="#" className="text-sky-500 hover:text-sky-400 text-sm font-bold flex items-center gap-1">
                        Track on Carrier Site <ExternalLink size={14} />
                     </a>
                  </div>

                  {/* Mock Timeline */}
                  <div className="mt-6 flex items-center text-sm">
                     <div className="flex-1 text-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 mx-auto mb-2"></div>
                        <p className="text-slate-300">Shipped</p>
                     </div>
                     <div className="flex-1 h-1 bg-emerald-500/50"></div>
                     <div className="flex-1 text-center">
                        <div className="w-4 h-4 rounded-full bg-sky-500 mx-auto mb-2 animate-pulse"></div>
                        <p className="text-sky-400 font-bold">In Transit</p>
                     </div>
                     <div className="flex-1 h-1 bg-slate-800"></div>
                     <div className="flex-1 text-center">
                        <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 mx-auto mb-2"></div>
                        <p className="text-slate-500">Delivered</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ShippingTrackingPage;