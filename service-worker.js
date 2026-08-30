'use strict';

const CACHE_NAME = 'padoka-pwa-v1';
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './assets/logo-padoka.svg',
  './assets/padoka-pwa.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'PADOKA DA VILLA';
  const body = payload.body || 'Seu pedido recebeu uma atualização.';
  const url = payload.url || 'acompanhamento.html';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: payload.icon || './assets/logo-padoka.svg',
    badge: './assets/logo-padoka.svg',
    tag: payload.tag || 'padoka-order-update',
    renotify: true,
    data: { url }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const relativeUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : 'acompanhamento.html';
  const target = new URL(relativeUrl, self.registration.scope).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (!client.url.startsWith(self.registration.scope)) continue;
      try {
        if ('navigate' in client) await client.navigate(target);
      } catch {}
      return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});