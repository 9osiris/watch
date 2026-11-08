"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");
const catalog = require("../ai-search-catalog.js");
const today = "2026-08-15";
const movie = (id, extra = {}) => ({ id, title: `Film ${id}`, media_type: "movie", release_date: "2014-01-01", original_language: "en", genre_ids: [878], vote_average: 8, vote_count: 300, popularity: 10, overview: "Thoughtful space exploration and first contact.", adult: false, _ai: { sources: ["catalog"], evidence: [], personKeys: [], keywordNames: [], providerMatch: false }, ...extra });
const plan = extra => catalog.normalizePlan({ summary: "Space stories", genres: ["Sci-Fi"], ...extra });

function fixture(items, extras = {}) {
  const calls = [];
  const request = async (path, opts) => {
    calls.push(path);
    if (opts.signal.aborted) throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    const url = new URL(path, "https://catalog.test");
    if (extras.request) {
      const value = await extras.request(url, opts);
      if (value !== undefined) return value;
    }
    if (url.pathname.startsWith("/search/movie") || url.pathname.startsWith("/search/tv")) {
      const query = url.searchParams.get("query");
      return { results: items.filter(item => item.title === query || item.name === query) };
    }
    if (url.pathname.startsWith("/discover")) return { results: items.filter(item => url.pathname.endsWith(item.media_type)) };
    if (/\/(recommendations|similar)$/.test(url.pathname)) return { results: extras.related || [] };
    if (url.pathname.startsWith("/search/keyword")) return { results: [] };
    if (url.pathname.startsWith("/search/person")) return { results: [] };
    const id = Number(url.pathname.split("/")[2]);
    const item = items.find(item => item.id === id);
    return item ? { ...item, runtime: item.runtime || 90 } : { results: [] };
  };
  return { calls, request };
}

async function collect(items, extra = {}) {
  const { request, related, ...options } = extra;
  const api = fixture(items, { request, related });
  const output = await catalog.collectCandidates({ request: api.request, query: "thoughtful space stories", plan: plan(), today, ...options });
  return { ...output, calls: api.calls };
}

test("title normalization handles accents, ampersands, and apostrophes", () => {
  assert.equal(catalog.normalizeTitle("  Amélie & 'Friends'  "), "amelie and friends");
});

test("exact title/year wins over popularity and does not require a poster", () => {
  const wanted = { title: "Dune", year: 2021, type: "movie" };
  const correct = movie(2, { title: "Dune", release_date: "2021-09-15", poster_path: null });
  const hit = catalog.chooseTitleMatch([movie(1, { title: "Dune", release_date: "1984-01-01", vote_count: 50000 }), correct], wanted);
  assert.equal(hit.id, 2);
});

test("unrelated first hits and distant remakes are rejected", () => {
  assert.equal(catalog.chooseTitleMatch([movie(1, { title: "Space Jam" })], { title: "Interstellar", year: 2014 }), null);
  assert.equal(catalog.chooseTitleMatch([movie(1, { title: "Dune", release_date: "1984-01-01" })], { title: "Dune", year: 2021 }), null);
});

test("planner values are bounded and media scope overrides inference", () => {
  const normalized = catalog.normalizePlan({ mediaType: "tv", genres: Array(10).fill("Sci-Fi"), yearMin: 2020, yearMax: 1990, language: "EN", runtimeMax: 9999, minRating: -1 }, "movie");
  assert.equal(normalized.mediaType, "movie");
  assert.deepEqual(normalized.genres, ["Sci-Fi"]);
  assert.equal(normalized.yearMin, 1990);
  assert.equal(normalized.yearMax, 2020);
  assert.equal(normalized.runtimeMax, null);
  assert.equal(normalized.minRating, null);
  assert.equal(normalized.language, "en");
  assert.equal(catalog.normalizePlan({ runtimeMax: 900 }).runtimeMax, 900);
  assert.equal(catalog.normalizePlan({ runtimeMax: 1440 }).runtimeMax, 1440);
});

test("two AI suggestions are expanded to a larger verified catalog pool", async () => {
  const items = Array.from({ length: 30 }, (_, i) => movie(i + 1, { poster_path: i % 2 ? "/poster.jpg" : null }));
  const output = await collect(items, { recommendations: items.slice(0, 2).map(item => ({ title: item.title, year: 2014, type: "movie" })) });
  assert.equal(output.items.length, 30);
  assert.equal(new Set(output.items.map(catalog.keyOf)).size, 30);
  assert.ok(output.items.some(item => !item.poster_path));
});

