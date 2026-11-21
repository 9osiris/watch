"use strict";

module.exports = (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).json({
    ok: true,
    service: "osiris-watch",
    tmdbConfigured: Boolean(process.env.TMDB_KEY || process.env.TMDB_API_KEY),
    aiConfigured: Boolean(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString(),
  });
};
