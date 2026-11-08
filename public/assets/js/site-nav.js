// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide — the shared top bar for the public pages that are not the landing page
//  (browse.html, about.html, help.html).
//
//  Put this where the bar goes:      <nav class="site-nav" data-page="browse"></nav>
//  and load site-nav.css + glass-nav.css (the glass pill itself comes from glass-nav.css).
//
//  Same links, highlight, theme button and Sign In / Sign Up as index.html's bar (Navbar /
//  NavLinks in index.js), so the site reads as one thing. The landing page keeps its own React
//  bar because it also changes shape over the photo hero. Change a link here AND in index.js.
//
//  data-page puts the resting highlight on the current page's link; the highlight slides to
//  whichever link is hovered and back. Links to sections of the landing page go to
//  index.html#section, since those sections only exist there.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const LINKS = [
    { label: 'Home',         href: 'index.html',               page: 'home' },
    { label: 'Listings',     href: 'index.html#featured' },
    { label: 'How it works', href: 'index.html#how-it-works' },
    // Browse is a section of the landing page now; browse.html (still there for old links) keeps
    // the highlight on it. About and Help are reachable from the footer.
    { label: 'Browse',       href: 'index.html#browse',        page: 'browse' },
  ];

  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const theme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

  function render(nav) {
    const page = nav.getAttribute('data-page') || '';
    const logo = window.KasafideLogo ? KasafideLogo.svg({ size: 30 }) : '';

    nav.innerHTML =
      '<a class="sn-logo" href="index.html">' +
        '<span class="sn-catstone"><img src="assets/img/CatsTone Logo.svg" alt="CatsTone" /></span>' +
        '<span class="sn-divider"></span>' + logo + '<span>Kasafide</span>' +
      '</a>' +
      '<div class="sn-links">' +
        '<span class="sn-pill" aria-hidden="true"></span>' +
        LINKS.map((l) => '<a href="' + l.href + '"' + (l.page === page ? ' aria-current="page" class="is-active"' : '') + '>' + esc(l.label) + '</a>').join('') +
      '</div>' +
      '<div class="sn-actions">' +
        '<button type="button" class="sn-theme" aria-label="Toggle theme"></button>' +
        '<a class="sn-btn-signin" href="auth/signin.html">Sign In</a>' +
        '<a class="sn-btn-signup" href="auth/signup.html">Sign Up</a>' +
      '</div>';

    // Theme: the same KasafideTheme every page uses, so the choice carries across pages.
    const themeBtn = nav.querySelector('.sn-theme');
    const paintTheme = () => {
      const dark = theme() === 'dark';
      themeBtn.innerHTML = dark ? SUN : MOON;
      themeBtn.title = dark ? 'Switch to Light' : 'Switch to Dark';
    };
    themeBtn.addEventListener('click', () => {
      if (window.KasafideTheme) KasafideTheme.set(theme() === 'dark' ? 'light' : 'dark');
      else document.documentElement.setAttribute('data-theme', theme() === 'dark' ? 'light' : 'dark');
      paintTheme();
    });
    paintTheme();

    // Sliding highlight: rests on the current page's link, follows the hovered/focused one.
    const box = nav.querySelector('.sn-links');
    const pill = box.querySelector('.sn-pill');
    const links = [...box.querySelectorAll('a')];
    const home = links.find((a) => a.classList.contains('is-active')) || null;
    let target = home;
    const place = () => {
      links.forEach((a) => a.classList.toggle('is-lit', a === target));
      if (!target) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.width = target.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + target.offsetLeft + 'px)';
    };
    const moveTo = (a) => { target = a; place(); };
    links.forEach((a) => {
      a.addEventListener('mouseenter', () => moveTo(a));
      a.addEventListener('focus', () => moveTo(a));
      a.addEventListener('blur', () => moveTo(home));
    });
    box.addEventListener('mouseleave', () => moveTo(home));

    // First placement without the slide (it would otherwise sweep in from the left on load).
    pill.style.transition = 'none';
    place();
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; }));
    new ResizeObserver(place).observe(box);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  function start() { document.querySelectorAll('nav.site-nav').forEach(render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