test("hard restrictions exclude future, unknown-date, adult, wrong-era, and horror titles", () => {
  const items = [movie(1), movie(2, { release_date: "2030-01-01" }), movie(3, { release_date: "" }), movie(4, { adult: true }), movie(5, { release_date: "1980-01-01" }), movie(6, { genre_ids: [27, 878] }), movie(7, { genre_ids: [35] })];
  const matches = catalog.applyConstraints(items, plan({ yearMin: 2010, yearMax: 2020, strictGenres: true, excludeGenres: ["Horror"] }), { today });
  assert.deepEqual(matches.map(item => item.id), [1]);
});

test("language, rating, runtime, avoids, and IDs are independently enforced", () => {
  const items = [movie(1, { runtime: 90 }), movie(2, { runtime: 110 }), movie(3, { runtime: 90, original_language: "fr" }), movie(4, { runtime: 90, vote_average: 5 }), movie(5, { runtime: 90 }), movie(6, { runtime: 90 }), movie(7)];
  const matches = catalog.applyConstraints(items, plan({ runtimeMax: 100, minRating: 7, language: "en", avoidTitles: ["Film 5"] }), { today, exclude: ["movie_6"] });
  assert.deepEqual(matches.map(item => item.id), [1]);
});

test("cast constraints require evidence for every requested person", () => {
  const one = movie(1); one._ai.personKeys = ["actor one"];
  const both = movie(2); both._ai.personKeys = ["actor one", "actor two"];
  const matches = catalog.applyConstraints([one, both], plan({ people: ["Actor One", "Actor Two"] }), { today });
  assert.deepEqual(matches.map(item => item.id), [2]);
});

test("unrecognized people do not substitute unrelated popular films", async () => {
  const output = await collect([movie(1), movie(2)], { plan: plan({ people: ["Unverified Actor"] }) });
  assert.equal(output.items.length, 0);
  assert.ok(output.warnings.some(message => message.includes("identity")));
});

test("runtime metadata is verified before a hard runtime constraint passes", async () => {
  const items = [movie(1), movie(2, { runtime: 160 }), movie(3)];
  const output = await collect(items, { plan: plan({ runtimeMax: 100 }), request: undefined });
  assert.deepEqual(output.items.map(item => item.id).sort(), [1, 3]);
  assert.ok(output.calls.some(path => path === "/movie/1"));
});

test("similar-title retrieval excludes the seed and merges distinct related titles", async () => {
  const items = [movie(1, { title: "Arrival", release_date: "2016-01-01" }), movie(2), movie(3)];
  const output = await collect(items, { plan: plan({ seedTitles: [{ title: "Arrival", year: 2016, type: "movie" }], avoidTitles: ["Arrival"] }), related: [items[1], items[2]] });
  assert.ok(!output.items.some(item => item.id === 1));
  assert.ok(output.items.some(item => item._ai.sources.includes("seed")));
  assert.equal(new Set(output.items.map(catalog.keyOf)).size, output.items.length);
});

test("movie and series sharing an ID remain separate verified records", async () => {
  const output = await collect([movie(1), movie(1, { media_type: "tv", title: undefined, name: "Series 1", release_date: undefined, first_air_date: "2014-01-01", genre_ids: [10765] })]);
  assert.equal(output.items.length, 2);
  assert.deepEqual(new Set(output.items.map(catalog.keyOf)), new Set(["movie_1", "tv_1"]));
});

test("catalog lookup failures are reported, not replaced with invented records", async () => {
  const output = await collect([movie(1)], { recommendations: [{ title: "Broken lookup", year: 2014, type: "movie" }], request: async (url) => { if (url.searchParams.get("query") === "Broken lookup") throw new Error("Fixture failure"); } });
  assert.equal(output.items.length, 1);
  assert.equal(output.items[0].id, 1);
  assert.ok(output.warnings.some(message => message.includes("failed")));
});

test("complete catalog outage returns an actionable error", async () => {
  await assert.rejects(() => catalog.collectCandidates({ query: "space", plan: plan(), request: async () => { throw new Error("Offline"); }, today }), /could not be reached/);
});

