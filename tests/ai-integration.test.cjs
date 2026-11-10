"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../ai-search-catalog.js");
const { createService } = require("../lib/ai-search-service.cjs");
const today = "2026-08-15";
const makePlan = extra => catalog.normalizePlan({ summary: "Catalog matches", ...extra });
const movie = (id, extra = {}) => ({ id, media_type: "movie", title: `Film ${id}`, release_date: "2014-01-01", original_language: "en", genre_ids: [18], vote_average: 8, vote_count: 300, overview: "A character-driven drama.", adult: false, ...extra });

function fixture(items, overrides = async () => undefined) {
  return async pathname => {
    const url = new URL(pathname, "https://catalog.test");
    const custom = await overrides(url);
    if (custom !== undefined) return custom;
    if (url.pathname.startsWith("/search/movie") || url.pathname.startsWith("/search/tv")) return { results: items.filter(item => (item.title || item.name) === url.searchParams.get("query")) };
    if (url.pathname.startsWith("/discover/")) return { results: items.filter(item => url.pathname.endsWith(item.media_type)) };
    if (/\/(recommendations|similar)$/.test(url.pathname)) return { results: items };
    if (url.pathname.endsWith("/watch/providers")) return { results: { US: { flatrate: [{ provider_id: 8, provider_name: "Netflix" }] } } };
    if (url.pathname.startsWith("/search/")) return { results: [] };
    return items.find(item => item.id === Number(url.pathname.split("/")[2])) || {};
  };
}

async function collect(items, plan, query, overrides) {
  return catalog.collectCandidates({ request: fixture(items, overrides), plan, query, today });
}

async function rank(items, plan, query) {
  const service = createService({
    env: { GROQ_API_KEYS: "fixture-only" }, now: () => Date.parse(`${today}T12:00:00Z`),
    fetch: async (_, options) => {
      const payload = JSON.parse(options.body), context = JSON.parse(payload.messages[1].content);
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        intro: "Matches supported by catalog facts.",
        picks: context.candidates.map(item => ({ id: item.id, type: item.media_type, reason: "The supplied catalog facts match the requested criteria." })),
        suggestions: [],
      }) } }] });
    },
  });
  const response = await service.handle({ method: "POST", body: { operation: "rank", query, options: { mediaType: "all", hideAdult: true }, plan, candidates: catalog.buildRankCandidates(items) } });
  assert.equal(response.status, 200, response.body.error);
  return response.body;
}

test("single-provider catalog evidence survives serialization and API eligibility", async () => {
  const plan = makePlan({ mediaType: "movie", providers: ["Netflix"] });
  const output = await collect([movie(1)], plan, "Dramas on Netflix");
  assert.equal(output.items.length, 1);
  const response = await rank(output.items, plan, "Dramas on Netflix");
  assert.deepEqual(response.results.map(pick => pick.id), [1]);
  assert.match(catalog.buildRankCandidates(output.items)[0].evidence, /Netflix/);
});

test("provider alternatives carry only services actually verified for each title", async () => {
  const plan = makePlan({ mediaType: "movie", providers: ["Netflix", "Disney+"] });
  const output = await collect([movie(1), movie(2)], plan, "Dramas on Netflix or Disney+", async url => {
    if (url.pathname.endsWith("/watch/providers")) return { results: { US: { flatrate: [{ provider_id: url.pathname.includes("/1/") ? 8 : 15, provider_name: url.pathname.includes("/1/") ? "Netflix" : "Hulu" }] } } };
  });
  assert.deepEqual(output.items.map(item => item.id), [1]);
  const evidence = catalog.buildRankCandidates(output.items)[0].evidence;
  assert.match(evidence, /Netflix/);
  assert.doesNotMatch(evidence, /Disney/);
  assert.deepEqual((await rank(output.items, plan, "Dramas on Netflix or Disney+")).results.map(pick => pick.id), [1]);
});

test("strict multi-genre restrictions have the same AND semantics in browser and API", async () => {
  const plan = makePlan({ genres: ["Crime", "Thriller"], strictGenres: true });
  const items = [movie(1, { genre_ids: [80] }), movie(2, { genre_ids: [80, 53] })];
  assert.deepEqual(catalog.applyConstraints(items, plan, { today }).map(item => item.id), [2]);
  assert.deepEqual((await rank(items, plan, "Crime thrillers")).results.map(pick => pick.id), [2]);
});

test("every explicitly requested person must have credit evidence during API ranking", async () => {
  const plan = makePlan({ people: ["Actor One", "Actor Two"] });
  const items = [
    movie(1, { _ai: { sources: ["person"], personKeys: ["actor one"], evidence: ["Cast: Actor One"] } }),
    movie(2, { _ai: { sources: ["person"], personKeys: ["actor one", "actor two"], evidence: ["Cast: Actor One", "Cast: Actor Two"] } }),
  ];
  assert.deepEqual(catalog.applyConstraints(items, plan, { today }).map(item => item.id), [2]);
  assert.deepEqual((await rank(items, plan, "Movies featuring Actor One and Actor Two")).results.map(pick => pick.id), [2]);
});

test("keyword-verified TV thriller classifications survive the actual rank payload", async () => {
  const plan = makePlan({ mediaType: "tv", genres: ["Thriller"], strictGenres: true });
  const show = movie(1, { media_type: "tv", title: undefined, name: "Mystery Series", release_date: undefined, first_air_date: "2014-01-01", genre_ids: [18] });
  const output = await collect([show], plan, "Thriller series", async url => {
    if (url.pathname === "/tv/1") return { ...show, keywords: { results: [{ name: "psychological thriller" }] } };
  });
  assert.equal(output.items.length, 1);
  assert.ok(catalog.buildRankCandidates(output.items)[0].genre_names.includes("Thriller"));
  assert.deepEqual((await rank(output.items, plan, "Thriller series")).results.map(pick => pick.id), [1]);
});

test("a direct requested title is retained when the planner also identifies it as a seed", async () => {
  const plan = makePlan({ mediaType: "movie", seedTitles: [{ title: "Arrival", year: 2016, type: "movie" }] });
  const output = await collect([movie(1, { title: "Arrival", release_date: "2016-01-01" })], plan, "Find Arrival");
  assert.deepEqual(output.items.map(item => item.id), [1]);
});

test("comparison references remain excluded while their related films stay eligible", async () => {
  const plan = makePlan({ mediaType: "movie", seedTitles: [{ title: "Arrival", year: 2016, type: "movie" }], avoidTitles: ["Arrival"] });
  const output = await collect([movie(1, { title: "Arrival", release_date: "2016-01-01" }), movie(2)], plan, "Movies like Arrival");
  assert.deepEqual(output.items.map(item => item.id), [2]);
  assert.deepEqual((await rank(output.items, plan, "Movies like Arrival")).results.map(pick => pick.id), [2]);
});

test("long valid runtime limits are preserved across planning, filtering, and serialization", async () => {
  const plan = makePlan({ mediaType: "movie", runtimeMax: 720 });
  assert.equal(plan.runtimeMax, 720);
  const items = [movie(1, { runtime: 680 }), movie(2, { runtime: 800 })];
  const output = await collect(items, plan, "Movies under 720 minutes");
  assert.deepEqual(output.items.map(item => item.id), [1]);
  assert.equal(catalog.buildRankCandidates(output.items)[0].runtime, 680);
  assert.deepEqual((await rank(output.items, plan, "Movies under 720 minutes")).results.map(pick => pick.id), [1]);
});
