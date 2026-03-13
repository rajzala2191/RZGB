/**
 * Landing (zaproc.co.uk) vs Portal (portal.zaproc.co.uk).
 * Landing shows only the marketing page at "/"; all app routes live on the portal.
 */

const LANDING_HOST = (import.meta.env.VITE_LANDING_DOMAIN || 'zaproc.co.uk').toLowerCase().replace(/^www\./, '');
const PORTAL_ORIGIN = (import.meta.env.VITE_PORTAL_ORIGIN || 'https://portal.zaproc.co.uk').replace(/\/$/, '');

function getHostname() {
  if (typeof window === 'undefined') return '';
  return (window.location.hostname || '').toLowerCase().replace(/^www\./, '');
}

/** True when the app is served on the landing domain (zaproc.co.uk or www.zaproc.co.uk). */
export function isLandingDomain() {
  const host = getHostname();
  return host === LANDING_HOST || host === `www.${LANDING_HOST}`;
}

/**
 * Returns the URL for an app path. On the landing domain, returns full portal URL;
 * on the portal, returns the path only (for use with <Link to={path}>).
 */
export function getPortalUrl(path) {
  const p = path && path.startsWith('/') ? path : `/${path || ''}`;
  if (isLandingDomain()) return `${PORTAL_ORIGIN}${p}`;
  return p;
}

/** Use this for cross-origin links (e.g. from landing to portal). Prefer <a href={getPortalUrl(...)}>. */
export function getPortalHref(path) {
  return getPortalUrl(path);
}

export { PORTAL_ORIGIN, LANDING_HOST };
