/* Catalog grounding and ranking shared by the AI search UI and its tests. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.OsirisAICatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MOVIE_GENRES = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western" };
  const TV_GENRES = { 10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western" };
  const PROVIDER_IDS = { netflix: 8, primevideo: 9, amazonprimevideo: 9, prime: 9, disney: 337, disneyplus: 337, appletv: 350, appletvplus: 350, apple: 350, max: 1899, hbo: 1899, hbomax: 1899, hulu: 15, paramount: 531, paramountplus: 531, peacock: 386, crunchyroll: 283, amc: 528, amcplus: 528 };
  const STOP_WORDS = new Set("a an and are as at be but by can could do for from good have i in is it like me movie movies of on or please recommend series show shows some something that the them this to tv want watch with would you".split(" "));

  const text = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const list = (value, max = 8) => [...new Set((Array.isArray(value) ? value : []).map(v => text(v)).filter(Boolean))].slice(0, max);
  const number = (value, min, max) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
  const keyOf = item => `${item.media_type}_${item.id}`;
  const unique = values => [...new Set(values)];

  function normalizeTitle(value) {
    return text(value, 500).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/&/g, " and ").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function tokens(value) {
    return unique(normalizeTitle(value).split(" ").filter(word => word.length > 1 && !STOP_WORDS.has(word)));
  }

  function abortError() {
    const error = new Error("Search cancelled");
    error.name = "AbortError";
    return error;
  }

  function checkAbort(signal) { if (signal?.aborted) throw abortError(); }

  function normalizePlan(raw = {}, mediaType = "all") {
    const source = raw && typeof raw === "object" ? raw : {};
    const currentYear = new Date().getFullYear();
    const result = {
      summary: text(source.summary, 300),
      mediaType: ["movie", "tv"].includes(mediaType) ? mediaType : (["movie", "tv"].includes(source.mediaType) ? source.mediaType : "all"),
      genres: list(source.genres, 5), excludeGenres: list(source.excludeGenres, 5), keywords: list(source.keywords, 6),
      people: list(source.people, 3), providers: list(source.providers, 3), avoidTitles: list(source.avoidTitles, 12),
      yearMin: number(source.yearMin, 1870, 2100), yearMax: number(source.yearMax, 1870, 2100),
      runtimeMax: number(source.runtimeMax, 1, 1440), minRating: number(source.minRating, 0, 10),
      language: /^[a-z]{2}$/i.test(source.language || "") ? source.language.toLowerCase() : null,
      sort: ["rating", "recent", "hidden-gems"].includes(source.sort) ? source.sort : "relevance",
      strictGenres: source.strictGenres === true,
      seedTitles: (Array.isArray(source.seedTitles) ? source.seedTitles : []).filter(v => v && text(v.title)).slice(0, 3).map(v => ({ title: text(v.title), year: number(v.year, 1870, currentYear), type: v.type === "tv" ? "tv" : "movie" })),
    };
    if (result.yearMin !== null && result.yearMax !== null && result.yearMin > result.yearMax) [result.yearMin, result.yearMax] = [result.yearMax, result.yearMin];
    return result;
  }

  function titleSimilarity(actual, wanted) {
    const a = normalizeTitle(actual), b = normalizeTitle(wanted);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.replace(/^(the|a|an) /, "") === b.replace(/^(the|a|an) /, "")) return 0.98;
    const aa = new Set(a.split(" ")), bb = new Set(b.split(" "));
    const common = [...aa].filter(v => bb.has(v)).length;
    return common / new Set([...aa, ...bb]).size * 0.9;
  }

  function chooseTitleMatch(hits, recommendation) {
    let best = null, bestScore = 0;
    for (const item of Array.isArray(hits) ? hits : []) {
      if (!Number.isSafeInteger(item?.id) || item.id <= 0) continue;
      const similarity = Math.max(titleSimilarity(item.title || item.name, recommendation.title), titleSimilarity(item.original_title || item.original_name, recommendation.title));
      if (similarity < 0.72) continue;
      const releaseYear = Number((item.release_date || item.first_air_date || "").slice(0, 4));
      if (recommendation.year && releaseYear && Math.abs(releaseYear - recommendation.year) > 1) continue;
      const yearBonus = recommendation.year && releaseYear === recommendation.year ? 0.15 : 0;
      const score = similarity + yearBonus + Math.min(Math.log1p(item.vote_count || 0), 10) / 1000;
      if (score > bestScore) { best = item; bestScore = score; }
    }
    return best;
  }

  function createRequester(request, options = {}) {
    const signal = options.signal, concurrency = options.concurrency || 4, limit = options.limit || 80;
    const requestTimeout = options.requestTimeoutMs || 6500, totalTimeout = options.totalTimeoutMs || 20000;
    const started = Date.now(), memo = new Map(), queue = [];
    const stats = { requests: 0, failures: 0, limited: false };
    let running = 0;
    const pump = () => {
      while (running < concurrency && queue.length) {
        const job = queue.shift();
        if (signal?.aborted) { job.reject(abortError()); continue; }
        running++;
        job.run().then(job.resolve, job.reject).finally(() => { running--; pump(); });
      }
    };
    const get = path => {
      checkAbort(signal);
      if (memo.has(path)) return memo.get(path);
      if (stats.requests >= limit || Date.now() - started >= totalTimeout) {
        stats.limited = true;
        return Promise.reject(new Error("Catalog request budget reached"));
      }
      stats.requests++;
      const promise = new Promise((resolve, reject) => {
        queue.push({ resolve, reject, run: async () => {
          checkAbort(signal);
          if (Date.now() - started >= totalTimeout) { stats.limited = true; throw new Error("Catalog time budget reached"); }
          const ctrl = new AbortController();
          const forward = () => ctrl.abort();
          signal?.addEventListener("abort", forward, { once: true });
          const timer = setTimeout(() => ctrl.abort(), Math.min(requestTimeout, totalTimeout - (Date.now() - started)));
          let rejectAbort;
          const aborted = new Promise((_, reject) => { rejectAbort = () => reject(signal?.aborted ? abortError() : new Error("Catalog request timed out")); ctrl.signal.addEventListener("abort", rejectAbort, { once: true }); });
          try {
            const data = await Promise.race([Promise.resolve().then(() => request(path, { signal: ctrl.signal })), aborted]);
            checkAbort(signal);
            return data;
          } catch (error) {
            if (!signal?.aborted) stats.failures++;
            throw error;
          } finally {
            clearTimeout(timer);
            signal?.removeEventListener("abort", forward);
            ctrl.signal.removeEventListener("abort", rejectAbort);
          }
        } });
        pump();
      });
      memo.set(path, promise);
      promise.catch(() => memo.delete(path));
      return promise;
    };
    return { get, stats };
  }

  async function parallel(values, mapper, signal, concurrency = 4) {
    let index = 0;
    const output = new Array(values.length);
    await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (index < values.length) {
        checkAbort(signal);
        const position = index++;
        try { output[position] = await mapper(values[position], position); }
        catch (error) { checkAbort(signal); output[position] = null; }
      }
    }));
    return output;
  }

  function genreNames(item) {
    const lookup = item.media_type === "tv" ? TV_GENRES : MOVIE_GENRES;
    return unique([...(item._ai?.verifiedGenres || []), ...(item.genre_ids || []).map(id => lookup[id]).filter(Boolean), ...(item.genres || []).map(genre => genre?.name).filter(Boolean)]);
  }

  function matchesGenre(item, wanted) {
    const target = normalizeTitle(wanted);
    const names = genreNames(item).map(normalizeTitle);
    if (names.includes(target)) return true;
    if (item.media_type === "tv") {
      if (["action", "adventure"].includes(target)) return names.includes("action and adventure");
      if (["sci fi", "science fiction", "fantasy"].includes(target)) return names.includes("sci fi and fantasy");
    }
    if (target === "science fiction") return names.includes("sci fi");
    return (item._ai?.keywordNames || []).some(keyword => (` ${normalizeTitle(keyword)} `).includes(` ${target} `));
  }

  function genreIds(names, type) {
    const lookup = type === "tv" ? TV_GENRES : MOVIE_GENRES;
    return unique(names.flatMap(name => Object.entries(lookup).filter(([id]) => matchesGenre({ media_type: type, genre_ids: [Number(id)] }, name)).map(([id]) => Number(id))));
  }

  function catalogItem(raw, type, source, evidence = []) {
    if (!raw || !Number.isSafeInteger(raw.id) || raw.id <= 0) return null;
    if (raw.media_type && !["movie", "tv"].includes(raw.media_type)) return null;
    const media_type = raw.media_type || type;
    if (!["movie", "tv"].includes(media_type) || !(raw.title || raw.name)) return null;
    return { ...raw, media_type, _ai: { sources: [source], evidence, personKeys: [], keywordNames: [], verifiedGenres: [], providerNames: [], keywordChecked: false, catalogKeywordMatch: false, providerMatch: false } };
  }

  function applyConstraints(items, plan, options = {}) {
    const exclude = new Set(options.exclude || []), avoid = new Set(plan.avoidTitles.map(normalizeTitle));
    const today = options.today || new Date().toISOString().slice(0, 10);
    return items.filter(item => {
      if (exclude.has(keyOf(item)) || avoid.has(normalizeTitle(item.title || item.name))) return false;
      if (plan.mediaType !== "all" && item.media_type !== plan.mediaType) return false;
      if (options.hideAdult !== false && item.adult === true) return false;
      const date = item.release_date || item.first_air_date || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return false;
      const year = Number(date.slice(0, 4));
      if (plan.yearMin !== null && year < plan.yearMin || plan.yearMax !== null && year > plan.yearMax) return false;
      if (plan.minRating !== null && (!Number.isFinite(item.vote_average) || item.vote_average < plan.minRating)) return false;
      if (plan.language && item.original_language !== plan.language) return false;
      if (plan.runtimeMax !== null && (!Number.isFinite(item.runtime) || item.runtime <= 0 || item.runtime > plan.runtimeMax)) return false;
      if (plan.excludeGenres.some(name => matchesGenre(item, name))) return false;
      if (plan.excludeGenres.some(name => !genreIds([name], item.media_type).length) && !item._ai?.keywordChecked) return false;
      if (plan.strictGenres && !plan.genres.every(name => matchesGenre(item, name))) return false;
      if (plan.people.length && !plan.people.every(name => item._ai?.personKeys?.includes(normalizeTitle(name)))) return false;
      if (plan.providers.length && !item._ai?.providerMatch) return false;
      return true;
    });
  }

  function deterministicReason(item, plan) {
    const evidence = item._ai?.evidence || [];
    const reason = evidence.find(value => /^(Cast:|Director:|Related to:)/.test(value));
    if (reason) return reason.replace(/^Related to: /, "Recommended by the catalog alongside ") + ".";
    const genres = plan.genres.filter(name => matchesGenre(item, name));
    const facts = [];
    if (genres.length) facts.push(`${genres.join(" / ")} catalog match`);
    if (plan.yearMin !== null || plan.yearMax !== null) facts.push(`released in ${(item.release_date || item.first_air_date).slice(0, 4)}`);
    if (plan.runtimeMax !== null) facts.push(`${item.runtime}-minute runtime`);
    if (facts.length) return facts.join("; ") + ".";
    return item._ai?.sources.includes("ai") ? "AI-suggested title, verified against the TMDB catalog." : "Catalog match ranked by theme, ratings, and relevance to your request.";
  }

  function rankCandidates(items, plan, query) {
    const queryTerms = tokens([query, ...plan.keywords].join(" "));
    const scored = items.map(item => {
      const words = new Set(tokens(`${item.title || item.name} ${item.overview || ""} ${genreNames(item).join(" ")} ${(item._ai?.keywordNames || []).join(" ")}`));
      const coverage = queryTerms.length ? queryTerms.filter(term => words.has(term) || [...words].some(word => word.startsWith(term) && term.length >= 4)).length / queryTerms.length : 0;
      const votes = Math.max(0, item.vote_count || 0), rating = Math.max(0, Math.min(10, item.vote_average || 0));
      const quality = (votes * rating + 100 * 6) / (votes + 100);
      const sources = item._ai?.sources || [];
      const genreMatches = plan.genres.filter(genre => matchesGenre(item, genre)).length;
      const hasTheme = plan.genres.length || plan.keywords.length || plan.people.length || plan.seedTitles.length;
      const relevant = sources.some(source => ["ai", "seed", "person"].includes(source)) || genreMatches > 0 || item._ai?.catalogKeywordMatch || coverage > 0 || !hasTheme;
      let score = coverage * 12 + genreMatches * 2;
      if (sources.includes("ai")) score += 7;
      if (sources.includes("seed")) score += 4;
      if (sources.includes("person")) score += 4;
      score += (quality - 5) * (plan.sort === "rating" ? 2.5 : 0.7);
      if (plan.sort === "hidden-gems") score += Math.max(0, 3 - Math.log1p(item.popularity || 0) / 2);
      if (plan.sort === "recent") score += Math.max(0, Number((item.release_date || item.first_air_date).slice(0, 4)) - 1990) / 10;
      return { ...item, _ai: { ...item._ai, score, relevant, reason: deterministicReason(item, plan) } };
    }).sort((a, b) => b._ai.score - a._ai.score || (b.vote_count || 0) - (a.vote_count || 0) || a.id - b.id);
    const remaining = scored.slice(), ordered = [], counts = { movie: 0, tv: 0 };
    while (remaining.length) {
      let best = 0, bestScore = -Infinity;
      remaining.forEach((item, index) => {
        const balance = plan.mediaType === "all" ? Math.max(0, counts[item.media_type] - counts[item.media_type === "movie" ? "tv" : "movie"]) * 0.3 : 0;
        const score = item._ai.score - balance;
        if (score > bestScore) { best = index; bestScore = score; }
      });
      const item = remaining.splice(best, 1)[0];
      counts[item.media_type]++;
      ordered.push(item);
    }
    return ordered;
  }

  async function collectCandidates(options) {
    const { request, signal, query = "", onProgress = () => {} } = options;
    if (typeof request !== "function") throw new Error("A catalog request function is required");
    checkAbort(signal);
    const plan = normalizePlan(options.plan, options.mediaType), client = createRequester(request, options);
    const entries = new Map(), warnings = [], exclude = new Set(options.exclude || []);
    const today = options.today || new Date().toISOString().slice(0, 10);
    const hideAdult = options.hideAdult !== false;
    const report = () => onProgress({ candidates: entries.size, requests: client.stats.requests });
    const add = (raw, type, source, evidence = [], extra = {}) => {
      const item = catalogItem(raw, type, source, evidence);
      if (!item || entries.size >= 240 && !entries.has(keyOf(item))) return;
      Object.assign(item._ai, extra);
      const existing = entries.get(keyOf(item));
      if (existing) {
        item._ai = { ...existing._ai, ...item._ai,
          sources: unique([...existing._ai.sources, ...item._ai.sources]), evidence: unique([...existing._ai.evidence, ...item._ai.evidence]),
          personKeys: unique([...existing._ai.personKeys, ...item._ai.personKeys]), keywordNames: unique([...existing._ai.keywordNames, ...item._ai.keywordNames]),
          providerMatch: existing._ai.providerMatch || item._ai.providerMatch,
          keywordChecked: existing._ai.keywordChecked || item._ai.keywordChecked,
          catalogKeywordMatch: existing._ai.catalogKeywordMatch || item._ai.catalogKeywordMatch,
          verifiedGenres: unique([...(existing._ai.verifiedGenres || []), ...(item._ai.verifiedGenres || [])]),
          providerNames: unique([...(existing._ai.providerNames || []), ...(item._ai.providerNames || [])]),
        };
      }
      entries.set(keyOf(item), { ...existing, ...item });
      report();
    };
    const resolveTitle = async rec => {
      const type = rec.type === "tv" ? "tv" : "movie";
      const params = new URLSearchParams({ query: rec.title, include_adult: String(!hideAdult) });
      if (rec.year) params.set(type === "tv" ? "first_air_date_year" : "year", String(rec.year));
      const data = await client.get(`/search/${type}?${params}`);
      let hit = chooseTitleMatch(data?.results, rec);
      if (!hit && rec.year) {
        params.delete(type === "tv" ? "first_air_date_year" : "year");
        hit = chooseTitleMatch((await client.get(`/search/${type}?${params}`))?.results, rec);
      }
      return hit ? { ...hit, media_type: type } : null;
    };

    const people = await parallel(plan.people, async name => {
      const data = await client.get(`/search/person?${new URLSearchParams({ query: name, include_adult: String(!hideAdult) })}`);
      const person = (data?.results || []).find(p => normalizeTitle(p.name) === normalizeTitle(name));
      if (!person) return null;
      const credits = await client.get(`/person/${person.id}/combined_credits`);
      const knownDepartment = person.known_for_department;
      if (knownDepartment !== "Directing") (credits.cast || []).forEach(item => add(item, item.media_type, "person", [`Cast: ${person.name}`], { personKeys: [normalizeTitle(name)] }));
      const jobs = /\b(written|screenplay|screenwriter)\b/i.test(query) ? ["Writer", "Screenplay"]
        : knownDepartment === "Directing" || /\b(directed|director|directing)\b/i.test(query) ? ["Director"]
        : ["Director", "Writer", "Screenplay", "Creator"];
      if (knownDepartment !== "Acting") (credits.crew || []).filter(item => jobs.includes(item.job)).forEach(item => add(item, item.media_type, "person", [`${item.job === "Director" ? "Director" : "Credits"}: ${person.name}`], { personKeys: [normalizeTitle(name)] }));
      return person;
    }, signal);
    if (people.some(person => !person)) warnings.push("A requested person's exact catalog identity could not be verified. No unrelated credits were substituted.");

    const keywordMatches = await parallel(plan.keywords, async name => {
      const data = await client.get(`/search/keyword?${new URLSearchParams({ query: name })}`);
      return (data?.results || []).filter(keyword => titleSimilarity(keyword.name, name) >= 0.72).slice(0, 2).map(keyword => ({ id: keyword.id, name: keyword.name }));
    }, signal);
    const keywordIds = unique(keywordMatches.flatMap(matches => (matches || []).map(keyword => keyword.id))).slice(0, 6);
    const recommendations = (Array.isArray(options.recommendations) ? options.recommendations : []).filter(rec => rec && text(rec.title))
      .map(rec => ({ title: text(rec.title), year: number(rec.year, 1870, new Date().getFullYear()), type: rec.type === "tv" ? "tv" : "movie" }))
      .filter((rec, index, all) => all.findIndex(other => normalizeTitle(other.title) === normalizeTitle(rec.title) && other.type === rec.type && other.year === rec.year) === index).slice(0, 32);
    await parallel(recommendations, async rec => {
      if (plan.mediaType !== "all" && rec.type !== plan.mediaType) return;
      const hit = await resolveTitle(rec);
      if (hit) add(hit, rec.type, "ai");
    }, signal);
    await parallel(plan.seedTitles, async seed => {
      const hit = await resolveTitle(seed);
      if (!hit) return;
      if (!plan.avoidTitles.some(title => normalizeTitle(title) === normalizeTitle(seed.title))) {
        add(hit, hit.media_type, "ai");
        return;
      }
      exclude.add(keyOf(hit));
      await parallel(["recommendations", "similar"], async endpoint => {
        const data = await client.get(`/${hit.media_type}/${hit.id}/${endpoint}?page=${Math.max(1, Math.min(3, options.page || 1))}`);
        (data?.results || []).forEach(item => add(item, hit.media_type, "seed", [`Related to: ${hit.title || hit.name}`]));
      }, signal, 2);
    }, signal, 2);

    const requestedProviders = plan.providers.map(name => ({ name, id: PROVIDER_IDS[normalizeTitle(name).replace(/ /g, "")] }));
    const providerIds = unique(requestedProviders.map(provider => provider.id).filter(Boolean));
    const singleProviderNames = providerIds.length === 1 ? requestedProviders.filter(provider => provider.id).map(provider => provider.name) : [];
    if (requestedProviders.some(provider => !provider.id)) warnings.push("Some requested services were not recognized. Availability is checked in the US catalog for recognized services only.");
    const media = plan.mediaType === "all" ? ["movie", "tv"] : [plan.mediaType];
    await parallel(media, async type => {
      const params = new URLSearchParams({ include_adult: String(!hideAdult), page: String(Math.max(1, Math.min(3, options.page || 1))), "vote_count.gte": plan.sort === "hidden-gems" ? "10" : "30" });
      params.set("sort_by", plan.sort === "rating" ? "vote_average.desc" : plan.sort === "recent" ? (type === "tv" ? "first_air_date.desc" : "primary_release_date.desc") : "popularity.desc");
      const dateField = type === "tv" ? "first_air_date" : "primary_release_date";
      params.set(`${dateField}.lte`, plan.yearMax !== null ? `${plan.yearMax}-12-31` < today ? `${plan.yearMax}-12-31` : today : today);
      if (plan.yearMin !== null) params.set(`${dateField}.gte`, `${plan.yearMin}-01-01`);
      if (plan.minRating !== null) params.set("vote_average.gte", String(plan.minRating));
      if (plan.language) params.set("with_original_language", plan.language);
      const genres = genreIds(plan.genres, type), excludedGenres = genreIds(plan.excludeGenres, type);
      if (genres.length) params.set("with_genres", genres.join(plan.strictGenres ? "," : "|"));
      if (excludedGenres.length) params.set("without_genres", excludedGenres.join(","));
      if (keywordIds.length) params.set("with_keywords", keywordIds.join("|"));
      if (plan.runtimeMax !== null && type === "movie") params.set("with_runtime.lte", String(plan.runtimeMax));
      if (providerIds.length) { params.set("with_watch_providers", providerIds.join("|")); params.set("watch_region", "US"); }
      if (type === "movie" && people.every(Boolean) && people.length) params.set("with_people", people.map(person => person.id).join(","));
      const data = await client.get(`/discover/${type}?${params}`);
      (data?.results || []).forEach(item => add(item, type, "catalog", singleProviderNames.length ? [`Provider availability: ${singleProviderNames.join(", ")} (US)`] : [], {
        providerMatch: singleProviderNames.length > 0,
        providerNames: singleProviderNames,
        catalogKeywordMatch: keywordIds.length > 0,
      }));
    }, signal, 2);
    checkAbort(signal);

    // Verify metadata only when a hard filter needs facts absent from list endpoints.
    const metadataPool = rankCandidates([...entries.values()].filter(item => !exclude.has(keyOf(item))), { ...plan, people: [] }, query).slice(0, 40);
    await parallel(metadataPool, async item => {
      const needsRuntime = plan.runtimeMax !== null && !Number.isFinite(item.runtime);
      const needsGenreKeywords = (plan.strictGenres ? plan.genres : []).concat(plan.excludeGenres).some(genre => !genreIds([genre], item.media_type).length);
      if (needsRuntime || needsGenreKeywords) {
        const details = await client.get(`/${item.media_type}/${item.id}${needsGenreKeywords ? "?append_to_response=keywords" : ""}`);
        const original = entries.get(keyOf(item));
        if (!original || details?.id !== item.id) return;
        const runtime = details.runtime || (details.episode_run_time || []).find(value => Number.isFinite(value) && value > 0);
        const keywords = details.keywords?.keywords || details.keywords?.results;
        const enriched = { ...original, ...details, runtime, media_type: item.media_type, _ai: { ...original._ai, keywordChecked: Array.isArray(keywords) || original._ai.keywordChecked, keywordNames: Array.isArray(keywords) ? list(keywords.map(keyword => keyword.name), 30) : original._ai.keywordNames } };
        enriched._ai.verifiedGenres = unique([...(original._ai.verifiedGenres || []), ...plan.genres.concat(plan.excludeGenres).filter(genre => matchesGenre(enriched, genre))]);
        entries.set(keyOf(item), enriched);
      }
      if (providerIds.length && !entries.get(keyOf(item))?._ai.providerMatch) {
        const providers = await client.get(`/${item.media_type}/${item.id}/watch/providers`);
        const region = providers?.results?.US || {};
        const available = unique([...(region.flatrate || []), ...(region.free || []), ...(region.ads || []), ...(region.rent || []), ...(region.buy || [])].map(provider => provider.provider_id));
        const matchedNames = requestedProviders.filter(provider => available.includes(provider.id)).map(provider => provider.name);
        const original = entries.get(keyOf(item));
        if (original) {
          original._ai.providerMatch = matchedNames.length > 0;
          original._ai.providerNames = matchedNames;
          if (matchedNames.length) original._ai.evidence.push(`Provider availability: ${matchedNames.join(", ")} (US)`);
        }
      }
    }, signal);
    checkAbort(signal);
    if (!entries.size && client.stats.failures && client.stats.failures >= client.stats.requests) throw new Error("The movie catalog could not be reached. Check your connection and retry.");
    if (client.stats.failures) warnings.push("Some catalog lookups failed; only successfully verified titles are included.");
    if (client.stats.limited) warnings.push("The catalog time/request limit was reached. Showing the matches verified so far.");
    if (plan.providers.length) warnings.push("Service availability is checked for the US and can change by region or date.");
    const filtered = applyConstraints([...entries.values()], plan, { exclude: [...exclude], hideAdult, today });
    const items = rankCandidates(filtered, plan, query).filter(item => item._ai.relevant).slice(0, 80);
    return { items, plan, warnings: unique(warnings), stats: { ...client.stats, verified: entries.size, matched: items.length } };
  }

  function buildRankCandidates(items) {
    return items.slice(0, 80).map(item => ({
      id: item.id, media_type: item.media_type, title: text(item.title || item.name),
      release_date: item.release_date || item.first_air_date || "", overview: text(item.overview, 700),
      genre_names: genreNames(item).slice(0, 8), vote_average: number(item.vote_average, 0, 10), vote_count: Math.max(0, item.vote_count || 0),
      runtime: number(item.runtime, 1, 1440), original_language: text(item.original_language, 2), popularity: Math.max(0, item.popularity || 0),
      source: (item._ai?.sources || []).join(", "), evidence: [...(item._ai?.evidence || []).filter(value => /^(Cast:|Director:|Credits:|Provider availability:)/.test(value)), ...(item._ai?.evidence || []).filter(value => !/^(Cast:|Director:|Credits:|Provider availability:)/.test(value))].join("; ").slice(0, 500),
    }));
  }

  function mergeRankedResults(items, picks, limit = 24) {
    const known = new Map(items.map(item => [keyOf(item), item])), used = new Set(), result = [];
    for (const pick of Array.isArray(picks) ? picks : []) {
      const key = `${pick?.type}_${pick?.id}`, item = known.get(key);
      if (!item || used.has(key)) continue;
      used.add(key);
      result.push({ ...item, _ai: { ...item._ai, reason: text(pick.reason, 220) || item._ai.reason, rankedByAI: true } });
      if (result.length >= limit) return result;
    }
    for (const item of items) {
      if (used.has(keyOf(item))) continue;
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  }

  function describeConstraints(plan) {
    const parts = [];
    if (plan.mediaType !== "all") parts.push(plan.mediaType === "tv" ? "Series" : "Movies");
    parts.push(...plan.genres);
    if (plan.yearMin !== null || plan.yearMax !== null) parts.push(plan.yearMin === plan.yearMax ? String(plan.yearMin) : `${plan.yearMin || "Any year"}–${plan.yearMax || "Now"}`);
    if (plan.runtimeMax !== null) parts.push(`Up to ${plan.runtimeMax} min`);
    if (plan.minRating !== null) parts.push(`Rating ${plan.minRating}+`);
    if (plan.language) parts.push(`Language: ${plan.language.toUpperCase()}`);
    parts.push(...plan.people, ...plan.providers, ...plan.excludeGenres.map(genre => `No ${genre}`));
    return parts;
  }

  return { normalizeTitle, normalizePlan, chooseTitleMatch, createRequester, collectCandidates, applyConstraints, rankCandidates, buildRankCandidates, mergeRankedResults, describeConstraints, genreNames, keyOf };
});
