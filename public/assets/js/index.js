// ── Data ──────────────────────────────────────────────────────────────────────

// Counts used to come from fixed numbers here (342, 218, 97) that were never real — see
// useTypeCounts() below for what replaced them. `type` is a property_type value; the schema
// (006_frontend_alignment.sql) only has 'house' | 'apartment' | 'condo' | 'commercial' | 'lot', so
// there is no real type called "Townhouses". The third card is land for sale — 'lot', what the
// seller's post form calls "Lot Only".
//
// Each card shows a photo of the newest live listing of its type. When a type has none yet, it
// falls back to `fallbacks` in order — drop a photo at assets/img/types/<type>.jpg to set one —
// and if none of those load either, the card's own teal gradient shows instead of a broken image.
const categories = [
  { name: "Houses",      type: "house",     fallbacks: ["assets/img/types/house.jpg", "assets/img/house_image.jpg"] },
  { name: "Apartments",  type: "apartment", fallbacks: ["assets/img/types/apartment.jpg"] },
  { name: "Lots & Land", type: "lot",       fallbacks: ["assets/img/types/lot.jpg"] },
];

// Tries each source in turn on load failure; hides itself once they're all used up.
function CategoryPhoto({ sources, alt }) {
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [sources.join('|')]);
  if (i >= sources.length) return null;
  return React.createElement("img", {
    className: "cat-photo",
    src: sources[i],
    alt,
    loading: "lazy",
    onError: () => setI((n) => n + 1),
  });
}

// Each step is paired with the screen it describes, drawn the way the real page draws it — the
// same listing card browse.html renders, the same chat bubbles and payment card. They hold
// example content rather than live rows, because this runs before anyone has signed in, but the
// shapes are the application's own.
const steps = [
  {
    num: "01",
    label: "Account",
    title: "Create an Account",
    desc: "Sign up as a buyer or seller. Verify your identity so the person on the other side knows who they are dealing with.",
    screen: "verification",
  },
  {
    num: "02",
    label: "Discover",
    title: "Browse or List",
    desc: "Search by barangay, budget and property type across Sta. Maria — or post your own listing and let buyers come to you.",
    screen: "listing",
  },
  {
    num: "03",
    label: "Connect",
    title: "Message the Owner",
    desc: "Talk to the seller inside Kasafide. Arrange a viewing, ask about the place, and keep the whole conversation in one thread.",
    screen: "messages",
  },
  {
    num: "04",
    label: "Payment",
    title: "Pay and Move In",
    desc: "Pay through the platform or upload proof of a direct payment. The seller confirms it, and both of you keep a record.",
    screen: "payment",
  },
];

const features = [
  {
    title: "Verified Sellers",
    desc: "All property owners undergo identity verification with government ID and selfie before publishing listings.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  {
    title: "Local Focus",
    desc: "Find properties by barangay within Sta. Maria, Bulacan with easy filtering options.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    title: "Direct Messaging",
    desc: "Connect directly with verified sellers through our secure in-platform messaging system.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
];

// Counted from the database when the section comes into view. The numbers below are only what is
// shown if that query fails — so they are the ones that are true regardless: the municipality has
// 24 barangays, no listing goes live unverified, and messaging is in-platform for everyone.
//
// "1,200+ Verified Sellers" used to sit here. Nobody could have said where it came from.
const statsData = [
  { key: "barangays",       end: 24,  suffix: "",  label: "Barangays Covered" },
  { key: "listings",        end: 0,   suffix: "",  label: "Listings Live" },
  { key: "verifiedSellers", end: 0,   suffix: "",  label: "Verified Sellers" },
  { key: null,              end: 0,   suffix: "",  label: "Unverified Listings" },
];

// ── Theme init (read localStorage, default dark) ──────────────────────────────
(function () {
  const t = KasafideTheme.get();
  document.documentElement.setAttribute('data-theme', t);
})();

// ── SVG Helpers ───────────────────────────────────────────────────────────────

const pinIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--text-muted)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const checkIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="stroke:var(--on-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const chevronLeft = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const chevronRight = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const searchIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const shieldIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const starIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const lockIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
// The brand mark, inline so its outline follows the theme (assets/js/kasafide-logo.js).
const logoMark = (size) => React.createElement("span", {
  className: "kf-logo-wrap",
  style: { display: "inline-flex" },
  dangerouslySetInnerHTML: { __html: KasafideLogo.svg({ size }) },
});

// ── React Components ──────────────────────────────────────────────────────────

const { useState, useEffect, useRef } = React;
const h = React.createElement;

// How many live listings each barangay has, read once and shared.
//
// The pins on the hero map and the barangay list beneath it both need this, and they are separate
// components, so the promise is cached at module level rather than fetched twice. null until it
// arrives; {} is a real answer meaning "no listings anywhere yet".
let barangayCountsPromise = null;

function useBarangayCounts() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (typeof HS === 'undefined' || !HS.listingCountsByBarangay) return;
    if (!barangayCountsPromise) barangayCountsPromise = HS.listingCountsByBarangay();

    let cancelled = false;
    barangayCountsPromise
      .then((c) => { if (!cancelled) setCounts(c); })
      .catch((err) => {
        console.error('Could not load the listing count per barangay:', err);
        barangayCountsPromise = null;  // let a later mount try again
      });
    return () => { cancelled = true; };
  }, []);

  return counts;
}

// Same caching pattern as useBarangayCounts, for the "Browse by Type" cards. Resolves to
// { counts, photos }, both keyed by property_type ('house' | 'apartment' | 'condo' | 'commercial' | 'lot').
let typeCountsPromise = null;

function useTypeCounts() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (typeof HS === 'undefined' || !HS.listingCountsByType) return;
    if (!typeCountsPromise) typeCountsPromise = HS.listingCountsByType();

    let cancelled = false;
    typeCountsPromise
      .then((c) => { if (!cancelled) setCounts(c); })
      .catch((err) => {
        console.error('Could not load the listing count per property type:', err);
        typeCountsPromise = null;
      });
    return () => { cancelled = true; };
  }, []);

  return counts;
}

// Real approved listings for the "Featured Properties" carousel, read once and shared — it used
// to be six hardcoded placeholder cards that never changed no matter what was actually listed.
let featuredListingsPromise = null;

function useFeaturedListings() {
  const [listings, setListings] = useState(null);

  useEffect(() => {
    if (typeof HS === 'undefined' || !HS.featuredListings) return;
    if (!featuredListingsPromise) featuredListingsPromise = HS.featuredListings();

    let cancelled = false;
    featuredListingsPromise
      .then((rows) => { if (!cancelled) setListings(rows); })
      .catch((err) => {
        console.error('Could not load featured listings:', err);
        featuredListingsPromise = null;
      });
    return () => { cancelled = true; };
  }, []);

  return listings;
}

function browseBarangay(name) {
  showBrowse({ barangay: name });
}

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// Typing Animation
const typingPhrases = [
  "Find your home.",
  "Find verified properties.",
  "Find your perfect place.",
  "Find trusted listings.",
  "Find your next home.",
];

function TypingText() {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = typingPhrases[phraseIdx];
    let timer;

    if (!deleting) {
      if (displayed.length < current.length) {
        timer = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          68 + Math.random() * 38,
        );
      } else {
        timer = setTimeout(() => setDeleting(true), 1900);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(
          () => setDisplayed(d => d.slice(0, -1)),
          28 + Math.random() * 18,
        );
      } else {
        timer = setTimeout(() => {
          setPhraseIdx(i => (i + 1) % typingPhrases.length);
          setDeleting(false);
        }, 280);
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, deleting, phraseIdx]);

  return React.createElement(
    React.Fragment, null,
    displayed,
    React.createElement('span', { className: 'typing-cursor' }),
  );
}

// Hero Wheel — center is fixed, only arms orbit clockwise
function HeroCards() {
  const listings = useFeaturedListings();
  const cards = listings ? listings.slice(0, 3) : [];
  if (!cards.length) return null;  // nothing to show yet (still loading, or no approved listings)
  return React.createElement(
    'div', { className: 'hero-cards' },
    cards.map((prop, i) =>
      React.createElement(
        'div', { key: i, className: 'hero-card' },
        React.createElement(
          'div', { className: 'wc-img-wrap' },
          React.createElement('img', { className: 'wc-img', src: prop.image, alt: prop.title }),
          prop.verified
            ? React.createElement(
                'span', { className: 'wc-verified-badge' },
                React.createElement('span', { dangerouslySetInnerHTML: { __html: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` } }),
                'Verified',
              )
            : null,
        ),
        React.createElement(
          'div', { className: 'wc-info' },
          React.createElement('div', { className: 'wc-title' }, prop.title),
          React.createElement('div', { className: 'wc-location' },
            React.createElement('span', { dangerouslySetInnerHTML: { __html: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>` } }),
            prop.location,
          ),
          React.createElement('div', { className: 'wc-footer' },
            React.createElement('span', { className: 'wc-price' }, prop.price, React.createElement('span', { className: 'wc-period' }, prop.period)),
            React.createElement('span', { className: 'wc-view' }, 'View Details'),
          ),
        ),
      )
    ),
  );
}

