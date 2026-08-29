// FindIt Ghana — service worker (PWA).
// Strategy: network-first for pages (prices must stay fresh), cache-first
// for static assets (JS/CSS/icons), offline fallback to the cached homepage.
// Never touches cross-origin requests (product images, APIs, Supabase).
const CACHE = "findit-ghana-v2";
const OFFLINE_URL = "/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  // Only handle same-origin requests — leave product images, APIs and
  // analytics untouched so nothing can be served stale.
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first with background refresh.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/favicon")) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          const refresh = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || refresh;
        })
      )
    );
    return;
  }

  // Page navigations: network-first (fresh prices), offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return res;
        })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(OFFLINE_URL)))
    );
  }
});