test("catalog requests are deduplicated and bounded to four concurrent calls", async () => {
  let active = 0, maximum = 0, calls = 0;
  const client = catalog.createRequester(async () => { active++; maximum = Math.max(maximum, active); calls++; await delay(5); active--; return {}; });
  await Promise.all(Array.from({ length: 12 }, (_, i) => client.get(`/path/${i % 8}`)));
  assert.equal(calls, 8);
  assert.ok(maximum <= 4);
});

test("catalog request caps and timeouts are bounded", async () => {
  const client = catalog.createRequester(async () => ({}), { limit: 2 });
  await client.get("/one"); await client.get("/two");
  await assert.rejects(client.get("/three"), /budget/);
  assert.equal(client.stats.limited, true);
  const timeout = catalog.createRequester(async () => new Promise(() => {}), { requestTimeoutMs: 15 });
  await assert.rejects(timeout.get("/slow"), /timed out/);
});

test("cancellation aborts active and queued catalog work", async () => {
  const ctrl = new AbortController();
  const client = catalog.createRequester(async (_, opts) => new Promise((resolve, reject) => {
    opts.signal.addEventListener("abort", () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })), { once: true });
  }), { signal: ctrl.signal });
  const settled = Promise.allSettled(Array.from({ length: 8 }, (_, i) => client.get(`/path/${i}`)));
  await delay(5); ctrl.abort();
  const results = await settled;
  assert.ok(results.every(result => result.status === "rejected" && result.reason.name === "AbortError"));
});

test("semantic relevance and Bayesian quality beat irrelevant popularity", () => {
  const items = [movie(1, { overview: "An unrelated romantic comedy", genre_ids: [35], popularity: 10000 }), movie(2), movie(3, { vote_average: 9.9, vote_count: 1 })];
  const ranked = catalog.rankCandidates(items, plan(), "thoughtful space first contact");
  assert.equal(ranked[0].id, 2);
  assert.equal(ranked.at(-1).id, 1);
});

test("invented/duplicate ranking IDs are dropped and missing picks are supplemented", () => {
  const items = catalog.rankCandidates(Array.from({ length: 30 }, (_, i) => movie(i + 1)), plan(), "space");
  const result = catalog.mergeRankedResults(items, [{ id: 2, type: "movie", reason: "A grounded match" }, { id: 2, type: "movie", reason: "Duplicate" }, { id: 99999, type: "movie", reason: "Invented" }]);
  assert.equal(result.length, 24);
  assert.equal(result[0].id, 2);
  assert.equal(new Set(result.map(catalog.keyOf)).size, 24);
  assert.ok(!result.some(item => item.id === 99999));
});

test("rank payload bounds catalog descriptions and retains only required facts", () => {
  const candidate = catalog.buildRankCandidates([movie(1, { overview: "x".repeat(3000), secret: "never copied" })])[0];
  assert.equal(candidate.overview.length, 700);
  assert.equal(candidate.secret, undefined);
  assert.deepEqual(candidate.genre_names, ["Sci-Fi"]);
});

test("a future-year restriction stays restrictive rather than becoming any year", () => {
  const future = plan({ yearMin: 2099, yearMax: 2099 });
  assert.equal(future.yearMin, 2099);
  assert.equal(catalog.applyConstraints([movie(1)], future, { today }).length, 0);
});

test("TV horror exclusions verify keywords and reject unknown classifications", async () => {
  const shows = [1, 2, 3].map(id => movie(id, { media_type: "tv", genre_ids: [10765], title: undefined, name: `Series ${id}`, release_date: undefined, first_air_date: "2014-01-01" }));
  const output = await collect(shows, { plan: plan({ mediaType: "tv", excludeGenres: ["Horror"] }), request: async url => {
    if (url.pathname === "/tv/1") return { ...shows[0], keywords: { results: [{ name: "supernatural horror" }] } };
    if (url.pathname === "/tv/2") return { ...shows[1], keywords: { results: [{ name: "space exploration" }] } };
    if (url.pathname === "/tv/3") throw new Error("Keyword verification unavailable");
  } });
  assert.deepEqual(output.items.map(item => item.id), [2]);
});

test("person-filtered discovery does not claim unverified cast membership", async () => {
  const items = [movie(1), movie(2)];
  const output = await collect(items, { plan: plan({ people: ["Actor One"] }), request: async url => {
    if (url.pathname === "/search/person") return { results: [{ id: 20, name: "Actor One", known_for_department: "Acting" }] };
    if (url.pathname === "/person/20/combined_credits") return { cast: [items[0]], crew: [{ ...items[1], job: "Producer" }] };
  } });
  assert.deepEqual(output.items.map(item => item.id), [1]);
});

