"use strict";

const APP_CONFIG = {
  TMDB_API_KEY: "5622cafbfe8f8cfe358a29c53e19bba0",
  SUPABASE_URL: "https://ewuiiwaqjsyilinkdobm.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dWlpd2FxanN5aWxpbmtkb2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1ODAxMTcsImV4cCI6MjEwMjE1NjExN30.S2ogyCUHzaQuXV5jCyT-u3zIX2wzt1m23qFvMeEL05I"
};

const TMDB_KEY  = APP_CONFIG.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W500  = "https://image.tmdb.org/t/p/w500";
const IMG_W45   = "https://image.tmdb.org/t/p/w45";
const IMG_ORIG  = "https://image.tmdb.org/t/p/original";
const IMG_W780  = "https://image.tmdb.org/t/p/w780";
const BRAND     = "Osiris Watch";
const ACCENT     = "3b82f6";

const APP_ROUTES = {
  home: "/",
  movie: "/movie.html",
  tv: "/tv.html",
  search: "/search.html",
  list: "/list.html",
  settings: "/settings.html",
  dmca: "/dmca.html",
};

const CLEAN_ROUTE_PATHS = {
  movie: "/movie",
  tv: "/tv",
  search: "/search",
  list: "/list",
  settings: "/settings",
  dmca: "/dmca",
};

function routeUrl(route, params = "") {
  const base = CLEAN_ROUTE_PATHS[route] || APP_ROUTES[route] || route || "/";
  if (!params) return base;
  const query = params instanceof URLSearchParams ? params.toString() : String(params).replace(/^\?/, "");
  return query ? `${base}?${query}` : base;
}

function authRedirectUrl() {
  const origin = ["osiris.rocks", "www.osiris.rocks"].includes(window.location.hostname)
    ? "https://watch.osiris.rocks"
    : window.location.origin;
  return new URL(routeUrl("settings"), origin).href;
}

function pagePathMatches(pathname, route) {
  const p = pathname.replace(/\/$/, "") || "/";
  const htmlPath = (APP_ROUTES[route] || "").replace(/\/$/, "");
  const cleanPath = (CLEAN_ROUTE_PATHS[route] || "").replace(/\/$/, "");
  return p === htmlPath || p.endsWith(htmlPath) || p === cleanPath || p.endsWith(cleanPath);
}

const PROVIDERS = [
  { id: "cinesrc", name: "CineSrc (Recommended)",
    movie: id => `https://cinesrc.st/embed/movie/${id}?color=%23${ACCENT}&autoplay=true`,
    tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&color=%23${ACCENT}&autoplay=true` },
  { id: "vidking", name: "VidKing",
    movie: id => `https://www.vidking.net/embed/movie/${id}?color=${ACCENT}&autoPlay=true`,
    tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=${ACCENT}&autoPlay=true&nextEpisode=true&episodeSelector=true` },
  { id: "vidsrc", name: "VidSrc",
    movie: id => `https://vidsrc-embed.ru/embed/movie/${id}?autoplay=1`,
    tv: (id, s, e) => `https://vidsrc-embed.ru/embed/tv/${id}/${s}/${e}?autoplay=1` },
  { id: "vidsrc2", name: "VidSrc 2",
    movie: id => `https://vidsrc-embed.su/embed/movie/${id}?autoplay=1`,
    tv: (id, s, e) => `https://vidsrc-embed.su/embed/tv/${id}/${s}/${e}?autoplay=1` },
  { id: "111movies", name: "111Movies",
    movie: id => `https://111movies.com/movie/${id}`,
    tv: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}` },
];

const PLAYER_HOSTS = [
  "vidking.net", "www.vidking.net",
  "vidsrc-embed.ru", "vidsrc-embed.su", "vidsrcme.su", "vsrc.su",
  "v2.vidsrc.me", "vidsrc.me",
  "111movies.com", "www.111movies.com",
  "cinesrc.st", "www.cinesrc.st",
];

const GENRES = [
  { name: "Action", id: 28 }, { name: "Comedy", id: 35 }, { name: "Horror", id: 27 },
  { name: "Sci-Fi", id: 878 }, { name: "Romance", id: 10749 }, { name: "Drama", id: 18 },
  { name: "Thriller", id: 53 }, { name: "Animation", id: 16 },
];

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>`,
  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>`,
  tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M8 22h8M12 19v3"/></svg>`,
  trend: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L19 7"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>`,
  clapper: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

function initNotificationDropdown() {
  const bellBtn = $("#topnav-bell-btn");
  if (!bellBtn || bellBtn._bound) return;
  bellBtn._bound = true;

  let popover = $("#notif-popover");
  if (!popover) {
    popover = document.createElement("div");
    popover.id = "notif-popover";
    popover.className = "notif-popover glass-surface";
    popover.setAttribute("aria-hidden", "true");
    popover.innerHTML = `
      <div class="notif-popover-header">
        <h3 class="notif-popover-title">New Episodes</h3>
        <p class="notif-popover-sub">From your watchlist this week</p>
      </div>
      <div class="notif-popover-divider"></div>
      <div class="notif-popover-body" id="notif-popover-body">
        <div class="notif-empty-state">No new episodes this week</div>
      </div>
    `;
    document.body.appendChild(popover);
  }

  const togglePopover = (show) => {
    const isVisible = show ?? !popover.classList.contains("is-open");
    popover.classList.toggle("is-open", isVisible);
    popover.setAttribute("aria-hidden", isVisible ? "false" : "true");
    bellBtn.setAttribute("aria-expanded", isVisible ? "true" : "false");
    bellBtn.classList.toggle("active", isVisible);

    if (isVisible) {
      const rect = bellBtn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + 10}px`;
      popover.style.right = `${Math.max(16, window.innerWidth - rect.right - 8)}px`;
    }
  };

  bellBtn.addEventListener("click", e => {
    e.stopPropagation();
    togglePopover();
  });

  document.addEventListener("click", e => {
    if (popover.classList.contains("is-open") && !popover.contains(e.target) && !bellBtn.contains(e.target)) {
      togglePopover(false);
    }
  });

  window.addEventListener("scroll", () => {
    if (popover.classList.contains("is-open")) togglePopover(false);
  }, { passive: true });
}


function dedupeItems(items) {
  if (!Array.isArray(items)) return [];
  const hideAdult = SETTINGS.get(SETTINGS.hideAdultKey, "1") !== "0";
  const seen = new Set();
  return items.filter(item => {
    if (!item || !item.id) return false;
    if (hideAdult && item.adult === true) return false;
    const type = item.media_type || (item.title ? "movie" : "tv");
    const key = `${type}_${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ===== IndexedDB Async Storage Adapter =====
const DB_NAME = "OsirisWatchDB";
const DB_VERSION = 1;
const STORE_NAME = "keyValueStore";
let _dbPromise = null;

function safeGetItem(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (err) { console.warn('Caught error:', err);
    return fallback;
  }
}

function safeSetItem(key, val) {
  try {
    try {
      localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded. Clearing old items.');
        localStorage.removeItem('orc_tmdb_cache'); // Try to free up space
        localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
      } else {
        throw e;
      }
    }
    return true;
  } catch (err) { console.warn('Caught error:', err);
    return false;
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) { console.warn('Caught error:', err);
    return false;
  }
}

function getDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve) => {
    if (!window.indexedDB) { resolve(null); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
  return _dbPromise;
}

async function idbGet(key) {
  try {
    const db = await getDB();
    if (!db) return safeGetItem(key, null);
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? safeGetItem(key, null));
      req.onerror = () => resolve(safeGetItem(key, null));
    });
  } catch (err) { console.warn('Caught error:', err); return safeGetItem(key, null); }
}

async function idbSet(key, val) {
  safeSetItem(key, typeof val === "string" ? val : JSON.stringify(val));
  try {
    const db = await getDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(val, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) { console.warn('Caught error:', err); return false; }
}

// ===== Supabase Client Initialization =====
const SUPABASE_URL = APP_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = APP_CONFIG.SUPABASE_ANON_KEY;

let supabaseClient = null;
function getSupabaseClient() {
  if (window.supabase) {
    try {
      if (!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabaseClient;
    } catch (err) { console.warn('Caught error:', err); }
  }
  return null;
}

// ===== Swipe-To-Dismiss Mobile Modals =====
function initSwipeToDismissModals() {
  if (window._swipeModalBound) return;
  window._swipeModalBound = true;
  document.addEventListener("touchstart", e => {
    const box = e.target.closest(".modal-box");
    if (!box) return;
    const startY = e.touches[0].clientY;
    let currentY = startY;

    const onTouchMove = (ev) => {
      currentY = ev.touches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        box.style.transform = `translateY(${diffY}px)`;
        box.style.transition = "none";
      }
    };

    const onTouchEnd = () => {
      const diffY = currentY - startY;
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      if (diffY > 65) {
        box.style.transform = "translateY(100%)";
        box.style.transition = "transform 0.25s var(--ease)";
        setTimeout(() => {
          box.style.transform = "";
          closeModal();
        }, 250);
      } else {
        box.style.transform = "";
        box.style.transition = "transform 0.25s var(--ease)";
      }
    };

    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
  }, { passive: true });
}

// ===== IntersectionObserver Lazy DOM Card Loading =====
let _rowObserver = null;
function observeLazyRow(rowWrapper, loadCardsFn) {
  if (!("IntersectionObserver" in window)) {
    loadCardsFn();
    return;
  }
  if (!_rowObserver) {
    _rowObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const wrapper = entry.target;
          if (wrapper._loadCardsFn) {
            wrapper._loadCardsFn();
            delete wrapper._loadCardsFn;
          }
          obs.unobserve(wrapper);
        }
      });
    }, { rootMargin: "250px 0px" });
  }
  rowWrapper._loadCardsFn = loadCardsFn;
  _rowObserver.observe(rowWrapper);
}

function prefersReducedMotion() {
  return SETTINGS?.get?.(SETTINGS.reduceMotionKey) === "1"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let modalReturnFocus = null;

function trapModalFocus(modal, label = "Dialog") {
  modalReturnFocus = document.activeElement;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", label);
  
  modal.addEventListener("keydown", function(e) {
    if (e.key === "Tab") {
      const focusableEls = modal.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
      const firstFocusable = focusableEls[0];
      const lastFocusable = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    }
  });

  requestAnimationFrame(() => {
    const defaultFocus = modal.querySelector(".modal-close, .modal-close-btn") || modal.querySelector('button, input');
    if (defaultFocus) defaultFocus.focus();
  });
}

function releaseModalFocus() {
  if (modalReturnFocus?.focus) modalReturnFocus.focus();
  modalReturnFocus = null;
}

const TMDB_CACHE_MAX = 100;
const TMDB_CACHE_TTL = 10 * 60 * 1000;
const _tmdbCache = new Map();

function tmdb(path, retries = 1, opts = {}) {
  if (opts.signal?.aborted) return Promise.reject(Object.assign(new Error("Search cancelled"), { name: "AbortError" }));
  const now = Date.now();
  const cached = _tmdbCache.get(path);
  if (!opts.signal && cached && (now - cached.time < TMDB_CACHE_TTL)) {
    return cached.req;
  }

  const req = (async () => {
    let finalPath = path;
    const hideAdult = SETTINGS.get(SETTINGS.hideAdultKey, "1") !== "0";
    const isSearchOrDiscover = finalPath.startsWith("/search/") || finalPath.startsWith("/discover/");
    if (hideAdult && isSearchOrDiscover && !finalPath.includes("include_adult=")) {
      const pSep = finalPath.includes("?") ? "&" : "?";
      finalPath = `${finalPath}${pSep}include_adult=false`;
    }
    const sep = finalPath.includes("?") ? "&" : "?";
    let attempts = 0;
    while (attempts <= retries) {
      attempts++;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const forwardAbort = () => ctrl.abort();
      opts.signal?.addEventListener("abort", forwardAbort, { once: true });
      if (opts.signal?.aborted) ctrl.abort();
      try {
        const res = await fetch(`${TMDB_BASE}${finalPath}${sep}api_key=${TMDB_KEY}`, { signal: ctrl.signal });
        if (res.status === 429) { toast("TMDB Rate limit exceeded. Please wait a moment."); throw new Error("TMDB Rate Limit 429"); }
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
        return await res.json();
      } catch (err) {
        if (err.name === 'AbortError' || attempts > retries) throw err;
        await new Promise(r => setTimeout(r, 600));
      } finally {
        clearTimeout(timer);
        opts.signal?.removeEventListener("abort", forwardAbort);
      }
    }
  })();

  if (opts.signal) return req;

  req.catch(() => _tmdbCache.delete(path));

  if (_tmdbCache.size >= TMDB_CACHE_MAX) {
    const oldestKey = _tmdbCache.keys().next().value;
    if (oldestKey) _tmdbCache.delete(oldestKey);
  }

  _tmdbCache.set(path, { req, time: now });
  return req;
}

const IMG_W342  = "https://image.tmdb.org/t/p/w342";
function posterUrl(p, size = "w342") {
  if (!p) return null;
  return size === "w500" ? `${IMG_W500}${p}` : `${IMG_W342}${p}`;
}
function year(d) { 
  if (!d || typeof d !== "string" || d === "NaN") return "";
  const y = new Date(d).getFullYear();
  return isNaN(y) ? d.slice(0, 4) : y.toString();
}
function formatVotes(count) {
  if (!count) return "";
  return count >= 1000 ? (count / 1000).toFixed(1) + "k votes" : count + " votes";
}
function formatRuntime(m) {
  if (!m) return "";
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h ${r}m` : `${r}m`;
}
function fmtMoney(n) {
  if (!n) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${n.toLocaleString()}`;
}
function pickTrailer(videos) {
  const list = videos?.results || videos || [];
  return list.find(v => v.type === "Trailer" && v.site === "YouTube") || list.find(v => v.site === "YouTube");
}
function genreTags(genres, type) {
  if (!genres || !Array.isArray(genres)) return "";
  return (genres || []).map(g =>
    `<a href="${routeUrl("search")}?type=${type}&genre=${g.id}" class="tag tag-link">${esc(g.name)}</a>`
  ).join("");
}
function renderWatchProviders(container, providers, country = "US") {
  if (!container) return;
  const reg = providers?.results?.[country];
  if (!reg) { container.textContent = ""; container.style.display = "none"; return; }
  const seen = new Set();
  const items = [...(reg.flatrate || []), ...(reg.rent || []), ...(reg.buy || [])].filter(p => {
    if (seen.has(p.provider_id)) return false;
    seen.add(p.provider_id);
    return p.logo_path;
  }).slice(0, 10);
  if (!items.length) { container.style.display = "none"; return; }
  container.style.display = "";
  container.innerHTML = `<div class="watch-providers"><span class="wp-label">Also on</span><div class="wp-logos">${items.map(p =>
    `<img src="${esc(IMG_W45 + (p.logo_path || ""))}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}" loading="lazy"/>`
  ).join("")}</div></div>`;
}
const PINNED_SIDEBAR_PAGES = new Set(["settings", "dmca", "search"]);

function renderKeywords(container, keywords, type) {
  if (!container) return;
  const list = keywords?.keywords || keywords?.results || [];
  if (!list.length) { container.textContent = ""; container.style.display = "none"; return; }
  container.style.display = "";
  container.innerHTML = `
    <div class="detail-extra-block">
      <h3 class="detail-extra-label">Keywords</h3>
      <div class="keywords-row">${list.slice(0, 10).map(k =>
        `<a href="${routeUrl("search")}?type=${type}&q=${encodeURIComponent(k.name)}" class="keyword-pill">${esc(k.name)}</a>`
      ).join("")}</div>
    </div>`;
}
function renderCastRow(cast) {
  const section = $("#cast-section");
  const row = $("#cast-row");
  if (!section || !row || !cast.length) return;
  section.style.display = "";
  row.textContent = "";
  cast.forEach(a => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "cast-item";
    d.setAttribute("aria-label", `${a.name}${a.character ? `, as ${a.character}` : ""}`);
    d.innerHTML = `${a.profile_path ? `<img src="${esc(IMG_W500 + a.profile_path)}" alt="${esc(a.name || '')}" loading="lazy" draggable="false"/>` : `<div class="cast-placeholder"></div>`}<div class="name" title="${esc(a.name)}">${esc(a.name)}</div><div class="role" title="${esc(a.character || "")}">${esc(a.character || "")}</div>`;
    d.addEventListener("click", () => openPersonModal(a.id));
    row.appendChild(d);
  });
}
function renderCardRow(sectionSel, rowSel, items, type) {
  const section = $(sectionSel);
  const row = $(rowSel);
  if (!section || !row || !items.length) return;
  section.style.display = "";
  row.textContent = "";
  items.forEach(it => row.appendChild(buildCard(it, type)));
}
function ensureRecommendSection() {
  let sec = $("#recommend-section");
  if (sec) return sec.querySelector(".similar-row");
  sec = document.createElement("section");
  sec.id = "recommend-section";
  sec.style.display = "none";
  sec.innerHTML = `<h2 class="section-head">Recommended For You</h2><div class="similar-row" id="recommend-row"></div>`;
  $("#similar-section")?.before(sec);
  return sec.querySelector(".similar-row");
}
function hostAfter(el, id) {
  let node = $(`#${id}`);
  if (!node && el) {
    node = document.createElement("div");
    node.id = id;
    el.after(node);
  }
  return node;
}
async function openPersonModal(id) {
  let modal = $("#person-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "person-modal";
    modal.className = "modal-overlay person-modal";
    modal.innerHTML = `<button class="modal-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="modal-box"><div class="spinner" style="margin:40px auto"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").addEventListener("click", closePersonModal);
    modal.addEventListener("click", e => { if (e.target === modal) closePersonModal(); });
  }
  const box = modal.querySelector(".modal-box");
  box.innerHTML = `<div class="spinner" style="margin:40px auto"></div>`;
  modal.classList.add("open");
  trapModalFocus(modal, "Cast member");
  try {
    const p = await tmdb(`/person/${id}?append_to_response=combined_credits`);
    const credits = (p.combined_credits?.cast || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12);
    box.innerHTML = `
      <div class="person-head">
        ${p.profile_path ? `<img src="${esc(IMG_W500 + p.profile_path)}" alt="${esc(p.name || '')}"/>` : `<div class="person-ph"></div>`}
        <div>
          <h2>${esc(p.name)}</h2>
          <p>${esc(p.known_for_department || "")}${p.place_of_birth ? ` · ${esc(p.place_of_birth)}` : ""}</p>
        </div>
      </div>
      ${p.biography ? `<p style="font-size:0.82rem;color:var(--text-muted);line-height:1.55;margin-bottom:16px">${esc(p.biography.slice(0, 280))}${p.biography.length > 280 ? "…" : ""}</p>` : ""}
      <div class="person-credits">
        <h3>Known for</h3>
        <div class="person-credit-list">${credits.map(c => {
          const kind = c.media_type === "tv" ? "tv" : "movie";
          const href = kind === "tv" ? `${routeUrl("tv")}?id=${c.id}` : `${routeUrl("movie")}?id=${c.id}`;
          const title = c.title || c.name || "Untitled";
          return `<a href="${href}"><span>${esc(title)}</span><span>${year(c.release_date || c.first_air_date)}</span></a>`;
        }).join("")}</div>
      </div>`;
  } catch {
    box.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px">Couldn't load this profile.</p>`;
  }
}
function closePersonModal() {
  $("#person-modal")?.classList.remove("open");
  releaseModalFocus();
}
function esc(s = "") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtVotes(n) {
  if (!n) return "";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k votes` : `${n} votes`;
}

function mediaType(item, fallback = "movie") {
  if (item._type) return item._type;
  const mt = item.media_type;
  if (mt === "tv" || mt === "movie") return mt;
  if (item.title) return "movie";
  if (item.name) return "tv";
  return fallback;
}

function homeUrl() {
  return "/";
}

function getProvider() { return safeGetItem("orc_provider") || PROVIDERS[0].id; }
function setProvider(id) { safeSetItem("orc_provider", id); }

const SETTINGS = {
  accentKey: "orc_accent",
  reduceMotionKey: "orc_reduce_motion",
  hideWatchedKey: "orc_hide_watched",
  hideAdultKey: "orc_hide_adult",
  autoplayTrailersKey: "orc_autoplay_trailers",
  prefLangKey: "orc_pref_lang",
  layoutKey: "orc_grid_layout",
  themeKey: "orc_theme",
  bgStyleKey: "orc_bg_style",
  bgSyncAccentKey: "orc_bg_sync_accent",
  bgColorKey: "orc_bg_color",
  bgSpeedKey: "orc_bg_speed",
  bgGrainKey: "orc_bg_grain",
  get(k, def = "") {
    if (k === "orc_hide_adult" || k === "orc_bg_sync_accent") return safeGetItem(k, "1") ?? "1";
    return safeGetItem(k) ?? def;
  },
  set(k, v) {
    safeSetItem(k, v);
    if (k === "orc_accent" || k === "orc_theme" || k === "orc_grid_layout" || k.startsWith("orc_bg_")) {
      SupabaseSync.pushUserMetadata();
    }
    if (!safeSetItem(k, v)) toast("Couldn't save setting. Storage may be full.");
  },
  toggle(k) {
    const defVal = (k === "orc_hide_adult" || k === "orc_bg_sync_accent") ? "1" : "0";
    const cur = safeGetItem(k, defVal);
    const on = cur === "1";
    const next = on ? "0" : "1";
    if (!safeSetItem(k, next)) toast("Couldn't save setting. Storage may be full.");
    if (k.startsWith("orc_bg_")) SupabaseSync.pushUserMetadata();
    return !on;
  },
};

const ACCENT_COLORS = [
  { id: "5b99fc", label: "Default" },
  { id: "ffffff", label: "White" },
  { id: "7c5cff", label: "Violet" },
  { id: "3b82f6", label: "Blue" },
  { id: "ef4444", label: "Red" },
  { id: "22c55e", label: "Green" },
  { id: "f97316", label: "Orange" },
  { id: "ec4899", label: "Pink" },
  { id: "06b6d4", label: "Cyan" },
];

function getAccentHex() {
  let hex = SETTINGS.get(SETTINGS.accentKey, ACCENT) || ACCENT;
  hex = String(hex).replace("#", "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex : ACCENT;
}

function injectMetaTags() {
  if (!document.querySelector('meta[name="referrer"]')) {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "strict-origin-when-cross-origin";
    document.head.appendChild(meta);
  }
  safeSetItem("orc_version", "2.5.0");
}
function logDiagnostics() {
  console.log("%c OsirisWatch Engine v2.5.0 %c DPR: " + window.devicePixelRatio + " | iOS: " + (/iPhone|iPad|iPod/.test(navigator.userAgent)), "background:#14b8a6; color:#fff; font-weight:bold;", "background:#222; color:#fff;");
}
function checkStorageQuota() {
  logDiagnostics();
  injectMetaTags();
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(est => {
      if (est.quota && est.usage && (est.usage / est.quota > 0.85)) {
        console.warn("Storage usage high. Purging cached items.");
        try { localStorage.removeItem("orc_tmdb_cache"); } catch (e) {}
      }
    }).catch(() => {});
  }
}
function applyGlobalSettings() {
  checkStorageQuota();
  let hex = SETTINGS.get(SETTINGS.accentKey, ACCENT) || ACCENT;
  hex = String(hex).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) hex = ACCENT;
  const r = parseInt(hex.slice(0, 2), 16) || 59;
  const g = parseInt(hex.slice(2, 4), 16) || 130;
  const b = parseInt(hex.slice(4, 6), 16) || 246;
  document.documentElement.style.setProperty("--accent", `#${hex}`);
  document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
  document.documentElement.style.setProperty("--accent-dim", `color-mix(in srgb, #${hex} 78%, #000)`);
  document.documentElement.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);

  const themePref = SETTINGS.get(SETTINGS.themeKey, "dark") === "light" ? "light" : "dark";
  const rootEl = document.documentElement;
  rootEl.setAttribute("data-theme", themePref);
  rootEl.style.colorScheme = themePref;
  const themeColor = themePref === "light" ? "#f6f6f8" : "#0b0b0d";
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => {
    if (i === 0) { m.removeAttribute("media"); m.setAttribute("content", themeColor); } else { m.remove(); }
  });

  rootEl.classList.toggle("reduce-motion", SETTINGS.get(SETTINGS.reduceMotionKey) === "1");
  rootEl.classList.toggle("grid-backdrop-mode", SETTINGS.get(SETTINGS.layoutKey) === "1");
  syncPageBackdrop();
}

const BACKDROP_STYLES = [
  { id: "rings", label: "Rings" },
  { id: "aurora", label: "Aurora" },
  { id: "flow", label: "Flow" },
  { id: "mesh", label: "Mesh" },
  { id: "silk", label: "Silk" },
  { id: "waves", label: "Waves" },
  { id: "mist", label: "Mist" },
  { id: "prism", label: "Prism" },
  { id: "glow", label: "Glow" },
  { id: "swirl", label: "Swirl" },
  { id: "sky", label: "Sky" },
  { id: "bars", label: "Bars" },
  { id: "stripes", label: "Stripes" },
  { id: "forms", label: "Forms" },
  { id: "watercolor", label: "Watercolor" },
  { id: "none", label: "Off" },
];

function mixHex(hexA, hexB, weightB) {
  const parse = h => {
    const clean = String(h).replace("#", "").padEnd(6, "0");
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };
  const a = parse(hexA);
  const b = parse(hexB);
  const w = Math.max(0, Math.min(1, weightB));
  const ch = i => Math.round(a[i] * (1 - w) + b[i] * w).toString(16).padStart(2, "0");
  return "#" + ch(0) + ch(1) + ch(2);
}

