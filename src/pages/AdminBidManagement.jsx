import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import {
  Loader2, AlertCircle, TrendingUp, DollarSign, Users,
  Clock, CheckCircle2, ArrowRight, Filter
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBidManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('bidding'); // 'bidding' | 'awarded'

  useEffect(() => {
    fetchBidData();
  }, []);

  const fetchBidData = async () => {
    try {
      // Get orders in BIDDING status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id, rz_job_id, ghost_public_name, part_name, material, 
          quantity, delivery_days, created_at, updated_at, order_status,
          client:client_id(company_name)
        `)
        .in('order_status', ['BIDDING', 'AWARDED'])
        .order('updated_at', { ascending: false });

      if (orderError) throw orderError;

      // Get all bids
      const { data: bidData, error: bidError } = await supabase
        .from('bid_submissions')
        .select(`
          id, tender_id, supplier_id, quote_price, delivery_days, 
          notes, created_at, supplier:supplier_id(company_name, email)
        `)
        .order('created_at', { ascending: false });

      if (bidError) throw bidError;

      setOrders(orderData || []);

      // Group bids by order
      const bidsByOrder = {};
      (bidData || []).forEach(bid => {
        if (!bidsByOrder[bid.tender_id]) {
          bidsByOrder[bid.tender_id] = [];
        }
        bidsByOrder[bid.tender_id].push(bid);
      });
      setBids(bidsByOrder);
      setError(null);
    } catch (err) {
      console.error('Error fetching bid data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'bidding') return order.order_status === 'BIDDING';
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
        <div>
          <h1 className="text-3xl font-bold">Bid Management</h1>
          <p className="text-slate-400 mt-1">
            View supplier bids and award contracts
          </p>
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
              ({orders.filter(o => o.order_status === 'BIDDING').length})
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
          <Card className="bg-slate-900 border-slate-700">
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
                ? orderBids.reduce((min, bid) => bid.quote_price < min.quote_price ? bid : min)
                : null;

              return (
                <Card
                  key={order.id}
                  className="bg-slate-900 border-slate-700 hover:border-cyan-500/50 transition-colors"
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
                      <div className="bg-slate-800/50 rounded p-3">
                        <p className="text-xs text-slate-400 mb-1">Total Bids</p>
                        <p className="text-2xl font-bold text-cyan-400">{orderBids.length}</p>
                      </div>
                      {lowestBid ? (
                        <>
                          <div className="bg-slate-800/50 rounded p-3">
                            <p className="text-xs text-slate-400 mb-1">Lowest Bid</p>
                            <p className="text-2xl font-bold text-emerald-400">
                              ${lowestBid.quote_price.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded p-3">
                            <p className="text-xs text-slate-400 mb-1">Delivery (days)</p>
                            <p className="text-2xl font-bold text-blue-400">
                              {lowestBid.delivery_days}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 bg-slate-800/50 rounded p-3 text-center text-slate-400">
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
                            <div key={bid.id} className="bg-slate-800/30 rounded p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-200">{bid.supplier?.company_name}</p>
                                <p className="text-xs text-slate-400">{bid.supplier?.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-cyan-400">${bid.quote_price.toLocaleString()}</p>
                                <p className="text-xs text-slate-400">{bid.delivery_days} days</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {order.order_status === 'BIDDING' && orderBids.length > 0 ? (
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
                      <div className="bg-slate-800/50 rounded p-3 text-center text-slate-400 text-sm">
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
