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
  { id: "cinesrc", name: "CineSrc (Recommended)", tracksProgress: false,
    movie: id => `https://cinesrc.st/embed/movie/${id}?color=%23${ACCENT}&autoplay=true`,
    tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&color=%23${ACCENT}&autoplay=true` },
  { id: "vidking", name: "VidKing", tracksProgress: true,
    movie: id => `https://www.vidking.net/embed/movie/${id}?color=${ACCENT}&autoPlay=true`,
    tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=${ACCENT}&autoPlay=true&nextEpisode=true&episodeSelector=true` },
  { id: "vidsrc", name: "VidSrc", tracksProgress: false,
    movie: id => `https://vidsrc-embed.ru/embed/movie/${id}?autoplay=1`,
    tv: (id, s, e) => `https://vidsrc-embed.ru/embed/tv/${id}/${s}/${e}?autoplay=1` },
  { id: "vidsrc2", name: "VidSrc 2", tracksProgress: false,
    movie: id => `https://vidsrc-embed.su/embed/movie/${id}?autoplay=1`,
    tv: (id, s, e) => `https://vidsrc-embed.su/embed/tv/${id}/${s}/${e}?autoplay=1` },
  { id: "111movies", name: "111Movies", tracksProgress: false,
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
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
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
        <div class="notif-empty-state"><span class="spin-dot"></span> Checking watchlist…</div>
      </div>
    `;
    document.body.appendChild(popover);
  }

  let notifsLoaded = false;
  async function loadWatchlistEpisodes() {
    if (notifsLoaded) return;
    notifsLoaded = true;
    const body = $("#notif-popover-body");
    if (!body) return;
    const tvShows = MyList.get().filter(it => it.type === "tv" || it.media_type === "tv");
    if (!tvShows.length) {
      body.innerHTML = `<div class="notif-empty-state">No TV shows in your watchlist yet.</div>`;
      return;
    }

    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recent = [];

    await Promise.allSettled(tvShows.slice(0, 10).map(async show => {
      try {
        const d = await tmdb(`/tv/${show.id}`);
        const lastEp = d.last_episode_to_air;
        if (lastEp && lastEp.air_date) {
          const airTime = new Date(lastEp.air_date + "T00:00:00").getTime();
          if (airTime >= weekAgo && airTime <= now + 86400000) {
            recent.push({ show, ep: lastEp });
          }
        }
      } catch {}
    }));

    if (!recent.length) {
      body.innerHTML = `<div class="notif-empty-state">No new episodes this week</div>`;
      return;
    }

    body.innerHTML = recent.map(({ show, ep }) => `
      <a href="${routeUrl("tv")}?id=${show.id}&season=${ep.season_number}&episode=${ep.episode_number}" class="notif-item">
        <div class="notif-thumb">${show.poster_path ? `<img src="${esc(IMG_W300 + show.poster_path)}" alt="${esc(show.title || '')}" />` : ""}</div>
        <div class="notif-info">
          <div class="notif-title">${esc(show.title || show.name || "Series")}</div>
          <div class="notif-ep">S${ep.season_number} E${ep.episode_number} · ${esc(ep.name || 'New Episode')}</div>
          <div class="notif-date">${ep.air_date}</div>
        </div>
      </a>
    `).join("");
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
    if (popover.classList.contains("is-open")) loadWatchlistEpisodes();
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
        console.warn('Storage quota exceeded. Clearing persistent TMDB cache.');
        try { localStorage.removeItem(TMDB_STORAGE_KEY); } catch {}
        try { sessionStorage.removeItem(TMDB_STORAGE_KEY); } catch {}
        try {
          localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
        } catch (retryErr) {
          toast("Storage full: could not save data.");
          return false;
        }
      } else {
        throw e;
      }
    }
    return true;
  } catch (err) {
    console.warn('Caught storage error:', err);
    toast("Storage unavailable: could not save data.");
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

const TMDB_CACHE_MAX = 90;
const TMDB_CACHE_TTL = 15 * 60 * 1000;
const TMDB_STORAGE_KEY = "orc_tmdb_cache_v2";
const _tmdbCache = new Map();
const _tmdbPersisted = new Map();
let _tmdbSaveTimer = null;

(function hydratePersistentTmdbCache() {
  try {
    const rawCache = sessionStorage.getItem(TMDB_STORAGE_KEY);
    if (!rawCache) return;
    const parsed = JSON.parse(rawCache);
    const now = Date.now();
    if (Array.isArray(parsed)) {
      for (const [k, v] of parsed) {
        if (v && v.data && typeof v.time === "number" && (now - v.time < TMDB_CACHE_TTL)) {
          _tmdbPersisted.set(k, v);
          _tmdbCache.set(k, { req: Promise.resolve(v.data), time: v.time, data: v.data });
        }
      }
    }
  } catch {}
})();

function scheduleSaveTmdbCache() {
  if (_tmdbSaveTimer) return;
  _tmdbSaveTimer = setTimeout(() => {
    _tmdbSaveTimer = null;
    try {
      const entries = Array.from(_tmdbPersisted.entries()).slice(-65);
      sessionStorage.setItem(TMDB_STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, 250);
}

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
    const prefLang = SETTINGS.get(SETTINGS.prefLangKey, "en");
    if (prefLang && !finalPath.includes("language=")) {
      const pSep = finalPath.includes("?") ? "&" : "?";
      finalPath = `${finalPath}${pSep}language=${encodeURIComponent(prefLang)}`;
    }
    // Edge-cached serverless proxy. Falls back to the direct call only when the
    // function is missing or unreachable; real TMDB errors are not retried twice.
    if (!opts.signal && !window._tmdbProxyOff) {
      try {
        const proxyRes = await fetch(`/api/tmdb?path=${encodeURIComponent(finalPath)}`);
        if (proxyRes.headers.get("x-osiris-proxy") === "1" && proxyRes.status < 500) {
          if (proxyRes.status === 429) { toast("TMDB Rate limit exceeded. Please wait a moment."); throw new Error("TMDB Rate Limit 429"); }
          if (!proxyRes.ok) throw new Error(`TMDB ${proxyRes.status}`);
          const proxied = await proxyRes.json();
          if (proxied) {
            if (_tmdbPersisted.size >= 65) {
              const oldK = _tmdbPersisted.keys().next().value;
              if (oldK) _tmdbPersisted.delete(oldK);
            }
            _tmdbPersisted.set(path, { data: proxied, time: Date.now() });
            scheduleSaveTmdbCache();
          }
          return proxied;
        }
        if (proxyRes.status === 404 || proxyRes.status === 405 || proxyRes.status === 503) window._tmdbProxyOff = true;
      } catch (proxyErr) {
        if (/^TMDB/.test(proxyErr.message)) throw proxyErr;
      }
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
        const data = await res.json();
        if (!opts.signal && data) {
          if (_tmdbPersisted.size >= 65) {
            const oldK = _tmdbPersisted.keys().next().value;
            if (oldK) _tmdbPersisted.delete(oldK);
          }
          _tmdbPersisted.set(path, { data, time: Date.now() });
          scheduleSaveTmdbCache();
        }
        return data;
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
const IMG_W185 = "https://image.tmdb.org/t/p/w185";
const IMG_W300 = "https://image.tmdb.org/t/p/w300";

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
    d.innerHTML = `${a.profile_path ? `<img src="${esc(IMG_W185 + a.profile_path)}" alt="${esc(a.name || '')}" loading="lazy" decoding="async" draggable="false"/>` : `<div class="cast-placeholder"></div>`}<div class="name" title="${esc(a.name)}">${esc(a.name)}</div><div class="role" title="${esc(a.character || "")}">${esc(a.character || "")}</div>`;
    const prewarmPerson = () => { if (a.id) tmdb(`/person/${a.id}?append_to_response=combined_credits`).catch(() => {}); };
    d.addEventListener("mouseenter", prewarmPerson, { passive: true, once: true });
    d.addEventListener("touchstart", prewarmPerson, { passive: true, once: true });
    d.addEventListener("click", () => openPersonModal(a.id, a));
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
function ensureRecommendSection(seedTitle = "", isWatched = false) {
  let sec = $("#recommend-section");
  const prefixText = isWatched ? "Since you watched" : "If you watched";
  if (!sec) {
    sec = document.createElement("section");
    sec.id = "recommend-section";
    sec.style.display = "none";
    sec.innerHTML = `
      <div class="section-head syw-detail-head" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="syw-prefix" id="detail-syw-prefix">${prefixText}</span>
        <span class="syw-seed-name" id="detail-syw-name">${esc(seedTitle || "this title")}</span>
        <span class="syw-ai-badge">AI</span>
      </div>
      <div class="similar-row" id="recommend-row"></div>`;
    $("#similar-section")?.before(sec);
  } else {
    const prefEl = sec.querySelector("#detail-syw-prefix") || sec.querySelector(".syw-prefix");
    if (prefEl) prefEl.textContent = prefixText;
    if (seedTitle) {
      const nameEl = sec.querySelector("#detail-syw-name");
      if (nameEl) nameEl.textContent = seedTitle;
    }
  }
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
async function openPersonModal(id, seedActor = null) {
  let modal = $("#person-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "person-modal";
    modal.className = "modal-overlay person-modal";
    modal.innerHTML = `<button class="modal-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="modal-box"></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").addEventListener("click", closePersonModal);
    modal.addEventListener("click", e => { if (e.target === modal) closePersonModal(); });
  }
  const box = modal.querySelector(".modal-box");
  box.innerHTML = `
    <div class="person-head">
      ${seedActor?.profile_path ? `<img src="${esc(IMG_W185 + seedActor.profile_path)}" alt="${esc(seedActor.name || '')}"/>` : `<div class="person-ph skel-pulse"></div>`}
      <div style="flex:1">
        <h2>${seedActor?.name ? esc(seedActor.name) : '<span class="skel-pulse" style="display:inline-block;width:140px;height:20px;border-radius:6px"></span>'}</h2>
        <p><span class="skel-pulse" style="display:inline-block;width:100px;height:12px;border-radius:4px"></span></p>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      <div class="skel-pulse" style="width:100%;height:12px;border-radius:4px"></div>
      <div class="skel-pulse" style="width:88%;height:12px;border-radius:4px"></div>
    </div>`;
  modal.classList.add("open");
  trapModalFocus(modal, "Cast member");
  try {
    const p = await tmdb(`/person/${id}?append_to_response=combined_credits`);
    const credits = (p.combined_credits?.cast || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12);
    box.innerHTML = `
      <div class="person-head">
        ${p.profile_path ? `<img src="${esc(IMG_W185 + p.profile_path)}" alt="${esc(p.name || '')}"/>` : `<div class="person-ph"></div>`}
        <div>
          <h2>${esc(p.name)}</h2>
          <p>${esc(p.known_for_department || "")}${p.place_of_birth ? ` · ${esc(p.place_of_birth)}` : ""}</p>
        </div>
      </div>
      ${p.biography ? `<p style="font-size:0.82rem;color:var(--text-muted);line-height:1.55;margin-bottom:16px">${esc(p.biography.slice(0, 280))}${p.biography.length > 280 ? "…" : ""}</p>` : ""}
      <div class="person-credits">
        <h3>Known for</h3>
        <div class="person-credit-list">${credits.map((c, idx) => {
          const kind = c.media_type === "tv" ? "tv" : "movie";
          const href = kind === "tv" ? `${routeUrl("tv")}?id=${c.id}` : `${routeUrl("movie")}?id=${c.id}`;
          const title = c.title || c.name || "Untitled";
          return `<a href="${href}" data-credit-idx="${idx}"><span>${esc(title)}</span><span>${year(c.release_date || c.first_air_date)}</span></a>`;
        }).join("")}</div>
      </div>`;
    box.querySelectorAll("a[data-credit-idx]").forEach(a => {
      const c = credits[Number(a.dataset.creditIdx)];
      if (!c) return;
      const kind = c.media_type === "tv" ? "tv" : "movie";
      const href = a.getAttribute("href");
      const title = c.title || c.name || "Untitled";
      a.addEventListener("click", e => {
        if (e.ctrlKey || e.metaKey || e.button === 1 || e.shiftKey) return;
        e.preventDefault();
        closePersonModal();
        const bg = c.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${c.backdrop_path}` : (posterUrl(c.poster_path) || "");
        navigateWithLoader(href, bg, title, { id: c.id, type: kind, item: c });
      });
    });
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
  const rawStyle = SETTINGS.get(SETTINGS.bgStyleKey, "flow") || "flow";
  const validStyle = BACKDROP_STYLES.some(s => s.id === rawStyle) ? rawStyle : "rings";
  const isLight = SETTINGS.get(SETTINGS.themeKey, "dark") === "light";
  const baseHex = getBackdropBaseHex();
  const rawSpeed = parseFloat(SETTINGS.get(SETTINGS.bgSpeedKey, "0.1"));
  const speed = Number.isFinite(rawSpeed) ? Math.max(0, Math.min(2, rawSpeed)) : 0.6;
  const rawGrain = parseFloat(SETTINGS.get(SETTINGS.bgGrainKey, "0.22"));
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
  const liteBackdropOff = typeof isLiteMode === "function" && isLiteMode();
  if (cfg.style === "none" || liteBackdropOff || typeof window.GradientBackdrop === "undefined") {
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
      ...(isMobile() ? { maxPixels: 4.5e5 } : {}),
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
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-forms allow-top-navigation-by-user-activation");
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


function updateWatchlistBadge() {
  const count = MyList.get().length;
  const wlCountEl = $("#watchlist-count");
  if (wlCountEl) wlCountEl.textContent = count;
  renderHomeMyListRow();
}

function renderHomeMyListRow() {
  const mlRow = $(".my-list-wrapper");
  if (!mlRow) return;
  const list = MyList.get();
  const mlTrack = mlRow.querySelector(".row-track");
  if (!mlTrack) return;
  if (!list.length) {
    mlRow.remove();
    return;
  }
  mlTrack.textContent = "";
  list.slice(0, 20).forEach(it => {
    mlTrack.appendChild(buildCard(it, it.type || "movie", { eager: true }));
  });
}

const MyList = {
  key: "orc_mylist",
  get() { try { return JSON.parse(safeGetItem(this.key) || "[]"); } catch { return []; } },
  has(id, t) { return this.get().some(i => String(i.id) === String(id) && i.type === t); },
  save(list) {
    safeSetItem(this.key, JSON.stringify(list));
    idbSet(this.key, list);
    if (typeof updateWatchlistBadge === "function") updateWatchlistBadge();
  },
  toggle(item) {
    const list = this.get();
    const i = list.findIndex(x => String(x.id) === String(item.id) && x.type === item.type);
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
  renameFolder(id, newName) {
    const list = this.get();
    const f = list.find(x => x.id === id);
    if (f) {
      f.name = newName.trim();
      this.save(list);
    }
  },
  removeItem(folderId, itemId, itemType) {
    const list = this.get();
    const folder = list.find(f => f.id === folderId);
    if (!folder) return;
    folder.items = (folder.items || []).filter(x => !(String(x.id) === String(itemId) && x.type === itemType));
    this.save(list);
  },
  toggleItem(folderId, item) {
    const list = this.get();
    const folder = list.find(f => f.id === folderId);
    if (!folder) return;
    const i = (folder.items || []).findIndex(x => String(x.id) === String(item.id) && x.type === item.type);
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
  remove(id, type) {
    const all = this.get();
    delete all[`${type}_${id}`];
    this.saveAll(all);
  },
};

const RecentViewed = {
  key: "orc_recent_viewed",
  max: 12,
  get() {
    try { return JSON.parse(safeGetItem(this.key) || "[]"); } catch { return []; }
  },
  add(item, type = "movie") {
    if (!item || !item.id) return;
    const mediaType = type === "tv" ? "tv" : "movie";
    const title = (item.title || item.name || "").trim();
    if (!title) return;
    const entry = {
      id: Number(item.id) || item.id,
      mediaType,
      title,
      poster_path: item.poster_path || item.poster || "",
      backdrop_path: item.backdrop_path || "",
      release_date: item.release_date || item.first_air_date || "",
      vote_average: item.vote_average || 0,
      viewedAt: Date.now()
    };
    const existing = this.get().filter(x => !(String(x.id) === String(entry.id) && x.mediaType === mediaType));
    safeSetItem(this.key, JSON.stringify([entry, ...existing].slice(0, this.max)));
  }
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
    { href: routeUrl("list"), label: "My List", icon: ICONS.bookmark, key: "list" },
    { href: routeUrl("settings"), label: "Settings", icon: ICONS.settings, key: "settings" },
  ];

  const nav = existing || document.createElement("nav");
  nav.id = "mobile-pill-nav";
  nav.className = "mobile-pill-nav";
  nav.setAttribute("aria-label", "Primary");

  nav.innerHTML = items.map(it => `
    <a href="${it.href}" data-nav-key="${it.key}" class="pill-nav-item${active === it.key ? " active" : ""}" aria-label="${it.label}"${active === it.key ? ' aria-current="page"' : ""}>
      <span class="pill-nav-ico">${it.icon}</span>
      <span class="pill-nav-label">${it.label}</span>
    </a>
  `).join("");

  nav.querySelectorAll(".pill-nav-item").forEach(a => {
    const key = a.dataset.navKey;
    const prewarm = () => prewarmNavKey(key);
    a.addEventListener("touchstart", prewarm, { passive: true, once: true });
    a.addEventListener("mouseenter", prewarm, { passive: true, once: true });
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

  window.addEventListener("pagehide", () => {
    try { sessionStorage.setItem(pageKey, String(window.scrollY)); } catch (err) { console.warn('Caught error:', err); }
  });

  window.addEventListener("pageshow", e => {
    const navEntries = performance.getEntriesByType("navigation");
    const isBackForward = e.persisted || (navEntries.length > 0 && navEntries[0].type === "back_forward") ||
      (window.performance && window.performance.navigation && window.performance.navigation.type === 2);

    if (!isBackForward) return;

    const savedY = sessionStorage.getItem(pageKey);
    if (!savedY || isNaN(savedY)) return;
    const y = parseInt(savedY, 10);
    if (y <= 0) return;

    let attempts = 0;
    const waitForContentThenScroll = () => {
      attempts++;
      const hasContent = document.querySelector(".media-card, .ep-row, .detail-actions, .list-grid, .search-grid .media-card");
      if (hasContent || attempts > 25) {
        window.scrollTo({ top: y, behavior: "auto" });
      } else {
        setTimeout(waitForContentThenScroll, 50);
      }
    };
    waitForContentThenScroll();
  });
}

function prewarmNavKey(key) {
  if (key === "search") {
    tmdb("/discover/movie?sort_by=popularity.desc&vote_count.gte=30&page=1").catch(() => {});
    tmdb("/discover/tv?sort_by=popularity.desc&vote_count.gte=30&page=1").catch(() => {});
  } else if (key === "home") {
    tmdb("/trending/all/week").catch(() => {});
    tmdb("/trending/all/day").catch(() => {});
  }
}

function setMetaTags({ title, description, image, url } = {}) {
  if (title) {
    document.title = `${title} — ${BRAND}`;
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", `${title} — ${BRAND}`);
  }
  if (description) {
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement("meta");
      descMeta.setAttribute("name", "description");
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute("content", description);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description);
  }
  if (image) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement("meta");
      ogImg.setAttribute("property", "og:image");
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute("content", image);
  }
  if (url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", url);
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", url);
  }
}

function initSidebar(active) {
  const el = $("#topnav") || $("#sidebar");
  if (!el) return;

  const link = (href, label, act) =>
    `<a href="${href}" class="topnav-link${act ? " active" : ""}">${label}</a>`;

  const existingNav = el.querySelector(".topnav-links");
  if (!existingNav) {
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
  } else {
    el.querySelectorAll(".topnav-link").forEach(a => {
      const href = a.getAttribute("href") || "";
      let isAct = false;
      if (active === "home" && (href === "/" || href.endsWith("index.html") || href === homeUrl())) isAct = true;
      else if ((active === "search" || active === "movies" || active === "tv") && href.includes("search")) isAct = true;
      else if (active === "list" && href.includes("list")) isAct = true;
      else if (active === "settings" && href.includes("settings")) isAct = true;
      a.classList.toggle("active", isAct);
    });
    el.querySelectorAll(".topnav-actions .topnav-icon").forEach(a => {
      if (a.getAttribute("href")?.includes("search")) {
        a.classList.toggle("active", active === "search");
      }
    });
  }

  initAuthUI();
  initNotificationDropdown();

  const burger = el.querySelector(".topnav-burger");
  burger?.addEventListener("click", e => {
    e.stopPropagation();
    const open = el.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  el.querySelectorAll(".topnav-link").forEach(a => {
    const href = a.getAttribute("href") || "";
    const key = href.includes("search") ? "search" : href === homeUrl() ? "home" : "";
    if (key) {
      const prewarm = () => prewarmNavKey(key);
      a.addEventListener("mouseenter", prewarm, { passive: true, once: true });
      a.addEventListener("touchstart", prewarm, { passive: true, once: true });
    }
    a.addEventListener("click", () => el.classList.remove("nav-open"));
  });
  document.addEventListener("click", e => {
    if (el.classList.contains("nav-open") && !el.contains(e.target)) el.classList.remove("nav-open");
  });

  if (!el._scrollBound) {
    el._scrollBound = true;
    let lastScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
    let travel = 0;
    let scrollRaf = null;

    const updateScrollNav = () => {
      scrollRaf = null;
      const currentY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      el.classList.toggle("scrolled", currentY > 12);

      if (!isMobile()) {
        el.classList.remove("nav-hidden");
        travel = 0;
        return;
      }
      if (currentY <= 24) {
        travel = 0;
        el.classList.remove("nav-hidden");
        return;
      }
      if (delta === 0) return;
      // accumulate travel in one direction so slow drags and momentum both count
      travel = (delta > 0) === (travel > 0) ? travel + delta : delta;
      if (travel > 14) el.classList.add("nav-hidden");
      else if (travel < -8) el.classList.remove("nav-hidden");
    };

    const queueScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(updateScrollNav);
    };

    window.addEventListener("scroll", queueScroll, { passive: true });
    queueScroll();
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

  const card = document.createElement("div");
  card.className = `media-card${watched && SETTINGS.get(SETTINGS.hideWatchedKey) === "1" ? " is-watched" : ""}`;
  const aiRec = item._aiRec || null;
  card.innerHTML = `
    <a class="card-link" href="${href}" aria-label="${esc(title)}">
      ${opts.rank && opts.top10Today ? `<span class="top10-today-card-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>${opts.rank}</span>` : opts.rank ? `<span class="rank">${opts.rank}</span>` : ""}
      ${prog && prog > 2 ? `<span class="progress-badge">${Math.round(prog)}%</span>` : aiRec?.matchPct ? `<span class="card-ai-badge">${aiRec.rankedByAI ? "AI · " : ""}${aiRec.matchPct}% Match</span>` : ""}
      ${!opts.rank && (!prog || prog <= 2) && Number.isFinite(item.vote_average) && item.vote_average >= 6 ? `<span class="card-rating">★ ${(typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "")}</span>` : ""}
      ${img ? `<img class="card-img" src="${esc(img)}" alt="${esc(title)}" loading="${opts.eager ? "eager" : "lazy"}"${opts.eager ? ' fetchpriority="high"' : ""} draggable="false" decoding="async" />` : `<div class="no-img-poster">${ICONS.film}<span>${esc(title)}</span></div>`}
      ${prog ? `<div class="progress-bar"><span style="width:${Math.min(prog, 100)}%"></span></div>` : ""}
      <div class="card-foot">
        <div class="card-foot-title">${esc(title)}</div>
        <div class="card-foot-meta">${y ? `${y} · ` : ""}${kind === "tv" ? "Series" : "Movie"}</div>
        ${aiRec?.reason ? `<div class="card-foot-ai-reason">${esc(aiRec.reason)}</div>` : ""}
      </div>
    </a>
    <div class="card-quick">
      <button type="button" class="card-icon-btn save-btn${saved ? " saved" : ""}" aria-label="Save ${esc(title)}" aria-pressed="${saved ? "true" : "false"}">${saved ? ICONS.check : ICONS.plus}</button>
    </div>`;

  const cardImgEl = card.querySelector("img.card-img");
  if (cardImgEl) {
    if (cardImgEl.complete && cardImgEl.naturalWidth > 0) {
      cardImgEl.classList.add("is-loaded");
    } else {
      cardImgEl.addEventListener("load", () => cardImgEl.classList.add("is-loaded"), { once: true });
      cardImgEl.addEventListener("error", () => cardImgEl.classList.add("is-loaded"), { once: true });
    }
  }

  let _prefetched = false;
  const prefetchDetail = () => {
    if (_prefetched || !id) return;
    _prefetched = true;
    const detailQuery = kind === "tv"
      ? `/tv/${id}?append_to_response=images,credits,similar,recommendations,videos,external_ids,content_ratings`
      : `/movie/${id}?append_to_response=images,credits,similar,videos,recommendations,external_ids,release_dates`;
    tmdb(detailQuery).catch(() => {});
    if (item.backdrop_path) {
      const preImg = new Image();
      preImg.src = `${IMG_W780}${item.backdrop_path}`;
    }
  };

  let hoverTimer = null;
  card.addEventListener("mouseenter", () => {
    hoverTimer = setTimeout(prefetchDetail, 300);
  }, { passive: true });
  card.addEventListener("mouseleave", () => {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
  }, { passive: true });
  card.addEventListener("touchstart", prefetchDetail, { passive: true, once: true });

  card.addEventListener("click", e => {
    if (e.target.closest(".save-btn") || e.target.closest(".cw-remove-btn")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.shiftKey) return;
    e.preventDefault();
    const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
    navigateWithLoader(href, bg, title, { id, type: kind, item });
  });

  card.addEventListener("keydown", e => {
    if (e.target.closest(".save-btn")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
      navigateWithLoader(href, bg, title, { id, type: kind, item });
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
      prefetchDetail();
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
      ${item._aiRec?.reason ? `<div class="card-popup-ai-reason"><strong>${item._aiRec.matchPct ? `${item._aiRec.matchPct}% AI Match: ` : "AI Match: "}</strong>${esc(item._aiRec.reason)}</div>` : ""}
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

  pop.querySelector(".pp-play").addEventListener("click", () => {
    closePopup();
    const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
    navigateWithLoader(href, bg, title, { id, type: kind, item });
  });
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
try {
  const savedAmbient = sessionStorage.getItem("orc_ambient_cache_v1");
  if (savedAmbient) Object.assign(heroAmbientColorCache, JSON.parse(savedAmbient));
} catch {}

function toSmallSampleUrl(imgUrl) {
  if (!imgUrl) return "";
  return imgUrl.replace("/original/", "/w342/").replace("/w1280/", "/w342/").replace("/w780/", "/w342/").replace("/w500/", "/w342/");
}

function extractHeroAmbientColors(imgUrl) {
  if (!imgUrl) return Promise.resolve(null);
  const sampleUrl = toSmallSampleUrl(imgUrl);
  if (heroAmbientColorCache[sampleUrl]) return Promise.resolve(heroAmbientColorCache[sampleUrl]);

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const w = 96;
        const h = 54;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        function sampleRegion(startX, endX) {
          const regionH = 12;
          const data = ctx.getImageData(startX, h - regionH, endX - startX, regionH).data;
          let bestColor = null;
          let maxVibrance = -1;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          let satSum = 0;

          for (let i = 0; i < data.length; i += 4) {
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
          if (avgSat < 0.08 && maxVibrance < 0.35) return null;

          const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
          let r = bestColor ? Math.round(bestColor[0] * 0.85 + avgR * 0.15) : Math.round(avgR);
          let g = bestColor ? Math.round(bestColor[1] * 0.85 + avgG * 0.15) : Math.round(avgG);
          let b = bestColor ? Math.round(bestColor[2] * 0.85 + avgB * 0.15) : Math.round(avgB);

          const avg = (r + g + b) / 3;
          r = Math.min(255, Math.max(0, Math.round(r + (r - avg) * 0.85)));
          g = Math.min(255, Math.max(0, Math.round(g + (g - avg) * 0.85)));
          b = Math.min(255, Math.max(0, Math.round(b + (b - avg) * 0.85)));

          return [r, g, b];
        }

        const step = Math.floor(w / 3);
        const left = sampleRegion(0, step);
        const center = sampleRegion(step, step * 2);
        const right = sampleRegion(step * 2, w);

        const fallback = [40, 58, 105];
        const result = {
          left: left || center || right || fallback,
          center: center || left || right || fallback,
          right: right || center || left || fallback
        };

        heroAmbientColorCache[sampleUrl] = result;
        heroAmbientColorCache[imgUrl] = result;
        try {
          sessionStorage.setItem("orc_ambient_cache_v1", JSON.stringify(heroAmbientColorCache));
        } catch {}
        resolve(result);
      } catch (err) {
        const fallback = [40, 58, 105];
        resolve({ left: fallback, center: fallback, right: fallback });
      }
    };
    img.onerror = () => {
      const fallback = [40, 58, 105];
      resolve({ left: fallback, center: fallback, right: fallback });
    };
    img.src = sampleUrl;
  });
}

let _bleedSlot = 0;

function buildBleedGradient(left, center, right) {
  const lStr = `${left[0]},${left[1]},${left[2]}`;
  const cStr = `${center[0]},${center[1]},${center[2]}`;
  const rStr = `${right[0]},${right[1]},${right[2]}`;
  return `
    radial-gradient(ellipse 68% 92% at 12% 0%, rgba(${lStr},0.52) 0%, transparent 70%),
    radial-gradient(ellipse 68% 92% at 88% 0%, rgba(${rStr},0.52) 0%, transparent 70%),
    radial-gradient(ellipse 88% 78% at 50% 0%, rgba(${cStr},0.42) 0%, transparent 82%)
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
        colors = { left: [40,58,105], center: [40,58,105], right: [40,58,105] };
      }

      next.style.background = buildBleedGradient(colors.left, colors.center, colors.right);
      void next.offsetWidth;
      next.style.opacity = "1";
      cur.style.opacity  = "0";
      _bleedSlot++;
      resolve();
    });
  });
}

