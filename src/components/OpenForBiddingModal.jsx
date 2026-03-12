import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { openOrderForBidding } from '@/services/bidService';
import { createAuditLog } from '@/lib/auditLogger';
import { createNotification } from '@/lib/createNotification';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { X, Gavel, Calendar } from 'lucide-react';

export default function OpenForBiddingModal({ isOpen, onClose, order, onSuccess }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadline] = useState('');

  const handleOpen = async () => {
    setLoading(true);
    try {
      const { error } = await openOrderForBidding(order.id, deadline || null);
      if (error) throw error;

      await createAuditLog({
        userId: currentUser?.id,
        action: 'OPEN_FOR_BIDDING',
        orderId: order.id,
        details: `Opened order for bidding.${deadline ? ` Deadline: ${deadline}` : ''}`,
        status: 'success',
      });

      const { data: suppliers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'supplier')
        .eq('status', 'active');

      if (suppliers?.length) {
        await createNotification({
          recipientId: suppliers.map(s => s.id),
          senderId: currentUser?.id,
          type: 'NEW_TENDER',
          title: 'New Bidding Opportunity',
          message: `A new order "${order.ghost_public_name || order.part_name}" is open for bidding.${deadline ? ` Deadline: ${new Date(deadline).toLocaleDateString()}` : ''}`,
          link: '/supplier-hub/bidding',
        });
      }

      toast({ title: 'Opened for Bidding', description: 'Suppliers have been notified.' });
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to open for bidding.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-[#232329]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Gavel size={18} className="text-amber-500" /> Open for Bidding
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 dark:bg-[#232329] p-4 rounded-lg border border-gray-200 dark:border-[#2e2e35] space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Order:</span> <span className="font-semibold text-orange-500">{order?.ghost_public_name || order?.part_name}</span></div>
            {order?.material && <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Material:</span> <span className="text-gray-700 dark:text-slate-200">{order.material}</span></div>}
            {order?.quantity && <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Quantity:</span> <span className="text-gray-700 dark:text-slate-200">{order.quantity}</span></div>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Bid Deadline (optional)
            </label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="bg-gray-50 dark:bg-[#232329] border-gray-200 dark:border-[#2e2e35] text-gray-900 dark:text-slate-100" />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Leave empty for no deadline.</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-300">
            All active suppliers will be notified of this bidding opportunity.
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-[#232329] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-[#232329] text-gray-700 dark:text-slate-300">Cancel</Button>
          <Button onClick={handleOpen} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-white">
            {loading ? 'Opening…' : 'Open for Bidding'}
          </Button>
        </div>
      </div>
    </div>
  );
}
