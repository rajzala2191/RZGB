/**
 * Three-domain setup:
 *   www.rzglobalsolutions.co.uk — RZ Global Solutions marketing site
 *   www.vrocure.co.uk           — Vrocure marketing/landing page
 *   portal.vrocure.co.uk        — Vrocure app portal (all app routes live here)
 *
 * Both landing domains show only "/" and redirect all other paths to the portal.
 */

const RZGB_HOST    = (import.meta.env.VITE_RZGB_DOMAIN    || 'rzglobalsolutions.co.uk').toLowerCase().replace(/^www\./, '');
const LANDING_HOST = (import.meta.env.VITE_LANDING_DOMAIN || 'vrocure.co.uk').toLowerCase().replace(/^www\./, '');
const PORTAL_ORIGIN = (import.meta.env.VITE_PORTAL_ORIGIN || 'https://portal.vrocure.co.uk').replace(/\/$/, '');

function getHostname() {
  if (typeof window === 'undefined') return '';
  return (window.location.hostname || '').toLowerCase().replace(/^www\./, '');
}

/** True when served on the Vrocure landing domain (vrocure.co.uk or www.vrocure.co.uk). */
export function isLandingDomain() {
  const host = getHostname();
  return host === LANDING_HOST || host === `www.${LANDING_HOST}`;
}

/** True when served on the RZ Global Solutions domain (rzglobalsolutions.co.uk). */
export function isRZGBDomain() {
  const host = getHostname();
  return host === RZGB_HOST || host === `www.${RZGB_HOST}`;
}

/** True when on either brand landing domain (Vrocure or RZGB). */
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