function applyDetailBackdrop(backdropPath) {
  const backdropEl = $("#detail-backdrop");
  if (!backdropEl || !backdropPath) return;
  const fastUrl = `${IMG_W780}${backdropPath}`;
  const fullUrl = isMobile() ? fastUrl : `${IMG_ORIG}${backdropPath}`;

  applyHeroColorBleed(fastUrl);

  const fastImg = new Image();
  fastImg.onload = () => {
    backdropEl.style.backgroundImage = `url(${fastUrl})`;
    backdropEl.classList.add("is-loaded");
    if (fullUrl !== fastUrl) {
      const hiImg = new Image();
      hiImg.onload = () => {
        backdropEl.style.backgroundImage = `url(${fullUrl})`;
      };
      hiImg.src = fullUrl;
    }
  };
  fastImg.onerror = () => {
    backdropEl.style.backgroundImage = `url(${fullUrl})`;
    backdropEl.classList.add("is-loaded");
  };
  fastImg.src = fastUrl;
  if (fastImg.complete) {
    backdropEl.style.backgroundImage = `url(${fastUrl})`;
    backdropEl.classList.add("is-loaded");
  }
}

function swapHeroBackdrop(url) {
  return new Promise(resolve => {
    const a = $("#hero-backdrop-a");
    const b = $("#hero-backdrop-b");
    if (!url || !a || !b) { resolve(); return; }

    const fastUrl = url.replace("/original/", "/w780/");
    applyHeroColorBleed(fastUrl);
    const next = heroImgSlot % 2 === 0 ? b : a;
    const cur = heroImgSlot % 2 === 0 ? a : b;

    let swapped = false;
    const finishSwap = () => {
      if (swapped) return;
      swapped = true;
      cur.classList.remove("is-active");
      next.classList.add("is-active");
      heroImgSlot++;
      resolve();
      if (!isMobile() && fastUrl !== url) {
        const hi = new Image();
        hi.onload = () => {
          if (next.classList.contains("is-active")) next.src = url;
        };
        hi.src = url;
      }
    };

    if ((next.src === fastUrl || next.src === url) && next.classList.contains("is-active")) {
      resolve();
      return;
    }
    next.onload = finishSwap;
    next.onerror = finishSwap;
    next.src = fastUrl;
    if (next.complete && next.naturalWidth > 0) finishSwap();
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

let heroUserPaused = false;
let heroHovered = false;

function startHeroTimer() {
  if (heroUserPaused || heroHovered || prefersReducedMotion() || heroSlides.length < 2) return;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHeroSlide((heroIndex + 1) % heroSlides.length, true), HERO_INTERVAL);
}

function stopHeroTimer() {
  clearInterval(heroTimer);
}

function initHeroPauseControls() {
  const pauseBtn = $("#hero-pause-btn");
  if (!pauseBtn) return;
  const updateBtn = () => {
    pauseBtn.setAttribute("aria-label", heroUserPaused ? "Play carousel" : "Pause carousel");
    pauseBtn.setAttribute("title", heroUserPaused ? "Play carousel" : "Pause carousel");
    const pauseIco = pauseBtn.querySelector(".icon-pause");
    const playIco = pauseBtn.querySelector(".icon-play");
    if (pauseIco) pauseIco.style.display = heroUserPaused ? "none" : "block";
    if (playIco) playIco.style.display = heroUserPaused ? "block" : "none";
  };
  pauseBtn.addEventListener("click", () => {
    heroUserPaused = !heroUserPaused;
    if (heroUserPaused) stopHeroTimer();
    else startHeroTimer();
    updateBtn();
  });
  updateBtn();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopHeroTimer();
  } else if (!heroUserPaused && !heroHovered) {
    startHeroTimer();
  initHeroPauseControls();
  const heroSection = $(".hero");
  if (heroSection && !heroSection._focusBound) {
    heroSection._focusBound = true;
    heroSection.addEventListener("focusin", () => stopHeroTimer());
    heroSection.addEventListener("focusout", () => { if (!heroUserPaused && !heroHovered && !document.hidden) startHeroTimer(); });
    heroSection.addEventListener("mouseenter", () => { heroHovered = true; stopHeroTimer(); });
    heroSection.addEventListener("mouseleave", () => { heroHovered = false; if (!heroUserPaused && !document.hidden) startHeroTimer(); });
  }
  }
});

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
  initHeroPauseControls();
  const heroSection = $(".hero");
  if (heroSection && !heroSection._focusBound) {
    heroSection._focusBound = true;
    heroSection.addEventListener("focusin", () => stopHeroTimer());
    heroSection.addEventListener("focusout", () => { if (!heroUserPaused && !heroHovered && !document.hidden) startHeroTimer(); });
    heroSection.addEventListener("mouseenter", () => { heroHovered = true; stopHeroTimer(); });
    heroSection.addEventListener("mouseleave", () => { heroHovered = false; if (!heroUserPaused && !document.hidden) startHeroTimer(); });
  }
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
    await new Promise(r => setTimeout(r, 170));
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
    pImg.src = `${IMG_W780}${nextSlide.backdrop_path}`;
    const nextType = mediaType(nextSlide);
    const nextKey = `${nextType}_${nextSlide.id}`;
    if (!heroDetailCache[nextKey]) {
      tmdb(`/${nextType}/${nextSlide.id}?append_to_response=images,videos`).then(d => { heroDetailCache[nextKey] = d; }).catch(() => {});
    }
  }
}