function getBackdropBaseHex() {
  const syncAccent = SETTINGS.get(SETTINGS.bgSyncAccentKey, "1") !== "0";
  if (syncAccent) return getAccentHex();
  const custom = String(SETTINGS.get(SETTINGS.bgColorKey, "") || "").replace("#", "");
  return /^[0-9a-fA-F]{6}$/.test(custom) ? custom : getAccentHex();
}

function buildBackdropPalette(style, baseHex, isLight) {
  const accent = "#" + String(baseHex || getAccentHex()).replace("#", "");
  if (isLight) {
    const paper = "#f8fafc";
    const soft = mixHex(paper, accent, 0.18);
    const mid = mixHex(paper, accent, 0.42);
    const rich = mixHex("#0f172a", accent, 0.72);
    const deep = mixHex("#0f172a", accent, 0.38);
    if (style === "silk" || style === "prism" || style === "rings" || style === "glow" || style === "bars" || style === "forms") {
      return [paper, soft, mid, rich, accent];
    }
    return [paper, soft, mid, accent, deep];
  }
  const night = "#090a0f";
  const abyss = mixHex(night, accent, 0.16);
  const deep = mixHex(night, accent, 0.36);
  const mid = mixHex(night, accent, 0.66);
  const bright = mixHex(accent, "#ffffff", 0.28);
  // Respect per-style colour order from GradientBackdrop
  switch (style) {
    case "aurora":
    case "sky":
    case "waves":
    case "mist":
    case "stripes":
    case "swirl":
      // highlight/top -> dark night background
      return [bright, accent, mid, deep, night];
    case "silk":
    case "prism":
    case "rings":
    case "glow":
    case "bars":
    case "forms":
    case "watercolor":
      // dark background first -> lit highlight last
      return [night, abyss, deep, mid, accent, bright];
    case "mesh":
    case "flow":
    default:
      return [night, deep, accent, mid, abyss];
  }
}

function getBackdropConfig() {
  const rawStyle = SETTINGS.get(SETTINGS.bgStyleKey, "rings") || "rings";
  const validStyle = BACKDROP_STYLES.some(s => s.id === rawStyle) ? rawStyle : "rings";
  const isLight = SETTINGS.get(SETTINGS.themeKey, "dark") === "light";
  const baseHex = getBackdropBaseHex();
  const rawSpeed = parseFloat(SETTINGS.get(SETTINGS.bgSpeedKey, "0.6"));
  const speed = Number.isFinite(rawSpeed) ? Math.max(0, Math.min(2, rawSpeed)) : 0.6;
  const rawGrain = parseFloat(SETTINGS.get(SETTINGS.bgGrainKey, "0"));
  const grain = Number.isFinite(rawGrain) ? Math.max(0, Math.min(0.4, rawGrain)) : 0;
  const reduceMotion = SETTINGS.get(SETTINGS.reduceMotionKey) === "1";
  const colors = buildBackdropPalette(validStyle === "none" ? "rings" : validStyle, baseHex, isLight);
  return {
    style: validStyle,
    colors,
    speed: reduceMotion ? 0 : speed,
    grain,
    animate: !reduceMotion && speed > 0,
  };
}

let pageBackdropInstance = null;
let settingsPreviewBackdropInstance = null;

function syncPageBackdrop() {
  if (typeof document === "undefined" || !document.body) return;
  const cfg = getBackdropConfig();
  let container = document.getElementById("orc-page-backdrop");
  if (cfg.style === "none" || typeof window.GradientBackdrop === "undefined") {
    if (pageBackdropInstance) {
      try { pageBackdropInstance.destroy(); } catch (e) {}
      pageBackdropInstance = null;
    }
    if (container) container.remove();
  } else {
    if (!container) {
      container = document.createElement("div");
      container.id = "orc-page-backdrop";
      container.className = "orc-page-backdrop";
      container.setAttribute("aria-hidden", "true");
      document.body.prepend(container);
    }
    const opts = {
      style: cfg.style,
      colors: cfg.colors,
      speed: cfg.speed,
      grain: cfg.grain,
      animate: cfg.animate,
      respectReducedMotion: true,
    };
    if (!pageBackdropInstance || pageBackdropInstance.el !== container) {
      try {
        pageBackdropInstance = window.GradientBackdrop.createBackdrop(container, opts);
      } catch (e) {}
    } else {
      pageBackdropInstance.set(opts);
    }
  }

  const previewEl = document.getElementById("settings-backdrop-preview");
  if (previewEl && typeof window.GradientBackdrop !== "undefined") {
    const previewStyle = cfg.style === "none" ? "rings" : cfg.style;
    const previewOpts = {
      style: previewStyle,
      colors: cfg.colors,
      speed: cfg.speed,
      grain: cfg.grain,
      animate: cfg.animate,
      respectReducedMotion: true,
    };
    previewEl.style.opacity = cfg.style === "none" ? "0.25" : "1";
    if (!settingsPreviewBackdropInstance || settingsPreviewBackdropInstance.el !== previewEl) {
      try {
        settingsPreviewBackdropInstance = window.GradientBackdrop.createBackdrop(previewEl, previewOpts);
      } catch (e) {}
    } else {
      settingsPreviewBackdropInstance.set(previewOpts);
    }
  }
}

function skeletons(count = 12) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "media-card skeleton-card";
    el.innerHTML = `
      <div class="card-poster-wrap skeleton"></div>
      <div class="skeleton-line skeleton-title skeleton"></div>
      <div class="skeleton-line skeleton-sub skeleton"></div>
    `;
    arr.push(el);
  }
  return arr;
}
function providerUrl(type, id, s, e) {
  const p = PROVIDERS.find(x => x.id === getProvider()) || PROVIDERS[0];
  let url = type === "tv" ? p.tv(id, s, e) : p.movie(id);
  if (p.id === "vidking") url = url.replace(/color=[0-9a-fA-F]+/i, `color=${getAccentHex()}`);
  if (p.id === "cinesrc") url = url.replace(/color=%23[0-9a-fA-F]{6}/i, `color=%23${getAccentHex()}`);
  return url;
}

function isAllowedPlayerUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLAYER_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function createPlayerIframe(src) {
  if (!isAllowedPlayerUrl(src)) return null;
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.title = "Video player";
  iframe.allowFullscreen = true;
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute("webkitallowfullscreen", "true");
  iframe.setAttribute("mozallowfullscreen", "true");
  iframe.setAttribute("allow", "autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; accelerometer *; gyroscope *; display-capture *");
  return iframe;
}

function isPlayerFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function togglePlayerFullscreen() {
  const frame = $("#player-frame");
  const iframe = frame?.querySelector("iframe");
  const target = iframe || frame;
  if (!target) return;

  if (isPlayerFullscreen()) {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } else {
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => {
        if (frame && frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
      });
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    } else if (target.mozRequestFullScreen) {
      target.mozRequestFullScreen();
    } else if (target.msRequestFullscreen) {
      target.msRequestFullscreen();
    } else if (frame && frame.requestFullscreen) {
      frame.requestFullscreen();
    } else if (frame && frame.webkitRequestFullscreen) {
      frame.webkitRequestFullscreen();
    }
  }
}

function loadPlayerFrame(frameEl, url) {
  if (!frameEl) return;
  frameEl.innerHTML = `<div class="spinner player-loading" style="position:absolute;top:50%;left:50%;margin:-18px 0 0 -18px" aria-hidden="true"></div>`;
  const iframe = createPlayerIframe(url);
  if (!iframe) {
    frameEl.innerHTML = `<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.85rem;padding:20px;text-align:center">Could not load this stream source.</p>`;
    return;
  }
  const clearLoading = () => frameEl.querySelector(".player-loading")?.remove();
  const failTimer = setTimeout(() => {
    clearLoading();
    if (!frameEl.querySelector(".player-fallback-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "player-fallback-overlay";
      overlay.innerHTML = `
        <p>Stream source taking too long or blocked by provider?</p>
        <button type="button" class="player-fallback-btn" id="fallback-switch-btn">Switch Stream Provider</button>
      `;
      overlay.querySelector("#fallback-switch-btn")?.addEventListener("click", () => {
        overlay.remove();
        const cur = getProvider();
        const idx = PROVIDERS.findIndex(p => p.id === cur);
        const next = PROVIDERS[(idx + 1) % PROVIDERS.length];
        setProvider(next.id);
        $$(".provider-tab").forEach(b => b.classList.remove("active"));
        toast(`Switched to ${next.name}`);
        const type = $("#ep-block") ? "tv" : "movie";
        const id = new URLSearchParams(location.search).get("id");
        if (type === "tv") {
          const s = $("#season-select")?.value || 1;
          const epOn = $(".ep-row.on")?.dataset.ep || 1;
          loadPlayerFrame(frameEl, providerUrl("tv", id, s, epOn));
        } else {
          loadPlayerFrame(frameEl, providerUrl("movie", id));
        }
      });
      frameEl.appendChild(overlay);
    }
  }, 10000);

  iframe.addEventListener("load", () => { clearTimeout(failTimer); clearLoading(); });
  frameEl.appendChild(iframe);
}

let playerGuardReady = false;

function initPlayerGuard() {
  if (playerGuardReady) return;
  playerGuardReady = true;

  document.addEventListener("auxclick", e => {
    if (PAGE !== "movie" && PAGE !== "tv") return;
    if (e.button === 1 && $("#player-frame iframe")) e.preventDefault();
  }, true);

  const lockUrl = location.href;
  window.addEventListener("blur", () => {
    if (isPlayerFullscreen() || !$("#player-frame iframe")) return;
    window.__orcBlurAt = Date.now();
  });
  window.addEventListener("focus", () => {
    if (!window.__orcBlurAt || isPlayerFullscreen()) return;
    if (Date.now() - window.__orcBlurAt < 800 && location.href !== lockUrl) {
      history.replaceState(null, "", lockUrl);
    }
    window.__orcBlurAt = 0;
  });
}

const AVATAR_PRESETS = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2314b8a6'/><stop offset='100%' stop-color='%230f766e'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g1)'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='14' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='%236d28d9'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g2)'/><polygon points='50,18 82,78 18,78' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='55' r='10' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g3' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ec4899'/><stop offset='100%' stop-color='%23be185d'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g3)'/><rect x='25' y='25' width='50' height='50' rx='12' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='12' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g4' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f59e0b'/><stop offset='100%' stop-color='%23b45309'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g4)'/><path d='M50 20 L80 50 L50 80 L20 50 Z' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='10' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g5' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%233b82f6'/><stop offset='100%' stop-color='%231d4ed8'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g5)'/><circle cx='50' cy='50' r='32' fill='none' stroke='%23ffffff' stroke-width='4' stroke-dasharray='10 6'/><circle cx='50' cy='50' r='14' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g6' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2310b981'/><stop offset='100%' stop-color='%23047857'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g6)'/><path d='M25,50 Q50,20 75,50 T25,50' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='10' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g7' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ef4444'/><stop offset='100%' stop-color='%23b91c1c'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g7)'/><circle cx='50' cy='50' r='28' fill='none' stroke='%23ffffff' stroke-width='6'/><polygon points='44,36 66,50 44,64' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g8' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='100%' stop-color='%234338ca'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g8)'/><path d='M30 30 h40 v40 h-40 z' fill='none' stroke='%23ffffff' stroke-width='6'/><path d='M20 20 h60 v60 h-60 z' fill='none' stroke='%23ffffff' stroke-width='3' opacity='0.6'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g9' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2306b6d4'/><stop offset='100%' stop-color='%230e7490'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g9)'/><circle cx='50' cy='50' r='34' fill='none' stroke='%23ffffff' stroke-width='4'/><path d='M30 50 L70 50' stroke='%23ffffff' stroke-width='6'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g10' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2384cc16'/><stop offset='100%' stop-color='%234d7c0f'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g10)'/><polygon points='50,20 62,40 85,42 67,58 72,80 50,68 28,80 33,58 15,42 38,40' fill='none' stroke='%23ffffff' stroke-width='5'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g11' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f97316'/><stop offset='100%' stop-color='%23c2410c'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g11)'/><circle cx='50' cy='50' r='26' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='50' r='6' fill='%23ffffff'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g12' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23a855f7'/><stop offset='100%' stop-color='%237e22ce'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g12)'/><path d='M30 70 L50 30 L70 70 Z' fill='none' stroke='%23ffffff' stroke-width='6'/><circle cx='50' cy='55' r='8' fill='%23ffffff'/></svg>"
];

