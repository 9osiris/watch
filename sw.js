const CACHE_NAME = "orc-static-v20";
const CLEAN_ROUTE_FALLBACKS = new Map([
  ["/movie", "/movie.html"],
  ["/tv", "/tv.html"],
  ["/search", "/search.html"],
  ["/list", "/list.html"],
  ["/settings", "/settings.html"],
  ["/dmca", "/dmca.html"],
]);

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/search.html",
  "/list.html",
  "/settings.html",
  "/dmca.html",
  "/offline.html",
  "/movie.html",
  "/tv.html",
  "/orc-styles.css",
  "/orc-script.js",
  "/ai-search.css",
  "/ai-search-catalog.js",
  "/ai-search-ui.js",
  "/manifest.json",
  "/favicon.svg",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset)));
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate Strategy for Local Assets
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Only handle local same-origin requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cleanFallback = CLEAN_ROUTE_FALLBACKS.get(url.pathname.replace(/\/$/, ""));
      const cachedResponse = await cache.match(event.request) || (cleanFallback ? await cache.match(cleanFallback) : null);
      const networkFetch = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => null);

      // Return cached version immediately if available, revalidating in background
      if (cachedResponse) {
        // Trigger background revalidation
        event.waitUntil(networkFetch);
        return cachedResponse;
      }

      // If not cached, wait for network
      const res = await networkFetch;
      if (res && res.status !== 404) return res;
      if (cleanFallback) {
        const fallbackResponse = await cache.match(cleanFallback);
        if (fallbackResponse) return fallbackResponse;
      }
      if (res) return res;

      // Fallback for HTML page navigations offline
      if (event.request.mode === "navigate") {
        const fallbackPage = await cache.match("/offline.html") || await cache.match("/index.html") || await cache.match("/");
        if (fallbackPage) return fallbackPage;
      }

      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
