/**
 * Access policy — single source of truth for roles and route protection.
 * Use with ProtectedRoute; keep in sync with App.jsx route definitions and RLS.
 *
 * Rules:
 * - All portal data access is scoped by workspace_id (RLS); never bypass.
 * - Route access is role-based; no cross-role access to other role's paths.
 * - Onboarding gates run before role checks (pending workspace → onboarding; supplier not approved → supplier onboarding).
 */

// ── Roles (must match profiles.role / user_role enum) ─────────────────────
export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLIENT: 'client',
  SUPPLIER: 'supplier',
});

/** Role hierarchy: higher index = higher privilege. super_admin can bypass to platform-admin only. */
export const ROLE_HIERARCHY = [ROLES.SUPPLIER, ROLES.CLIENT, ROLES.ADMIN, ROLES.SUPER_ADMIN];

/** Path prefixes that require a single role. Use requiredRole for these. */
const PATH_TO_ROLE = Object.freeze({
  '/platform-admin': ROLES.SUPER_ADMIN,
  '/control-centre': ROLES.ADMIN,
  '/client-dashboard': ROLES.CLIENT,
  '/supplier-hub': ROLES.SUPPLIER,
});

/** Paths that require multiple possible roles (use requiredRoles array). */
const PATH_TO_ROLES = Object.freeze({
  '/platform-admin': [ROLES.SUPER_ADMIN],
});

/** Paths where supplier onboarding gate is skipped (user must be able to reach onboarding page). */
export const SUPPLIER_SKIP_ONBOARDING_PATHS = ['/supplier-hub/onboarding'];

/** Public paths (no auth required). */
export const PUBLIC_PATHS = [
  '/', '/landing', '/how-it-works', '/pricing', '/roadmap', '/request-demo',
  '/login', '/signup', '/reset-password', '/set-password', '/create-password',
  '/oauth-completion', '/onboarding', '/pending-approval', '/demo', '/theme-demo', '/logos', '/logo',
];

/** Paths that require auth but no specific role (e.g. onboarding, pending-approval). */
const AUTH_ONLY_PATHS = ['/onboarding', '/pending-approval'];

/**
 * Returns the required role for a path (single role).
 * For platform-admin use getRequiredRoles(path) which returns ['super_admin'].
 */
export function getRequiredRole(path) {
  const normalized = path.replace(/\/$/, '') || '/';
  for (const [prefix, role] of Object.entries(PATH_TO_ROLE)) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) return role;
  }
  return null;
}

/**
 * Returns required roles array for ProtectedRoute (requiredRoles prop).
 * Platform-admin is the only route that uses requiredRoles={['super_admin']}.
 */
export function getRequiredRoles(path) {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/platform-admin' || normalized.startsWith('/platform-admin/')) {
    return [ROLES.SUPER_ADMIN];
  }
  const single = getRequiredRole(path);
  return single ? [single] : [];
}

/**
 * Default redirect path after login for a given role (used by LoginContainer / HomeOrRedirect).
 */
export function getDefaultRedirectForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN: return '/platform-admin';
    case ROLES.ADMIN: return '/control-centre';
    case ROLES.CLIENT: return '/client-dashboard';
    case ROLES.SUPPLIER: return '/supplier-hub';
    default: return '/';
  }
}

/**
 * Whether a path should use skipOnboardingCheck for supplier (so they can reach onboarding page).
 */
export function shouldSkipSupplierOnboardingCheck(path) {
  const normalized = (path || '').replace(/\/$/, '');
  return SUPPLIER_SKIP_ONBOARDING_PATHS.some((p) => normalized === p || normalized.startsWith(p + '/'));
}

/**
 * Strict: can this role access this path? (Does not consider onboarding/MFA; use ProtectedRoute for full gate.)
 */
export function isPathAllowedForRole(userRole, path, { isSuperAdmin = false } = {}) {
  if (PUBLIC_PATHS.includes(path)) return true;
  const required = getRequiredRoles(path);
  if (required.length === 0) return true; // auth-only or public
  if (isSuperAdmin && required.includes(ROLES.SUPER_ADMIN)) return true;
  return required.includes(userRole);
}

/**
 * All protected path prefixes and their required role (for documentation and tooling).
 * App.jsx ProtectedRoute must stay in sync with this.
 */
export const PROTECTED_ROUTE_SPEC = Object.freeze({
  platformAdmin: { pathPrefix: '/platform-admin', requiredRoles: [ROLES.SUPER_ADMIN] },
  controlCentre: { pathPrefix: '/control-centre', requiredRole: ROLES.ADMIN },
  clientDashboard: { pathPrefix: '/client-dashboard', requiredRole: ROLES.CLIENT },
  supplierHub: { pathPrefix: '/supplier-hub', requiredRole: ROLES.SUPPLIER, skipOnboardingFor: '/supplier-hub/onboarding' },
});
