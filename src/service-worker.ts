// This optional code is used to register a service worker.
// register() is not called by default.

/* eslint-disable no-restricted-globals, @typescript-eslint/no-unused-expressions */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

// In einer vollständigen Workbox-Konfiguration würde das Manifest verwendet werden.
// Wir verwenden hier einen einfacheren Ansatz mit manueller Asset-Liste.

// Add the custom service worker code here.
// Your service worker here
self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open('worktime-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/logo192.png',
        '/logo512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  event.respondWith(
    // @ts-ignore
    caches.match(event.request).then((response) => {
      // @ts-ignore
      return response || fetch(event.request);
    })
  );
});

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // @ts-ignore
    self.skipWaiting();
  }
});

// Any other custom service worker logic can go here. 