function initHeroCarousel(slides) {
  if (!slides.length) return;
  heroSlides = slides;
  buildHeroDots();
  loadHero(slides[0]);
  startHeroTimer();
  initHeroPauseControls();
  const heroSection = $(".hero");
  if (heroSection && !heroSection._focusBound) {
    heroSection._focusBound = true;
    heroSection.addEventListener("focusin", () => stopHeroTimer());
    heroSection.addEventListener("focusout", () => { if (!heroUserPaused && !heroHovered && !document.hidden) startHeroTimer(); });
    heroSection.addEventListener("mouseenter", () => { heroHovered = true; stopHeroTimer(); });
    heroSection.addEventListener("mouseleave", () => { heroHovered = false; if (!heroUserPaused && !document.hidden) startHeroTimer(); });
  }
  slides.slice(1, 3).forEach(s => {
    if (s.backdrop_path) {
      const pre = new Image();
      pre.src = `${IMG_W780}${s.backdrop_path}`;
    }
    const st = mediaType(s);
    const sk = `${st}_${s.id}`;
    if (!heroDetailCache[sk]) {
      tmdb(`/${st}/${s.id}?append_to_response=images,videos`).then(d => { heroDetailCache[sk] = d; }).catch(() => {});
    }
  });
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

  if ($("#hero-type")) $("#hero-type").textContent = realType === "tv" ? "Series" : "Film";
  if ($("#hero-desc")) $("#hero-desc").textContent = item.overview || "";
  const cacheKey = `${realType}_${id}`;
  if (!heroDetailCache[cacheKey] && $("#hero-title")) {
    $("#hero-title").textContent = title;
  }

  swapHeroBackdrop(backdrop);

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
    navigateWithLoader(href, backdrop, title, { id: heroData.id, type, item: heroData });
  });
  $("#hero-info-btn")?.addEventListener("click", () => {
    if (!heroData) return;
    const type = mediaType(heroData);
    const href = type === "tv" ? `${routeUrl("tv")}?id=${heroData.id}` : `${routeUrl("movie")}?id=${heroData.id}`;
    const backdrop = heroData.backdrop_path ? `${IMG_ORIG}${heroData.backdrop_path}` : "";
    const title = heroData.title || heroData.name || "";
    navigateWithLoader(href, backdrop, title, { id: heroData.id, type, item: heroData });
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
    const href = `${routeUrl("tv")}?id=${s.id}`;
    card.href = href;
    const go = e => {
      if (e && (e.ctrlKey || e.metaKey || e.button === 1 || e.shiftKey)) return;
      if (e) e.preventDefault();
      navigateWithLoader(href, img || "", s.name || s.title || "", { id: s.id, type: "tv", item: s });
    };
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

        dropdown.innerHTML = hits.map((item, idx) => {
          const type = item.media_type === "tv" ? "tv" : "movie";
          const title = item.title || item.name || "";
          const img = item.poster_path ? `${IMG_W185}${item.poster_path}` : "";
          const y = year(item.release_date || item.first_air_date);
          const link = `/${type}?id=${item.id}`;
          return `
            <a href="${link}" class="instant-search-item" data-hit-idx="${idx}">
              <img src="${esc(img)}" class="instant-search-poster" alt="${esc(item.title || item.name || '')}" loading="eager" decoding="async" />
              <div>
                <div class="instant-search-title">${esc(title)}</div>
                <div class="instant-search-sub">${type === "tv" ? "TV Series" : "Movie"}${y ? " · " + y : ""}</div>
              </div>
            </a>
          `;
        }).join("");
        const topHit = hits[0];
        if (topHit?.id) {
          const topType = topHit.media_type === "tv" ? "tv" : "movie";
          tmdb(`/${topType}/${topHit.id}?append_to_response=images,credits,similar,recommendations,videos,external_ids,${topType === "tv" ? "content_ratings" : "release_dates"}`).catch(() => {});
        }
        dropdown.querySelectorAll(".instant-search-item").forEach(a => {
          const item = hits[Number(a.dataset.hitIdx)];
          if (!item) return;
          const type = item.media_type === "tv" ? "tv" : "movie";
          const title = item.title || item.name || "";
          const link = a.getAttribute("href");
          a.addEventListener("click", e => {
            if (e.ctrlKey || e.metaKey || e.button === 1 || e.shiftKey) return;
            e.preventDefault();
            closeDropdown();
            const bg = item.backdrop_path ? `${isMobile() ? IMG_W780 : IMG_ORIG}${item.backdrop_path}` : (posterUrl(item.poster_path) || "");
            navigateWithLoader(link, bg, title, { id: item.id, type, item });
          });
        });
      } catch (err) { console.warn('Caught error:', err); closeDropdown(); }
    }, 140);
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

  const validItems = items.filter(it => it && (it.id || it.mediaId) && it.progress > 1 && it.progress < 95);
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
      const cardEl = buildCard(d, type, { progressValue: progress });
      const quick = cardEl.querySelector(".card-quick");
      if (quick) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "card-icon-btn cw-remove-btn";
        removeBtn.setAttribute("aria-label", "Remove from Continue Watching");
        removeBtn.title = "Remove from Continue Watching";
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        removeBtn.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          Progress.remove(d.id, type);
          cardEl.remove();
          if (!track.querySelector(".media-card")) {
            wrap.remove();
          }
          toast("Removed from Continue Watching");
        });
        quick.appendChild(removeBtn);
      }
      track.appendChild(cardEl);
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
  initHeroPauseControls();
  const heroSection = $(".hero");
  if (heroSection && !heroSection._focusBound) {
    heroSection._focusBound = true;
    heroSection.addEventListener("focusin", () => stopHeroTimer());
    heroSection.addEventListener("focusout", () => { if (!heroUserPaused && !heroHovered && !document.hidden) startHeroTimer(); });
    heroSection.addEventListener("mouseenter", () => { heroHovered = true; stopHeroTimer(); });
    heroSection.addEventListener("mouseleave", () => { heroHovered = false; if (!heroUserPaused && !document.hidden) startHeroTimer(); });
  }
    }
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
}

function resumeLabel(progressObj) {
  if (!progressObj || progressObj.progress < 5 || progressObj.progress >= 98) return "";
  if (progressObj.season && progressObj.episode && (progressObj.mediaType === "tv" || progressObj.type === "tv")) {
    return `Resume S${progressObj.season} E${progressObj.episode} · ${Math.round(progressObj.progress)}% watched`;
  }
  return `Resume · ${Math.round(progressObj.progress)}% watched`;
}

