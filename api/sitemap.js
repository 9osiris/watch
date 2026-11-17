"use strict";

const {
  SITE_ORIGIN,
  fetchPopularTitles,
  getStaticSitemapEntries,
  newestLastmod,
  buildSitemapIndexXml,
  buildUrlsetXml,
  sendWithOptionalGzip,
} = require("../lib/seo.cjs");

const CACHE_24H = "public, s-maxage=86400, stale-while-revalidate=86400";

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const query = req.query || {};
  const type = String(query.type || "index").toLowerCase();

  try {
    if (type === "static") {
      const xml = buildUrlsetXml(getStaticSitemapEntries());
      return sendWithOptionalGzip(req, res, 200, "application/xml; charset=utf-8", xml, CACHE_24H);
    }

    if (type === "movies" || type === "tv" || type === "anime") {
      const items = await fetchPopularTitles(type);
      const entries = items.map(item => ({
        loc: item.loc,
        lastmod: item.lastmod,
        changefreq: type === "movies" ? "weekly" : "daily",
        priority: "0.8",
      }));
      const xml = buildUrlsetXml(entries);
      return sendWithOptionalGzip(req, res, 200, "application/xml; charset=utf-8", xml, CACHE_24H);
    }

    if (type === "index") {
      const staticEntries = getStaticSitemapEntries();
      const [movies, tv, anime] = await Promise.all([
        fetchPopularTitles("movies"),
        fetchPopularTitles("tv"),
        fetchPopularTitles("anime"),
      ]);
      const indexXml = buildSitemapIndexXml([
        { loc: `${SITE_ORIGIN}/sitemap-static.xml`, lastmod: newestLastmod(staticEntries) },
        { loc: `${SITE_ORIGIN}/sitemap-movies.xml`, lastmod: newestLastmod(movies) },
        { loc: `${SITE_ORIGIN}/sitemap-tv.xml`, lastmod: newestLastmod(tv) },
        { loc: `${SITE_ORIGIN}/sitemap-anime.xml`, lastmod: newestLastmod(anime) },
      ]);
      return sendWithOptionalGzip(req, res, 200, "application/xml; charset=utf-8", indexXml, CACHE_24H);
    }

    res.status(404).end("Unknown sitemap type");
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).end("Failed to generate sitemap");
  }
};
