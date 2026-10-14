const CACHE = 'nosso-lar-v7-20261013';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('nosso-lar-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, {cache: 'no-store'});
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          cache.put('./index.html', fresh.clone());
        }
        return fresh;
      } catch (error) {
        return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok && url.origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
