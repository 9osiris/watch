const CACHE_NAME = "orc-static-v21";
const CLEAN_ROUTES = new Set(["/", "/movie", "/tv", "/search", "/list", "/settings", "/dmca"]);
const HTML_TO_CLEAN = new Map([
  ["/index.html", "/"],
  ["/movie.html", "/movie"],
  ["/tv.html", "/tv"],
  ["/search.html", "/search"],
  ["/list.html", "/list"],
  ["/settings.html", "/settings"],
  ["/dmca.html", "/dmca"],
]);
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
  "/search",
  "/list",
  "/settings",
  "/dmca",
  "/offline.html",
  "/movie",
  "/tv",
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

function cleanResponse(response) {
  if (!response || !response.redirected) return Promise.resolve(response);
  return response.blob().then(body => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  }));
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        STATIC_ASSETS.map(async asset => {
          const res = await fetch(asset, { cache: "reload", redirect: "follow" });
          if (res && res.ok) {
            await cache.put(asset, await cleanResponse(res));
          }
        })
      );
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

// Stale-While-Revalidate Strategy for Local Assets (with redirect-safe navigation responses)
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Only handle local same-origin requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const pathname = url.pathname.replace(/\/$/, "") || "/";
  const canonicalRoute = HTML_TO_CLEAN.get(pathname) || (CLEAN_ROUTES.has(pathname) ? pathname : null);
  const cleanFallback = canonicalRoute ? CLEAN_ROUTE_FALLBACKS.get(canonicalRoute) : CLEAN_ROUTE_FALLBACKS.get(pathname);

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const rawCached = await cache.match(event.request)
        || (canonicalRoute ? await cache.match(canonicalRoute) : null)
        || (cleanFallback ? await cache.match(cleanFallback) : null);
      const cachedResponse = await cleanResponse(rawCached);

      const fetchTarget = event.request.mode === "navigate"
        ? new URL((canonicalRoute || pathname) + url.search, url.origin).href
        : event.request;
      const cacheKey = canonicalRoute || event.request;

      const networkFetch = fetch(fetchTarget, event.request.mode === "navigate" ? { redirect: "follow", credentials: "same-origin" } : undefined)
        .then(async networkResponse => {
          if (!networkResponse) return null;
          const sanitized = await cleanResponse(networkResponse);
          if (sanitized && sanitized.status === 200 && (sanitized.type === "basic" || sanitized.type === "default")) {
            cache.put(cacheKey, sanitized.clone());
          }
          return sanitized;
        })
        .catch(() => null);

      if (cachedResponse) {
        event.waitUntil(networkFetch);
        return cachedResponse;
      }

      const res = await networkFetch;
      if (res && res.status !== 404) return res;
      if (cleanFallback) {
        const fallbackResponse = await cleanResponse(await cache.match(cleanFallback));
        if (fallbackResponse) return fallbackResponse;
      }
      if (res) return res;

      // Fallback for HTML page navigations offline
      if (event.request.mode === "navigate") {
        const fallbackPage = await cleanResponse(
          await cache.match("/offline.html") || await cache.match("/") || await cache.match("/index.html")
        );
        if (fallbackPage) return fallbackPage;
      }

      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
