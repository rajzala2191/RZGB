import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isLandingDomain, isRZGBDomain, getPortalUrl } from '@/lib/portalConfig';

/**
 * When the app is on a landing domain (vrocure.co.uk or rzglobalsolutions.co.uk),
 * only "/" is valid. Any other path redirects to the portal (portal.vrocure.co.uk).
 */
export default function DomainGuard({ children }) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!isLandingDomain() && !isRZGBDomain()) return;
    if (pathname === '/' || pathname === '') return;
    const target = getPortalUrl(pathname + search + hash);
    window.location.replace(target);
  }, [pathname, search, hash]);

  // On any landing domain with a non-root path, we're about to redirect — render nothing to avoid flash
  if ((isLandingDomain() || isRZGBDomain()) && pathname !== '/' && pathname !== '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <p className="text-sm text-gray-500 dark:text-slate-400">Redirecting to portal…</p>
      </div>
    );
  }

  return children;
}