const SupabaseSync = {
  initializedListener: false,

  init() {
    if (this.initializedListener) return;
    this.initializedListener = true;
    
    window.addEventListener("online", () => this.processOfflineQueue());
    setInterval(() => this.processOfflineQueue(), 60000);

    const client = getSupabaseClient();
    if (client && client.auth) {
      try {
        client.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            if (session?.user?.user_metadata) {
              safeSetItem("orc_local_meta", JSON.stringify(session.user.user_metadata));
            }
            this.pullFromCloud().then(() => {
              initAuthUI();
              this.initRealtimeSubscription();
              if (pagePathMatches(location.pathname, "settings")) {
                renderAccountSettingsSection();
              }
            });
          } else if (event === "SIGNED_OUT") {
            safeRemoveItem("orc_local_meta");
            initAuthUI();
            if (pagePathMatches(location.pathname, "settings")) {
              renderAccountSettingsSection();
            }
          }
        });
      } catch (err) { console.warn('Caught error:', err); }
    }
  },

  initRealtimeSubscription() {
    const client = getSupabaseClient();
    if (!client || !client.channel) return;
    try {
      this.getUser().then(user => {
        if (!user) return;
        client
          .channel(`user-sync-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'progress', filter: `user_id=eq.${user.id}` }, () => {
            this.pullFromCloud();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlists', filter: `user_id=eq.${user.id}` }, () => {
            this.pullFromCloud();
          })
          .subscribe();
      });
    } catch (err) { console.warn('Caught error:', err); }
  },

  // Offline Sync Queue System
  offlineQueueKey: "orc_offline_sync_queue",

  enqueueOfflineMutation(action, payload) {
    try {
      const q = JSON.parse(safeGetItem(this.offlineQueueKey, "[]"));
      q.push({ action, payload, timestamp: Date.now() });
      safeSetItem(this.offlineQueueKey, JSON.stringify(q));
    } catch (err) { console.warn('Caught error:', err); }
  },

  async processOfflineQueue() {
    if (!navigator.onLine) return;
    try {
      const raw = safeGetItem(this.offlineQueueKey, "[]");
      const q = JSON.parse(raw);
      if (!q.length) return;
      safeSetItem(this.offlineQueueKey, "[]");
      for (const item of q) {
        if (item.action === "pushWatchlist") {
          await this.pushWatchlistItem(item.payload.item, item.payload.isAdd);
        } else if (item.action === "pushProgress") {
          await this.pushProgressItem(item.payload);
        } else if (item.action === "pushMetadata") {
          await this.pushUserMetadata();
        }
      }
    } catch (err) { console.warn('Caught error:', err); }
  },

  // Password Strength Entropy Calculator
  checkPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: "Empty", color: "#6b7280" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score <= 3) return { score: 2, label: "Medium", color: "#f59e0b" };
    if (score === 4) return { score: 3, label: "Strong", color: "#10b981" };
    return { score: 4, label: "Bulletproof", color: "#0d9488" };
  },

  // CSV Export for Watch History
  exportHistoryCSV() {
    const list = MyList.get();
    const prog = Progress.get();
    const rows = [["Title", "Type", "Season", "Episode", "Progress %", "Saved At"]];

    Object.values(prog || {}).forEach(p => {
      rows.push([
        `"${(p.title || p.id || 'Untitled').replace(/"/g, '""')}"`,
        p.mediaType || "movie",
        p.season || 1,
        p.episode || 1,
        `${Math.round(p.progress || 0)}%`,
        new Date(p.savedAt || Date.now()).toISOString()
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OsirisWatch_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async deleteAccount() {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const user = await this.getUser();
    if (!user) throw new Error("User is not signed in.");

    try {
      await client.rpc("delete_user_account");
    } catch (err) { console.warn('Caught error:', err); }

    await this.signOut();
  },

  async getUser() {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data: { session } } = await client.auth.getSession();
      return session?.user || null;
    } catch (err) { console.warn('Caught error:', err); return null; }
  },

  async signUp(email, password, username) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const uname = (username || email.split("@")[0]).trim();
    const joinedAt = new Date().toISOString();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectUrl(),
        data: { username: uname, joined_at: joinedAt, bio: "" }
      }
    });
    if (error) throw error;
    if (data?.user?.user_metadata) {
      safeSetItem("orc_local_meta", JSON.stringify(data.user.user_metadata));
    }
    await this.pullFromCloud();
    return data;
  },

  async signIn(email, password) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user?.user_metadata) {
      safeSetItem("orc_local_meta", JSON.stringify(data.user.user_metadata));
    }
    await this.pullFromCloud();
    return data;
  },

  async signOut() {
    const client = getSupabaseClient();
    if (!client) return;
    try { await client.auth.signOut(); } catch (err) { console.warn('Caught error:', err); }
    safeRemoveItem("orc_local_meta");
    safeRemoveItem(MyList.key);
    safeRemoveItem(Progress.key);
    safeRemoveItem(RecentSearches.key);
    idbSet(MyList.key, []);
  },

  async pullFromCloud() {
    if (sessionStorage.getItem('orc_sync_lock')) return;
    sessionStorage.setItem('orc_sync_lock', '1');
    try {
    const user = await this.getUser();
    if (!user) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data: listData } = await client
        .from("watchlists")
        .select("*")
        .eq("user_id", user.id);
      if (listData && listData.length) {
        const localList = MyList.get();
        const mergedMap = new Map();
        localList.forEach(item => mergedMap.set(`${item.type}_${item.id}`, item));
        listData.forEach(item => {
          mergedMap.set(`${item.media_type}_${item.media_id}`, {
            id: item.media_id,
            type: item.media_type,
            title: item.title,
            poster: item.poster_path
          });
        });
        MyList.save(Array.from(mergedMap.values()));
      }
    } catch (err) { console.warn('Caught error:', err); }

    try {
      const { data: progData } = await client
        .from("progress")
        .select("*")
        .eq("user_id", user.id);
      if (progData && progData.length) {
        const localProg = Progress.get();
        progData.forEach(p => {
          localProg[`${p.media_type}_${p.media_id}`] = {
            id: p.media_id,
            mediaType: p.media_type,
            season: p.season,
            episode: p.episode,
            currentTime: p.current_time,
            duration: p.duration,
            progress: p.progress_pct,
            savedAt: p.updated_at ? new Date(p.updated_at).getTime() : Date.now()
          };
        });
        Progress.saveAll(localProg);
      }
    } catch (err) { console.warn('Caught error:', err); }

    try {
      const metaStr = safeGetItem("orc_local_meta");
      if (metaStr) {
        const meta = JSON.parse(metaStr);
        if (meta.orc_settings) {
          Object.entries(meta.orc_settings).forEach(([k, v]) => safeSetItem(k, v));
          applyGlobalSettings();
        }
        if (meta.orc_recent) safeSetItem(RecentSearches.key, JSON.stringify(meta.orc_recent));
        if (meta.orc_folders) safeSetItem(Folders.key, JSON.stringify(meta.orc_folders));
      }
    } catch (err) { console.warn('Caught error:', err); }
    } finally { sessionStorage.removeItem('orc_sync_lock'); }
  },

  async pushUserMetadata() {
    const user = await this.getUser();
    if (!user) {
       this.enqueueOfflineMutation("pushMetadata", {});
       return;
    }
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const currentMeta = user.user_metadata || {};
      const updates = {
        orc_settings: {
          orc_accent: safeGetItem("orc_accent"),
          orc_theme: safeGetItem("orc_theme"),
          orc_grid_layout: safeGetItem("orc_grid_layout"),
          orc_bg_style: safeGetItem("orc_bg_style"),
          orc_bg_sync_accent: safeGetItem("orc_bg_sync_accent"),
          orc_bg_color: safeGetItem("orc_bg_color"),
          orc_bg_speed: safeGetItem("orc_bg_speed"),
          orc_bg_grain: safeGetItem("orc_bg_grain"),
        },
        orc_recent: RecentSearches.get(),
        orc_folders: Folders.get()
      };
      const newMeta = { ...currentMeta, ...updates };
      await client.auth.updateUser({ data: newMeta });
      safeSetItem("orc_local_meta", JSON.stringify(newMeta));
    } catch (err) { console.warn('Caught error:', err); }
  },

  async pushWatchlistItem(item, isAdd) {
    const user = await this.getUser();
    if (!user) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      if (isAdd) {
        await client.from("watchlists").upsert({
          user_id: user.id,
          media_id: String(item.id),
          media_type: item.type,
          title: item.title,
          poster_path: item.poster
        }, { onConflict: "user_id,media_id,media_type" });
      } else {
        await client.from("watchlists").delete().match({
          user_id: user.id,
          media_id: String(item.id),
          media_type: item.type
        });
      }
    } catch (err) { console.warn('Caught error:', err); }
  },

  async pushProgressItem(p) {
    const user = await this.getUser();
    if (!user) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.from("progress").upsert({
        user_id: user.id,
        media_id: String(p.id),
        media_type: p.mediaType,
        season: p.season || 1,
        episode: p.episode || 1,
        current_time: p.currentTime || 0,
        duration: p.duration || 0,
        progress_pct: p.progress || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,media_id,media_type" });
    } catch (err) { console.warn('Caught error:', err); }
  },

  async resetPassword(email) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl()
    });
    if (error) throw error;
    return data;
  },

  async changePassword(newPassword) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const { data, error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client is not initialized.");
    const user = await this.getUser();
    if (!user) throw new Error("User is not signed in.");

    const currentMeta = user.user_metadata || {};
    const newMeta = { ...currentMeta, ...updates };

    const { data, error } = await client.auth.updateUser({
      data: newMeta
    });
    if (error) throw error;
    safeSetItem("orc_local_meta", JSON.stringify(newMeta));

    try {
      await client.from("profiles").upsert({
        user_id: user.id,
        username: newMeta.username || user.email.split("@")[0],
        avatar_url: newMeta.avatar_url || null,
        bio: newMeta.bio || "",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } catch (err) { console.warn('Caught error:', err); }

    return data;
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const client = getSupabaseClient();

    let dbProfile = null;
    if (client) {
      try {
        const { data } = await client.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (data) dbProfile = data;
      } catch (err) { console.warn('Caught error:', err); }
    }

    const local = safeGetItem("orc_local_meta", null);
    let meta = user.user_metadata || {};
    if (local) {
      try { meta = { ...meta, ...JSON.parse(local) }; } catch (err) { console.warn('Caught error:', err); }
    }

    return {
      email: user.email,
      username: dbProfile?.username || meta.username || user.email.split("@")[0],
      avatar_url: dbProfile?.avatar_url || meta.avatar_url || null,
      bio: dbProfile?.bio || meta.bio || "",
      joined_at: meta.joined_at || user.created_at || new Date().toISOString()
    };
  },

  getStats() {
    const list = MyList.get();
    const prog = Progress.get();
    const progEntries = Object.values(prog || {});

    let totalSecs = 0;
    let moviesCount = 0;
    let seriesCount = 0;

    progEntries.forEach(entry => {
      if (entry.currentTime) totalSecs += entry.currentTime;
      if (entry.mediaType === "movie" && (entry.progress || 0) >= 85) moviesCount++;
      if (entry.mediaType === "tv") seriesCount++;
    });

    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);

    const badges = [];
    if (hours >= 1) badges.push({ icon: "🎬", name: "Cinephile", desc: "Watched over 1 hour of content" });
    if (moviesCount >= 5) badges.push({ icon: "🍿", name: "Movie Buff", desc: "Completed 5+ movies" });
    if (seriesCount >= 10) badges.push({ icon: "📺", name: "Binge Master", desc: "Watched 10+ TV episodes" });
    if (list.length >= 10) badges.push({ icon: "⭐", name: "Tastemaker", desc: "Saved 10+ titles to My List" });
    if (badges.length === 0) badges.push({ icon: "🚀", name: "Pioneer", desc: "New OsirisWatch Explorer" });

    return {
      totalTimeFormatted: `${hours}h ${mins}m`,
      savedCount: list.length,
      moviesCount,
      seriesCount,
      badges
    };
  },

  exportBackup() {
    const data = {
      version: "2.7",
      timestamp: new Date().toISOString(),
      watchlist: MyList.get(),
      progress: Progress.get(),
      settings: {
        accent: SETTINGS.get(SETTINGS.accentKey),
        reduceMotion: SETTINGS.get(SETTINGS.reduceMotionKey),
        hideWatched: SETTINGS.get(SETTINGS.hideWatchedKey),
        provider: getProvider()
      }
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OsirisWatch_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed.watchlist && Array.isArray(parsed.watchlist)) {
            MyList.save(parsed.watchlist);
          }
          if (parsed.progress && typeof parsed.progress === "object") {
            Progress.saveAll(parsed.progress);
          }
          if (parsed.settings) {
            if (parsed.settings.accent) SETTINGS.set(SETTINGS.accentKey, parsed.settings.accent);
            if (parsed.settings.provider) setProvider(parsed.settings.provider);
          }
          this.pullFromCloud();
          resolve(true);
        } catch (err) {
          reject(new Error("Invalid backup JSON format"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
};

const ACCOUNTS_UI_ENABLED = false;
if (ACCOUNTS_UI_ENABLED) SupabaseSync.init();

async function initAuthUI() {
  const btn = $("#topnav-account-btn");
  if (!btn) return;
  if (!ACCOUNTS_UI_ENABLED) {
    btn.hidden = true;
    btn.style.display = "none";
    return;
  }

  const profile = await SupabaseSync.getProfile();
  if (profile && profile.email) {
    if (profile.avatar_url) {
      btn.innerHTML = `<img src="${esc(profile.avatar_url)}" class="account-avatar-badge-img" alt="PFP" />`;
    } else {
      const initial = (profile.username || profile.email).charAt(0).toUpperCase();
      btn.innerHTML = `<span class="account-avatar-badge">${initial}</span>`;
    }
    btn.title = `Account (${profile.username || profile.email})`;
    btn.onclick = () => {
      if (pagePathMatches(location.pathname, "settings")) {
        $("#settings-account-section")?.scrollIntoView({ behavior: "smooth" });
      } else {
        location.href = `${routeUrl("settings")}#settings-account-section`;
      }
    };
  } else {
    btn.innerHTML = ICONS.user;
    btn.title = "Sign In / Create Account";
    btn.onclick = () => openAuthModal();
  }
}

function openAuthModal() {
  let modal = $("#auth-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.className = "modal-overlay auth-modal";
    modal.innerHTML = `
      <div class="auth-drawer modal-box">
        <button type="button" class="modal-close" id="auth-modal-close" aria-label="Close">✕</button>
        <div class="auth-content-wrap">
          
          <div id="auth-main-view" style="width:100%;display:flex;flex-direction:column;align-items:center">
            <div class="auth-tabs">
              <button type="button" class="auth-tab active" data-tab="signin">Sign In</button>
              <button type="button" class="auth-tab" data-tab="signup">Create Account</button>
            </div>
            <form id="auth-form" class="auth-form">
              <div class="auth-field" id="auth-username-field" style="display:none">
                <label for="auth-username">Username</label>
                <input type="text" id="auth-username" placeholder="Choose a username" class="ep-search-input" />
              </div>
              <div class="auth-field">
                <label for="auth-email">Email Address</label>
                <input type="email" id="auth-email" required placeholder="Enter your email" class="ep-search-input" />
              </div>
              <div class="auth-field">
                <label for="auth-password">Password</label>
                <div class="input-with-eye">
                  <input type="password" id="auth-password" required placeholder="Enter your password" class="ep-search-input" minlength="6" />
                  <button type="button" class="eye-btn" id="auth-toggle-pwd" aria-label="Toggle password visibility">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div id="auth-status" class="auth-status"></div>
              <button type="submit" class="auth-submit-btn" id="auth-submit-btn">Sign In</button>
            </form>
            <button type="button" class="auth-forgot-btn" id="auth-forgot-btn">Forgot password?</button>
          </div>

          <div id="auth-reset-view" style="width:100%;display:none;flex-direction:column;align-items:flex-start">
            <div class="auth-reset-header">
              <button type="button" class="auth-back-btn" id="auth-back-btn" aria-label="Back">‹</button>
              <h2 class="auth-reset-title">Reset Password</h2>
            </div>
            <p class="auth-reset-sub">Enter your email address to receive a password reset link.</p>
            <form id="auth-reset-form" class="auth-form">
              <div class="auth-field">
                <label for="reset-email">Email Address</label>
                <input type="email" id="reset-email" required placeholder="Enter your email" class="ep-search-input" />
              </div>
              <div id="reset-status" class="auth-status"></div>
              <button type="submit" class="auth-submit-btn" id="reset-submit-btn">Send Reset Link</button>
            </form>
          </div>

        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector("#auth-modal-close")?.addEventListener("click", () => closeModal("#auth-modal"));

    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal("#auth-modal");
    });

    const mainView = modal.querySelector("#auth-main-view");
    const resetView = modal.querySelector("#auth-reset-view");
    const forgotBtn = modal.querySelector("#auth-forgot-btn");
    const backBtn = modal.querySelector("#auth-back-btn");

    forgotBtn?.addEventListener("click", () => {
      mainView.style.display = "none";
      resetView.style.display = "flex";
    });

    backBtn?.addEventListener("click", () => {
      resetView.style.display = "none";
      mainView.style.display = "flex";
    });

    const pwdInput = modal.querySelector("#auth-password");
    const eyeBtn = modal.querySelector("#auth-toggle-pwd");
    eyeBtn?.addEventListener("click", () => {
      const type = pwdInput.type === "password" ? "text" : "password";
      pwdInput.type = type;
      eyeBtn.style.color = type === "text" ? "var(--text)" : "var(--text-2)";
    });

    let currentTab = "signin";
    const tabs = modal.querySelectorAll(".auth-tab");
    const submitBtn = modal.querySelector("#auth-submit-btn");
    const status = modal.querySelector("#auth-status");
    const unameField = modal.querySelector("#auth-username-field");

    tabs.forEach(t => {
      t.addEventListener("click", () => {
        tabs.forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        currentTab = t.dataset.tab;
        submitBtn.textContent = currentTab === "signin" ? "Sign In" : "Create Account";
        unameField.style.display = currentTab === "signup" ? "flex" : "none";
        status.textContent = "";
      });
    });

    const form = modal.querySelector("#auth-form");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#auth-email").value.trim();
      const password = pwdInput.value;
      const username = $("#auth-username")?.value.trim() || email.split("@")[0];
      status.className = "auth-status";
      status.textContent = "Processing...";
      submitBtn.disabled = true;

      try {
        if (currentTab === "signin") {
          await SupabaseSync.signIn(email, password);
          toast(`Signed in as ${email}`);
        } else {
          await SupabaseSync.signUp(email, password, username);
          toast(`Account created for ${username}!`);
        }
        closeModal("#auth-modal");
        initAuthUI();
      } catch (err) {
        status.textContent = err.message || "Authentication failed.";
      } finally {
        submitBtn.disabled = false;
      }
    });

    const resetForm = modal.querySelector("#auth-reset-form");
    const resetStatus = modal.querySelector("#reset-status");
    const resetBtn = modal.querySelector("#reset-submit-btn");

    resetForm?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#reset-email").value.trim();
      resetStatus.className = "auth-status";
      resetStatus.textContent = "Sending link...";
      resetBtn.disabled = true;

      try {
        await SupabaseSync.resetPassword(email);
        resetStatus.className = "auth-status success";
        resetStatus.textContent = "Password reset link sent to your email!";
        toast("Password reset link sent!");
      } catch (err) {
        resetStatus.textContent = err.message || "Failed to send reset link.";
      } finally {
        resetBtn.disabled = false;
      }
    });
  }

  modal.querySelector("#auth-main-view").style.display = "flex";
  modal.querySelector("#auth-reset-view").style.display = "none";
  modal.classList.add("open");
  trapModalFocus(modal, "Save to Folder");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add("open");
      trapModalFocus(modal, "Authentication");
      setTimeout(() => modal.querySelector("#auth-email")?.focus(), 120);
    });
  });
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
  let label = "Dialog";
  if (modal.id === "shortcuts-modal") label = "Keyboard Shortcuts";
  else if (modal.id === "party-modal") label = "Watch Party";
  else if (modal.id === "surprise-modal") label = "Surprise Me";
  else if (modal.id === "save-modal") label = "Save to Folder";
  else if (modal.id === "folder-modal") label = "Create New Folder";
  trapModalFocus(modal, label);
}

let surpriseSpinInterval = null;

function closeModal(target = ".modal-overlay") {
  let list = [];
  if (!target) {
    list = $(".modal-overlay");
  } else if (typeof target === "string") {
    list = $(target);
  } else if (target instanceof Element) {
    list = [target];
  } else if (Array.isArray(target) || target instanceof NodeList) {
    list = [...target];
  }
  list.forEach(m => {
    if (!m || !m.classList) return;
    if (m.id === "surprise-modal" && surpriseSpinInterval) {
      clearInterval(surpriseSpinInterval);
      surpriseSpinInterval = null;
    }
    m.classList.remove("open");
    setTimeout(() => {
      if (!m.classList.contains("open")) {
        m.style.display = "";
      }
    }, 320);
  });
  releaseModalFocus();
}

const MyList = {
  key: "orc_mylist",
  get() { try { return JSON.parse(safeGetItem(this.key) || "[]"); } catch { return []; } },
  has(id, t) { return this.get().some(i => i.id === id && i.type === t); },
  save(list) { safeSetItem(this.key, JSON.stringify(list)); idbSet(this.key, list); },
  toggle(item) {
    const list = this.get();
    const i = list.findIndex(x => x.id === item.id && x.type === item.type);
    let added = false;
    if (i >= 0) {
      list.splice(i, 1);
      added = false;
    } else {
      list.unshift(item);
      added = true;
    }
    this.save(list);
    SupabaseSync.pushWatchlistItem(item, added).catch(() => {});
    return added;
  },
};

const RecentSearches = {
  key: "orc_recent",
  max: 5,
  get() { try { return JSON.parse(safeGetItem(this.key) || "[]"); } catch { return []; } },
  add(q) {
    q = (q || "").trim();
    if (q.length < 2) return;
    const next = [q, ...this.get().filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, this.max);
    safeSetItem(this.key, JSON.stringify(next));
    SupabaseSync.pushUserMetadata();
  },
};

const Folders = {
  key: "orc_folders",
  get() { try { return JSON.parse(safeGetItem(this.key) || "[]"); } catch { return []; } },
  save(list) { safeSetItem(this.key, JSON.stringify(list)); SupabaseSync.pushUserMetadata(); },
  addFolder(name) {
    const list = this.get();
    list.push({ id: "f_" + Date.now(), name, items: [] });
    this.save(list);
  },
  removeFolder(id) {
    this.save(this.get().filter(f => f.id !== id));
  },
  toggleItem(folderId, item) {
    const list = this.get();
    const folder = list.find(f => f.id === folderId);
    if (!folder) return;
    const i = folder.items.findIndex(x => x.id === item.id && x.type === item.type);
    if (i >= 0) folder.items.splice(i, 1);
    else folder.items.unshift(item);
    this.save(list);
  },
  hasItem(folderId, id, type) {
    const folder = this.get().find(f => f.id === folderId);
    if (!folder) return false;
    return folder.items.some(x => x.id === id && x.type === type);
  }
};

const Progress = {
  key: "orc_progress",
  get() { try { return JSON.parse(safeGetItem(this.key) || "{}"); } catch { return {}; } },
  getAll() {
    return Object.values(this.get()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  },
  getItem(id, type) { return this.get()[`${type}_${id}`]; },
  saveAll(allObj) { safeSetItem(this.key, JSON.stringify(allObj)); idbSet(this.key, allObj); },
  save(id, type, data) {
    const all = this.get();
    const item = { ...data, id, mediaType: type, savedAt: Date.now() };
    all[`${type}_${id}`] = item;
    this.saveAll(all);
    SupabaseSync.pushProgressItem(item).catch(() => {});
  },
};

window.addEventListener("message", e => {
  try {
    let originHost = "";
    try { originHost = new URL(e.origin).hostname.toLowerCase(); } catch { return; }
    if (!PLAYER_HOSTS.some(h => originHost === h || originHost.endsWith(`.${h}`))) return;
    if (typeof e.data !== "string") return;
    const msg = JSON.parse(e.data);
    if (msg.type !== "PLAYER_EVENT" || !msg.data?.id) return;
    const d = msg.data;
    const dur = d.duration || 0;
    const watched = d.currentTime ?? (dur * (d.progress / 100));
    if (dur > 0 && watched >= 10 && d.progress > 1 && d.progress < 98) {
      Progress.save(d.id, d.mediaType || "movie", d);
      if (d.mediaType === "tv" && d.season && d.episode && d.progress >= 90) WatchedEpisodes.save(d.id, d.season, d.episode);
    }
  } catch (err) { console.warn('Caught error:', err); }
});

let PAGE = "home";

function detectPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if ($("#player-frame") && id) return $("#ep-block") ? "tv" : "movie";
  if ($("#list-grid") || document.body.classList.contains("list-page")) return "list";
  if ($("#main-search-input") || document.body.classList.contains("search-page")) return "search";
  if ($(".settings-body") || document.body.classList.contains("settings-page")) return "settings";
  if ($(".legal-body") || document.body.classList.contains("legal-page")) return "dmca";
  if ($("#categories") || $("#hero-title") || $("#splash-screen")) return "home";

  const seg = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "").toLowerCase();
  const bySeg = { movie: "movie", tv: "tv", search: "search", list: "list", settings: "settings", dmca: "dmca", index: "home", osiriscinema: "home", wfc: "wfc" };
  if (bySeg[seg]) return bySeg[seg];

  const p = location.pathname.replace(/\/$/, "") || "/";
  if (pagePathMatches(p, "movie")) return "movie";
  if (pagePathMatches(p, "tv")) return "tv";
  if (pagePathMatches(p, "search")) return "search";
  if (pagePathMatches(p, "list")) return "list";
  if (pagePathMatches(p, "settings")) return "settings";
  if (pagePathMatches(p, "dmca")) return "dmca";
  return "home";
}

const normPath = p => (p.replace(/\/$/, "") || "/");

const isTouch = () => matchMedia("(hover: none), (pointer: coarse)").matches;
const isMobile = () => matchMedia("(max-width: 768px)").matches;

let ACTIVE_NAV = "home";
function initMobileUI(active) {
  document.documentElement.classList.toggle("is-touch", isTouch());
  ACTIVE_NAV = active || ACTIVE_NAV;
  buildMobilePillNav(ACTIVE_NAV);
  if (!window._pillNavBound) {
    window._pillNavBound = true;
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => buildMobilePillNav(ACTIVE_NAV), 200);
    }, { passive: true });
  }
}

function buildMobilePillNav(active) {
  const existing = $("#mobile-pill-nav");
  if (!isMobile()) { if (existing) existing.remove(); return; }

  const items = [
    { href: homeUrl(), label: "Home", icon: ICONS.home, key: "home" },
    { href: routeUrl("search"), label: "Discover", icon: ICONS.search, key: "search" },
    { href: routeUrl("list"), label: "My List", icon: ICONS.list, key: "list" },
    { href: routeUrl("settings"), label: "Settings", icon: ICONS.settings, key: "settings" },
  ];

  const nav = existing || document.createElement("nav");
  nav.id = "mobile-pill-nav";
  nav.className = "mobile-pill-nav";
  nav.setAttribute("aria-label", "Primary");

  nav.innerHTML = items.map(it => `
    <a href="${it.href}" data-nav-key="${it.key}" class="pill-nav-item${active === it.key ? " active" : ""}" aria-label="${it.label}"${active === it.key ? ' aria-current="page"' : ""}>
      <span class="pill-nav-ico">${it.icon}</span>
    </a>
  `).join("");

  nav.querySelectorAll(".pill-nav-item").forEach(a => {
    a.addEventListener("click", () => {
      nav.querySelectorAll(".pill-nav-item").forEach(el => el.classList.remove("active"));
      a.classList.add("active");
    });
  });

  if (!existing) document.body.appendChild(nav);

  initMobilePillNavScroll();
  initScrollRestoration();
}

function initMobilePillNavScroll() {
  const nav = $("#mobile-pill-nav");
  if (!nav) return;
  nav.classList.remove("nav-hidden");
}

function initScrollRestoration() {
  if (window._scrollRestored) return;
  window._scrollRestored = true;
  const pageKey = `orc_scroll_${location.pathname}${location.search}`;

  window.addEventListener("beforeunload", () => {
    try { sessionStorage.setItem(pageKey, String(window.scrollY)); } catch (err) { console.warn('Caught error:', err); }
  });

  const savedY = sessionStorage.getItem(pageKey);
  if (savedY && !isNaN(savedY)) {
    const y = parseInt(savedY, 10);
    if (y > 0) {
      setTimeout(() => window.scrollTo({ top: y, behavior: "auto" }), 60);
    }
  }
}

function initSidebar(active) {
  const el = $("#topnav") || $("#sidebar");
  if (!el) return;

  const link = (href, label, act) =>
    `<a href="${href}" class="topnav-link${act ? " active" : ""}">${label}</a>`;

  el.className = "topnav";
  el.id = "topnav";
  el.innerHTML = `
    <div class="topnav-inner">
      <a href="${homeUrl()}" class="topnav-logo" aria-label="Osiris Watch home">
        <span class="topnav-word">Osiris<i>Watch</i></span>
      </a>
      <nav class="topnav-links" aria-label="Primary">
        ${link(homeUrl(), "Home", active === "home")}
        ${link(routeUrl("search"), "Discover", active === "search" || active === "movies" || active === "tv")}
        ${link(routeUrl("list"), "My List", active === "list")}
        ${link(routeUrl("settings"), "Settings", active === "settings")}
      </nav>
      <div class="topnav-actions">
        <a href="${routeUrl("search")}" class="topnav-icon${active === "search" ? " active" : ""}" aria-label="Search">${ICONS.search}</a>
        <button type="button" class="topnav-icon topnav-bell-btn" id="topnav-bell-btn" aria-label="Notifications" aria-expanded="false">${ICONS.bell}</button>
        <a href="https://discord.gg/yv8cVk8p4f" target="_blank" rel="noopener" class="topnav-icon" aria-label="Discord">${ICONS.discord}</a>
        <button type="button" class="topnav-icon topnav-account-btn" id="topnav-account-btn" aria-label="Account" hidden style="display:none">${ICONS.user}</button>
        <button type="button" class="topnav-burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>`;

  initAuthUI();
  initNotificationDropdown();

  const burger = el.querySelector(".topnav-burger");
  burger?.addEventListener("click", e => {
    e.stopPropagation();
    const open = el.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  el.querySelectorAll(".topnav-link").forEach(a =>
    a.addEventListener("click", () => el.classList.remove("nav-open"))
  );
  document.addEventListener("click", e => {
    if (el.classList.contains("nav-open") && !el.contains(e.target)) el.classList.remove("nav-open");
  });

  if (!el._scrollBound) {
    el._scrollBound = true;
    const onScroll = () => el.classList.toggle("scrolled", window.scrollY > 12);
    window.addEventListener("scroll", throttle(onScroll, 50), { passive: true });
    onScroll();
  }

  if (!el._lg) {
    el._lg = true;
    LiquidGlass.apply(el, { id: "lg-topnav", inline: false, noClass: true, borderRadius: 0, distortionScale: -60, blur: 9, brightness: 58, opacity: 0.9 });
  }

  initMobileUI(active);
}

function initSidebarDock() {
  if (isMobile()) return;
  document.body.classList.add("sidebar-dock");
  if ($("#sidebar-edge")) return;

  const edge = document.createElement("div");
  edge.id = "sidebar-edge";
  edge.setAttribute("tabindex", "0");
  edge.setAttribute("role", "button");
  edge.setAttribute("aria-label", "Open navigation menu");
  document.body.appendChild(edge);

  const sidebar = $("#sidebar");
  let closeTimer;

  const open = () => {
    clearTimeout(closeTimer);
    document.body.classList.add("sidebar-open");
  };
  const scheduleClose = () => {
    if (document.body.classList.contains("sidebar-pinned")) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!edge.matches(":hover") && !sidebar?.matches(":hover")) {
        document.body.classList.remove("sidebar-open");
      }
    }, 450);
  };

  edge.addEventListener("mouseenter", open);
  edge.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
      sidebar?.querySelector("a")?.focus();
    }
  });
  sidebar?.addEventListener("mouseenter", open);
  sidebar?.addEventListener("mouseleave", scheduleClose);
  edge.addEventListener("mouseleave", scheduleClose);
  document.addEventListener("mousemove", e => {
    if (e.clientX <= 28) open();
    else if (e.clientX > 110 && document.body.classList.contains("sidebar-open")) scheduleClose();
  }, { passive: true });
}

function toast(msg) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.classList.toggle("toast-mobile", isMobile());
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2400);
}

async function sharePageLink(title) {
  const url = location.href;
  if (navigator.share && isMobile()) {
    try {
      await navigator.share({ title: title || document.title, url });
      return;
    } catch (err) { console.warn('Caught error:', err); }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied");
  } catch {
    toast("Could not copy link");
  }
}

function resumeLabel(prog) {
  if (!prog || prog.progress < 5 || prog.progress >= 98) return "";
  return `Resume · ${Math.round(prog.progress)}% watched`;
}

function initBackToTop() {
  if ($("#back-top")) return;
  const btn = document.createElement("button");
  btn.id = "back-top";
  btn.type = "button";
  btn.className = "back-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19V5M5 12l7-7 7 7"/></svg>`;
  document.body.appendChild(btn);
  LiquidGlass.apply(btn, { borderRadius: 22, distortionScale: -80, blur: 8, brightness: 60, opacity: 0.9, saturation: 1.5 });
  const onScroll = () => btn.classList.toggle("visible", window.scrollY > 480);
  window.addEventListener("scroll", throttle(onScroll, 50), { passive: true });
  onScroll();
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "auto" }));
}



function initRowDrag(track) {
  if (!track || track.dataset.dragReady || isTouch()) return;
  track.dataset.dragReady = "1";
  let active = false;
  let moved = false;
  let startX = 0;
  let scrollStart = 0;

  track.addEventListener("mousedown", e => {
    if (e.button !== 0 || e.target.closest("button, a")) return;
    active = true;
    moved = false;
    startX = e.pageX;
    scrollStart = track.scrollLeft;
  });
  window.addEventListener("mousemove", e => {
    if (!active) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 16) {
      moved = true;
      track.classList.add("is-dragging");
      track.scrollLeft = scrollStart - dx;
    }
  });
  const end = () => {
    if (!active) return;
    active = false;
    track.classList.remove("is-dragging");
    if (moved) track._dragBlockClick = Date.now();
  };
  window.addEventListener("mouseup", end);
  track.addEventListener("click", e => {
    if (track._dragBlockClick && Date.now() - track._dragBlockClick < 250) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

function initRowKeyboard(track) {
  if (!track || track.dataset.kbReady) return;
  track.dataset.kbReady = "1";
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = Math.min(track.clientWidth * 0.72, 320);
    track.scrollBy({ left: e.key === "ArrowRight" ? step : -step, behavior: "smooth" });
  });
}

function observeRows() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".row-wrapper").forEach(r => {
    obs.observe(r);
    const track = r.querySelector(".row-track");
    if (track) { initRowDrag(track); initRowKeyboard(track); }
  });
}

function buildCard(item, type = "movie", opts = {}) {
  const id = item.id;
  const kind = mediaType(item, type);
  const title = item.title || item.name || "Untitled";
  const img = posterUrl(item.poster_path);
  const href = kind === "tv" ? `${routeUrl("tv")}?id=${id}` : `${routeUrl("movie")}?id=${id}`;
  const saved = MyList.has(id, kind);
  const prog = opts.progressValue ?? Progress.getItem(id, kind)?.progress;
  const watched = prog && prog >= 95;
  const y = year(item.release_date || item.first_air_date);

  const card = document.createElement("a");
  card.className = `media-card${watched && SETTINGS.get(SETTINGS.hideWatchedKey) === "1" ? " is-watched" : ""}`;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.href = href;
  card.setAttribute("aria-label", title);
  card.innerHTML = `
    ${opts.rank && opts.top10Today ? `<span class="top10-today-card-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>${opts.rank}</span>` : opts.rank ? `<span class="rank">${opts.rank}</span>` : ""}
    ${prog && prog > 2 ? `<span class="progress-badge">${Math.round(prog)}%</span>` : ""}
    ${!opts.rank && (!prog || prog <= 2) && Number.isFinite(item.vote_average) && item.vote_average >= 6 ? `<span class="card-rating">★ ${(typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "")}</span>` : ""}
    ${img ? `<img src="${esc(img)}" alt="${esc(title)}" loading="lazy" draggable="false" decoding="async" />` : `<div class="no-img-poster">${ICONS.film}<span>${esc(title)}</span></div>`}
    ${prog ? `<div class="progress-bar"><span style="width:${Math.min(prog, 100)}%"></span></div>` : ""}
    <div class="card-quick">
      <button type="button" class="card-icon-btn save-btn${saved ? " saved" : ""}" aria-label="Save">${saved ? ICONS.check : ICONS.plus}</button>
    </div>
    <div class="card-foot">
      <div class="card-foot-title">${esc(title)}</div>
      <div class="card-foot-meta">${y ? `${y} · ` : ""}${kind === "tv" ? "Series" : "Movie"}</div>
    </div>`;

  card.addEventListener("click", e => {
    if (e.target.closest(".save-btn")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.shiftKey) return;
    e.preventDefault();
    const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
    navigateWithLoader(href, bg, title);
  });

  card.addEventListener("keydown", e => {
    if (e.target.closest(".save-btn")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
      navigateWithLoader(href, bg, title);
    }
  });

  const saveBtnEl = card.querySelector(".save-btn");
  if (saveBtnEl) {
    ["touchstart", "pointerdown"].forEach(evt => {
      saveBtnEl.addEventListener(evt, e => e.stopPropagation(), { passive: true });
    });
    saveBtnEl.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget;
      openSaveModal({ id, type: kind, title, poster: item.poster_path }, nowSaved => {
        btn.classList.toggle("saved", nowSaved);
        btn.innerHTML = nowSaved ? ICONS.check : ICONS.plus;
      });
    });
  }

  let timer;
  if (!isTouch()) {
    card.addEventListener("mouseenter", () => {
      card.classList.add("is-hovered");
      timer = setTimeout(() => showPopup(card, item, kind), 1100);
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-hovered");
      clearTimeout(timer);
      if (activePopup) {
        setTimeout(() => {
          if (activePopup && !activePopup.matches(":hover")) closePopup();
        }, 150);
      }
    });
  }

  return card;
}

function skeletons(n = 8) {
  return Array.from({ length: n }, () => { const d = document.createElement("div"); d.className = "skeleton-card"; return d; });
}

let activePopup = null;
let popupScrollHandler = null;

function closePopup() {
  if (!activePopup) return;
  activePopup.classList.remove("is-visible");
  activePopup.classList.add("closing");
  const el = activePopup;
  setTimeout(() => el.remove(), 240);
  activePopup = null;
  if (popupScrollHandler) {
    document.removeEventListener("scroll", popupScrollHandler, true);
    popupScrollHandler = null;
  }
}

function openSaveModal(item, onToggle) {
  let modal = $("#save-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "save-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest(".modal-close-btn")) {
        closeModal(modal);
      }
    });
  }

  const savedInWL = MyList.has(item.id, item.type);
  const folders = Folders.get();
  
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" style="width:min(340px,92vw);padding:22px;border-radius:20px;background:var(--bg-1);border:1px solid var(--border-2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h2 style="font-size:1.15rem;font-weight:800;margin:0">Save to...</h2>
        <button type="button" class="modal-close-btn" aria-label="Close" style="background:var(--bg-2);border:1px solid var(--border);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:var(--text-2);cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;max-height:300px;overflow-y:auto">
        <button type="button" class="save-opt-btn ${savedInWL ? 'active' : ''}" data-target="watchlist" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;border:1px solid ${savedInWL ? 'var(--accent)' : 'var(--border)'};background:${savedInWL ? 'var(--accent)' : 'var(--bg-2)'};color:${savedInWL ? 'var(--on-accent, #000)' : 'var(--text)'};cursor:pointer;font-weight:700;font-size:0.95rem;transition:background 0.2s">
          <div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">${ICONS.list}</div> Watchlist ${savedInWL ? '<div style="margin-left:auto;width:20px;height:20px;display:flex;align-items:center;justify-content:center">'+ICONS.check+'</div>' : ''}
        </button>
        ${folders.length > 0 ? `<div style="height:1px;background:var(--border);margin:4px 0"></div>` : ''}
        ${folders.map(f => {
          const inF = Folders.hasItem(f.id, item.id, item.type);
          return `<button type="button" class="save-opt-btn ${inF ? 'active' : ''}" data-folder-id="${f.id}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;border:1px solid ${inF ? 'var(--accent)' : 'var(--border)'};background:${inF ? 'var(--accent)' : 'var(--bg-2)'};color:${inF ? 'var(--on-accent, #000)' : 'var(--text)'};cursor:pointer;font-weight:700;font-size:0.95rem;transition:background 0.2s">
            <div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">${ICONS.list}</div> ${esc(f.name)} ${inF ? '<div style="margin-left:auto;width:20px;height:20px;display:flex;align-items:center;justify-content:center">'+ICONS.check+'</div>' : ''}
          </button>`;
        }).join("")}
      </div>
    </div>
  `;
  
  modal.querySelectorAll(".save-opt-btn").forEach(b => {
    b.addEventListener("click", () => {
      let added = false;
      if (b.dataset.target === "watchlist") {
        added = MyList.toggle(item);
      } else {
        Folders.toggleItem(b.dataset.folderId, item);
        added = Folders.hasItem(b.dataset.folderId, item.id, item.type);
      }
      
      const nowSaved = MyList.has(item.id, item.type) || Folders.get().some(f => Folders.hasItem(f.id, item.id, item.type));
      if (onToggle) onToggle(nowSaved, added);
      
      closeModal(modal);
      toast(added ? "Added to list" : "Removed from list");
    });
  });

  openModal(modal);
}

