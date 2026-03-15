
import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { SupplierProvider } from '@/contexts/SupplierContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScrollToTop from '@/components/ScrollToTop';
import FaviconSwitcher from '@/components/FaviconSwitcher';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import DomainGuard from '@/components/DomainGuard';
import DemoBanner from '@/components/DemoBanner';
import DemoAccessGate from '@/components/DemoAccessGate';
import HomeOrRedirect from '@/pages/HomeOrRedirect';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import { DemoProvider } from '@/contexts/DemoContext';
import { Toaster } from '@/components/ui/toaster';
import { useVersionCheck } from '@/hooks/useVersionCheck';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Auth / onboarding (light pages, eager-ish but infrequent)
const SignupPage           = lazy(() => import('@/pages/SignupPage'));
const OAuthCompletionPage  = lazy(() => import('@/pages/OAuthCompletionPage'));
const OnboardingPage       = lazy(() => import('@/pages/OnboardingPage'));
const PendingApprovalPage  = lazy(() => import('@/pages/PendingApprovalPage'));
const ResetPasswordPage    = lazy(() => import('@/pages/ResetPasswordPage'));
const SetPasswordPage      = lazy(() => import('@/pages/SetPasswordPage'));
const CreatePasswordPage   = lazy(() => import('@/pages/CreatePasswordPage'));

// Public / marketing
const HowItWorksPage   = lazy(() => import('@/pages/HowItWorksPage'));
const PricingPage      = lazy(() => import('@/pages/PricingPage'));
const RoadmapPage      = lazy(() => import('@/pages/RoadmapPage'));
const RequestDemoPage  = lazy(() => import('@/pages/RequestDemoPage'));
const ThemeDemoPage    = lazy(() => import('@/pages/ThemeDemoPage'));
const VrocureLogos     = lazy(() => import('@/components/VrocureLogo'));

// Demo
const DemoEntryPage          = lazy(() => import('@/pages/demo/DemoEntryPage'));
const DemoClientCreateOrder  = lazy(() => import('@/pages/demo/client/DemoClientCreateOrder'));
const DemoClientOrderDetail  = lazy(() => import('@/pages/demo/client/DemoClientOrderDetail'));
const DemoAdminPipeline      = lazy(() => import('@/pages/demo/admin/DemoAdminPipeline'));
const DemoSupplierDashboard  = lazy(() => import('@/pages/demo/supplier/DemoSupplierDashboard'));
const DemoSupplierJobs       = lazy(() => import('@/pages/demo/supplier/DemoSupplierJobs'));
const DemoSupplierJobDetail  = lazy(() => import('@/pages/demo/supplier/DemoSupplierJobDetail'));

// Platform admin
const PlatformAdminLayout        = lazy(() => import('@/components/PlatformAdminLayout'));
const PlatformDashboardPage      = lazy(() => import('@/pages/platform/PlatformDashboardPage'));
const PlatformWorkspacesPage     = lazy(() => import('@/pages/platform/PlatformWorkspacesPage'));
const PlatformUsersPage          = lazy(() => import('@/pages/platform/PlatformUsersPage'));
const PlatformDemoRequestsPage   = lazy(() => import('@/pages/platform/PlatformDemoRequestsPage'));
const PlatformActivityPage       = lazy(() => import('@/pages/platform/PlatformActivityPage'));
const PlatformSettingsPage       = lazy(() => import('@/pages/platform/PlatformSettingsPage'));
const PlatformAuditLogPage       = lazy(() => import('@/pages/platform/PlatformAuditLogPage'));
const PlatformSecurityPage       = lazy(() => import('@/pages/platform/PlatformSecurityPage'));
const PlatformNotificationsPage  = lazy(() => import('@/pages/platform/PlatformNotificationsPage'));
const PlatformJoinlistPage       = lazy(() => import('@/pages/platform/PlatformJoinlistPage'));

