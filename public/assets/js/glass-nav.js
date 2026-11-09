// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide — keep the top bar readable against whatever is behind it
//
//  The hero stays dark on desktop in both themes (only the mobile breakpoint gives it a light
//  version). In light mode that left a white bar sitting on top of a dark panel, which read as two
//  unrelated pieces rather than one page.
//
//  So while the bar overlaps the hero it wears the dark glass, and once you scroll past it the bar
//  goes back to whatever the theme asks for. Pages without a hero are left alone.
//
//  Pure CSS cannot ask "am I currently over that element", which is why this is a few lines of JS
//  rather than another rule in glass-nav.css.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  let started = false;

  function start() {
    const bar = document.querySelector('nav, .browse-nav, .policy-header');
    const hero = document.querySelector('.hero');
    if (!bar || !hero) return;

    // start() is called twice on purpose — once at DOMContentLoaded and once shortly after, for
    // the React hero that does not exist yet at parse time. Whichever call finds the hero first
    // does the work; the other must not add a second set of listeners and observers.
    if (started) return;
    started = true;

    let queued = false;

    function update() {
      queued = false;
      // The bar is sticky, so its own height is how far down the page it reaches.
      const overlapping = hero.getBoundingClientRect().bottom > bar.offsetHeight;
      bar.classList.toggle('over-hero', overlapping);
    }

    function onScroll() {
      // Scroll fires far more often than the screen refreshes; one update per frame is plenty.
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    pauseWhenOffScreen(hero);
  }

  /**
   * Stop the hero animating once nobody can see it.
   *
   * The hero runs about a dozen animations at the same time: a full-screen particle layer, and six
   * map markers each with a float and a pulse. They are declared as infinite, so by default they
   * keep the compositor busy for as long as the tab is open — including while somebody is reading
   * the footer, with the whole hero scrolled past.
   *
   * An IntersectionObserver costs nothing when nothing is crossing the boundary, unlike a scroll
   * handler that runs on every frame.
   */
  function pauseWhenOffScreen(hero) {
    if (typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver(
      ([entry]) => hero.classList.toggle('hero-paused', !entry.isIntersecting),
      { rootMargin: '100px' }     // resume slightly before it comes back into view
    );
    observer.observe(hero);
  }

  // index.html builds its hero with React, so the element does not exist at parse time.
  // Wait for the first paint, and look once more shortly after in case the render is slower.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { start(); setTimeout(start, 300); });
  } else {
    start();
    setTimeout(start, 300);
  }
})();