const OVERVIEW_PREVIEW = 95;

function setPopupOverview(el, text) {
  if (!el) return;
  const full = (text || "No summary available.").trim();
  el.dataset.full = full;
  if (full.length <= OVERVIEW_PREVIEW) {
    el.textContent = full;
    el.classList.remove("truncated", "expanded");
    return;
  }
  el.classList.add("truncated");
  el.classList.remove("expanded");
  el.innerHTML = `${esc(full.slice(0, OVERVIEW_PREVIEW).trim())}… <button type="button" class="pp-more">See more</button>`;
  el.querySelector(".pp-more")?.addEventListener("click", e => {
    e.stopPropagation();
    el.textContent = full;
    el.classList.remove("truncated");
    el.classList.add("expanded");
  });
}

function showPopup(card, item, type) {
  if (isTouch() || isMobile()) return;
  closePopup();
  const id = item.id;
  const kind = mediaType(item, type);
  const title = item.title || item.name || "Untitled";
  const thumb = item.backdrop_path ? `${IMG_W500}${item.backdrop_path}` : posterUrl(item.poster_path);
  const href = kind === "tv" ? `${routeUrl("tv")}?id=${id}` : `${routeUrl("movie")}?id=${id}`;
  const saved = MyList.has(id, kind);
  const rating = item.vote_average ? (typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "") : "";

  const pop = document.createElement("div");
  pop.className = "card-popup";
  pop.innerHTML = `
    <div class="card-popup-thumb" style="background-image:url(${esc(thumb || "")})"></div>
    <div class="card-popup-body">
      <div class="card-popup-title">${esc(title)}</div>
      <div class="card-popup-meta">${year(item.release_date || item.first_air_date)}${rating ? ` · ★ ${rating}` : ""} · ${kind === "tv" ? "Series" : "Film"}</div>
      <p class="card-popup-overview">${esc(item.overview ? "" : "Loading summary…")}</p>
      <div class="card-popup-actions">
        <button type="button" class="pp-play">Play</button>
        <button type="button" class="pp-save${saved ? " saved" : ""}">${saved ? "Saved" : "Save"}</button>
      </div>
    </div>`;

  const overviewEl = pop.querySelector(".card-popup-overview");
  if (item.overview) setPopupOverview(overviewEl, item.overview);
  else overviewEl.textContent = "Loading summary…";

  const rect = card.getBoundingClientRect();
  const pw = 248;
  let left = rect.left + rect.width / 2 - pw / 2;
  let top = rect.top - 10;
  if (left < 8) left = 8;
  if (left + pw > innerWidth - 8) left = innerWidth - pw - 8;
  if (top < 12) top = rect.bottom + 8;
  if (top + 200 > innerHeight) top = innerHeight - 210;

  pop.style.left = left + "px";
  pop.style.top = top + "px";
  document.body.appendChild(pop);
  requestAnimationFrame(() => pop.classList.add("is-visible"));
  activePopup = pop;

  if (!item.overview) {
    tmdb(`/${kind}/${id}`).then(d => {
      if (activePopup === pop) setPopupOverview(overviewEl, d.overview);
    }).catch(() => {
      if (activePopup === pop) setPopupOverview(overviewEl, "No summary available.");
    });
  }

  pop.querySelector(".pp-play").addEventListener("click", () => { closePopup(); location.href = href; });
  pop.querySelector(".pp-save").addEventListener("click", () => {
    openSaveModal({ id, type: kind, title, poster: item.poster_path }, nowSaved => {
      const btn = pop.querySelector(".pp-save");
      btn.classList.toggle("saved", nowSaved);
      btn.textContent = nowSaved ? "Saved" : "Save";
    });
  });
  pop.addEventListener("mouseenter", () => clearTimeout(pop._closeTimer));
  pop.addEventListener("mouseleave", () => { pop._closeTimer = setTimeout(closePopup, 280); });
  popupScrollHandler = throttle(() => closePopup(), 100);
  document.addEventListener("scroll", popupScrollHandler, { passive: true, capture: true });
}

function buildRow(title, items, type = "movie", opts = {}) {
  const list = (items || []).filter(i => !i.media_type || i.media_type === "movie" || i.media_type === "tv");
  if (!list.length) return null;
  const wrap = document.createElement("div");
  wrap.className = "row-wrapper";
  if (opts.id) wrap.id = opts.id;
  wrap.innerHTML = `
    <div class="row-header">
      <h2 class="row-title">${esc(title)}</h2>
      ${opts.seeAll ? `<a href="${esc(opts.seeAll)}" class="row-see-all">See all →</a>` : ""}
    </div>
    <div class="row-track-container">
      <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
      <div class="row-track"></div>
      <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;

  const track = wrap.querySelector(".row-track");
  skeletons(6).forEach(s => track.appendChild(s));

  const loadCards = () => {
    track.textContent = "";
    list.forEach((item, i) => {
      const cardOpts = { ...(opts.cardOpts || {}) };
      if (opts.ranks) cardOpts.rank = i + 1;
      if (item._progress) cardOpts.progressValue = item._progress;
      track.appendChild(buildCard(item, mediaType(item, type), cardOpts));
    });
    initRowDrag(track);
    initRowKeyboard(track);
  };

  observeLazyRow(wrap, loadCards);

  const scroll = 480;
  wrap.querySelector(".row-arrow.left").addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
  wrap.querySelector(".row-arrow.right").addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));

  if (opts.periodKey) attachPeriodDropdown(wrap, opts);
  return wrap;
}

function attachPeriodDropdown(wrap, opts) {
  const header = wrap.querySelector(".row-header");
  if (!header) return;
  const titleEl = header.querySelector(".row-title");
  if (!titleEl) return;
  const rowTitle = titleEl.textContent.trim();

  titleEl.innerHTML = `${esc(rowTitle)} <span class="row-period-wrap">
    <button type="button" class="row-period-btn" aria-haspopup="listbox">This Week ▾</button>
    <div class="row-period-menu" role="listbox">
      <button type="button" data-period="day" data-path="/trending/all/day">Today</button>
      <button type="button" data-period="week" data-path="/trending/all/week" class="active">This Week</button>
    </div>
  </span>`;

  const btn = titleEl.querySelector(".row-period-btn");
  const menu = titleEl.querySelector(".row-period-menu");
  const track = wrap.querySelector(".row-track");

  btn?.addEventListener("click", e => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  menu?.querySelectorAll("button").forEach(opt => {
    opt.addEventListener("click", async e => {
      e.stopPropagation();
      menu.classList.remove("open");
      menu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      opt.classList.add("active");
      btn.textContent = `${opt.textContent} ▾`;
      track.textContent = "";
      skeletons(10).forEach(s => track.appendChild(s));
      try {
        const data = await tmdb(opt.dataset.path);
        track.textContent = "";
        (data.results || []).slice(0, 20).forEach((it, i) => track.appendChild(buildCard(it, "movie", { rank: i + 1 })));
      } catch {
        track.textContent = "";
      }
    });
  });

  document.addEventListener("click", () => menu?.classList.remove("open"));
}

function scrollToEl(el) {
  if (!el) return;
  const offset = isMobile() ? 70 : 90;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo(0, y);
}

function scrollToSelector(sel) {
  scrollToEl($(sel));
}

function initAnchorScroll() {
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href*='#']");
    if (!a) return;
    const raw = a.getAttribute("href") || "";
    const hash = raw.split("#")[1];
    if (!hash) return;
    const dest = new URL(a.href, location.origin);
    if (normPath(dest.pathname) !== normPath(location.pathname)) return;
    const target = document.getElementById(hash);
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
    history.pushState(null, "", `#${hash}`);
    NProgress.done();
  });

  window.addEventListener("hashchange", () => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target) scrollToEl(target);
  });
}

function injectGlassFilters() {
  if ($("#glass-soft")) return;
  const distortion = `
    <filter id="glass-distortion" x="-12%" y="-12%" width="124%" height="124%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="2" seed="42" result="turbulence"/>
      <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap"/>
      <feDisplacementMap in="SourceGraphic" in2="softMap" scale="34" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  const soft = `
    <filter id="glass-soft" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.005 0.009" numOctaves="2" seed="12" result="n"/>
      <feGaussianBlur in="n" stdDeviation="1.4" result="m"/>
      <feDisplacementMap in="SourceGraphic" in2="m" scale="8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  const existing = $(".splash-filters");
  if (existing) {
    existing.insertAdjacentHTML("beforeend", ($("#glass-distortion") ? "" : distortion) + soft);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "glass-filters-root";
  wrap.innerHTML = `
    <svg aria-hidden="true">
      <filter id="orc-glass" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
        <feImage id="orc-glass-map" x="-50%" y="-50%" width="200%" height="200%" result="map"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"/>
        <feDisplacementMap in="blur" in2="map" scale="0.75" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      ${distortion}
      ${soft}
    </svg>`;
  document.body.prepend(wrap);
}

const LiquidGlass = (() => {
  const NS = "http://www.w3.org/2000/svg";
  let SUP = null, idc = 0;

  function detect() {
    if (matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)").matches) return false;
    const ua = navigator.userAgent || "";
    const isWebkit = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    if (isWebkit || isFirefox) return false;
    const d = document.createElement("div");
    try { d.style.backdropFilter = "url(#x)"; } catch (e) { return false; }
    return d.style.backdropFilter !== "";
  }
  function supported() { if (SUP === null) SUP = detect(); return SUP; }
  function init() {
    const on = supported();
    document.documentElement.classList.toggle("lg-on", on);
    document.documentElement.classList.toggle("lg-fallback", !on);
  }
  function defs() {
    let r = document.getElementById("lg-defs");
    if (!r) {
      r = document.createElementNS(NS, "svg");
      r.setAttribute("id", "lg-defs");
      r.setAttribute("aria-hidden", "true");
      r.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none");
      document.body.appendChild(r);
    }
    return r;
  }
  const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

  function dmap(w, h, o) {
    const edge = Math.min(w, h) * (o.borderWidth * 0.5);
    const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${w}" height="${h}" fill="black"/><rect width="${w}" height="${h}" rx="${o.borderRadius}" fill="url(#r)"/><rect width="${w}" height="${h}" rx="${o.borderRadius}" fill="url(#b)" style="mix-blend-mode:${o.mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${o.borderRadius}" fill="hsl(0 0% ${o.brightness}% / ${o.opacity})" style="filter:blur(${o.blur}px)"/></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function apply(node, opts) {
    if (!node) return;
    const o = Object.assign({
      borderRadius: 24, borderWidth: 0.07, brightness: 56, opacity: 0.9,
      blur: 11, displace: 0.4, saturation: 1.5, distortionScale: -140,
      redOffset: 0, greenOffset: 10, blueOffset: 20, xChannel: "R", yChannel: "G",
      mixBlendMode: "difference", frost: 0, inline: true, noClass: false, id: null
    }, opts);
    if (!o.noClass) node.classList.add("lg-surface");
    if (!supported()) return;

    const id = o.id || ("lg-f-" + (++idc));
    const prev = document.getElementById(id);
    if (prev) prev.remove();
    const f = mk("filter", { id, x: "0%", y: "0%", width: "100%", height: "100%" });
    f.setAttribute("color-interpolation-filters", "sRGB");
    const feImg = mk("feImage", { x: "0", y: "0", width: "100%", height: "100%", preserveAspectRatio: "none", result: "map" });
    f.appendChild(feImg);
    const chans = [
      ["red", o.redOffset, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"],
      ["green", o.greenOffset, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"],
      ["blue", o.blueOffset, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"]
    ];
    chans.forEach(([name, off, mat]) => {
      f.appendChild(mk("feDisplacementMap", { in: "SourceGraphic", in2: "map", scale: String(o.distortionScale + off), xChannelSelector: o.xChannel, yChannelSelector: o.yChannel, result: "disp_" + name }));
      f.appendChild(mk("feColorMatrix", { in: "disp_" + name, type: "matrix", values: mat, result: name }));
    });
    f.appendChild(mk("feBlend", { in: "red", in2: "green", mode: "screen", result: "rg" }));
    f.appendChild(mk("feBlend", { in: "rg", in2: "blue", mode: "screen", result: "out" }));
    f.appendChild(mk("feGaussianBlur", { in: "out", stdDeviation: String(o.displace) }));
    defs().appendChild(f);

    if (o.inline) {
      const bf = (o.frost ? `blur(${o.frost}px) ` : "") + `url(#${id}) saturate(${o.saturation})`;
      node.style.backdropFilter = bf;
      node.style.webkitBackdropFilter = bf;
    }
    const upd = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width && rect.height) feImg.setAttribute("href", dmap(Math.round(rect.width), Math.round(rect.height), o));
    };
    upd();
    setTimeout(upd, 80);
    if (window.ResizeObserver) { new ResizeObserver(() => upd()).observe(node); }
    else window.addEventListener("resize", upd, { passive: true });
  }

  function glassify(root) {
    (root || document).querySelectorAll(".btn-ghost:not([data-lg])").forEach(b => {
      b.setAttribute("data-lg", "1");
      apply(b, { borderRadius: 999, distortionScale: -70, blur: 6, brightness: 60, opacity: 0.9, saturation: 1.4 });
    });
  }

  return { init, apply, glassify, supported };
})();

function initGlassFilter() {
  injectGlassFilters();
  const fe = $("#orc-glass-map");
  if (!fe || fe.getAttribute("href")) return;
  fetch("https://essykings.github.io/JavaScript/map.png")
    .then(r => r.blob())
    .then(b => fe.setAttribute("href", URL.createObjectURL(b)))
    .catch(() => {});
}

function initSplash() {
  initGlassFilter();
  const s = $("#splash-screen");
  const main = $("#main-content");
  if (!s) {
    if (main) main.style.opacity = "1";
    return;
  }
  if (sessionStorage.getItem("orc_splash")) {
    s.remove();
    if (main) main.style.opacity = "1";
    return;
  }

  const sg = s.querySelector(".splash-glass");
  if (sg) LiquidGlass.apply(sg, { borderRadius: 80, distortionScale: -140, blur: 16, brightness: 60, opacity: 0.9, saturation: 1.7 });

  const finish = () => {
    s.classList.add("splash-exit");
    if (main) main.style.opacity = "1";
    setTimeout(() => {
      s.remove();
      sessionStorage.setItem("orc_splash", "1");
    }, 700);
  };

  setTimeout(finish, 2600);
}

const HERO_INTERVAL = 7000;
let heroSlides = [];
let heroIndex = 0;
let heroTimer = null;
let heroImgSlot = 0;
let heroFading = false;
let heroDetailCache = {};

const heroAmbientColorCache = {};

function extractHeroAmbientColors(imgUrl) {
  if (!imgUrl) return Promise.resolve(null);
  if (heroAmbientColorCache[imgUrl]) return Promise.resolve(heroAmbientColorCache[imgUrl]);

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const w = 960;
        const h = 540;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        function sampleRegion(startX, endX) {
          // Extract just the bottom 30 pixels of the region
          const regionH = 30;
          const data = ctx.getImageData(startX, h - regionH, endX - startX, regionH).data;
          let bestColor = null;
          let maxVibrance = -1;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          let satSum = 0;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i+1], b = data[i+2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const lum = (maxC + minC) / 2;
            const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

            if (lum > 15 && lum < 240) {
              sumR += r; sumG += g; sumB += b; count++;
              satSum += sat;
              const vibrance = sat * 4.0 + (1 - Math.abs(lum - 128) / 128);
              if (vibrance > maxVibrance && sat > 0.1) {
                maxVibrance = vibrance;
                bestColor = [r, g, b];
              }
            }
          }

          if (count === 0) return null;
          const avgSat = satSum / count;
          if (avgSat < 0.1 && maxVibrance < 0.4) return null;

          const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
          let r = bestColor ? Math.round(bestColor[0] * 0.85 + avgR * 0.15) : Math.round(avgR);
          let g = bestColor ? Math.round(bestColor[1] * 0.85 + avgG * 0.15) : Math.round(avgG);
          let b = bestColor ? Math.round(bestColor[2] * 0.85 + avgB * 0.15) : Math.round(avgB);

          const avg = (r + g + b) / 3;
          r = Math.min(255, Math.max(0, Math.round(r + (r - avg) * 0.8)));
          g = Math.min(255, Math.max(0, Math.round(g + (g - avg) * 0.8)));
          b = Math.min(255, Math.max(0, Math.round(b + (b - avg) * 0.8)));

          return [r, g, b];
        }

        const step = Math.floor(w / 3);
        const left = sampleRegion(0, step);
        const center = sampleRegion(step, step * 2);
        const right = sampleRegion(step * 2, w);

        const fallback = [40, 50, 80];
        const result = {
          left: left || center || right || fallback,
          center: center || left || right || fallback,
          right: right || center || left || fallback
        };

        heroAmbientColorCache[imgUrl] = result;
        resolve(result);
      } catch (err) { console.warn('Caught error:', err);
        const fallback = [40, 50, 80];
        resolve({ left: fallback, center: fallback, right: fallback });
      }
    };
    img.onerror = () => {
      const fallback = [40, 50, 80];
      resolve({ left: fallback, center: fallback, right: fallback });
    };
    img.src = imgUrl + (imgUrl.includes("?") ? "&" : "?") + "cors=1";
  });
}

let _bleedSlot = 0;

function buildBleedGradient(left, center, right) {
  const lStr = `${left[0]},${left[1]},${left[2]}`;
  const cStr = `${center[0]},${center[1]},${center[2]}`;
  const rStr = `${right[0]},${right[1]},${right[2]}`;
  return `
    radial-gradient(ellipse 65% 90% at 10% 0%, rgba(${lStr},0.45) 0%, transparent 68%),
    radial-gradient(ellipse 65% 90% at 90% 0%, rgba(${rStr},0.45) 0%, transparent 68%),
    radial-gradient(ellipse 85% 75% at 50% 0%, rgba(${cStr},0.35) 0%, transparent 80%)
  `;
}

function applyHeroColorBleed(url) {
  return new Promise(resolve => {
    const elA = $("#hero-color-bleed-a");
    const elB = $("#hero-color-bleed-b");
    if (!elA || !elB || !url) { resolve(); return; }
    extractHeroAmbientColors(url).then(colors => {
      const next = _bleedSlot % 2 === 0 ? elB : elA;
      const cur  = _bleedSlot % 2 === 0 ? elA : elB;

      if (!colors) {
        colors = { left: [40,50,80], center: [40,50,80], right: [40,50,80] };
      }

      next.style.background = buildBleedGradient(colors.left, colors.center, colors.right);
      void next.offsetWidth; // Force reflow
      next.style.opacity = "1";
      cur.style.opacity  = "0";
      _bleedSlot++;
      resolve();
    });
  });
}

function swapHeroBackdrop(url) {
  return new Promise(resolve => {
    const a = $("#hero-backdrop-a");
    const b = $("#hero-backdrop-b");
    if (!url || !a || !b) { resolve(); return; }

    const colorPromise = applyHeroColorBleed(url);
    const next = heroImgSlot % 2 === 0 ? b : a;
    const cur = heroImgSlot % 2 === 0 ? a : b;

    const imgPromise = new Promise(imgResolve => {
      if (next.src === url && next.classList.contains("is-active")) { imgResolve(); return; }
      next.onload = imgResolve;
      next.onerror = imgResolve;
      next.src = url;
      if (next.complete) imgResolve();
    });

    Promise.all([imgPromise, colorPromise]).then(() => {
      cur.classList.remove("is-active");
      next.classList.add("is-active");
      heroImgSlot++;
      resolve();
    });
  });
}

function pickHeroItems(results) {
  const pool = [];
  results.forEach((res, i) => {
    if (res.status !== "fulfilled") return;
    (res.value.results || []).forEach(item => {
      if (!item.backdrop_path || item.media_type === "person") return;
      if (item.media_type && item.media_type !== "movie" && item.media_type !== "tv") return;
      pool.push(item);
    });
  });
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const seen = new Set();
  const picks = [];
  for (const item of shuffled) {
    const key = `${mediaType(item)}_${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(item);
    if (picks.length >= 5) break;
  }
  return picks;
}

function startHeroTimer() {
  if (prefersReducedMotion() || heroSlides.length < 2) return;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHeroSlide((heroIndex + 1) % heroSlides.length, true), HERO_INTERVAL);
}

function buildHeroDots() {
  const dots = $("#hero-dots");
  if (!dots || heroSlides.length < 2) {
    if (dots) dots.textContent = "";
    return;
  }
  dots.innerHTML = heroSlides.map((_, i) =>
    `<button type="button" class="hero-dot${i === 0 ? " active" : ""}" aria-label="Featured ${i + 1}"><span class="hero-dot-fill"></span></button>`
  ).join("");
  dots.querySelectorAll(".hero-dot").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      clearInterval(heroTimer);
      setHeroSlide(i, true);
      startHeroTimer();
    });
  });
  restartDotFill(0);
}

function restartDotFill(i) {
  $$(".hero-dot").forEach((d, j) => {
    d.classList.toggle("active", j === i);
    const fill = d.querySelector(".hero-dot-fill");
    if (!fill) return;
    fill.style.animation = "none";
    void fill.offsetWidth;
    if (j === i) fill.style.animation = `heroDotFill ${HERO_INTERVAL}ms linear forwards`;
  });
}

async function setHeroSlide(i, animate = false) {
  if (!heroSlides.length || heroFading) return;
  heroIndex = i;
  if (animate) {
    heroFading = true;
    $(".hero")?.classList.add("hero-fading");
    await new Promise(r => setTimeout(r, 420));
  }
  try {
    await loadHero(heroSlides[i]);
    if (animate) {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      $(".hero")?.classList.remove("hero-fading");
    }
  } catch (err) { console.warn('Caught error:', err);
    $(".hero")?.classList.remove("hero-fading");
  } finally {
    if (animate) heroFading = false;
  }
  restartDotFill(i);
  const nextSlide = heroSlides[(i + 1) % heroSlides.length];
  if (nextSlide?.backdrop_path) {
    const pImg = new Image();
    pImg.src = `${IMG_ORIG}${nextSlide.backdrop_path}`;
  }
}

function initHeroCarousel(slides) {
  if (!slides.length) return;
  heroSlides = slides;
  buildHeroDots();
  loadHero(slides[0]);
  startHeroTimer();
}

let heroData = null;
let heroBound = false;

async function loadHero(item) {
  if (!item) return;
  heroData = item;
  bindHeroActions();
  updateHeroListState();
  const id = item.id;
  const realType = mediaType(item);
  const title = item.title || item.name || "";
  const backdrop = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : "";

  await swapHeroBackdrop(backdrop);

  if ($("#hero-type")) $("#hero-type").textContent = realType === "tv" ? "Series" : "Film";
  if ($("#hero-desc")) $("#hero-desc").textContent = item.overview || "";

  const cacheKey = `${realType}_${id}`;
  try {
    let d = heroDetailCache[cacheKey];
    if (!d) {
      d = await tmdb(`/${realType}/${id}?append_to_response=images,videos`);
      heroDetailCache[cacheKey] = d;
    }
    heroData._detail = d;
    heroData._type = realType;

    // TMDB Title Logo rendering
    const logos = d.images?.logos || [];
    const logoObj = logos.find(l => l.iso_639_1 === "en") || logos.find(l => !l.iso_639_1) || logos[0];
    const titleEl = $("#hero-title");
    if (titleEl) {
      if (logoObj?.file_path) {
        titleEl.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${logoObj.file_path}" class="hero-title-logo" alt="${esc(title)}" />`;
      } else {
        titleEl.textContent = title;
      }
    }

    const rating = d.vote_average?.toFixed(1);
    const y = year(d.release_date || d.first_air_date);
    const metaParts = [];
    const svgStar = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
    const svgCalendar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const svgClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
    const svgTv = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M8 22h8M12 19v3"/></svg>`;

    if (rating) metaParts.push(`<span class="hero-badge-pill score-pill">${svgStar}${rating}</span>`);
    if (y) metaParts.push(`<span class="hero-badge-pill">${svgCalendar}${y}</span>`);
    if (d.runtime) metaParts.push(`<span class="hero-badge-pill">${svgClock}${formatRuntime(d.runtime)}</span>`);
    else if (d.number_of_seasons) metaParts.push(`<span class="hero-badge-pill">${svgTv}${d.number_of_seasons} Season${d.number_of_seasons > 1 ? "s" : ""}</span>`);
    if (d.genres?.length) metaParts.push(`<span class="hero-badge-pill">${esc(d.genres[0].name)}</span>`);
    if ($("#hero-meta")) $("#hero-meta").innerHTML = metaParts.join("");

    // Auto-play trailer popups disabled
  } catch (err) { console.warn('Caught error:', err);
    if ($("#hero-title")) $("#hero-title").textContent = title;
  }

  bindHeroActions();
  updateHeroListState();
}

