import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const SupplierContext = createContext();

export const SupplierProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSupplier = userRole === 'supplier';

  const fetchData = useCallback(async () => {
    if (!isSupplier || !currentUser) return;

    try {
      if (orders.length === 0) setLoading(true);

      const [ordersRes, docsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('supplier_id', currentUser.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('supplier_id', currentUser.id)
          .order('created_at', { ascending: false })
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (docsRes.error) throw docsRes.error;

      setOrders(ordersRes.data || []);
      setDocuments(docsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("SupplierContext Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSupplier, currentUser]);

  useEffect(() => {
    if (!isSupplier || !currentUser) {
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase.channel('supplier-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `supplier_id=eq.${currentUser.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `supplier_id=eq.${currentUser.id}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupplier, currentUser, fetchData]);

  return (
    <SupplierContext.Provider value={{ orders, documents, loading, error, refreshData: fetchData }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplierOrders = () => {
  const context = useContext(SupplierContext);
  if (!context) throw new Error("useSupplierOrders must be used within SupplierProvider");
  return { orders: context.orders, loading: context.loading, error: context.error };
};

export const useSupplierDocuments = () => {
  const context = useContext(SupplierContext);
  if (!context) throw new Error("useSupplierDocuments must be used within SupplierProvider");
  return { documents: context.documents, loading: context.loading, error: context.error };
};