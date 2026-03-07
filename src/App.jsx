
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { SupplierProvider } from '@/contexts/SupplierContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import RootRedirect from '@/pages/RootRedirect';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

// Admin Pages
import ControlCentrePage from '@/pages/ControlCentrePage';
import UserManagementPage from '@/pages/UserManagementPage';
import SystemAnalyticsPage from '@/pages/SystemAnalyticsPage';
import ActivityLogsPage from '@/pages/ActivityLogsPage';
import SettingsPage from '@/pages/SettingsPage';
import CommunicationsPage from '@/pages/CommunicationsPage';
import ReportsPage from '@/pages/ReportsPage';
import LinkageDashboard from '@/pages/LinkageDashboard';
import SanitisationEngine from '@/pages/SanitisationEngine';
import AuditVault from '@/pages/AuditVault';
import NCRManagementPage from '@/pages/NCRManagementPage';
import IntakeGatePage from '@/pages/IntakeGatePage';
import SupplierManagementPage from '@/pages/SupplierManagementPage';
import SanitisationGatePage from '@/pages/SanitisationGatePage';
import SanitisationReviewPage from '@/pages/SanitisationReviewPage';
import SupplierPoolPage from '@/pages/SupplierPoolPage';
import AdminDocumentReview from '@/pages/AdminDocumentReview';
import AdminShipmentsPage from '@/pages/AdminShipmentsPage';
import AdminLiveTracking from '@/pages/AdminLiveTracking';
import AdminOrderPreviewPage from '@/pages/AdminOrderPreviewPage';


// Client Pages
import ClientDashboardPage from '@/pages/ClientDashboardPage';
import NCRVisibilityPage from '@/pages/NCRVisibilityPage';
import ShippingTrackingPage from '@/pages/ShippingTrackingPage';
import OrdersOverviewPage from '@/pages/OrdersOverviewPage';
import ClientDocumentLibraryPage from '@/pages/ClientDocumentLibraryPage';
import ClientSupportPage from '@/pages/ClientSupportPage';
import ClientOrderCreationPage from '@/pages/ClientOrderCreationPage';
import ClientOrderDetailsPage from '@/pages/ClientOrderDetailsPage';
import LiveOrderTracking from '@/pages/LiveOrderTracking';

// Supplier Pages
import SupplierDashboard from '@/pages/SupplierDashboard';
import JobDetailsPage from '@/pages/JobDetailsPage';
import NCRReportingPage from '@/pages/NCRReportingPage';

import SupplierDocumentsPortal from '@/pages/SupplierDocumentsPortal';
import SupplierOrderManager from '@/pages/SupplierOrderManager';
import SupplierSupportPage from '@/pages/SupplierSupportPage';
import SupplierProfilePage from '@/pages/SupplierProfilePage';
import ClientProfilePage from '@/pages/ClientProfilePage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import AdminSupportPage from '@/pages/AdminSupportPage';
import AdminTicketDetailPage from '@/pages/AdminTicketDetailPage';