function updateHeroListState() {
  const btn = $("#hero-list-btn");
  if (!btn || !heroData) return;
  const kind = mediaType(heroData);
  const saved = MyList.has(heroData.id, kind);
  btn.innerHTML = saved ? ICONS.check : ICONS.plus;
  btn.classList.toggle("saved", saved);
  btn.setAttribute("title", saved ? "Remove from My List" : "Add to My List");
  btn.setAttribute("aria-label", saved ? "Remove from My List" : "Add to My List");
}

function bindHeroActions() {
  if (heroBound) return;
  heroBound = true;

  const heroContent = $(".hero-content") || $("#hero");
  if (heroContent && !heroContent.dataset.pauseBound) {
    heroContent.dataset.pauseBound = "1";
    heroContent.addEventListener("mouseenter", () => clearInterval(heroTimer));
    heroContent.addEventListener("mouseleave", () => startHeroTimer());
  }

  $("#hero-play-btn")?.addEventListener("click", () => {
    if (!heroData) return;
    const type = mediaType(heroData);
    const href = type === "tv" ? `${routeUrl("tv")}?id=${heroData.id}` : `${routeUrl("movie")}?id=${heroData.id}`;
    const backdrop = heroData.backdrop_path ? `${IMG_ORIG}${heroData.backdrop_path}` : "";
    const title = heroData.title || heroData.name || "";
    navigateWithLoader(href, backdrop, title);
  });
  $("#hero-info-btn")?.addEventListener("click", () => {
    if (!heroData) return;
    const type = mediaType(heroData);
    location.href = type === "tv" ? `${routeUrl("tv")}?id=${heroData.id}` : `${routeUrl("movie")}?id=${heroData.id}`;
  });
  $("#hero-list-btn")?.addEventListener("click", () => {
    if (!heroData) return;
    const kind = mediaType(heroData);
    openSaveModal({ id: heroData.id, type: kind, title: heroData.title || heroData.name, poster: heroData.poster_path }, () => {
      updateHeroListState();
    });
  });
}

function openTrailer(youtubeKey) {
  let modal = $("#trailer-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "trailer-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `<button class="modal-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="modal-box"><iframe allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").addEventListener("click", closeTrailer);
    modal.addEventListener("click", e => { if (e.target === modal) closeTrailer(); });
  }
  modal.querySelector("iframe").src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`;
  modal.classList.add("open");
  trapModalFocus(modal, "Video trailer");
}

function closeTrailer() {
  const modal = $("#trailer-modal");
  if (!modal) return;
  modal.classList.remove("open");
  releaseModalFocus();
  setTimeout(() => { const f = modal.querySelector("iframe"); if (f) f.src = ""; }, 300);
}

function initGenreStrip() {
  const strip = $("#genre-strip");
  if (!strip) return;
  strip.textContent = "";
  GENRES.forEach((g, i) => {
    const btn = document.createElement("button");
    btn.className = `genre-pill${i === 0 ? " active" : ""}`;
    btn.textContent = g.name;
    btn.addEventListener("click", async () => {
      $$(".genre-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const row = $("#genre-row");
      if (!row) return;
      const titleEl = row.querySelector(".row-title");
      if (titleEl) titleEl.textContent = g.name;
      const track = row.querySelector(".row-track");
      track.textContent = ""; skeletons(10).forEach(s => track.appendChild(s));
      row.scrollIntoView({ behavior: "auto", block: "nearest" });
      try {
        const data = await tmdb(`/discover/movie?with_genres=${g.id}&sort_by=popularity.desc`);
        track.textContent = "";
        (data.results || []).slice(0, 20).forEach(it => track.appendChild(buildCard(it, "movie")));
        initRowDrag(track);
        initRowKeyboard(track);
      } catch (err) { console.warn('Caught error:', err); }
    });
    strip.appendChild(btn);
  });
}

function buildSeasonSpotlight(shows) {
  const list = (shows || []).filter(s => s && (s.backdrop_path || s.poster_path));
  if (!list.length) return null;
  const wrap = document.createElement("div");
  wrap.className = "row-wrapper spotlight-wrapper visible";
  wrap.innerHTML = `
    <div class="row-header"><h2 class="row-title">New Seasons Airing Now</h2></div>
    <div class="row-track-container">
      <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
      <div class="row-track spotlight-track"></div>
      <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;
  const track = wrap.querySelector(".spotlight-track");
  list.forEach(s => {
    const img = s.backdrop_path ? `${IMG_W780}${s.backdrop_path}` : posterUrl(s.poster_path);
    const sn = s._season || s.number_of_seasons;
    const card = document.createElement("a");
    card.className = "spotlight-card";
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", s.name || s.title || "");
    card.innerHTML = `
      ${img ? `<img src="${esc(img)}" alt="${esc(s.title || s.name || '')}" loading="lazy" draggable="false" decoding="async"/>` : `<div class="no-img">\u2014</div>`}
      <div class="spotlight-shade"></div>
      ${sn ? `<span class="spotlight-badge">${ICONS.clapper} Season ${sn}</span>` : ""}
      <div class="spotlight-foot">
        <div class="spotlight-title">${esc(s.name || s.title || "")}</div>
      </div>`;
    const go = () => { location.href = `${routeUrl("tv")}?id=${s.id}`; };
    card.addEventListener("click", go);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    track.appendChild(card);
  });
  initRowDrag(track);
  initRowKeyboard(track);
  const scroll = 360;
  wrap.querySelector(".row-arrow.left").addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
  wrap.querySelector(".row-arrow.right").addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));
  return wrap;
}

function shareTitle(title, text, url) {
  if (navigator.share) {
    navigator.share({ title: title || BRAND, text: text || "", url: url || location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url || location.href);
    toast("Link copied to clipboard!");
  }
}

function setMetaTags(title, desc, img) {
  document.title = `${title} — ${BRAND}`;
  let ogTitle = $('meta[property="og:title"]');
  if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); }
  ogTitle.setAttribute("content", title);

  let ogDesc = $('meta[property="og:description"]');
  if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); }
  ogDesc.setAttribute("content", desc || "");

  let ogImg = $('meta[property="og:image"]');
  if (!ogImg) { ogImg = document.createElement("meta"); ogImg.setAttribute("property", "og:image"); document.head.appendChild(ogImg); }
  if (img) ogImg.setAttribute("content", img);
}

function initInstantSearch(inputEl, isEnabled = () => true) {
  if (!inputEl || inputEl.dataset.instantBound) return;
  inputEl.dataset.instantBound = "1";
  let timer = null;
  let dropdown = null;

  const closeDropdown = () => {
    dropdown?.remove();
    dropdown = null;
    inputEl.setAttribute("aria-expanded", "false");
  };

  inputEl.addEventListener("input", () => {
    const q = inputEl.value.trim();
    clearTimeout(timer);
    if (!isEnabled() || !q || q.length < 2) { closeDropdown(); return; }

    timer = setTimeout(async () => {
      if (!isEnabled()) { closeDropdown(); return; }
      try {
        const data = await tmdb(`/search/multi?query=${encodeURIComponent(q)}`);
        if (!isEnabled() || inputEl.value.trim() !== q) { closeDropdown(); return; }
        const hits = (data.results || []).filter(i => (i.poster_path || i.backdrop_path) && (i.media_type === "movie" || i.media_type === "tv")).slice(0, 4);
        if (!hits.length) { closeDropdown(); return; }

        if (!dropdown) {
          dropdown = document.createElement("div");
          dropdown.className = "instant-search-dropdown";
          inputEl.setAttribute("aria-expanded", "true");
          inputEl.parentElement.appendChild(dropdown);
        }

        dropdown.innerHTML = hits.map(item => {
          const type = item.media_type === "tv" ? "tv" : "movie";
          const title = item.title || item.name || "";
          const img = posterUrl(item.poster_path) || "";
          const y = year(item.release_date || item.first_air_date);
          const link = `/${type}?id=${item.id}`;
          return `
            <a href="${link}" class="instant-search-item">
              <img src="${esc(img)}" class="instant-search-poster" alt="${esc(item.title || item.name || '')}" />
              <div>
                <div class="instant-search-title">${esc(title)}</div>
                <div class="instant-search-sub">${type === "tv" ? "TV Series" : "Movie"}${y ? " · " + y : ""}</div>
              </div>
            </a>
          `;
        }).join("");
      } catch (err) { console.warn('Caught error:', err); closeDropdown(); }
    }, 200);
  });

  document.addEventListener("click", e => {
    if (!inputEl.contains(e.target) && !dropdown?.contains(e.target)) {
      closeDropdown();
    }
  });

  inputEl.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDropdown();
  });
  return () => { clearTimeout(timer); closeDropdown(); };
}



async function renderContinueWatchingRow() {
  const container = $("#categories");
  if (!container) return;
  const items = Progress.getAll();
  if (!items || !items.length) return;

  const validItems = items.filter(it => it && (it.id || it.mediaId) && it.progress > 1 && it.progress < 98);
  if (!validItems.length) return;

  const wrap = document.createElement("div");
  wrap.className = "row-wrapper continue-watching-wrapper visible";
  wrap.innerHTML = `
    <div class="row-header"><h2 class="row-title">Continue Watching</h2></div>
    <div class="row-track-container">
      <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
      <div class="row-track continue-watching-track"></div>
      <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;
  const track = wrap.querySelector(".continue-watching-track");
  track.append(...skeletons(Math.min(validItems.length, 6)));
  container.prepend(wrap);

  try {
    const settled = await Promise.allSettled(validItems.slice(0, 10).map(it => {
      const type = (it.mediaType || it.type) === "tv" ? "tv" : "movie";
      const id = it.id || it.mediaId;
      return tmdb(`/${type}/${id}`).then(d => ({ d, type, progress: it.progress }));
    }));
    const loaded = settled.filter(r => r.status === "fulfilled" && r.value?.d).map(r => r.value);
    if (!loaded.length) {
      wrap.remove();
      return;
    }
    track.textContent = "";
    loaded.forEach(({ d, type, progress }) => {
      track.appendChild(buildCard(d, type, { progressValue: progress }));
    });
    initRowDrag(track);
    initRowKeyboard(track);
    const scroll = 360;
    wrap.querySelector(".row-arrow.left")?.addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
    wrap.querySelector(".row-arrow.right")?.addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));
  } catch (err) {
    console.warn("Caught error:", err);
    wrap.remove();
  }
}

function initHeroSwipe() {
  const heroEl = $("#hero") || $(".hero");
  if (!heroEl || heroEl.dataset.swipeBound) return;
  heroEl.dataset.swipeBound = "1";

  let touchStartX = 0;
  let touchStartY = 0;

  heroEl.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    if (e.target.closest("button, a, .hero-actions, .hero-dots")) {
      touchStartX = 0;
      touchStartY = 0;
      return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  heroEl.addEventListener("touchend", e => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      clearInterval(heroTimer);
      if (deltaX < 0) {
        setHeroSlide((heroIndex + 1) % heroSlides.length, true);
      } else {
        setHeroSlide((heroIndex - 1 + heroSlides.length) % heroSlides.length, true);
      }
      startHeroTimer();
    }
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
}

function resumeLabel(progressObj) {
  if (!progressObj) return "";
  if (progressObj.season && progressObj.episode) {
    return `Resumes at S${progressObj.season} E${progressObj.episode}`;
  }
  const watchedSec = progressObj.currentTime;
  if (watchedSec && watchedSec > 10) {
    const m = Math.floor(watchedSec / 60);
    const h = Math.floor(m / 60);
    const rM = m % 60;
    if (h > 0) return `Resumes at ${h}h ${rM}m`;
    return `Resumes at ${rM}m`;
  }
  return "Resumes playback";
}

async function renderRecommendedForYouRow() {
  const container = $("#categories");
  if (!container) return;
  const items = Progress.getAll();
  if (!items || !items.length) return;

  const lastItem = items[0];
  if (!lastItem || !lastItem.id) return;

  const type = lastItem.mediaType === "tv" ? "tv" : "movie";
  try {
    const data = await tmdb(`/${type}/${lastItem.id}/recommendations`);
    const recs = (data.results || []).filter(i => i.poster_path || i.backdrop_path).slice(0, 14);
    if (!recs.length) return;

    const wrap = document.createElement("div");
    wrap.className = "row-wrapper recommended-for-you-wrapper visible";
    wrap.innerHTML = `
      <div class="row-header"><h2 class="row-title">Recommended For You</h2></div>
      <div class="row-track-container">
        <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
        <div class="row-track recommended-for-you-track"></div>
        <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
      </div>`;
    const track = wrap.querySelector(".recommended-for-you-track");
    recs.forEach(it => track.appendChild(buildCard(it, mediaType(it, type))));

    const contRow = container.querySelector(".continue-watching-wrapper");
    if (contRow) contRow.after(wrap);
    else container.prepend(wrap);

    initRowDrag(track);
    initRowKeyboard(track);
    const scroll = 360;
    wrap.querySelector(".row-arrow.left")?.addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
    wrap.querySelector(".row-arrow.right")?.addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));
  } catch (err) { console.warn('Caught error:', err); }
}

function navigateWithLoader(href, bg = "", title = "") {
  try {
    sessionStorage.setItem("orc_loader", JSON.stringify({ bg, title }));
  } catch (err) { console.warn('Caught error:', err); }
  location.href = href;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

const DEVLOG_ID = "v3.0_nov2026";

function renderDevLogAnnouncement() {
  if (safeGetItem("orc_devlog_dismissed") === DEVLOG_ID) return;

  const card = document.createElement("div");
  card.className = "devlog-card";
  card.id = "devlog-card";
  card.innerHTML = `
    <div class="devlog-header">
      <div class="devlog-header-left">
        <span>UPDATE LOG</span>
        <span class="devlog-date">· v3.0 RELEASE</span>
      </div>
      <button type="button" class="devlog-close" id="devlog-close" aria-label="Dismiss update">✕</button>
    </div>
    <div class="devlog-title">Fibre 4.5 AI Search, Shader Backdrops & Watch Migration</div>
    <div class="devlog-body">
      <p>Upgraded Discover with Fibre 4.5 catalog-verified AI Search for natural-language mood, era, runtime, cast, and exclusion prompts.</p>
      <p>Added customizable WebGL shader backdrops (defaulting to Rings locked to your accent color) with 15 styles, speed, and film grain controls in Settings.</p>
      <p>Completed migration to watch.osiris.rocks with clean routing, offline service worker fixes, and streamlined navigation.</p>
    </div>
    <div class="devlog-foot">
      <a href="https://discord.gg/yv8cVk8p4f" target="_blank" rel="noopener" class="devlog-discord-link">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path></svg>
        Join the Discord server
      </a>
    </div>`;

  document.body.appendChild(card);

  card.querySelector("#devlog-close")?.addEventListener("click", () => {
    safeSetItem("orc_devlog_dismissed", DEVLOG_ID);
    card.style.opacity = "0";
    card.style.transform = "translateY(16px) scale(0.96)";
    card.style.transition = "opacity 0.25s, transform 0.25s";
    setTimeout(() => card.remove(), 260);
  });
}

async function initHomePage() {
  initSplash();
  initSidebar("home");
  bindHeroActions();
  initGenreStrip();
  initGlobalShortcuts();
  initHeroSwipe();
  renderDevLogAnnouncement();

  const main = $("#main-content");
  if (main) {
    main.style.opacity = "1";
  }

  const el = $("#categories");
  if (!el) return;
  el.textContent = "";

  renderContinueWatchingRow();
  renderRecommendedForYouRow();

  const list = MyList.get();
  if (list.length) {
    const mlRow = document.createElement("div");
    mlRow.className = "row-wrapper my-list-wrapper visible";
    mlRow.innerHTML = `<div class="row-header"><h2 class="row-title">My List</h2></div><div class="row-track-container"><button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button><div class="row-track"></div><button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button></div>`;
    const mlTrack = mlRow.querySelector(".row-track");
    mlTrack.append(...skeletons(6));
    el.appendChild(mlRow);

    (async () => {
      try {
        const ml = await Promise.allSettled(list.slice(0, 20).map(i =>
          tmdb(i.type === "tv" ? `/tv/${i.id}` : `/movie/${i.id}`).then(d => ({ ...d, _type: i.type }))
        ));
        const items = ml.filter(r => r.status === "fulfilled").map(r => r.value);
        if (items.length) {
          mlTrack.textContent = "";
          items.forEach(it => mlTrack.appendChild(buildCard(it, it._type || "movie", { eager: true })));
          initRowDrag(mlTrack);
          initRowKeyboard(mlTrack);
        } else {
          mlRow.remove();
        }
      } catch (err) { console.warn('Caught error:', err); mlRow.remove(); }
    })();
  }

  // Channels & Apps Row (10 real provider logos)
  const CHANNELS_DATA = [
    { name: "Netflix", id: 8, type: "movie", img: "netflix.png" },
    { name: "Prime Video", id: 9, type: "movie", img: "primevideo.png" },
    { name: "Disney+", id: 337, type: "movie", img: "disney.png" },
    { name: "Hulu", id: 15, type: "tv", img: "hulu.png" },
    { name: "HBO Max", id: 1899, type: "tv", img: "hbomax.png" },
    { name: "Apple TV+", id: 350, type: "movie", img: "appletv.png" },
    { name: "Paramount+", id: 531, type: "tv", img: "paramount.png" },
    { name: "Peacock", id: 386, type: "tv", img: "peacock.png" },
    { name: "Crunchyroll", id: 283, type: "tv", img: "crunchyroll.png" },
    { name: "AMC+", id: 528, type: "tv", img: "amc.png" }
  ];

  const chanRow = document.createElement("div");
  chanRow.className = "row-wrapper visible channels-wrapper";
  chanRow.innerHTML = `
    <div class="row-header">
      <h2 class="row-title">Channels & Apps</h2>
    </div>
    <div class="row-track-container">
      <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
      <div class="row-track channels-track">
        ${CHANNELS_DATA.map(ch => `
          <button type="button" class="channel-card" data-provider-id="${ch.id}" data-provider-type="${ch.type}" aria-label="${esc(ch.name)}">
            <img src="/providers/${ch.img}" alt="${esc(ch.name)}" loading="lazy" class="channel-card-img" />
          </button>
        `).join("")}
      </div>
      <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;

  const ctrack = chanRow.querySelector(".channels-track");
  const cscroll = 420;
  chanRow.querySelector(".row-arrow.left")?.addEventListener("click", () => ctrack.scrollBy({ left: -cscroll, behavior: "smooth" }));
  chanRow.querySelector(".row-arrow.right")?.addEventListener("click", () => ctrack.scrollBy({ left: cscroll, behavior: "smooth" }));
  chanRow.querySelectorAll(".channel-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.dataset.providerId;
      const ptype = btn.dataset.providerType;
      location.href = `${routeUrl("search")}?type=${ptype}&provider=${pid}`;
    });
  });
  initRowDrag(ctrack);
  initRowKeyboard(ctrack);
  el.appendChild(chanRow);

  const cats = [
    { title: "Top 10 Today", path: "/trending/all/day", type: "movie", top10Today: true, eager: true },
    { title: "Top 10 Movies", path: "/trending/movie/week", type: "movie", top10Side: true, eager: true },
    { title: "Top 10 TV Shows", path: "/trending/tv/week", type: "tv", top10Side: true, eager: true },
    { title: "Trending Movies", path: "/trending/movie/day", type: "movie" },
    { title: "Trending Series", path: "/trending/tv/day", type: "tv" },
    { title: "Upcoming Episodes", path: "/tv/on_the_air", type: "tv" },
    { title: "New Seasons Airing Now", path: "/tv/airing_today", type: "tv" },
    { title: "Recommended for You", path: "/trending/all/week", type: "movie", id: "trending" },
    { title: "Award Winners", path: "/movie/top_rated", type: "movie" },
    { title: "Best by Decade", path: "/discover/movie?sort_by=vote_average.desc&primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31", type: "movie" },
  ];

  const catRowEls = cats.map(c => {
    const w = document.createElement("div");
    w.className = `row-wrapper visible${c.top10Today ? " top10-today-row" : ""}${c.top10Side ? " top10-side-row" : ""}`;
    const badge = "";
    w.innerHTML = `<div class="row-header"><h2 class="row-title">${esc(c.title)}${badge}</h2></div><div class="row-track-container"><button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button><div class="row-track${c.top10Side ? " top10-side-track" : ""}"></div><button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button></div>`;
    const track = w.querySelector(".row-track");
    track.append(...skeletons(8));
    const scroll = 360;
    w.querySelector(".row-arrow.left")?.addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
    w.querySelector(".row-arrow.right")?.addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));
    el.appendChild(w);
    return { c, w, track };
  });

  cats.forEach(async (c, i) => {
    try {
      const data = await tmdb(c.path);
      const items = dedupeItems(data.results || []);
      const target = catRowEls[i];
      if (target && items.length) {
        const sliced = (c.top10Today || c.top10Side) ? items.slice(0, 10) : items;
        target.track.textContent = "";
        sliced.forEach((it, idx) => {
          if (c.top10Side) {
            const itemWrap = document.createElement("div");
            itemWrap.className = "top10-item-wrap";
            itemWrap.innerHTML = `<span class="top10-side-num" aria-hidden="true">${idx + 1}</span>`;
            itemWrap.appendChild(buildCard(it, c.type, { eager: idx < 4 }));
            target.track.appendChild(itemWrap);
          } else {
            target.track.appendChild(buildCard(it, c.type, {
              rank: c.top10Today ? idx + 1 : null,
              top10Today: c.top10Today || false,
              eager: idx < 4
            }));
          }
        });
        initRowDrag(target.track);
        initRowKeyboard(target.track);

        if (c.id === "trending" && items.length) {
          initHeroCarousel(items.slice(0, 6));
        }
      } else if (target) {
        target.w.remove();
      }
    } catch (err) { console.warn('Caught error:', err);
      if (catRowEls[i]) catRowEls[i].w.remove();
    }
  });

  // Provider-curated rows — fetched non-blocking from TMDB discover API
  const STREAM_PROVIDERS = [
    { title: "Trending on Netflix",    id: 8,    type: "movie",  icon: "N" },
    { title: "Trending on Prime Video", id: 9,    type: "movie",  icon: "P" },
    { title: "Trending on Disney+",    id: 337,  type: "movie",  icon: "D" },
    { title: "Trending on Max",         id: 1899, type: "tv",    icon: "M" },
    { title: "Trending on Apple TV+",  id: 350,  type: "movie",  icon: "A" },
    { title: "Trending on Hulu",       id: 15,   type: "tv",    icon: "H" },
  ];

  STREAM_PROVIDERS.forEach(sp => {
    const pw = document.createElement("div");
    pw.className = "row-wrapper provider-row";
    pw.innerHTML = `
      <div class="row-header">
        <h2 class="row-title">${esc(sp.title)}</h2>
      </div>
      <div class="row-track-container">
        <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
        <div class="row-track"></div>
        <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
      </div>`;
    const pt = pw.querySelector(".row-track");
    pt.append(...skeletons(8));
    const scroll = 360;
    pw.querySelector(".row-arrow.left")?.addEventListener("click", () => pt.scrollBy({ left: -scroll, behavior: "smooth" }));
    pw.querySelector(".row-arrow.right")?.addEventListener("click", () => pt.scrollBy({ left: scroll, behavior: "smooth" }));
    el.appendChild(pw);
    observeLazyRow(pw, async () => {
      try {
        const res = await tmdb(`/discover/${sp.type}?with_watch_providers=${sp.id}&watch_region=US&sort_by=popularity.desc`);
        const provItems = dedupeItems(res.results || []);
        if (provItems.length) {
          pt.textContent = "";
          provItems.forEach(it => pt.appendChild(buildCard(it, sp.type)));
          initRowDrag(pt);
          initRowKeyboard(pt);
          pw.classList.add("visible");
        } else {
          pw.remove();
        }
      } catch (err) { console.warn('Caught error:', err); pw.remove(); }
    });
  });

  const gRow = document.createElement("div");
  gRow.id = "genre-row";
  gRow.className = "row-wrapper visible";
  gRow.innerHTML = `<div class="row-header"><h2 class="row-title">${GENRES[0].name}</h2></div><div class="row-track-container"><div class="row-track"></div></div>`;
  try {
    const gd = await tmdb(`/discover/movie?with_genres=${GENRES[0].id}&sort_by=popularity.desc`);
    dedupeItems(gd.results || []).slice(0, 20).forEach(it => gRow.querySelector(".row-track").appendChild(buildCard(it, "movie")));
  } catch (err) { console.warn('Caught error:', err); }
  el.prepend(gRow);

  observeRows();
  if (main) main.style.opacity = "1";

  (async () => {
    try {
      const air = await tmdb("/tv/on_the_air");
      const top = (air.results || []).filter(s => s.backdrop_path).slice(0, 12);
      const details = await Promise.allSettled(top.map(s => tmdb(`/tv/${s.id}`)));
      const shows = details
        .filter(r => r.status === "fulfilled")
        .map(r => r.value)
        .filter(s => (s.number_of_seasons || 0) >= 2)
        .slice(0, 10);
      const spot = buildSeasonSpotlight(shows);
      if (spot) el.prepend(spot);
    } catch (err) { console.warn('Caught error:', err); }
  })();

  const hash = location.hash.replace("#", "");
  if (hash) {
    const delay = ($("#splash-screen") && !sessionStorage.getItem("orc_splash")) ? 3000 : 500;
    setTimeout(() => scrollToEl(document.getElementById(hash)), delay);
  }
}

function renderProviders(container, type, id, s, e, onChange) {
  if (!container) return;
  container.className = "provider-tabs";
  container.textContent = "";
  PROVIDERS.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = `provider-tab${getProvider() === p.id ? " active" : ""}`;
    btn.innerHTML = i === 0
      ? `${p.name}<span class="provider-rec" aria-label="Recommended">★</span>`
      : p.name;
    btn.addEventListener("click", () => {
      setProvider(p.id);
      $$(".provider-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(providerUrl(type, id, s, e));
    });
    container.appendChild(btn);
  });
}

async function initMoviePage() {
  const id = new URLSearchParams(location.search).get("id");
  const header = $("#detail-header");
  const frame = $("#player-frame");
  if (!id) { location.href = homeUrl(); return; }
  if (!header || !frame) return;

  initSidebar("movies");
  checkPlayLoader();
  initPlayerGuard();

  const showErr = msg => {
    if (header) header.innerHTML = `<p style="color:var(--text-muted)">${esc(msg)}</p>`;
    if (frame) frame.innerHTML = `<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.85rem;padding:20px;text-align:center">Could not load player.</p>`;
  };

  let m;
  try {
    m = await tmdb(`/movie/${id}?append_to_response=images,credits,similar,videos,recommendations,external_ids,release_dates`);
  } catch (err) { console.warn('Caught error:', err);
    try {
      m = await tmdb(`/movie/${id}`);
    } catch (err) { console.warn('Caught error:', err);
      m = { id, title: `Movie #${id}`, overview: "Select a stream provider below to start watching." };
    }
  }

  try {
    document.title = `${m.title} — ${BRAND}`;
    const backdrop = m.backdrop_path ? `${IMG_ORIG}${m.backdrop_path}` : "";
    const backdropEl = $("#detail-backdrop");
    if (backdropEl && backdrop) backdropEl.style.backgroundImage = `url(${backdrop})`;

    const saved = MyList.has(m.id, "movie");
    const trailer = pickTrailer(m.videos);
    const cert = (m.release_dates?.results || []).find(r => r.iso_3166_1 === "US")?.release_dates?.map(d => d.certification).find(Boolean);
    const resume = resumeLabel(Progress.getItem(m.id, "movie"));

    const logos = m.images?.logos || [];
    const logoObj = logos.find(l => l.iso_639_1 === "en") || logos.find(l => !l.iso_639_1) || logos[0];
    const titleHtml = logoObj?.file_path
      ? `<div class="detail-logo-wrap"><img src="https://image.tmdb.org/t/p/w500${logoObj.file_path}" class="detail-title-logo" alt="${esc(m.title)}" /></div>`
      : `<h1 class="detail-title">${esc(m.title)}</h1>`;

    header.innerHTML = `
      ${titleHtml}
      ${m.tagline ? `<p class="detail-tagline">${esc(m.tagline)}</p>` : ""}
      ${m.belongs_to_collection ? `<a class="collection-banner" href="${routeUrl("search")}?type=movie&q=${encodeURIComponent(m.belongs_to_collection.name)}">Part of ${esc(m.belongs_to_collection.name)}</a>` : ""}
      <div class="detail-meta">
        ${m.vote_average ? `<span class="score">★ ${m.vote_average.toFixed(1)}</span>` : ""}
        ${m.vote_count ? `<span>${fmtVotes(m.vote_count)}</span>` : ""}
        <span>${year(m.release_date)}</span>
        ${m.runtime ? `<span>${formatRuntime(m.runtime)}</span>` : ""}
        ${cert ? `<span class="cert">${esc(cert)}</span>` : ""}
        ${genreTags(m.genres, "movie")}
      </div>
      <p class="detail-overview">${esc(m.overview || "")}</p>
      ${resume ? `<p class="detail-resume">${esc(resume)}</p>` : ""}
      <div class="detail-actions">
        <button type="button" class="btn-play" id="detail-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> ${resume ? "Resume" : "Play"}</button>
        ${trailer ? `<button class="btn-ghost" id="detail-trailer">Trailer</button>` : ""}
        <button class="btn-ghost" id="detail-save">${saved ? "✓ Saved" : "+ My List"}</button>
        <button class="btn-ghost btn-icon-text" id="detail-share">${ICONS.share}<span>Share</span></button>
      </div>`;

    LiquidGlass.glassify(header);
    $("#detail-play")?.addEventListener("click", (e) => { if (e.shiftKey) return; e.preventDefault(); scrollToSelector("#player-frame"); });
    if (trailer) $("#detail-trailer")?.addEventListener("click", () => openTrailer(trailer.key));
    $("#detail-share")?.addEventListener("click", () => sharePageLink(m.title));
    $("#detail-save")?.addEventListener("click", () => {
      openSaveModal({ id: m.id, type: "movie", title: m.title, poster: m.poster_path }, nowSaved => {
        const btn = $("#detail-save");
        if (btn) btn.textContent = nowSaved ? "✓ Saved" : "+ My List";
      });
    });

    const load = url => loadPlayerFrame(frame, url);
    renderProviders($("#provider-bar"), "movie", id, 1, 1, load);
    load(providerUrl("movie", id, 1, 1));

    const info = $("#detail-info");
    if (info) info.innerHTML = `
      <div class="info-grid">
        ${m.status ? `<div class="info-cell"><label>Status</label><span>${esc(m.status)}</span></div>` : ""}
        ${m.original_title && m.original_title !== m.title ? `<div class="info-cell"><label>Original title</label><span>${esc(m.original_title)}</span></div>` : ""}
        ${m.original_language ? `<div class="info-cell"><label>Language</label><span>${esc(m.original_language.toUpperCase())}</span></div>` : ""}
        ${m.budget ? `<div class="info-cell"><label>Budget</label><span>${fmtMoney(m.budget)}</span></div>` : ""}
        ${m.revenue ? `<div class="info-cell"><label>Box office</label><span>${fmtMoney(m.revenue)}</span></div>` : ""}
        ${m.production_companies?.[0] ? `<div class="info-cell"><label>Studio</label><span>${esc(m.production_companies[0].name)}</span></div>` : ""}
        ${m.production_countries?.[0] ? `<div class="info-cell"><label>Country</label><span>${esc(m.production_countries[0].name)}</span></div>` : ""}
        ${m.external_ids?.imdb_id ? `<div class="info-cell"><label>IMDb</label><a class="ext-link" href="https://www.imdb.com/title/${esc(m.external_ids.imdb_id)}/" target="_blank" rel="noopener">View on IMDb \u2197</a></div>` : ""}
        ${m.homepage ? `<div class="info-cell"><label>Official site</label><a class="ext-link" href="${esc(m.homepage)}" target="_blank" rel="noopener">Website \u2197</a></div>` : ""}
      </div>`;

    renderCastRow(m.credits?.cast?.slice(0, 16) || []);

    const rec = m.recommendations?.results?.slice(0, 14) || [];
    if (rec.length) {
      ensureRecommendSection();
      renderCardRow("#recommend-section", "#recommend-row", rec, "movie");
    }

    const sim = m.similar?.results?.slice(0, 14) || [];
    renderCardRow("#similar-section", "#similar-row", sim, "movie");
  } catch (e) {
    console.error(e);
    showErr("Couldn't display this title.");
    return;
  }

  tmdb(`/movie/${id}?append_to_response=keywords,watch/providers`).then(extras => {
    const anchor = $("#detail-info") || header;
    renderWatchProviders(hostAfter(anchor, "watch-providers-host"), extras["watch/providers"]);
    renderKeywords(hostAfter($("#watch-providers-host") || anchor, "keywords-host"), extras.keywords, "movie");
  }).catch(() => {});
}