const AIRecommendations = (() => {
  const CACHE_PREFIX = "orc_ai_syw_v2_";
  const STOP_TOKENS = new Set("a an and are as at be but by can could do for from good have his her him i in into is it its like me movie movies of on one or our out over please recommend series she show shows some something that the their them then there these they this through to tv up upon want was watch watched we were what when where which while who whom why will with would you your".split(" "));

  function tokenizeText(str) {
    if (!str) return [];
    return String(str)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_TOKENS.has(w));
  }

  async function collectSeeds() {
    const map = new Map();
    const addSeed = (id, type, title, poster, yearStr, sourceLabel, watched = false) => {
      if (!id) return;
      const cleanType = type === "tv" ? "tv" : "movie";
      const key = `${cleanType}_${id}`;
      if (map.has(key)) return;
      map.set(key, {
        id: Number(id) || id,
        type: cleanType,
        title: (title || "").trim(),
        poster: poster || "",
        year: yearStr ? String(yearStr).slice(0, 4) : "",
        sourceLabel,
        watched: Boolean(watched)
      });
    };

    // 1. Genuinely Watched / In-Progress items from watch history
    Progress.getAll().forEach(p => {
      const id = p.id || p.mediaId;
      if (!id) return;
      const type = (p.mediaType || p.type) === "tv" ? "tv" : "movie";
      addSeed(id, type, p.title || p.name || "", p.poster_path || p.poster || "", p.release_date || p.first_air_date || "", "Watched", true);
    });

    const hasWatchedSeeds = map.size > 0;

    // 2. Saved Watchlist & Folder items (unwatched unless already in Progress)
    MyList.get().forEach(m => {
      addSeed(m.id, m.type, m.title, m.poster || m.poster_path, "", "Saved", false);
    });
    Folders.get().forEach(f => {
      (f.items || []).forEach(it => {
        addSeed(it.id, it.type, it.title, it.poster || it.poster_path, "", "Saved", false);
      });
    });

    // 3. Recently viewed detail pages (unwatched unless already in Progress)
    RecentViewed.get().forEach(v => {
      addSeed(v.id, v.mediaType, v.title, v.poster_path, v.release_date, "Viewed", false);
    });

    let seeds = [...map.values()];
    if (hasWatchedSeeds) {
      const watchedOnly = seeds.filter(s => s.watched);
      const others = seeds.filter(s => !s.watched);
      seeds = [...watchedOnly, ...others].slice(0, 10);
    } else {
      seeds = seeds.slice(0, 10);
    }

    // Hydrate any seed missing its title or poster from TMDB cache/network
    if (seeds.length) {
      await Promise.allSettled(seeds.map(async s => {
        if (s.title && s.poster) return;
        try {
          const d = await tmdb(`/${s.type}/${s.id}`);
          if (d) {
            s.title = d.title || d.name || s.title;
            s.poster = d.poster_path || s.poster;
            s.year = String(d.release_date || d.first_air_date || "").slice(0, 4);
          }
        } catch {}
      }));
      seeds = seeds.filter(s => s.title);
    }

    // 4. Cold-start fallback if user has zero history/watchlist yet
    if (!seeds.length) {
      try {
        const trend = await tmdb("/trending/all/day");
        (trend?.results || [])
          .filter(it => (it.media_type === "movie" || it.media_type === "tv") && (it.title || it.name) && it.poster_path)
          .slice(0, 6)
          .forEach(it => {
            addSeed(it.id, it.media_type, it.title || it.name, it.poster_path, it.release_date || it.first_air_date, "Popular", false);
          });
        seeds = [...map.values()].slice(0, 6);
      } catch {}
    }

    return seeds;
  }

  async function generateForSeed(seed, opts = {}) {
    const type = seed.type === "tv" ? "tv" : "movie";
    const id = seed.id;
    const cacheKey = `${CACHE_PREFIX}${type}_${id}`;

    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw && !opts.forceRefresh) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length >= 6 && Date.now() - (parsed.ts || 0) < 30 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {}

    // Stage 1: Deep Seed Profiling
    let detail = opts.seedDetail || null;
    if (!detail || !detail.keywords || !detail.credits) {
      try {
        detail = await tmdb(`/${type}/${id}?append_to_response=keywords,credits,recommendations,similar`);
      } catch {
        detail = detail || { id, title: seed.title, name: seed.title };
      }
    }

    const seedTitle = detail.title || detail.name || seed.title || "this title";
    const seedYear = Number(String(detail.release_date || detail.first_air_date || seed.year || "").slice(0, 4)) || null;
    const seedGenres = (detail.genres || []).map(g => ({ id: g.id, name: g.name })).filter(g => g.id && g.name);
    const seedGenreIds = seedGenres.map(g => g.id);
    const seedGenreNames = seedGenres.map(g => g.name);
    const rawKeywords = detail.keywords?.keywords || detail.keywords?.results || [];
    const seedKeywords = rawKeywords.slice(0, 12).map(k => ({ id: k.id, name: k.name })).filter(k => k.id && k.name);
    const seedKeywordIds = seedKeywords.map(k => k.id);
    const seedKeywordNames = seedKeywords.map(k => k.name);

    const directors = type === "tv"
      ? (detail.created_by || []).slice(0, 2).map(c => ({ id: c.id, name: c.name, role: "Creator" }))
      : (detail.credits?.crew || []).filter(c => c.job === "Director").slice(0, 2).map(c => ({ id: c.id, name: c.name, role: "Director" }));
    const leadCast = (detail.credits?.cast || []).slice(0, 2).map(c => ({ id: c.id, name: c.name, role: "Cast" }));

    const seedTokens = new Set(tokenizeText([
      seedTitle,
      detail.overview || "",
      detail.tagline || "",
      ...seedKeywordNames,
      ...seedGenreNames
    ].join(" ")));

    // Stage 2: Multi-Path Candidate Harvesting (5 parallel signal paths)
    const candidateMap = new Map();
    const excludedKeys = new Set([`${type}_${id}`]);
    Progress.getAll().forEach(p => {
      if ((p.progress || 0) >= 95 && (p.id || p.mediaId)) {
        const pt = (p.mediaType || p.type) === "tv" ? "tv" : "movie";
        excludedKeys.add(`${pt}_${p.id || p.mediaId}`);
      }
    });

    const hideAdult = SETTINGS.get(SETTINGS.hideAdultKey, "1") !== "0";
    const today = new Date().toISOString().slice(0, 10);

    const registerCandidate = (raw, cType, source, metaNote = "") => {
      if (!raw || !raw.id || (!raw.poster_path && !raw.backdrop_path)) return;
      if (hideAdult && raw.adult === true) return;
      const itemType = raw.media_type === "tv" || raw.media_type === "movie" ? raw.media_type : cType;
      const key = `${itemType}_${raw.id}`;
      if (excludedKeys.has(key)) return;
      const itemTitle = (raw.title || raw.name || "").trim();
      if (!itemTitle || itemTitle.toLowerCase() === seedTitle.toLowerCase()) return;
      const relDate = raw.release_date || raw.first_air_date || "";
      if (relDate && relDate > today) return;

      const existing = candidateMap.get(key);
      if (existing) {
        if (!existing._sources.includes(source)) existing._sources.push(source);
        if (metaNote && !existing._notes.includes(metaNote)) existing._notes.push(metaNote);
        return;
      }
      candidateMap.set(key, {
        ...raw,
        media_type: itemType,
        _sources: [source],
        _notes: metaNote ? [metaNote] : []
      });
    };

    // Path A & B: Direct recommendations & similar from detail response
    (detail.recommendations?.results || []).forEach(it => registerCandidate(it, type, "tmdb_rec"));
    (detail.similar?.results || []).forEach(it => registerCandidate(it, type, "tmdb_sim"));

    // Path C, D, E: Concurrent thematic keyword discovery, genre-intersection discovery, and auteur credits
    const discoveryTasks = [];

    if (seedKeywordIds.length) {
      const kwParam = seedKeywordIds.slice(0, 4).join("|");
      discoveryTasks.push(
        tmdb(`/discover/${type}?with_keywords=${kwParam}&sort_by=vote_count.desc&vote_count.gte=15&include_adult=false`)
          .then(res => (res?.results || []).forEach(it => registerCandidate(it, type, "keyword_match", seedKeywordNames.slice(0, 2).join(" & "))))
          .catch(() => {})
      );
    }

    if (seedGenreIds.length) {
      const strictGenreParam = seedGenreIds.slice(0, 2).join(",");
      discoveryTasks.push(
        tmdb(`/discover/${type}?with_genres=${strictGenreParam}&sort_by=popularity.desc&vote_count.gte=25&include_adult=false`)
          .then(res => (res?.results || []).forEach(it => registerCandidate(it, type, "genre_discover")))
          .catch(() => {})
      );
      discoveryTasks.push(
        tmdb(`/discover/${type}?with_genres=${seedGenreIds[0]}&sort_by=vote_average.desc&vote_count.gte=120&include_adult=false`)
          .then(res => (res?.results || []).forEach(it => registerCandidate(it, type, "acclaimed_genre")))
          .catch(() => {})
      );
    } else {
      discoveryTasks.push(
        tmdb(`/trending/${type}/week`)
          .then(res => (res?.results || []).forEach(it => registerCandidate(it, type, "trending_fallback")))
          .catch(() => {})
      );
    }

    const auteurPerson = directors[0] || leadCast[0];
    if (auteurPerson?.id) {
      discoveryTasks.push(
        tmdb(`/person/${auteurPerson.id}/combined_credits`)
          .then(credits => {
            const works = auteurPerson.role === "Cast"
              ? (credits?.cast || [])
              : [...(credits?.crew || []).filter(c => c.job === "Director" || c.job === "Creator" || c.job === "Writer"), ...(credits?.cast || [])];
            works
              .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
              .slice(0, 10)
              .forEach(it => registerCandidate(it, it.media_type || type, "auteur", `${auteurPerson.role}: ${auteurPerson.name}`));
          })
          .catch(() => {})
      );
    }

    await Promise.allSettled(discoveryTasks);

    // Stage 3: 6-Dimensional Deep Scoring & Reason Synthesis
    const genreLookup = type === "tv"
      ? { 10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery", 10765: "Sci-Fi & Fantasy", 37: "Western" }
      : { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 10752: "War", 37: "Western" };

    const isDarkSeed = seedGenreIds.some(gid => [27, 53, 80, 9648].includes(gid));

    const scored = [...candidateMap.values()].map(cand => {
      const cGenreIds = cand.genre_ids || (cand.genres || []).map(g => g.id) || [];
      const sharedGenreIds = cGenreIds.filter(gid => seedGenreIds.includes(gid));
      const sharedGenreNames = sharedGenreIds.map(gid => genreLookup[gid]).filter(Boolean);

      // 1. Genre overlap vector score
      let score = sharedGenreIds.length * 3.2;
      if (seedGenreIds.length && cGenreIds.includes(seedGenreIds[0])) score += 2.8;
      if (isDarkSeed && cGenreIds.includes(10751) && !seedGenreIds.includes(10751)) score -= 5.0;

      // 2. Semantic token overlap across overview + title
      const candWords = tokenizeText(`${cand.title || cand.name || ""} ${cand.overview || ""}`);
      const matchedWords = [...new Set(candWords.filter(w => seedTokens.has(w)))];
      const tokenOverlap = seedTokens.size ? matchedWords.length / Math.min(18, seedTokens.size) : 0;
      score += Math.min(8.5, tokenOverlap * 18);

      // 3. Multi-path provenance weight
      const srcs = cand._sources || [];
      if (srcs.includes("tmdb_rec")) score += 6.2;
      if (srcs.includes("keyword_match")) score += 5.4;
      if (srcs.includes("auteur")) score += 4.5;
      if (srcs.includes("tmdb_sim")) score += 3.4;
      if (srcs.includes("acclaimed_genre")) score += 2.6;
      if (srcs.length >= 2) score += (srcs.length - 1) * 2.2;

      // 4. Era & language affinity
      const candYear = Number(String(cand.release_date || cand.first_air_date || "").slice(0, 4)) || null;
      if (seedYear && candYear && Math.abs(seedYear - candYear) <= 8) score += 1.4;
      if (detail.original_language && cand.original_language === detail.original_language) score += 1.0;

      // 5. Bayesian quality score
      const v = Math.max(0, cand.vote_count || 0);
      const r = Math.max(0, Math.min(10, cand.vote_average || 0));
      const bayesian = (v * r + 120 * 6.5) / (v + 120);
      score += (bayesian - 6.0) * 1.85;

      // Synthesize a specific, human-readable match reason
      let reason = "";
      const auteurNote = (cand._notes || []).find(n => /^(Director|Creator|Cast):/.test(n));
      if (auteurNote) {
        reason = sharedGenreNames.length
          ? `${auteurNote} · ${sharedGenreNames.slice(0, 2).join(" & ")}`
          : `${auteurNote} affinity with ${seedTitle}`;
      } else if (srcs.includes("keyword_match") && seedKeywordNames.length) {
        reason = `Shared themes: ${seedKeywordNames.slice(0, 2).join(", ")}${sharedGenreNames[0] ? ` · ${sharedGenreNames[0]}` : ""}`;
      } else if (sharedGenreNames.length >= 2) {
        reason = `Matches ${seedTitle}'s ${sharedGenreNames.slice(0, 2).join(" & ").toLowerCase()} tone`;
      } else if (sharedGenreNames.length === 1) {
        reason = `${sharedGenreNames[0]} pick aligned with ${seedTitle}`;
      } else {
        reason = `Thematic & audience match for ${seedTitle}`;
      }

      return { ...cand, _rawScore: score, _synthesizedReason: reason };
    }).sort((a, b) => b._rawScore - a._rawScore || (b.vote_count || 0) - (a.vote_count || 0));

    const topCandidates = scored.slice(0, 20);
    const maxScore = topCandidates[0]?._rawScore || 18;
    const minScore = topCandidates[topCandidates.length - 1]?._rawScore || 6;
    const span = Math.max(1, maxScore - minScore);

    const finalizeItems = (list) => list.map((it, idx) => {
      const norm = Math.max(0, Math.min(1, (it._rawScore - minScore) / span));
      const matchPct = Math.round(84 + norm * 14 - Math.min(idx * 0.4, 5));
      return {
        ...it,
        _aiRec: {
          matchPct: Math.max(80, Math.min(99, matchPct)),
          reason: it._ai?.reason || it._synthesizedReason,
          rankedByAI: Boolean(it._ai?.rankedByAI)
        }
      };
    });

    const themeParts = [...seedGenreNames.slice(0, 2), ...seedKeywordNames.slice(0, 2)];
    const defaultSubtitle = themeParts.length
      ? `AI-synthesized from ${seedTitle}'s themes: ${themeParts.join(" · ")}`
      : `AI-synthesized from plot themes, tone & catalog signals`;

    const initialBundle = {
      ts: Date.now(),
      seedTitle,
      subtitle: defaultSubtitle,
      queryPrompt: `Titles like ${seedTitle}${seedYear ? ` (${seedYear})` : ""}: ${seedGenreNames.join(", ")}${seedKeywordNames.length ? `, themes of ${seedKeywordNames.slice(0, 3).join(", ")}` : ""}`,
      items: finalizeItems(topCandidates.slice(0, 16))
    };

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(initialBundle));
    } catch {}

    // Stage 4: Asynchronous Server AI Reranking & Explanation Upgrade (/api/ai-search)
    if (window.OsirisAICatalog && topCandidates.length >= 4 && typeof opts.onAIUpgrade === "function") {
      (async () => {
        try {
          const catalog = window.OsirisAICatalog;
          const syntheticPlan = catalog.normalizePlan({
            summary: `Recommendations based on ${seedTitle}`,
            mediaType: "all",
            genres: seedGenreNames.slice(0, 3),
            keywords: seedKeywordNames.slice(0, 4),
            seedTitles: [{ title: seedTitle, year: seedYear, type }]
          }, "all");

          const rankCandidatesPayload = topCandidates.slice(0, 18).map(c => ({
            id: c.id,
            media_type: c.media_type || type,
            title: String(c.title || c.name || "").slice(0, 160),
            release_date: c.release_date || c.first_air_date || "",
            overview: String(c.overview || "").slice(0, 500),
            genre_names: seedGenreNames.slice(0, 4),
            vote_average: typeof c.vote_average === "number" ? c.vote_average : 0,
            vote_count: Math.max(0, c.vote_count || 0),
            runtime: null,
            original_language: String(c.original_language || "en").slice(0, 2),
            popularity: Math.max(0, c.popularity || 0),
            source: (c._sources || []).join(", "),
            evidence: c._synthesizedReason || `Related to: ${seedTitle}`
          }));

          const res = await fetch("/api/ai-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "rank",
              query: initialBundle.queryPrompt,
              options: { mediaType: "all", hideAdult },
              plan: syntheticPlan,
              exclude: [...excludedKeys].slice(0, 50),
              candidates: rankCandidatesPayload
            })
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data?.version !== 2 || !Array.isArray(data.results) || !data.results.length) return;

          const merged = catalog.mergeRankedResults(topCandidates, data.results, 16);
          const upgradedBundle = {
            ...initialBundle,
            ts: Date.now(),
            subtitle: data.intro || initialBundle.subtitle,
            items: finalizeItems(merged)
          };
          try { sessionStorage.setItem(cacheKey, JSON.stringify(upgradedBundle)); } catch {}
          opts.onAIUpgrade(upgradedBundle);
        } catch {}
      })();
    }

    return initialBundle;
  }

  return { collectSeeds, generateForSeed };
})();

