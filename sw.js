// Move service worker — offline-first, versioned cache.
// On every deploy: bump VERSION here AND APP_VERSION in js/version.js,
// and add any new file to ASSETS.

const VERSION = 'move-v0.3.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './js/app.js',
  './js/version.js',
  './js/strings.js',
  './js/pwa.js',
  './js/db.js',
  './js/seed.js',
  './js/repo.js',
  './js/lib/steps.js',
  './js/lib/week.js',
  './js/lib/date.js',
  './js/lib/workout.js',
  './js/ui/stack.js',
  './js/views/workout.js',
  './js/views/templates.js',
  './js/lib/model.js',
  './js/ui/dom.js',
  './js/ui/shell.js',
  './js/ui/theme.js',
  './js/views/today.js',
  './js/views/settings.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  // `cache: 'reload'` bypasses the HTTP cache so a new version never
  // precaches stale files from GitHub Pages' 10-minute CDN cache.
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
  );
  // No skipWaiting() here: the page shows "New version available — Reload"
  // and the user decides when to switch (never mid-workout by surprise).
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('move-') && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App navigations always get the cached shell (works in airplane mode).
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: VERSION }).then((hit) => hit || fetch(req))
    );
    return;
  }

  // Static assets: cache first, network fallback (and fill the cache).
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