async function initTvPage() {
  initSidebar("tv");
  checkPlayLoader();
  initPlayerGuard();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  let season = parseInt(params.get("season") || "1", 10);
  let episode = parseInt(params.get("episode") || "1", 10);
  const header = $("#detail-header");
  const frame = $("#player-frame");
  if (!id) { location.href = homeUrl(); return; }

  const showErr = msg => {
    if (header) header.innerHTML = `<p style="color:var(--text-muted)">${esc(msg)}</p>`;
    if (frame) frame.innerHTML = `<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.85rem">Could not load player.</p>`;
  };

  let show;
  try {
    show = await tmdb(`/tv/${id}?append_to_response=images,credits,similar,recommendations,videos,external_ids,content_ratings`);
  } catch (err) { console.warn('Caught error:', err);
    try {
      show = await tmdb(`/tv/${id}`);
    } catch (err) { console.warn('Caught error:', err);
      show = { id, name: `TV Series #${id}`, overview: "Select season and episode below to start watching.", seasons: [{ season_number: 1, episode_count: 24 }] };
    }
  }

  try {
    document.title = `${show.name} — ${BRAND}`;
    const backdropEl = $("#detail-backdrop");
    if (backdropEl && show.backdrop_path) backdropEl.style.backgroundImage = `url(${IMG_ORIG}${show.backdrop_path})`;

    const saved = MyList.has(show.id, "tv");
    const trailer = pickTrailer(show.videos);
    const cert = (show.content_ratings?.results || []).find(r => r.iso_3166_1 === "US")?.rating;
    const creators = (show.created_by || []).map(c => c.name).join(", ");
    const prog = Progress.getItem(show.id, "tv");
    const seasons = (show.seasons || []).filter(s => s.season_number >= 0);
    const seasonNums = seasons.map(s => s.season_number);
    if (seasonNums.length && !seasonNums.includes(season)) season = seasonNums[0];
    if (!Number.isFinite(episode) || episode < 1) episode = 1;
    if (prog?.season) {
      season = parseInt(prog.season, 10) || season;
      if (prog.episode) episode = parseInt(prog.episode, 10) || episode;
    }
    const resume = prog?.progress >= 5 && prog.progress < 98
      ? `Resume S${season} E${episode} · ${Math.round(prog.progress)}% watched`
      : "";

    const logos = show.images?.logos || [];
    const logoObj = logos.find(l => l.iso_639_1 === "en") || logos.find(l => !l.iso_639_1) || logos[0];
    const titleHtml = logoObj?.file_path
      ? `<div class="detail-logo-wrap"><img src="https://image.tmdb.org/t/p/w500${logoObj.file_path}" class="detail-title-logo" alt="${esc(show.name)}" /></div>`
      : `<h1 class="detail-title">${esc(show.name)}</h1>`;

    if (header) header.innerHTML = `
      ${titleHtml}
      ${show.tagline ? `<p class="detail-tagline">${esc(show.tagline)}</p>` : ""}
      <div class="detail-meta">
        ${show.vote_average ? `<span class="score">★ ${show.vote_average.toFixed(1)}</span>` : ""}
        ${show.vote_count ? `<span>${fmtVotes(show.vote_count)}</span>` : ""}
        <span>${year(show.first_air_date)}</span>
        ${show.number_of_seasons ? `<span>${show.number_of_seasons} Season${show.number_of_seasons === 1 ? '' : 's'}</span>` : ""}
        ${show.number_of_episodes ? `<span>${show.number_of_episodes} Eps</span>` : ""}
        ${cert ? `<span class="cert">${esc(cert)}</span>` : ""}
        ${genreTags(show.genres, "tv")}
      </div>
      <p class="detail-overview">${esc(show.overview || "")}</p>
      ${resume ? `<p class="detail-resume">${esc(resume)}</p>` : ""}
      <div class="detail-actions">
        <button type="button" class="btn-play" id="detail-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> ${resume ? "Resume" : "Play"}</button>
        ${trailer ? `<button class="btn-ghost" id="detail-trailer">Trailer</button>` : ""}
        <button class="btn-ghost" id="detail-save">${saved ? "✓ Saved" : "+ My List"}</button>
        <button class="btn-ghost btn-icon-text" id="detail-share">${ICONS.share}<span>Share</span></button>
      </div>`;

    LiquidGlass.glassify(header);
    $("#detail-play")?.addEventListener("click", (e) => { if (e.shiftKey) return; e.preventDefault(); scrollToSelector("#player-frame"); });
    if (trailer) $("#detail-trailer")?.addEventListener("click", () => openTrailer(trailer.key));
    $("#detail-share")?.addEventListener("click", () => sharePageLink(show.name));
    $("#detail-save")?.addEventListener("click", () => {
      openSaveModal({ id: show.id, type: "tv", title: show.name, poster: show.poster_path }, nowSaved => {
        $("#detail-save").textContent = nowSaved ? "✓ Saved" : "+ My List";
      });
    });

    const update = () => {
      loadPlayerFrame(frame, providerUrl("tv", id, season, episode));
      const u = new URL(location.href);
      u.searchParams.set("season", season);
      u.searchParams.set("episode", episode);
      history.replaceState(null, "", u);
    };

    async function loadEps(sn) {
      $("#ep-grid").innerHTML = Array.from({ length: 4 }, () => `
        <div class="ep-skel-row">
          <div class="skel-pulse" style="width:20px;height:20px;border-radius:6px"></div>
          <div class="ep-skel-thumb skel-pulse"></div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="skel-pulse" style="width:55%;height:16px"></div>
            <div class="skel-pulse" style="width:85%;height:12px"></div>
          </div>
        </div>
      `).join("");
      try {
        const sd = await tmdb(`/tv/${id}/season/${sn}`);
        $("#ep-grid").textContent = "";
        const eps = sd.episodes || [];
        if (!eps.length) {
          $("#ep-grid").innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No episodes have aired for this season yet.</div>`;
          if ($("#detail-play")) $("#detail-play").disabled = true;
          return;
        }
        if (eps.length && !eps.some(ep => ep.episode_number === episode)) episode = eps[0].episode_number;
        eps.forEach(ep => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = `ep-row${ep.episode_number === episode && sn === season ? " on" : ""}`;
          el.dataset.ep = ep.episode_number;
          const air = ep.air_date ? new Date(ep.air_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
          const dur = ep.runtime ? `${ep.runtime}m` : "";
          el.innerHTML = `
            <span class="ep-row-num">${ep.episode_number}</span>
            ${WatchedEpisodes.has(id, sn, ep.episode_number) ? '<span class="ep-watched-check" title="Watched" style="color:var(--accent);margin-left:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
            <div class="ep-row-thumb">${ep.still_path ? `<img src="${esc(IMG_W500 + ep.still_path)}" alt="${esc(ep.name || '')}" loading="lazy" draggable="false"/>` : ""}</div>
            <div class="ep-row-body">
              <div class="ep-row-title">${esc(ep.name || `Episode ${ep.episode_number}`)}</div>
              ${air ? `<div class="ep-row-date">${air}</div>` : ""}
              <div class="ep-row-desc">${esc(ep.overview || "")}</div>
            </div>
            ${dur ? `<span class="ep-row-dur">${dur}</span>` : ""}`;
          el.addEventListener("click", () => {
            season = sn; episode = ep.episode_number;
            $$(".ep-row").forEach(x => x.classList.remove("on"));
            el.classList.add("on");
            update();
            scrollToSelector("#player-frame");
          });
          $("#ep-grid").appendChild(el);
        });

        $("#ep-search-input")?.addEventListener("input", e => {
          const q = e.target.value.toLowerCase().trim();
          $$(".ep-row", $("#ep-grid")).forEach(r => {
            const titleText = r.querySelector(".ep-row-title")?.textContent.toLowerCase() || "";
            const numText = r.querySelector(".ep-row-num")?.textContent || "";
            r.style.display = (!q || titleText.includes(q) || numText.includes(q)) ? "" : "none";
          });
        });
      } catch (err) { console.warn('Caught error:', err);
        $("#ep-grid").innerHTML = `<p style="color:var(--text-muted);padding:20px;text-align:center">Episodes unavailable.</p>`;
      }
    }

    renderProviders($("#provider-bar"), "tv", id, season, episode, update);
    if (seasons.length && $("#season-select")) {
      $("#ep-block").style.display = "";
      const seasonSel = $("#season-select");
      seasonSel.textContent = "";
      seasons.forEach(s => {
        const o = document.createElement("option");
        o.value = s.season_number;
        o.textContent = `Season ${s.season_number}`;
        if (s.season_number === season) o.selected = true;
        seasonSel.appendChild(o);
      });
      await loadEps(season);
      seasonSel.addEventListener("change", () => {
        season = +seasonSel.value;
        episode = 1;
        const epInput = $("#ep-search-input");
        if (epInput) epInput.value = "";
        loadEps(season).then(update);
      });
    }

    update();

    const info = $("#detail-info");
    if (info) {
      info.innerHTML = `
        <div class="info-grid">
          ${show.status ? `<div class="info-cell"><label>Status</label><span>${esc(show.status)}</span></div>` : ""}
          ${creators ? `<div class="info-cell"><label>Created by</label><span>${esc(creators)}</span></div>` : ""}
          ${show.networks?.[0] ? `<div class="info-cell"><label>Network</label><span>${esc(show.networks[0].name)}</span></div>` : ""}
          ${show.original_language ? `<div class="info-cell"><label>Language</label><span>${esc(show.original_language.toUpperCase())}</span></div>` : ""}
          ${show.last_air_date ? `<div class="info-cell"><label>Last aired</label><span>${esc(show.last_air_date)}</span></div>` : ""}
          ${show.external_ids?.imdb_id ? `<div class="info-cell"><label>IMDb</label><a class="ext-link" href="https://www.imdb.com/title/${esc(show.external_ids.imdb_id)}/" target="_blank" rel="noopener">View on IMDb \u2197</a></div>` : ""}
          ${show.homepage ? `<div class="info-cell"><label>Official site</label><a class="ext-link" href="${esc(show.homepage)}" target="_blank" rel="noopener">Website \u2197</a></div>` : ""}
        </div>`;
    }

    renderCastRow(show.credits?.cast?.slice(0, 16) || []);

    const rec = show.recommendations?.results?.slice(0, 14) || [];
    if (rec.length) {
      ensureRecommendSection();
      renderCardRow("#recommend-section", "#recommend-row", rec, "tv");
    }

    const sim = show.similar?.results?.slice(0, 14) || [];
    renderCardRow("#similar-section", "#similar-row", sim, "tv");

    tmdb(`/tv/${id}?append_to_response=keywords,watch/providers`).then(extras => {
      const anchor = $("#detail-info") || header;
      renderWatchProviders(hostAfter(anchor, "watch-providers-host"), extras["watch/providers"]);
      renderKeywords(hostAfter($("#watch-providers-host") || anchor, "keywords-host"), extras.keywords, "tv");
    }).catch(() => {});
  } catch (e) {
    console.error(e);
    showErr("Couldn't load this show. Check your connection and try again.");
  }
}

function initSearchPage() {
  const params = new URLSearchParams(location.search);
  const filter = params.get("type") || "all";
  const genreId = params.get("genre");
  const providerId = params.get("provider");
  initSidebar(filter === "movie" ? "movies" : filter === "tv" ? "tv" : "search");

  const input = $("#main-search-input");
  const clear = $("#search-clear");
  const status = $("#search-status");
  const grid = $("#search-results");
  const recentBox = $("#search-recent");
  const chips = $$(".filter-chip");
  let current = ["movie", "tv", "ai"].includes(filter) ? filter : "all";
  let timer, lastQ = "";
  let searchPage = 1;
  let isFetchingMore = false;
  let hasMorePages = true;

  const closeInstantSearch = input ? initInstantSearch(input, () => current !== "ai") : null;

  initSurpriseMe();

  const mediaTypeSelect = $("#media-type-select");
  const aiSubmit = $("#ai-search-submit");
  const aiHelp = $("#ai-search-help");
  const filtersBar = $(".discover-filters-bar");
  mediaTypeSelect?.addEventListener("change", () => selectSearchMode(mediaTypeSelect.value));
  const aiController = window.OsirisAISearchUI && input && status && grid ? window.OsirisAISearchUI.create({
    input, status, grid,
    requestCatalog: (path, opts) => tmdb(path, 1, opts),
    renderCard: buildCard,
    hideAdult: () => SETTINGS.get(SETTINGS.hideAdultKey, "1") !== "0",
    hideWatched: () => SETTINGS.get(SETTINGS.hideWatchedKey) === "1",
    exclude: hide => hide ? Progress.getAll().filter(item => item.progress >= 95 && Number.isSafeInteger(Number(item.id)))
      .map(item => `${item.mediaType === "tv" || item.type === "tv" ? "tv" : "movie"}_${item.id}`) : [],
    onQuery: q => { input.value = q; if (clear) clear.style.display = q ? "flex" : "none"; doSearch(q); }
  }) : null;

  function setBusy(busy) {
    if (!status) return;
    status.classList.toggle("is-busy", busy);
    if (busy) status.innerHTML = `<span class="search-pending"><span class="spin-dot"></span> Searching…</span>`;
  }

  function renderRecent() {
    if (!recentBox || !input) return;
    const q = input.value.trim();
    if (current === "ai" || q || genreId) { recentBox.hidden = true; return; }
    const recent = RecentSearches.get();
    if (!recent.length) { recentBox.hidden = true; return; }
    recentBox.hidden = false;
    recentBox.innerHTML = `<p class="search-recent-label">Recent searches</p><div class="search-recent-pills">${recent.map(term =>
      `<button type="button" class="search-recent-pill" data-q="${esc(term)}">${esc(term)}</button>`
    ).join("")}</div>`;
    recentBox.querySelectorAll(".search-recent-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.q;
        if (clear) clear.style.display = "flex";
        doSearch(btn.dataset.q);
      });
    });
  }

  const syncSearchMode = () => {
    const isAI = current === "ai";
    if (mediaTypeSelect) mediaTypeSelect.value = current;
    document.body.classList.toggle("is-ai-search", isAI);
    aiController?.setEnabled(isAI);
    chips.forEach(c => { c.classList.toggle("on", c.dataset.filter === current); c.setAttribute("aria-pressed", String(c.dataset.filter === current)); });
    if (aiSubmit) aiSubmit.hidden = !isAI;
    if (aiHelp) aiHelp.hidden = !isAI;
    if (filtersBar) filtersBar.hidden = isAI;
    if (!input) return;
    input.placeholder = isAI ? "Describe a vibe, plot, era, or movies like…" : "Titles, actors, keywords…";
    input.setAttribute("aria-label", isAI ? "Describe movies or TV shows you want to watch" : "Search titles, actors, and keywords");
    if (isAI) {
      input.setAttribute("aria-describedby", "ai-search-help");
      input.setAttribute("maxlength", "1000");
    } else {
      input.removeAttribute("aria-describedby");
      input.removeAttribute("maxlength");
    }
  };
  function selectSearchMode(mode) {
    clearTimeout(timer);
    closeInstantSearch?.();
    current = ["movie", "tv", "ai"].includes(mode) ? mode : "all";
    syncSearchMode();
    doSearch(input?.value.trim() || "");
  }
  syncSearchMode();
  chips.forEach(c => c.addEventListener("click", () => selectSearchMode(c.dataset.filter)));
  aiSubmit?.addEventListener("click", () => doSearch(input?.value.trim() || ""));

  let searchAbortController = null;
  async function doSearch(q, append = false) {
    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController();
    const searchOpts = { signal: searchAbortController.signal };
    if (!status || !grid) return;
    if (!append) {
      searchPage = 1;
      hasMorePages = true;
      grid.textContent = "";
      skeletons(12).forEach(s => grid.appendChild(s));
    }
    lastQ = q;
    if (!append) {
      const url = new URL(location.href);
      if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
      if (current === "all") url.searchParams.delete("type"); else url.searchParams.set("type", current);
      history.replaceState(null, "", url);
    }
    if (current === "ai") {
      hasMorePages = false;
      if (recentBox) recentBox.hidden = true;
      if (q) RecentSearches.add(q);
      if (aiController) return aiController.search(q, searchOpts);
      status.textContent = "AI search assets are missing. Reload the page.";
      grid.textContent = "";
      return;
    }
    status.classList.remove("is-busy");

    if (recentBox) recentBox.hidden = !!q;
    if (!append && status) status.textContent = "Loading…";

    try {
      let items = [];
      if (q) {
        RecentSearches.add(q);
        let path = "/search/multi";
        if (current === "movie") path = "/search/movie";
        if (current === "tv") path = "/search/tv";
        const data = await tmdb(`${path}?query=${encodeURIComponent(q)}&page=${searchPage}`, 1, searchOpts);
        items = (data.results || []).filter(i => i.poster_path || i.backdrop_path);
        if (current !== "all") items = items.filter(i => (i.media_type || current) === current);
        if (data.page >= (data.total_pages || 1)) hasMorePages = false;
      } else {
        const g = genreId || $("#filter-genre")?.value || "";
        const gParam = (g && g !== "all") ? `&with_genres=${g}` : "";
        const pParam = providerId ? `&with_watch_providers=${providerId}&watch_region=US` : "";
        const sortVal = $("#filter-sort")?.value || "pop";
        let sortParam = "popularity.desc";
        if (sortVal === "rating") sortParam = "vote_average.desc";
        if (sortVal === "newest") sortParam = "primary_release_date.desc";

        if (current === "all") {
          const [movData, tvData] = await Promise.all([
            tmdb(`/discover/movie?sort_by=${sortParam}&vote_count.gte=30${gParam}${pParam}&page=${searchPage}`, 1, searchOpts).catch(() => ({ results: [] })),
            tmdb(`/discover/tv?sort_by=${sortParam}&vote_count.gte=30${gParam}${pParam}&page=${searchPage}`, 1, searchOpts).catch(() => ({ results: [] }))
          ]);
          const movs = (movData.results || []).map(m => ({ ...m, media_type: "movie" }));
          const tvs = (tvData.results || []).map(t => ({ ...t, media_type: "tv" }));
          items = [...movs, ...tvs];
          if ((movData.page >= (movData.total_pages || 1)) && (tvData.page >= (tvData.total_pages || 1))) hasMorePages = false;
        } else {
          const media = current === "tv" ? "tv" : "movie";
          const data = await tmdb(`/discover/${media}?sort_by=${sortParam}&vote_count.gte=30${gParam}${pParam}&page=${searchPage}`, 1, searchOpts);
          items = (data.results || []).map(i => ({ ...i, media_type: media }));
          if (data.page >= (data.total_pages || 1)) hasMorePages = false;
        }
      }

      if (searchOpts.signal.aborted) return;
      items = dedupeItems(items);

      const eraVal = $("#filter-era")?.value || "all";
      const ratingVal = $("#filter-rating")?.value || "all";
      const sortVal = $("#filter-sort")?.value || "pop";

      if (eraVal !== "all") {
        items = items.filter(it => {
          const y = parseInt(year(it.release_date || it.first_air_date), 10);
          if (!y) return false;
          if (eraVal === "2026") return y === 2026;
          if (eraVal === "2025") return y === 2025;
          if (eraVal === "2024") return y === 2024;
          if (eraVal === "2020s") return y >= 2020;
          if (eraVal === "2010s") return y >= 2010 && y <= 2019;
          if (eraVal === "classic") return y < 2010;
          return true;
        });
      }

      if (ratingVal !== "all") {
        const minRating = parseFloat(ratingVal);
        items = items.filter(it => (it.vote_average || 0) >= minRating);
      }

      if (sortVal === "rating") {
        items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (sortVal === "newest") {
        items.sort((a, b) => (b.release_date || b.first_air_date || "").localeCompare(a.release_date || a.first_air_date || ""));
      } else if (sortVal === "pop") {
        items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }

      if (!append) grid.textContent = "";

      if (!items.length && !append) {
        grid.innerHTML = `<div class="no-results"><h3>Nothing matched</h3><p>Try adjusting your search query or filters.</p></div>`;
        if (status) status.textContent = "";
        renderRecent();
        return;
      }

      const count = grid.querySelectorAll(".media-card").length + items.length;
      if (status) status.textContent = `${count} ${count === 1 ? "result" : "results"}`;

      items.forEach(item => {
        grid.appendChild(buildCard(item, item.media_type || (current === "tv" ? "tv" : "movie")));
      });
    } catch (e) {
      if (searchOpts.signal.aborted || e.name === "AbortError") return;
      if (!append) {
        grid.innerHTML = `<div class="no-results"><p>Failed to load titles. Please check your connection.</p></div>`;
        if (status) status.textContent = "";
      }
    }
  }

  // Infinite Scroll Listener
  window.addEventListener("scroll", () => {
    if (current === "ai" || isFetchingMore || !hasMorePages) return;
    const scrollPos = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 700;
    if (scrollPos >= threshold) {
      isFetchingMore = true;
      searchPage++;
      doSearch(lastQ || input?.value.trim() || "", true).finally(() => {
        isFetchingMore = false;
      });
    }
  }, { passive: true });

  ["#filter-genre", "#filter-provider", "#filter-era", "#filter-rating", "#filter-sort"].forEach(sel => {
    $(sel)?.addEventListener("change", () => doSearch(input?.value.trim() || ""));
  });

  const q = params.get("q") || "";
  if (input && !q && !genreId && !isMobile() && !isTouch()) setTimeout(() => input.focus(), 120);
  if (input) {
    input.value = q;
    if (clear) clear.style.display = q ? "flex" : "none";
    input.addEventListener("input", () => {
      if (clear) clear.style.display = input.value ? "flex" : "none";
      clearTimeout(timer);
      if (!input.value.trim()) renderRecent();
      if (current === "ai") { if (!input.value.trim()) doSearch(""); return; }
      setBusy(true);
      timer = setTimeout(() => doSearch(input.value.trim()), 400);
    });
    input.addEventListener("keydown", e => {
      if (e.key !== "Enter" || e.isComposing || current !== "ai") return;
      e.preventDefault();
      clearTimeout(timer);
      closeInstant?.();
      doSearch(input.value.trim());
    });
    doSearch(q);
  }
  clear?.addEventListener("click", () => { input.value = ""; clear.style.display = "none"; closeInstant?.(); doSearch(""); if (!isMobile() && !isTouch()) input.focus(); });
  renderRecent();
}

async function initSurpriseMe() {
  const surpriseBtn = $("#surprise-me-btn");
  if (!surpriseBtn) return;

  let modal = $("#surprise-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "surprise-modal";
    modal.innerHTML = `
      <div class="surprise-modal-box" role="dialog" aria-modal="true" aria-labelledby="surprise-title">
        <button type="button" class="modal-close" id="surprise-modal-close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        <div class="surprise-modal-header">
          <span class="surprise-badge">Surprise Picker</span>
        </div>
        <div class="surprise-reel-stage">
          <div class="surprise-reel-card">
            <div class="surprise-poster-wrap" id="surprise-poster-wrap">
              <img id="surprise-poster" src="" alt="Title Poster" style="display:none" />
            </div>
            <div class="surprise-info">
              <div class="surprise-meta-pills" id="surprise-meta-pills"></div>
              <h2 class="surprise-title" id="surprise-title">Spinning the Reel...</h2>
              <p class="surprise-overview" id="surprise-overview">Finding a top-rated title for your watchlist...</p>
            </div>
          </div>
        </div>
        <div class="surprise-modal-actions">
          <button type="button" class="btn-play" id="surprise-play-btn" style="display:none">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Now
          </button>
          <button type="button" class="btn-ghost" id="surprise-respin-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            Spin Again
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#surprise-modal-close").addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      closeModal(modal);
    });
    modal.addEventListener("click", e => {
      if (e.target === modal || !e.target.closest(".surprise-modal-box")) {
        closeModal(modal);
      }
    });
  }

  let pool = [];
  let selectedTitle = null;

  async function fetchPool() {
    if (pool.length > 5) return pool;
    try {
      const [p1, p2, p3] = await Promise.all([
        tmdb("/trending/all/day?page=1"),
        tmdb("/movie/popular?page=1"),
        tmdb("/tv/popular?page=1")
      ]);
      const raw = [
        ...(p1.results || []),
        ...(p2.results || []).map(x => ({ ...x, media_type: "movie" })),
        ...(p3.results || []).map(x => ({ ...x, media_type: "tv" }))
      ];
      pool = dedupeItems(raw.filter(x => x && x.id && x.poster_path));
    } catch (err) { console.warn('Caught error:', err);
      pool = [];
    }
    return pool;
  }

  async function spinReel() {
    if (surpriseSpinInterval) {
      clearInterval(surpriseSpinInterval);
      surpriseSpinInterval = null;
    }
    const posterWrap = $("#surprise-poster-wrap");
    const posterImg = $("#surprise-poster");
    const titleEl = $("#surprise-title");
    const overviewEl = $("#surprise-overview");
    const pillsEl = $("#surprise-meta-pills");
    const playBtn = $("#surprise-play-btn");
    const respinBtn = $("#surprise-respin-btn");

    if (playBtn) playBtn.style.display = "none";
    if (respinBtn) respinBtn.disabled = true;
    if (posterWrap) posterWrap.classList.add("spinning");

    const items = await fetchPool();
    if (!items.length) {
      if (titleEl) titleEl.textContent = "Failed to load pool";
      if (overviewEl) overviewEl.textContent = "Check your connection and try again.";
      if (respinBtn) respinBtn.disabled = false;
      if (posterWrap) posterWrap.classList.remove("spinning");
      return;
    }

    let ticks = 0;
    const maxTicks = 16;
    surpriseSpinInterval = setInterval(() => {
      if (!modal.classList.contains("open")) {
        clearInterval(surpriseSpinInterval);
        surpriseSpinInterval = null;
        return;
      }
      ticks++;
      const randomCandidate = items[Math.floor(Math.random() * items.length)];
      if (posterImg && randomCandidate.poster_path) {
        posterImg.style.display = "block";
        posterImg.src = posterUrl(randomCandidate.poster_path);
      }
      if (titleEl) titleEl.textContent = randomCandidate.title || randomCandidate.name || "Untitled";

      if (ticks >= maxTicks) {
        clearInterval(surpriseSpinInterval);
        surpriseSpinInterval = null;
        selectedTitle = items[Math.floor(Math.random() * items.length)];
        const kind = mediaType(selectedTitle, selectedTitle.media_type || "movie");
        const titleName = selectedTitle.title || selectedTitle.name || "Untitled";
        const y = year(selectedTitle.release_date || selectedTitle.first_air_date);
        const rating = Number.isFinite(selectedTitle.vote_average) ? selectedTitle.vote_average.toFixed(1) : null;

        if (posterWrap) posterWrap.classList.remove("spinning");
        if (posterImg && selectedTitle.poster_path) {
          posterImg.src = posterUrl(selectedTitle.poster_path);
        }
        if (titleEl) titleEl.textContent = titleName;
        if (overviewEl) overviewEl.textContent = selectedTitle.overview || "No overview available for this title.";

        if (pillsEl) {
          pillsEl.innerHTML = `
            ${rating ? `<span class="genre-pill" style="height:26px;padding:0 10px;font-size:0.75rem">★ ${rating}</span>` : ""}
            ${y ? `<span class="genre-pill" style="height:26px;padding:0 10px;font-size:0.75rem">${y}</span>` : ""}
            <span class="genre-pill" style="height:26px;padding:0 10px;font-size:0.75rem;text-transform:capitalize">${kind === "tv" ? "Series" : "Movie"}</span>
          `;
        }

        if (playBtn) {
          playBtn.style.display = "inline-flex";
          playBtn.onclick = () => {
            closeModal(modal);
            const targetPath = kind === "tv" ? `${routeUrl("tv")}?id=${selectedTitle.id}` : `${routeUrl("movie")}?id=${selectedTitle.id}`;
            const bg = selectedTitle.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${selectedTitle.backdrop_path}` : (posterUrl(selectedTitle.poster_path) || "");
            navigateWithLoader(targetPath, bg, titleName);
          };
        }

        if (respinBtn) respinBtn.disabled = false;
      }
    }, 85);
  }

  surpriseBtn.addEventListener("click", e => {
    e.preventDefault();
    openModal(modal);
    spinReel();
  });

  const respinBtn = modal.querySelector("#surprise-respin-btn");
  if (respinBtn) {
    respinBtn.addEventListener("click", () => spinReel());
  }
}


async function renderAccountSettingsSection() {
  const section = $("#settings-account-section");
  if (!ACCOUNTS_UI_ENABLED) {
    if (section) {
      section.hidden = true;
      section.style.display = "none";
    }
    return;
  }
  const container = $("#settings-account-container");
  if (!container) return;

  const profile = await SupabaseSync.getProfile();
  if (!profile) {
    container.innerHTML = `
      <div class="account-settings-card">
        <div style="display:flex;align-items:center;gap:14px">
          <span class="account-avatar-badge" style="width:44px;height:44px;font-size:1.2rem">?</span>
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text)">Not Signed In</div>
            <div style="font-size:0.82rem;color:var(--text-2);margin-top:2px">Sign in or create an account to sync your watchlist, progress, and settings across all devices.</div>
          </div>
        </div>
        <button type="button" class="btn-play" id="settings-open-auth" style="align-self:flex-start;margin-top:8px">Sign In / Create Account</button>
      </div>`;
    container.querySelector("#settings-open-auth")?.addEventListener("click", () => openAuthModal());
    return;
  }

  const initial = (profile.username || profile.email).charAt(0).toUpperCase();
  const stats = SupabaseSync.getStats();

  container.innerHTML = `
    <div class="account-settings-card">
      <div class="account-profile-header">
        <div class="account-avatar-wrapper" id="change-avatar-btn" title="Click to upload custom profile picture">
          ${profile.avatar_url ? `<img src="${esc(profile.avatar_url)}" alt="PFP" />` : `<span>${esc(initial)}</span>`}
          <div class="account-avatar-overlay">Change</div>
        </div>
        <input type="file" id="avatar-file-input" accept="image/*" style="display:none" />

        <div class="account-details">
          <div class="account-username-display" id="account-username-title">${esc(profile.username)}</div>
          <div class="account-email-display">${esc(profile.email)}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px;flex-wrap:wrap">
            <div class="account-sync-badge">✓ Cloud Sync Active</div>
            <button type="button" class="account-sync-trigger" id="account-manual-sync-btn">↻ Sync Now</button>
          </div>
        </div>
      </div>

      <div class="account-tabs">
        <button type="button" class="account-tab-btn active" data-atab="identity">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile & Bio</span>
        </button>
        <button type="button" class="account-tab-btn" data-atab="stats">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>Stats & Badges</span>
        </button>
        <button type="button" class="account-tab-btn" data-atab="security">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>Security</span>
        </button>
        <button type="button" class="account-tab-btn" data-atab="vault">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Data Vault</span>
        </button>
      </div>

      <!-- TAB 1: PROFILE & IDENTITY -->
      <div class="account-tab-pane active" id="atab-identity">
        <div style="display:flex;flex-direction:column;gap:14px;max-width:520px;margin-top:8px">
          <div>
            <label class="account-field-label">Display Username</label>
            <div class="account-edit-grid">
              <input type="text" id="account-username-input" value="${esc(profile.username)}" placeholder="Enter username" class="ep-search-input" />
              <button type="button" class="retry-btn" id="save-username-btn">Save Username</button>
            </div>
          </div>

          <div>
            <label class="account-field-label">Bio / Tagline</label>
            <div class="account-edit-grid">
              <input type="text" id="account-bio-input" value="${esc(profile.bio)}" placeholder="Share your favorite genres or films..." class="ep-search-input" />
              <button type="button" class="retry-btn" id="save-bio-btn">Save Bio</button>
            </div>
          </div>

          <div>
            <label class="account-field-label">Choose Avatar Preset</label>
            <div class="avatar-preset-grid">
              ${AVATAR_PRESETS.map(url => `
                <button type="button" class="avatar-preset-btn${profile.avatar_url === url ? " selected" : ""}" data-url="${esc(url)}">
                  <img src="${esc(url)}" alt="Preset Avatar" />
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: STATS & ACHIEVEMENTS -->
      <div class="account-tab-pane" id="atab-stats" style="display:none">
        <div class="account-stats-grid">
          <div class="account-stat-box">
            <div class="account-stat-val">${stats.totalTimeFormatted}</div>
            <div class="account-stat-lbl">Total Watch Time</div>
          </div>
          <div class="account-stat-box">
            <div class="account-stat-val">${stats.moviesCount}</div>
            <div class="account-stat-lbl">Movies Watched</div>
          </div>
          <div class="account-stat-box">
            <div class="account-stat-val">${stats.seriesCount}</div>
            <div class="account-stat-lbl">Series Watched</div>
          </div>
          <div class="account-stat-box">
            <div class="account-stat-val">${stats.savedCount}</div>
            <div class="account-stat-lbl">Saved Titles</div>
          </div>
        </div>

        <div style="margin-top:16px">
          <label class="account-field-label">Unlocked Badges & Achievements</label>
          <div class="badge-chips-wrap">
            ${stats.badges.map(b => `
              <div class="badge-chip" title="${esc(b.desc)}">
                <span class="badge-icon">${b.icon}</span>
                <div class="badge-info">
                  <span class="badge-name">${esc(b.name)}</span>
                  <span class="badge-desc">${esc(b.desc)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- TAB 3: SECURITY -->
      <div class="account-tab-pane" id="atab-security" style="display:none">
        <div style="display:flex;flex-direction:column;gap:14px;max-width:480px;margin-top:8px">
          <div>
            <label class="account-field-label">Change Password</label>
            <div style="display:flex;flex-direction:column;gap:8px">
              <input type="password" id="account-new-pwd" placeholder="New Password (min 6 chars)" class="ep-search-input" />
              <div id="pwd-strength-indicator" style="font-size:0.75rem;font-weight:700;color:var(--text-2)"></div>
              <button type="button" class="btn-play" id="account-change-pwd-btn">Update Password</button>
            </div>
          </div>

          <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:14px">
            <label class="account-field-label">Reset Link</label>
            <button type="button" class="btn-ghost" id="account-send-reset-btn">Send Password Reset Email</button>
          </div>

          <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:14px">
            <button type="button" class="btn-ghost" id="settings-signout-btn" style="color:#ef4444;border-color:rgba(239,68,68,0.4)">Sign Out Account</button>
          </div>
        </div>
      </div>

      <!-- TAB 4: DATA VAULT & BACKUP -->
      <div class="account-tab-pane" id="atab-vault" style="display:none">
        <div style="display:flex;flex-direction:column;gap:14px;max-width:480px;margin-top:8px">
          <div>
            <label class="account-field-label">Export Account Backup</label>
            <p style="font-size:0.82rem;color:var(--text-2);margin:0 0 8px">Save all your watchlists, progress, and settings to a JSON file.</p>
            <button type="button" class="btn-play" id="vault-export-btn">📥 Download Data Vault (JSON)</button>
          </div>

          <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:14px">
            <label class="account-field-label">Export Watch History CSV</label>
            <p style="font-size:0.82rem;color:var(--text-2);margin:0 0 8px">Download your watch progress history as a spreadsheet CSV file.</p>
            <button type="button" class="btn-ghost" id="vault-export-csv-btn">📊 Download Watch History (CSV)</button>
          </div>

          <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:14px">
            <label class="account-field-label">Import Account Backup</label>
            <p style="font-size:0.82rem;color:var(--text-2);margin:0 0 8px">Restore your watchlist and progress from a saved JSON file.</p>
            <button type="button" class="btn-ghost" id="vault-import-btn">📤 Restore Data Vault</button>
            <input type="file" id="vault-file-input" accept=".json" style="display:none" />
          </div>

          <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:14px">
            <label class="account-field-label" style="color:#ef4444">Danger Zone</label>
            <p style="font-size:0.82rem;color:var(--text-2);margin:0 0 8px">Permanently delete your profile, saved titles, progress, and account data.</p>
            <button type="button" class="btn-ghost" id="danger-delete-account-btn" style="color:#ef4444;border-color:rgba(239,68,68,0.5)">🗑️ Delete Account</button>
          </div>
        </div>
      </div>
    </div>`;

  // Attach event listeners for tabs & actions
  container.querySelectorAll(".account-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".account-tab-btn").forEach(b => b.classList.remove("active"));
      container.querySelectorAll(".account-tab-pane").forEach(p => p.style.display = "none");
      btn.classList.add("active");
      const targetPane = container.querySelector(`#atab-${btn.dataset.atab}`);
      if (targetPane) targetPane.style.display = "block";
    });
  });

  const avatarInput = container.querySelector("#avatar-file-input");
  container.querySelector("#change-avatar-btn")?.addEventListener("click", () => avatarInput?.click());

  avatarInput?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 256;
        canvas.height = 256;
        ctx.drawImage(img, 0, 0, 256, 256);
        const base64 = canvas.toDataURL("image/jpeg", 0.88);
        SupabaseSync.updateProfile({ avatar_url: base64 })
          .then(() => {
            toast("Profile picture updated!");
            renderAccountSettingsSection();
            initAuthUI();
          })
          .catch(err => toast(err.message || "Could not save profile picture."));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  container.querySelectorAll(".avatar-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      SupabaseSync.updateProfile({ avatar_url: url })
        .then(() => {
          toast("Avatar updated!");
          renderAccountSettingsSection();
          initAuthUI();
        })
        .catch(err => toast(err.message || "Failed to set avatar."));
    });
  });

  container.querySelector("#save-username-btn")?.addEventListener("click", async () => {
    const newUsername = container.querySelector("#account-username-input").value.trim();
    if (!newUsername) return;
    try {
      await SupabaseSync.updateProfile({ username: newUsername });
      toast("Username updated!");
      renderAccountSettingsSection();
      initAuthUI();
    } catch (err) {
      toast(err.message || "Failed to update username.");
    }
  });

  container.querySelector("#save-bio-btn")?.addEventListener("click", async () => {
    const newBio = container.querySelector("#account-bio-input").value.trim();
    try {
      await SupabaseSync.updateProfile({ bio: newBio });
      toast("Bio updated!");
      renderAccountSettingsSection();
    } catch (err) {
      toast(err.message || "Failed to update bio.");
    }
  });

  container.querySelector("#account-manual-sync-btn")?.addEventListener("click", async () => {
    toast("Syncing cloud data...");
    await SupabaseSync.pullFromCloud();
    toast("Cloud data synced!");
    renderAccountSettingsSection();
  });

  container.querySelector("#account-new-pwd")?.addEventListener("input", e => {
    const val = e.target.value;
    const indicator = container.querySelector("#pwd-strength-indicator");
    if (!indicator) return;
    const res = SupabaseSync.checkPasswordStrength(val);
    indicator.textContent = val ? `Strength: ${res.label}` : "";
    indicator.style.color = res.color;
  });

  container.querySelector("#account-change-pwd-btn")?.addEventListener("click", async () => {
    const pwd = container.querySelector("#account-new-pwd").value;
    if (!pwd || pwd.length < 6) {
      toast("Password must be at least 6 characters.");
      return;
    }
    try {
      await SupabaseSync.changePassword(pwd);
      toast("Password changed successfully!");
      container.querySelector("#account-new-pwd").value = "";
      if (container.querySelector("#pwd-strength-indicator")) container.querySelector("#pwd-strength-indicator").textContent = "";
    } catch (err) {
      toast(err.message || "Password update failed.");
    }
  });

  container.querySelector("#account-send-reset-btn")?.addEventListener("click", async () => {
    try {
      await SupabaseSync.resetPassword(profile.email);
      toast(`Password reset email sent to ${profile.email}`);
    } catch (err) {
      toast(err.message || "Failed to send reset email.");
    }
  });

  container.querySelector("#vault-export-btn")?.addEventListener("click", () => {
    SupabaseSync.exportBackup();
    toast("Data vault backup downloaded!");
  });

  container.querySelector("#vault-export-csv-btn")?.addEventListener("click", () => {
    SupabaseSync.exportHistoryCSV();
    toast("Watch history CSV downloaded!");
  });

  const vaultInput = container.querySelector("#vault-file-input");
  container.querySelector("#vault-import-btn")?.addEventListener("click", () => vaultInput?.click());
  vaultInput?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await SupabaseSync.importBackup(file);
      toast("Data vault restored successfully!");
      renderAccountSettingsSection();
    } catch (err) {
      toast(err.message || "Failed to import backup.");
    }
  });

  container.querySelector("#danger-delete-account-btn")?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to permanently delete your account and wipe all cloud data? This action CANNOT be undone.")) {
      try {
        await SupabaseSync.deleteAccount();
        toast("Account permanently deleted.");
        renderAccountSettingsSection();
        initAuthUI();
      } catch (err) {
        toast(err.message || "Failed to delete account.");
      }
    }
  });

  container.querySelector("#settings-signout-btn")?.addEventListener("click", async () => {
    await SupabaseSync.signOut();
    toast("Signed out");
    renderAccountSettingsSection();
    initAuthUI();
  });
}