// The Sta. Maria barangay map. It used to fill the right half of the hero; the hero is a full-bleed
// listing photo now, so the map has its own section further down (MapSection) and lives here.
const MAP_MIN_SCALE = 0.5, MAP_MAX_SCALE = 3;

function BarangayMap() {
  const counts = useBarangayCounts();
  const mapWrapRef = useRef(null);
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgContent, setSvgContent] = useState('');
  const [near, setNear] = useState(false);

  // Fetch the map artwork only once the section is close to the screen — it is ~140KB of SVG and
  // most visitors never scroll this far. The same observer pauses the pin animations while the map
  // is off screen (the hero used to get this from glass-nav.js; the map is not in the hero now).
  useEffect(() => {
    const wrap = mapWrapRef.current;
    if (!wrap) return;
    if (typeof IntersectionObserver !== 'function') { setNear(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
      wrap.classList.toggle('is-offscreen', !entry.isIntersecting);
    }, { rootMargin: '400px 0px' });
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    fetch('assets/img/Sta. Maria Map.svg')
      .then((res) => res.text())
      .then((svg) => { if (!cancelled) setSvgContent(svg); })
      .catch((err) => console.error('Could not load the map:', err));
    return () => { cancelled = true; };
  }, [near]);

  const zoomBy = (d) => setTransform((prev) => ({
    ...prev, scale: Math.min(Math.max(MAP_MIN_SCALE, prev.scale + d), MAP_MAX_SCALE),
  }));
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0, rotate: 0 });

  // Property markers.
  //
  // Every barangay, positioned on its own name label in the map artwork. The label shapes are
  // paths in "Sta. Maria Map.svg" (no ids), so these are their centres in the SVG's own
  // 1575 x 1816 viewBox units, measured from the file. They used to be percentages of the whole
  // right-hand panel for only six barangays — so a listing in any other barangay (Silangan) never
  // got a pin, and the six that did drifted off their barangay whenever the window's shape changed,
  // since the panel and the drawing inside it don't scale together.
  //
  // The counts come from the database; a barangay with nothing in it gets no pin.
  useEffect(() => {
    if (!containerRef.current || !svgContent || !counts) return;

    const VB_W = 1575, VB_H = 1816;
    const positions = {
      'Silangan':         [905, 149],  'Mag-asawang Sapa': [786, 383],
      'Pulong Buhangin':  [1093, 514], 'Cay Pombo':        [710, 668],
      'Balasing':         [1273, 742], 'Caysio':           [531, 754],
      'Manggahan':        [352, 829],  'Bulac':            [1399, 965],
      'Santa Cruz':       [369, 1004], 'Guyong':           [637, 1012],
      'Catmon':           [1093, 1095],'San Jose Patag':   [731, 1188],
      'Santa Clara':      [260, 1189], 'Poblacion':        [466, 1250],
      'Bagbaguin':        [315, 1326], 'Lalakhan':         [54, 1347],
      'Tumana':           [642, 1372], 'Parada':           [890, 1384],
      'San Vicente':      [1181, 1438],'San Gabriel':      [480, 1482],
      'Tabing Bakod':     [280, 1540], 'Buenavista':       [786, 1607],
      'Camangyanan':      [585, 1643], 'Mahabang Parang':  [317, 1743],
      // Not one of the 24 and has no label in the artwork: a sitio inside Pulong Buhangin, on its
      // northwest side by the Silangan / Mag-asawang Sapa border (~14.87°N 121.00°E, along the
      // Norzagaray–Santa Maria road). Estimated, not measured. Listings are still filed under it.
      'Pulong Yantok':    [1060, 340],
    };
    // Shown in the tooltip after the name, for places that are part of a bigger barangay.
    const partOf = { 'Pulong Yantok': 'Pulong Buhangin' };

    const container = containerRef.current;

    // The SVG is centred in the container and scaled to fit (max-width/max-height 100%, never
    // above its own 1575x1816), so a viewBox point maps to container pixels like this. Layout
    // sizes (clientWidth/Height), not getBoundingClientRect, so the pan/zoom/rotate transform on
    // the container isn't counted twice — the pins sit inside it and get that transform anyway.
    const place = () => {
      const cw = container.clientWidth, ch = container.clientHeight;
      const s = Math.min(1, cw / VB_W, ch / VB_H);
      const offX = (cw - VB_W * s) / 2, offY = (ch - VB_H * s) / 2;
      pins.forEach(({ el, x, y }) => {
        el.style.left = `${offX + x * s}px`;
        el.style.top  = `${offY + y * s}px`;
      });
    };

    const pins = [];
    Object.keys(positions)
      .filter((name) => (counts[name] || 0) > 0)
      .forEach((name, i) => {
        const p = { barangay: name };
        const [x, y] = positions[name];
        const n = counts[p.barangay];
        const place = partOf[name] ? `${name}, ${partOf[name]}` : name;
        const pin = document.createElement('div');
        pins.push({ el: pin, x, y });
        pin.className = 'property-marker';
        pin.style.animationDelay = `${i * 0.3}s`;
        pin.setAttribute('role', 'link');
        pin.setAttribute('tabindex', '0');
        pin.setAttribute('aria-label',
          `${n} ${n === 1 ? 'property' : 'properties'} in ${place} — browse them`);
        pin.innerHTML = `
          <div class="marker-pulse"></div>
          <div class="marker-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/></svg>
          </div>
          <div class="marker-tooltip">${n} ${n === 1 ? 'property' : 'properties'} in ${place}</div>
        `;

        // The map itself is drag-to-pan, so a pin must not open browse at the end of a drag.
        const open = (e) => { e.stopPropagation(); browseBarangay(p.barangay); };
        pin.addEventListener('click', open);
        pin.addEventListener('mousedown', (e) => e.stopPropagation());
        pin.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
        });

        container.appendChild(pin);
      });

    place();
    const ro = new ResizeObserver(place);
    ro.observe(container);

    // The SVG is injected with dangerouslySetInnerHTML, so React does not own these nodes and
    // will not clear them. Without this, a re-run leaves the old pins behind.
    return () => { ro.disconnect(); pins.forEach((p) => p.el.remove()); };
  }, [svgContent, counts]);

  useEffect(() => {
    if (!mapWrapRef.current) return;

    const wrap = mapWrapRef.current;

    // Mid-page now, so a plain scroll wheel must scroll the page, not get swallowed by the map.
    // Ctrl/⌘ + wheel zooms (a trackpad pinch arrives as ctrl + wheel too), like an embedded map.
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(MAP_MIN_SCALE, transform.scale + delta), MAP_MAX_SCALE);
      setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e) => {
      if (e.button !== 0 || e.target.closest('.smap-controls')) return;
      if (e.shiftKey) {
        setIsRotating(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    };

    const handleMouseMove = (e) => {
      if (isRotating) {
        const deltaX = e.clientX - dragStart.x;
        setTransform(prev => ({
          ...prev,
          rotate: prev.rotate + deltaX * 0.5
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isDragging) {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    wrap.addEventListener('wheel', handleWheel, { passive: false });
    wrap.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      wrap.removeEventListener('wheel', handleWheel);
      wrap.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transform, isDragging, isRotating, dragStart]);

  const ctrlBtn = (label, text, onClick) => React.createElement('button', {
    type: 'button', className: 'smap-btn', 'aria-label': label, title: label, onClick,
  }, text);

  return React.createElement(
    'div', {
      className: 'smap-wrap',
      ref: mapWrapRef,
      style: { cursor: isDragging ? 'grabbing' : isRotating ? 'crosshair' : 'grab' }
    },
    !svgContent && React.createElement('div', { className: 'smap-loading' }, 'Loading map…'),
    React.createElement('div', { className: 'smap-controls' },
      ctrlBtn('Zoom in', '+', () => zoomBy(0.25)),
      ctrlBtn('Zoom out', '−', () => zoomBy(-0.25)),
      ctrlBtn('Reset view', '⟲', resetView),
    ),
    React.createElement('div', {
      ref: containerRef,
      className: 'smap-canvas',
      style: {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
        transformOrigin: 'center center',
        transition: (isDragging || isRotating) ? 'none' : 'transform 0.1s ease-out'
      },
      dangerouslySetInnerHTML: { __html: svgContent }
    }),
  );
}

const sunSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

// Navbar
//
// `section` ties a link to a part of this page: the highlight follows whichever of those you are
// scrolled to.
const navLinks = [
  { label: 'Home',         href: '#',             section: 'top' },
  { label: 'Listings',     href: '#featured',     section: 'featured' },
  { label: 'How it works', href: '#how-it-works', section: 'how-it-works' },
  { label: 'Browse',       href: '#browse',       section: 'browse' },
];
const SPY_SECTIONS = ['featured', 'how-it-works', 'browse'];

// Which section is under the top third of the screen, re-checked once per frame while scrolling.
// Listings stays lit through Browse by Type and the map (they are all "finding a place"), and How
// it works until the Browse section near the bottom.
function useScrollSection() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const line = window.innerHeight * 0.35;
      let cur = 'top';
      SPY_SECTIONS.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      });
      setActive(cur);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return active;
}

// The links with one pill behind them that slides: to the section you scroll into, to the link
// under the pointer while hovering, and back when the pointer leaves.
function NavLinks() {
  const active = useScrollSection();
  const boxRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [pill, setPill] = useState(null);
  const target = hover || active;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const a = box.querySelector(`[data-key="${target}"]`);
      setPill(a ? { x: a.offsetLeft, w: a.offsetWidth } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, [target]);

  return h('div', { className: 'nav-links', ref: boxRef, onMouseLeave: () => setHover(null) },
    h('span', {
      className: 'nav-pill', 'aria-hidden': 'true',
      style: pill ? { transform: `translateX(${pill.x}px)`, width: `${pill.w}px`, opacity: 1 } : { opacity: 0 },
    }),
    navLinks.map((l) => {
      const key = l.section || l.label;
      const on = key === active;
      return h('a', {
        key, href: l.href, 'data-key': key,
        className: `${on ? 'is-active' : ''}${key === target ? ' is-lit' : ''}`,
        'aria-current': on ? 'location' : undefined,
        onMouseEnter: () => setHover(key),
        onFocus: () => setHover(key),
        onBlur: () => setHover(null),
      }, l.label);
    }),
  );
}

function Navbar() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    KasafideTheme.set(next);
    setTheme(next);
  }

  return React.createElement(
    "nav",
    { className: "nav-photo" },
    React.createElement(
      "a",
      { className: "nav-logo", href: "#" },
      React.createElement("span", { className: "nav-catstone-wrap" },
        React.createElement("img", { src: "assets/img/CatsTone Logo.svg", alt: "CatsTone", className: "nav-catstone-img" }),
      ),
      React.createElement("span", { className: "nav-logo-divider" }),
      logoMark(32),
      React.createElement("span", { style: { display: "inline-block" } }, "Kasafide"),
    ),
    React.createElement(NavLinks),
    React.createElement(
      "div",
      { className: "nav-btns" },
      React.createElement("button", {
        className: "nav-theme-btn",
        onClick: toggleTheme,
        title: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
        dangerouslySetInnerHTML: { __html: theme === 'dark' ? sunSVG : moonSVG },
      }),
      React.createElement("button", { className: "btn-outline", onClick: () => (window.location.href = "auth/signin.html") }, "Sign In"),
      React.createElement("button", { className: "btn-solid", onClick: () => (window.location.href = "auth/signup.html") }, "Sign Up"),
    ),
  );
}


const bedSVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/><path d="M2 9h20v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><line x1="6" y1="9" x2="6" y2="20"/></svg>`;
const bathSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6L9 2"/><path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><line x1="4" y1="14" x2="20" y2="14"/></svg>`;

function HeroBento() {
  const listings = useFeaturedListings();
  const tiles = listings ? listings.slice(0, 5) : [];
  if (!tiles.length) return null;  // still loading, or nothing approved yet

  return React.createElement('div', { className:'hero-bento-wrap' },
    // ── Live ping badge ──
    // Used to claim a specific count ("3 new listings today") that was never real. Nothing here
    // counts how many were added today, so this says something true instead of an invented number.
    React.createElement('div', { className:'bento-ping' },
      React.createElement('span', { className:'bento-ping-dot' }),
      'New listings added regularly',
    ),
    // ── Bento grid ──
    React.createElement('div', { className:'hero-bento' },
      tiles.map((l, i) =>
        React.createElement('div', {
          key: l.id || i,
          className: `bento-tile${i === 0 ? ' bento-featured' : ''}`,
          style: { backgroundImage:`url(${l.image})` },
        },
          React.createElement('div', { className:'bento-grad' }),
          React.createElement('div', { className:'bento-content' },
            React.createElement('span', { className:`bento-badge bento-badge-${l.badgeType}` }, l.badge),
            React.createElement('div', { className:'bento-info' },
              React.createElement('div', { className:'bento-price' }, l.price + l.period),
              React.createElement('div', { className:'bento-name' }, l.name),
              React.createElement('div', { className:'bento-loc' }, l.barangay),
              React.createElement('div', { className:'bento-meta' },
                React.createElement('span', { className:'bento-pill' },
                  React.createElement('span', { dangerouslySetInnerHTML:{ __html: bedSVG } }),
                  `${l.beds} bed`,
                ),
                React.createElement('span', { className:'bento-pill' },
                  React.createElement('span', { dangerouslySetInnerHTML:{ __html: bathSVG } }),
                  `${l.baths} bath`,
                ),
              ),
            ),
          ),
        )
      ),
    ),
  );
}

// The three cards tilt toward the pointer, with the icon and the words standing off the surface
// and a soft light following the cursor.
//
// Three things keep this cheap, because this page has been laggy on a mid-range machine before:
//   • one listener on the grid rather than one per card;
//   • pointer positions are stored and applied once per frame, not once per pointer event — a
//     mouse can fire far more often than the screen refreshes;
//   • only transform and opacity change, so the compositor handles it and nothing repaints. The
//     light is a circle that gets moved, rather than a gradient redrawn at a new position.
const TILT_DEGREES = 9;

function useCardTilt(gridRef) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // A finger has no hover, and tilting under it would just fight the scroll. Someone who has
    // asked for less motion should not get a card that moves at all.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;

    grid.classList.add('tilt-on');

    let frame = 0;
    let pending = null;
    let current = null;

    function clear(card) {
      if (!card) return;
      card.classList.remove('is-tilting');
      for (const prop of ['--rx', '--ry', '--gx', '--gy']) card.style.removeProperty(prop);
    }

    function apply() {
      frame = 0;
      if (!pending) return;
      const { card, px, py, w, h } = pending;
      // Away from the centre in each direction, as -0.5 to 0.5. Y drives rotateX and is negated,
      // so pointing at the top of the card tips its top edge away from you.
      card.style.setProperty('--rx', `${(0.5 - py / h) * TILT_DEGREES}deg`);
      card.style.setProperty('--ry', `${(px / w - 0.5) * TILT_DEGREES}deg`);
      card.style.setProperty('--gx', `${px}px`);
      card.style.setProperty('--gy', `${py}px`);
    }

    function onMove(e) {
      const card = e.target.closest && e.target.closest('.feature-card');
      if (!card) { if (current) { clear(current); current = null; } return; }

      // Moving straight from one card to the next never fires a leave on the grid, so the card
      // being left has to be reset here or it stays frozen mid-tilt.
      if (current && current !== card) clear(current);
      if (current !== card) { card.classList.add('is-tilting'); current = card; }

      const r = card.getBoundingClientRect();
      pending = { card, px: e.clientX - r.left, py: e.clientY - r.top, w: r.width, h: r.height };
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function onLeave() {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      pending = null;
      clear(current);
      current = null;
    }

    grid.addEventListener('pointermove', onMove);
    grid.addEventListener('pointerleave', onLeave);

    return () => {
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      clear(current);
      grid.classList.remove('tilt-on');
    };
  }, []);
}

// Feature Highlights Section
function FeatureHighlights() {
  const features = [
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      title: 'Admin-Verified Listings',
      desc: 'Every listing reviewed before publishing',
      color: 'var(--primary)',
      badge: 'VERIFIED'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
      title: 'Secure In-Chat Payments',
      desc: 'Agree on price and send payment requests within the chat',
      color: 'var(--info)',
      badge: 'SECURE'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
      title: 'Anti-Fraud Protection',
      desc: 'Government ID verification for all sellers',
      color: 'var(--warning)',
      badge: 'PROTECTED'
    },
  ];

  const gridRef = useRef(null);
  useCardTilt(gridRef);

  return React.createElement(
    'section',
    { className: 'feature-highlights' },
    React.createElement(
      'div',
      { className: 'feature-grid', ref: gridRef },
      ...features.map((feat, i) =>
        React.createElement(
          'div',
          { key: i, className: 'feature-card feature-3d', style: { '--feature-color': feat.color } },
          // The decorative corner and the moving light live in their own layer. They have to be
          // clipped to the card's rounded corners, and clipping the card itself would flatten it:
          // any overflow other than visible forces transform-style back to flat, which would leave
          // the icon and the words lying on the surface instead of standing off it.
          React.createElement('div', { className: 'feature-card-bg', 'aria-hidden': 'true' },
            React.createElement('span', { className: 'feature-card-glare' }),
          ),
          React.createElement('div', {
            className: 'feature-card-icon',
            dangerouslySetInnerHTML: { __html: feat.icon }
          }),
          React.createElement('div', { className: 'feature-card-badge' }, feat.badge),
          React.createElement('h3', { className: 'feature-card-title' }, feat.title),
          React.createElement('p', { className: 'feature-card-desc' }, feat.desc)
        )
      )
    )
  );
}