// Admin (control centre)
const ControlCentrePage        = lazy(() => import('@/pages/ControlCentrePage'));
const UserManagementPage       = lazy(() => import('@/pages/UserManagementPage'));
const SystemAnalyticsPage      = lazy(() => import('@/pages/SystemAnalyticsPage'));
const ActivityLogsPage         = lazy(() => import('@/pages/ActivityLogsPage'));
const SettingsPage             = lazy(() => import('@/pages/SettingsPage'));
const CommunicationsPage       = lazy(() => import('@/pages/CommunicationsPage'));
const ReportsPage              = lazy(() => import('@/pages/ReportsPage'));
const LinkageDashboard         = lazy(() => import('@/pages/LinkageDashboard'));
const SanitisationEngine       = lazy(() => import('@/pages/SanitisationEngine'));
const AuditVault               = lazy(() => import('@/pages/AuditVault'));
const NCRManagementPage        = lazy(() => import('@/pages/NCRManagementPage'));
const IntakeGatePage           = lazy(() => import('@/pages/IntakeGatePage'));
const SupplierManagementPage   = lazy(() => import('@/pages/SupplierManagementPage'));
const SanitisationGatePage     = lazy(() => import('@/pages/SanitisationGatePage'));
const SanitisationReviewPage   = lazy(() => import('@/pages/SanitisationReviewPage'));
const SupplierPoolPage         = lazy(() => import('@/pages/SupplierPoolPage'));
const AdminDocumentReview      = lazy(() => import('@/pages/AdminDocumentReview'));
const AdminShipmentsPage       = lazy(() => import('@/pages/AdminShipmentsPage'));
const AdminLiveTracking        = lazy(() => import('@/pages/AdminLiveTracking'));
const AdminOrderPreviewPage    = lazy(() => import('@/pages/AdminOrderPreviewPage'));
const ManufacturingProcessesPage = lazy(() => import('@/pages/ManufacturingProcessesPage'));
const AdminAccountSecurityPage = lazy(() => import('@/pages/AdminAccountSecurityPage'));
const BidManagementPage        = lazy(() => import('@/pages/BidManagementPage'));
const BidComparisonPage        = lazy(() => import('@/pages/BidComparisonPage'));
const PurchaseOrdersPage       = lazy(() => import('@/pages/PurchaseOrdersPage'));
const RFQQandAPage             = lazy(() => import('@/pages/RFQQandAPage'));
const RFQTemplatesPage         = lazy(() => import('@/pages/RFQTemplatesPage'));
const AdminInvoicesPage        = lazy(() => import('@/pages/AdminInvoicesPage'));
const SpendAnalyticsPage       = lazy(() => import('@/pages/SpendAnalyticsPage'));
const ApprovalWorkflowsPage    = lazy(() => import('@/pages/ApprovalWorkflowsPage'));
const ContractManagementPage   = lazy(() => import('@/pages/ContractManagementPage'));
const SupplierDiscoveryPage    = lazy(() => import('@/pages/SupplierDiscoveryPage'));
const SupplierScorecardPage    = lazy(() => import('@/pages/SupplierScorecardPage'));
const AdminSupportPage         = lazy(() => import('@/pages/AdminSupportPage'));
const AdminTicketDetailPage    = lazy(() => import('@/pages/AdminTicketDetailPage'));

// Client
const ClientDashboardPage       = lazy(() => import('@/pages/ClientDashboardPage'));
const NCRVisibilityPage         = lazy(() => import('@/pages/NCRVisibilityPage'));
const ShippingTrackingPage      = lazy(() => import('@/pages/ShippingTrackingPage'));
const OrdersOverviewPage        = lazy(() => import('@/pages/OrdersOverviewPage'));
const ClientDocumentLibraryPage = lazy(() => import('@/pages/ClientDocumentLibraryPage'));
const ClientSupportPage         = lazy(() => import('@/pages/ClientSupportPage'));
const ClientOrderCreationPage   = lazy(() => import('@/pages/ClientOrderCreationPage'));
const ClientOrderDetailsPage    = lazy(() => import('@/pages/ClientOrderDetailsPage'));
const LiveOrderTracking         = lazy(() => import('@/pages/LiveOrderTracking'));
const ClientProfilePage         = lazy(() => import('@/pages/ClientProfilePage'));
const ClientSettingsPage        = lazy(() => import('@/pages/ClientSettingsPage'));
const TicketDetailPage          = lazy(() => import('@/pages/TicketDetailPage'));

