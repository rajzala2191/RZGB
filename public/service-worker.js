// Self-destructing service worker — wipes all caches and unregisters itself.
// Replaces old caching SW to fix stale JS / blank page issues after deploys.

self.addEventListener('install', function() {
  self.skipWaiting(); // Activate immediately, don't wait for old SW to die
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(key) {
          return caches.delete(key);
        }));
      })
      .then(function() {
        return self.clients.claim(); // Take control of all open tabs
      })
      .then(function() {
        return self.registration.unregister(); // Remove this SW entirely
      })
  );
});