// Trust Banner Component
function TrustBanner() {
  return React.createElement(
    'section',
    { className: 'trust-banner' },
    React.createElement(
      'div',
      { className: 'trust-content' },
      React.createElement('div', {
        className: 'trust-icon',
        dangerouslySetInnerHTML: {
          __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`
        }
      }),
      React.createElement(
        'h3',
        { className: 'trust-text' },
        'Every listing is reviewed. Every seller is verified. ',
        React.createElement('span', { className: 'trust-highlight' }, 'No exceptions.')
      ),
      React.createElement(
        'p',
        { className: 'trust-subtext' },
        'Your safety is our priority. All sellers undergo government ID verification before posting.'
      )
    )
  );
}

// Platform Features Section
function PlatformFeatures() {
  const features = [
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
      title: 'In-Chat Payment Requests',
      desc: 'Request and track payments directly in conversations'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
      title: 'Security Deposit Management',
      desc: 'Automated deposit tracking and refund processing'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
      title: 'Damage Reporting System',
      desc: 'Photo uploads and dispute resolution tools'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      title: 'Barangay-Level Search',
      desc: 'Find properties in all 24 barangays of Sta. Maria'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
      title: 'Verified Seller Badges',
      desc: 'Government ID verification for all property owners'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
      title: 'Real-Time Messaging',
      desc: 'Instant chat with sellers, no phone numbers required'
    }
  ];

  return React.createElement(
    'section',
    { className: 'platform-features' },
    React.createElement('h2', { className: 'section-title' }, 'Platform Features'),
    React.createElement('p', { className: 'section-subtitle' }, 'Everything you need for safe and secure property rentals'),
    React.createElement(
      'div',
      { className: 'platform-grid' },
      ...features.map((feat, i) =>
        React.createElement(
          'div',
          { key: i, className: 'platform-item' },
          React.createElement('div', {
            className: 'platform-icon',
            dangerouslySetInnerHTML: { __html: feat.icon }
          }),
          React.createElement('h3', { className: 'platform-title' }, feat.title),
          React.createElement('p', { className: 'platform-desc' }, feat.desc)
        )
      )
    )
  );
}

// Hero
//
// A full-bleed photo of a real featured listing, with that same listing in the card on the right.
// The two move together: the arrows, the dots and the timer all change one index, and the
// background cross-fades to whichever listing the card is showing. Nothing loaded yet means a plain
// dark panel; nothing approved at all means the bundled stock photo and no card.
const HERO_FALLBACK_IMG = 'assets/img/house_image.jpg';
const HERO_ROTATE_MS = 6500;
const HERO_MAX_SLIDES = 6;
const heroTypeIcons = {
  house:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/></svg>`,
  apartment: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>`,
  lot:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>`,
};
const heroArrowIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// ── Effects adapted from React Bits (reactbits.dev, MIT + Commons Clause) ────────────────────
// Those components ship for a bundler (BlurText needs `motion`, others run a JS loop per frame).
// This page has no build step, so each is a small port: CSS keyframes where CSS can do it, and
// one shared, frame-throttled listener for the pointer effects. All of it is skipped under
// prefers-reduced-motion except the spotlight, which only follows the pointer.

// Blur Text: each word starts blurred and lifted, then settles, one after another.
function BlurText({ text, delay = 0, step = 0.09 }) {
  const words = text.split(' ');
  return h(React.Fragment, null, words.flatMap((w, i) => [
    h('span', { key: 'w' + i, className: 'blur-word', style: { animationDelay: `${delay + i * step}s` } }, w),
    i < words.length - 1 ? ' ' : null,
  ]));
}

// Spotlight Card (verify + platform cards) and Magnet (the two hero buttons).
const SPOTLIGHT_CARDS = '.verify-card, .platform-item';
const MAGNET_TARGETS = '.hero-btn-browse, .hero-btn-list';
const MAGNET_REACH = 70;     // px beyond the button's edge where the pull starts
const MAGNET_STRENGTH = 5;   // 1/n of the distance to the pointer

function usePointerEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ev = null, queued = false;

    const frame = () => {
      queued = false;
      const e = ev;
      const card = e.target.closest && e.target.closest(SPOTLIGHT_CARDS);
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      if (calm) return;
      document.querySelectorAll(MAGNET_TARGETS).forEach((btn) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const near = Math.abs(e.clientX - cx) < r.width / 2 + MAGNET_REACH
                  && Math.abs(e.clientY - cy) < r.height / 2 + MAGNET_REACH;
        btn.style.transform = near
          ? `translate(${(e.clientX - cx) / MAGNET_STRENGTH}px, ${(e.clientY - cy) / MAGNET_STRENGTH}px)`
          : '';
      });
    };
    const onMove = (e) => { ev = e; if (!queued) { queued = true; requestAnimationFrame(frame); } };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
}

function Hero() {
  usePointerEffects();
  const listings = useFeaturedListings();
  const heroRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  // A listing without its own photo gets data.js's placeholder; a placeholder is no hero.
  const slides = (listings || []).filter((l) => l.image && !l.image.startsWith('data:')).slice(0, HERO_MAX_SLIDES);
  const n = slides.length;
  const at = n ? idx % n : 0;
  const cur = n ? slides[at] : null;

  // Changes on its own, always: no arrows, no pause on hover. One timeout per slide rather than an
  // interval, so clicking a dot restarts the wait instead of the next change landing a second
  // later. Waits only while the tab is hidden or the hero is scrolled away (glass-nav.js sets
  // .hero-paused). Reduced motion keeps the rotation; it only drops the zoom (see index.css).
  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => {
      const hero = heroRef.current;
      if (document.hidden || (hero && hero.classList.contains('hero-paused'))) { setTick((x) => x + 1); return; }
      setIdx((i) => (i + 1) % n);
    }, HERO_ROTATE_MS);
    return () => clearTimeout(t);
  }, [idx, n, tick]);


  return h(
    'section',
    { className: 'hero hero-photo', ref: heroRef },

    // ── Background photos, one per slide, cross-faded ──
    h('div', { className: 'hero-bg', 'aria-hidden': 'true' },
      n
        ? slides.map((s, i) => h('img', {
            key: s.id, src: s.image, alt: '', decoding: 'async',
            className: `hero-bg-img${i === at ? ' is-active' : ''}`,
          }))
        : listings
          ? h('img', { src: HERO_FALLBACK_IMG, alt: '', className: 'hero-bg-img is-active' })
          : null,
    ),
    h('div', { className: 'hero-shade', 'aria-hidden': 'true' }),
    h('div', { className: 'hero-watermark', 'aria-hidden': 'true' }, 'KASAFIDE'),

    // ── Copy ──
    h('div', { className: 'hero-left' },
      h('h1', { className: 'hero-title' },
        h(BlurText, { text: 'Buy. Sell. Rent.' }), h('br'),
        h(BlurText, { text: 'All in one place.', delay: 0.27 }),
        h('span', { className: 'hero-title-accent shiny-text blur-word', style: { animationDelay: '0.6s, 2.4s' } }, 'Verified, every time.'),
      ),
      h('p', { className: 'hero-desc' },
        'Kasafide connects buyers with verified property owners across Sta. Maria, Bulacan. No hidden listings. No unverified sellers.',
      ),
      h('div', { className: 'hero-trust' },
        h('span', { className: 'hero-trust-item' },
          h('span', { className: 'hero-trust-icon', dangerouslySetInnerHTML: { __html: shieldIcon } }),
          h('span', null, 'Every seller ID-checked, every listing reviewed'),
        ),
      ),
      h('div', { className: 'hero-ctas' },
        // Desktop: Browse Listings & List Property
        h('button', { className: 'hero-btn-primary hero-btn-browse', onClick: () => showBrowse() },
          h('span', null, 'Browse Listings'),
          h('span', { className: 'hero-btn-arrow', dangerouslySetInnerHTML: { __html: heroArrowIcon } }),
        ),
        h('button', { className: 'hero-btn-secondary hero-btn-list', onClick: () => (window.location.href = 'auth/signup.html?role=seller') },
          h('span', null, 'List Your Property'),
        ),
        // Mobile: Sign In & Sign Up
        h('button', { className: 'hero-btn-mobile-signin', onClick: () => (window.location.href = 'auth/signin.html') }, 'Sign In'),
        h('button', { className: 'hero-btn-mobile-signup', onClick: () => (window.location.href = 'auth/signup.html') }, 'Sign Up'),
      ),
    ),

    // ── Featured card + categories ──
    h('div', { className: 'hero-side' },
      cur && h('div', { className: 'hero-feature' },
        // Photo on the left, details in their own inner panel on the right, with the dots at the
        // bottom of that panel. The photo and the title both open the listing.
        h('button', {
            type: 'button', className: 'hf-thumb-btn', onClick: () => openListing(cur.id),
            'aria-label': `Featured: ${cur.title}, ${cur.price}${cur.period}. View listing.`,
          },
          h('img', { key: 'img-' + cur.id, className: 'hf-thumb', src: cur.image, alt: '' }),
        ),
        h('div', { className: 'hf-panel' },
          h('div', { key: 'text-' + cur.id, className: 'hf-text' },
            h('span', { className: 'hf-kicker' }, [cur.badge, cur.barangay].filter(Boolean).join(' · ')),
            h('button', { type: 'button', className: 'hf-title', tabIndex: -1, onClick: () => openListing(cur.id) }, h('span', null, cur.title)),
            h('span', { className: 'hf-price' }, cur.price, cur.period && h('small', null, cur.period)),
          ),
          n > 1 && h('div', { className: 'hf-foot' },
          h('div', { className: 'hf-dots' },
            slides.map((s, i) => h('button', {
              key: s.id, type: 'button',
              className: `hf-dot${i === at ? ' is-active' : ''}`,
              'aria-label': `Show featured listing ${i + 1} of ${n}`,
              'aria-current': i === at ? 'true' : undefined,
              onClick: () => setIdx(i),
            })),
          ),
          ),
        ),
      ),
      // Same three types as the "Browse by Type" section; each shows the Browse section filtered to it.
      h('div', { className: 'hero-brgy' },
        h('div', { className: 'hero-brgy-head' }, 'Browse by category'),
        h('div', { className: 'hero-brgy-chips' },
          categories.map((c) => h('a', {
              key: c.type, className: 'hero-brgy-chip',
              href: '#browse',
              onClick: (e) => { e.preventDefault(); showBrowse({ type: c.type }); },
            },
            h('span', { dangerouslySetInnerHTML: { __html: heroTypeIcons[c.type] } }),
            c.name,
          )),
        ),
      ),
    ),
  );
}

