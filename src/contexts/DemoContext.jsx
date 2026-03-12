import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DEMO_CLIENTS, DEMO_SUPPLIERS, DEMO_ADMINS, DEMO_ORDERS, DEMO_BIDS,
  getOrdersByClient, getOrdersBySupplier, getBidsForOrder, getUpdatesForOrder,
  getOrderById, getDemoStats,
} from '@/demo/demoData';

const DemoContext = createContext(null);

function getRoleFromPath(pathname) {
  if (pathname.includes('/demo/admin')) return 'admin';
  if (pathname.includes('/demo/supplier')) return 'supplier';
  return 'client';
}

function createNewSession(role = 'client') {
  return {
    sessionId: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    orderCreated: false,
    lastRole: role,
  };
}

/**
 * Demo state is never persisted. On every load/refresh we start with default
 * data so viewers always see the same demo experience.
 */
export function DemoProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Always start with a fresh session and default data (no localStorage)
  const [session, setSession] = useState(() => createNewSession('client'));
  const [demoRole, setDemoRole] = useState(() => getRoleFromPath(window.location.pathname));
  const [orders, setOrders] = useState(() => [...DEMO_ORDERS]);
  const [bids, setBids] = useState(() => [...DEMO_BIDS]);

  // Keep demoRole in sync with URL when navigating within /demo
  React.useEffect(() => {
    if (location.pathname.startsWith('/demo')) {
      const role = getRoleFromPath(location.pathname);
      setDemoRole(role);
    }
  }, [location.pathname]);

  const activeDemoUser = useCallback(() => {
    if (demoRole === 'client') return DEMO_CLIENTS[0];
    if (demoRole === 'supplier') return DEMO_SUPPLIERS[0];
    if (demoRole === 'admin') return DEMO_ADMINS[0];
    return DEMO_CLIENTS[0];
  }, [demoRole])();

  const hasCreatedDemoOrder = session.orderCreated;

  // All orders (admin sees all; client/supplier filtered)
  const allOrders = orders;

  const myOrders = demoRole === 'client'
    ? orders.filter((o) => o.client_id === activeDemoUser.id)
    : demoRole === 'supplier'
    ? orders.filter((o) => o.supplier_id === activeDemoUser.id)
    : orders;

  function switchRole(role) {
    setDemoRole(role);
    setSession((prev) => ({ ...prev, lastRole: role }));
  }

  function getDemoOrderById(id) {
    return orders.find((o) => o.id === id) || null;
  }

  function getDemoBidsForOrder(orderId) {
    return bids.filter((b) => b.order_id === orderId);
  }

  function createDemoOrder(data) {
    if (session.orderCreated) return { success: false, reason: 'limit_reached' };

    const newOrder = {
      id: `do-demo-${Date.now()}`,
      rz_job_id: `RZ-JOB-DEMO1`,
      part_name: data.part_name || 'Demo Part',
      client_id: activeDemoUser.id,
      supplier_id: null,
      order_status: 'PENDING_ADMIN_SCRUB',
      material: data.material || 'Stainless Steel',
      quantity: data.quantity || 1,
      delivery_address: data.delivery_address || 'Demo Address',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: data.notes || '',
      selected_processes: data.selected_processes || ['MATERIAL', 'MACHINING'],
      estimated_value: null,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSession((prev) => ({ ...prev, orderCreated: true }));
    return { success: true, order: newOrder };
  }

  function submitDemoBid(orderId, amount, notes = '') {
    const newBid = {
      id: `db-demo-${Date.now()}`,
      order_id: orderId,
      supplier_id: activeDemoUser.id,
      supplier_name: activeDemoUser.company,
      amount,
      currency: 'GBP',
      lead_time_days: 14,
      notes,
      submitted_at: new Date().toISOString(),
      status: 'pending',
    };
    setBids((prev) => [...prev, newBid]);
    // Update order status to BID_RECEIVED
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, order_status: 'BID_RECEIVED' } : o)
    );
    return { success: true, bid: newBid };
  }

  function updateDemoOrderStatus(orderId, newStatus) {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o)
    );
  }

  function resetDemoSession() {
    setSession(createNewSession(demoRole));
    setOrders([...DEMO_ORDERS]);
    setBids([...DEMO_BIDS]);
  }

  const value = {
    demoRole,
    activeDemoUser,
    hasCreatedDemoOrder,
    allOrders,
    myOrders,
    // data helpers
    getDemoOrderById,
    getDemoBidsForOrder,
    getUpdatesForOrder,
    getDemoStats,
    DEMO_CLIENTS,
    DEMO_SUPPLIERS,
    // actions
    switchRole,
    createDemoOrder,
    submitDemoBid,
    updateDemoOrderStatus,
    resetDemoSession,
    navigate,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoContext must be used inside DemoProvider');
  return ctx;
}

export default DemoContext;