import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AdminProvider>
              <SupplierProvider>
                <ClientProvider>
                <ScrollToTop />
                <Routes>
                {/* Root & Auth */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* --- ADMIN ROUTES --- */}
                <Route path="/control-centre" element={<ProtectedRoute requiredRole="admin"><ControlCentrePage /></ProtectedRoute>} />
                <Route path="/control-centre/intake-gate" element={<ProtectedRoute requiredRole="admin"><IntakeGatePage /></ProtectedRoute>} />
                <Route path="/control-centre/sanitisation-gate" element={<ProtectedRoute requiredRole="admin"><SanitisationGatePage /></ProtectedRoute>} />
                <Route path="/control-centre/sanitisation-gate/review/:orderId" element={<ProtectedRoute requiredRole="admin"><SanitisationReviewPage /></ProtectedRoute>} />
                <Route path="/control-centre/document-review" element={<ProtectedRoute requiredRole="admin"><AdminDocumentReview /></ProtectedRoute>} />
                <Route path="/control-centre/live-tracking" element={<ProtectedRoute requiredRole="admin"><AdminLiveTracking /></ProtectedRoute>} />

                <Route path="/control-centre/supplier-pool" element={<ProtectedRoute requiredRole="admin"><SupplierPoolPage /></ProtectedRoute>} />
                <Route path="/control-centre/linkage" element={<ProtectedRoute requiredRole="admin"><LinkageDashboard /></ProtectedRoute>} />
                <Route path="/control-centre/sanitisation" element={<ProtectedRoute requiredRole="admin"><SanitisationEngine /></ProtectedRoute>} />
                <Route path="/control-centre/audit-vault" element={<ProtectedRoute requiredRole="admin"><AuditVault /></ProtectedRoute>} />
                <Route path="/control-centre/users" element={<ProtectedRoute requiredRole="admin"><UserManagementPage /></ProtectedRoute>} />
                <Route path="/control-centre/analytics" element={<ProtectedRoute requiredRole="admin"><SystemAnalyticsPage /></ProtectedRoute>} />
                <Route path="/control-centre/logs" element={<ProtectedRoute requiredRole="admin"><ActivityLogsPage /></ProtectedRoute>} />
                <Route path="/control-centre/settings" element={<ProtectedRoute requiredRole="admin"><SettingsPage /></ProtectedRoute>} />
                <Route path="/control-centre/communications" element={<ProtectedRoute requiredRole="admin"><CommunicationsPage /></ProtectedRoute>} />
                <Route path="/control-centre/reports" element={<ProtectedRoute requiredRole="admin"><ReportsPage /></ProtectedRoute>} />
                <Route path="/control-centre/ncr-management" element={<ProtectedRoute requiredRole="admin"><NCRManagementPage /></ProtectedRoute>} />
                <Route path="/control-centre/supplier-management" element={<ProtectedRoute requiredRole="admin"><SupplierManagementPage /></ProtectedRoute>} />
                <Route path="/control-centre/shipments" element={<ProtectedRoute requiredRole="admin"><AdminShipmentsPage /></ProtectedRoute>} />
                <Route path="/control-centre/order-preview/:orderId" element={<ProtectedRoute requiredRole="admin"><AdminOrderPreviewPage /></ProtectedRoute>} />

                {/* --- CLIENT ROUTES --- */}
                <Route path="/client-dashboard" element={<ProtectedRoute requiredRole="client"><ClientDashboardPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/create-order" element={<ProtectedRoute requiredRole="client"><ClientOrderCreationPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders" element={<ProtectedRoute requiredRole="client"><OrdersOverviewPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders/:orderId" element={<ProtectedRoute requiredRole="client"><ClientOrderDetailsPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders/:orderId/tracking" element={<ProtectedRoute requiredRole="client"><LiveOrderTracking /></ProtectedRoute>} />
<Route path="/client-dashboard/documents" element={<ProtectedRoute requiredRole="client"><ClientDocumentLibraryPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/shipping" element={<ProtectedRoute requiredRole="client"><ShippingTrackingPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/ncr-visibility" element={<ProtectedRoute requiredRole="client"><NCRVisibilityPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/profile" element={<ProtectedRoute requiredRole="client"><ClientProfilePage /></ProtectedRoute>} />
                <Route path="/client-dashboard/support" element={<ProtectedRoute requiredRole="client"><ClientSupportPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/support/:ticketId" element={<ProtectedRoute requiredRole="client"><TicketDetailPage /></ProtectedRoute>} />

                {/* --- SUPPLIER ROUTES --- */}
                <Route path="/supplier-hub" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                <Route path="/supplier-hub/dashboard" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                <Route path="/supplier-hub/orders" element={<ProtectedRoute requiredRole="supplier"><SupplierOrderManager /></ProtectedRoute>} />
                <Route path="/supplier-hub/awarded" element={<ProtectedRoute requiredRole="supplier"><SupplierOrderManager /></ProtectedRoute>} />

                <Route path="/supplier-hub/job-tracking/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><JobDetailsPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/documents" element={<ProtectedRoute requiredRole="supplier"><SupplierDocumentsPortal /></ProtectedRoute>} />
                <Route path="/supplier-hub/ncr" element={<ProtectedRoute requiredRole="supplier"><NCRReportingPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/profile" element={<ProtectedRoute requiredRole="supplier"><SupplierProfilePage /></ProtectedRoute>} />
                <Route path="/supplier-hub/support" element={<ProtectedRoute requiredRole="supplier"><SupplierSupportPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/support/:ticketId" element={<ProtectedRoute requiredRole="supplier"><TicketDetailPage /></ProtectedRoute>} />
                <Route path="/control-centre/support" element={<ProtectedRoute requiredRole="admin"><AdminSupportPage /></ProtectedRoute>} />
                <Route path="/control-centre/support/:ticketId" element={<ProtectedRoute requiredRole="admin"><AdminTicketDetailPage /></ProtectedRoute>} />
              </Routes>
                <Toaster />
              </ClientProvider>
            </SupplierProvider>
          </AdminProvider>
        </AuthProvider>
      </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
