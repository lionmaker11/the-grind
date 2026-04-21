// sw.js v17 — Project Board era. Retire /api/today + today.json; cache /api/backlog.
const CACHE_NAME = 'the-grind-v17';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-128.png',
  '/icons/icon-256.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first with cache fallback for the Project Board (GET /api/backlog
  // with no query params). Lets the user open the PWA offline and still see a
  // stale board rather than an empty screen.
  if (url.pathname === '/api/backlog' && e.request.method === 'GET' && !url.search.includes('project_id=')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(new Request(url.pathname), clone));
        return res;
      }).catch(() => caches.match(new Request(url.pathname)))
    );
    return;
  }

  // Network-only: write/upload/audio routes — must never be cached
  if (
    url.pathname === '/api/upload' ||
    url.pathname === '/api/sync' ||
    url.pathname === '/api/transcribe'
  ) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ ok: false, offline: true, error: 'offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Remaining API calls: network only, never cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ offline: true, error: 'No connection' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
