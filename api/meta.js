const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_KEY || "8265bd1679663a7ea12ac168da84d2e8";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  const { type = "movie", id } = req.query || {};
  if (!id || !["movie", "tv"].includes(type)) {
    return res.status(400).json({ error: "Missing or invalid id/type" });
  }

  try {
    const tmdbRes = await fetch(`${TMDB_BASE}/${type}/${encodeURIComponent(id)}?api_key=${TMDB_KEY}&language=en-US`);
    if (!tmdbRes.ok) {
      return res.status(tmdbRes.status).json({ error: "Upstream metadata fetch failed" });
    }
    const data = await tmdbRes.json();
    const title = data.title || data.name || (type === "tv" ? "TV Series" : "Movie");
    const overview = data.overview || "Stream movies and TV shows online in HD for free on Osiris Watch.";
    const poster = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "https://watch.osiris.rocks/icon-512.png";
    const canonical = `https://watch.osiris.rocks/${type}?id=${id}`;

    return res.status(200).json({
      title: `${title} — Osiris Watch`,
      description: overview,
      image: poster,
      canonical,
      og: {
        "og:title": `${title} — Osiris Watch`,
        "og:description": overview,
        "og:image": poster,
        "og:url": canonical,
        "og:type": "video.other"
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to resolve metadata" });
  }
};
