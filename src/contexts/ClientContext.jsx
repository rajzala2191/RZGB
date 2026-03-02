import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const ClientContext = createContext();

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

      const [ordersRes, docsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('client_id', currentUser.id)
          .neq('order_status', 'CLEARED')
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('client_id', currentUser.id)
          .order('created_at', { ascending: false })
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (docsRes.error) throw docsRes.error;

      setOrders(ordersRes.data || []);
      setDocuments(docsRes.data || []);
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