function initSettingsPage() {
  initSidebar("settings");
  document.title = "Settings — Osiris Watch";
  renderAccountSettingsSection();

  const providerBox = $("#settings-providers");
  if (providerBox) {
    providerBox.textContent = "";
    PROVIDERS.forEach((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `settings-provider${getProvider() === p.id ? " active" : ""}`;
      btn.innerHTML = i === 0
        ? `${p.name}<span class="provider-rec" aria-label="Recommended">★</span>`
        : p.name;
      btn.addEventListener("click", () => {
        setProvider(p.id);
        providerBox.querySelectorAll(".settings-provider").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        toast(`Stream provider set to ${p.name}`);
      });
      providerBox.appendChild(btn);
    });
  }

  const accentBox = $("#settings-accents");
  if (accentBox) {
    accentBox.textContent = "";
    const cur = SETTINGS.get(SETTINGS.accentKey, ACCENT);
    ACCENT_COLORS.forEach(c => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `accent-swatch${cur === c.id ? " active" : ""}`;
      btn.style.setProperty("--swatch", `#${c.id}`);
      btn.title = c.label;
      btn.innerHTML = cur === c.id ? ICONS.check : "";
      btn.addEventListener("click", () => {
        SETTINGS.set(SETTINGS.accentKey, c.id);
        applyGlobalSettings();
        accentBox.querySelectorAll(".accent-swatch").forEach(b => { b.classList.remove("active"); b.textContent = ""; });
        btn.classList.add("active");
        btn.innerHTML = ICONS.check;
        toast(`Accent set to ${c.label}`);
      });
      accentBox.appendChild(btn);
    });
  }

  const bgStylesBox = $("#settings-backdrop-styles");
  if (bgStylesBox) {
    bgStylesBox.textContent = "";
    const curStyle = SETTINGS.get(SETTINGS.bgStyleKey, "rings") || "rings";
    BACKDROP_STYLES.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `settings-provider${curStyle === s.id ? " active" : ""}`;
      btn.dataset.bgStyle = s.id;
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        SETTINGS.set(SETTINGS.bgStyleKey, s.id);
        bgStylesBox.querySelectorAll(".settings-provider").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        syncPageBackdrop();
        toast(`Backdrop style set to ${s.label}`);
      });
      bgStylesBox.appendChild(btn);
    });
  }

  const syncAccentToggle = $("#toggle-bg-sync-accent");
  const customColorWrap = $("#settings-bg-custom-color-wrap");
  const bgColorsBox = $("#settings-bg-colors");
  const renderBgCustomSwatches = () => {
    if (!bgColorsBox) return;
    bgColorsBox.textContent = "";
    const curBgColor = SETTINGS.get(SETTINGS.bgColorKey, getAccentHex()) || getAccentHex();
    ACCENT_COLORS.forEach(c => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `accent-swatch${curBgColor === c.id ? " active" : ""}`;
      btn.style.setProperty("--swatch", `#${c.id}`);
      btn.title = c.label;
      btn.innerHTML = curBgColor === c.id ? ICONS.check : "";
      btn.addEventListener("click", () => {
        SETTINGS.set(SETTINGS.bgColorKey, c.id);
        bgColorsBox.querySelectorAll(".accent-swatch").forEach(b => { b.classList.remove("active"); b.textContent = ""; });
        btn.classList.add("active");
        btn.innerHTML = ICONS.check;
        syncPageBackdrop();
        toast(`Backdrop color set to ${c.label}`);
      });
      bgColorsBox.appendChild(btn);
    });
  };
  if (syncAccentToggle) {
    const updateSyncUI = () => {
      const on = SETTINGS.get(SETTINGS.bgSyncAccentKey, "1") !== "0";
      syncAccentToggle.classList.toggle("on", on);
      syncAccentToggle.setAttribute("aria-pressed", on ? "true" : "false");
      if (customColorWrap) customColorWrap.hidden = on;
      if (!on) renderBgCustomSwatches();
    };
    updateSyncUI();
    syncAccentToggle.addEventListener("click", () => {
      const on = SETTINGS.toggle(SETTINGS.bgSyncAccentKey);
      if (!on && !SETTINGS.get(SETTINGS.bgColorKey, "")) {
        SETTINGS.set(SETTINGS.bgColorKey, getAccentHex());
      }
      updateSyncUI();
      syncPageBackdrop();
      toast(on ? "Backdrop color locked to accent" : "Custom backdrop color enabled");
    });
  }

  const speedInput = $("#settings-bg-speed");
  const speedOutput = $("#settings-bg-speed-val");
  if (speedInput) {
    const initSpeed = parseFloat(SETTINGS.get(SETTINGS.bgSpeedKey, "0.6"));
    const sVal = Number.isFinite(initSpeed) ? initSpeed : 0.6;
    speedInput.value = String(sVal);
    if (speedOutput) speedOutput.textContent = `${sVal.toFixed(1)}x`;
    speedInput.addEventListener("input", () => {
      const v = parseFloat(speedInput.value) || 0;
      if (speedOutput) speedOutput.textContent = `${v.toFixed(1)}x`;
      SETTINGS.set(SETTINGS.bgSpeedKey, String(v));
      syncPageBackdrop();
    });
  }

  const grainInput = $("#settings-bg-grain");
  const grainOutput = $("#settings-bg-grain-val");
  if (grainInput) {
    const initGrain = parseFloat(SETTINGS.get(SETTINGS.bgGrainKey, "0"));
    const gVal = Number.isFinite(initGrain) ? initGrain : 0;
    grainInput.value = String(gVal);
    if (grainOutput) grainOutput.textContent = `${Math.round(gVal * 100)}%`;
    grainInput.addEventListener("input", () => {
      const v = parseFloat(grainInput.value) || 0;
      if (grainOutput) grainOutput.textContent = `${Math.round(v * 100)}%`;
      SETTINGS.set(SETTINGS.bgGrainKey, String(v));
      syncPageBackdrop();
    });
  }

  syncPageBackdrop();

  const themeBox = $("#settings-theme");
  if (themeBox) {
    const curTheme = SETTINGS.get(SETTINGS.themeKey, "dark") === "light" ? "light" : "dark";
    themeBox.querySelectorAll(".theme-opt").forEach(b => {
      b.classList.toggle("active", b.dataset.themeVal === curTheme);
      b.addEventListener("click", () => {
        SETTINGS.set(SETTINGS.themeKey, b.dataset.themeVal);
        applyGlobalSettings();
        themeBox.querySelectorAll(".theme-opt").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        toast(`Theme set to ${b.textContent.trim()}`);
      });
    });
  }

  const bindToggle = (id, key, label, defaultOn = "0") => {
    const el = $(id);
    if (!el) return;
    const sync = () => {
      const on = SETTINGS.get(key, defaultOn) === "1";
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    };
    sync();
    el.addEventListener("click", () => {
      const on = SETTINGS.toggle(key);
      sync();
      applyGlobalSettings();
      if (key === SETTINGS.reduceMotionKey) {
        if (on) clearInterval(heroTimer);
        else startHeroTimer();
      }
      toast(`${label} ${on ? "enabled" : "disabled"}`);
    });
  };

  bindToggle("#toggle-reduce-motion", SETTINGS.reduceMotionKey, "Reduce motion");
  bindToggle("#toggle-hide-watched", SETTINGS.hideWatchedKey, "Hide watched");
  bindToggle("#toggle-hide-adult", SETTINGS.hideAdultKey, "Hide adult content", "1");
  bindToggle("#toggle-autoplay-trailers", SETTINGS.autoplayTrailersKey, "Auto-play trailers");
  bindToggle("#toggle-grid-backdrop", SETTINGS.layoutKey, "Landscape Card View");

  const langSel = $("#settings-pref-lang");
  if (langSel) {
    langSel.value = SETTINGS.get(SETTINGS.prefLangKey, "en");
    langSel.addEventListener("change", e => {
      SETTINGS.set(SETTINGS.prefLangKey, e.target.value);
      toast(`Preferred language updated`);
    });
  }

  $("#clear-progress")?.addEventListener("click", () => {
    safeRemoveItem(Progress.key);
    toast("Continue watching cleared");
  });
  $("#clear-list")?.addEventListener("click", () => {
    safeRemoveItem(MyList.key);
    toast("My List cleared");
  });
  $("#reset-splash")?.addEventListener("click", () => {
    sessionStorage.removeItem("orc_splash");
    toast("Intro will show on next home visit");
  });
}

