self.addEventListener('install', function(event) {
  self.skipWaiting(); // Force activate new SW immediately
  event.waitUntil(
    caches.open('rzgb-cache-v3').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/flat-icon-180.png',
        '/manifest.json',
        // Add more assets as needed
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      // Delete all old caches except the new one
      return Promise.all(
        keys.filter(key => key !== 'rzgb-cache-v3').map(key => caches.delete(key))
      );
    }).then(function() {
      return self.clients.claim(); // Take control of all clients immediately
    })
  );
});
self.addEventListener('fetch', function(event) {
  // Always fetch index.html from the network to avoid serving stale login/index page
  if (event.request.mode === 'navigate' || event.request.url.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Update the cache with the new index.html
          return caches.open('rzgb-cache-v3').then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }
  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
