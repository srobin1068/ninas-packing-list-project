const CACHE_NAME = 'packmate-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never intercept or cache API/cloud sync requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('api.github.com') || event.request.url.includes('/api/')) {
    return;
  }

  // Network first strategy with offline cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const resCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resCopy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
