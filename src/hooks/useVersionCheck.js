import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 3 * 60 * 1000; // check every 3 minutes

export function useVersionCheck() {
  const currentVersion = useRef(null);

  useEffect(() => {
    // Fetch the version at page load and store it
    fetch('/version.json?t=' + Date.now())
      .then(r => r.json())
      .then(data => { currentVersion.current = data.v; })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch('/version.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
          if (currentVersion.current && data.v !== currentVersion.current) {
            window.location.reload();
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
