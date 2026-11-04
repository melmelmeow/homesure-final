// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – the logo, inline
//
//  The front end has no component framework, so this plays the part of a <Logo /> component:
//
//      KasafideLogo.svg({ size: 28 })                 → markup string, outline follows the theme
//      KasafideLogo.svg({ size: 28, variant: 'dark' }) → cream outline (for a dark surface)
//      KasafideLogo.svg({ size: 28, variant: 'light' })→ ink outline (for a light surface)
//
//  Or put a placeholder in HTML and it is filled in on load (and when one is added later):
//
//      <span class="kf-logo" data-size="28" role="img" aria-label="Kasafide logo"></span>
//
//  Inline rather than <img> so the outline can switch from ink (#2B1B3D) to cream (#FBF6F0)
//  with the theme — see .kf-logo in kasafide-theme.css. assets/img/kasafide-logo.svg is the
//  same drawing as a file, for places that can only take a URL.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var BODY =
    '<path d="M26 128 V70 Q26 62 30 54 L40 22 Q42 16 48 20 L68 38 Q80 35 92 38 L111 22 Q117 17 120 24 L130 54 Q134 62 134 70 V128 Q134 142 120 142 H40 Q26 142 26 128 Z" fill="#5B3A8E" class="kf-outline" stroke-width="4.5"/>' +
    '<path d="M44 30 L60 42 L42 54 Z" fill="#FF8A65" class="kf-outline" stroke-width="3.5"/>' +
    '<path d="M116 31 L100 42 L118 54 Z" fill="#FF8A65" class="kf-outline" stroke-width="3.5"/>' +
    '<ellipse cx="53" cy="76" rx="7" ry="9.5" fill="#2B1B3D"/>' +
    '<ellipse cx="107" cy="76" rx="7" ry="9.5" fill="#2B1B3D"/>' +
    '<circle cx="50.5" cy="72.5" r="2.8" fill="#FBF6F0"/>' +
    '<circle cx="104.5" cy="72.5" r="2.8" fill="#FBF6F0"/>' +
    '<ellipse cx="38" cy="94" rx="7" ry="4.5" fill="#FF8A65"/>' +
    '<ellipse cx="122" cy="94" rx="7" ry="4.5" fill="#FF8A65"/>' +
    '<path d="M76 86 H84 L80 91 Z" fill="#FF8A65" class="kf-outline" stroke-width="2.5"/>' +
    '<path d="M80 91 V93 M80 93 Q75 97 71 93 M80 93 Q85 97 89 93" fill="none" class="kf-outline" stroke-width="2.5"/>' +
    '<path d="M62 142 V118 A18 18 0 0 1 98 118 V142 Z" fill="#FBF6F0" class="kf-outline" stroke-width="4.5"/>' +
    '<path d="M71 124 L77 130 L89 117" fill="none" class="kf-outline" stroke-width="9"/>' +
    '<path d="M71 124 L77 130 L89 117" fill="none" stroke="#FF8A65" stroke-width="4.5"/>' +
    '<path d="M22 90 L8 86 M22 98 L7 99 M24 106 L11 113 M138 90 L152 86 M138 98 L153 99 M136 106 L149 113" fill="none" class="kf-outline" stroke-width="3"/>';

  function svg(opts) {
    opts = opts || {};
    var size = opts.size || 28;
    var variant = opts.variant === 'dark' || opts.variant === 'light' ? ' kf-logo--' + opts.variant : '';
    var label = opts.label === '' ? '' : (opts.label || 'Kasafide logo');
    var a11y = label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"';
    return '<svg class="kf-logo' + variant + (opts.className ? ' ' + opts.className : '') + '"' + a11y +
      ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="' + size + '" height="' + size + '"' +
      ' stroke-linejoin="round" stroke-linecap="round">' + BODY + '</svg>';
  }

  // Fill <span class="kf-logo" data-size data-variant> placeholders.
  function fill(root) {
    var nodes = (root || document).querySelectorAll('span.kf-logo:not([data-kf-done])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute('data-kf-done', '');
      el.innerHTML = svg({
        size: +el.getAttribute('data-size') || 28,
        variant: el.getAttribute('data-variant'),
        label: '',                       // the span carries the accessible name
        className: 'kf-logo-svg',
      });
    }
  }

  window.KasafideLogo = { svg: svg, fill: fill };

  function start() {
    fill(document);
    if (window.MutationObserver) {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          if (records[i].addedNodes.length) { fill(document); return; }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
