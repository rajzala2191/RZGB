import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Building, ArrowLeft, ShieldAlert } from 'lucide-react';
import SupplierHubLayout from '@/components/SupplierHubLayout';

export default function TenderDetailsPage() {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [tender, setTender] = useState(null);
  const [existingBid, setExistingBid] = useState(null);
  const [bidForm, setBidForm] = useState({ price: '', leadTime: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenderAndBid();
  }, [tenderId]);

  const fetchTenderAndBid = async () => {
    const { data: tData } = await supabase.from('orders').select('*').eq('id', tenderId).single();
    if (tData) setTender(tData);

    if (currentUser && tData) {
      const { data: bData } = await supabase.from('bid_submissions')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('supplier_id', currentUser.id)
        .maybeSingle();
      
      if (bData) {
        setExistingBid(bData);
        setBidForm({ price: bData.quote_price, leadTime: bData.lead_time_days, notes: bData.notes || '' });
      }
    }
  };

  const submitBid = async () => {
    setLoading(true);
    try {
      if (existingBid) {
        await supabase.from('bid_submissions').update({
          quote_price: parseFloat(bidForm.price),
          lead_time_days: parseInt(bidForm.leadTime, 10),
          notes: bidForm.notes
        }).eq('id', existingBid.id);
        toast({ title: 'Success', description: 'Bid updated successfully.' });
      } else {
        await supabase.from('bid_submissions').insert([{
          supplier_id: currentUser.id,
          tender_id: tenderId,
          quote_price: parseFloat(bidForm.price),
          lead_time_days: parseInt(bidForm.leadTime, 10),
          notes: bidForm.notes,
          status: 'SUBMITTED'
        }]);
        toast({ title: 'Success', description: 'Bid submitted successfully.' });
        fetchTenderAndBid(); // refresh
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!tender) return <SupplierHubLayout><div className="p-8 text-slate-400">Loading details...</div></SupplierHubLayout>;

  return (
    <SupplierHubLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="link" onClick={() => navigate('/supplier-hub/jobs')} className="text-slate-400 hover:text-cyan-400 p-0 mb-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Tenders
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tender Specs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f172a] p-8 rounded-xl shadow-xl border border-slate-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-100 mb-2">{tender.ghost_public_name}</h1>
                  <p className="text-slate-400">{tender.ghost_description}</p>
                </div>
                <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Client</p>
                  <p className="font-mono text-cyan-400 font-bold flex items-center gap-2 mt-1">
                    <ShieldAlert size={14} /> RZ_GLOBAL_INTERNAL
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-800">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Material Specification</p>
                  <p className="font-semibold text-slate-200">{tender.material}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Required Quantity</p>
                  <p className="font-semibold text-slate-200">{tender.quantity} Units</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tender Status</p>
                  <p className="font-semibold text-emerald-400">{tender.order_status?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Release Date</p>
                  <p className="font-semibold text-slate-200">{new Date(tender.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><FileText size={18}/> Sanitized Documents</h3>
                <div className="p-4 bg-[#1e293b] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded text-cyan-400"><FileText size={20}/></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{tender.ghost_public_name}_Drawings.zip</p>
                      <p className="text-xs text-slate-500">Sanitized RZ Format • 2.4 MB</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-cyan-800 text-cyan-400 hover:bg-cyan-900/30">
                    <Download size={16} className="mr-2"/> Download
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bid Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl border border-slate-800 sticky top-8">
              <h2 className="text-xl font-bold text-slate-100 mb-6">{existingBid ? 'Your Submitted Bid' : 'Submit Quotation'}</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Cost of Goods Sold (COGS)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <Input 
                      type="number" 
                      placeholder="e.g., 3500" 
                      value={bidForm.price} 
                      onChange={e => setBidForm({...bidForm, price: e.target.value})} 
                      className="pl-8 bg-[#1e293b] border-slate-700 text-slate-100"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Your total cost to produce full quantity.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Lead Time (Days)</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g., 30" 
                    value={bidForm.leadTime} 
                    onChange={e => setBidForm({...bidForm, leadTime: e.target.value})} 
                    className="bg-[#1e293b] border-slate-700 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Notes / Conditions</Label>
                  <textarea 
                    rows={4}
                    value={bidForm.notes} 
                    onChange={e => setBidForm({...bidForm, notes: e.target.value})} 
                    className="w-full rounded-md border border-slate-700 bg-[#1e293b] text-slate-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Any special conditions or constraints..."
                  />
                </div>

                <Button 
                  onClick={submitBid} 
                  disabled={loading || !bidForm.price || !bidForm.leadTime} 
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 shadow-lg shadow-cyan-900/20"
                >
                  {loading ? 'Processing...' : existingBid ? 'Update Bid' : 'Submit Official Bid'}
                </Button>
                
                {existingBid && (
                  <p className="text-center text-xs text-emerald-400 mt-4 font-medium">✓ Bid currently active and under review</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SupplierHubLayout>
  );
}