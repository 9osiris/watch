"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const SITE_ORIGIN = "https://watch.osiris.rocks";
const BRAND = "Osiris Watch";
const DISCORD_URL = "https://discord.gg/yv8cVk8p4f";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_W500 = "https://image.tmdb.org/t/p/w500";
const DEFAULT_TMDB_KEY = "5622cafbfe8f8cfe358a29c53e19bba0";

const SITEMAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_SITEMAP_URLS = 9999;
const MAX_SITEMAP_BYTES = 49 * 1024 * 1024;
const DEFAULT_SITEMAP_CAP = 500;

const _cache = new Map();

function getTmdbKey() {
  return process.env.TMDB_KEY || process.env.TMDB_API_KEY || DEFAULT_TMDB_KEY;
}

function getSitemapCap(overrideCap) {
  const raw = overrideCap !== undefined ? overrideCap : process.env.SITEMAP_TITLE_CAP;
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SITEMAP_CAP;
  return Math.min(parsed, MAX_SITEMAP_URLS);
}

function escapeXml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function isValidIsoDate(val) {
  return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val.trim());
}

function getCached(key, ttlMs) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    _cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  if (_cache.size > 500) {
    const firstKey = _cache.keys().next().value;
    if (firstKey !== undefined) _cache.delete(firstKey);
  }
  _cache.set(key, { ts: Date.now(), value });
}

