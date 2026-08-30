'use strict';

const CACHE_NAME = 'padoka-pwa-v2';
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './assets/logo-padoka.svg',
  './assets/padoka-pwa.js?v=2'
];

const PUBLIC_CACHE_PATHS = new Set([
  'index.html',
  'conta.html',
  'acompanhamento.html',
  'manifest.webmanifest',
  'assets/logo-padoka.svg',
  'assets/padoka-pwa.js'
]);

const PRIVATE_PATHS = new Set([
  'internal.html',
  'pedidos.html',
  'pdv.html',
  'gestao.html',
  'mfa.html'
]);

const NOTIFICATION_TARGETS = new Set([
  'index.html',
  'conta.html',
  'acompanhamento.html'
]);

function scopeRelativePath(url) {
  const scopeUrl = new URL(self.registration.scope);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return null;
  return decodeURIComponent(url.pathname.slice(scopeUrl.pathname.length)).replace(/^\/+/, '') || 'index.html';
}

function isCacheableRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) return false;
  const path = scopeRelativePath(url);
  if (!path || PRIVATE_PATHS.has(path)) return false;
  return PUBLIC_CACHE_PATHS.has(path);
}

function notificationTarget(candidate) {
  try {
    const url = new URL(candidate || 'acompanhamento.html', self.registration.scope);
    const path = scopeRelativePath(url);
    if (!path || !NOTIFICATION_TARGETS.has(path)) {
      return new URL('acompanhamento.html', self.registration.scope).href;
    }
    return url.href;
  } catch {
    return new URL('acompanhamento.html', self.registration.scope).href;
  }
}

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
      if (response && response.ok && isCacheableRequest(request, url)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      if (isCacheableRequest(request, url)) {
        const cached = await caches.match(request);
        if (cached) return cached;
      }
      if (request.mode === 'navigate') {
        const path = scopeRelativePath(url);
        if (path && NOTIFICATION_TARGETS.has(path)) {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
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
  const url = notificationTarget(payload.url);

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: './assets/logo-padoka.svg',
    badge: './assets/logo-padoka.svg',
    tag: payload.tag || 'padoka-order-update',
    renotify: true,
    data: { url }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = notificationTarget(event.notification.data && event.notification.data.url);

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
