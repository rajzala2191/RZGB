import React, { useState } from 'react';
import { Printer, Lock, Truck, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logShippingLabel } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import { jsPDF } from "jspdf";

const ShippingLabelGenerator = ({ orderId, isQcApproved, rzJobId }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [carrier, setCarrier] = useState('DHL');

  const generateLabel = async () => {
    if (!isQcApproved) return;
    setGenerating(true);

    try {
      const tracking = `RZ-${Math.floor(Math.random() * 100000000)}`;

      // 1. Create DB Record
      const { error } = await supabase.from('shipping_labels').insert({
        order_id: orderId,
        supplier_id: currentUser.id,
        carrier,
        tracking_number: tracking,
        status: 'generated'
      });

      if (error) throw error;

      // 2. Mock PDF Generation
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("RZ GLOBAL SOLUTIONS", 20, 20);
      doc.setFontSize(12);
      doc.text(`Job ID: ${rzJobId}`, 20, 40);
      doc.text(`Carrier: ${carrier}`, 20, 50);
      doc.text(`Tracking: ${tracking}`, 20, 60);
      doc.text("------------------------------------------------", 20, 70);
      doc.text("SHIP TO:", 20, 80);
      doc.text("RZ Consolidation Centre", 20, 90);
      doc.text("London, UK", 20, 100);
      doc.save(`RZ-Label-${rzJobId}.pdf`);

      // 3. Log Audit
      await logShippingLabel(currentUser.id, orderId, tracking);

      toast({
        title: "Label Generated",
        description: `Shipping label for ${carrier} created successfully.`,
        className: "bg-emerald-600 border-emerald-700 text-white"
      });

    } catch (error) {
      console.error('Label gen error:', error);
      toast({ title: "Error", description: "Failed to generate label", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Truck className="text-sky-500" size={20} />
            Shipping Logistics
          </h3>
          <p className="text-sm text-slate-400 mt-1">Generate official RZ shipping labels.</p>
        </div>
        {!isQcApproved && (
          <div className="bg-slate-900 text-slate-500 px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-2 border border-slate-800">
            <Lock size={12} /> QC Approval Required
          </div>
        )}
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Carrier</label>
          <select 
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            disabled={!isQcApproved}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          >
            <option value="DHL">DHL Express</option>
            <option value="FedEx">FedEx International</option>
            <option value="UPS">UPS Worldwide</option>
          </select>
        </div>
        <button
          onClick={generateLabel}
          disabled={!isQcApproved || generating}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all
            ${isQcApproved 
              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }
          `}
        >
          {generating ? <Loader2 className="animate-spin" size={18} /> : isQcApproved ? <Printer size={18} /> : <Lock size={18} />}
          {isQcApproved ? 'Generate Label' : 'Locked'}
        </button>
      </div>
    </div>
  );
};

export default ShippingLabelGenerator;