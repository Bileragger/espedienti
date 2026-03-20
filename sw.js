/**
 * Espedienti - Service Worker
 * Caches shell assets for offline support and faster loads.
 */

const CACHE_NAME = 'espedienti-v11';

// Assets to cache on install (app shell)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Some shell assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Assets that never change — safe to serve from cache indefinitely
const IMMUTABLE_ORIGINS = [
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

const IMMUTABLE_PATHS = [
  '/icons/',
  '/manifest.webmanifest'
];

function isImmutable(url) {
  if (IMMUTABLE_ORIGINS.some(o => url.hostname.includes(o))) return true;
  if (IMMUTABLE_PATHS.some(p => url.pathname.startsWith(p))) return true;
  return false;
}

// Fetch strategy:
//   - Firebase / external APIs  → bypass SW entirely (network only)
//   - Fonts, CDN libs, icons    → cache-first (immutable)
//   - HTML, JS, CSS (app code)  → network-first, fall back to cache if offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass: Firebase and other APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts'))
  ) {
    return;
  }

  // Cache-first for truly immutable assets
  if (isImmutable(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for all app files (HTML, JS, CSS, images)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // offline fallback
  );
});