async function renderRecommendedForYouRow() {
  const container = $("#categories");
  if (!container) return;

  const wrap = document.createElement("div");
  wrap.className = "row-wrapper recommended-for-you-wrapper syw-row-wrapper visible";
  wrap.innerHTML = `
    <div class="row-header syw-row-header">
      <div class="syw-header-left">
        <h2 class="row-title syw-title">
          <span class="syw-prefix">Since you watched</span>
          <span class="syw-seed-wrap">
            <button type="button" class="syw-seed-btn" aria-haspopup="listbox" aria-expanded="false">
              <span class="syw-seed-name">Loading…</span>
              <svg class="syw-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="syw-seed-menu" role="listbox" aria-label="Choose a watched title"></div>
          </span>
          <span class="syw-ai-badge" title="AI-Powered Multi-Signal Recommendations">AI</span>
        </h2>
        <p class="syw-subtitle">Synthesizing plot themes, keywords &amp; catalog signals…</p>
      </div>
      <div class="syw-header-actions">
        <a href="/search?type=ai" class="syw-explore-btn" id="syw-explore-link">Ask AI Search →</a>
      </div>
    </div>
    <div class="row-track-container">
      <button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
      <div class="row-track recommended-for-you-track"></div>
      <button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;

  const track = wrap.querySelector(".recommended-for-you-track");
  track.append(...skeletons(8));

  const contRow = container.querySelector(".continue-watching-wrapper");
  if (contRow) contRow.after(wrap);
  else container.prepend(wrap);

  const scroll = 360;
  wrap.querySelector(".row-arrow.left")?.addEventListener("click", () => track.scrollBy({ left: -scroll, behavior: "smooth" }));
  wrap.querySelector(".row-arrow.right")?.addEventListener("click", () => track.scrollBy({ left: scroll, behavior: "smooth" }));

  const seeds = await AIRecommendations.collectSeeds();
  if (!seeds.length) {
    wrap.remove();
    return;
  }

  const seedBtn = wrap.querySelector(".syw-seed-btn");
  const seedNameEl = wrap.querySelector(".syw-seed-name");
  const seedMenu = wrap.querySelector(".syw-seed-menu");
  const subtitleEl = wrap.querySelector(".syw-subtitle");
  const exploreLink = wrap.querySelector("#syw-explore-link");
  const prefixEl = wrap.querySelector(".syw-prefix");

  const savedSeedKey = sessionStorage.getItem("orc_syw_selected_seed");
  const watchedSeeds = seeds.filter(s => s.watched);
  let activeSeed = seeds.find(s => `${s.type}_${s.id}` === savedSeedKey && (watchedSeeds.length === 0 || s.watched))
    || watchedSeeds[0]
    || seeds[0];
  let currentRequestToken = 0;

  const renderBundleIntoRow = (bundle, seedObj) => {
    if (!bundle || !bundle.items || !bundle.items.length) return;
    if (subtitleEl) subtitleEl.textContent = bundle.subtitle || "";
    if (exploreLink && bundle.queryPrompt) {
      exploreLink.href = `${routeUrl("search")}?type=ai&q=${encodeURIComponent(bundle.queryPrompt)}`;
    }
    track.textContent = "";
    bundle.items.forEach((it, idx) => {
      track.appendChild(buildCard(it, mediaType(it, seedObj.type), { eager: idx < 4 }));
    });
    initRowDrag(track);
    initRowKeyboard(track);
  };

  const selectSeed = async (seedObj) => {
    activeSeed = seedObj;
    try { sessionStorage.setItem("orc_syw_selected_seed", `${seedObj.type}_${seedObj.id}`); } catch {}
    if (seedNameEl) seedNameEl.textContent = seedObj.title;
    if (prefixEl) {
      prefixEl.textContent = seedObj.watched ? "Since you watched" : "If you watched";
    }
    seedMenu.querySelectorAll(".syw-seed-opt").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.seedKey === `${seedObj.type}_${seedObj.id}`);
    });
    track.textContent = "";
    track.append(...skeletons(8));
    if (subtitleEl) subtitleEl.textContent = `Analyzing themes, keywords & tone of ${seedObj.title}…`;

    const reqToken = ++currentRequestToken;
    const bundle = await AIRecommendations.generateForSeed(seedObj, {
      onAIUpgrade: upgraded => {
        if (reqToken === currentRequestToken) {
          renderBundleIntoRow(upgraded, seedObj);
        }
      }
    });
    if (reqToken !== currentRequestToken) return;
    renderBundleIntoRow(bundle, seedObj);
  };

  seedMenu.innerHTML = seeds.map(s => {
    const key = `${s.type}_${s.id}`;
    const thumb = s.poster ? `${IMG_W185}${s.poster}` : "";
    return `
      <button type="button" class="syw-seed-opt${key === `${activeSeed.type}_${activeSeed.id}` ? " active" : ""}" data-seed-key="${esc(key)}" role="option">
        ${thumb ? `<img src="${esc(thumb)}" class="syw-seed-opt-thumb" alt="" loading="lazy" decoding="async" />` : `<div class="syw-seed-opt-thumb"></div>`}
        <div class="syw-seed-opt-info">
          <div class="syw-seed-opt-title">${esc(s.title)}</div>
          <div class="syw-seed-opt-meta">${s.year ? `${s.year} · ` : ""}${s.type === "tv" ? "Series" : "Film"}</div>
        </div>
        <span class="syw-seed-opt-tag">${esc(s.sourceLabel)}</span>
      </button>`;
  }).join("");

  seedMenu.querySelectorAll(".syw-seed-opt").forEach((btn, idx) => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      seedMenu.classList.remove("open");
      seedBtn.setAttribute("aria-expanded", "false");
      if (seeds[idx]) selectSeed(seeds[idx]);
    });
  });

  seedBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = seedMenu.classList.toggle("open");
    seedBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", e => {
    if (!wrap.contains(e.target)) {
      seedMenu.classList.remove("open");
      seedBtn?.setAttribute("aria-expanded", "false");
    }
  });

  await selectSeed(activeSeed);
}

function navigateWithLoader(href, bg = "", title = "", seed = null) {
  try {
    if (seed && seed.item) {
      sessionStorage.setItem("orc_nav_seed", JSON.stringify({
        id: String(seed.id || seed.item.id || ""),
        type: seed.type || "movie",
        time: Date.now(),
        item: {
          id: seed.item.id,
          title: seed.item.title || seed.item.name || title,
          name: seed.item.name || seed.item.title || title,
          overview: seed.item.overview || "",
          backdrop_path: seed.item.backdrop_path || "",
          poster_path: seed.item.poster_path || "",
          release_date: seed.item.release_date || "",
          first_air_date: seed.item.first_air_date || "",
          vote_average: seed.item.vote_average || 0,
          vote_count: seed.item.vote_count || 0,
           tagline: seed.item.tagline || ""
        }
      }));
    }
  } catch (err) {}
  if (typeof NProgress !== "undefined" && NProgress.start) NProgress.start();
  location.href = href;
}

function consumeNavSeed(expectedId, expectedType) {
  try {
    const raw = sessionStorage.getItem("orc_nav_seed");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || String(parsed.id) !== String(expectedId)) return null;
    if (expectedType && parsed.type && parsed.type !== expectedType) return null;
    if (Date.now() - (parsed.time || 0) > 5 * 60 * 1000) return null;
    return parsed.item || null;
  } catch {
    return null;
  }
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

const DEVLOG_ID = "v3.1_nov2026";

function renderDevLogAnnouncement() {
  if (safeGetItem("orc_devlog_dismissed") === DEVLOG_ID) return;

  const card = document.createElement("div");
  card.className = "devlog-card";
  card.id = "devlog-card";
  card.innerHTML = `
    <div class="devlog-header">
      <div class="devlog-header-left">
        <span>WHAT'S NEW</span>
        <span class="devlog-date">· v3.2 UPDATE</span>
      </div>
      <button type="button" class="devlog-close" id="devlog-close" aria-label="Dismiss update">✕</button>
    </div>
    <div class="devlog-title">Cleaner design, mobile episode tracking, and faster streams</div>
    <div class="devlog-body">
      <p>We refreshed the navigation with a floating frosted glass bar, added instant episode notifications on mobile, and tuned movie and TV pages so they look sharper and load faster.</p>
      <p>Smart recommendations now look at titles you've actually watched. You can also press <kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">Ctrl+K</kbd> anywhere to search instantly.</p>
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
      // Search across both movie and tv with provider filter
      location.href = `${routeUrl("search")}?type=all&provider=${pid}`;
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

  // Kick off Hero carousel immediately so it never waits behind 8 category rows
  tmdb("/trending/all/week").then(data => {
    const heroItems = dedupeItems(data.results || []).filter(i => i.backdrop_path);
    if (heroItems.length && !heroSlides.length) {
      initHeroCarousel(heroItems.slice(0, 6));
    }
  }).catch(() => {});

  const loadCategoryRow = async (c, i) => {
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

        if (c.id === "trending" && items.length && !heroSlides.length) {
          initHeroCarousel(items.slice(0, 6));
        }
      } else if (target) {
        target.w.remove();
      }
    } catch (err) { console.warn('Caught error:', err);
      if (catRowEls[i]) catRowEls[i].w.remove();
    }
  };

  cats.forEach((c, i) => {
    if (i < 3 || c.eager) {
      loadCategoryRow(c, i);
    } else {
      observeLazyRow(catRowEls[i].w, () => loadCategoryRow(c, i));
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
  gRow.innerHTML = `<div class="row-header"><h2 class="row-title">${GENRES[0].name}</h2></div><div class="row-track-container"><button class="row-arrow left" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button><div class="row-track"></div><button class="row-arrow right" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button></div>`;
  const gTrack = gRow.querySelector(".row-track");
  gTrack.append(...skeletons(8));
  gRow.querySelector(".row-arrow.left")?.addEventListener("click", () => gTrack.scrollBy({ left: -360, behavior: "smooth" }));
  gRow.querySelector(".row-arrow.right")?.addEventListener("click", () => gTrack.scrollBy({ left: 360, behavior: "smooth" }));
  el.prepend(gRow);

  tmdb(`/discover/movie?with_genres=${GENRES[0].id}&sort_by=popularity.desc`).then(gd => {
    const gItems = dedupeItems(gd.results || []).slice(0, 20);
    if (gItems.length) {
      gTrack.textContent = "";
      gItems.forEach((it, idx) => gTrack.appendChild(buildCard(it, "movie", { eager: idx < 4 })));
      initRowDrag(gTrack);
      initRowKeyboard(gTrack);
    }
  }).catch(() => {});

  observeRows();
  if (main) main.style.opacity = "1";

  (async () => {
    try {
      const air = await tmdb("/tv/on_the_air");
      const top = (air.results || []).filter(s => s.backdrop_path).slice(0, 8);
      const details = await Promise.allSettled(top.map(s => tmdb(`/tv/${s.id}`)));
      const shows = details
        .filter(r => r.status === "fulfilled")
        .map(r => r.value)
        .filter(s => (s.number_of_seasons || 0) >= 2)
        .slice(0, 8);
      const spot = buildSeasonSpotlight(shows);
      if (spot) {
        gRow.after(spot);
      }
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
    const recBadge = i === 0 ? `<span class="provider-rec" aria-label="Recommended">★</span>` : "";
    const trackBadge = p.tracksProgress
      ? `<span class="provider-track-badge on" title="Progress tracking supported">Tracking ON</span>`
      : `<span class="provider-track-badge off" title="External provider - no progress events">Tracking OFF</span>`;
    btn.innerHTML = `${p.name}${recBadge}${trackBadge}`;
    btn.addEventListener("click", () => {
      setProvider(p.id);
      $(".provider-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(providerUrl(type, id, s, e));
    });
    container.appendChild(btn);
  });
}

async function initMoviePage() {
  const rawId = new URLSearchParams(location.search).get("id");
  if (!rawId) {
    location.replace(routeUrl("search") + "?type=movie");
    return;
  }
  const header = $("#detail-header");
  const frame = $("#player-frame");
  if (isNaN(Number(rawId)) || Number(rawId) <= 0) {
    if (header) {
      header.innerHTML = `
        <div class="detail-error-box">
          <h2>Could Not Load Details</h2>
          <p>Invalid or missing movie ID. Please return home or search for a title.</p>
          <div class="detail-actions">
            <a href="${homeUrl()}" class="btn-play">Go Home</a>
          </div>
        </div>`;
      LiquidGlass.glassify(header);
    }
    return;
  }
  const id = String(parseInt(rawId, 10));
  if (!header || !frame) return;

  initSidebar("movies");
  checkPlayLoader();
  initPlayerGuard();

  let playerStarted = SETTINGS.get(SETTINGS.playOnOpenKey) === "1";
  const load = url => loadPlayerFrame(frame, url);
  const startPlayer = () => {
    playerStarted = true;
    load(providerUrl("movie", id, 1, 1));
  };

  renderProviders($("#provider-bar"), "movie", id, 1, 1, url => {
    playerStarted = true;
    load(url);
  });

  if (playerStarted) {
    load(providerUrl("movie", id, 1, 1));
  } else {
    frame.innerHTML = `
      <div class="player-poster-splash" id="player-splash">
        <button type="button" class="splash-play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Playback</button>
      </div>`;
    $("#player-splash")?.addEventListener("click", () => {
      startPlayer();
    });
  }

  const seed = consumeNavSeed(id, "movie");
  if (seed) {
    document.title = `${seed.title || "Movie"} — ${BRAND}`;
    if (seed.backdrop_path) applyDetailBackdrop(seed.backdrop_path);
    const savedSeed = MyList.has(id, "movie");
    const resumeSeed = resumeLabel(Progress.getItem(id, "movie"));
    header.innerHTML = `
      <h1 class="detail-title">${esc(seed.title || "")}</h1>
      <div class="detail-meta">
        ${seed.vote_average ? `<span class="score">★ ${Number(seed.vote_average).toFixed(1)}</span>` : ""}
        ${seed.vote_count ? `<span>${fmtVotes(seed.vote_count)}</span>` : ""}
        <span>${year(seed.release_date)}</span>
      </div>
      <p class="detail-overview">${esc(seed.overview || "")}</p>
      ${resumeSeed ? `<p class="detail-resume">${esc(resumeSeed)}</p>` : ""}
      <div class="detail-actions">
        <button type="button" class="btn-play" id="detail-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> ${resumeSeed ? "Resume" : "Play"}</button>
        <button class="btn-ghost" id="detail-save">${savedSeed ? "✓ Saved" : "+ My List"}</button>
        <button class="btn-ghost btn-icon-text" id="detail-share">${ICONS.share}<span>Share</span></button>
      </div>`;
    LiquidGlass.glassify(header);
  }

  let m;
  try {
    m = await tmdb(`/movie/${id}?append_to_response=images,credits,similar,videos,recommendations,external_ids,release_dates`);
  } catch (err) { console.warn('Caught error:', err);
    try {
      m = await tmdb(`/movie/${id}`);
    } catch (err) { console.warn('Caught error:', err);
      m = seed || null;
    }
  }

  if (!m) {
    if (header) {
      header.innerHTML = `
        <div class="detail-error-box">
          <h2>Could Not Load Details</h2>
          <p>Failed to retrieve movie information. Please check your connection and retry.</p>
          <div class="detail-actions">
            <button type="button" class="btn-play" onclick="location.reload()">Retry</button>
            <a href="${homeUrl()}" class="btn-ghost">Go Home</a>
          </div>
        </div>`;
      LiquidGlass.glassify(header);
    }
    return;
  }

  try {
    setMetaTags({ title: m.title, description: m.overview, image: m.poster_path ? `${IMG_W500}${m.poster_path}` : "", url: `${siteOrigin}/movie?id=${m.id}` });
    if (m.backdrop_path) applyDetailBackdrop(m.backdrop_path);

    const saved = MyList.has(m.id, "movie");
    const trailer = pickTrailer(m.videos);
    const cert = (m.release_dates?.results || []).find(r => r.iso_3166_1 === "US")?.release_dates?.map(d => d.certification).find(Boolean);
    const resume = resumeLabel(Progress.getItem(m.id, "movie"));

    const logos = m.images?.logos || [];
    const logoObj = logos.find(l => l.iso_639_1 === "en") || logos.find(l => !l.iso_639_1) || logos[0];
    const titleHtml = logoObj?.file_path
      ? `<div class="detail-logo-wrap"><img src="https://image.tmdb.org/t/p/w500${logoObj.file_path}" class="detail-title-logo" alt="${esc(m.title)}" /><h1 class="sr-only">${esc(m.title)}</h1></div>`
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
    const markMovieWatched = () => {
      ensureRecommendSection(m.title, true);
    };
    $("#detail-play")?.addEventListener("click", (e) => {
      if (e.shiftKey) return;
      e.preventDefault();
      markMovieWatched();
      startPlayer();
      scrollToSelector("#player-frame");
    });
    if (trailer) $("#detail-trailer")?.addEventListener("click", () => openTrailer(trailer.key));
    $("#detail-share")?.addEventListener("click", () => sharePageLink(m.title));
    $("#detail-save")?.addEventListener("click", () => {
      openSaveModal({ id: m.id, type: "movie", title: m.title, poster: m.poster_path }, nowSaved => {
        const btn = $("#detail-save");
        if (btn) btn.textContent = nowSaved ? "✓ Saved" : "+ My List";
      });
    });

    if (playerStarted && !frame.querySelector("iframe")) {
      renderProviders($("#provider-bar"), "movie", id, 1, 1, load);
      load(providerUrl("movie", id, 1, 1));
    }

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

    RecentViewed.add(m, "movie");
    renderCastRow(m.credits?.cast?.slice(0, 16) || []);

    const hasWatchedMovie = Boolean(Progress.getItem(m.id, "movie"));
    ensureRecommendSection(m.title, hasWatchedMovie);
    const recSec = $("#recommend-section");
    const recRow = $("#recommend-row");
    if (recSec && recRow) {
      recSec.style.display = "";
      recRow.textContent = "";
      recRow.append(...skeletons(6));
      AIRecommendations.generateForSeed(
        { id: m.id, type: "movie", title: m.title, poster: m.poster_path, year: year(m.release_date) },
        {
          seedDetail: m,
          onAIUpgrade: upgraded => {
            if (upgraded?.items?.length) renderCardRow("#recommend-section", "#recommend-row", upgraded.items, "movie");
          }
        }
      ).then(bundle => {
        if (bundle?.items?.length) {
          renderCardRow("#recommend-section", "#recommend-row", bundle.items, "movie");
        } else {
          recSec.style.display = "none";
        }
      }).catch(() => { recSec.style.display = "none"; });
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
  const rawId = params.get("id");
  if (!rawId) {
    location.replace(routeUrl("search") + "?type=tv");
    return;
  }
  const header = $("#detail-header");
  const frame = $("#player-frame");
  if (isNaN(Number(rawId)) || Number(rawId) <= 0) {
    if (header) {
      header.innerHTML = `
        <div class="detail-error-box">
          <h2>Could Not Load Series</h2>
          <p>Invalid or missing series ID. Please return home or search for a title.</p>
          <div class="detail-actions">
            <a href="${homeUrl()}" class="btn-play">Go Home</a>
          </div>
        </div>`;
      LiquidGlass.glassify(header);
    }
    return;
  }
  const id = String(parseInt(rawId, 10));
  let season = parseInt(params.get("season") || "1", 10);
  let episode = parseInt(params.get("episode") || "1", 10);
  let playerStarted = SETTINGS.get(SETTINGS.playOnOpenKey) === "1";

  const seed = consumeNavSeed(id, "tv");
  if (seed) {
    document.title = `${seed.name || seed.title || "Series"} — ${BRAND}`;
    if (seed.backdrop_path) applyDetailBackdrop(seed.backdrop_path);
    const savedSeed = MyList.has(id, "tv");
    if (header) header.innerHTML = `
      <h1 class="detail-title">${esc(seed.name || seed.title || "")}</h1>
      <div class="detail-meta">
        ${seed.vote_average ? `<span class="score">★ ${Number(seed.vote_average).toFixed(1)}</span>` : ""}
        ${seed.vote_count ? `<span>${fmtVotes(seed.vote_count)}</span>` : ""}
        <span>${year(seed.first_air_date || seed.release_date)}</span>
      </div>
      <p class="detail-overview">${esc(seed.overview || "")}</p>
      <div class="detail-actions">
        <button type="button" class="btn-play" id="detail-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</button>
        <button class="btn-ghost" id="detail-save">${savedSeed ? "✓ Saved" : "+ My List"}</button>
        <button class="btn-ghost btn-icon-text" id="detail-share">${ICONS.share}<span>Share</span></button>
      </div>`;
    LiquidGlass.glassify(header);
  }

  let show;
  try {
    show = await tmdb(`/tv/${id}?append_to_response=images,credits,similar,recommendations,videos,external_ids,content_ratings`);
  } catch (err) { console.warn('Caught error:', err);
    try {
      show = await tmdb(`/tv/${id}`);
    } catch (err) { console.warn('Caught error:', err);
      show = seed || null;
    }
  }

  if (!show) {
    if (header) {
      header.innerHTML = `
        <div class="detail-error-box">
          <h2>Could Not Load Series</h2>
          <p>Failed to retrieve series information. Please check your connection and retry.</p>
          <div class="detail-actions">
            <button type="button" class="btn-play" onclick="location.reload()">Retry</button>
            <a href="${homeUrl()}" class="btn-ghost">Go Home</a>
          </div>
        </div>`;
      LiquidGlass.glassify(header);
    }
    return;
  }

  try {
    setMetaTags({ title: show.name, description: show.overview, image: show.poster_path ? `${IMG_W500}${show.poster_path}` : "", url: `${siteOrigin}/tv?id=${show.id}` });
    if (show.backdrop_path) applyDetailBackdrop(show.backdrop_path);

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
      ? `<div class="detail-logo-wrap"><img src="https://image.tmdb.org/t/p/w500${logoObj.file_path}" class="detail-title-logo" alt="${esc(show.name)}" /><h1 class="sr-only">${esc(show.name)}</h1></div>`
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
    const markShowWatched = (sNum = season, eNum = episode) => {
      ensureRecommendSection(show.name, true);
    };
    const startTvPlayer = () => {
      playerStarted = true;
      loadPlayerFrame(frame, providerUrl("tv", id, season, episode));
    };
    $("#detail-play")?.addEventListener("click", (e) => {
      if (e.shiftKey) return;
      e.preventDefault();
      markShowWatched(season, episode);
      startTvPlayer();
      scrollToSelector("#player-frame");
    });
    if (trailer) $("#detail-trailer")?.addEventListener("click", () => openTrailer(trailer.key));
    $("#detail-share")?.addEventListener("click", () => sharePageLink(show.name));
    $("#detail-save")?.addEventListener("click", () => {
      openSaveModal({ id: show.id, type: "tv", title: show.name, poster: show.poster_path }, nowSaved => {
        $("#detail-save").textContent = nowSaved ? "✓ Saved" : "+ My List";
      });
    });

    const update = () => {
      if (playerStarted) {
        loadPlayerFrame(frame, providerUrl("tv", id, season, episode));
      } else {
        frame.innerHTML = `
          <div class="player-poster-splash" id="player-splash">
            <button type="button" class="splash-play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play S${season} E${episode}</button>
          </div>`;
        $("#player-splash")?.addEventListener("click", () => {
          startTvPlayer();
        });
      }
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
          let air = "";
          if (ep.air_date) {
            const parts = ep.air_date.split("-");
            if (parts.length === 3) {
              const localD = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              air = localD.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            } else {
              air = ep.air_date;
            }
          }
          const dur = ep.runtime ? `${ep.runtime}m` : "";
          el.innerHTML = `
            <span class="ep-row-num">${ep.episode_number}</span>
            ${WatchedEpisodes.has(id, sn, ep.episode_number) ? '<span class="ep-watched-check" title="Watched" style="color:var(--accent);margin-left:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
            <div class="ep-row-thumb">${ep.still_path ? `<img src="${esc(IMG_W300 + ep.still_path)}" alt="${esc(ep.name || '')}" loading="lazy" decoding="async" draggable="false"/>` : ""}</div>
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
            const newUrl = new URL(location.href);
            newUrl.searchParams.set("season", String(season));
            newUrl.searchParams.set("episode", String(episode));
            history.replaceState(null, "", newUrl);
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
        o.textContent = s.season_number === 0 ? "Specials" : `Season ${s.season_number}`;
        if (s.season_number === season) o.selected = true;
        seasonSel.appendChild(o);
      });
      loadEps(season).then(() => {
        const nextSeasonObj = seasons.find(s => s.season_number === season + 1);
        if (nextSeasonObj) tmdb(`/tv/${id}/season/${season + 1}`).catch(() => {});
      });
      seasonSel.addEventListener("change", () => {
        season = +seasonSel.value;
        episode = 1;
        const epInput = $("#ep-search-input");
        if (epInput) epInput.value = "";
        const playBtn = $("#detail-play");
        if (playBtn) playBtn.removeAttribute("disabled");
        update();
        loadEps(season);
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

    RecentViewed.add(show, "tv");
    renderCastRow(show.credits?.cast?.slice(0, 16) || []);

    const hasWatchedShow = Boolean(Progress.getItem(show.id, "tv"));
    ensureRecommendSection(show.name, hasWatchedShow);
    const recSec = $("#recommend-section");
    const recRow = $("#recommend-row");
    if (recSec && recRow) {
      recSec.style.display = "";
      recRow.textContent = "";
      recRow.append(...skeletons(6));
      AIRecommendations.generateForSeed(
        { id: show.id, type: "tv", title: show.name, poster: show.poster_path, year: year(show.first_air_date) },
        {
          seedDetail: show,
          onAIUpgrade: upgraded => {
            if (upgraded?.items?.length) renderCardRow("#recommend-section", "#recommend-row", upgraded.items, "tv");
          }
        }
      ).then(bundle => {
        if (bundle?.items?.length) {
          renderCardRow("#recommend-section", "#recommend-row", bundle.items, "tv");
        } else {
          recSec.style.display = "none";
        }
      }).catch(() => { recSec.style.display = "none"; });
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
  async function doSearch(q, append = false, targetPage = 1) {
    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController();
    const searchOpts = { signal: searchAbortController.signal };
    if (!status || !grid) return;
    if (!append) {
      searchPage = 1;
      hasMorePages = true;
      grid.textContent = "";
      skeletons(12).forEach(s => grid.appendChild(s));
    } else {
      searchPage = targetPage;
    }
    lastQ = q;
    if (!append) {
      syncFiltersToUrl(q);
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
        const rawGenre = $("#filter-genre")?.value || genreId || "";
        const genreVal = (rawGenre && rawGenre !== "all") ? rawGenre : "";

        // Map movie genre IDs to TV genre IDs when type is tv
        const mapGenreForType = (gId, mediaType) => {
          if (!gId) return "";
          if (mediaType === "tv") {
            if (gId === "28") return "10759"; // Action -> Action & Adventure
            if (gId === "12") return "10759"; // Adventure -> Action & Adventure
            if (gId === "14" || gId === "878") return "10765"; // Sci-Fi / Fantasy -> Sci-Fi & Fantasy
            if (["53", "27", "10749", "99", "18", "35", "16", "80", "10751"].includes(gId)) return gId;
            return ""; // Drop genres that do not exist for TV
          }
          return gId;
        };

        const PROVIDER_MAP = {
          netflix: 8,
          hbo: 1899,
          disney: 337,
          apple: 350,
          prime: 9,
          hulu: 15,
          paramount: 531,
          peacock: 386,
          crunchyroll: 283,
          amc: 528
        };
        const pKey = $("#filter-provider")?.value || providerId || "";
        const pId = PROVIDER_MAP[pKey] || (Number.isFinite(Number(pKey)) && pKey ? pKey : "");
        const watchRegion = SETTINGS.get("orc_watch_region", "US") || "US";
        const pParam = pId ? `&with_watch_providers=${pId}&watch_region=${encodeURIComponent(watchRegion)}` : "";

        const sortVal = $("#filter-sort")?.value || "pop";
        const eraVal = $("#filter-era")?.value || "all";
        const ratingVal = $("#filter-rating")?.value || "all";

        const todayStr = new Date().toISOString().slice(0, 10);
        const buildTmdbParams = (mediaType) => {
          let sortParam = "popularity.desc";
          if (sortVal === "rating") sortParam = "vote_average.desc";
          if (sortVal === "newest") sortParam = mediaType === "tv" ? "first_air_date.desc" : "primary_release_date.desc";

          let p = `sort_by=${sortParam}`;
          if (sortVal === "pop") p += "&vote_count.gte=30";
          else if (sortVal === "rating") p += "&vote_count.gte=80";

          // Exclude unreleased titles from Newest
          if (sortVal === "newest") {
            const dateField = mediaType === "tv" ? "first_air_date.lte" : "primary_release_date.lte";
            p += `&${dateField}=${todayStr}`;
          }

          // Era bounds
          const gteField = mediaType === "tv" ? "first_air_date.gte" : "primary_release_date.gte";
          const lteField = mediaType === "tv" ? "first_air_date.lte" : "primary_release_date.lte";
          if (eraVal === "2026") p += `&${gteField}=2026-01-01&${lteField}=2026-12-31`;
          else if (eraVal === "2025") p += `&${gteField}=2025-01-01&${lteField}=2025-12-31`;
          else if (eraVal === "2024") p += `&${gteField}=2024-01-01&${lteField}=2024-12-31`;
          else if (eraVal === "2020s") p += `&${gteField}=2020-01-01`;
          else if (eraVal === "2010s") p += `&${gteField}=2010-01-01&${lteField}=2019-12-31`;
          else if (eraVal === "classic") p += `&${lteField}=2009-12-31`;

          // Rating filter
          if (ratingVal !== "all") {
            p += `&vote_average.gte=${encodeURIComponent(ratingVal)}`;
          }

          const gTarget = mapGenreForType(genreVal, mediaType);
          if (gTarget) p += `&with_genres=${gTarget}`;
          if (pParam) p += pParam;
          return p;
        };

        if (current === "all") {
          const [movData, tvData] = await Promise.all([
            tmdb(`/discover/movie?${buildTmdbParams("movie")}&page=${searchPage}`, 1, searchOpts).catch(() => ({ results: [] })),
            tmdb(`/discover/tv?${buildTmdbParams("tv")}&page=${searchPage}`, 1, searchOpts).catch(() => ({ results: [] }))
          ]);
          const movs = (movData.results || []).map(m => ({ ...m, media_type: "movie" }));
          const tvs = (tvData.results || []).map(t => ({ ...t, media_type: "tv" }));
          items = [...movs, ...tvs];
          if ((movData.page >= (movData.total_pages || 1)) && (tvData.page >= (tvData.total_pages || 1))) hasMorePages = false;
        } else {
          const media = current === "tv" ? "tv" : "movie";
          const data = await tmdb(`/discover/${media}?${buildTmdbParams(media)}&page=${searchPage}`, 1, searchOpts);
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
        grid.innerHTML = `<div class="no-results">
          <h3>Nothing matched</h3>
          <p>Try adjusting your search query or filters.</p>
          <button type="button" class="btn-ghost reset-filters-btn" style="margin-top:12px;padding:8px 16px;font-size:0.86rem">Reset filters</button>
        </div>`;
        grid.querySelector(".reset-filters-btn")?.addEventListener("click", () => {
          if (input) input.value = "";
          ["#filter-genre", "#filter-provider", "#filter-era", "#filter-rating", "#filter-sort"].forEach(sel => {
            const el = $(sel);
            if (el) el.value = el.querySelector("option")?.value || "all";
          });
          const url = new URL(location.href);
          url.search = "";
          history.replaceState(null, "", url);
          doSearch("");
        });
        if (status) status.textContent = "";
        renderRecent();
        return;
      }

      const count = grid.querySelectorAll(".media-card").length + items.length;
      if (status) status.textContent = `${count} ${count === 1 ? "result" : "results"}`;

      items.forEach((item, idx) => {
        grid.appendChild(buildCard(item, item.media_type || (current === "tv" ? "tv" : "movie"), { eager: !append && idx < 6 }));
      });

      if (!hasMorePages) appendEndOfResults();
      return true;
    } catch (e) {
      if (searchOpts.signal.aborted || e.name === "AbortError") return false;
      if (!append) {
        grid.innerHTML = `<div class="no-results"><p>Failed to load titles. Please check your connection.</p></div>`;
        if (status) status.textContent = "";
      } else {
        if (!$(".infinite-error-row")) {
          const errRow = document.createElement("div");
          errRow.className = "infinite-error-row";
          errRow.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem">Failed to load more results.</p><button type="button" class="btn-ghost retry-infinite-btn" style="margin-top:8px">Retry</button>`;
          errRow.querySelector(".retry-infinite-btn")?.addEventListener("click", () => {
            errRow.remove();
            doSearch(lastQ || input?.value.trim() || "", true, searchPage);
          });
          grid.appendChild(errRow);
        }
      }
      return false;
    }
  }

  const appendEndOfResults = () => {
    if (!$(".end-of-results") && !hasMorePages) {
      const endEl = document.createElement("div");
      endEl.className = "end-of-results";
      endEl.innerHTML = `<p>You've reached the end of the results.</p><button type="button" class="btn-ghost back-to-top-btn">Back to top ↑</button>`;
      endEl.querySelector(".back-to-top-btn")?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      grid.appendChild(endEl);
    }
  };

  const syncFiltersToUrl = (query = input?.value.trim() || "") => {
    const u = new URL(location.href);
    if (query) u.searchParams.set("q", query); else u.searchParams.delete("q");
    if (current && current !== "all") u.searchParams.set("type", current); else u.searchParams.delete("type");
    const genre = $("#filter-genre")?.value;
    if (genre && genre !== "all") u.searchParams.set("genre", genre); else u.searchParams.delete("genre");
    const provider = $("#filter-provider")?.value;
    if (provider && provider !== "all") u.searchParams.set("provider", provider); else u.searchParams.delete("provider");
    const era = $("#filter-era")?.value;
    if (era && era !== "all") u.searchParams.set("era", era); else u.searchParams.delete("era");
    const rating = $("#filter-rating")?.value;
    if (rating && rating !== "all") u.searchParams.set("rating", rating); else u.searchParams.delete("rating");
    const sort = $("#filter-sort")?.value;
    if (sort && sort !== "pop") u.searchParams.set("sort", sort); else u.searchParams.delete("sort");
    history.replaceState(null, "", u);
  };

  // Sync initial dropdown states from URL parameters (Item 30)
  const initialEra = params.get("era");
  if (initialEra && $("#filter-era")) $("#filter-era").value = initialEra;
  const initialRating = params.get("rating");
  if (initialRating && $("#filter-rating")) $("#filter-rating").value = initialRating;
  const initialSort = params.get("sort");
  if (initialSort && $("#filter-sort")) $("#filter-sort").value = initialSort;

  // Infinite Scroll Listener
  window.addEventListener("scroll", () => {
    if (current === "ai" || isFetchingMore || !hasMorePages || $(".infinite-error-row")) return;
    const scrollPos = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 750;
    if (scrollPos >= threshold) {
      isFetchingMore = true;
      const nextPage = searchPage + 1;
      doSearch(lastQ || input?.value.trim() || "", true, nextPage).finally(() => {
        isFetchingMore = false;
      });
    }
  }, { passive: true });

  ["#filter-genre", "#filter-provider", "#filter-era", "#filter-rating", "#filter-sort"].forEach(sel => {
    $(sel)?.addEventListener("change", () => {
      syncFiltersToUrl(input?.value.trim() || "");
      doSearch(input?.value.trim() || "");
    });
  });

  if (genreId && $("#filter-genre")) {
    $("#filter-genre").value = genreId;
  }
  if (providerId && $("#filter-provider")) {
    $("#filter-provider").value = providerId;
  }
  const q = params.get("q") || "";
  if (input && !q && !genreId && !isMobile() && !isTouch()) setTimeout(() => input.focus(), 120);
  if (input) {
    input.value = q;
    if (clear) clear.style.display = q ? "flex" : "none";
    input.addEventListener("input", () => {
      const val = input.value.trim();
      if (clear) clear.style.display = input.value ? "flex" : "none";
      if (filtersBar) filtersBar.hidden = current === "ai" || !!val;
      clearTimeout(timer);
      if (!val) renderRecent();
      if (current === "ai") { if (!val) doSearch(""); return; }
      setBusy(true);
      timer = setTimeout(() => doSearch(val), 220);
    });
    input.addEventListener("keydown", e => {
      if (e.key !== "Enter" || e.isComposing || current !== "ai") return;
      e.preventDefault();
      clearTimeout(timer);
      closeInstantSearch?.();
      doSearch(input.value.trim());
    });
    doSearch(q);
  }
  clear?.addEventListener("click", () => { input.value = ""; clear.style.display = "none"; closeInstantSearch?.(); doSearch(""); if (!isMobile() && !isTouch()) input.focus(); });
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
            navigateWithLoader(targetPath, bg, titleName, { id: selectedTitle.id, type: kind, item: selectedTitle });
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
    const curStyle = SETTINGS.get(SETTINGS.bgStyleKey, "flow") || "flow";
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
    const initSpeed = parseFloat(SETTINGS.get(SETTINGS.bgSpeedKey, "0.1"));
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
    const initGrain = parseFloat(SETTINGS.get(SETTINGS.bgGrainKey, "0.22"));
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

  bindToggle("#toggle-play-on-open", SETTINGS.playOnOpenKey, "Play on open");
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

  $("#vault-export-json-btn")?.addEventListener("click", () => {
    exportUserDataJSON();
    toast("Backup JSON downloaded");
  });

  $("#vault-export-csv-btn")?.addEventListener("click", () => {
    exportUserHistoryCSV();
    toast("Watch history CSV downloaded");
  });

  const vaultInput = $("#vault-file-input");
  $("#vault-import-btn")?.addEventListener("click", () => vaultInput?.click());
  vaultInput?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importAndMergeUserData(file);
      toast("Backup successfully merged and restored!");
    } catch (err) {
      toast(err.message || "Failed to import backup");
    } finally {
      vaultInput.value = "";
    }
  });

  $("#clear-progress")?.addEventListener("click", () => {
    showConfirmModal("Clear Continue Watching?", "Are you sure you want to remove all titles from continue watching?", () => {
      const prev = Progress.get();
      safeRemoveItem(Progress.key);
      showUndoToast("Continue watching cleared", () => {
        Progress.saveAll(prev);
        toast("Continue watching restored");
      });
    });
  });

  $("#clear-list")?.addEventListener("click", () => {
    showConfirmModal("Clear My List?", "Are you sure you want to remove all saved titles from your watchlist?", () => {
      const prev = MyList.get();
      safeRemoveItem(MyList.key);
      if (typeof updateWatchlistBadge === "function") updateWatchlistBadge();
      showUndoToast("My List cleared", () => {
        MyList.save(prev);
        toast("My List restored");
      });
    });
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

  // Concurrency-capped enricher (max 6 parallel requests)
  async function enrichItemsConcurrently(items, mapFn, concurrency = 6) {
    const results = new Array(items.length);
    let index = 0;
    const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await mapFn(items[i]);
      }
    });
    await Promise.all(workers);
    return results;
  }

  const syncControlsUI = () => {
    const filterRow = $("#list-filter-chips");
    const newFolderBtn = $("#btn-new-folder");
    const sortSelect = $("#list-sort-select");

    // Hide or show type chips, sort select, and New Folder button according to active tab
    if (filterRow) filterRow.style.display = (currentTab === "watchlist" || currentTab === "history" || currentTab === "folder_items") ? "" : "none";
    if (sortSelect) sortSelect.style.display = (currentTab === "watchlist" || currentTab === "history" || currentTab === "folder_items") ? "" : "none";
    if (newFolderBtn) newFolderBtn.style.display = currentTab === "folders" ? "" : "none";

    // Update aria-selected on tab buttons
    $$(".list-tab-btn").forEach(t => {
      const isAct = t.dataset.tab === currentTab || (currentTab === "folder_items" && t.dataset.tab === "folders");
      t.classList.toggle("active", isAct);
      t.setAttribute("aria-selected", String(isAct));
    });
  };

  const loadData = async () => {
    syncControlsUI();

    if (currentTab === "watchlist") {
      const stored = MyList.get();
      if (!stored.length) {
        emptyState("Your watchlist is empty", "Add movies and series using the + icon on their cards.");
        if (wlCount) wlCount.textContent = "0";
        return;
      }
      if (wlCount) wlCount.textContent = stored.length;

      // Render stored data immediately so user never waits with an empty screen
      loadedItems = stored.map(s => ({
        id: s.id,
        _type: s.type || (s.title ? "movie" : "tv"),
        title: s.title || s.name || "Untitled",
        name: s.name || s.title || "Untitled",
        poster_path: s.poster || s.poster_path || "",
        backdrop_path: s.backdrop_path || "",
        release_date: s.release_date || "",
        first_air_date: s.first_air_date || "",
        vote_average: s.vote_average || 0
      }));
      renderListGrid();

      // Enrich in background with max concurrency 6; never drop item on network failure
      enrichItemsConcurrently(stored, async (i) => {
        try {
          const detail = await tmdb(i.type === "tv" ? `/tv/${i.id}` : `/movie/${i.id}`);
          return { ...detail, _type: i.type || "movie" };
        } catch {
          return {
            id: i.id,
            _type: i.type || "movie",
            title: i.title || "Untitled",
            poster_path: i.poster || i.poster_path || ""
          };
        }
      }, 6).then(enriched => {
        loadedItems = dedupeItems(enriched);
        renderListGrid();
      });

    } else if (currentTab === "history") {
      const prog = Progress.get();
      const progList = Object.values(prog || {})
        .filter(i => i && (i.id || i.mediaId))
        .sort((a, b) => (b.savedAt || b.lastUpdated || 0) - (a.savedAt || a.lastUpdated || 0));

      if (!progList.length) {
        emptyState("No watch history", "Start watching titles and they will appear here.");
        return;
      }

      // Render stored progress records immediately
      historyItems = progList.map(p => ({
        id: p.id || p.mediaId,
        _type: (p.mediaType || p.type) === "tv" ? "tv" : "movie",
        title: p.title || p.name || "Untitled",
        name: p.name || p.title || "Untitled",
        poster_path: p.poster_path || p.poster || "",
        _progress: p.progress || 0,
        savedAt: p.savedAt || 0
      }));
      renderListGrid();

      // Enrich history details with concurrency 6 without dropping on error
      enrichItemsConcurrently(progList, async (p) => {
        const mType = (p.mediaType || p.type) === "tv" ? "tv" : "movie";
        const mId = p.id || p.mediaId;
        try {
          const d = await tmdb(`/${mType}/${mId}`);
          return { ...d, _type: mType, _progress: p.progress, savedAt: p.savedAt };
        } catch {
          return {
            id: mId,
            _type: mType,
            title: p.title || "Untitled",
            poster_path: p.poster_path || "",
            _progress: p.progress,
            savedAt: p.savedAt
          };
        }
      }, 6).then(enriched => {
        historyItems = dedupeItems(enriched);
        renderListGrid();
      });

    } else if (currentTab === "folders") {
      const fList = Folders.get();
      if (!fList.length) {
        emptyState("No folders yet", "Create custom collections to organize your favorite titles.");
        return;
      }
      grid.textContent = "";
      if (status) status.textContent = `${fList.length} ${fList.length === 1 ? "folder" : "folders"}`;

      fList.forEach(f => {
        const c = document.createElement("div");
        c.className = "folder-card";
        c.setAttribute("role", "button");
        c.setAttribute("tabindex", "0");
        c.setAttribute("aria-label", `Folder: ${f.name}, ${f.items.length} items`);
        c.style = "position:relative;background:var(--bg-2);border-radius:16px;padding:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform 0.2s var(--ease), background 0.2s var(--ease);box-shadow:0 4px 14px rgba(0,0,0,0.12);border:1px solid var(--border-2);outline:none";

        c.innerHTML = `
          <div style="color:var(--accent);margin-bottom:12px">${ICONS.list}</div>
          <h3 style="font-size:1.1rem;margin-bottom:6px;color:var(--text);font-weight:800">${esc(f.name)}</h3>
          <p style="font-size:0.85rem;color:var(--text-2);margin:0 0 14px">${f.items.length} ${f.items.length === 1 ? "item" : "items"}</p>
          <div style="display:flex;gap:6px;margin-top:auto" class="folder-actions-row">
            <button type="button" class="btn-ghost folder-rename-btn" style="padding:6px 12px;font-size:0.78rem" title="Rename folder">Rename</button>
            <button type="button" class="btn-ghost folder-delete-btn" style="padding:6px 12px;font-size:0.78rem;color:#ef4444" title="Delete folder">Delete</button>
          </div>
        `;

        // Card click / enter / space navigation
        const openFolder = () => {
          currentFolderId = f.id;
          currentTab = "folder_items";
          loadData();
        };

        c.addEventListener("click", e => {
          if (e.target.closest(".folder-rename-btn, .folder-delete-btn")) return;
          openFolder();
        });

        c.addEventListener("keydown", e => {
          if (e.target.closest(".folder-rename-btn, .folder-delete-btn")) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFolder();
          }
        });

        // Rename folder
        c.querySelector(".folder-rename-btn")?.addEventListener("click", e => {
          e.stopPropagation();
          const newName = prompt("Rename folder to:", f.name);
          if (newName && newName.trim() && newName.trim() !== f.name) {
            Folders.renameFolder(f.id, newName);
            toast("Folder renamed");
            loadData();
          }
        });

        // Delete folder
        c.querySelector(".folder-delete-btn")?.addEventListener("click", e => {
          e.stopPropagation();
          showConfirmModal("Delete Folder?", `Delete folder "${f.name}" and all organized contents?`, () => {
            Folders.removeFolder(f.id);
            toast("Folder deleted");
            loadData();
          });
        });

        grid.appendChild(c);
      });

    } else if (currentTab === "folder_items") {
      const fList = Folders.get();
      const folder = fList.find(f => f.id === currentFolderId);
      if (!folder) { currentTab = "folders"; return loadData(); }

      const headerBar = document.createElement("div");
      headerBar.style = "grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px;flex-wrap:wrap";
      headerBar.innerHTML = `
        <button type="button" class="btn-play folder-back-btn" style="padding:8px 16px;background:var(--bg-2);color:var(--text);font-size:0.88rem">← Back to Folders</button>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0">${esc(folder.name)}</h2>
      `;

      headerBar.querySelector(".folder-back-btn")?.addEventListener("click", () => {
        currentTab = "folders";
        currentFolderId = null;
        loadData();
      });

      if (!folder.items.length) {
        emptyState(`Folder: ${esc(folder.name)}`, "This folder is currently empty.");
        grid.prepend(headerBar);
        return;
      }

      // Render stored folder items immediately
      loadedItems = folder.items.map(i => ({
        id: i.id,
        _type: i.type || "movie",
        title: i.title || "Untitled",
        name: i.title || "Untitled",
        poster_path: i.poster || i.poster_path || ""
      }));
      renderListGrid(headerBar);

      // Enrich folder items concurrently
      enrichItemsConcurrently(folder.items, async (i) => {
        try {
          const d = await tmdb(i.type === "tv" ? `/tv/${i.id}` : `/movie/${i.id}`);
          return { ...d, _type: i.type || "movie" };
        } catch {
          return {
            id: i.id,
            _type: i.type || "movie",
            title: i.title || "Untitled",
            poster_path: i.poster || i.poster_path || ""
          };
        }
      }, 6).then(enriched => {
        loadedItems = dedupeItems(enriched);
        renderListGrid(headerBar);
      });
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
      items.sort((a, b) => (b.release_date || b.first_air_date || "").localeCompare(a.release_date || a.first_air_date || ""));
    }

    if (status && currentTab !== "folder_items") {
      status.textContent = `${items.length} ${items.length === 1 ? "title" : "titles"}`;
    } else if (status && currentTab === "folder_items") {
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

      // In folder view: add "Remove from folder" action
      if (currentTab === "folder_items") {
        const quick = card.querySelector(".card-quick");
        if (quick) {
          const rmFolderBtn = document.createElement("button");
          rmFolderBtn.type = "button";
          rmFolderBtn.className = "card-icon-btn cw-remove-btn";
          rmFolderBtn.title = "Remove from folder";
          rmFolderBtn.setAttribute("aria-label", "Remove from folder");
          rmFolderBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
          rmFolderBtn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            Folders.removeItem(currentFolderId, it.id, it._type);
            card.remove();
            toast("Removed from folder");
            loadData();
          });
          quick.appendChild(rmFolderBtn);
        }
      }

      if (currentTab === "history" && it._progress) {
        const pbar = document.createElement("div");
        pbar.className = "card-progress-bar";
        pbar.innerHTML = `<div class="card-progress-fill" style="width:${Math.min(it._progress, 100)}%"></div>`;
        card.appendChild(pbar);
      }
      grid.appendChild(card);
    });
  };

  // Wire tab buttons
  const tabs = $$(".list-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      currentTab = tab.dataset.tab;
      currentFolderId = null;
      loadData();
    });
  });

  // Wire filter chips
  const filterRow = $("#list-filter-chips");
  if (filterRow) {
    filterRow.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        filterRow.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("on"));
        chip.classList.add("on");
        currentType = chip.dataset.type || "all";
        renderListGrid();
      });
    });
  }

  // Wire sort dropdown (Item 14)
  const sortSelect = $("#list-sort-select");
  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener("change", e => {
      currentSort = e.target.value;
      renderListGrid();
    });
  }

  // Wire New Folder button
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