// Map: the barangay map that used to sit in the hero, now its own section.
function MapSection() {
  const [ref, visible] = useReveal(0.08);
  const counts = useBarangayCounts();
  const list = counts
    ? Object.keys(counts).filter((k) => counts[k] > 0).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
    : null;

  // Full-bleed: the map fills the whole section with no frame, and the heading and the list
  // float over its empty left side (the drawing is tall and narrow, so that side is free).
  return h(
    'section',
    { id: 'map', className: `map-section reveal-section${visible ? ' in-view' : ''}`, ref },
    h('div', { className: 'map-frame' }, h(BarangayMap)),
    h('div', { className: 'map-overlay' },
      h('div', { className: 'map-head' },
        h('span', { className: 'section-label' }, 'Explore the Map'),
        h('h2', { className: 'section-title' }, 'Every Barangay in Sta. Maria'),
        h('p', { className: 'map-sub' }, 'Each pin is a barangay with live listings. Click one to see what’s there.'),
      ),
      h('aside', { className: 'map-side' },
        h('div', { className: 'map-side-title' }, 'Barangays with listings'),
        list === null
          ? h('p', { className: 'map-side-empty' }, 'Loading…')
          : list.length
            ? h('ul', { className: 'map-side-list' },
                list.map((name) => h('li', { key: name },
                  h('button', { type: 'button', onClick: () => browseBarangay(name) },
                    h('span', { className: 'map-side-name' }, name),
                    h('span', { className: 'map-side-count' }, counts[name]),
                  ),
                )),
              )
            : h('p', { className: 'map-side-empty' }, 'No live listings yet.'),
      ),
      h('p', { className: 'map-hint' }, 'Drag to move · Ctrl + scroll to zoom · Shift + drag to rotate'),
    ),
  );
}

// Browse — every approved listing, filterable, as a section of this page. It used to be only
// browse.html (which still works for old links); now the navbar, the hero, the category chips,
// Browse by Type and the map all bring you down here with the filter already set.
const BROWSE_TYPES = [['', 'All types'], ['house', 'House'], ['apartment', 'Apartment'], ['condo', 'Condo'], ['commercial', 'Commercial'], ['lot', 'Lot only']];
const BROWSE_FOR = [['', 'For sale & rent'], ['rent', 'For rent'], ['sale', 'For sale']];
const NO_FILTERS = { type: '', for: '', barangay: '', q: '' };

