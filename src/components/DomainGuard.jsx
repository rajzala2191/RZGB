import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isLandingDomain, getPortalUrl } from '@/lib/portalConfig';

/**
 * When the app is on the landing domain (zaproc.co.uk), only "/" is valid.
 * Any other path redirects to the portal (portal.zaproc.co.uk) with the same path.
 */
export default function DomainGuard({ children }) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!isLandingDomain()) return;
    if (pathname === '/' || pathname === '') return;
    const target = getPortalUrl(pathname + search + hash);
    window.location.replace(target);
  }, [pathname, search, hash]);

  // On landing domain with a non-root path, we're about to redirect — render nothing to avoid flash
  if (isLandingDomain() && pathname !== '/' && pathname !== '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <p className="text-sm text-gray-500 dark:text-slate-400">Redirecting to portal…</p>
      </div>
    );
  }

  return children;
}
