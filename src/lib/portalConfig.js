/**
 * Landing (zaproc.co.uk) vs Portal (portal.zaproc.co.uk) vs RZGB (rzglobalsolutions.co.uk).
 * Landing domains show only the marketing page at "/"; all app routes live on the portal.
 */

const LANDING_HOST = (import.meta.env.VITE_LANDING_DOMAIN || 'zaproc.co.uk').toLowerCase().replace(/^www\./, '');
const PORTAL_ORIGIN = (import.meta.env.VITE_PORTAL_ORIGIN || 'https://portal.zaproc.co.uk').replace(/\/$/, '');
const RZGB_HOST = (import.meta.env.VITE_RZGB_DOMAIN || 'rzglobalsolutions.co.uk').toLowerCase().replace(/^www\./, '');

function getHostname() {
  if (typeof window === 'undefined') return '';
  return (window.location.hostname || '').toLowerCase().replace(/^www\./, '');
}

/** True when the app is served on the Zaproc landing domain (zaproc.co.uk or www.zaproc.co.uk). */
export function isLandingDomain() {
  const host = getHostname();
  return host === LANDING_HOST || host === `www.${LANDING_HOST}`;
}

/** True when the app is served on the RZGB domain (rzglobalsolutions.co.uk). */
export function isRZGBDomain() {
  const host = getHostname();
  return host === RZGB_HOST || host === `www.${RZGB_HOST}`;
}

/** True when on either brand landing domain (Zaproc or RZGB). */
export function isAnyLandingDomain() {
  return isLandingDomain() || isRZGBDomain();
}

/**
 * Returns the URL for an app path. On any landing domain, returns full portal URL;
 * on the portal, returns the path only (for use with <Link to={path}>).
 */
export function getPortalUrl(path) {
  const p = path && path.startsWith('/') ? path : `/${path || ''}`;
  if (isAnyLandingDomain()) return `${PORTAL_ORIGIN}${p}`;
  return p;
}

/** Use this for cross-origin links (e.g. from landing to portal). Prefer <a href={getPortalUrl(...)}>. */
export function getPortalHref(path) {
  return getPortalUrl(path);
}

export { PORTAL_ORIGIN, LANDING_HOST, RZGB_HOST };
