const CACHE_NAME = 'gmb24-v1';
const FILES_TO_CACHE = [
'./',
'./index.html',
'./dashboard.html',
'./admin.html',
'./manifest.json',
'./icon-192.png',
'./icon-512.png'
];

// Installation : on met en cache les fichiers de base
self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
return cache.addAll(FILES_TO_CACHE);
})
);
self.skipWaiting();
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((keyList) => {
return Promise.all(keyList.map((key) => {
if(key !== CACHE_NAME) {
return caches.delete(key);
}
}));
})
);
self.clients.claim();
});

// Fetch : on sert depuis le cache si offline, sinon réseau
self.addEventListener('fetch', (event) => {
event.respondWith(
caches.match(event.request).then((response) => {
return response || fetch(event.request);
})
);
});
