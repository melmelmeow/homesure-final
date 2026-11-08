// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – Front-end configuration
//  Load order on every page: supabase-js (CDN) → config.js → session.js → data.js
//
//  The anon key is meant to be public: what a visitor can read or change is decided
//  by Row Level Security in supabase/migrations, not by hiding this key.
//  NEVER put the service-role key (or any Xendit / Google secret) in this file.
// ─────────────────────────────────────────────────────────────────────────────

// The front end is served by the same Next.js server that hosts the API, so API calls are relative
// ("/api/payments/..."). Only set this if you ever host the front end somewhere else.
const API_URL = "";

const SUPABASE_URL = "https://srv1824055.hstgr.cloud";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgzODYyNzgyLCJleHAiOjIwOTkyMjI3ODJ9.VZhJGJ7CG4NJpdcIoSAGLjsWiGrh491UpAhtjem15tw";

// ── Busy buttons ─────────────────────────────────────────────────────────────
// A button that starts a request to the server (send reset link, sign in, pay, save…) gets a
// spinner and ignores further clicks until every request it started has finished, so a slow
// answer never looks like nothing happened, and a second click cannot send it twice.
//
// It works for every page without touching each button: it notes which button was just clicked,
// and any fetch that starts within a moment of that click is counted against that button. It must
// run before createClient below — supabase-js keeps a reference to fetch from the moment the
// client is made, so wrapping fetch any later would miss every database call.
//
// A button can opt out with data-no-busy (e.g. one that starts a long-lived stream).
(function busyButtons() {
  if (window.__kfBusyButtons || typeof window.fetch !== 'function') return;
  window.__kfBusyButtons = true;

  const CLICK_WINDOW_MS = 600;   // a request this soon after a click belongs to that click
  const MIN_SPIN_MS = 350;       // so a fast reply still shows that something happened
  const TARGETS = 'button, input[type="submit"], input[type="button"], [role="button"], a.btn-primary, a.btn-solid, a.btn-outline';

  let last = null;               // { el, at }
  const pending = new Map();     // element -> { count, since }

  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest(TARGETS);
    if (!el || el.hasAttribute('data-no-busy')) return;
    if (pending.has(el)) { e.preventDefault(); e.stopImmediatePropagation(); return; }  // already working
    last = { el, at: Date.now() };
  }, true);

  function start(el) {
    const p = pending.get(el) || { count: 0, since: Date.now() };
    p.count += 1;
    pending.set(el, p);
    el.classList.add('kf-busy');
    el.setAttribute('aria-busy', 'true');
  }
  function finish(el) {
    const p = pending.get(el);
    if (!p) return;
    p.count -= 1;
    if (p.count > 0) return;
    const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - p.since));
    setTimeout(() => {
      const again = pending.get(el);
      if (again && again.count > 0) return;      // a new request started meanwhile
      pending.delete(el);
      el.classList.remove('kf-busy');
      el.removeAttribute('aria-busy');
    }, wait);
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = function (...args) {
    const owner = last && Date.now() - last.at < CLICK_WINDOW_MS && document.contains(last.el) ? last.el : null;
    if (!owner) return realFetch(...args);
    start(owner);
    return realFetch(...args).finally(() => finish(owner));
  };

  // The look, here so every page that loads config.js has it without another stylesheet.
  const css = document.createElement('style');
  css.textContent =
    '.kf-busy{pointer-events:none;cursor:progress;opacity:.82}' +
    '.kf-busy::after{content:"";display:inline-block;width:.95em;height:.95em;margin-left:.55em;' +
    'border:2px solid currentColor;border-right-color:transparent;border-radius:50%;' +
    'vertical-align:-.15em;flex-shrink:0;animation:kfBusySpin .7s linear infinite}' +
    '@keyframes kfBusySpin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){.kf-busy::after{animation-duration:2s}}';
  (document.head || document.documentElement).appendChild(css);
})();

// Supabase persists the signed-in session in localStorage and refreshes the token for us.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
