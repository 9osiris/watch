"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const origin = "https://watch.osiris.rocks";
const pages = ["index", "movie", "tv", "search", "list", "settings", "dmca"];

function structuredSiteUrls(value) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => (key === "url" || key === "target") && typeof child === "string" ? [child] : structuredSiteUrls(child));
}

function routesContext(hostname, siteOrigin) {
  const script = read("orc-script.js");
  const snippet = script.slice(script.indexOf("const APP_ROUTES ="), script.indexOf("function pagePathMatches"));
  const context = vm.createContext({ URL, URLSearchParams, window: { location: { hostname, origin: siteOrigin } }, exports: {} });
  new vm.Script(snippet + "\nexports.routeUrl = routeUrl; exports.authRedirectUrl = authRedirectUrl;").runInContext(context);
  return context.exports;
}

test("published files contain no legacy site-origin URLs or exposed new credentials", () => {
  for (const name of fs.readdirSync(root).filter(name => /\.(html|js|json|xml|txt|md)$/.test(name))) {
    assert.doesNotMatch(read(name), /https?:\/\/(?:www\.)?osiris\.rocks(?=[/\s"'<]|$)/i, name);
    assert.doesNotMatch(read(name), /watch\.watch\.osiris\.rocks/i, name);
    assert.doesNotMatch(read(name), /ghp_[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]{20,}/, name);
  }
});

test("canonical URLs and structured data use the new origin and deployed clean routes", () => {
  const routes = new Set(["/", ...JSON.parse(read("vercel.json")).rewrites.map(rule => rule.source)]);
  for (const page of pages) {
    const html = read(`${page}.html`), canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `${page}: canonical is present`);
    assert.equal(canonical[1], origin + (page === "index" ? "/" : `/${page}`));
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      for (const siteUrl of structuredSiteUrls(JSON.parse(match[1]))) {
        const url = new URL(siteUrl);
        assert.equal(url.origin, origin);
        assert.ok(routes.has(url.pathname), `${page}: ${url.pathname} exists`);
      }
    }
  }
  assert.ok(read("index.html").includes(`${origin}/search?q={search_term_string}`));
});

test("sitemap and robots advertise the migrated clean URLs", () => {
  const urls = [...read("sitemap.xml").matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  // Phase 7 Item 44: /list and /settings removed from sitemap; /privacy added
  assert.deepEqual(urls, ["/", "/movie", "/tv", "/search", "/privacy", "/dmca"].map(route => origin + route));
  assert.ok(read("robots.txt").includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!read("robots.txt").includes("wfc"));
});

test("legacy-host redirects are restricted to the two old hosts and cannot loop on Watch", () => {
  const redirects = JSON.parse(read("vercel.json")).redirects.filter(rule => rule.has?.some(condition => condition.type === "host"));
  assert.equal(redirects.length, 2);
  assert.deepEqual(redirects.map(rule => rule.has[0].value), ["osiris.rocks", "www.osiris.rocks"]);
  redirects.forEach(rule => {
    assert.equal(rule.source, "/:path*");
    assert.equal(rule.destination, `${origin}/:path*`);
    assert.equal(rule.permanent, true);
    assert.notEqual(rule.has[0].value, new URL(origin).hostname);
  });
});

test("internal route helper generates clean URLs and preserves parameters", () => {
  const routes = routesContext("watch.osiris.rocks", origin);
  for (const name of pages.filter(page => page !== "index")) assert.equal(routes.routeUrl(name), `/${name}`);
  assert.equal(routes.routeUrl("home"), "/");
  assert.equal(routes.routeUrl("search", new URLSearchParams({ type: "ai", q: "space stories" })), "/search?type=ai&q=space+stories");
});

test("signup and recovery callback URLs use Watch while local development stays local", () => {
  for (const hostname of ["watch.osiris.rocks", "osiris.rocks", "www.osiris.rocks"]) assert.equal(routesContext(hostname, `https://${hostname}`).authRedirectUrl(), `${origin}/settings`);
  assert.equal(routesContext("127.0.0.1", "http://127.0.0.1:4175").authRedirectUrl(), "http://127.0.0.1:4175/settings");
  assert.match(read("orc-script.js"), /emailRedirectTo: authRedirectUrl\(\)/);
  assert.match(read("orc-script.js"), /redirectTo: authRedirectUrl\(\)/);
});

test("AI controls are accessible, new assets exist, and scripts compile", () => {
  const html = read("search.html");
  assert.match(html, /<option value="ai">AI Search \(Experimental\)<\/option>/);
  assert.match(html, /<button type="button" id="ai-search-submit"[^>]*hidden>Ask AI<\/button>/);
  assert.match(html, /id="search-status"[^>]*role="status"/);
  for (const name of ["backdrop.js", "ai-search-catalog.js", "ai-search-ui.js", "orc-script.js", "sw.js"]) assert.doesNotThrow(() => new vm.Script(read(name)), name);
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) if (!match[1].startsWith("http")) assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  assert.ok(html.indexOf('src="backdrop.js"') < html.indexOf('src="orc-script.js"'));
  assert.ok(html.indexOf('src="ai-search-catalog.js"') < html.indexOf('src="ai-search-ui.js"'));
  assert.ok(html.indexOf('src="ai-search-ui.js"') < html.indexOf('src="orc-script.js"'));
  assert.doesNotMatch(read("orc-script.js"), /async function aiSearch\(/);
  assert.match(read("settings.html"), /id="settings-backdrop-styles"/);
  assert.match(read("settings.html"), /id="toggle-bg-sync-accent"/);
});

test("service worker precaches AI assets, strips redirect flags on navigation, and leaves API responses to the network", async () => {
  const script = read("sw.js"), handlers = {}, context = vm.createContext({
    URL,
    Response,
    Promise,
    Map,
    Set,
    caches: {
      open: async () => ({
        match: async req => {
          const u = typeof req === "string" ? req : req.url;
          if (u.endsWith("/search")) {
            const r = new Response("<html>search</html>", { status: 200 });
            Object.defineProperty(r, "redirected", { value: true });
            return r;
          }
          return null;
        },
        put: async () => {},
      }),
    },
    fetch: async () => new Response("<html>net</html>", { status: 200 }),
    self: { location: { origin }, skipWaiting: async () => {}, clients: { claim: async () => {} }, addEventListener(type, callback) { handlers[type] = callback; } },
  });
  new vm.Script(script).runInContext(context);
  let intercepted = false;
  handlers.fetch({ request: { method: "GET", url: `${origin}/api/ai-search` }, respondWith() { intercepted = true; } });
  handlers.fetch({ request: { method: "POST", url: `${origin}/api/ai-search` }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false);
  for (const name of ["ai-search.css", "ai-search-catalog.js", "ai-search-ui.js"]) assert.ok(script.includes(`"/${name}"`));

  let navPromise = null;
  handlers.fetch({
    request: { method: "GET", mode: "navigate", url: `${origin}/search.html` },
    waitUntil() {},
    respondWith(p) { navPromise = p; },
  });
  const navRes = await navPromise;
  assert.equal(navRes.status, 200);
  assert.equal(navRes.redirected, false);
});

test("all pages include anti-flash dark bootstrap, pre-rendered topnav, and initial skeletons", () => {
  for (const page of pages) {
    const html = read(`${page}.html`);
    assert.match(html, /id="orc-critical-bg"/, `${page}: has critical dark background style`);
    assert.match(html, /document\.documentElement\.setAttribute\("data-theme"/, `${page}: has synchronous theme bootstrap`);
    assert.match(html, /<header class="topnav" id="topnav">/, `${page}: has unified topnav header`);
    assert.doesNotMatch(html, /<aside class="sidebar"/, `${page}: no legacy empty sidebar tag`);
  }
  assert.doesNotMatch(read("index.html"), /id="main-content"[^>]*opacity:\s*0/i);
  for (const page of ["index", "search", "list", "movie", "tv", "settings"]) {
    assert.match(read(`${page}.html`), /skeleton-card|skel-pulse/, `${page}: has pre-rendered skeletons`);
  }
  assert.doesNotMatch(read("orc-styles.css"), /:root:not\(\[data-theme="dark"\]\):not\(\[data-theme="light"\]\)/);
});

test("mobile interaction fixes: closeModal supports Elements, Surprise Me has no emoji/sparkle, and save/folder modals open cleanly", () => {
  const script = read("orc-script.js");
  const searchHtml = read("search.html");
  const styles = read("orc-styles.css");

  assert.match(script, /target instanceof Element/);
  assert.doesNotMatch(script, /🎲\s*Surprise Picker/);
  assert.match(script, /<span class="surprise-badge">Surprise Picker<\/span>/);
  assert.doesNotMatch(searchHtml, /id="surprise-me-btn"[\s\S]{0,220}M12 2L14\.5 9\.5L22 12/);
  assert.match(styles, /\.topnav\s*\{[^}]*pointer-events:\s*none\s*!important/);
  assert.match(styles, /\.topnav-logo\s*\{[^}]*pointer-events:\s*auto\s*!important/);
});

test("detail pages use seamless alpha-mask fade, ambient color bleed, persistent cache, and new OW Monolith branding", () => {
  const movieHtml = read("movie.html");
  const tvHtml = read("tv.html");
  const styles = read("orc-styles.css");
  const script = read("orc-script.js");
  const faviconSvg = read("favicon.svg");
  const manifest = JSON.parse(read("manifest.json"));

  assert.match(movieHtml, /id="hero-color-bleed-a"/);
  assert.match(movieHtml, /id="hero-color-bleed-b"/);
  assert.match(tvHtml, /id="hero-color-bleed-a"/);
  assert.match(tvHtml, /id="hero-color-bleed-b"/);

  assert.match(styles, /\.detail-hero\s*\{[\s\S]*?-webkit-mask-image:\s*linear-gradient\(to bottom/);
  assert.doesNotMatch(styles, /\.detail-hero-fade\s*\{[\s\S]*?var\(--bg\)/);

  assert.match(script, /function applyDetailBackdrop\(/);
  assert.match(script, /function consumeNavSeed\(/);
  assert.match(script, /orc_tmdb_cache_v2/);

  assert.match(faviconSvg, /id="owBlue"/);
  assert.match(faviconSvg, /id="owSteel"/);
  assert.equal(manifest.name, "Osiris Watch");

  assert.match(script, /const AIRecommendations =/);
  assert.match(script, /Since you watched/);
  assert.match(script, /If you watched/);
  assert.match(styles, /\.syw-seed-name/);
  assert.match(styles, /\.syw-ai-badge/);
  assert.doesNotMatch(styles, /#4f46e5|#818cf8|#c7d2fe|rgba\(49,\s*46,\s*129|rgba\(79,\s*70,\s*229/);
});

test('backdrop default settings match flow, 0.1x speed, and 22% grain', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');
  const html = fs.readFileSync(path.resolve(__dirname, '../settings.html'), 'utf8');

  assert.ok(script.includes('SETTINGS.get(SETTINGS.bgStyleKey, "flow") || "flow"'));
  assert.ok(script.includes('SETTINGS.get(SETTINGS.bgSpeedKey, "0.1")'));
  assert.ok(script.includes('SETTINGS.get(SETTINGS.bgGrainKey, "0.22")'));
  assert.ok(html.includes('id="settings-bg-speed" class="settings-range" min="0" max="2" step="0.1" value="0.1"'));
  assert.ok(html.includes('id="settings-bg-grain" class="settings-range" min="0" max="0.35" step="0.02" value="0.22"'));
  assert.ok(html.includes('id="settings-bg-speed-val" class="settings-range-val">0.1x</output>'));
  assert.ok(html.includes('id="settings-bg-grain-val" class="settings-range-val">22%</output>'));
});

test('mobile topnav centers OsirisWatch wordmark and hides on scroll down', () => {
  const styles = fs.readFileSync(path.resolve(__dirname, '../orc-styles.css'), 'utf8');
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');

  // Verify mobile styles center the brand and define nav-hidden transition
  assert.ok(styles.includes('justify-content: center !important;'));
  assert.ok(styles.includes('.topnav.nav-hidden {'));
  assert.ok(styles.includes('transform: translateY(calc(-100% - var(--safe-top)));'));

  // Verify mobile scroll logic toggles nav-hidden based on delta and scrollY
  assert.ok(script.includes('el.classList.add("nav-hidden");'));
  assert.ok(script.includes('el.classList.remove("nav-hidden");'));
});

test('Phase 1: Broken features regression suite', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');
  const searchHtml = fs.readFileSync(path.resolve(__dirname, '../search.html'), 'utf8');
  const settingsHtml = fs.readFileSync(path.resolve(__dirname, '../settings.html'), 'utf8');

  // 1. TV episode click calls $$(".ep-row")
  assert.ok(script.includes('$$(".ep-row").forEach(x => x.classList.remove("on"))'));

  // 2. AI search uses closeInstantSearch without typo
  assert.ok(script.includes('closeInstantSearch?.()'));
  assert.ok(!script.includes('closeInstant?.()'));

  // 3. Provider filter maps all required providers
  assert.ok(script.includes('paramount: 531'));
  assert.ok(script.includes('peacock: 386'));
  assert.ok(script.includes('crunchyroll: 283'));
  assert.ok(script.includes('amc: 528'));
  assert.ok(searchHtml.includes('value="paramount"'));
  assert.ok(searchHtml.includes('value="peacock"'));
  assert.ok(searchHtml.includes('value="crunchyroll"'));
  assert.ok(searchHtml.includes('value="amc"'));

  // 4. Genre filter maps Movie to TV IDs
  assert.ok(script.includes('gId === "28"'));
  assert.ok(script.includes('"10759"'));
  assert.ok(script.includes('"10765"'));

  // 5. Era, rating and sort filters with Newest date bounds & reset button
  assert.ok(script.includes('first_air_date.desc'));
  assert.ok(script.includes('primary_release_date.lte'));
  assert.ok(script.includes('Reset filters'));

  // 6. Channels search both movie & tv
  assert.ok(script.includes('type=all&provider='));

  // 7. No fake progress: 5 on play clicks; finished at >= 95 filtered out
  assert.ok(!script.includes('progress: 5'));
  assert.ok(script.includes('it.progress < 95'));
  assert.ok(script.includes('cw-remove-btn'));

  // 8. Progress tracking badge per provider
  assert.ok(script.includes('provider-track-badge on'));
  assert.ok(script.includes('provider-track-badge off'));

  // 9. Preferred language wired to tmdb and annotated in settings
  assert.ok(script.includes('language=${encodeURIComponent(prefLang)}'));
  assert.ok(settingsHtml.includes('Third-party stream providers serve embedded audio'));

  // 10. Notification bell populated with watchlist TV episodes
  assert.ok(script.includes('loadWatchlistEpisodes'));
  assert.ok(script.includes('last_episode_to_air'));

  // 11. Backup import/export in Settings under "Your data" with merge
  assert.ok(settingsHtml.includes('id="vault-export-json-btn"'));
  assert.ok(settingsHtml.includes('id="vault-export-csv-btn"'));
  assert.ok(settingsHtml.includes('id="vault-import-btn"'));
  assert.ok(script.includes('importAndMergeUserData'));
});

test('Phase 2: Data trust and list integrity regression suite', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');
  const listHtml = fs.readFileSync(path.resolve(__dirname, '../list.html'), 'utf8');

  // 12. List renders from stored data and caps concurrency at 6
  assert.ok(script.includes('enrichItemsConcurrently(stored'));
  assert.ok(script.includes(', 6)'));
  assert.ok(script.includes('updateWatchlistBadge()'));
  assert.ok(script.includes('renderHomeMyListRow()'));

  // 13. Confirm dialogs and undo toasts for clear list and clear continue watching
  assert.ok(script.includes('showConfirmModal("Clear Continue Watching?"'));
  assert.ok(script.includes('showConfirmModal("Clear My List?"'));
  assert.ok(script.includes('showUndoToast'));

  // 14. Sort select replaces newest chip; aria-selected updated on tab change
  assert.ok(listHtml.includes('id="list-sort-select"'));
  assert.ok(script.includes('t.setAttribute("aria-selected", String(isAct))'));

  // 15. Folders have keyboard support, rename, delete, and remove from folder
  assert.ok(script.includes('folder-rename-btn'));
  assert.ok(script.includes('folder-delete-btn'));
  assert.ok(script.includes('Folders.removeItem'));

  // 16. MyList string ID comparison
  assert.ok(script.includes('String(i.id) === String(id)'));
  assert.ok(script.includes('String(x.id) === String(item.id)'));

  // 17. Local date parsing, season 0 as Specials, re-enable play
  assert.ok(script.includes('s.season_number === 0 ? "Specials" :'));
  assert.ok(script.includes('parts.length === 3'));
  assert.ok(script.includes('playBtn.removeAttribute("disabled")'));

  // 18. Storage quota clears TMDB_STORAGE_KEY and toasts on failure
  assert.ok(script.includes('localStorage.removeItem(TMDB_STORAGE_KEY)'));
  assert.ok(script.includes('Storage full: could not save data.'));
});

test('Phase 3: Player and detail page integrity regression suite', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');
  const movieHtml = fs.readFileSync(path.resolve(__dirname, '../movie.html'), 'utf8');
  const styles = fs.readFileSync(path.resolve(__dirname, '../orc-styles.css'), 'utf8');
  const settingsHtml = fs.readFileSync(path.resolve(__dirname, '../settings.html'), 'utf8');

  // 19. Autoplay gated behind play-on-open setting or play click; play button starts playback
  assert.ok(script.includes('SETTINGS.playOnOpenKey'));
  assert.ok(settingsHtml.includes('id="toggle-play-on-open"'));
  assert.ok(script.includes('player-poster-splash'));

  // 20. Sandbox attribute on player iframe
  assert.ok(script.includes('iframe.setAttribute("sandbox"'));
  assert.ok(script.includes('allow-scripts allow-same-origin allow-presentation allow-forms'));

  // 21. Bad ID validation, clear error state with Retry and Go Home, never wipe player
  assert.ok(script.includes('isNaN(Number(rawId)) || Number(rawId) <= 0'));
  assert.ok(script.includes('detail-error-box'));
  assert.ok(script.includes('Could Not Load Details'));
  assert.ok(script.includes('Could Not Load Series'));

  // 22. Zero ads removed from metadata
  assert.ok(!movieHtml.includes('zero ads'));

  // 23. Space reservation for providers and keywords, real h1 retained with logo
  assert.ok(styles.includes('#watch-providers-host'));
  assert.ok(styles.includes('min-height: 48px'));
  assert.ok(styles.includes('#keywords-host'));
  assert.ok(styles.includes('min-height: 44px'));
  assert.ok(script.includes('<h1 class="sr-only">'));
});

test('Phase 4: Navigation, SEO and sharing regression suite', () => {
  const script = fs.readFileSync(path.resolve(__dirname, '../orc-script.js'), 'utf8');
  const styles = fs.readFileSync(path.resolve(__dirname, '../orc-styles.css'), 'utf8');
  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const searchHtml = fs.readFileSync(path.resolve(__dirname, '../search.html'), 'utf8');
  const movieHtml = fs.readFileSync(path.resolve(__dirname, '../movie.html'), 'utf8');
  const tvHtml = fs.readFileSync(path.resolve(__dirname, '../tv.html'), 'utf8');
  const listHtml = fs.readFileSync(path.resolve(__dirname, '../list.html'), 'utf8');
  const notFoundHtml = fs.readFileSync(path.resolve(__dirname, '../404.html'), 'utf8');
  const metaApiExists = fs.existsSync(path.resolve(__dirname, '../api/meta.js'));

  // 24. Nav links pre-rendered in static HTML across pages
  for (const [name, html] of [
    ['index.html', indexHtml],
    ['search.html', searchHtml],
    ['movie.html', movieHtml],
    ['tv.html', tvHtml],
    ['list.html', listHtml]
  ]) {
    assert.ok(html.includes('<nav class="topnav-links" aria-label="Primary">'), `${name} has static topnav-links`);
    assert.ok(html.includes('href="/" class="topnav-link'), `${name} has home link`);
    assert.ok(html.includes('href="/search" class="topnav-link'), `${name} has discover link`);
    assert.ok(html.includes('href="/list" class="topnav-link'), `${name} has list link`);
    assert.ok(html.includes('href="/settings" class="topnav-link'), `${name} has settings link`);
  }

  // 25. Mobile: visible labels under bottom bar icons, bookmark icon for My List, hidden burger
  assert.ok(script.includes('pill-nav-label'));
  assert.ok(script.includes('ICONS.bookmark'));
  assert.ok(styles.includes('.topnav-burger {\n    display: none !important;'));

  // 26. Scroll restore only on back/forward navigation using performance and pageshow
  assert.ok(script.includes('performance.getEntriesByType("navigation")'));
  assert.ok(script.includes('pageshow'));
  assert.ok(script.includes('waitForContentThenScroll'));

  // 27. /movie and /tv fallback redirects
  assert.ok(script.includes('location.replace(routeUrl("search") + "?type=movie")'));
  assert.ok(script.includes('location.replace(routeUrl("search") + "?type=tv")'));
  assert.ok(movieHtml.includes('content="0;url=/search?type=movie"'));
  assert.ok(tvHtml.includes('content="0;url=/search?type=tv"'));

  // 28. Per-title meta serverless endpoint, setMetaTags helper, and 404 page
  assert.ok(metaApiExists);
  assert.ok(script.includes('function setMetaTags('));
  assert.ok(notFoundHtml.includes('Lost in the Catalog'));
  assert.ok(notFoundHtml.includes('404'));

  // 29. Infinite scroll: end-of-results message, error retry row, and back-to-top
  assert.ok(script.includes('end-of-results'));
  assert.ok(script.includes('back-to-top-btn'));
  assert.ok(script.includes('infinite-error-row'));
  assert.ok(script.includes('retry-infinite-btn'));

  // 30. Discover: merged AI controls, All Years label, URL filter reflection
  assert.ok(!searchHtml.includes('id="ai-search-mode"'));
  assert.ok(searchHtml.includes('<option value="all">All Years</option>'));
  assert.ok(script.includes('syncFiltersToUrl'));

  // 31. Hero carousel pause button, focus & hidden pause, no aria-live on title
  assert.ok(indexHtml.includes('id="hero-pause-btn"'));
  assert.ok(!indexHtml.includes('id="hero-title" aria-live="polite"'));
  assert.ok(script.includes('initHeroPauseControls'));
  assert.ok(script.includes('document.addEventListener("visibilitychange"'));

  // 32. Cards: container div (no button inside link), unique save aria-label, aria-pressed, placeholder tile, 300ms hover prefetch
  assert.ok(script.includes('document.createElement("div")'));
  assert.ok(script.includes('card-link'));
  assert.ok(script.includes('aria-label="Save ${esc(title)}"'));
  assert.ok(script.includes('aria-pressed="${saved ? "true" : "false"}"'));
  assert.ok(script.includes('no-img-poster'));
  assert.ok(script.includes('hoverTimer = setTimeout(prefetchDetail, 300)'));
});

test("Phase 5: Performance regression suite", () => {
  // 33. Minification script & bundles
  assert.ok(fs.existsSync(path.join(root, "scripts", "minify.cjs")));
  assert.ok(fs.existsSync(path.join(root, "orc-styles.min.css")));
  assert.ok(fs.existsSync(path.join(root, "orc-script.min.js")));
  assert.ok(read("index.html").includes('rel="preload" href="/orc-styles.css" as="style"'));

  // 34. Supabase removed while accounts are disabled; ai-search-catalog only on search
  for (const page of ["index.html", "list.html", "movie.html", "tv.html", "settings.html", "dmca.html"]) {
    assert.ok(!read(page).includes("supabase-js"), `${page} should not load supabase`);
    assert.ok(!read(page).includes("ai-search-catalog.js"), `${page} should not load ai-search-catalog`);
  }
  assert.ok(read("search.html").includes("ai-search-catalog.js"));

  // 35. Lite Mode
  const css = read("orc-styles.css");
  const script = read("orc-script.js");
  assert.ok(css.includes("html.lite-mode"));
  assert.ok(script.includes("function isLiteMode()"));
  assert.ok(read("settings.html").includes('id="settings-lite-mode"'));

  // 36. 160px WebP provider logos, manifest icons, legacy deleted
  for (const prov of ["netflix", "disney", "primevideo", "appletv", "hbomax", "hulu", "paramount", "peacock", "crunchyroll", "amc"]) {
    assert.ok(fs.existsSync(path.join(root, "providers", `${prov}.webp`)), `provider ${prov}.webp exists`);
  }
  const manifest = JSON.parse(read("manifest.json"));
  const anyIcons = manifest.icons.filter(i => i.purpose === "any");
  const maskableIcons = manifest.icons.filter(i => i.purpose === "maskable");
  assert.ok(anyIcons.length >= 2, "Has any purpose icons");
  assert.ok(maskableIcons.length >= 2, "Has maskable purpose icons");
  assert.ok(!fs.existsSync(path.join(root, "IMG_7388.png")));
  assert.ok(!fs.existsSync(path.join(root, "IMG_7389.png")));
  assert.ok(!fs.existsSync(path.join(root, "IMG_7390.png")));

  // 37. Service Worker TMDB cache cap & offline navigation
  const sw = read("sw.js");
  assert.ok(sw.includes("TMDB_CACHE_MAX_ENTRIES"));
  assert.ok(sw.includes("/offline.html"));

  // 38. TMDB API Proxy
  assert.ok(fs.existsSync(path.join(root, "api", "tmdb.js")));
  assert.ok(script.includes("/api/tmdb?path="));
});

test("Phase 6: Accessibility regression suite", () => {
  const css = read("orc-styles.css");
  // 39. Raised --text-3 contrast
  assert.ok(css.includes("--text-3:        #8e8e99;"));
  assert.ok(css.includes("--text-3:        #52525b;"));

  // 40. System theme
  assert.ok(read("settings.html").includes('data-theme-val="system"'));
  assert.ok(read("orc-script.js").includes("resolveEffectiveTheme"));

  // 41. Skip-to-content links and labels
  for (const page of ["index.html", "search.html", "list.html", "movie.html", "tv.html", "settings.html", "privacy.html"]) {
    assert.ok(read(page).includes('class="skip-link"'), `${page} has skip link`);
    assert.ok(read(page).includes('id="main-content"'), `${page} has main-content anchor`);
  }
  assert.ok(read("list.html").includes('role="tabpanel"'));
});

test("Phase 7: Cleanup regression suite", () => {
  // 42. Deleted obsolete pages and removed Inspo comment
  assert.ok(!fs.existsSync(path.join(root, "OsirisCinema.html")));
  assert.ok(!fs.existsSync(path.join(root, "wfc.html")));
  assert.ok(!read("list.html").includes("Inspo Picture 1"));

  // 43. Privacy page
  assert.ok(fs.existsSync(path.join(root, "privacy.html")));
  for (const page of ["index.html", "search.html", "list.html", "movie.html", "tv.html", "settings.html", "dmca.html", "privacy.html"]) {
    assert.ok(read(page).includes('href="/privacy"'), `${page} footer links to privacy`);
  }

  // 44. Sitemap refresh
  const sitemap = read("sitemap.xml");
  assert.ok(sitemap.includes("2026-11-10"));
  assert.ok(!sitemap.includes("/list</loc>"));
  assert.ok(!sitemap.includes("/settings</loc>"));

  // 45. Plain-language update log
  assert.ok(read("orc-script.js").includes("WHAT'S NEW"));
  assert.ok(read("orc-script.js").includes("Cleaner design, mobile episode tracking, and faster streams"));
});

test("Phase 8 & UI Directives regression suite", () => {
  const indexHtml = read("index.html");
  const css = read("orc-styles.css");
  const script = read("orc-script.js");

  // Carousel controls: rounded play/pause, centered, no circle, at end of dots
  assert.ok(indexHtml.includes('rect x="5.5" y="4" width="4" height="16" rx="2"'));
  assert.ok(css.includes(".hero-pause-btn {"));
  assert.ok(css.includes("background: transparent !important;"));

  // Mobile wordmark scroll hide and centered
  assert.ok(css.includes(".topnav.nav-hidden {"));
  assert.ok(css.includes("transform: translateY(calc(-100% - var(--safe-top, 0px) - 8px)) !important;"));
  assert.ok(script.includes("requestAnimationFrame(updateScrollNav)"));

  // Safari memory guard: no per-card backdrop-filter layers on touch, no view-transition snapshots on touch
  assert.ok(css.includes("Safari / touch memory guard"));
  assert.ok(css.includes("@media (hover: hover) and (min-width: 769px) {\n  @view-transition {"));

  // TMDB proxy must never ship a made-up key and must announce itself so the client does not double-fetch
  const tmdbApi = read("api/tmdb.js");
  assert.ok(!tmdbApi.includes("e4f8d55ff703f8e560b2fc377ae5ee26"));
  assert.ok(tmdbApi.includes('"x-osiris-proxy"'));

  // Mobile dedicated New Episodes drawer
  assert.ok(script.includes("openMobileNotificationSheet"));
  assert.ok(css.includes(".notif-mobile-sheet"));

  // Generic purply AI goop removed
  assert.ok(css.includes(".ai-badge {"));
  assert.ok(css.includes("background: rgba(255, 255, 255, 0.08) !important;"));

  // Command palette (Ctrl+K and /)
  assert.ok(script.includes("initCommandPalette"));
  assert.ok(css.includes(".cmd-palette-backdrop"));

  // TV Progress rings & Next Up
  assert.ok(read("tv.html").includes('id="tv-play-next"'));
  assert.ok(css.includes(".tv-play-next-btn"));

  // Watchlist shuffle
  assert.ok(read("list.html").includes('id="watchlist-shuffle-btn"'));
  assert.ok(script.includes("initWatchlistShuffle"));

  // Keyboard shortcut help sheet (?)
  assert.ok(script.includes("openKeyboardHelpSheet"));
});

