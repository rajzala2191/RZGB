self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('rzgb-cache-v1').then(function(cache) {
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

self.addEventListener('fetch', function(event) {
  // Always fetch index.html from the network to avoid serving stale login/index page
  if (event.request.mode === 'navigate' || event.request.url.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Optionally update the cache with the new index.html
          return caches.open('rzgb-cache-v1').then(function(cache) {
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
