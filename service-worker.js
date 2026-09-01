'use strict';

const CACHE_NAME = 'padoka-pwa-v8';
const APP_SHELL = [
  './index.html',
  './produto.html',
  './club.html',
  './manifest.webmanifest',
  './assets/logo-padoka.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/catalog.js',
  './assets/frame-guard.js',
  './assets/runtime-security.css',
  './assets/app-shell.css',
  './assets/app-runtime.js',
  './assets/club.css',
  './assets/club.js',
  './assets/padoka-pwa.js?v=4'
];

const PUBLIC_CACHE_PATHS = new Set([
  'index.html',
  'produto.html',
  'club.html',
  'manifest.webmanifest',
  'assets/logo-padoka.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/catalog.js',
  'assets/frame-guard.js',
  'assets/runtime-security.css',
  'assets/app-shell.css',
  'assets/app-runtime.js',
  'assets/club.css',
  'assets/club.js',
  'assets/padoka-pwa.js'
]);

const PRIVATE_PATHS = new Set([
  'internal.html',
  'pedidos.html',
  'pdv.html',
  'gestao.html',
  'mfa.html',
  'enterprise.html',
  'club-admin.html'
]);

const PADOKA_BACKEND_ORIGIN = 'https://yncspxfsvlqdnodlsosb.supabase.co';
const PUBLIC_REMOTE_PATHS = new Set([
  '/functions/v1/padoka-public-config',
  '/auth/v1/settings'
]);

const NOTIFICATION_TARGETS = new Set([
  'index.html',
  'conta.html',
  'acompanhamento.html',
  'club.html'
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

function isCacheableRemoteRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== PADOKA_BACKEND_ORIGIN) return false;
  if (request.headers.has('authorization')) return false;
  return PUBLIC_REMOTE_PATHS.has(url.pathname);
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

async function networkResponse(event, request) {
  if (request.mode === 'navigate' && event.preloadResponse) {
    try {
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
    } catch {}
  }
  return fetch(request);
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
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (isCacheableRemoteRequest(request, url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const refresh = (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return null;
        }
      })();
      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      const response = await refresh;
      return response || Response.error();
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (isCacheableRequest(request, url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const refresh = (async () => {
        try {
          const response = await networkResponse(event, request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return null;
        }
      })();

      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }

      const response = await refresh;
      if (response) return response;
      return Response.error();
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      return await networkResponse(event, request);
    } catch {
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
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png',
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
