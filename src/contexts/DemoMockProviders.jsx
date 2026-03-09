/**
 * DemoMockProviders
 * -----------------
 * Wraps real production pages with mock context values so they render with
 * demo data instead of making Supabase calls. Sits inside <DemoProvider>.
 *
 * Also:
 *  - Provides a DemoNavInterceptor that redirects production paths → demo paths
 *    so sidebar navigation stays within the demo experience.
 *  - Injects the DemoBanner fixed overlay.
 *  - Adds pt-12 to the page body so content isn't hidden behind the banner.
 */

import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthContext } from '@/contexts/AuthContext';
import { ClientContext } from '@/contexts/ClientContext';
import { AdminContext } from '@/contexts/AdminContext';
import { SupplierContext } from '@/contexts/SupplierContext';
import { useDemoContext } from '@/contexts/DemoContext';
import DemoBanner from '@/components/DemoBanner';
import { getDemoRedirect } from '@/demo/demoRouteMap';

function DemoNavInterceptor() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/demo')) return; // already in demo — no interception needed

    const demoPath = getDemoRedirect(path);
    if (demoPath) navigate(demoPath, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

// ── Main provider ─────────────────────────────────────────────────────────────
export default function DemoMockProviders({ children }) {
  const { demoRole, activeDemoUser, allOrders } = useDemoContext();

  // ── Mock AuthContext value ──────────────────────────────────────────────────
  const navigate = useNavigate();

  const mockCurrentUser = {
    id: activeDemoUser.id,
    email: activeDemoUser.email,
    user_metadata: { full_name: activeDemoUser.name },
    isDemo: true,
  };

  const mockAuthValue = {
    currentUser: mockCurrentUser,
    userRole: demoRole,
    userCompanyName: activeDemoUser.company,
    userLogoUrl: null,
    loading: false,
    login: async () => ({ data: null, error: new Error('Demo mode — no real auth') }),
    logout: useCallback(() => navigate('/landing'), [navigate]),
    refreshProfile: async () => {},
  };

  // ── Mock ClientContext value ────────────────────────────────────────────────
  // Filters to orders belonging to the active demo client
  const clientOrders = allOrders.filter((o) => o.client_id === activeDemoUser.id);

  const mockClientValue = {
    orders: clientOrders,
    documents: [],
    loading: false,
    error: null,
    refreshData: () => {},
  };

  // ── Mock AdminContext value ─────────────────────────────────────────────────
  // Admin sees all orders; pendingOrdersCount from demo data
  const pendingOrdersCount = allOrders.filter((o) => o.order_status === 'PENDING_ADMIN_SCRUB').length;

  const mockAdminValue = {
    orders: allOrders,
    documents: [],
    pendingOrdersCount,
    auditLogs: [],
    loading: false,
    error: null,
    refreshData: () => {},
  };

  // ── Mock SupplierContext value ──────────────────────────────────────────────
  const supplierOrders = allOrders.filter((o) => o.supplier_id === activeDemoUser.id);

  const mockSupplierValue = {
    orders: supplierOrders,
    documents: [],
    loading: false,
    error: null,
    refreshData: () => {},
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      <ClientContext.Provider value={mockClientValue}>
        <AdminContext.Provider value={mockAdminValue}>
          <SupplierContext.Provider value={mockSupplierValue}>
            {/* Intercept any production-path navigation and redirect to demo paths */}
            <DemoNavInterceptor />
            {/* Fixed demo banner (z-200) sits on top of production layouts */}
            <DemoBanner />
            {/* pt-12 so page content starts below the 48px demo banner */}
            <div className="pt-12">
              {children}
            </div>
          </SupplierContext.Provider>
        </AdminContext.Provider>
      </ClientContext.Provider>
    </AuthContext.Provider>
  );
}
