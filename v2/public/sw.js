// TheGrind V2 service worker — Phase 7.
//
// Hand-rolled (no workbox/vite-plugin-pwa — stack lock forbids new
// dependencies; the strategy below doesn't need a build-time precache
// manifest because Vite's hashed /assets/* are immutable by name).
//
// Strategy:
//   - /api/*            network ONLY (never cache data or mutations)
//   - /assets/*         cache-first (content-hashed filenames =
//                       immutable; a new build references new names)
//   - navigations ('/') network-first, falling back to the cached
//                       shell when offline
//   - other same-origin GET (manifest, icons, public/assets images)
//                       network-first with cache fallback
//
// Install precaches '/' AND the hashed assets it references (parsed
// from the built index.html) so offline boot works after the FIRST
// visit — registration happens on window load, after the page's own
// assets loaded outside SW control, so without this the asset cache
// would only warm on later controlled fetches (Codex Phase 7 P1).
//
// V1-ghost killswitch: registering at scope '/' takes over any V1
// service worker registration, and activate() deletes EVERY cache
// whose name isn't the current CACHE — V1 caches, old V2 versions,
// anything. skipWaiting + clients.claim make takeover immediate for
// new loads; an already-open V1-controlled page converts on its next
// reload (documented residual).
//
// All cache writes are wrapped in event.waitUntil so iOS can't
// terminate the worker mid-write (Codex Phase 7 P2).
//
// CACHE version: bump the suffix when the caching STRATEGY changes
// (not per deploy — hashed assets handle content freshness).

const CACHE = 'grind-v2-sw-1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch('/');
        if (res.ok) {
          const html = await res.clone().text();
          await cache.put('/', res);
          // Precache the hashed bundles referenced by the shell.
          const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
            .map((m) => m[1]);
          await Promise.all(
            assetPaths.map(async (path) => {
              try {
                const assetRes = await fetch(path);
                if (assetRes.ok) await cache.put(path, assetRes);
              } catch { /* individual asset failures don't block install */ }
            })
          );
        }
      } catch { /* offline install — cache warms on later fetches */ }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // mutations always hit the network

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fonts etc. — browser default

  // Data layer: network only. An offline /api failure surfaces through
  // the app's own error handling (offline indicator), never stale data.
  if (url.pathname.startsWith('/api/')) return;

  // Immutable hashed bundles: cache-first.
  if (url.pathname.startsWith('/assets/') && /-[A-Za-z0-9_-]{8,}\./.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigations: network-first so deploys land immediately; cached
  // shell keeps the app booting offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put('/', copy)));
          }
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Everything else same-origin (manifest, icons, public images):
  // network-first with cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
