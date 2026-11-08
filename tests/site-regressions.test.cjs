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
  assert.deepEqual(urls, ["/", "/movie", "/tv", "/search", "/list", "/settings", "/dmca"].map(route => origin + route));
  assert.ok(read("robots.txt").includes(`Sitemap: ${origin}/sitemap.xml`));
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
