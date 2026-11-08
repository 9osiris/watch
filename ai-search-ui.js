(function (root) {
  "use strict";

  const node = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };

  function create(config) {
    const catalog = root.OsirisAICatalog;
    if (!catalog) throw new Error("AI catalog module is missing. Reload the page.");
    const { input, status, grid, renderCard, requestCatalog, onQuery } = config;
    const panel = document.querySelector("#ai-search-panel");
    const summary = document.querySelector("#ai-results-summary");
    const actions = document.querySelector("#ai-result-actions");
    const refinements = document.querySelector("#ai-refinements");
    const examples = document.querySelector("#ai-search-examples");
    const cancel = document.querySelector("#ai-search-cancel");
    const more = document.querySelector("#ai-search-more");
    const refresh = document.querySelector("#ai-search-refresh");
    const media = document.querySelector("#ai-search-media");
    const sort = document.querySelector("#ai-search-sort");
    const hideWatched = document.querySelector("#ai-search-hide-watched");
    const modelBadge = document.querySelector("#ai-search-model");
    let enabled = false, active = null, allItems = [], shown = 0, lastQuery = "", lastScope = "", round = 1;
    let excluded = [], resultBundle = null;
    if (hideWatched) hideWatched.checked = config.hideWatched?.() === true;

    function busy(value) {
      status.classList.toggle("is-busy", value);
      grid.setAttribute("aria-busy", String(value));
      if (cancel) cancel.hidden = !value;
      if (refresh) refresh.disabled = value;
      if (more) more.disabled = value;
      if (value && actions) actions.hidden = true;
    }

    function progress(message) {
      if (!enabled) return;
      const wrap = node("span", "search-pending");
      const spinner = node("span", "spin-dot");
      spinner.setAttribute("aria-hidden", "true");
      wrap.append(spinner, document.createTextNode(message));
      status.replaceChildren(wrap);
    }

    function renderRefinements(values) {
      if (!refinements) return;
      refinements.replaceChildren();
      const prompts = [...new Set((Array.isArray(values) ? values : []).filter(value => typeof value === "string" && value.trim()).map(value => value.trim().slice(0, 1000)))].slice(0, 3);
      if (!prompts.length) { refinements.hidden = true; return; }
      refinements.appendChild(node("p", "ai-refinement-label", "Refine your search"));
      const group = node("div", "ai-refinement-chips");
      prompts.forEach(prompt => {
        const button = node("button", "glass-chip ai-refinement", prompt);
        button.type = "button";
        button.addEventListener("click", () => onQuery(prompt));
        group.appendChild(button);
      });
      refinements.appendChild(group);
      refinements.hidden = false;
    }

    function renderSummary(bundle) {
      if (!summary) return;
      summary.replaceChildren();
      summary.appendChild(node("h2", "ai-summary-title", bundle.intro || bundle.plan.summary || `Matches for ${bundle.query}`));
      const constraints = catalog.describeConstraints(bundle.plan);
      if (constraints.length) {
        const chips = node("div", "ai-constraint-chips");
        constraints.forEach(constraint => chips.appendChild(node("span", "ai-constraint-chip", constraint)));
        summary.appendChild(chips);
      }
      summary.appendChild(node("p", "ai-summary-meta", `${bundle.stats.matched} verified catalog matches considered. ${bundle.aiRanked ? "AI-ranked picks with catalog-backed explanations." : "Ordered by catalog relevance."}`));
      if (bundle.warnings.length) {
        const details = node("details", "ai-search-notes");
        details.appendChild(node("summary", "", "Search notes"));
        const list = node("ul");
        bundle.warnings.forEach(warning => list.appendChild(node("li", "", warning)));
        details.appendChild(list);
        summary.appendChild(details);
      }
      summary.hidden = false;
    }

    function renderPage() {
      grid.replaceChildren();
      allItems.slice(0, shown).forEach(item => {
        const result = node("article", "ai-result");
        result.dataset.catalogId = String(item.id);
        result.dataset.mediaType = item.media_type;
        result.appendChild(renderCard(item, item.media_type));
        const explanation = node("div", "ai-card-explanation");
        explanation.appendChild(node("span", "ai-match-label", item._ai?.rankedByAI ? "AI-ranked / TMDB verified" : "Catalog match / TMDB verified"));
        explanation.appendChild(node("p", "ai-card-reason", item._ai?.reason || "Verified catalog match."));
        if (item.runtime) explanation.appendChild(node("span", "ai-card-runtime", `${item.runtime} min`));
        result.appendChild(explanation);
        grid.appendChild(result);
      });
      status.textContent = `${Math.min(shown, allItems.length)} of ${allItems.length} ${allItems.length === 1 ? "pick" : "picks"}`;
      if (more) { more.hidden = shown >= allItems.length; more.textContent = `Show ${Math.min(12, allItems.length - shown)} more matches`; }
      if (actions) actions.hidden = !allItems.length;
      if (examples) examples.hidden = allItems.length > 0;
    }

    function emptyState(message, description) {
      grid.replaceChildren();
      const box = node("div", "no-results ai-empty");
      box.append(node("h3", "", message), node("p", "", description));
      grid.appendChild(box);
      if (actions) actions.hidden = true;
    }

    function showError(message, query) {
      emptyState("AI search needs another try", message);
      const button = node("button", "btn-ghost ai-retry", "Retry search");
      button.type = "button";
      button.addEventListener("click", () => onQuery(query));
      grid.querySelector(".ai-empty")?.appendChild(button);
      status.textContent = "Search failed";
      if (summary) summary.hidden = true;
    }

    async function callAPI(body, signal) {
      const response = await fetch("/api/ai-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
      let data;
      try { data = await response.json(); }
      catch (_) { throw new Error("AI search is not responding correctly on this deployment. Reload or try again shortly."); }
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : `AI search returned HTTP ${response.status}. Try again shortly.`;
        throw new Error(message);
      }
      if (data?.version !== 2 || data.operation !== body.operation) throw new Error("The AI search deployment is updating. Reload the page and retry.");
      return data;
    }

    async function search(rawQuery, options = {}) {
      if (!enabled) return;
      active?.ctrl.abort();
      const query = (typeof rawQuery === "string" ? rawQuery : "").trim();
      if (!query) {
        active = null; allItems = []; shown = 0; lastQuery = ""; excluded = []; resultBundle = null; round = 1;
        busy(false);
        status.textContent = "";
        if (summary) summary.hidden = true;
        if (refinements) refinements.hidden = true;
        if (examples) examples.hidden = false;
        emptyState("Find your next watch", "Describe a mood, plot, era, actor, runtime, or a title you like. AI interprets your request; the catalog verifies the matches.");
        return;
      }
      if (query.length > 1000) { active = null; busy(false); showError("Keep the request under 1,000 characters so it can be processed accurately.", query); return; }
      const scope = `${media?.value || "all"}/${sort?.value || "relevance"}/${hideWatched?.checked || false}`;
      if (lastQuery !== query || lastScope !== scope) { excluded = []; round = 1; }
      lastQuery = query; lastScope = scope;
      const job = { ctrl: new AbortController(), timedOut: false };
      active = job;
      const forwardAbort = () => job.ctrl.abort();
      options.signal?.addEventListener("abort", forwardAbort, { once: true });
      if (options.signal?.aborted) job.ctrl.abort();
      const timeout = setTimeout(() => { job.timedOut = true; job.ctrl.abort(); }, 60000);
      const alive = () => enabled && active === job && !job.ctrl.signal.aborted;
      const uiOptions = { mediaType: media?.value || "all", hideAdult: config.hideAdult?.() !== false };
      const blocked = [...new Set([...(config.exclude?.(hideWatched?.checked === true) || []), ...excluded])].slice(0, 100);
      const oldBundle = resultBundle;
      busy(true);
      progress("Understanding your request…");
      if (refinements) refinements.hidden = true;
      try {
        const response = await callAPI({ operation: "plan", query, options: uiOptions, exclude: blocked }, job.ctrl.signal);
        if (!alive()) return;
        const plan = catalog.normalizePlan(response.plan, uiOptions.mediaType);
        if (sort?.value && sort.value !== "relevance") plan.sort = sort.value;
        if (modelBadge) modelBadge.textContent = response.model === "openai/gpt-oss-20b" ? "Some random gpt model" : response.model;
        progress("Verifying titles, credits, and catalog matches…");
        const collected = await catalog.collectCandidates({
          plan, query, recommendations: response.results, mediaType: uiOptions.mediaType, hideAdult: uiOptions.hideAdult,
          exclude: blocked, request: requestCatalog, signal: job.ctrl.signal, page: round,
          onProgress: stats => { if (alive()) progress(`Checking the catalog… ${stats.candidates} titles found`); },
        });
        if (!alive()) return;
        if (!collected.items.length) {
          allItems = []; shown = 0; resultBundle = null;
          renderSummary({ query, plan, stats: collected.stats, intro: "No verified titles matched every restriction", warnings: collected.warnings, aiRanked: false });
          emptyState("No exact catalog matches", "The search keeps your date, runtime, language, cast, and exclusion rules instead of filling the grid with unrelated titles. Try broadening one restriction.");
          renderRefinements(response.suggestions);
          status.textContent = "No verified matches";
          return;
        }
        progress(`Ranking ${collected.items.length} verified matches…`);
        let ranking = null;
        const warnings = collected.warnings.slice();
        try {
          ranking = await callAPI({ operation: "rank", query, options: uiOptions, plan, exclude: blocked, candidates: catalog.buildRankCandidates(collected.items) }, job.ctrl.signal);
        } catch (error) {
          if (job.ctrl.signal.aborted) throw error;
          warnings.push("AI reranking was temporarily unavailable. These verified matches are ordered by catalog relevance, not invented or discarded.");
        }
        if (!alive()) return;
        allItems = catalog.mergeRankedResults(collected.items, ranking?.results || [], 24);
        shown = Math.min(12, allItems.length);
        const aiRanked = allItems.some(item => item._ai?.rankedByAI);
        if (ranking && !aiRanked) warnings.push("AI returned no usable ranking. Showing verified matches in catalog-relevance order.");
        resultBundle = { query, plan, stats: collected.stats, intro: aiRanked ? ranking.intro || plan.summary : plan.summary, warnings, aiRanked };
        renderSummary(resultBundle);
        renderPage();
        renderRefinements(ranking?.suggestions?.length ? ranking.suggestions : response.suggestions);
      } catch (error) {
        if (!enabled || active !== job || options.signal?.aborted) return;
        if (job.ctrl.signal.aborted && !job.timedOut) {
          if (oldBundle && allItems.length) { resultBundle = oldBundle; renderSummary(oldBundle); renderPage(); }
          else emptyState("Search cancelled", "Your request wasn't completed. Edit the prompt or choose Ask AI to try again.");
          status.textContent = "Search cancelled";
        } else showError(job.timedOut ? "The search took too long. Try a more specific prompt or retry in a moment." : error.message || "Check your connection and retry.", query);
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", forwardAbort);
        if (active === job) { active = null; busy(false); }
      }
    }

    function setEnabled(value) {
      enabled = value;
      if (panel) panel.hidden = !value;
      if (!value) {
        active?.ctrl.abort();
        if (summary) summary.hidden = true;
        if (refinements) refinements.hidden = true;
        if (actions) actions.hidden = true;
        busy(false);
      }
    }

    examples?.querySelectorAll("[data-ai-query]").forEach(button => button.addEventListener("click", () => onQuery(button.dataset.aiQuery)));
    cancel?.addEventListener("click", () => active?.ctrl.abort());
    more?.addEventListener("click", () => { shown = Math.min(allItems.length, shown + 12); renderPage(); });
    refresh?.addEventListener("click", () => {
      if (!lastQuery || active) return;
      excluded = [...new Set([...excluded, ...allItems.map(catalog.keyOf)])].slice(-100);
      round = round % 3 + 1;
      onQuery(input.value.trim() || lastQuery);
    });
    [media, sort, hideWatched].forEach(control => control?.addEventListener("change", () => { if (enabled && input.value.trim()) onQuery(input.value.trim()); }));
    return { search, setEnabled };
  }

  root.OsirisAISearchUI = { create };
})(typeof globalThis !== "undefined" ? globalThis : window);