// Show the browse section with these filters, e.g. showBrowse({ type: 'lot' }).
function showBrowse(filters) {
  window.dispatchEvent(new CustomEvent('kf-browse', { detail: filters || {} }));
  const el = document.getElementById('browse');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// An approved listing (HS.listings.approved) in the shape FeaturedCard draws, so both rows of
// cards on this page look the same.
function browseCard(l) {
  const rent = l.listingFor === 'rent';
  return {
    id: l.id, title: l.title,
    price: '₱' + (Number(l.price) || 0).toLocaleString('en-PH'),
    period: rent ? '/month' : '',
    location: [l.barangay, l.city || 'Sta. Maria'].filter(Boolean).join(', '),
    beds: l.bedrooms || 0, baths: l.bathrooms || 0,
    badge: rent ? 'For Rent' : 'For Sale', badgeType: rent ? 'rent' : 'sale',
    verified: !!l.verified,
    image: HS.cover(l),
  };
}

let approvedListingsPromise = null;

function BrowseSection() {
  const [ref, visible] = useReveal(0.05);
  const [all, setAll] = useState(null);
  const [failed, setFailed] = useState(false);
  const [f, setF] = useState(NO_FILTERS);

  useEffect(() => {
    if (typeof HS === 'undefined' || !HS.listings) return;
    if (!approvedListingsPromise) approvedListingsPromise = HS.listings.approved();
    let cancelled = false;
    approvedListingsPromise
      .then((rows) => { if (!cancelled) setAll(rows); })
      .catch((err) => {
        console.error('Could not load listings:', err);
        approvedListingsPromise = null;
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onBrowse = (e) => setF({ ...NO_FILTERS, ...e.detail });
    window.addEventListener('kf-browse', onBrowse);
    return () => window.removeEventListener('kf-browse', onBrowse);
  }, []);

  // Barangays that actually have listings, plus the one asked for if it has none, so a map click
  // on an empty barangay says "0 found" with the barangay still named instead of showing all.
  const barangays = all ? [...new Set(all.map((l) => l.barangay).filter(Boolean))].sort() : [];
  if (f.barangay && !barangays.includes(f.barangay)) barangays.push(f.barangay);

  const q = f.q.trim().toLowerCase();
  const shown = (all || []).filter((l) =>
    (!f.type || l.type === f.type) &&
    (!f.for || l.listingFor === f.for) &&
    (!f.barangay || l.barangay === f.barangay) &&
    (!q || [l.title, l.address, l.barangay].some((v) => (v || '').toLowerCase().includes(q))));
  const filtering = !!(f.type || f.for || f.barangay || q);
  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const select = (key, label, options) => h('select', { className: 'bs-field', value: f[key], onChange: set(key), 'aria-label': label },
    options.map(([v, t]) => h('option', { key: v, value: v }, t)));

  return h(
    'section',
    { id: 'browse', className: `section browse-section reveal-section${visible ? ' in-view' : ''}`, ref },
    h('span', { className: 'section-label' }, 'Browse'),
    h('h2', { className: 'section-title' }, 'All Properties'),
    h('p', { className: 'section-sub' }, 'Every approved listing in Sta. Maria, Bulacan. Narrow it down by type, barangay, or a search.'),
    h('div', { className: 'bs-filters' },
      select('type', 'Property type', BROWSE_TYPES),
      select('for', 'For sale or rent', BROWSE_FOR),
      select('barangay', 'Barangay', [['', 'All barangays']].concat(barangays.map((b) => [b, b]))),
      h('input', {
        className: 'bs-field bs-search', type: 'search', value: f.q, onChange: set('q'),
        placeholder: 'Search by title or address…', 'aria-label': 'Search listings',
      }),
    ),
    h('div', { className: 'bs-meta' },
      h('span', null, all === null
        ? (failed ? 'Could not load listings.' : 'Loading listings…')
        : `${shown.length} propert${shown.length === 1 ? 'y' : 'ies'} found`),
      filtering && h('button', { type: 'button', className: 'bs-clear', onClick: () => setF(NO_FILTERS) }, 'Clear filters'),
    ),
    all && (shown.length
      ? h('div', { className: 'bs-grid' }, shown.map((l) => FeaturedCard(browseCard(l))))
      : h('p', { className: 'bs-empty' }, filtering ? 'No listings match those filters.' : 'No approved listings yet.')),
  );
}

// Categories
function Categories() {
  const [ref, visible] = useReveal();
  const summary = useTypeCounts();
  const typeCounts = summary && summary.counts;
  const typePhotos = (summary && summary.photos) || {};
  return React.createElement(
    "section",
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "span",
      { className: "section-label" },
      "Browse by Type",
    ),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Find What You're Looking For",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Filter by property type or listing category",
    ),
    React.createElement(
      "div",
      { className: "categories-grid" },
      categories.map((c, i) => {
        // null while still loading — say nothing definite yet rather than flash a wrong number.
        const n = typeCounts && (typeCounts[c.type] || 0);
        const countLabel = typeCounts == null ? ' ' : n === 1 ? '1 listing' : `${n} listings`;
        // A real listing's photo first, then the bundled fallbacks — but only once the data is in.
        // Starting on the fallbacks while it loads meant the stock photo flashed up, then got
        // swapped for the real one a moment later; the gradient is the honest "loading" state.
        const sources = summary == null ? []
          : (typePhotos[c.type] ? [typePhotos[c.type]] : []).concat(c.fallbacks);
        // Shows the Browse section filtered to this card's type.
        const open = () => showBrowse({ type: c.type });
        return React.createElement(
          "div",
          {
            key: i, className: "cat-card", role: "link", tabIndex: 0,
            style: { cursor: "pointer" },
            onClick: open,
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
          },
          React.createElement(CategoryPhoto, { sources, alt: c.name }),
          React.createElement("div", { className: "cat-shade" }),
          React.createElement(
            "div",
            { className: "cat-text" },
            React.createElement("div", { className: "cat-name" }, c.name),
            React.createElement("div", { className: "cat-count" }, countLabel),
          ),
        );
      }),
    ),
  );
}

// Featured Properties
//
// A row of real listing cards — up to three in view, the rest a swipe or an arrow away. It used to
// be one card in the middle with half-faded neighbours, which with only one or two listings meant a
// lone card and two arrows a long way off. Now the row simply holds however many there are: centred
// when they all fit, scrollable (scroll-snap, so it works by touch too) when they don't, and the
// arrows only appear when there is actually somewhere to go.
const bedIcon  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
const bathIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;

// Same rule as browse.html: signed-in buyers and sellers go straight to the listing, everyone else
// signs in first and is sent back to it afterwards.
function openListing(id) {
  const target = 'module/buyer/listing.html?id=' + encodeURIComponent(id);
  const me = typeof getSession === 'function' ? getSession() : null;
  if (me && (me.role === 'buyer' || me.role === 'seller')) { window.location.href = target; return; }
  window.location.href = 'auth/signin.html?redirect=' + encodeURIComponent(target);
}

function FeaturedCard(prop) {
  const specs = [];
  // A lot has no rooms — showing "0 bed · 0 bath" on land would read like missing data.
  if (prop.beds) specs.push({ icon: bedIcon, text: `${prop.beds} bed${prop.beds === 1 ? '' : 's'}` });
  if (prop.baths) specs.push({ icon: bathIcon, text: `${prop.baths} bath${prop.baths === 1 ? '' : 's'}` });
  const open = () => openListing(prop.id);

  return React.createElement(
    "article",
    {
      key: prop.id, className: "fp-card", role: "link", tabIndex: 0,
      "aria-label": `${prop.title}, ${prop.price}${prop.period}`,
      onClick: open,
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
    },
    React.createElement(
      "div",
      { className: "fp-media" },
      React.createElement("img", { className: "fp-img", src: prop.image, alt: prop.title, loading: "lazy" }),
      React.createElement("span", { className: `fp-badge fp-badge-${prop.badgeType}` }, prop.badge),
      prop.verified && React.createElement("span", {
        className: "fp-verified",
        dangerouslySetInnerHTML: { __html: checkIcon + "<span>Verified</span>" },
      }),
    ),
    React.createElement(
      "div",
      { className: "fp-body" },
      React.createElement(
        "div",
        { className: "fp-price" },
        prop.price,
        prop.period && React.createElement("span", null, prop.period),
      ),
      React.createElement("h3", { className: "fp-title" }, prop.title),
      React.createElement(
        "div",
        { className: "fp-loc" },
        React.createElement("span", { dangerouslySetInnerHTML: { __html: pinIcon } }),
        React.createElement("span", null, prop.location),
      ),
      React.createElement(
        "div",
        { className: "fp-foot" },
        React.createElement(
          "div",
          { className: "fp-specs" },
          specs.map((s, i) => React.createElement(
            "span",
            { key: i, className: "fp-spec" },
            React.createElement("span", { dangerouslySetInnerHTML: { __html: s.icon } }),
            s.text,
          )),
        ),
        React.createElement("span", { className: "fp-cta" }, "View details →"),
      ),
    ),
  );
}

function Carousel() {
  const [ref, visible] = useReveal();
  const listings = useFeaturedListings();
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  // Which arrows make sense right now — re-checked on scroll and whenever the row resizes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => setEdges({
      start: track.scrollLeft <= 2,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
    update();
    track.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => { track.removeEventListener('scroll', update); ro.disconnect(); };
  }, [listings]);

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.fp-card');
    const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const header = [
    React.createElement("span", { key: "l", className: "section-label" }, "Featured Properties"),
    React.createElement("h2", { key: "t", className: "section-title" }, "Curated Listings Near You"),
  ];

  // Still loading, or genuinely nothing approved yet.
  if (!listings || !listings.length) {
    return React.createElement(
      "section",
      { id: "featured", className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
      ...header,
      React.createElement(
        "p",
        { className: "section-sub" },
        listings === null
          ? "Loading listings…"
          : "No approved listings yet — check back soon, or be the first to list.",
      ),
    );
  }

  const scrollable = !(edges.start && edges.end);

  return React.createElement(
    "section",
    { id: "featured", className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    ...header,
    React.createElement(
      "p",
      { className: "section-sub" },
      "Approved listings from verified sellers in Sta. Maria, Bulacan",
    ),
    React.createElement(
      "div",
      { className: "fp-stage" },
      scrollable && React.createElement("button", {
        className: "fp-arrow fp-arrow-left", "aria-label": "Previous listings",
        disabled: edges.start, onClick: () => scrollByCard(-1),
        dangerouslySetInnerHTML: { __html: chevronLeft },
      }),
      React.createElement(
        "div",
        { className: `fp-track${scrollable ? '' : ' fp-track-fits'}`, ref: trackRef },
        listings.map((p) => FeaturedCard(p)),
      ),
      scrollable && React.createElement("button", {
        className: "fp-arrow fp-arrow-right", "aria-label": "More listings",
        disabled: edges.end, onClick: () => scrollByCard(1),
        dangerouslySetInnerHTML: { __html: chevronRight },
      }),
    ),
    React.createElement(
      "a",
      { className: "fp-all", href: "#browse" },
      "Browse all properties →",
    ),
  );
}


// How It Works
// The curve running down the timeline.
//
// It is measured rather than drawn to fixed coordinates: each step is as tall as its content, so
// the dots are not evenly spaced and no hand-written path would sit on them. This reads the real
// position of every .tl-dot and bends a cubic between each pair, alternating sides so the line
// snakes. Because it measures, it stays correct when the text wraps differently or the window
// changes width.
// Where an element sits inside an ancestor, by layout rather than by what is on screen.
//
// getBoundingClientRect would be the obvious choice and it is the wrong one here: it reports the
// painted position, which includes transforms. Each step comes in under
// `transform: translateY(22px)` and animates to none, so measuring that way put every dot 22px
// below where it settles — and because a transform changes nothing about layout, the container
// never resized and the ResizeObserver never fired to correct it. offsetTop/offsetLeft ignore
// transforms, so this reads the position the dot will actually rest at.
function offsetWithin(el, root) {
  let x = 0, y = 0;
  for (let node = el; node && node !== root; node = node.offsetParent) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

function useCurvedSpine(containerRef, pathRef) {
  useEffect(() => {
    const box = containerRef.current;
    const path = pathRef.current;
    if (!box || !path) return;

    // Below this width the steps stack into one column and the line belongs at the left edge,
    // straight. That version is the ::before in the stylesheet, so there is nothing to draw.
    const twoColumn = window.matchMedia('(min-width: 861px)');

    function draw() {
      const svg = path.parentNode;
      if (!twoColumn.matches) { svg.style.display = 'none'; return; }
      svg.style.display = '';

      const rect = { width: box.offsetWidth, height: box.offsetHeight };
      const dots = [...box.querySelectorAll('.tl-dot')].map((dot) => {
        const at = offsetWithin(dot, box);
        return { x: at.x + dot.offsetWidth / 2, y: at.y + dot.offsetHeight / 2 };
      });
      if (dots.length < 2) return;

      svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

      // Everything below has to stay inside the middle column or the route slides under the
      // preview windows. That column is 170px, plus 8px of padding each side, so there is 93px of
      // clear space either way. A cubic bows out to about three quarters of its control offset,
      // which is where these numbers come from.
      const swoop = Math.min(78, rect.width * 0.085);

      // The loop is a circle hung off the route: the line runs into it at one side, goes the long
      // way round, and carries on from the other. A circle costs its radius plus the offset of its
      // centre, which is 1.65 radii in all — much cheaper than tying the knot with a single curve,
      // where most of the width goes on the approach and the curl ends up a third of the size.
      const radius = Math.min(46, rect.width * 0.043);
      const halfChord = radius * 0.76;                               // where the circle meets the line
      const centreGap = Math.sqrt(radius * radius - halfChord * halfChord);

      let d = `M ${dots[0].x} ${dots[0].y}`;

      for (let i = 1; i < dots.length; i++) {
        const a = dots[i - 1];
        const b = dots[i];
        const dy = b.y - a.y;
        // Each segment leans the opposite way to the one before, so the route weaves.
        const side = i % 2 ? 1 : -1;

        if (i % 2) {
          // A loop. Consecutive loops hang on opposite sides, so the route does not just curl the
          // same way twice.
          const loopSide = ((i - 1) / 2) % 2 ? -1 : 1;
          const mid = (a.y + b.y) / 2;
          const enter = mid - halfChord;
          const leave = mid + halfChord;

          // Into the loop, leaning out and coming back to meet the circle.
          d += ` C ${a.x + swoop * loopSide * 0.45} ${a.y + dy * 0.26}, ${a.x} ${enter - dy * 0.2}, ${a.x} ${enter}`;
          // The circle. large-arc takes the long way round rather than the short hop across the
          // chord, which is the difference between a loop and a dent; sweep picks the side.
          d += ` A ${radius} ${radius} 0 1 ${loopSide > 0 ? 1 : 0} ${a.x} ${leave}`;
          // And out of it, down to the next dot.
          d += ` C ${b.x} ${leave + dy * 0.2}, ${b.x + swoop * loopSide * 0.45} ${b.y - dy * 0.26}, ${b.x} ${b.y}`;
        } else {
          // A plain swoop between two loops. Both control points on the same side bow the segment
          // that way, and the tangents still line up with the segments either side, so the route
          // does not kink at the dot.
          const reach = dy * 0.42;
          d += ` C ${a.x + swoop * side} ${a.y + reach}, ${b.x + swoop * side} ${b.y - reach}, ${b.x} ${b.y}`;
        }
      }

      path.setAttribute('d', d);
    }

    draw();

    // Step heights change when the window resizes, when a font finishes loading, and when an
    // image inside a preview settles — a ResizeObserver on the container catches all three.
    //
    // It is guarded because this runs in an effect, and an effect that throws takes the whole page
    // down with it. A browser without ResizeObserver still gets the curve; it just redraws on
    // resize alone, so the line can sit slightly off its dots until the next resize. That is a far
    // better failure than a blank landing page.
    let observer = null;
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(draw);
      observer.observe(box);
    } else {
      window.addEventListener('resize', draw);
    }
    twoColumn.addEventListener('change', draw);

    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', draw);
      twoColumn.removeEventListener('change', draw);
    };
  }, []);
}

