const CACHE_NAME = 'medinovel-static-__BUILD_ID__';
const APP_SHELL = ['/index.html', '/manifest.json', '/pwa-192.png', '/pwa-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const html = await (await cache.match('/index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set(assets)]);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith('medinovel-static-') && name !== CACHE_NAME).map((name) => caches.delete(name)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/index.html')) || Response.error();
    }));
    return;
  }

  if (url.pathname.startsWith('/assets/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    }));
  }
});
