// Vercel Serverless Function: Edge-cached TMDB proxy
// Provides server-side key security and HTTP edge caching to avoid client rate limits.

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_KEY || process.env.TMDB_API_KEY || "e4f8d55ff703f8e560b2fc377ae5ee26";

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { path, ...restParams } = req.query || {};
  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing required 'path' query parameter." });
  }

  // Prevent SSRF or protocol injection
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!/^\/[a-zA-Z0-9_\-\/]+$/.test(cleanPath.split("?")[0])) {
    return res.status(400).json({ error: "Invalid path format." });
  }

  const searchParams = new URLSearchParams(restParams);
  searchParams.set("api_key", TMDB_KEY);

  const targetUrl = `${TMDB_BASE}${cleanPath}${cleanPath.includes("?") ? "&" : "?"}${searchParams.toString()}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "OsirisWatch/3.2"
      }
    });

    const status = upstreamRes.status;
    const data = await upstreamRes.json();

    if (status === 200) {
      // 1 hour edge cache, 24 hour stale-while-revalidate for TMDB metadata
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }

    return res.status(status).json(data);
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Failed to connect to TMDB upstream." });
  }
};
