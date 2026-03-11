import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchClientDocumentsByClientId,
  fetchClientOrders,
  fetchDocumentsByOrderIds,
} from '@/services/orderService';

const ClientContext = createContext();
export { ClientContext };

export const ClientProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isClient = userRole === 'client';

  const fetchData = useCallback(async () => {
    if (!isClient || !currentUser) return;

    try {
      if (orders.length === 0) setLoading(true);

      // First fetch orders
      const ordersRes = await fetchClientOrders(currentUser.id);

      if (ordersRes.error) throw ordersRes.error;
      const clientOrders = ordersRes.data || [];

      // Fetch docs by client_id
      const docsRes = await fetchClientDocumentsByClientId(currentUser.id);

      let allDocs = docsRes.data || [];

      // Also fetch docs by order_id for the client's orders (some docs may not have client_id set)
      const orderIds = clientOrders.map(o => o.id).filter(Boolean);
      if (orderIds.length > 0) {
        const docsForOrders = await fetchDocumentsByOrderIds(orderIds);

        if (docsForOrders.data) {
          // Merge, deduplicate by id
          const existingIds = new Set(allDocs.map(d => d.id));
          docsForOrders.data.forEach(doc => {
            if (!existingIds.has(doc.id)) {
              allDocs.push(doc);
            }
          });
        }
      }

      setOrders(clientOrders);
      setDocuments(allDocs);
      setError(null);
    } catch (err) {
      console.error("ClientContext Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isClient, currentUser]);

  useEffect(() => {
    if (!isClient || !currentUser) {
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase.channel('client-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${currentUser.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `client_id=eq.${currentUser.id}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient, currentUser, fetchData]);

  return (
    <ClientContext.Provider value={{ orders, documents, loading, error, refreshData: fetchData }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientOrders = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClientOrders must be used within ClientProvider");
  return { orders: context.orders, loading: context.loading, error: context.error, refreshOrders: context.refreshData };
};

export const useClientDocuments = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClientDocuments must be used within ClientProvider");
  return { documents: context.documents, loading: context.loading, error: context.error, refreshDocuments: context.refreshData };
};

