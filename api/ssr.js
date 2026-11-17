"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  PAGE_CACHE_TTL_MS,
  fetchTmdb,
  sendWithOptionalGzip,
  setRobotsMeta,
  renderTitlePageHtml,
} = require("../lib/seo.cjs");

const ROOT = path.resolve(__dirname, "..");

const ROUTE_FILES = {
  home: "index.html",
  movie: "movie.html",
  tv: "tv.html",
  anime: "anime.html",
  search: "search.html",
  list: "list.html",
  settings: "settings.html",
  privacy: "privacy.html",
  dmca: "dmca.html",
};

const NOINDEX_ROUTES = new Set(["search", "list", "settings"]);

function readTemplate(fileName) {
  return fs.readFileSync(path.join(ROOT, fileName), "utf8");
}

function detectExtraQueryParams(req, ignoredKeys) {
  const rawUrl = String(req.url || "");
  const qIndex = rawUrl.indexOf("?");
  if (qIndex === -1) return false;
  const params = new URLSearchParams(rawUrl.slice(qIndex + 1));
  for (const key of params.keys()) {
    if (!ignoredKeys.has(key)) return true;
  }
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const q = req.query || {};
  const route = String(q.route || "home").toLowerCase();
  const fileName = ROUTE_FILES[route];
  if (!fileName) {
    res.status(404).end("Not Found");
    return;
  }

  try {
    let html = readTemplate(fileName);
    const hasExtraQuery = detectExtraQueryParams(req, new Set(["route", "id", "_ssr_q"]));
    const forceNoindex = q.noindex === "1" || NOINDEX_ROUTES.has(route) || hasExtraQuery;

    if (route === "movie" || route === "tv") {
      const id = String(q.id || "").trim();
      const numId = Number.parseInt(id, 10);
      if (Number.isInteger(numId) && numId > 0 && String(numId) === id) {
        const detail = await fetchTmdb(`/${route}/${numId}`, PAGE_CACHE_TTL_MS);
        if (!detail) {
          html = setRobotsMeta(html, "noindex,follow");
          res.setHeader("X-Robots-Tag", "noindex, follow");
          return sendWithOptionalGzip(req, res, 404, "text/html; charset=utf-8", html, "no-store");
        }
        const isPlayerOrQuery = hasExtraQuery || q.noindex === "1";
        html = renderTitlePageHtml(html, {
          type: route,
          id: numId,
          detail,
          isNoindex: isPlayerOrQuery,
        });
        if (isPlayerOrQuery) {
          res.setHeader("X-Robots-Tag", "noindex, follow");
          return sendWithOptionalGzip(req, res, 200, "text/html; charset=utf-8", html, "public, s-maxage=300, stale-while-revalidate=3600");
        }
        return sendWithOptionalGzip(req, res, 200, "text/html; charset=utf-8", html, "public, s-maxage=3600, stale-while-revalidate=86400");
      }
      html = setRobotsMeta(html, "noindex,follow");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return sendWithOptionalGzip(req, res, 200, "text/html; charset=utf-8", html, "public, s-maxage=300");
    }

    if (forceNoindex) {
      html = setRobotsMeta(html, "noindex,follow");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return sendWithOptionalGzip(req, res, 200, "text/html; charset=utf-8", html, "public, s-maxage=300");
    }

    return sendWithOptionalGzip(req, res, 200, "text/html; charset=utf-8", html, "public, s-maxage=3600, stale-while-revalidate=86400");
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).end("Internal Server Error");
  }
};
