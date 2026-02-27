import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { submitOrderToAdmin } from '@/lib/submitOrderToAdmin';
import { useAuth } from '@/contexts/AuthContext';

export default function SubmitOrderModal({ isOpen, onClose, order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser, userCompanyName } = useAuth();

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitOrderToAdmin({
        orderId: order.id,
        clientId: currentUser.id,
        orderName: order.part_name || order.id.slice(0, 8),
        clientName: userCompanyName || currentUser.email
      });
      
      toast({
        title: "Success",
        description: "Order submitted to admin! You'll be notified when it's approved.",
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Submit Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-slate-300">
          <p>Please review your order details before submitting for admin review.</p>
          
          <div className="bg-slate-900 rounded-lg p-4 space-y-2 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Order/Part Name</span>
              <span className="font-medium text-white">{order.part_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Material</span>
              <span className="font-medium text-white">{order.material || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quantity</span>
              <span className="font-medium text-white">{order.quantity || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Files Attached</span>
              <span className="font-medium text-white">{order.files_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Delivery</span>
              <span className="font-medium text-white">{order.timeline ? `${order.timeline} days` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/50">
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            {loading ? 'Submitting...' : 'Submit Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}