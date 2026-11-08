Open Source Movie Website.. Can find at https://watch.osiris.rocks

Website may not be up for long due to risk of domain seize or host issues.

## Dev Log
- Fixed asynchronous hero transition bug where color bleed would lag behind the image load.
- Added bulletproof CORS proxy fallback to canvas extraction.
- Replaced raw innerHTML DOM injections with textContent for security and speed.
- Wrapped all localStorage operations in try-catch to prevent fatal crashes in strict mode.
- Enforced explicit button types across all HTML forms to prevent buggy submissions.
- Setup CSS Preload for faster FCP/LCP metrics.
- Bumped Service Worker cache version to aggressively invalidate stale assets.

## AI discovery
Open `/search?type=ai` or choose **AI Search** in Discover. Describe a mood, plot, era, actor, language, runtime, or a title you like, then select **Ask AI** or press Enter.

The engine uses three stages instead of rendering a short, unverified model list:
1. **Understand:** Groq `openai/gpt-oss-20b` extracts structured intent and a broader set of title suggestions.
2. **Verify:** `ai-search-catalog.js` resolves actual TMDB titles, credits, similar-title recommendations, genre/keyword discovery, and release metadata. Explicit date, runtime, rating, language, person, and exclusion constraints filter the candidate pool. Missing posters do not discard valid titles.
3. **Rank:** AI ranks only the verified catalog IDs supplied to it, with explanations grounded in their metadata. Duplicate and invented IDs are removed. If reranking fails, relevant verified matches remain available with an explanatory search note.

Up to 80 verified candidates are considered, with up to 24 picks shown in batches of 12. **Find different picks** excludes the previous shortlist, and refinement chips submit standalone, contextual prompts. Restrictive requests can legitimately return fewer matches; unrelated popular titles are not added just to fill the grid. Natural-language interpretation and catalog classification are not infallible, so the UI exposes the interpreted criteria and any lookup limitations.

Explicit combined genre/person requirements must all match in both catalog filtering and API ranking. Service alternatives need at least one verified requested provider; the search never claims every alternative is available. Keyword-backed TV classifications are retained when the catalog facts are sent for ranking.

Scope, sort, watched-title exclusion, cancellation, retries, and shareable AI query URLs are supported. Watch history is not sent as a profile: if watched-title exclusion is selected, only excluded catalog IDs accompany the request. Streaming-service filters refer to TMDB's US availability data, not a guarantee that an external player works.

## Deployment
- Deploy this repository as the root of a Vercel project. The CommonJS handler is `api/ai-search.js`, with its service in `lib/ai-search-service.cjs`. No client build step or extra package dependency is required.
- Set server-side `GROQ_API_KEYS` (comma-separated), or `GROQ_API_KEY`. `GROQ_FALLBACK_KEYS` is optional. Never commit real keys or put them in browser JavaScript.
- The default Groq model is **`openai/gpt-oss-20b`**. If the project already sets `GROQ_MODEL`, update that environment variable to this model and redeploy. GPT-OSS uses strict structured output; all responses are also validated before use.
- The catalog client reuses the existing TMDB configuration in `orc-script.js`; AI calls and Groq credentials stay on the server.
- API responses are `no-store`. The service uses bounded, per-instance request caching, duplicate-request coalescing, deadlines, and rate limits. Per-instance limits are not a substitute for deployment-wide abuse protection.
- The service worker precaches the AI UI modules and `offline.html`. API requests bypass its cache.

## Domain migration
The canonical origin is **`https://watch.osiris.rocks`**. Canonical tags, structured data, the search action, and the sitemap use the clean Vercel paths (`/search`, `/movie`, `/tv`, `/list`, `/settings`, `/dmca`). Internal generated links and authentication callbacks also use clean paths.

`vercel.json` redirects requests for the old apex and `www` hosts to the Watch origin **only when those hosts reach this Vercel project**. If an old host is attached to a different project or DNS target, configure the redirect there; this repository cannot change another deployment's DNS. There is no redirect rule matching the new Watch host.

In **Supabase → Authentication → URL Configuration**, set the Site URL to `https://watch.osiris.rocks` and allow `https://watch.osiris.rocks/settings` for signup confirmation/password recovery. The code now explicitly requests that destination rather than relying on the old default Site URL. Local development callbacks stay on the local origin. Browser storage and existing sessions are origin-scoped, so a new subdomain does not automatically inherit anonymous data or a login from the old domain.

## Local checks
With Node.js 20+ installed, run from the repository directory:

```powershell
node --test tests/ai-service.test.cjs tests/ai-catalog.test.cjs tests/ai-integration.test.cjs tests/site-regressions.test.cjs
```

These tests mock the provider/catalog and cover structured planning/ranking, validation, fallback and request limits, catalog matching/constraints, cancellation, domain routes, auth destinations, and required UI assets. No real Groq API key is used by the tests.
