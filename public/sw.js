
const CACHE_VERSION = 787;
const CACHE_NAME = `idk-cache-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_ASSETS);
    })()
  );
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Get all existing cache keys
      const cacheKeys = await caches.keys();

      // Delete the previous cache(s) (except for the current one)
      await Promise.all(
        cacheKeys.map(async (cacheKey) => {
          if (cacheKey !== CACHE_NAME) {
            await caches.delete(cacheKey);
          }
        })
      );
    })()
  );
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        // Cache hit, return the cached response
        return cachedResponse;
      } else {
        try {
          // Check if it's a GET request
          if (event.request.method === 'GET') {
            // Try to fetch from the network
            const response = await fetch(event.request);

            // Clone the response since it can only be consumed once
            const responseClone = response.clone();

            // Cache the fetched response for future use
            cache.put(event.request, responseClone);

            return response;
          } else {
            // For other requests (e.g., POST), simply fetch from the network
            return fetch(event.request);
          }
        } catch (error) {
          // If both cache and network fail, return a custom offline page or an error response
          return new Response('Offline fallback page here...');
        }
      }
    })()
  );
});

// Event listener for push notifications
self.addEventListener('push', (event) => {
  const notificationData = JSON.parse(event.data.text());

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.message,
      icon: notificationData.icon,
      data: notificationData.data,
    })
  );
});