function exportUserDataJSON() {
  const data = {
    version: "3.2",
    exportedAt: new Date().toISOString(),
    watchlist: MyList.get(),
    folders: Folders.get(),
    progress: Progress.get(),
    settings: {
      accent: SETTINGS.get(SETTINGS.accentKey),
      theme: SETTINGS.get(SETTINGS.themeKey),
      prefLang: SETTINGS.get(SETTINGS.prefLangKey),
      bgStyle: SETTINGS.get(SETTINGS.bgStyleKey),
      provider: getProvider()
    }
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `OsirisWatch_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportUserHistoryCSV() {
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
  link.remove();
}

function importAndMergeUserData(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected"));
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") {
          return reject(new Error("Invalid backup format: root must be an object"));
        }

        // Validate & Merge Watchlist
        if (Array.isArray(parsed.watchlist)) {
          const currentList = MyList.get();
          const existingMap = new Map();
          currentList.forEach(item => {
            if (item && item.id) existingMap.set(`${item.type || 'movie'}_${item.id}`, item);
          });
          parsed.watchlist.forEach(item => {
            if (item && item.id) {
              const key = `${item.type || 'movie'}_${item.id}`;
              if (!existingMap.has(key)) {
                existingMap.set(key, item);
              }
            }
          });
          MyList.save([...existingMap.values()]);
        }

        // Validate & Merge Folders
        if (Array.isArray(parsed.folders)) {
          const currentFolders = Folders.get();
          const folderMap = new Map(currentFolders.map(f => [f.id, f]));
          parsed.folders.forEach(f => {
            if (f && f.name && f.id) {
              if (!folderMap.has(f.id)) {
                folderMap.set(f.id, f);
              } else {
                // Merge items inside folder
                const existingF = folderMap.get(f.id);
                const itemKeys = new Set((existingF.items || []).map(it => `${it.type}_${it.id}`));
                (f.items || []).forEach(it => {
                  if (it && it.id && !itemKeys.has(`${it.type}_${it.id}`)) {
                    existingF.items = existingF.items || [];
                    existingF.items.push(it);
                  }
                });
              }
            }
          });
          Folders.save([...folderMap.values()]);
        }

        // Validate & Merge Progress
        if (parsed.progress && typeof parsed.progress === "object" && !Array.isArray(parsed.progress)) {
          const currentProg = Progress.get();
          Object.keys(parsed.progress).forEach(k => {
            const incoming = parsed.progress[k];
            if (incoming && incoming.id && Number.isFinite(incoming.progress)) {
              const existing = currentProg[k];
              if (!existing || (incoming.savedAt || 0) > (existing.savedAt || 0)) {
                currentProg[k] = incoming;
              }
            }
          });
          Progress.saveAll(currentProg);
        }

        // Apply settings if present
        if (parsed.settings && typeof parsed.settings === "object") {
          if (parsed.settings.accent) SETTINGS.set(SETTINGS.accentKey, parsed.settings.accent);
          if (parsed.settings.prefLang) SETTINGS.set(SETTINGS.prefLangKey, parsed.settings.prefLang);
          if (parsed.settings.provider) setProvider(parsed.settings.provider);
          applyGlobalSettings();
        }

        resolve(true);
      } catch (err) {
        reject(new Error("Malformed JSON backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}


function showConfirmModal(title, msg, onConfirm) {
  let modal = $("#confirm-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "confirm-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest(".confirm-cancel-btn")) closeModal(modal);
    });
  }
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" style="width:min(360px,92vw);padding:24px;border-radius:20px;background:var(--bg-1);border:1px solid var(--border-2);text-align:center">
      <h3 style="margin:0 0 10px;font-size:1.15rem;font-weight:800;color:var(--text)">${esc(title)}</h3>
      <p style="margin:0 0 20px;font-size:0.88rem;color:var(--text-2);line-height:1.4">${esc(msg)}</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button type="button" class="btn-ghost confirm-cancel-btn" style="flex:1;min-height:42px">Cancel</button>
        <button type="button" class="btn-play confirm-ok-btn" style="flex:1;min-height:42px;background:#ef4444;color:#fff">Clear</button>
      </div>
    </div>
  `;
  modal.querySelector(".confirm-ok-btn")?.addEventListener("click", () => {
    closeModal(modal);
    onConfirm();
  });
  openModal(modal);
}

function showUndoToast(msg, onUndo, timeout = 5000) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.classList.toggle("toast-mobile", isMobile());
  t.innerHTML = `<span>${esc(msg)}</span><button type="button" class="toast-undo-btn" style="margin-left:14px;background:none;border:none;color:var(--accent);font-weight:800;cursor:pointer;padding:2px 6px">Undo</button>`;
  t.classList.add("show");
  clearTimeout(t._timer);

  const undoBtn = t.querySelector(".toast-undo-btn");
  let undone = false;
  undoBtn?.addEventListener("click", () => {
    if (undone) return;
    undone = true;
    clearTimeout(t._timer);
    t.classList.remove("show");
    onUndo();
  }, { once: true });

  t._timer = setTimeout(() => {
    t.classList.remove("show");
  }, timeout);
}


