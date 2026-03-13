import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import {
  Loader2, AlertCircle, TrendingUp, DollarSign, Users,
  Clock, CheckCircle2, ArrowRight, Filter, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBidManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('bidding'); // 'bidding' | 'awarded'

  const fetchBidData = useCallback(async () => {
    try {
      setLoading(true);

      // Get orders in BIDDING status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id, rz_job_id, ghost_public_name, part_name, material, 
          quantity, created_at, updated_at, order_status,
          client:client_id(company_name)
        `)
        .in('order_status', ['OPEN_FOR_BIDDING', 'BIDDING', 'AWARDED'])
        .order('updated_at', { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);

      // Get all bids - try with supplier join first, fall back to raw query
      let bidData = null;
      const { data: bidsWithSupplier, error: bidJoinError } = await supabase
        .from('bid_submissions')
        .select(`
          id, tender_id, supplier_id, unit_price, lead_time_days, 
          notes, status, created_at, supplier:supplier_id(company_name, email)
        `)
        .order('created_at', { ascending: false });

      if (bidJoinError) {
        console.warn('Bid FK join failed, fetching without join:', bidJoinError.message);
        // Fallback: fetch bids without the FK join
        const { data: rawBids, error: rawBidError } = await supabase
          .from('bid_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (rawBidError) throw rawBidError;
        bidData = rawBids;
      } else {
        bidData = bidsWithSupplier;
      }

      // Group bids by order (tender_id maps to orders.id)
      const bidsByOrder = {};
      (bidData || []).forEach(bid => {
        const orderId = bid.tender_id;
        if (!orderId) return; // Skip bids without a valid tender_id
        if (!bidsByOrder[orderId]) {
          bidsByOrder[orderId] = [];
        }
        bidsByOrder[orderId].push(bid);
      });
      setBids(bidsByOrder);
      setError(null);
    } catch (err) {
      console.error('Error fetching bid data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBidData();
  }, [fetchBidData]);

  // Real-time subscription for new/updated bids
  useEffect(() => {
    const channel = supabase
      .channel('admin-bid-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bid_submissions' },
        (payload) => {
          console.log('Bid update received:', payload);
          fetchBidData(); // Re-fetch all data when any bid changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBidData]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'bidding') return order.order_status === 'BIDDING' || order.order_status === 'OPEN_FOR_BIDDING';
    if (filter === 'awarded') return order.order_status === 'AWARDED';
    return true;
  });

  if (loading) {
    return (
      <ControlCentreLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin w-12 h-12 text-cyan-500" />
        </div>
      </ControlCentreLayout>
    );
  }

  return (
    <ControlCentreLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bid Management</h1>
            <p className="text-slate-400 mt-1">
              View supplier bids and award contracts
            </p>
          </div>
          <Button
            onClick={fetchBidData}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setFilter('bidding')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'bidding'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Open for Bidding
            <span className="ml-2 text-xs">
              ({orders.filter(o => o.order_status === 'BIDDING' || o.order_status === 'OPEN_FOR_BIDDING').length})
            </span>
          </button>
          <button
            onClick={() => setFilter('awarded')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'awarded'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Awarded
            <span className="ml-2 text-xs">
              ({orders.filter(o => o.order_status === 'AWARDED').length})
            </span>
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="bg-[#0f172a] border-slate-700">
            <CardContent className="pt-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                {filter === 'bidding' 
                  ? 'No orders currently open for bidding'
                  : 'No awarded contracts yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const orderBids = bids[order.id] || [];
              const lowestBid = orderBids.length > 0 
                ? orderBids.reduce((min, bid) => (bid.unit_price ?? Infinity) < (min.unit_price ?? Infinity) ? bid : min)
                : null;

              return (
                <Card
                  key={order.id}
                  className="bg-[#0f172a] border-slate-800 hover:border-cyan-500/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded">
                            {order.id.slice(0, 8).toUpperCase()}
                          </span>
                          {order.ghost_public_name || order.part_name}
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          Client: {order.client?.company_name} • Material: {order.material} • Qty: {order.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.order_status === 'AWARDED'
                              ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                              : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50'
                          }`}
                        >
                          {order.order_status === 'AWARDED' ? '✓ AWARDED' : 'BIDDING OPEN'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Bid Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#1e293b] rounded p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Total Bids</p>
                        <p className="text-2xl font-bold text-cyan-400">{orderBids.length}</p>
                      </div>
                      {lowestBid ? (
                        <>
                          <div className="bg-[#1e293b] rounded p-3 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Lowest Bid</p>
                            <p className="text-2xl font-bold text-emerald-400">
                              ${lowestBid.unit_price?.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-[#1e293b] rounded p-3 border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Delivery (days)</p>
                            <p className="text-2xl font-bold text-blue-400">
                              {lowestBid.lead_time_days || 'N/A'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 bg-[#1e293b] rounded p-3 border border-slate-700 text-center text-slate-400">
                          Waiting for supplier bids...
                        </div>
                      )}
                    </div>

                    {/* Bids List */}
                    {orderBids.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Supplier Bids</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {orderBids.map(bid => (
                            <div key={bid.id} className="bg-[#1e293b] rounded p-3 border border-slate-700 flex justify-between items-center hover:border-slate-600 transition-colors">
                              <div>
                                <p className="font-medium text-slate-200">{bid.supplier?.company_name}</p>
                                <p className="text-xs text-slate-400">{bid.supplier?.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-cyan-400">${bid.unit_price?.toLocaleString()}</p>
                                <p className="text-xs text-slate-400">{bid.lead_time_days || 'N/A'} days</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {(order.order_status === 'BIDDING' || order.order_status === 'OPEN_FOR_BIDDING') && orderBids.length > 0 ? (
                      <Button
                        onClick={() => navigate(`/control-centre/bid-comparison/${order.id}`)}
                        className="w-full bg-cyan-600 hover:bg-cyan-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View All Bids & Award
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : order.order_status === 'AWARDED' ? (
                      <Button
                        variant="outline"
                        disabled
                        className="w-full"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Contract Awarded
                      </Button>
                    ) : (
                      <div className="bg-[#1e293b] rounded p-3 border border-slate-700 text-center text-slate-400 text-sm">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Awaiting supplier bids...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
