/**
 * Central "directs" — where to send users by role and workspace state.
 * Single source of truth for post-login redirects and portal entry.
 * Aligns with revenue model: workspace = paid ecosystem; onboarding must complete first.
 */

/** Paths for each portal (URLs stay stable for bookmarks/links). */
export const PORTAL_PATHS = {
  /** Workspace admin — their ecosystem (clients, suppliers, orders). */
  WORKSPACE: '/control-centre',
  /** Client view — orders, documents, support (invited by a workspace). */
  CLIENT: '/client-dashboard',
  /** Supplier view — jobs, POs, invoices (invited by a workspace). */
  SUPPLIER: '/supplier-hub',
  /** Platform admin — super_admin only; manage all workspaces. */
  PLATFORM_ADMIN: '/platform-admin',
};

/** Human-facing portal names (for nav, titles, copy). */
export const PORTAL_LABELS = {
  WORKSPACE: 'Workspace',
  CLIENT: 'Client portal',
  SUPPLIER: 'Supplier portal',
  PLATFORM_ADMIN: 'Platform admin',
};

/**
 * Returns the path the user should be sent to after login / when opening the app.
 * Respects workspace status and onboarding so we don't send pending admins to the workspace.
 * @param {string} userRole - 'super_admin' | 'admin' | 'client' | 'supplier'
 * @param {string|null|undefined} workspaceStatus - 'active' | 'pending' | 'archived'
 * @param {string|null|undefined} onboardingStatus - 'not_started' | 'completed' | 'approved' | 'rejected'
 * @returns {string} path to navigate to
 */
export function getDefaultRouteForUser(userRole, workspaceStatus, onboardingStatus) {
  if (!userRole) return '/login';

  if (userRole === 'super_admin') return PORTAL_PATHS.PLATFORM_ADMIN;
  if (userRole === 'client') return PORTAL_PATHS.CLIENT;
  if (userRole === 'supplier') return PORTAL_PATHS.SUPPLIER;

  if (userRole === 'admin') {
    if (workspaceStatus === 'pending') {
      if (onboardingStatus == null || onboardingStatus === 'not_started') return '/onboarding';
      if (onboardingStatus === 'completed') return '/pending-approval';
    }
    if (workspaceStatus === 'archived') return '/pending-approval';
    return PORTAL_PATHS.WORKSPACE;
  }

  return '/login';
}