function HowItWorks() {
  const [ref, visible] = useReveal();
  const stepsRef = useRef(null);
  const pathRef = useRef(null);
  useCurvedSpine(stepsRef, pathRef);

  return React.createElement(
    "section",
    { id: "how-it-works", className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement("span", { className: "section-label" }, "How It Works"),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Simple Steps to Your Next Home",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Get started in minutes — no complicated process",
    ),
    React.createElement(
      "div",
      { className: "how-steps", ref: stepsRef },
      React.createElement(
        'svg',
        { className: 'tl-spine', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        React.createElement(
          'defs',
          null,
          React.createElement(
            'linearGradient',
            { id: 'tl-spine-fade', x1: '0', y1: '0', x2: '0', y2: '1' },
            React.createElement('stop', { offset: '0', style: { stopColor: 'rgb(var(--primary-rgb) / 0)' } }),
            React.createElement('stop', { offset: '0.09', style: { stopColor: 'rgb(var(--primary-rgb) / 0.34)' } }),
            React.createElement('stop', { offset: '0.91', style: { stopColor: 'rgb(var(--primary-rgb) / 0.34)' } }),
            React.createElement('stop', { offset: '1', style: { stopColor: 'rgb(var(--primary-rgb) / 0)' } }),
          ),
        ),
        React.createElement('path', { className: 'tl-spine-path', ref: pathRef, fill: 'none' }),
      ),
      steps.map((s, i) =>
        // "how-step" is kept so the existing reveal animation still staggers these in.
        React.createElement(
          "div",
          { key: i, className: `how-step tl-step${i % 2 ? " tl-flip" : ""}` },
          React.createElement("div", { className: "tl-preview" }, StepPreview(s.screen)),
          React.createElement("div", { className: "tl-dot", "aria-hidden": "true" }),
          React.createElement(
            "div",
            { className: "tl-text" },
            React.createElement(
              "div",
              { className: "tl-head" },
              React.createElement("span", { className: "tl-num" }, s.num),
              React.createElement("span", { className: "tl-label" }, s.label),
            ),
            React.createElement("h3", { className: "tl-title" }, s.title),
            React.createElement("p", { className: "tl-desc" }, s.desc),
          ),
        ),
      ),
    ),
  );
}


const tlCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 10 11 15 8 12"/></svg>`;
const tlShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const tlBed = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/><path d="M2 9h20v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>`;
const tlBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6V2"/><path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><line x1="4" y1="14" x2="20" y2="14"/></svg>`;
const tlArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;

/** The window frame every preview sits in. */
function tlWindow(title, body) {
  return h('div', { className: 'tl-window' },
    h('div', { className: 'tl-window-bar' },
      h('span', { className: 'tl-dot-r' }),
      h('span', { className: 'tl-dot-y' }),
      h('span', { className: 'tl-dot-g' }),
      h('span', { className: 'tl-window-title' }, title),
    ),
    h('div', { className: 'tl-window-body' }, body),
  );
}

/** Step 1 — the verification screen: two documents, then the badge it earns you. */
function screenVerification() {
  const doc = (name, meta) => h('div', { className: 'tl-doc' },
    h('div', { className: 'tl-doc-thumb' },
      h('span', { dangerouslySetInnerHTML: { __html: tlCheck } }),
    ),
    h('div', { className: 'tl-doc-info' },
      h('div', { className: 'tl-doc-name' }, name),
      h('div', { className: 'tl-doc-meta' }, meta),
    ),
    h('span', { className: 'tl-chip tl-chip-ok' }, 'Approved'),
  );

  return tlWindow('Verification', [
    h('div', { key: 'd', className: 'tl-docs' },
      doc('Valid ID', 'Driver\u2019s Licence \u00b7 front and back'),
      doc('Selfie with ID', 'Taken in app'),
    ),
    h('div', { key: 'b', className: 'tl-verified' },
      h('span', { className: 'tl-verified-icon', dangerouslySetInnerHTML: { __html: tlShield } }),
      h('div', null,
        h('div', { className: 'tl-verified-title' }, 'Verified Seller'),
        h('div', { className: 'tl-verified-sub' }, 'Checked by a Kasafide admin'),
      ),
    ),
  ]);
}

/** Step 2 — the card browse.html renders, at a smaller size. */
function screenListing() {
  return tlWindow('Browse', [
    h('div', { key: 'f', className: 'tl-filters' },
      h('span', { className: 'tl-filter' }, 'Poblacion'),
      h('span', { className: 'tl-filter' }, 'Up to \u20b120,000'),
      h('span', { className: 'tl-filter' }, 'Apartment'),
    ),
    h('div', { key: 'c', className: 'tl-listing' },
      h('div', { className: 'tl-listing-img' },
        h('span', { className: 'tl-listing-type' }, 'For Rent'),
      ),
      h('div', { className: 'tl-listing-body' },
        h('div', { className: 'tl-listing-title' }, '2BR Apartment'),
        h('div', { className: 'tl-listing-addr' }, 'Poblacion, Sta. Maria'),
        h('div', { className: 'tl-listing-price' }, '\u20b115,000',
          h('span', null, '/month')),
        h('div', { className: 'tl-listing-specs' },
          h('span', null, h('i', { dangerouslySetInnerHTML: { __html: tlBed } }), '2'),
          h('span', null, h('i', { dangerouslySetInnerHTML: { __html: tlBath } }), '1'),
          h('span', null, h('i', { dangerouslySetInnerHTML: { __html: tlArea } }), '48 sqm'),
        ),
      ),
    ),
  ]);
}

/** Step 3 — the thread, with the viewing request the chat can carry. */
function screenMessages() {
  return tlWindow('Messages', [
    h('div', { key: 'a', className: 'tl-msg tl-msg-them' },
      h('div', { className: 'tl-msg-bubble' }, 'Hi! Is the unit still available?'),
      h('div', { className: 'tl-msg-time' }, '9:15 AM'),
    ),
    h('div', { key: 'b', className: 'tl-msg tl-msg-me' },
      h('div', { className: 'tl-msg-bubble' }, 'Yes it is. Free this Saturday?'),
      h('div', { className: 'tl-msg-time' }, '9:18 AM'),
    ),
    h('div', { key: 'c', className: 'tl-msg tl-msg-them' },
      h('div', { className: 'tl-msg-bubble tl-msg-viewing' },
        h('div', { className: 'tl-viewing-tag' }, 'Viewing Request'),
        h('div', { className: 'tl-viewing-when' }, 'Sat, 14 June \u00b7 10:00 AM'),
        h('div', { className: 'tl-viewing-state' }, 'Accepted'),
      ),
      h('div', { className: 'tl-msg-time' }, '9:22 AM'),
    ),
  ]);
}

/** Step 4 — the payment card, with the meta row the real page shows. */
function screenPayment() {
  const item = (label, value) => h('div', { className: 'tl-pay-item' },
    h('span', { className: 'tl-pay-label' }, label),
    h('span', { className: 'tl-pay-value' }, value),
  );

  return tlWindow('Payments', [
    h('div', { key: 'p', className: 'tl-pay' },
      h('div', { className: 'tl-pay-left' },
        h('div', { className: 'tl-pay-property' }, '2BR Apartment \u2014 Poblacion'),
        h('div', { className: 'tl-pay-meta' },
          item('Type', 'Rent'),
          item('Period', 'June 2026'),
          item('Method', 'GCash'),
          item('Reference', 'GC-78452'),
        ),
      ),
      h('div', { className: 'tl-pay-right' },
        h('div', { className: 'tl-pay-amount' }, '\u20b115,000'),
        h('span', { className: 'tl-chip tl-chip-ok' }, 'Confirmed'),
      ),
    ),
  ]);
}

const SCREENS = {
  verification: screenVerification,
  listing: screenListing,
  messages: screenMessages,
  payment: screenPayment,
};

function StepPreview(name) {
  const render = SCREENS[name];
  return render ? render() : null;
}

// Features
function Features() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "features-inner" },
      React.createElement(
        "span",
        { className: "section-label" },
        "Why Kasafide",
      ),
      React.createElement(
        "h2",
        { className: "section-title" },
        "Built for Trust & Transparency",
      ),
      React.createElement(
        "p",
        { className: "section-sub" },
        "A platform designed with security and convenience at its core",
      ),
      React.createElement(
        "div",
        { className: "features-card-wrap" },
        features.map((f, i) =>
          React.createElement(
            "div",
            { key: i, className: "feature-card" },
            React.createElement("div", {
              className: "feature-icon",
              dangerouslySetInnerHTML: { __html: f.icon },
            }),
            React.createElement("div", { className: "feature-title" }, f.title),
            React.createElement("div", { className: "feature-desc" }, f.desc),
          ),
        ),
      ),
    ),
  );
}

