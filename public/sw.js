// Kandler Service Worker — enables install-to-device + offline use
// Works on both GitHub Pages (basePath /Kandler/) and dev server (basePath /).
// All paths are resolved relative to the SW's own location.
const CACHE = 'kandler-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      // Pre-cache the app shell + key assets (all relative to SW scope)
      const toCache = ['.', './manifest.json', './icon.png', './favicon.png'];
      return c.addAll(toCache).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;
  // Only handle GET requests for our own scope
  const scope = registration.scope;
  if (!url.pathname.startsWith(new URL(scope).pathname)) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