// Supplier
const SupplierDashboard         = lazy(() => import('@/pages/SupplierDashboard'));
const JobDetailsPage            = lazy(() => import('@/pages/JobDetailsPage'));
const NCRReportingPage          = lazy(() => import('@/pages/NCRReportingPage'));
const SupplierDocumentsPortal   = lazy(() => import('@/pages/SupplierDocumentsPortal'));
const SupplierOrderManager      = lazy(() => import('@/pages/SupplierOrderManager'));
const SupplierSupportPage       = lazy(() => import('@/pages/SupplierSupportPage'));
const SupplierProfilePage       = lazy(() => import('@/pages/SupplierProfilePage'));
const SupplierBiddingPage       = lazy(() => import('@/pages/SupplierBiddingPage'));
const SupplierPurchaseOrdersPage = lazy(() => import('@/pages/SupplierPurchaseOrdersPage'));
const SupplierInvoicesPage      = lazy(() => import('@/pages/SupplierInvoicesPage'));
const SupplierSettingsPage      = lazy(() => import('@/pages/SupplierSettingsPage'));
const SupplierCapabilitiesPage  = lazy(() => import('@/pages/SupplierCapabilitiesPage'));
const SupplierOnboardingPage    = lazy(() => import('@/pages/SupplierOnboardingPage'));

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  useVersionCheck();
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <SubscriptionProvider>
            <AdminProvider>
              <SupplierProvider>
                <ClientProvider>
                  <ScrollToTop />
                  <FaviconSwitcher />
                  <DemoBanner />
                  <DomainGuard>
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomeOrRedirect />} />
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/roadmap" element={<RoadmapPage />} />
                    <Route path="/theme-demo" element={<ThemeDemoPage />} />
                    <Route path="/logo" element={<VrocureLogos />} />
                    <Route path="/request-demo" element={<RequestDemoPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/oauth-completion" element={<OAuthCompletionPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/pending-approval" element={<PendingApprovalPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/set-password" element={<SetPasswordPage />} />
                    <Route path="/create-password" element={<CreatePasswordPage />} />

                    {/* Demo routes */}
                    <Route path="/demo" element={<DemoAccessGate><DemoProvider><Outlet /></DemoProvider></DemoAccessGate>}>
                      <Route index element={<DemoEntryPage />} />
                      <Route path="client/create-order" element={<DemoClientCreateOrder />} />
                      <Route path="client/orders/:id" element={<DemoClientOrderDetail />} />
                      <Route path="admin/pipeline" element={<DemoAdminPipeline />} />
                      <Route path="supplier" element={<DemoSupplierDashboard />} />
                      <Route path="supplier/jobs" element={<DemoSupplierJobs />} />
                      <Route path="supplier/job/:id" element={<DemoSupplierJobDetail />} />
                    </Route>

                    {/* Platform admin */}
                    <Route path="/platform-admin" element={<ProtectedRoute requiredRoles={['super_admin']}><PlatformAdminLayout /></ProtectedRoute>}>
                      <Route index element={<PlatformDashboardPage />} />
                      <Route path="workspaces" element={<PlatformWorkspacesPage />} />
                      <Route path="users" element={<PlatformUsersPage />} />
                      <Route path="demo-requests" element={<PlatformDemoRequestsPage />} />
                      <Route path="activity" element={<PlatformActivityPage />} />
                      <Route path="settings" element={<PlatformSettingsPage />} />
                      <Route path="audit-log" element={<PlatformAuditLogPage />} />
                      <Route path="security" element={<PlatformSecurityPage />} />
                      <Route path="notifications" element={<PlatformNotificationsPage />} />
                      <Route path="join-requests" element={<PlatformJoinlistPage />} />
                    </Route>

                    {/* Admin (control centre) */}
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
                    <Route path="/control-centre/manufacturing-processes" element={<ProtectedRoute requiredRole="admin"><ManufacturingProcessesPage /></ProtectedRoute>} />
                    <Route path="/control-centre/order-preview/:orderId" element={<ProtectedRoute requiredRole="admin"><AdminOrderPreviewPage /></ProtectedRoute>} />
                    <Route path="/control-centre/account-security" element={<ProtectedRoute requiredRole="admin"><AdminAccountSecurityPage /></ProtectedRoute>} />
                    <Route path="/control-centre/bid-management" element={<ProtectedRoute requiredRole="admin"><BidManagementPage /></ProtectedRoute>} />
                    <Route path="/control-centre/bid-comparison/:orderId" element={<ProtectedRoute requiredRole="admin"><BidComparisonPage /></ProtectedRoute>} />
                    <Route path="/control-centre/purchase-orders" element={<ProtectedRoute requiredRole="admin"><PurchaseOrdersPage /></ProtectedRoute>} />
                    <Route path="/control-centre/rfq-qanda/:orderId" element={<ProtectedRoute requiredRole="admin"><RFQQandAPage /></ProtectedRoute>} />
                    <Route path="/control-centre/rfq-templates" element={<ProtectedRoute requiredRole="admin"><RFQTemplatesPage /></ProtectedRoute>} />
                    <Route path="/control-centre/invoices" element={<ProtectedRoute requiredRole="admin"><AdminInvoicesPage /></ProtectedRoute>} />
                    <Route path="/control-centre/spend-analytics" element={<ProtectedRoute requiredRole="admin"><SpendAnalyticsPage /></ProtectedRoute>} />
                    <Route path="/control-centre/approval-workflows" element={<ProtectedRoute requiredRole="admin"><ApprovalWorkflowsPage /></ProtectedRoute>} />
                    <Route path="/control-centre/contracts" element={<ProtectedRoute requiredRole="admin"><ContractManagementPage /></ProtectedRoute>} />
                    <Route path="/control-centre/supplier-discovery" element={<ProtectedRoute requiredRole="admin"><SupplierDiscoveryPage /></ProtectedRoute>} />
                    <Route path="/control-centre/supplier-scorecard" element={<ProtectedRoute requiredRole="admin"><SupplierScorecardPage /></ProtectedRoute>} />
                    <Route path="/control-centre/supplier-scorecard/:supplierId" element={<ProtectedRoute requiredRole="admin"><SupplierScorecardPage /></ProtectedRoute>} />
                    <Route path="/control-centre/support" element={<ProtectedRoute requiredRole="admin"><AdminSupportPage /></ProtectedRoute>} />
                    <Route path="/control-centre/support/:ticketId" element={<ProtectedRoute requiredRole="admin"><AdminTicketDetailPage /></ProtectedRoute>} />

                    {/* Client */}
                    <Route path="/client-dashboard" element={<ProtectedRoute requiredRole="client"><ClientDashboardPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/create-order" element={<ProtectedRoute requiredRole="client"><ClientOrderCreationPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/orders" element={<ProtectedRoute requiredRole="client"><OrdersOverviewPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/orders/:orderId" element={<ProtectedRoute requiredRole="client"><ClientOrderDetailsPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/orders/:orderId/tracking" element={<ProtectedRoute requiredRole="client"><LiveOrderTracking /></ProtectedRoute>} />
                    <Route path="/client-dashboard/documents" element={<ProtectedRoute requiredRole="client"><ClientDocumentLibraryPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/shipping" element={<ProtectedRoute requiredRole="client"><ShippingTrackingPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/ncr-visibility" element={<ProtectedRoute requiredRole="client"><NCRVisibilityPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/profile" element={<ProtectedRoute requiredRole="client"><ClientProfilePage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/settings" element={<ProtectedRoute requiredRole="client"><ClientSettingsPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/support" element={<ProtectedRoute requiredRole="client"><ClientSupportPage /></ProtectedRoute>} />
                    <Route path="/client-dashboard/support/:ticketId" element={<ProtectedRoute requiredRole="client"><TicketDetailPage /></ProtectedRoute>} />

                    {/* Supplier */}
                    <Route path="/supplier-hub" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                    <Route path="/supplier-hub/dashboard" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                    <Route path="/supplier-hub/orders" element={<ProtectedRoute requiredRole="supplier"><SupplierOrderManager /></ProtectedRoute>} />
                    <Route path="/supplier-hub/awarded" element={<ProtectedRoute requiredRole="supplier"><SupplierOrderManager /></ProtectedRoute>} />
                    <Route path="/supplier-hub/job-tracking/:rz_job_id" element={<ProtectedRoute requiredRole="supplier"><JobDetailsPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/documents" element={<ProtectedRoute requiredRole="supplier"><SupplierDocumentsPortal /></ProtectedRoute>} />
                    <Route path="/supplier-hub/ncr" element={<ProtectedRoute requiredRole="supplier"><NCRReportingPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/profile" element={<ProtectedRoute requiredRole="supplier"><SupplierProfilePage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/bidding" element={<ProtectedRoute requiredRole="supplier"><SupplierBiddingPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/purchase-orders" element={<ProtectedRoute requiredRole="supplier"><SupplierPurchaseOrdersPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/invoices" element={<ProtectedRoute requiredRole="supplier"><SupplierInvoicesPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/settings" element={<ProtectedRoute requiredRole="supplier"><SupplierSettingsPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/capabilities" element={<ProtectedRoute requiredRole="supplier"><SupplierCapabilitiesPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/onboarding" element={<ProtectedRoute requiredRole="supplier" skipOnboardingCheck><SupplierOnboardingPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/support" element={<ProtectedRoute requiredRole="supplier"><SupplierSupportPage /></ProtectedRoute>} />
                    <Route path="/supplier-hub/support/:ticketId" element={<ProtectedRoute requiredRole="supplier"><TicketDetailPage /></ProtectedRoute>} />
                  </Routes>
                  </Suspense>
                  </DomainGuard>
                  <Toaster />
                </ClientProvider>
              </SupplierProvider>
            </AdminProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