// Animated counter hook
function useCounter(end, duration, active) {
  const [val, setVal] = useState(0);

  // `end` has to be a dependency, not just `active`.
  //
  // The figures in the Stats section arrive from the database after the page has mounted. With
  // only [active] here, the count-up ran once against whatever `end` was at that moment — the
  // fallback, which is 0 for the live figures — and never ran again when the real number landed.
  // The section would sit on "0 Listings Live" with three listings in the database.
  useEffect(() => {
    if (!active) return;
    if (end <= 0) { setVal(end); return; }

    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [active, end]);

  return val;
}

function StatBox({ stat }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setActive(true);
      },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCounter(stat.end, 1800, active);
  return React.createElement(
    "div",
    { className: "stat-box", ref },
    React.createElement(
      "div",
      { className: "stat-value" },
      count.toLocaleString() + stat.suffix,
    ),
    React.createElement("div", { className: "stat-label" }, stat.label),
  );
}

function Stats() {
  const [ref, visible] = useReveal();
  const [live, setLive] = useState(null);

  // One request, once. If it fails the section still renders — the fallback figures above are
  // true on their own, so a database that is briefly unreachable costs nothing on screen.
  useEffect(() => {
    if (typeof HS === 'undefined' || !HS.publicStats) return;
    let cancelled = false;
    HS.publicStats()
      .then((s) => { if (!cancelled) setLive(s); })
      .catch((err) => console.error('Could not load the public figures:', err));
    return () => { cancelled = true; };
  }, []);

  return React.createElement(
    "section",
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "stats-inner" },
      React.createElement(
        "span",
        { className: "section-label" },
        "Our Numbers",
      ),
      React.createElement(
        "h2",
        { className: "section-title" },
        "Where Kasafide Stands Today",
      ),
      React.createElement(
        "p",
        { className: "section-sub" },
        "Counted live from the platform, not rounded up for a landing page",
      ),
      React.createElement(
        "div",
        { className: "stats-grid" },
        statsData.map((s, i) =>
          React.createElement(StatBox, {
            key: i,
            stat: live && s.key && live[s.key] !== undefined
              ? { ...s, end: live[s.key] }
              : s,
          }),
        ),
      ),
    ),
  );
}

// CTA
function CTA() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "div",
    { className: `cta-section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "cta-inner" },
      React.createElement(
        "h2",
        { className: "cta-title" },
        "Ready to Find Your Next Home?",
      ),
      React.createElement(
        "p",
        { className: "cta-sub" },
        "Join verified buyers and sellers finding trusted properties in Sta. Maria, Bulacan",
      ),
      React.createElement(
        "div",
        { className: "cta-btns" },
        React.createElement(
          "button",
          {
            className: "cta-btn-white",
            onClick: () => (window.location.href = "auth/signup.html?role=buyer"),
          },
          "Sign Up as Buyer",
        ),
        React.createElement(
          "button",
          {
            className: "cta-btn-ghost",
            onClick: () => (window.location.href = "auth/signup.html?role=seller"),
          },
          "List Your Property",
        ),
      ),
    ),
  );
}

// Footer
function Footer() {
  const platformLinks = ["Browse Listings", "List Your Property", "About Us"];
  const supportLinks = ["Help & Support", "FAQs"];
  const legalLinks = ["Privacy Policy", "Terms of Service"];

  // Only links a visitor can actually use. "Contact Us" and "Report a Listing" used to sit under
  // Support, but both only opened the sign-in page: there is no public contact page, and
  // reporting needs an account and a listing to report (signed-in users do that from the
  // listing itself). Help & Support is Meowrie on help.html; FAQs is the static answers page.
  const footerHref = {
    "Browse Listings": "#browse",
    "List Your Property": "auth/signup.html?role=seller",
    "About Us": "about.html",
    "Help & Support": "help.html",
    "FAQs": "faqs.html",
  };

  return React.createElement(
    "footer",
    null,
    React.createElement(
      "div",
      { className: "footer-grid" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-logo" },
          logoMark(28),
          "Kasafide",
        ),
        React.createElement(
          "p",
          { className: "footer-tagline" },
          "A verified housing platform for secure property rentals and purchases in Sta. Maria, Bulacan.",
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-col-title" },
          "Platform",
        ),
        ...platformLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: footerHref[l],
            },
            l,
          ),
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-col-title" },
          "Support",
        ),
        ...supportLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: footerHref[l],
            },
            l,
          ),
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement("div", { className: "footer-col-title" }, "Legal"),
        ...legalLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: l === "Privacy Policy" ? "privacy-policy.html" : "terms.html",
            },
            l,
          ),
        ),
      ),
    ),
    React.createElement("div", { className: "footer-divider" }),
    React.createElement(
      "div",
      { className: "footer-copy" },
      "© 2026 Kasafide. All rights reserved.",
    ),
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

// ── How We Verify ────────────────────────────────────────────────────────────
// This replaced the testimonials block, which quoted people who do not exist yet.
//
// Every gate below is one the code actually enforces, and each is worth checking against:
//   • email       — api/auth/signup creates the account unconfirmed and emails a hashed token
//                   (migrations/008); the account cannot be used until that link is opened
//   • identity    — module/seller/verification.html takes a government ID and a selfie from the
//                   camera, and profiles.account_status stays 'pending' until an admin moves it
//   • ownership   — module/seller/post.html requires photos of the Deed of Sale or TCT per listing
//   • publication — RLS only returns properties with status 'approved', so an unreviewed listing
//                   is not merely unlabelled, it is unreachable
const verifySteps = [
  {
    tag: 'Step 1',
    title: 'The email has to be real',
    desc: 'Signing up does not get you in. We send a one-time link to the address given, and the account stays closed until it is opened. An address nobody can receive mail at never becomes an account.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>`,
  },
  {
    tag: 'Step 2',
    title: 'A government ID and a live selfie',
    desc: 'Sellers submit a valid ID and take a selfie through the camera, in the app — not a photo chosen from a gallery. An administrator compares the two before the account is marked verified.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="9" cy="12" r="2.6"/><path d="M14.5 10h4M14.5 14h3"/></svg>`,
  },
  {
    tag: 'Step 3',
    title: 'Proof the property is theirs',
    desc: 'Every listing carries photographs of its Deed of Sale or Transfer Certificate of Title, or a tax declaration. One per property — a verified seller still cannot post a house they cannot document.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>`,
  },
  {
    tag: 'Step 4',
    title: 'Nothing is public until it is reviewed',
    desc: 'A new listing is not hidden behind a label — it is not on the site at all. It appears in browse only after an administrator approves it, and it comes straight back down if a seller’s verification lapses.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
];

function HowWeVerify() {
  const [ref, visible] = useReveal();

  return React.createElement(
    'section',
    { className: `section reveal-section verify-section${visible ? ' in-view' : ''}`, ref, id: 'how-we-verify' },
    React.createElement('span', { className: 'section-label' }, 'How We Verify'),
    React.createElement('h2', { className: 'section-title' }, 'Four Things Nobody Gets Past'),
    React.createElement('p', { className: 'section-sub' },
      'Not a promise about how careful we are — four checks the platform refuses to skip'),
    React.createElement('div', { className: 'verify-grid' },
      verifySteps.map((s, i) =>
        React.createElement('div', { key: i, className: 'verify-card' },
          React.createElement('div', { className: 'verify-card-top' },
            React.createElement('span', {
              className: 'verify-icon',
              dangerouslySetInnerHTML: { __html: s.icon },
            }),
            React.createElement('span', { className: 'verify-tag' }, s.tag),
          ),
          React.createElement('h3', { className: 'verify-title' }, s.title),
          React.createElement('p', { className: 'verify-desc' }, s.desc),
        ),
      ),
    ),
    React.createElement('p', { className: 'verify-note' },
      'Verification does not expire quietly. When a seller’s documents lapse they are moved back to re-verification, and their listings leave the site until the new ones are approved.'),
  );
}

function App() {
  // Order, top to bottom: find a place (listings, type, barangay map) -> how it works -> why you
  // can trust it (the rule, then how each gate is enforced) -> what the platform does for you ->
  // the live numbers as proof -> every listing, filterable -> sign up.
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Navbar),
    React.createElement(Hero),
    // Discover
    React.createElement(Carousel),
    React.createElement(Categories),
    React.createElement(MapSection),
    // How it works
    React.createElement(HowItWorks),
    // Trust
    React.createElement(TrustBanner),
    React.createElement(HowWeVerify),
    // What you get
    React.createElement(Features),
    React.createElement(FeatureHighlights),
    React.createElement(PlatformFeatures),
    // Proof, then the ask
    React.createElement(Stats),
    React.createElement(BrowseSection),
    React.createElement(CTA),
    React.createElement(Footer),
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
