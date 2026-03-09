/**
 * Maps production route prefixes → demo equivalents.
 * Used by:
 *   - ProtectedRoute (catches nav leaving the /demo/* tree)
 *   - DemoNavInterceptor inside DemoMockProviders (catches any stragglers)
 *
 * Order matters: more-specific prefixes must come before shorter ones.
 */
export const DEMO_ROUTE_MAP = [
  // Client
  ['/client-dashboard/create-order',            '/demo/client/create-order'],
  ['/client-dashboard/orders',                  '/demo/client/orders'],
  ['/client-dashboard/documents',               '/demo/client/documents'],
  ['/client-dashboard/shipping',                '/demo/client/shipping'],
  ['/client-dashboard',                         '/demo/client'],
  // Admin — most sub-pages redirect to pipeline (they use direct supabase calls)
  ['/control-centre/sanitisation-gate',         '/demo/admin/pipeline'],
  ['/control-centre/intake-gate',               '/demo/admin/pipeline'],
  ['/control-centre/live-tracking',             '/demo/admin/pipeline'],
  ['/control-centre/supplier-pool',             '/demo/admin/pipeline'],
  ['/control-centre/linkage',                   '/demo/admin/pipeline'],
  ['/control-centre/users',                     '/demo/admin/pipeline'],
  ['/control-centre/reports',                   '/demo/admin/pipeline'],
  ['/control-centre/shipments',                 '/demo/admin/pipeline'],
  ['/control-centre/analytics',                 '/demo/admin/pipeline'],
  ['/control-centre/logs',                      '/demo/admin/pipeline'],
  ['/control-centre/settings',                  '/demo/admin/pipeline'],
  ['/control-centre/communications',            '/demo/admin/pipeline'],
  ['/control-centre/support',                   '/demo/admin/pipeline'],
  ['/control-centre/document-review',           '/demo/admin/pipeline'],
  ['/control-centre/audit-vault',               '/demo/admin/pipeline'],
  ['/control-centre/ncr-management',            '/demo/admin/pipeline'],
  ['/control-centre/supplier-management',       '/demo/admin/pipeline'],
  ['/control-centre/manufacturing-processes',   '/demo/admin/pipeline'],
  ['/control-centre/order-preview',             '/demo/admin/pipeline'],
  ['/control-centre',                           '/demo/admin'],
  // Supplier
  ['/supplier-hub/job-tracking/',               '/demo/supplier/job/'],
  ['/supplier-hub/orders',                      '/demo/supplier/jobs'],
  ['/supplier-hub/awarded',                     '/demo/supplier/jobs'],
  ['/supplier-hub',                             '/demo/supplier'],
];

/**
 * Returns the demo redirect path for a given production pathname,
 * or null if no mapping exists.
 */
export function getDemoRedirect(pathname) {
  for (const [from, to] of DEMO_ROUTE_MAP) {
    if (pathname === from || pathname.startsWith(from + '/') || pathname.startsWith(from)) {
      const suffix = pathname.slice(from.length);
      return to + suffix;
    }
  }
  return null;
}
