const CACHE_NAME = "gmb24-v5";
const FILES = [
  "/",
  "/index.html",
  "/admin.html",
  "/dashboard.html",
  "/firebaseConfig.js",
  "/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() => caches.match("/index.html"));
    })
  );
});
