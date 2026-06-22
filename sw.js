// Kandler Service Worker — enables install-to-device + offline use
// Works on both GitHub Pages (basePath /Kandler/) and dev server (basePath /).
//
// Caching strategy:
//   - HTML documents (index.html, navigations): NETWORK-FIRST
//     → always fetch fresh HTML from server, fall back to cache if offline
//     → this prevents stale HTML from referencing non-existent chunk hashes
//       after a new deploy
//   - Static assets (_next/static/*, *.js, *.css with hashed names): CACHE-FIRST
//     → these are content-hashed, so a cached file is always valid forever
//   - Images/icons/manifest: STALE-WHILE-REVALIDATE
//     → serve from cache, refresh in background

const CACHE_VERSION = 'kandler-v2';
const PRECACHE = ['./', './manifest.json', './icon.png', './favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Only handle same-scope requests
  const scope = registration.scope;
  if (!url.pathname.startsWith(new URL(scope).pathname)) return;

  // Decide strategy based on request destination
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html');
  const isHashedAsset =
    /\/_next\/static\//.test(url.pathname) ||
    /\.[a-f0-9]{8,}\.(js|css|woff2?|png|jpg|jpeg|svg|webp)$/i.test(url.pathname);

  if (isHTML) {
    // NETWORK-FIRST for HTML — always get the latest from server
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./')))
    );
    return;
  }

  if (isHashedAsset) {
    // CACHE-FIRST for hashed assets — file names are content-hashed, safe forever
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // DEFAULT: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
