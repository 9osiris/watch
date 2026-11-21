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
    let copyPicksBtn = document.querySelector("#ai-copy-picks-btn");
    if (!copyPicksBtn && actions) {
      copyPicksBtn = node("button", "glass-chip ai-copy-picks-btn", "Copy picks");
      copyPicksBtn.type = "button";
      copyPicksBtn.id = "ai-copy-picks-btn";
      actions.appendChild(copyPicksBtn);
    }
    const sort = document.querySelector("#ai-search-sort");
    const hideWatched = document.querySelector("#ai-search-hide-watched");
    const personalize = document.querySelector("#ai-search-personalize");
    const tasteCard = document.querySelector("#ai-taste-card");
    const tasteHeadline = document.querySelector("#ai-taste-headline");
    const tasteDetails = document.querySelector("#ai-taste-details");
    const tastePickBtn = document.querySelector("#ai-taste-pick-btn");
    const tasteToggleBtn = document.querySelector("#ai-taste-toggle-btn");
    const recentPromptsEl = document.querySelector("#ai-recent-prompts");
    let enabled = false, active = null, allItems = [], shown = 0, lastQuery = "", lastScope = "", round = 1;
    let excluded = [], resultBundle = null;
    const resultCache = new Map();
    if (hideWatched) hideWatched.checked = config.hideWatched?.() === true;
    if (personalize && typeof config.personalizeDefault === "boolean") personalize.checked = config.personalizeDefault;

    function renderRecentPrompts() {
      if (!recentPromptsEl) return;
      const prompts = (typeof config.getRecentPrompts === "function" ? config.getRecentPrompts() : []) || [];
      if (!enabled || !prompts.length) {
        recentPromptsEl.hidden = true;
        recentPromptsEl.replaceChildren();
        return;
      }
      recentPromptsEl.replaceChildren();
      recentPromptsEl.appendChild(node("span", "ai-recent-label", "Recent AI:"));
      prompts.slice(0, 4).forEach(prompt => {
        const chip = node("button", "glass-chip ai-recent-chip", prompt);
        chip.type = "button";
        chip.addEventListener("click", () => onQuery(prompt));
        recentPromptsEl.appendChild(chip);
      });
      recentPromptsEl.hidden = false;
    }

    function renderTasteSnapshot() {
      if (!tasteCard || !tasteHeadline) return;
      if (!enabled || typeof config.getTasteSnapshot !== "function") {
        tasteCard.hidden = true;
        return;
      }
      const snap = config.getTasteSnapshot();
      const usePersonal = personalize ? personalize.checked : true;
      tasteCard.hidden = false;
      tasteCard.classList.toggle("is-muted", !usePersonal);
      if (!snap || (!snap.watchedCount && !snap.savedCount)) {
        tasteHeadline.textContent = "Watch or save titles to unlock personalized AI picks based on your history.";
        if (tastePickBtn) tastePickBtn.textContent = "Surprise pick for me";
        if (tasteToggleBtn) tasteToggleBtn.hidden = true;
        if (tasteDetails) { tasteDetails.hidden = true; tasteDetails.replaceChildren(); }
        return;
      }
      if (tasteToggleBtn) tasteToggleBtn.hidden = false;
      const parts = [];
      if (snap.watchedCount) parts.push(`${snap.watchedCount} watched`);
      if (snap.savedCount) parts.push(`${snap.savedCount} saved`);
      if (snap.topGenres?.length) parts.push(`Top: ${snap.topGenres.slice(0, 3).join(", ")}`);
      if (snap.preferredEra) parts.push(snap.preferredEra);
      tasteHeadline.textContent = usePersonal
        ? `${parts.join(" · ")}`
        : `Personal history paused (${parts.slice(0, 2).join(" · ")})`;
      if (tastePickBtn) tastePickBtn.textContent = "Pick for me";
      if (!tasteDetails) return;
      tasteDetails.replaceChildren();
      const metrics = node("div", "ai-taste-metrics");
      const addMetric = (label, value) => {
        const box = node("div", "ai-taste-metric");
        box.append(node("span", "ai-taste-metric-label", label), node("span", "ai-taste-metric-value", value));
        metrics.appendChild(box);
      };
      addMetric("Activity", `${snap.watchedCount} tracked · ${snap.savedCount} My List`);
      addMetric("Format mix", snap.formatMix || "Balanced");
      addMetric("Completion", snap.completionStyle || "Mixed");
      if (snap.folders?.length) addMetric("Folders", snap.folders.slice(0, 3).join(", "));
      tasteDetails.appendChild(metrics);
      if (snap.topGenres?.length) {
        const gRow = node("div", "ai-taste-chips");
        gRow.appendChild(node("span", "ai-taste-chip-label", "Top genres:"));
        snap.topGenres.slice(0, 5).forEach(g => gRow.appendChild(node("span", "ai-taste-pill", g)));
        tasteDetails.appendChild(gRow);
      }
      if (snap.sampleTitles?.length) {
        const tRow = node("div", "ai-taste-chips");
        tRow.appendChild(node("span", "ai-taste-chip-label", "Signals:"));
        snap.sampleTitles.slice(0, 5).forEach(t => tRow.appendChild(node("span", "ai-taste-pill", t)));
        tasteDetails.appendChild(tRow);
      }
      if (snap.suggestedPrompts?.length) {
        const pRow = node("div", "ai-taste-prompts");
        snap.suggestedPrompts.slice(0, 3).forEach(prompt => {
          const btn = node("button", "glass-chip", prompt);
          btn.type = "button";
          btn.addEventListener("click", () => onQuery(prompt));
          pRow.appendChild(btn);
        });
        tasteDetails.appendChild(pRow);
      }
    }

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
      summary.appendChild(node("p", "ai-summary-meta", `${bundle.stats.matched} verified catalog matches considered. ${bundle.aiRanked ? "AI-ranked picks with catalog-backed explanations." : bundle.pendingRank ? "Verified catalog matches shown while AI ranks your top picks…" : "Ordered by catalog relevance."}`));
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
      let response;
      try {
        response = await fetch("/api/ai-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        throw Object.assign(new Error(err?.message || "Network error contacting AI Search."), { isNetwork: true });
      }
      let data;
      try { data = await response.json(); }
      catch (_) { throw Object.assign(new Error("AI search is not responding correctly on this deployment. Reload or try again shortly."), { status: response.status }); }
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : `AI search returned HTTP ${response.status}. Try again shortly.`;
        throw Object.assign(new Error(message), { status: response.status });
      }
      if (data?.version !== 2 || data.operation !== body.operation) throw new Error("The AI search deployment is updating. Reload the page and retry.");
      return data;
    }

    function renderRelaxationChips(plan, applyPlanFn) {
      const relaxations = typeof catalog.getConstraintRelaxations === "function" ? catalog.getConstraintRelaxations(plan) : [];
      if (!relaxations.length) return;
      const box = grid.querySelector(".ai-empty");
      if (!box) return;
      const row = node("div", "ai-relax-row");
      relaxations.forEach(rel => {
        const btn = node("button", "glass-chip ai-relax-btn", rel.label);
        btn.type = "button";
        btn.addEventListener("click", () => applyPlanFn(catalog.normalizePlan({ ...plan, ...rel.patch }, plan.mediaType)));
        row.appendChild(btn);
      });
      box.appendChild(row);
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
        renderTasteSnapshot();
        renderRecentPrompts();
        emptyState("Find your next watch", "Describe a mood, plot, era, actor, runtime, or ask what to watch from your history and My List.");
        return;
      }
      if (query.length > 1000) { active = null; busy(false); showError("Keep the request under 1,000 characters so it can be processed accurately.", query); return; }
      const usePersonal = personalize ? personalize.checked : true;
      const profile = usePersonal && typeof config.getProfile === "function" ? config.getProfile() : null;
      const watchRegion = typeof config.getWatchRegion === "function" ? config.getWatchRegion() : "US";
      const profileSig = profile ? `${(profile.topGenres || []).join(",")}|${(profile.recentWatched || []).length}|${(profile.savedList || []).length}` : "none";
      const scope = `${media?.value || "all"}/${sort?.value || "relevance"}/${hideWatched?.checked || false}/${watchRegion}/${usePersonal}`;
      if (lastQuery !== query || lastScope !== scope) { excluded = []; round = 1; }
      lastQuery = query; lastScope = scope;

      const cacheKey = `${query.toLowerCase()}::${scope}::${round}::${profileSig}`;
      if (!options.bypassCache && !options.overridePlan && resultCache.has(cacheKey)) {
        const cached = resultCache.get(cacheKey);
        allItems = cached.items;
        shown = Math.min(12, allItems.length);
        resultBundle = cached.bundle;
        busy(false);
        renderSummary(resultBundle);
        renderPage();
        renderRefinements(cached.suggestions);
        config.onRecordPrompt?.(query);
        renderRecentPrompts();
        return;
      }

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
      progress(profile ? "Blending your watch profile and request…" : "Understanding your request…");
      if (refinements) refinements.hidden = true;
      try {
        let response = null;
        let usedLocalFallback = false;
        const planWarnings = [];
        if (options.overridePlan) {
          response = { plan: options.overridePlan, results: [], suggestions: [] };
        } else {
          try {
            const planBody = { operation: "plan", query, options: uiOptions, exclude: blocked };
            if (profile) planBody.profile = profile;
            response = await callAPI(planBody, job.ctrl.signal);
          } catch (planErr) {
            if (job.ctrl.signal.aborted || planErr?.status === 400) throw planErr;
            if (typeof catalog.buildLocalFallbackPlan === "function" && [429, 502, 503, 504].includes(planErr?.status) || planErr?.isNetwork) {
              usedLocalFallback = true;
              response = { plan: catalog.buildLocalFallbackPlan(query, { mediaType: uiOptions.mediaType, sort: sort?.value || "relevance", profile }), results: [], suggestions: [] };
              planWarnings.push(`${planErr.message} Showing verified catalog matches using local query parsing.`);
            } else {
              throw planErr;
            }
          }
        }
        if (!alive()) return;
        const plan = catalog.normalizePlan(response.plan, uiOptions.mediaType);
        if (sort?.value && sort.value !== "relevance") plan.sort = sort.value;
        config.onRecordPrompt?.(query);
        renderRecentPrompts();
        progress("Verifying titles, credits, and catalog matches…");
        const collected = await catalog.collectCandidates({
          plan, query, recommendations: response.results, mediaType: uiOptions.mediaType, hideAdult: uiOptions.hideAdult,
          exclude: blocked, request: requestCatalog, signal: job.ctrl.signal, page: round, watchRegion, profile,
          onProgress: stats => { if (alive()) progress(`Checking the catalog… ${stats.candidates} titles found`); },
        });
        if (!alive()) return;
        const baseWarnings = [...planWarnings, ...collected.warnings];
        if (!collected.items.length) {
          allItems = []; shown = 0; resultBundle = null;
          renderSummary({ query, plan, stats: collected.stats, intro: "No verified titles matched every restriction", warnings: baseWarnings, aiRanked: false });
          emptyState("No exact catalog matches", "The search keeps your date, runtime, language, cast, and exclusion rules instead of filling the grid with unrelated titles. Try relaxing one constraint below.");
          renderRelaxationChips(plan, relaxedPlan => search(query, { ...options, overridePlan: relaxedPlan, bypassCache: true }));
          renderRefinements(response.suggestions);
          status.textContent = "No verified matches";
          return;
        }

        // Progressive Stage 1 render: surface verified matches immediately while AI ranking completes
        allItems = collected.items.slice(0, 24);
        shown = Math.min(12, allItems.length);
        resultBundle = { query, plan, stats: collected.stats, intro: plan.summary, warnings: baseWarnings, aiRanked: false, pendingRank: !usedLocalFallback };
        renderSummary(resultBundle);
        renderPage();

        let ranking = null;
        const warnings = baseWarnings.slice();
        if (!usedLocalFallback) {
          progress(`Refining top picks across ${collected.items.length} matches…`);
          try {
            const rankBody = { operation: "rank", query, options: uiOptions, plan, exclude: blocked, candidates: catalog.buildRankCandidates(collected.items) };
            if (profile) rankBody.profile = profile;
            ranking = await callAPI(rankBody, job.ctrl.signal);
          } catch (error) {
            if (job.ctrl.signal.aborted) throw error;
            warnings.push("AI reranking was temporarily unavailable. These verified matches are ordered by catalog relevance, not invented or discarded.");
          }
        }
        if (!alive()) return;
        allItems = catalog.mergeRankedResults(collected.items, ranking?.results || [], 24);
        shown = Math.min(12, allItems.length);
        const aiRanked = allItems.some(item => item._ai?.rankedByAI);
        if (ranking && !aiRanked) warnings.push("AI returned no usable ranking. Showing verified matches in catalog-relevance order.");
        resultBundle = { query, plan, stats: collected.stats, intro: aiRanked ? ranking.intro || plan.summary : plan.summary, warnings, aiRanked };
        const finalSuggestions = ranking?.suggestions?.length ? ranking.suggestions : response.suggestions;
        renderSummary(resultBundle);
        renderPage();
        renderRefinements(finalSuggestions);
        if (resultCache.size >= 8) resultCache.delete(resultCache.keys().next().value);
        resultCache.set(cacheKey, { items: allItems.slice(), bundle: resultBundle, suggestions: finalSuggestions });
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
      if (value) {
        renderTasteSnapshot();
        renderRecentPrompts();
      } else {
        active?.ctrl.abort();
        if (summary) summary.hidden = true;
        if (refinements) refinements.hidden = true;
        if (actions) actions.hidden = true;
        busy(false);
      }
    }

    tasteToggleBtn?.addEventListener("click", () => {
      if (!tasteDetails) return;
      const open = tasteDetails.hidden;
      tasteDetails.hidden = !open;
      tasteToggleBtn.setAttribute("aria-expanded", String(open));
      tasteToggleBtn.textContent = open ? "Hide details" : "Details";
      try { sessionStorage.setItem("orc_ai_taste_open", open ? "1" : "0"); } catch {}
    });
    if (tasteDetails && tasteToggleBtn) {
      try {
        if (sessionStorage.getItem("orc_ai_taste_open") === "1" && !tasteToggleBtn.hidden) {
          tasteDetails.hidden = false;
          tasteToggleBtn.setAttribute("aria-expanded", "true");
          tasteToggleBtn.textContent = "Hide details";
        }
      } catch {}
    }
    copyPicksBtn?.addEventListener("click", async () => {
      if (!allItems.length) return;
      const lines = allItems.slice(0, shown).map((it, idx) => {
        const t = it.title || it.name || "Untitled";
        const y = (it.release_date || it.first_air_date || "").slice(0, 4);
        const r = it._ai?.reason ? ` - ${it._ai.reason}` : "";
        return `${idx + 1}. ${t}${y ? ` (${y})` : ""}${r}`;
      });
      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        const orig = copyPicksBtn.textContent;
        copyPicksBtn.textContent = "Copied ✓";
        setTimeout(() => { copyPicksBtn.textContent = orig; }, 1600);
      } catch {}
    });
    input?.addEventListener("keydown", e => {
      if (!enabled || e.key !== "Escape") return;
      if (active) {
        active.ctrl.abort();
      } else if (input.value) {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    tastePickBtn?.addEventListener("click", () => {
      const snap = typeof config.getTasteSnapshot === "function" ? config.getTasteSnapshot() : null;
      const q = snap?.quickPickPrompt || "Recommend a movie or series for me tonight based on what I've been watching and my My List";
      onQuery(q);
    });
    examples?.querySelectorAll("[data-ai-query]").forEach(button => button.addEventListener("click", () => onQuery(button.dataset.aiQuery)));
    cancel?.addEventListener("click", () => active?.ctrl.abort());
    more?.addEventListener("click", () => { shown = Math.min(allItems.length, shown + 12); renderPage(); });
    refresh?.addEventListener("click", () => {
      if (!lastQuery || active) return;
      excluded = [...new Set([...excluded, ...allItems.map(catalog.keyOf)])].slice(-100);
      round = round % 3 + 1;
      onQuery(input.value.trim() || lastQuery, { bypassCache: true });
    });
    [media, sort, hideWatched, personalize].forEach(control => control?.addEventListener("change", () => {
      if (control === personalize) renderTasteSnapshot();
      if (enabled && input.value.trim()) onQuery(input.value.trim());
    }));
    return { search, setEnabled, refreshTaste: renderTasteSnapshot };
  }

  root.OsirisAISearchUI = { create };
})(typeof globalThis !== "undefined" ? globalThis : window);
