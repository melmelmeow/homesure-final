// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – theme bootstrap
//  Load as the FIRST script in <head>, synchronously (no defer/async), so
//  <html data-theme> is set before the first paint and there is no flash.
//
//  One key decides the theme everywhere: localStorage 'kasafide_theme'.
//  With nothing stored, the visitor's prefers-color-scheme wins.
//  Pages read and change it through window.KasafideTheme, never localStorage.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var KEY = 'kasafide_theme';
  var root = document.documentElement;

  // Theme colours for the browser chrome (address bar on mobile). Same values as --bg.
  var CHROME = { light: '#ECE4F4', dark: '#1E1230' };

  function read(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function write(store, k, v) { try { store.setItem(k, v); } catch (e) { /* blocked */ } }
  function drop(store, k) { try { store.removeItem(k); } catch (e) { /* blocked */ } }

  // One-time moves from the pre-rebrand keys. The old pages used three of them for the
  // same setting ('hs-theme' on most pages, 'theme' on the admin settings screens).
  (function migrate() {
    var ls;
    try { ls = window.localStorage; } catch (e) { return; }
    if (!ls) return;
    if (read(ls, KEY) === null) {
      var old = read(ls, 'hs-theme') || read(ls, 'theme');
      if (old === 'light' || old === 'dark') write(ls, KEY, old);
    }
    drop(ls, 'hs-theme');
    if (read(ls, 'theme') === 'light' || read(ls, 'theme') === 'dark') drop(ls, 'theme');

    var lastReview = read(ls, 'hs_last_review_prompt');
    if (lastReview !== null) {
      if (read(ls, 'kasafide_last_review_prompt') === null) write(ls, 'kasafide_last_review_prompt', lastReview);
      drop(ls, 'hs_last_review_prompt');
    }
  })();

  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() {
    var v = null;
    try { v = window.localStorage.getItem(KEY); } catch (e) { /* blocked */ }
    return v === 'light' || v === 'dark' ? v : null;
  }
  function system() { return media && media.matches ? 'dark' : 'light'; }
  function current() { return stored() || system(); }

  function syncBody(mode) {
    // auth.js and the policy pages also style off body.dark / body.light.
    if (!document.body) return;
    document.body.classList.toggle('dark', mode === 'dark');
    document.body.classList.toggle('light', mode === 'light');
  }

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    syncBody(mode);
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      (document.head || root).appendChild(meta);
    }
    meta.content = CHROME[mode];
  }

  window.KasafideTheme = {
    KEY: KEY,
    get: current,
    set: function (mode) {
      if (mode !== 'light' && mode !== 'dark') return;
      try { window.localStorage.setItem(KEY, mode); } catch (e) { /* blocked */ }
      apply(mode);
      try { window.dispatchEvent(new CustomEvent('kasafide:themechange', { detail: { theme: mode } })); } catch (e) { /* old browser */ }
    },
    toggle: function () { this.set(current() === 'dark' ? 'light' : 'dark'); return current(); },
    apply: apply,
    // A token's resolved value, for places CSS variables can't reach (SVG attributes, canvas).
    color: function (name) {
      return getComputedStyle(root).getPropertyValue(name).trim();
    },
  };

  apply(current());
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', function () { syncBody(current()); });
  }

  // Follow the OS setting live, but only while the visitor hasn't picked one.
  if (media) {
    var onChange = function () {
      if (stored()) return;
      apply(system());
      try { window.dispatchEvent(new CustomEvent('kasafide:themechange', { detail: { theme: system() } })); } catch (e) { /* old browser */ }
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
})();
