Open Source Movie Website.. Can find at https://osiris.rocks

Website may not be up for long due to risk of domain seize or host issues.

## Dev Log
- Fixed asynchronous hero transition bug where color bleed would lag behind the image load.
- Added bulletproof CORS proxy fallback to canvas extraction.
- Replaced raw innerHTML DOM injections with textContent for security and speed.
- Wrapped all localStorage operations in try-catch to prevent fatal crashes in strict mode.
- Enforced explicit button types across all HTML forms to prevent buggy submissions.
- Setup CSS Preload for faster FCP/LCP metrics.
- Bumped Service Worker cache version to aggressively invalidate stale assets.


## Deployment notes
- AI Search runs from `api/ai-search.js` and requires `GROQ_API_KEYS` (plus optional `GROQ_FALLBACK_KEYS`) to be configured as server-side environment variables.
- The service worker precaches `offline.html` so failed navigations show a clear offline page instead of a stale home page.
