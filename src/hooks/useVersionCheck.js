import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 60 * 1000; // poll every 60 seconds
const STORAGE_KEY = 'rzgb_app_version';

export function useVersionCheck() {
  const currentVersion = useRef(null);

  useEffect(() => {
    const checkVersion = (isInitial = false) => {
      fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          const latest = String(data.v);
          const stored = localStorage.getItem(STORAGE_KEY);

          if (isInitial) {
            // On first load: just record the current version.
            // index.html is always served fresh (no-cache via .htaccess) so no reload needed.
            // Hashed asset filenames change per build, so stale assets can't load for new builds.
            localStorage.setItem(STORAGE_KEY, latest);
            currentVersion.current = latest;
          } else {
            // On poll: if version changed since this tab loaded, reload
            if (currentVersion.current && latest !== currentVersion.current) {
              localStorage.setItem(STORAGE_KEY, latest);
              window.location.reload();
            }
          }
        })
        .catch(() => {});
    };

    checkVersion(true);
    const interval = setInterval(() => checkVersion(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}
