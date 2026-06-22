const CACHE_NAME = 'gmb24-raa-v1';
const URLS_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// Installation : on met en cache l'app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activation : on nettoie les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch : on sert depuis le cache si hors ligne
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si on a en cache, on renvoie direct
        if (response) {
          return response;
        }
        // Sinon on va chercher sur internet
        return fetch(event.request).catch(() => {
          // Si pas internet et pas en cache, renvoie index.html
          return caches.match('./index.html');
        });
      })
  );
});