/* =========================================================================
   PHASE 5-8 UX SUITE & MOBILE EPISODES CUSTOM INTEGRATION
   ========================================================================= */

// Lite Mode (Item 35)
function isLiteMode() {
  const manual = SETTINGS.get("orc_lite_mode", "");
  if (manual === "1") return true;
  if (manual === "0") return false;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType === "2g")) return true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
  return false;
}

function applyLiteMode() {
  const active = isLiteMode();
  document.documentElement.classList.toggle("lite-mode", active);
  if (typeof syncPageBackdrop === "function") syncPageBackdrop();
  const toggle = $("#settings-lite-mode");
  if (toggle) {
    toggle.classList.toggle("active", active);
    toggle.setAttribute("aria-checked", active ? "true" : "false");
  }
}

// System Theme Support (Item 40)
function resolveEffectiveTheme() {
  const pref = SETTINGS.get(SETTINGS.themeKey, "system");
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
}

// Mobile New Episodes Dedicated Sheet
function openMobileNotificationSheet(recentEpisodes) {
  let sheet = $("#notif-mobile-sheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "notif-mobile-sheet";
    sheet.className = "notif-mobile-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "New Episodes");
    sheet.innerHTML = `
      <div class="notif-mobile-card">
        <div class="notif-mobile-header">
          <div>
            <h3 class="notif-mobile-title">New Episodes</h3>
            <p style="font-size:0.78rem;color:var(--text-2);margin-top:2px;">Aired in the last 7 days from your watchlist</p>
          </div>
          <button type="button" class="notif-mobile-close" id="notif-mobile-close" aria-label="Close">✕</button>
        </div>
        <div class="notif-mobile-list" id="notif-mobile-list"></div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.addEventListener("click", e => {
      if (e.target === sheet || e.target.closest("#notif-mobile-close")) {
        sheet.classList.remove("open");
      }
    });
  }

  const listEl = sheet.querySelector("#notif-mobile-list");
  if (listEl) {
    if (!recentEpisodes || !recentEpisodes.length) {
      listEl.innerHTML = `<div class="notif-empty-state" style="padding:28px 16px;text-align:center;color:var(--text-2);font-size:0.9rem;">No new episodes this week.<br><span style="font-size:0.8rem;color:var(--text-3);margin-top:6px;display:block;">Shows in your watchlist will notify you here when new episodes drop.</span></div>`;
    } else {
      listEl.innerHTML = recentEpisodes.map(({ show, ep }) => {
        const poster = show.poster ? `${IMG_W185}${show.poster}` : "/favicon.png";
        const airDate = ep.air_date ? new Date(ep.air_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recent";
        return `
          <a href="${routeUrl("tv")}?id=${show.id}&season=${ep.season_number}&episode=${ep.episode_number}" class="notif-ep-card">
            <img src="${poster}" class="notif-ep-thumb" alt="${esc(show.title)}" loading="lazy">
            <div class="notif-ep-info">
              <div class="notif-ep-show">${esc(show.title)}</div>
              <div class="notif-ep-desc">S${ep.season_number} · E${ep.episode_number}${ep.name ? ` - ${esc(ep.name)}` : ""}</div>
              <div class="notif-ep-time">${airDate}</div>
            </div>
            <span style="font-size:0.75rem;font-weight:700;color:var(--solid-fg);background:var(--solid-bg);padding:6px 12px;border-radius:999px;">Watch</span>
          </a>
        `;
      }).join("");
    }
  }

  sheet.classList.add("open");
}

// Command Palette (Ctrl+K and / hotkey) (Item A)
function initCommandPalette() {
  if (window._cmdPaletteInit) return;
  window._cmdPaletteInit = true;

  let backdrop = $("#cmd-palette-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "cmd-palette-backdrop";
    backdrop.className = "cmd-palette-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Command Palette");
    backdrop.innerHTML = `
      <div class="cmd-palette-dialog">
        <div class="cmd-palette-input-wrap">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" class="cmd-palette-input" id="cmd-palette-input" placeholder="Search titles, switch pages, or run quick actions…" autocomplete="off">
        </div>
        <div class="cmd-palette-list" id="cmd-palette-list">
          <button type="button" class="cmd-palette-item" data-action="list">📁 Go to My List</button>
          <button type="button" class="cmd-palette-item" data-action="theme">🌓 Toggle Theme</button>
          <button type="button" class="cmd-palette-item" data-action="surprise">🎲 Surprise Me</button>
          <button type="button" class="cmd-palette-item" data-action="settings">⚙️ Settings</button>
          <button type="button" class="cmd-palette-item" data-action="discord">💬 Join Discord Community</button>
        </div>
        <div class="cmd-palette-hint">
          <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd> to select · <kbd>Enter</kbd> to open</span>
          <span>Press <kbd>Esc</kbd> to dismiss</span>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  const input = backdrop.querySelector("#cmd-palette-input");
  const list = backdrop.querySelector("#cmd-palette-list");

  const openPalette = () => {
    backdrop.classList.add("open");
    input.value = "";
    renderDefaultCommands();
    setTimeout(() => input.focus(), 50);
  };

  const closePalette = () => {
    backdrop.classList.remove("open");
  };

  const renderDefaultCommands = () => {
    list.innerHTML = `
      <button type="button" class="cmd-palette-item" data-action="list">📁 Go to My List</button>
      <button type="button" class="cmd-palette-item" data-action="theme">🌓 Toggle Theme</button>
      <button type="button" class="cmd-palette-item" data-action="surprise">🎲 Surprise Me</button>
      <button type="button" class="cmd-palette-item" data-action="settings">⚙️ Settings</button>
      <button type="button" class="cmd-palette-item" data-action="discord">💬 Join Discord Community</button>
    `;
  };

  list.addEventListener("click", e => {
    const btn = e.target.closest(".cmd-palette-item");
    if (!btn) return;
    const action = btn.dataset.action;
    const url = btn.dataset.url;
    closePalette();
    if (url) {
      location.href = url;
    } else if (action === "list") {
      location.href = routeUrl("list");
    } else if (action === "settings") {
      location.href = routeUrl("settings");
    } else if (action === "discord") {
      window.open("https://discord.gg/yv8cVk8p4f", "_blank", "noopener");
    } else if (action === "surprise") {
      initSurpriseMe?.();
    } else if (action === "theme") {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "light" ? "dark" : "light";
      SETTINGS.set(SETTINGS.themeKey, next);
      applyGlobalSettings();
      toast(`Theme switched to ${next}`);
    }
  });

  let searchTimer = null;
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (!q) {
      renderDefaultCommands();
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        const res = await tmdb(`/search/multi?query=${encodeURIComponent(q)}&page=1`);
        const hits = (res?.results || []).filter(r => (r.media_type === "movie" || r.media_type === "tv") && (r.title || r.name)).slice(0, 6);
        if (!hits.length) {
          list.innerHTML = `<div style="padding:14px;color:var(--text-3);font-size:0.85rem;text-align:center;">No matching titles found. Press Enter to search on Discover.</div>`;
          return;
        }
        list.innerHTML = hits.map(hit => {
          const title = hit.title || hit.name;
          const type = hit.media_type === "tv" ? "tv" : "movie";
          const yr = (hit.release_date || hit.first_air_date || "").slice(0, 4);
          const url = `${routeUrl(type)}?id=${hit.id}`;
          return `<button type="button" class="cmd-palette-item" data-url="${url}">
            <span>🎬</span>
            <span style="flex:1;">${esc(title)} ${yr ? `<span style="color:var(--text-3);font-size:0.8rem;">(${yr})</span>` : ""}</span>
            <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-3);">${type}</span>
          </button>`;
        }).join("");
      } catch (err) {
        list.innerHTML = `<div style="padding:14px;color:var(--text-3);font-size:0.85rem;text-align:center;">Failed to search.</div>`;
      }
    }, 220);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      const firstItem = list.querySelector(".cmd-palette-item");
      if (firstItem && firstItem.dataset.url) {
        closePalette();
        location.href = firstItem.dataset.url;
      } else if (q) {
        closePalette();
        location.href = `${routeUrl("search")}?q=${encodeURIComponent(q)}`;
      }
    } else if (e.key === "Escape") {
      closePalette();
    }
  });

  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) closePalette();
  });

  // Hotkey listener: Ctrl+K, Cmd+K, or "/"
  window.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openPalette();
    } else if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openKeyboardHelpSheet();
    }
  });
}

