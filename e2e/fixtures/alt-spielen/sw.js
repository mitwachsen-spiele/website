// Service Worker wie das alte Spiel (nur für e2e/retire.spec.ts): legt die Seite in einen Cache mitwachsen-* und
// liefert sie von dort, auch wenn der Server inzwischen etwas anderes hat.
const CACHE = 'mitwachsen-alt';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add('/spielen/'))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((hit) => hit ?? fetch(event.request)));
});