async function fetchTmdb(apiPath, ttlMs = SITEMAP_CACHE_TTL_MS) {
  const cacheKey = `tmdb:${apiPath}`;
  const hit = getCached(cacheKey, ttlMs);
  if (hit) return hit;

  const key = getTmdbKey();
  if (!key) return null;
  const sep = apiPath.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${apiPath}${sep}api_key=${encodeURIComponent(key)}&language=en-US`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": "OsirisWatch-SEO/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPopularTitles(kind, capOverride) {
  const cap = getSitemapCap(capOverride);
  const cacheKey = `titles:${kind}:${cap}`;
  const hit = getCached(cacheKey, SITEMAP_CACHE_TTL_MS);
  if (hit) return hit;

  const seen = new Set();
  const items = [];
  const maxPages = Math.min(Math.ceil(cap / 20), 500);

  for (let page = 1; page <= maxPages && items.length < cap; page++) {
    let endpoint;
    if (kind === "movies") {
      endpoint = `/discover/movie?sort_by=popularity.desc&include_adult=false&vote_count.gte=50&page=${page}`;
    } else if (kind === "tv") {
      endpoint = `/discover/tv?sort_by=popularity.desc&include_adult=false&vote_count.gte=30&without_genres=16&page=${page}`;
    } else if (kind === "anime") {
      endpoint = `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false&page=${page}`;
    } else {
      break;
    }

    const data = await fetchTmdb(endpoint, SITEMAP_CACHE_TTL_MS);
    const results = Array.isArray(data?.results) ? data.results : [];
    if (!results.length) break;

    for (const row of results) {
      if (items.length >= cap) break;
      const id = Number(row?.id);
      if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);

      const routeType = kind === "movies" ? "movie" : "tv";
      const rawDate = routeType === "movie"
        ? row.release_date
        : (row.last_air_date || row.first_air_date);
      items.push({
        id,
        loc: `${SITE_ORIGIN}/${routeType}/${id}`,
        lastmod: isValidIsoDate(rawDate) ? rawDate.trim() : null,
      });
    }
    if (data.total_pages && page >= Number(data.total_pages)) break;
  }

  setCached(cacheKey, items);
  return items;
}

function getFileLastmod(relPath) {
  try {
    const full = path.resolve(__dirname, "..", relPath);
    const stat = fs.statSync(full);
    return stat.mtime.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function getStaticSitemapEntries() {
  const staticPages = [
    { path: "/", file: "index.html", changefreq: "daily", priority: "1.0" },
    { path: "/anime", file: "anime.html", changefreq: "daily", priority: "0.9" },
    { path: "/privacy", file: "privacy.html", changefreq: "monthly", priority: "0.5" },
    { path: "/dmca", file: "dmca.html", changefreq: "monthly", priority: "0.5" },
  ];
  return staticPages.map(p => ({
    loc: `${SITE_ORIGIN}${p.path}`,
    lastmod: getFileLastmod(p.file),
    changefreq: p.changefreq,
    priority: p.priority,
  }));
}

function newestLastmod(entries) {
  let latest = null;
  for (const e of entries) {
    if (isValidIsoDate(e?.lastmod) && (!latest || e.lastmod > latest)) {
      latest = e.lastmod;
    }
  }
  return latest;
}

function buildSitemapIndexXml(children) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const child of children) {
    if (!child?.loc || !child.loc.startsWith(`${SITE_ORIGIN}/`)) continue;
    lines.push("  <sitemap>");
    lines.push(`    <loc>${escapeXml(child.loc)}</loc>`);
    if (isValidIsoDate(child.lastmod)) {
      lines.push(`    <lastmod>${escapeXml(child.lastmod)}</lastmod>`);
    }
    lines.push("  </sitemap>");
  }
  lines.push("</sitemapindex>");
  return lines.join("\n");
}

function buildUrlsetXml(entries) {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const footer = "</urlset>";
  const chunks = [header];
  let byteCount = Buffer.byteLength(header, "utf8") + Buffer.byteLength(footer, "utf8");
  let urlCount = 0;

  for (const entry of entries) {
    if (urlCount >= MAX_SITEMAP_URLS) break;
    const loc = String(entry?.loc || "");
    if (!loc.startsWith(`${SITE_ORIGIN}/`) || loc.includes("?")) continue;

    const parts = [
      "  <url>\n",
      `    <loc>${escapeXml(loc)}</loc>\n`,
    ];
    if (isValidIsoDate(entry.lastmod)) {
      parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`);
    }
    if (entry.changefreq) {
      parts.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>\n`);
    }
    if (entry.priority) {
      parts.push(`    <priority>${escapeXml(entry.priority)}</priority>\n`);
    }
    parts.push("  </url>\n");

    const block = parts.join("");
    const blockBytes = Buffer.byteLength(block, "utf8");
    if (byteCount + blockBytes > MAX_SITEMAP_BYTES) break;
    chunks.push(block);
    byteCount += blockBytes;
    urlCount++;
  }

  chunks.push(footer);
  return chunks.join("");
}

function computeEtag(bodyText) {
  return `"${crypto.createHash("sha1").update(String(bodyText || ""), "utf8").digest("hex").slice(0, 20)}"`;
}

function formatIsoDuration(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `PT${Math.round(n)}M`;
}

function sendWithOptionalGzip(req, res, statusCode, contentType, bodyText, cacheHeader) {
  res.setHeader("Content-Type", contentType);
  if (cacheHeader) res.setHeader("Cache-Control", cacheHeader);

  if (statusCode === 200 && String(contentType).includes("xml")) {
    const etag = computeEtag(bodyText);
    res.setHeader("ETag", etag);
    const inm = String(req?.headers?.["if-none-match"] || "");
    if (inm && inm.split(",").map(s => s.trim()).includes(etag)) {
      res.status(304);
      if (typeof res.send === "function") return res.send("");
      res.end("");
      return;
    }
  }

  const acceptEncoding = String(req?.headers?.["accept-encoding"] || "");
  if (/\bgzip\b/i.test(acceptEncoding)) {
    const gz = zlib.gzipSync(Buffer.from(bodyText, "utf8"));
    res.setHeader("Content-Encoding", "gzip");
    res.setHeader("Vary", "Accept-Encoding");
    res.status(statusCode);
    if (typeof res.send === "function") return res.send(gz);
    res.end(gz);
    return;
  }

  res.status(statusCode);
  if (typeof res.send === "function") return res.send(bodyText);
  res.end(bodyText);
}

function buildTitleJsonLd(type, canonicalUrl, detail) {
  const title = detail.title || detail.name || (type === "tv" ? "TV Series" : "Movie");
  const description = detail.overview || `Watch ${title} online in HD on ${BRAND}.`;
  const poster = detail.poster_path
    ? `${TMDB_IMG_W500}${detail.poster_path}`
    : `${SITE_ORIGIN}/icon-512.png`;
  const genres = Array.isArray(detail.genres)
    ? detail.genres.map(g => g?.name).filter(Boolean)
    : [];

  if (type === "tv") {
    const schema = {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      name: title,
      url: canonicalUrl,
      image: poster,
      description,
    };
    if (isValidIsoDate(detail.first_air_date)) schema.startDate = detail.first_air_date;
    if (Number.isInteger(detail.number_of_seasons)) schema.numberOfSeasons = detail.number_of_seasons;
    if (Number.isInteger(detail.number_of_episodes)) schema.numberOfEpisodes = detail.number_of_episodes;
    if (typeof detail.original_language === "string" && detail.original_language) schema.inLanguage = detail.original_language;
    if (genres.length) schema.genre = genres;
    const actors = (detail.credits?.cast || []).slice(0, 3).map(c => c?.name).filter(Boolean).map(n => ({ "@type": "Person", name: n }));
    if (actors.length) schema.actor = actors;
    return schema;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: title,
    url: canonicalUrl,
    image: poster,
    description,
  };
  if (isValidIsoDate(detail.release_date)) schema.datePublished = detail.release_date;
  const isoDur = formatIsoDuration(detail.runtime);
  if (isoDur) schema.duration = isoDur;
  if (typeof detail.original_language === "string" && detail.original_language) schema.inLanguage = detail.original_language;
  if (genres.length) schema.genre = genres;
  const director = (detail.credits?.crew || []).find(c => c?.job === "Director" && c?.name);
  if (director) schema.director = { "@type": "Person", name: director.name };
  const actors = (detail.credits?.cast || []).slice(0, 3).map(c => c?.name).filter(Boolean).map(n => ({ "@type": "Person", name: n }));
  if (actors.length) schema.actor = actors;
  return schema;
}

function buildBreadcrumbJsonLd(type, title, canonicalUrl) {
  const sectionName = type === "tv" ? "TV Shows" : "Movies";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND, item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: sectionName, item: `${SITE_ORIGIN}/${type}` },
      { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
    ],
  };
}

function replaceOrInsertHeadTag(html, regex, replacementTag) {
  if (regex.test(html)) {
    return html.replace(regex, replacementTag);
  }
  return html.replace("</head>", `  ${replacementTag}\n</head>`);
}

function setRobotsMeta(html, robotsContent) {
  const tag = `<meta name="robots" content="${escapeHtml(robotsContent)}">`;
  return replaceOrInsertHeadTag(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    tag
  );
}

function renderTitlePageHtml(templateHtml, { type, id, detail, isNoindex }) {
  const canonicalUrl = `${SITE_ORIGIN}/${type}/${id}`;
  const rawTitle = detail?.title || detail?.name || (type === "tv" ? "TV Series" : "Movie");
  const dateStr = type === "tv" ? detail?.first_air_date : detail?.release_date;
  const yearStr = typeof dateStr === "string" && /^\d{4}/.test(dateStr) ? dateStr.slice(0, 4) : "";
  const pageTitle = yearStr ? `${rawTitle} (${yearStr}) | ${BRAND}` : `${rawTitle} | ${BRAND}`;
  const description = (detail?.overview && detail.overview.trim())
    ? detail.overview.trim().slice(0, 300)
    : `Watch ${rawTitle} online in HD on ${BRAND}.`;
  const poster = detail?.poster_path
    ? `${TMDB_IMG_W500}${detail.poster_path}`
    : `${SITE_ORIGIN}/icon-512.png`;
  const ogType = type === "tv" ? "video.tv_show" : "video.movie";

  let out = templateHtml;
  out = replaceOrInsertHeadTag(out, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
  out = replaceOrInsertHeadTag(out, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  out = replaceOrInsertHeadTag(out, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`);

  if (isNoindex) {
    out = setRobotsMeta(out, "noindex,follow");
  } else {
    out = out.replace(/\s*<meta\s+name=["']robots["'][^>]*>\r?\n?/i, "\n");
  }

  const ogTags = [
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:title" content="${escapeHtml(pageTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:image" content="${escapeHtml(poster)}">`,
    `<meta property="og:image:alt" content="${escapeHtml(rawTitle)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(poster)}">`,
  ].join("\n  ");

  out = out.replace(/<meta\s+(?:property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>\r?\n?/gi, "");
  out = out.replace("</head>", `  ${ogTags}\n</head>`);

  if (detail && !isNoindex) {
    const jsonLd = buildTitleJsonLd(type, canonicalUrl, detail);
    const breadcrumbLd = buildBreadcrumbJsonLd(type, rawTitle, canonicalUrl);
    const ldBlock = `<script type="application/ld+json">\n  ${safeJsonLd(jsonLd)}\n  </script>\n  <script type="application/ld+json">\n  ${safeJsonLd(breadcrumbLd)}\n  </script>`;
    out = replaceOrInsertHeadTag(out, /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i, ldBlock);
  }

  if (detail) {
    const genresHtml = Array.isArray(detail.genres) && detail.genres.length
      ? `<span>${escapeHtml(detail.genres.map(g => g.name).filter(Boolean).slice(0, 3).join(", "))}</span>`
      : "";
    const metaParts = [
      yearStr ? `<span>${escapeHtml(yearStr)}</span>` : "",
      genresHtml,
    ].filter(Boolean).join("");
    const serverHeader = `<div id="detail-header">
      <h1 class="detail-title">${escapeHtml(rawTitle)}</h1>
      ${metaParts ? `<div class="detail-meta">${metaParts}</div>` : ""}
      <p class="detail-overview">${escapeHtml(description)}</p>
    </div>`;
    out = out.replace(
      /<div id="detail-header">\s*<div class="detail-skel-wrap">[\s\S]*?<div class="detail-skel-actions">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i,
      serverHeader
    );
  }

  return out;
}

module.exports = {
  SITE_ORIGIN,
  BRAND,
  DISCORD_URL,
  SITEMAP_CACHE_TTL_MS,
  PAGE_CACHE_TTL_MS,
  getSitemapCap,
  escapeXml,
  escapeHtml,
  safeJsonLd,
  isValidIsoDate,
  fetchTmdb,
  fetchPopularTitles,
  getStaticSitemapEntries,
  newestLastmod,
  buildSitemapIndexXml,
  buildUrlsetXml,
  sendWithOptionalGzip,
  computeEtag,
  formatIsoDuration,
  buildTitleJsonLd,
  buildBreadcrumbJsonLd,
  setRobotsMeta,
  renderTitlePageHtml,
  _clearCacheForTest: () => _cache.clear(),
};
