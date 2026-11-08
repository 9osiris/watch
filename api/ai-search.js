// Experimental AI Search for Osiris Watch.
//
// SECURITY: the Groq API keys are read from server-side environment variables
// and are NEVER sent to the browser. On a static site any key placed in client
// JavaScript is readable by anyone, so all AI calls are proxied through this
// serverless function instead.
//
// Configure in Vercel -> Project -> Settings -> Environment Variables, then
// redeploy:
//   GROQ_API_KEYS        comma-separated list of primary keys
//   GROQ_FALLBACK_KEYS   comma-separated list of fallback keys (optional)
//
// The client calls:  POST /api/ai-search   { "query": "..." }
// and receives:      { "intro": "...", "results": [{ title, year, type }] }

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function parseKeys(raw) {
  return (raw || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

const SYSTEM_PROMPT = `You are the discovery engine for a movie and TV streaming app called Osiris Watch.
The user describes what they want to watch in natural language: a mood, a plot, an era, an actor, "something like <title>", etc.
Reply with ONLY a compact JSON object (no markdown, no commentary) of the exact form:
{"intro":"<one short friendly sentence about the picks>","results":[{"title":"Exact Title","year":1999,"type":"movie"}]}
Rules:
- Return 6 to 12 results, strongest matches first.
- "title" must be the real, exact, English title so it can be looked up in a movie database.
- "type" is either "movie" or "tv".
- "year" is the release year as a number, or null if unknown.
- Do not invent titles. Only suggest real, released films or shows.
- Output nothing except the JSON object.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const query = body && typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 500) {
    res.status(400).json({ error: "Provide a 'query' string (1-500 characters)." });
    return;
  }

  const keys = [
    ...parseKeys(process.env.GROQ_API_KEYS),
    ...parseKeys(process.env.GROQ_FALLBACK_KEYS),
  ];
  if (!keys.length) {
    res.status(500).json({ error: "AI Search is not configured on the server." });
    return;
  }

  const payload = {
    model: MODEL,
    temperature: 0.7,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
  };

  let lastErr = "All AI keys are currently unavailable.";
  for (const key of keys) {
    try {
      const upstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });

      // Rate-limited / rejected key -> rotate to the next one.
      if (upstream.status === 429 || upstream.status === 401 || upstream.status === 403) {
        lastErr = `Key rotated after status ${upstream.status}.`;
        continue;
      }
      if (!upstream.ok) {
        lastErr = `Upstream error (${upstream.status}).`;
        continue;
      }

      const data = await upstream.json();
      const content =
        data && data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content || ""
          : "";

      let parsed;
      try { parsed = JSON.parse(content); } catch (_) { parsed = null; }
      if (!parsed || !Array.isArray(parsed.results)) {
        lastErr = "AI returned an unexpected response.";
        continue;
      }

      const results = parsed.results
        .filter((r) => r && typeof r.title === "string")
        .slice(0, 12)
        .map((r) => ({
          title: String(r.title).slice(0, 160),
          year: Number.isFinite(r.year) ? r.year : null,
          type: r.type === "tv" ? "tv" : "movie",
        }));

      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({
        intro: typeof parsed.intro === "string" ? parsed.intro.slice(0, 240) : "",
        results,
      });
      return;
    } catch (_) {
      lastErr = "Network error contacting the AI provider.";
      continue;
    }
  }

  res.status(502).json({ error: lastErr });
};
