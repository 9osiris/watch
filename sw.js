const CACHE_NAME = "orc-static-v43";
const TMDB_CACHE_NAME = "orc-tmdb-runtime-v2";
const TMDB_CACHE_MAX_ENTRIES = 200;
const TMDB_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const CLEAN_ROUTES = new Set(["/", "/movie", "/tv", "/anime", "/search", "/list", "/settings", "/privacy", "/dmca"]);
const HTML_TO_CLEAN = new Map([
  ["/index.html", "/"],
  ["/movie.html", "/movie"],
  ["/tv.html", "/tv"],
  ["/anime.html", "/anime"],
  ["/search.html", "/search"],
  ["/list.html", "/list"],
  ["/settings.html", "/settings"],
  ["/privacy.html", "/privacy"],
  ["/dmca.html", "/dmca"],
]);
const CLEAN_ROUTE_FALLBACKS = new Map([
  ["/movie", "/movie.html"],
  ["/tv", "/tv.html"],
  ["/anime", "/anime.html"],
  ["/search", "/search.html"],
  ["/list", "/list.html"],
  ["/settings", "/settings.html"],
  ["/privacy", "/privacy.html"],
  ["/dmca", "/dmca.html"],
]);

const STATIC_ASSETS = [
  "/",
  "/anime",
  "/search",
  "/list",
  "/settings",
  "/privacy",
  "/dmca",
  "/offline.html",
  "/movie",
  "/tv",
  "/orc-styles.css",
  "/backdrop.js",
  "/orc-script.js",
  "/ai-search.css",
  "/ai-search-catalog.js",
  "/ai-search-ui.js",
  "/favicon.svg",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/manifest.json"
];

async function cleanResponse(response) {
  if (!response || !response.redirected) return response;
  return new Response(response.body, Object.assign({}, response, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  }));
}

// Manage TMDB cache eviction (max 200 items, 24h expiry)
async function trimTmdbCache(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > TMDB_CACHE_MAX_ENTRIES) {
      const toDelete = keys.slice(0, keys.length - TMDB_CACHE_MAX_ENTRIES);
      await Promise.all(toDelete.map(k => cache.delete(k)));
    }
  } catch (err) {
    // Ignore cache trim errors
  }
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
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== TMDB_CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate Strategy for Local Assets and TMDB Catalog GETs
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Fast Stale-While-Revalidate for TMDB JSON catalog queries
  if (url.hostname === "api.themoviedb.org" && url.pathname.startsWith("/3/")) {
    event.respondWith(
      caches.open(TMDB_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const cachedDate = cached ? new Date(cached.headers.get("sw-cached-date") || 0).getTime() : 0;
        const isExpired = cached && (Date.now() - cachedDate > TMDB_CACHE_MAX_AGE_MS);

        const networkPromise = fetch(event.request)
          .then(async res => {
            if (res && res.status === 200) {
              const headers = new Headers(res.headers);
              headers.set("sw-cached-date", new Date().toISOString());
              const blob = await res.blob();
              const toCache = new Response(blob, {
                status: res.status,
                statusText: res.statusText,
                headers
              });
              await cache.put(event.request, toCache);
              trimTmdbCache(cache);
              return new Response(blob, {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers
              });
            }
            return res;
          })
          .catch(() => null);

        if (cached && !isExpired) {
          if (typeof event.waitUntil === "function") event.waitUntil(networkPromise);
          return cached;
        }

        const netRes = await networkPromise;
        if (netRes) return netRes;
        if (cached) return cached; // Serve expired as last-resort fallback

        // If both network and cache fail, do NOT return fake empty 200 or 503 JSON
        throw new TypeError("Failed to fetch TMDB data");
      })
    );
    return;
  }

  // Only handle local same-origin requests below
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

      const networkFetch = fetch(fetchTarget, event.request.mode === "navigate" ? { redirect: "follow" } : undefined)
        .then(async res => {
          if (res && (res.status === 200 || res.status === 0)) {
            const clean = await cleanResponse(res);
            cache.put(cacheKey, clean.clone());
            return clean;
          }
          return res;
        })
        .catch(() => null);

      if (cachedResponse) {
        event.waitUntil(networkFetch);
        return cachedResponse;
      }

      const freshResponse = await networkFetch;
      if (freshResponse) return freshResponse;

      // When navigation fails offline, serve offline.html
      if (event.request.mode === "navigate") {
        const offlinePage = await cache.match("/offline.html");
        if (offlinePage) return offlinePage;
      }

      return new Response("Network offline and asset not cached.", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    })
  );
});
