import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_CLIENTS, DEMO_SUPPLIERS, DEMO_ADMINS, DEMO_ORDERS, DEMO_BIDS,
  getOrdersByClient, getOrdersBySupplier, getBidsForOrder, getUpdatesForOrder,
  getOrderById, getDemoStats,
} from '@/demo/demoData';

const DemoContext = createContext(null);

const SESSION_KEY = 'rzgb-demo-session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (_) {}
}

function createNewSession(role = 'client') {
  return {
    sessionId: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    orderCreated: false,
    lastRole: role,
  };
}

export function DemoProvider({ children }) {
  const navigate = useNavigate();

  // Load or create session
  const [session, setSession] = useState(() => {
    const existing = loadSession();
    return existing || createNewSession('client');
  });

  const [demoRole, setDemoRole] = useState(() => {
    const existing = loadSession();
    return existing?.lastRole || 'client';
  });

  // In-memory orders (may include a demo-created order appended at runtime)
  const [orders, setOrders] = useState([...DEMO_ORDERS]);
  const [bids, setBids] = useState([...DEMO_BIDS]);

  // Persist session on change
  useEffect(() => {
    saveSession({ ...session, lastRole: demoRole });
  }, [session, demoRole]);

  // Save new session on first mount if none existed
  useEffect(() => {
    const existing = loadSession();
    if (!existing) saveSession(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const updated = { ...session, lastRole: role };
    setSession(updated);
    saveSession(updated);
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
    const updated = { ...session, orderCreated: true };
    setSession(updated);
    saveSession(updated);
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
    const fresh = createNewSession(demoRole);
    setSession(fresh);
    setOrders([...DEMO_ORDERS]);
    setBids([...DEMO_BIDS]);
    saveSession(fresh);
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
