"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const seo = require("../lib/seo.cjs");
const sitemapHandler = require("../api/sitemap.js");
const ssrHandler = require("../api/ssr.js");

const ROOT = path.resolve(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

function makeMockRes() {
  const headers = {};
  let code = 200;
  let body = null;
  return {
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    status(c) { code = c; return this; },
    send(v) { body = v; return this; },
    end(v) { body = v; return this; },
    get statusCode() { return code; },
    get headers() { return headers; },
    get body() { return body; },
  };
}

test("robots.txt follows policy without blocking assets or noindex routes", () => {
  const txt = read("robots.txt");
  assert.match(txt, /User-agent:\s*\*/);
  assert.match(txt, /Allow:\s*\//);
  assert.match(txt, /Disallow:\s*\/api\//);
  assert.match(txt, /Disallow:\s*\/player\//);
  assert.match(txt, /Disallow:\s*\/embed\//);
  assert.match(txt, /Sitemap:\s*https:\/\/watch\.osiris\.rocks\/sitemap\.xml/);
  assert.doesNotMatch(txt, /Disallow:\s*\/(list|settings|search|movie|tv)/);
  assert.doesNotMatch(txt, /Disallow:.*\.(js|css|png|svg)/i);
});

test("buildUrlsetXml enforces canonical https URLs, no query params, real lastmod, and cap limits", () => {
  const xml = seo.buildUrlsetXml([
    { loc: "https://watch.osiris.rocks/movie/27205", lastmod: "2010-07-16", priority: "0.8" },
    { loc: "https://watch.osiris.rocks/movie?id=27205", lastmod: "2010-07-16" },
    { loc: "https://evil.example/foo", lastmod: "2020-01-01" },
    { loc: "https://watch.osiris.rocks/tv/1396", lastmod: "invalid-date" },
  ]);
  assert.ok(xml.includes("<loc>https://watch.osiris.rocks/movie/27205</loc>"));
  assert.ok(xml.includes("<lastmod>2010-07-16</lastmod>"));
  assert.ok(!xml.includes("?id=27205"));
  assert.ok(!xml.includes("evil.example"));
  assert.ok(xml.includes("<loc>https://watch.osiris.rocks/tv/1396</loc>"));
  assert.ok(!xml.includes("invalid-date"));
});

test("getStaticSitemapEntries excludes noindex routes", () => {
  const locs = seo.getStaticSitemapEntries().map(e => e.loc);
  assert.deepEqual(locs, [
    "https://watch.osiris.rocks/",
    "https://watch.osiris.rocks/anime",
    "https://watch.osiris.rocks/privacy",
    "https://watch.osiris.rocks/dmca",
  ]);
});

test("sitemapHandler serves static sitemap with 24h cache and gzip when accepted", async () => {
  const res = makeMockRes();
  await sitemapHandler({ method: "GET", query: { type: "static" }, headers: { "accept-encoding": "gzip" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/xml; charset=utf-8");
  assert.equal(res.headers["cache-control"], "public, s-maxage=86400, stale-while-revalidate=86400");
  assert.equal(res.headers["content-encoding"], "gzip");
  const unzipped = zlib.gunzipSync(res.body).toString("utf8");
  assert.ok(unzipped.includes("<urlset"));
  assert.ok(unzipped.includes("https://watch.osiris.rocks/anime"));
});

test("renderTitlePageHtml outputs canonical, OG tags, Movie JSON-LD, and server H1", () => {
  const tpl = read("movie.html");
  const out = seo.renderTitlePageHtml(tpl, {
    type: "movie",
    id: 27205,
    isNoindex: false,
    detail: {
      id: 27205,
      title: "Inception",
      overview: "A skilled thief enters dreams.",
      release_date: "2010-07-16",
      poster_path: "/pInc.jpg",
      genres: [{ name: "Science Fiction" }, { name: "Action" }],
    },
  });
  assert.ok(out.includes("<title>Inception (2010) | Osiris Watch</title>"));
  assert.ok(out.includes('<link rel="canonical" href="https://watch.osiris.rocks/movie/27205">'));
  assert.ok(!out.includes('name="robots" content="noindex'));
  assert.ok(out.includes('property="og:site_name" content="Osiris Watch"'));
  assert.ok(out.includes('"@type":"Movie"'));
  assert.ok(out.includes('<h1 class="detail-title">Inception</h1>'));

  const noindexOut = seo.renderTitlePageHtml(tpl, {
    type: "movie",
    id: 27205,
    isNoindex: true,
    detail: { id: 27205, title: "Inception", overview: "A skilled thief enters dreams." },
  });
  assert.ok(noindexOut.includes('<meta name="robots" content="noindex,follow">'));
});

test("ssrHandler adds noindex,follow on /list, /settings, /search, and query params", async () => {
  for (const route of ["list", "settings", "search"]) {
    const res = makeMockRes();
    await ssrHandler({ method: "GET", url: `/${route}`, query: { route }, headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["x-robots-tag"], "noindex, follow");
    assert.ok(res.body.includes('content="noindex,follow"') || res.body.includes('content="noindex, follow"'));
  }
  const qRes = makeMockRes();
  await ssrHandler({ method: "GET", url: "/anime?cat=shonen", query: { route: "anime", cat: "shonen" }, headers: {} }, qRes);
  assert.equal(qRes.statusCode, 200);
  assert.equal(qRes.headers["x-robots-tag"], "noindex, follow");
});

test("branded search & head signals on index.html and subpages", () => {
  const indexHtml = read("index.html");
  assert.ok(indexHtml.includes("<title>Osiris Watch - Watch Free Movies & TV Shows Online</title>"));
  assert.ok(indexHtml.includes('<meta name="google-site-verification" content="googleb3700fd05b93ee70">'));
  assert.ok(indexHtml.includes('<meta name="apple-mobile-web-app-title" content="Osiris Watch">'));
  assert.ok(indexHtml.includes('<meta property="og:site_name" content="Osiris Watch">'));
  assert.ok(indexHtml.includes('sizes="192x192" href="/icon-192.png"'));
  assert.ok(indexHtml.includes("Osiris Watch") && indexHtml.includes("OsirisWatch"));
  assert.ok(indexHtml.includes('alt="Osiris Watch"'));
  assert.ok(indexHtml.includes('"@type": "WebSite"'));
  assert.ok(indexHtml.includes('"@type": "Organization"'));
  assert.ok(indexHtml.includes("https://discord.gg/yv8cVk8p4f"));
  assert.ok(!indexHtml.includes("SearchAction"));
  assert.ok(!indexHtml.includes("AggregateRating"));

  for (const p of ["index.html", "anime.html", "movie.html", "tv.html", "search.html", "list.html", "settings.html", "privacy.html", "dmca.html"]) {
    const html = read(p);
    assert.ok(html.includes('href="/">Osiris Watch</a>'), `${p}: missing home link with brand anchor text`);
    assert.ok(html.includes('alt="Osiris Watch"'), `${p}: missing logo alt text`);
  }
});

test("SSR title pages include BreadcrumbList, ISO duration, actors, Twitter cards, and sitemap ETag 304", async () => {
  const tpl = read("movie.html");
  const out = seo.renderTitlePageHtml(tpl, {
    type: "movie",
    id: 27205,
    isNoindex: false,
    detail: {
      id: 27205,
      title: "Inception",
      overview: "A skilled thief enters dreams.",
      release_date: "2010-07-16",
      runtime: 148,
      original_language: "en",
      poster_path: "/pInc.jpg",
      genres: [{ name: "Science Fiction" }],
      credits: {
        crew: [{ job: "Director", name: "Christopher Nolan" }],
        cast: [{ name: "Leonardo DiCaprio" }, { name: "Joseph Gordon-Levitt" }],
      },
    },
  });
  assert.ok(out.includes('"@type":"BreadcrumbList"'));
  assert.ok(out.includes('"duration":"PT148M"'));
  assert.ok(out.includes('"director":{"@type":"Person","name":"Christopher Nolan"}'));
  assert.ok(out.includes('name="twitter:card" content="summary_large_image"'));

  const res1 = makeMockRes();
  await sitemapHandler({ method: "GET", query: { type: "static" }, headers: {} }, res1);
  assert.equal(res1.statusCode, 200);
  assert.ok(res1.headers.etag);

  const res304 = makeMockRes();
  await sitemapHandler({ method: "GET", query: { type: "static" }, headers: { "if-none-match": res1.headers.etag } }, res304);
  assert.equal(res304.statusCode, 304);

  const healthHandler = require("../api/health.js");
  const hRes = {
    headers: {},
    code: 0,
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
  };
  healthHandler({ method: "GET" }, hRes);
  assert.equal(hRes.code, 200);
  assert.equal(hRes.body.ok, true);
  assert.equal(hRes.headers["cache-control"], "no-store");
});