// Keyboard Help Sheet (Item K)
function openKeyboardHelpSheet() {
  let modal = $("#keyboard-help-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "keyboard-help-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card glass-surface" style="max-width:480px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--text);">Keyboard Shortcuts</h3>
          <button type="button" class="modal-close" style="background:none;border:none;color:var(--text-2);cursor:pointer;font-size:1.1rem;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div class="kbd-shortcut-row"><span>Open command palette / Quick search</span><div><span class="kbd-key">Ctrl</span> + <span class="kbd-key">K</span> or <span class="kbd-key">/</span></div></div>
          <div class="kbd-shortcut-row"><span>Keyboard shortcuts help</span><span class="kbd-key">?</span></div>
          <div class="kbd-shortcut-row"><span>Close modal or player</span><span class="kbd-key">Esc</span></div>
          <div class="kbd-shortcut-row"><span>Toggle play / pause (in stream)</span><span class="kbd-key">Space</span></div>
          <div class="kbd-shortcut-row"><span>Fullscreen toggle</span><span class="kbd-key">F</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest(".modal-close")) modal.classList.remove("open");
    });
  }
  modal.classList.add("open");
}

// Mood Picker Integration (Item I)
function initMoodPicker() {
  const picker = $("#mood-picker");
  if (!picker || picker._bound) return;
  picker._bound = true;

  const MOOD_PROMPTS = {
    cozy: "Warm, cozy feel-good movies and uplifting comforting series with heart",
    intense: "Heart-pounding thrillers, intense suspense and high-stakes mysteries",
    funny: "Hilarious comedies, witty laugh-out-loud sitcoms and satire",
    "mind-bending": "Mind-bending plot twists, psychological puzzles and time-travel mysteries",
    short: "Quick breezy under 95-minute watches, tightly paced films",
    family: "Wholesome family adventures, top-rated animated masterworks for all ages"
  };

  picker.addEventListener("click", e => {
    const chip = e.target.closest(".mood-chip");
    if (!chip) return;
    const mood = chip.dataset.mood;
    const prompt = MOOD_PROMPTS[mood] || mood;
    location.href = `${routeUrl("search")}?q=${encodeURIComponent(prompt)}&ai=1`;
  });
}

// Watchlist Shuffle Button (Item G)
function initWatchlistShuffle() {
  const shuffleBtn = $("#watchlist-shuffle-btn");
  if (!shuffleBtn || shuffleBtn._bound) return;
  shuffleBtn._bound = true;

  shuffleBtn.addEventListener("click", () => {
    const list = MyList.get();
    if (!list || !list.length) {
      toast("Your watchlist is empty. Save titles to shuffle!");
      return;
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    const type = pick.type === "tv" ? "tv" : "movie";
    toast(`Picked "${pick.title || "Title"}" for you!`);
    setTimeout(() => {
      location.href = `${routeUrl(type)}?id=${pick.id}`;
    }, 600);
  });
}

// Initialize Phase 5-8 features on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  applyLiteMode();
  initCommandPalette();
  initWatchlistShuffle();

  // Mobile episodes integration in topnav bell button
  const bellBtn = $("#topnav-bell-btn");
  if (bellBtn && !bellBtn._mobileBound) {
    bellBtn._mobileBound = true;
    bellBtn.addEventListener("click", async e => {
      if (isMobile()) {
        e.stopPropagation();
        e.preventDefault();
        const tvShows = MyList.get().filter(it => it.type === "tv" || it.media_type === "tv");
        const now = Date.now();
        const weekAgo = now - 7 * 86400000;
        const recent = [];
        await Promise.allSettled(tvShows.slice(0, 10).map(async show => {
          try {
            const d = await tmdb(`/tv/${show.id}`);
            const lastEp = d.last_episode_to_air;
            if (lastEp && lastEp.air_date) {
              const airTime = new Date(lastEp.air_date + "T00:00:00").getTime();
              if (airTime >= weekAgo && airTime <= now + 86400000) {
                recent.push({ show, ep: lastEp });
              }
            }
          } catch {}
        }));
        openMobileNotificationSheet(recent);
      }
    });
  }

  // Lite Mode toggle in settings
  const liteToggle = $("#settings-lite-mode");
  liteToggle?.addEventListener("click", () => {
    const cur = SETTINGS.get("orc_lite_mode", "") === "1";
    SETTINGS.set("orc_lite_mode", cur ? "0" : "1");
    applyLiteMode();
    toast(cur ? "Lite mode disabled" : "Lite mode enabled");
  });
});