test("unrelated popular discovery results are not used as semantic filler", async () => {
  const items = [movie(1, { genre_ids: [35], overview: "A popular romantic comedy." })];
  const output = await collect(items, { plan: plan({ genres: ["Mystery"], keywords: ["underwater ruins"] }), query: "underwater ruins mystery" });
  assert.equal(output.items.length, 0);
});

test("cross-layer integration: provider evidence, direct seeds, multi-genre/person, and keyword-backed TV genres pass server ranking", async () => {
  const { createService } = require("../lib/ai-search-service.cjs");
  const service = createService({
    env: { GROQ_API_KEY: "fixture-key" },
    fetch: async (_, options) => {
      const payload = JSON.parse(options.body);
      const user = JSON.parse(payload.messages[1].content);
      return Response.json({
        choices: [{
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              intro: "Verified cross-layer picks.",
              picks: user.candidates.map(c => ({ id: c.id, type: c.media_type, reason: "Matches requested constraints." })),
              suggestions: ["Refined cross-layer search"],
            }),
          },
        }],
      });
    },
  });

  // 1. Direct-title seed is preserved when not in avoidTitles, while comparison seed is excluded
  const directSeed = movie(10, { title: "Arrival", release_date: "2016-11-11" });
  const directOut = await collect([directSeed], {
    query: "find Arrival 2016",
    plan: plan({ seedTitles: [{ title: "Arrival", year: 2016, type: "movie" }], avoidTitles: [] }),
  });
  assert.ok(directOut.items.some(item => item.id === 10));

  // 2. Multi-provider OR filter records only matched provider names and passes server rank
  const provShow = movie(20, {
    media_type: "tv",
    title: undefined,
    name: "Thriller Series",
    release_date: undefined,
    first_air_date: "2020-05-01",
    genre_ids: [18],
    runtime: 50,
  });
  const provOut = await collect([provShow], {
    query: "Drama thriller series with Actor One and Actor Two on Netflix or Hulu",
    plan: plan({
      mediaType: "tv",
      genres: ["Drama", "Thriller"],
      strictGenres: true,
      people: ["Actor One", "Actor Two"],
      providers: ["Netflix", "Hulu"],
    }),
    request: async url => {
      if (url.pathname === "/search/person") {
        const q = url.searchParams.get("query");
        return { results: [{ id: q === "Actor One" ? 101 : 102, name: q, known_for_department: "Acting" }] };
      }
      if (url.pathname === "/person/101/combined_credits" || url.pathname === "/person/102/combined_credits") {
        return { cast: [provShow], crew: [] };
      }
      if (url.pathname === "/tv/20") {
        return { ...provShow, episode_run_time: [50], keywords: { results: [{ name: "psychological thriller" }] } };
      }
      if (url.pathname === "/tv/20/watch/providers") {
        return { results: { US: { flatrate: [{ provider_id: 15, provider_name: "Hulu" }] } } };
      }
    },
  });
  assert.equal(provOut.items.length, 1);
  const rankCandidates = catalog.buildRankCandidates(provOut.items);
  assert.ok(rankCandidates[0].genre_names.includes("Thriller"));
  assert.match(rankCandidates[0].evidence, /Provider availability: Hulu \(US\)/);
  assert.doesNotMatch(rankCandidates[0].evidence, /Netflix/);

  const rankRes = await service.handle({
    method: "POST",
    body: {
      operation: "rank",
      query: "Drama thriller series with Actor One and Actor Two on Netflix or Hulu",
      options: { mediaType: "tv", hideAdult: true },
      plan: {
        summary: "Drama thriller series with Actor One and Actor Two on Netflix or Hulu",
        mediaType: "tv",
        genres: ["Drama", "Thriller"],
        excludeGenres: [],
        keywords: [],
        people: ["Actor One", "Actor Two"],
        yearMin: null,
        yearMax: null,
        runtimeMax: null,
        minRating: null,
        language: null,
        providers: ["Netflix", "Hulu"],
        seedTitles: [],
        avoidTitles: [],
        sort: "relevance",
        strictGenres: true,
      },
      candidates: rankCandidates,
      exclude: [],
    },
  });
  assert.equal(rankRes.status, 200);
  assert.equal(rankRes.body.results.length, 1);
  assert.equal(rankRes.body.results[0].id, 20);
});
