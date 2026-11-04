// Counts every [data-count] element under `root` up from 0 to its value. Used by the admin
// Analytics and super-admin System Reports stat cards; pairs with assets/css/chart-anim.css.
// Whole numbers only — anything else is left as written.
function hsCountUp(root, duration = 900) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (root || document).querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(target) || reduce || target === 0) { el.textContent = el.dataset.count; return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic: quick start, gentle landing
      el.textContent = Math.round(target * eased).toLocaleString('en-PH');
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  });
}
