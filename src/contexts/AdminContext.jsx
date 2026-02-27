import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = userRole === 'admin';

  const fetchData = useCallback(async () => {
    if (!isAdmin || !currentUser) return;

    try {
      if (orders.length === 0) setLoading(true);

      const [ordersRes, docsRes, pendingRes, logsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id', { count: 'exact' }).eq('order_status', 'PENDING_ADMIN_SCRUB'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(1000)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (docsRes.error) throw docsRes.error;
      if (logsRes.error) throw logsRes.error;

      setOrders(ordersRes.data || []);
      setDocuments(docsRes.data || []);
      setPendingOrdersCount(pendingRes.count || 0);
      setAuditLogs(logsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("AdminContext Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser]);

  useEffect(() => {
    if (!isAdmin || !currentUser) {
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase.channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, currentUser, fetchData]);

  return (
    <AdminContext.Provider value={{ orders, documents, pendingOrdersCount, auditLogs, loading, error, refreshData: fetchData }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useOrders must be used within AdminProvider");
  return { 
    orders: context.orders, 
    pendingOrdersCount: context.pendingOrdersCount,
    loading: context.loading, 
    error: context.error,
    refreshData: context.refreshData
  };
};

export const useDocuments = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useDocuments must be used within AdminProvider");
  return { documents: context.documents, loading: context.loading, error: context.error, refreshData: context.refreshData };
};

export const useAuditLogs = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAuditLogs must be used within AdminProvider");
  return { auditLogs: context.auditLogs, loading: context.loading, error: context.error, refreshData: context.refreshData };
};