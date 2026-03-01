
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
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
import AdminBidManagement from '@/pages/AdminBidManagement';
import BidComparisonPage from '@/pages/BidComparisonPage';

// Client Pages
import ClientDashboardPage from '@/pages/ClientDashboardPage';
import QualityVaultPage from '@/pages/QualityVaultPage';
import NCRVisibilityPage from '@/pages/NCRVisibilityPage';
import ShippingTrackingPage from '@/pages/ShippingTrackingPage';
import ProjectsOverviewPage from '@/pages/ProjectsOverviewPage';
import ClientOrderHistoryPage from '@/pages/ClientOrderHistoryPage';
import EnhancedOrderDetailsPage from '@/pages/EnhancedOrderDetailsPage';
import ClientDocumentLibraryPage from '@/pages/ClientDocumentLibraryPage';
import ClientSupportPage from '@/pages/ClientSupportPage';
import ClientProjectCreationPage from '@/pages/ClientProjectCreationPage';
import ClientRFQUploadPage from '@/pages/ClientRFQUploadPage';
import ClientOrderCreationPage from '@/pages/ClientOrderCreationPage';
import ClientOrderDetailsPage from '@/pages/ClientOrderDetailsPage';
import ProjectTrackingPage from '@/pages/ProjectTrackingPage';
import LiveProjectTracking from '@/pages/LiveProjectTracking';

// Supplier Pages
import SupplierDashboard from '@/pages/SupplierDashboard';
import JobDetailsPage from '@/pages/JobDetailsPage';
import NCRReportingPage from '@/pages/NCRReportingPage';
import SupplierJobsPage from '@/pages/SupplierJobsPage';
import TenderDetailsPage from '@/pages/TenderDetailsPage';
import SupplierDocumentsPortal from '@/pages/SupplierDocumentsPortal';
import SupplierProjectManager from '@/pages/SupplierProjectManager';
// Keeping old pages as fallback (deprecated - use SupplierProjectManager instead)
import MaterialUpdatePage from '@/pages/MaterialUpdatePage';
import CastingPage from '@/pages/CastingPage';
import MachiningPage from '@/pages/MachiningPage';
import QCPage from '@/pages/QCPage';
import DispatchPage from '@/pages/DispatchPage';

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
                
                {/* --- ADMIN ROUTES --- */}
                <Route path="/control-centre" element={<ProtectedRoute requiredRole="admin"><ControlCentrePage /></ProtectedRoute>} />
                <Route path="/control-centre/intake-gate" element={<ProtectedRoute requiredRole="admin"><IntakeGatePage /></ProtectedRoute>} />
                <Route path="/control-centre/sanitisation-gate" element={<ProtectedRoute requiredRole="admin"><SanitisationGatePage /></ProtectedRoute>} />
                <Route path="/control-centre/sanitisation-gate/review/:orderId" element={<ProtectedRoute requiredRole="admin"><SanitisationReviewPage /></ProtectedRoute>} />
                <Route path="/control-centre/document-review" element={<ProtectedRoute requiredRole="admin"><AdminDocumentReview /></ProtectedRoute>} />
                <Route path="/control-centre/bid-management" element={<ProtectedRoute requiredRole="admin"><AdminBidManagement /></ProtectedRoute>} />
                <Route path="/control-centre/bid-comparison/:orderId" element={<ProtectedRoute requiredRole="admin"><BidComparisonPage /></ProtectedRoute>} />
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

                {/* --- CLIENT ROUTES --- */}
                <Route path="/client-dashboard" element={<ProtectedRoute requiredRole="client"><ClientDashboardPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/create-order" element={<ProtectedRoute requiredRole="client"><ClientOrderCreationPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders/:orderId" element={<ProtectedRoute requiredRole="client"><ClientOrderDetailsPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/projects" element={<ProtectedRoute requiredRole="client"><ProjectsOverviewPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/projects/:projectId/tracking" element={<ProtectedRoute requiredRole="client"><LiveProjectTracking /></ProtectedRoute>} />
                <Route path="/client-dashboard/projects/:projectId/tracking-legacy" element={<ProtectedRoute requiredRole="client"><ProjectTrackingPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/projects/:orderId" element={<ProtectedRoute requiredRole="client"><ClientOrderDetailsPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/create-project" element={<ProtectedRoute requiredRole="client"><ClientProjectCreationPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/projects/:projectId/upload-rfq" element={<ProtectedRoute requiredRole="client"><ClientRFQUploadPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders" element={<ProtectedRoute requiredRole="client"><ClientOrderHistoryPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/orders-legacy/:orderId" element={<ProtectedRoute requiredRole="client"><EnhancedOrderDetailsPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/quality-vault" element={<ProtectedRoute requiredRole="client"><QualityVaultPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/documents" element={<ProtectedRoute requiredRole="client"><ClientDocumentLibraryPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/shipping" element={<ProtectedRoute requiredRole="client"><ShippingTrackingPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/ncr-visibility" element={<ProtectedRoute requiredRole="client"><NCRVisibilityPage /></ProtectedRoute>} />
                <Route path="/client-dashboard/support" element={<ProtectedRoute requiredRole="client"><ClientSupportPage /></ProtectedRoute>} />

                {/* --- SUPPLIER ROUTES --- */}
                <Route path="/supplier-hub" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                <Route path="/supplier-hub/dashboard" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                <Route path="/supplier-hub/projects" element={<ProtectedRoute requiredRole="supplier"><SupplierProjectManager /></ProtectedRoute>} />
                <Route path="/supplier-hub/jobs" element={<ProtectedRoute requiredRole="supplier"><SupplierJobsPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/jobs/:tenderId" element={<ProtectedRoute requiredRole="supplier"><TenderDetailsPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/job-tracking/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><JobDetailsPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/documents" element={<ProtectedRoute requiredRole="supplier"><SupplierDocumentsPortal /></ProtectedRoute>} />
                <Route path="/supplier-hub/ncr" element={<ProtectedRoute requiredRole="supplier"><NCRReportingPage /></ProtectedRoute>} />
                {/* Legacy routes - deprecated, use SupplierProjectManager instead */}
                <Route path="/supplier-hub/material-update/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><MaterialUpdatePage /></ProtectedRoute>} />
                <Route path="/supplier-hub/casting/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><CastingPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/machining/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><MachiningPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/qc/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><QCPage /></ProtectedRoute>} />
                <Route path="/supplier-hub/dispatch/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><DispatchPage /></ProtectedRoute>} />
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