async function initListPage() {
  initSidebar("list");
  document.title = "My Lists - Osiris Watch";
  const grid = $("#list-grid");
  const status = $("#list-status");
  const wlCount = $("#watchlist-count");
  if (!grid) return;

  const rawList = MyList.get();
  if (wlCount) wlCount.textContent = rawList.length;

  const emptyState = (msg, submsg) => {
    grid.innerHTML = `<div class="no-results list-empty"><div class="list-empty-ico">${ICONS.list}</div><h3>${msg}</h3><p>${submsg}</p></div>`;
    if (status) status.textContent = "";
  };

  let loadedItems = [];
  let historyItems = [];
  let currentTab = "watchlist";
  let currentType = "all";
  let currentSort = "recent";
  let currentFolderId = null;

  const loadData = async () => {
    if (currentTab === "watchlist") {
      if (!rawList.length) { emptyState("Your watchlist is empty", "Add movies and series using the + icon on their cards."); return; }
      grid.textContent = ""; skeletons(Math.min(rawList.length, 12)).forEach(s => grid.appendChild(s));
      const settled = await Promise.allSettled(rawList.map(i =>
        tmdb(i.type === "tv" ? `/tv/${i.id}` : `/movie/${i.id}`).then(d => ({ ...d, _type: i.type }))
      ));
      loadedItems = dedupeItems(settled.filter(r => r.status === "fulfilled").map(r => r.value));
      renderListGrid();
    } else if (currentTab === "history") {
      const prog = Progress.get();
      const progList = Object.values(prog || {})
        .filter(i => i && (i.id || i.mediaId))
        .sort((a, b) => (b.savedAt || b.lastUpdated || 0) - (a.savedAt || a.lastUpdated || 0));
      if (!progList.length) { emptyState("No watch history", "Start watching titles and they will appear here."); return; }
      grid.textContent = ""; skeletons(Math.min(progList.length, 12)).forEach(s => grid.appendChild(s));
      const settled = await Promise.allSettled(progList.map(i => {
        const mType = (i.mediaType || i.type) === "tv" ? "tv" : "movie";
        const mId = i.id || i.mediaId;
        return tmdb(`/${mType}/${mId}`).then(d => ({ ...d, _type: mType, _progress: i.progress }));
      }));
      historyItems = dedupeItems(settled.filter(r => r.status === "fulfilled").map(r => r.value));
      renderListGrid();
    } else if (currentTab === "folders") {
      const fList = Folders.get();
      if (!fList.length) { emptyState("No folders yet", "Create custom collections to organize your favorite titles."); return; }
      grid.textContent = "";
      if (status) status.textContent = `${fList.length} ${fList.length === 1 ? "folder" : "folders"}`;
      fList.forEach(f => {
        const c = document.createElement("div");
        c.className = "folder-card";
        c.style = "background:var(--bg-2);border-radius:12px;padding:24px;cursor:pointer;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform 0.2s, background 0.2s;box-shadow:0 4px 12px rgba(0,0,0,0.1)";
        c.onmouseover = () => { c.style.background = "var(--bg-3)"; c.style.transform = "scale(1.02)"; };
        c.onmouseout = () => { c.style.background = "var(--bg-2)"; c.style.transform = "scale(1)"; };
        c.innerHTML = `
          <div style="color:var(--accent);margin-bottom:12px">${ICONS.list}</div>
          <h3 style="font-size:1.1rem;margin-bottom:4px;color:var(--text)">${esc(f.name)}</h3>
          <p style="font-size:0.85rem;color:var(--text-2)">${f.items.length} ${f.items.length === 1 ? "item" : "items"}</p>
        `;
        c.addEventListener("click", () => {
          currentFolderId = f.id;
          currentTab = "folder_items";
          loadData();
        });
        grid.appendChild(c);
      });
    } else if (currentTab === "folder_items") {
      const fList = Folders.get();
      const folder = fList.find(f => f.id === currentFolderId);
      if (!folder) { currentTab = "folders"; return loadData(); }
      
      const backBtn = document.createElement("button");
      backBtn.className = "btn-play";
      backBtn.style = "margin-bottom:20px;background:var(--bg-2);color:var(--text)";
      backBtn.innerHTML = "← Back to Folders";
      backBtn.onclick = () => { currentTab = "folders"; currentFolderId = null; loadData(); };

      if (!folder.items.length) { 
        emptyState(`Folder: ${esc(folder.name)}`, "This folder is empty."); 
        grid.prepend(backBtn);
        return; 
      }

      grid.textContent = ""; 
      grid.appendChild(backBtn);
      
      const wrapper = document.createElement("div");
      wrapper.style.display = "contents";
      skeletons(Math.min(folder.items.length, 12)).forEach(s => wrapper.appendChild(s));
      grid.appendChild(wrapper);

      const settled = await Promise.allSettled(folder.items.map(i =>
        tmdb(i.type === "tv" ? `/tv/${i.id}` : `/movie/${i.id}`).then(d => ({ ...d, _type: i.type }))
      ));
      loadedItems = dedupeItems(settled.filter(r => r.status === "fulfilled").map(r => r.value));
      
      wrapper.remove();
      renderListGrid(backBtn);
    }
  };

  const renderListGrid = (prependedEl = null) => {
    if (currentTab === "folders") return;
    
    let items = currentTab === "history" ? [...historyItems] : [...loadedItems];
    if (currentType === "movie" || currentType === "tv") {
      items = items.filter(it => (it._type || (it.title ? "movie" : "tv")) === currentType);
    }

    if (currentSort === "rating") {
      items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (currentSort === "title") {
      items.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    } else if (currentSort === "release") {
      items.sort((a, b) => ((b.release_date || b.first_air_date || "")).localeCompare(a.release_date || a.first_air_date || ""));
    }

    if (status && currentTab !== "folder_items") status.textContent = `${items.length} ${items.length === 1 ? "title" : "titles"}`;
    else if (status && currentTab === "folder_items") {
      const folder = Folders.get().find(f => f.id === currentFolderId);
      status.textContent = folder ? `Folder: ${folder.name} (${items.length})` : "";
    }
    
    grid.textContent = "";
    if (prependedEl) grid.appendChild(prependedEl);

    if (!items.length) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "no-results";
      emptyDiv.innerHTML = `<h3>No titles match filter</h3><p>Try switching filters.</p>`;
      grid.appendChild(emptyDiv);
      return;
    }
    items.forEach(it => {
      const card = buildCard(it, it._type === "tv" ? "tv" : "movie");
      if (currentTab === "history" && it._progress) {
        const pbar = document.createElement("div");
        pbar.className = "card-progress-bar";
        pbar.innerHTML = `<div class="card-progress-fill" style="width:${Math.min(it._progress, 100)}%"></div>`;
        card.appendChild(pbar);
      }
      grid.appendChild(card);
    });
  };

  const tabs = $$(".list-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab;
      loadData();
    });
  });

  const filterRow = $("#list-filter-chips");
  if (filterRow) {
    filterRow.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.dataset.type === "recent") {
           currentSort = currentSort === "recent" ? "release" : "recent";
           chip.classList.toggle("on", currentSort === "release");
           renderListGrid();
           return;
        }
        filterRow.querySelectorAll(".filter-chip:not([data-type='recent'])").forEach(c => c.classList.remove("on"));
        chip.classList.add("on");
        currentType = chip.dataset.type || "all";
        renderListGrid();
      });
    });
  }

  const newFolderBtn = $("#btn-new-folder");
  if (newFolderBtn) {
    newFolderBtn.addEventListener("click", () => {
      let modal = $("#folder-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "folder-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
          <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="folder-modal-title" style="width:min(380px,92vw);padding:24px;border-radius:20px;background:var(--bg-1);border:1px solid var(--border-2)">
            <h2 id="folder-modal-title" style="margin:0 0 14px;font-size:1.25rem;font-weight:800">Create New Folder</h2>
            <input type="text" id="folder-name-input" placeholder="e.g. Anime, Sci-Fi, Weekend Watch" style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--border-2);background:var(--bg-2);color:var(--text);font-size:0.95rem;outline:none" />
            <div style="display:flex;gap:10px;margin-top:18px;justify-content:flex-end">
              <button type="button" class="btn-ghost" id="folder-cancel" style="padding:10px 18px">Cancel</button>
              <button type="button" class="btn-play" id="folder-create" style="padding:10px 20px">Create</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
        modal.querySelector("#folder-cancel").addEventListener("click", () => closeModal(modal));
        const submitFolder = () => {
          const inp = modal.querySelector("#folder-name-input");
          const val = inp.value.trim();
          if (val) {
            Folders.addFolder(val);
            toast(`Folder "${val}" created`);
            if (currentTab === "folders") loadData();
          }
          closeModal(modal);
        };
        modal.querySelector("#folder-create").addEventListener("click", submitFolder);
        modal.querySelector("#folder-name-input").addEventListener("keydown", e => {
          if (e.key === "Enter") { e.preventDefault(); submitFolder(); }
        });
      }
      modal.querySelector("#folder-name-input").value = "";
      openModal(modal);
      if (!isMobile() && !isTouch()) {
        setTimeout(() => modal.querySelector("#folder-name-input")?.focus(), 60);
      }
    });
  }

  loadData();
}

function initDmcaPage() {
  initSidebar("home");
  document.title = "DMCA — Osiris Watch";
}

function playLoader(bg, title, opts = {}) {
  if (prefersReducedMotion()) return Promise.resolve();
  const instant = !!opts.instant;
  const hold = opts.hold ?? 480;
  return new Promise(resolve => {
    let el = document.getElementById("play-loader-live");
    if (!el) {
      el = document.createElement("div");
      el.id = "play-loader-live";
      el.className = "play-loader";
      el.innerHTML = `<div class="play-loader-bg"></div><div class="play-loader-veil"></div><div class="play-loader-mark">OSIRIS WATCH</div>`;
      document.body.appendChild(el);
    }
    const bgEl = el.querySelector(".play-loader-bg");
    if (bgEl && bg) bgEl.style.backgroundImage = `url(${esc(bg)})`;
    if (instant) {
      el.classList.add("on", "instant");
    } else {
      el.classList.remove("instant", "is-leaving");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("on"));
      });
    }
    setTimeout(() => {
      el.classList.add("is-leaving");
      el.classList.remove("on");
      setTimeout(() => {
        el.remove();
        resolve();
      }, 320);
    }, hold);
  });
}

function navigateWithLoader(href, bg, title) {
  if (window.NProgress) NProgress.start();
  location.href = href;
}

const NProgress = {
  el: null,
  init() {
    if (this.el) return;
    this.el = document.createElement("div");
    this.el.id = "nprogress";
    this.el.innerHTML = '<div class="bar"></div>';
    document.body.appendChild(this.el);
  },
  start() {
    this.init();
    const bar = this.el.querySelector(".bar");
    this.el.classList.add("busy");
    bar.style.width = "0%";
    requestAnimationFrame(() => { bar.style.width = "65%"; });
  },
  done() {
    if (!this.el) return;
    const bar = this.el.querySelector(".bar");
    bar.style.width = "100%";
    setTimeout(() => {
      this.el.classList.remove("busy");
      bar.style.width = "0%";
    }, 280);
  },
};

document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
  try {
    const dest = new URL(a.href, location.origin);
    if (dest.origin !== location.origin) return;
    if (dest.href === location.href) return;
    if (dest.pathname === location.pathname && dest.search === location.search) return;
    NProgress.start();
  } catch (err) { console.warn('Caught error:', err); }
});
window.addEventListener("pageshow", () => NProgress.done());

function initPullRefresh() {
  if (!isTouch()) return;
  let startY = 0;
  let pulling = false;
  const indicator = document.createElement("div");
  indicator.className = "ptr-indicator";
  indicator.textContent = "Release to refresh";
  indicator.hidden = true;
  document.body.appendChild(indicator);

  document.addEventListener("touchstart", e => {
    if (window.scrollY > 8) return;
    startY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 40 && window.scrollY <= 0) {
      indicator.hidden = false;
      indicator.style.opacity = String(Math.min(1, dy / 120));
    } else indicator.hidden = true;
  }, { passive: true });
  document.addEventListener("touchend", e => {
    if (!pulling) return;
    pulling = false;
    const dy = e.changedTouches[0].clientY - startY;
    indicator.hidden = true;
    if (window.scrollY <= 8 && dy > 100) location.reload();
  }, { passive: true });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(reg => reg.update()).catch(() => {});
}

const WatchPartyEngine = {
  channel: null,
  roomId: null,
  activeCount: 1,

  init(roomId, mediaType, mediaId, onRemoteStateChange) {
    if (!roomId) return;
    this.roomId = roomId;
    const client = getSupabaseClient();
    if (!client || !client.channel) return;

    try {
      this.channel = client.channel(`watch-party-${roomId}`, {
        config: { broadcast: { self: false } }
      });

      this.channel
        .on("broadcast", { event: "SYNC_PLAYBACK" }, ({ payload }) => {
          if (onRemoteStateChange) onRemoteStateChange(payload);
        })
        .on("presence", { event: "sync" }, () => {
          const state = this.channel.presenceState();
          this.activeCount = Object.keys(state).length || 1;
          const badge = $("#party-active-count");
          if (badge) badge.textContent = `${this.activeCount} Members Live`;
        })
        .subscribe(async status => {
          if (status === "SUBSCRIBED") {
            await this.channel.track({ online_at: new Date().toISOString() });
            toast(`Joined Watch Party Room: ${roomId}`);
          }
        });
    } catch (err) { console.warn('Caught error:', err); }
  },

  broadcastState(state) {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: "broadcast",
        event: "SYNC_PLAYBACK",
        payload: { ...state, timestamp: Date.now() }
      });
    } catch (err) { console.warn('Caught error:', err); }
  }
};

function openWatchPartyModal(title, mediaId, mediaType) {
  const params = new URLSearchParams(location.search);
  let roomId = params.get("room");
  if (!roomId) {
    roomId = "OSIRIS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  const partyUrl = new URL(routeUrl(mediaType === "tv" ? "tv" : "movie", new URLSearchParams({ id: mediaId || "", room: roomId })), window.location.origin).href;

  let modal = $("#party-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "party-modal";
    modal.innerHTML = `
      <div class="modal-box glass-surface" style="max-width:460px;padding:24px;aspect-ratio:auto;border-radius:16px">
        <button type="button" class="modal-close" id="party-close" aria-label="Close">✕</button>
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px;color:#fff">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Real-Time Watch Party Room
        </h2>
        <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:16px">Share this link with friends to watch <strong id="party-media-title" style="color:#fff"></strong> in live synchronized stream!</p>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <input type="text" id="party-url-input" readonly class="ep-search-input" style="font-family:monospace;font-size:0.82rem" />
          <button type="button" class="btn-play" id="party-copy-btn">Copy Link</button>
        </div>
        <div style="font-size:0.78rem;color:#10b981;font-weight:700;display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block"></span>
          <span id="party-active-count">1 Member Active</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#party-close").addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
  }
  modal.querySelector("#party-media-title").textContent = title || "Title";
  modal.querySelector("#party-url-input").value = partyUrl;
  modal.querySelector("#party-copy-btn").onclick = () => {
    navigator.clipboard.writeText(partyUrl).then(() => toast("Watch Party link copied to clipboard!"));
  };

  WatchPartyEngine.init(roomId, mediaType, mediaId, payload => {
    if (payload.provider) setProvider(payload.provider);
    toast("Synced with Watch Party host!");
  });

  openModal(modal);
}

function openKeyboardShortcutsModal() {
  let modal = $("#shortcuts-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "shortcuts-modal";
    modal.innerHTML = `
      <div class="modal-box glass-surface" style="max-width:440px;padding:24px;aspect-ratio:auto;border-radius:16px">
        <button type="button" class="modal-close" id="shortcuts-close" aria-label="Close">✕</button>
        <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:8px;color:#fff">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
          Keyboard Shortcuts
        </h2>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:0.85rem">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-2)">Focus Search Input</span>
            <kbd class="shortcut-key">/</kbd>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-2)">Keyboard Shortcuts Cheat Sheet</span>
            <kbd class="shortcut-key">?</kbd>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-2)">Close Modals & Player</span>
            <kbd class="shortcut-key">ESC</kbd>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
            <span style="color:var(--text-2)">Surprise Me Reel</span>
            <kbd class="shortcut-key">R</kbd>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#shortcuts-close").addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
  }
  openModal(modal);
}

function initGlobalShortcuts() {
  if (window.__orcShortcutsBound) return;
  window.__orcShortcutsBound = true;
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal();
      closeTrailer();
      closePersonModal();
      closePopup();
      $(".instant-search-dropdown").forEach(d => d.remove());
      return;
    }
    const tag = document.activeElement?.tagName?.toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || document.activeElement?.isContentEditable) return;
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const s = $("#main-search-input") || $("#search-input") || $(".ep-search-input");
      if (s) {
        if (!isMobile()) { s.focus(); s.select?.(); }
      } else {
        location.href = routeUrl("search");
      }
    } else if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openKeyboardShortcutsModal();
    }
  });
}

function checkPlayLoader() {
  const d = sessionStorage.getItem("orc_loader");
  if (!d) return Promise.resolve();
  sessionStorage.removeItem("orc_loader");
  try { const { bg, title } = JSON.parse(d); return playLoader(bg, title); } catch { return Promise.resolve(); }
}

document.addEventListener("DOMContentLoaded", () => {
  PAGE = detectPage();
  try {
    document.documentElement.lang = "en";
    LiquidGlass.init();
    applyGlobalSettings();
    injectGlassFilters();
    initGlassFilter();
    NProgress.done();
    initAnchorScroll();
    initGlobalShortcuts();
    initBackToTop();
    initPullRefresh();
    registerServiceWorker();
    switch (PAGE) {
      case "home": initHomePage().catch(e => console.error(e)); break;
      case "movie": initMoviePage().catch(e => console.error(e)); break;
      case "tv": initTvPage().catch(e => console.error(e)); break;
      case "search": initSearchPage(); break;
      case "list": initListPage(); break;
      case "settings": initSettingsPage(); break;
      case "dmca": initDmcaPage(); break;
    }
  } catch (e) {
    console.error("Osiris Watch init failed:", e);
    const header = $("#detail-header");
    if (header) header.innerHTML = `<p style="color:var(--text-muted)">Something went wrong loading this page. Try refreshing.</p>`;
  }
});
