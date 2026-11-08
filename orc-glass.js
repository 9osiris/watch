/*
 * orc-glass.js — Real WebGL "liquid glass" upgrades, powered by
 * @ybouane/liquidglass (https://liquid-glass.ybouane.com/), loaded from a CDN.
 *
 * Applied to three spots:
 *   1. The intro splash logo panel.
 *   2. The home hero action bar (Play / Trailer / Details).
 *   3. Movie-card hover popups.
 *
 * Everything here is purely additive and defensive: it only runs on desktop,
 * only when WebGL + the CDN are available and reduced-motion is off, and every
 * step is wrapped so that on any failure the existing CSS glass is left exactly
 * as it was. The shader-on look is gated behind a `.glass-webgl-on` class, so
 * if this file is removed (or fails) the site falls back to the CSS version.
 *
 * To disable entirely: remove the <script src="orc-glass.js" type="module">
 * line from index.html.
 */

const GLASS_CDN = "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js";

const enabled =
  !matchMedia("(max-width: 768px)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  webglSupported();

function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

// Memoise the CDN import so splash + hero + popups share a single fetch.
let _libPromise = null;
function loadLib() {
  if (!_libPromise) {
    _libPromise = import(GLASS_CDN)
      .then((m) => (m && m.LiquidGlass) || null)
      .catch((e) => {
        console.warn("[orc-glass] CDN load failed, keeping CSS glass.", e);
        return null;
      });
  }
  return _libPromise;
}

/* ---------------------------------------------------------------- splash --- */
async function initSplashGlass() {
  const stage = document.querySelector(".splash-stage");
  const panel = document.querySelector(".splash-glass");
  const screen = document.getElementById("splash-screen");
  if (!stage || !panel || !screen || screen.classList.contains("splash-exit")) return;

  const LiquidGlass = await loadLib();
  if (!LiquidGlass) return;

  let instance;
  try {
    instance = await LiquidGlass.init({
      root: stage,
      glassElements: [panel],
      defaults: {
        blurAmount: 0.18, refraction: 0.72, chromAberration: 0.06,
        edgeHighlight: 0.12, specular: 0.35, fresnel: 1.0,
        cornerRadius: 60, zRadius: 34, tintStrength: 0.1, saturation: 0.25,
        shadowOpacity: 0.45, shadowSpread: 26, shadowOffsetY: 8,
      },
    });
  } catch (e) {
    console.warn("[orc-glass] splash init failed, keeping CSS glass.", e);
    return;
  }
  panel.classList.add("glass-webgl-on");

  const stop = () => { try { instance && instance.destroy(); } catch (e) {} };
  const obs = new MutationObserver(() => {
    if (screen.classList.contains("splash-exit")) { stop(); obs.disconnect(); }
  });
  obs.observe(screen, { attributes: true, attributeFilter: ["class"] });
  setTimeout(stop, 8000);
}

/* ------------------------------------------------------------------ hero --- */
async function initHeroGlass() {
  const hero = document.querySelector("main#main-content > .hero");
  const actions = hero && hero.querySelector(".hero-actions");
  if (!hero || !actions) return;

  const LiquidGlass = await loadLib();
  if (!LiquidGlass) return;

  // The shader requires the glass element to be a DIRECT child of root, so move
  // the action bar out of .hero-content and onto .hero. Remember where it was
  // so we can undo cleanly if init throws.
  const originalParent = actions.parentNode;
  const originalNext = actions.nextSibling;
  const restore = () => {
    hero.classList.remove("glass-webgl-on");
    try { originalParent && originalParent.insertBefore(actions, originalNext); } catch (e) {}
  };

  try {
    hero.classList.add("glass-webgl-on");
    hero.appendChild(actions);
    const instance = await LiquidGlass.init({
      root: hero,
      glassElements: [actions],
      defaults: {
        blurAmount: 0.06, refraction: 0.62, chromAberration: 0.05,
        edgeHighlight: 0.1, specular: 0.3, fresnel: 0.9,
        cornerRadius: 26, zRadius: 18, tintStrength: 0.06,
        shadowOpacity: 0.35, shadowSpread: 18, shadowOffsetY: 6,
        button: true,
      },
    });
    // Hero backdrop swaps between slides; nudge the shader to re-read it.
    const bd = hero.querySelector(".hero-backdrop");
    if (bd) {
      const mo = new MutationObserver(() => {
        try { instance.markChanged(bd); } catch (e) {}
      });
      mo.observe(bd, { attributes: true, subtree: true, attributeFilter: ["class", "src"] });
    }
  } catch (e) {
    console.warn("[orc-glass] hero init failed, reverting to CSS glass.", e);
    restore();
  }
}

/* ---------------------------------------------------------------- popups --- */
// Movie-card popups are created on hover and removed on mouse-out. Watch the
// body for them and glassify each one for its short lifetime.
function watchPopups() {
  const live = new Map(); // popup element -> LiquidGlass instance

  const glassify = async (pop) => {
    if (live.has(pop)) return;
    const thumb = pop.querySelector(".card-popup-thumb");
    const body = pop.querySelector(".card-popup-body");
    if (!thumb || !body) return;
    live.set(pop, null); // reserve slot so we don't double-init

    const LiquidGlass = await loadLib();
    // Bail if the popup was already removed while the lib was loading.
    if (!LiquidGlass || !pop.isConnected) { live.delete(pop); return; }

    try {
      pop.classList.add("glass-webgl-on");
      // Give layout a frame to settle into the glass-on sizes before capture.
      await new Promise((r) => requestAnimationFrame(r));
      const instance = await LiquidGlass.init({
        root: pop,
        glassElements: [body],
        defaults: {
          blurAmount: 0.12, refraction: 0.66, chromAberration: 0.05,
          edgeHighlight: 0.1, specular: 0.28, fresnel: 0.95,
          cornerRadius: 12, zRadius: 16, tintStrength: 0.08,
          brightness: -0.06, saturation: 0.15,
          shadowOpacity: 0.0,
        },
      });
      if (!pop.isConnected) { try { instance.destroy(); } catch (e) {} live.delete(pop); return; }
      live.set(pop, instance);
    } catch (e) {
      pop.classList.remove("glass-webgl-on");
      live.delete(pop);
    }
  };

  const drop = (pop) => {
    const inst = live.get(pop);
    if (inst) { try { inst.destroy(); } catch (e) {} }
    live.delete(pop);
  };

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1 && n.classList.contains("card-popup")) glassify(n);
      });
      m.removedNodes.forEach((n) => {
        if (n.nodeType === 1 && n.classList.contains("card-popup")) drop(n);
      });
    }
  });
  obs.observe(document.body, { childList: true });
}

/* ------------------------------------------------------------------ boot --- */
function boot() {
  if (!enabled) return;
  initSplashGlass();
  initHeroGlass();
  watchPopups();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
