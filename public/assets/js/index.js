// ── Data ──────────────────────────────────────────────────────────────────────

// Counts used to come from fixed numbers here (342, 218, 97) that were never real — see
// useTypeCounts() below for what replaced them. `types` lists which property_type values each
// card adds together; the schema (006_frontend_alignment.sql) only has 'house' | 'apartment' |
// 'condo' | 'commercial' | 'lot', so there is no single real type called "Townhouses" — that card
// now covers everything that isn't a house or an apartment instead of claiming a type that
// doesn't exist.
const categories = [
  {
    name: "Houses",
    types: ["house"],
    color: "#1a9e8f",
    bg: "rgba(26,158,143,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    name: "Apartments",
    types: ["apartment"],
    color: "#6c63ff",
    bg: "rgba(108,99,255,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>`,
  },
  {
    name: "Other Properties",
    types: ["condo", "commercial", "lot"],
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M1 22h22"/><path d="M5 22V7l7-5 7 5v15"/><path d="M9 22V12h6v10"/></svg>`,
  },
];

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
    desc: "Talk to the seller inside HomeSure. Arrange a viewing, ask about the place, and keep the whole conversation in one thread.",
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
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  {
    title: "Local Focus",
    desc: "Find properties by barangay within Sta. Maria, Bulacan with easy filtering options.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    title: "Direct Messaging",
    desc: "Connect directly with verified sellers through our secure in-platform messaging system.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
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
  const t = localStorage.getItem('hs-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

// ── SVG Helpers ───────────────────────────────────────────────────────────────

const pinIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b8fa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const checkIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const chevronLeft = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const chevronRight = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const searchIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const shieldIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const starIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const lockIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const LOGO_SRC = "assets/img/HomeSure_Logo.svg";

// ── React Components ──────────────────────────────────────────────────────────

const { useState, useEffect, useRef } = React;

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

// Same caching pattern as useBarangayCounts, for the "Browse by Type" cards. Keyed by
// property_type ('house' | 'apartment' | 'condo' | 'commercial' | 'lot').
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
  window.location.href = 'browse.html?barangay=' + encodeURIComponent(name);
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

function HeroMap() {
  const counts = useBarangayCounts();
  const mapWrapRef = useRef(null);
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgContent, setSvgContent] = useState('');

  // Fetch the map artwork.
  //
  // responsive.css hides the map below 768px, but display:none does not stop a fetch — phones were
  // downloading 140KB of SVG and parsing 47 paths to show none of it. The media query is the same
  // one the stylesheet uses, so the two cannot drift apart silently: if one changes, the map either
  // appears with no artwork or loads artwork it never draws, which is visible immediately.
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let cancelled = false;
    fetch('assets/img/Sta. Maria Map.svg')
      .then((res) => res.text())
      .then((svg) => { if (!cancelled) setSvgContent(svg); })
      .catch((err) => console.error('Could not load the map:', err));
    return () => { cancelled = true; };
  }, []);

  // Property markers.
  //
  // The positions are measured against this SVG, so only these six barangays can carry a pin —
  // the artwork has no per-barangay ids to place the rest against. The barangay list under the map
  // covers all 24, so nothing is hidden by that.
  //
  // The counts used to be written in by hand (Pulong Buhangin claimed 20). They come from the
  // database now, and a barangay with nothing in it gets no pin rather than an invented one.
  useEffect(() => {
    if (!containerRef.current || !svgContent || !counts) return;

    const positions = [
      { x: 35, y: 68, barangay: 'Poblacion' },
      { x: 40, y: 58, barangay: 'Guyong' },
      { x: 25, y: 73, barangay: 'Bagbaguin' },
      { x: 45, y: 78, barangay: 'Tumana' },
      { x: 63, y: 58, barangay: 'Catmon' },
      { x: 63, y: 28, barangay: 'Pulong Buhangin' },
    ];

    const pins = [];
    positions
      .filter((p) => (counts[p.barangay] || 0) > 0)
      .forEach((p, i) => {
        const n = counts[p.barangay];
        const pin = document.createElement('div');
        pin.className = 'property-marker';
        pin.style.left = `${p.x}%`;
        pin.style.top = `${p.y}%`;
        pin.style.animationDelay = `${i * 0.3}s`;
        pin.setAttribute('role', 'link');
        pin.setAttribute('tabindex', '0');
        pin.setAttribute('aria-label',
          `${n} ${n === 1 ? 'property' : 'properties'} in ${p.barangay} — browse them`);
        pin.innerHTML = `
          <div class="marker-pulse"></div>
          <div class="marker-icon">
            <img src="assets/img/House Icon.svg" alt="" />
          </div>
          <div class="marker-tooltip">${n} ${n === 1 ? 'property' : 'properties'} in ${p.barangay}</div>
        `;

        // The map itself is drag-to-pan, so a pin must not open browse at the end of a drag.
        const open = (e) => { e.stopPropagation(); browseBarangay(p.barangay); };
        pin.addEventListener('click', open);
        pin.addEventListener('mousedown', (e) => e.stopPropagation());
        pin.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
        });

        containerRef.current.appendChild(pin);
        pins.push(pin);
      });

    // The SVG is injected with dangerouslySetInnerHTML, so React does not own these nodes and
    // will not clear them. Without this, a re-run leaves the old pins behind.
    return () => pins.forEach((p) => p.remove());
  }, [svgContent, counts]);

  useEffect(() => {
    if (!mapWrapRef.current) return;

    const wrap = mapWrapRef.current;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.5, transform.scale + delta), 3);
      setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e) => {
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

  return React.createElement(
    'div', {
      className: 'hero-map-wrap',
      ref: mapWrapRef,
      style: { cursor: isDragging ? 'grabbing' : isRotating ? 'crosshair' : 'grab' }
    },
    React.createElement('div', {
      ref: containerRef,
      className: 'hero-map-container',
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
function Navbar() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hs-theme', next);
    setTheme(next);
  }

  return React.createElement(
    "nav",
    null,
    React.createElement(
      "a",
      { className: "nav-logo", href: "#" },
      React.createElement("span", { className: "nav-catstone-wrap" },
        React.createElement("img", { src: "assets/img/CatsTone Logo.svg", alt: "CatsTone", className: "nav-catstone-img" }),
      ),
      React.createElement("span", { className: "nav-logo-divider" }),
      React.createElement("img", { src: LOGO_SRC, alt: "HomeSure", height: 30, style: { display: "block" } }),
      React.createElement("span", { style: { display: "inline-block" } }, "HomeSure"),
    ),
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
      React.createElement(
        "button",
        { className: "btn-solid", onClick: () => (window.location.href = "auth/signup.html") },
        "Sign Up",
      ),
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
      color: '#00c9a7',
      badge: 'VERIFIED'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
      title: 'Secure In-Chat Payments',
      desc: 'Agree on price and send payment requests within the chat',
      color: '#3b82f6',
      badge: 'SECURE'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
      title: 'Anti-Fraud Protection',
      desc: 'Government ID verification for all sellers',
      color: '#f59e0b',
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

function Hero() {

  return React.createElement(
    "section",
    { className: "hero" },

    // ── Particle background ──
    React.createElement("div", { className: "hero-particles" }),

    // ── Content ──
    React.createElement(
      "div",
      { className: "hero-left" },
      React.createElement(
        "div",
        { className: "hero-badge" },
        React.createElement("span", { className: "hero-badge-dot" }),
        "Sta. Maria, Bulacan — Property Platform",
      ),
      React.createElement(
        "h1",
        { className: "hero-title" },
        "Buy. Sell. Rent.",
        React.createElement("br"),
        "All in one place.",
        React.createElement("br"),
        React.createElement(
          "span", { className: "hero-title-accent" },
          React.createElement(TypingText),
        ),
      ),
      React.createElement(
        "p",
        { className: "hero-desc" },
        "HomeSure connects buyers with verified property owners across Sta. Maria, Bulacan. No hidden listings. No unverified sellers.",
      ),
      React.createElement(
        "div",
        { className: "hero-ctas" },
        // Desktop: Browse Listings & List Property
        React.createElement(
          "button",
          { className: "hero-btn-primary hero-btn-browse", onClick: () => (window.location.href = "browse.html") },
          React.createElement("span", { dangerouslySetInnerHTML: { __html: searchIcon } }),
          React.createElement("span", null, "Browse Listings"),
        ),
        React.createElement(
          "button",
          { className: "hero-btn-secondary hero-btn-list", onClick: () => (window.location.href = "auth/signup.html") },
          React.createElement("span", null, "List Your Property"),
          React.createElement("span", { dangerouslySetInnerHTML: { __html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>` } }),
        ),
        // Mobile: Sign In & Sign Up
        React.createElement(
          "button",
          { className: "hero-btn-mobile-signin", onClick: () => (window.location.href = "auth/signin.html") },
          "Sign In",
        ),
        React.createElement(
          "button",
          { className: "hero-btn-mobile-signup", onClick: () => (window.location.href = "auth/signup.html") },
          "Sign Up",
        ),
      ),
      React.createElement(
        "div",
        { className: "hero-trust" },
        React.createElement("span", { className: "hero-trust-item" },
          React.createElement("span", { className: "hero-trust-icon", dangerouslySetInnerHTML: { __html: shieldIcon } }),
          React.createElement("span", null, "Verified Listings"),
        ),
        React.createElement("span", { className: "hero-trust-item" },
          React.createElement("span", { className: "hero-trust-icon", dangerouslySetInnerHTML: { __html: lockIcon } }),
          React.createElement("span", null, "Secure Messaging"),
        ),
      ),
    ),

    // ── Map on right side ──
    React.createElement(
      "div",
      { className: "hero-right" },
      React.createElement(HeroMap),
    ),

  );
}

// Categories
function Categories() {
  const [ref, visible] = useReveal();
  const typeCounts = useTypeCounts();
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
        const n = typeCounts && c.types.reduce((sum, t) => sum + (typeCounts[t] || 0), 0);
        const countLabel = typeCounts == null ? ' ' : n === 1 ? '1 listing' : `${n} listings`;
        return React.createElement(
          "div",
          { key: i, className: "cat-card" },
          React.createElement(
            "div",
            { className: "cat-icon", style: { background: c.bg } },
            React.createElement("span", {
              style: { color: c.color },
              dangerouslySetInnerHTML: { __html: c.icon },
            }),
          ),
          React.createElement("div", { className: "cat-name" }, c.name),
          React.createElement("div", { className: "cat-count" }, countLabel),
        );
      }),
    ),
  );
}

// Spotlight Carousel
function Carousel() {
  const [ref, visible] = useReveal();
  const listings = useFeaturedListings();
  const len = listings ? listings.length : 0;
  const [idx, setIdx] = useState(0);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    if (!len) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % len), 3500);
    return () => clearInterval(t);
  }, [autoKey, len]);

  const go = (next) => {
    setIdx((next + len) % len);
    setAutoKey((k) => k + 1);
  };

  // Still loading, or genuinely nothing approved yet — either way there is nothing to spin through.
  // listings === null means "not back yet"; [] means "asked, got zero" — both skip the carousel
  // rather than divide by a length of 0, which the index math above would do with NaN.
  if (!listings || !listings.length) {
    return React.createElement(
      "section",
      { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
      React.createElement("span", { className: "section-label" }, "Featured Properties"),
      React.createElement("h2", { className: "section-title" }, "Curated Listings Near You"),
      React.createElement(
        "p",
        { className: "section-sub" },
        listings === null
          ? "Loading listings…"
          : "No approved listings yet — check back soon, or be the first to list.",
      ),
    );
  }

  const leftProp = listings[(idx - 1 + len) % len];
  const centerProp = listings[idx];
  const rightProp = listings[(idx + 1) % len];

  const SideCard = (prop) =>
    React.createElement(
      "div",
      { className: "crd-side" },
      React.createElement("img", {
        className: "crd-img",
        src: prop.image,
        alt: prop.title,
      }),
      React.createElement(
        "div",
        { className: "crd-body-side" },
        React.createElement(
          "div",
          { className: "card-title-side" },
          prop.title,
        ),
        React.createElement("div", {
          className: "card-loc",
          dangerouslySetInnerHTML: {
            __html: pinIcon + `<span>${prop.location}</span>`,
          },
        }),
        React.createElement(
          "div",
          { className: "card-price-side" },
          prop.price,
        ),
      ),
    );

  return React.createElement(
    "section",
    { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "span",
      { className: "section-label" },
      "Featured Properties",
    ),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Curated Listings Near You",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Hand-picked from verified sellers in Sta. Maria, Bulacan",
    ),
    React.createElement(
      "div",
      { className: "crs-stage" },
      React.createElement(
        "div",
        { className: "crs-row" },
        React.createElement("button", {
          className: "crs-btn",
          onClick: () => go(idx - 1),
          dangerouslySetInnerHTML: { __html: chevronLeft },
        }),
        React.createElement(
          "div",
          { className: "crs-clip" },
          React.createElement(
            "div",
            {
              className: "crd-side-wrap crd-side-left",
              onClick: () => go(idx - 1),
            },
            SideCard(leftProp),
          ),
          React.createElement(
            "div",
            { className: "crd-center" },
            React.createElement(
              "div",
              { style: { position: "relative" } },
              React.createElement("img", {
                className: "crd-img-center",
                src: centerProp.image,
                alt: centerProp.title,
              }),
              centerProp.verified &&
                React.createElement("div", {
                  className: "verified-badge",
                  dangerouslySetInnerHTML: { __html: checkIcon + " Verified" },
                }),
            ),
            React.createElement(
              "div",
              { className: "crd-body-center" },
              React.createElement(
                "div",
                { className: "card-title" },
                centerProp.title,
              ),
              React.createElement("div", {
                className: "card-loc",
                dangerouslySetInnerHTML: {
                  __html: pinIcon + `<span>${centerProp.location}</span>`,
                },
              }),
              React.createElement(
                "div",
                { className: "card-footer-row" },
                React.createElement(
                  "div",
                  { className: "card-price" },
                  centerProp.price,
                  React.createElement("span", null, centerProp.period),
                ),
                React.createElement(
                  "span",
                  {
                    className: "card-link",
                    onClick: () => (window.location.href = "auth/signin.html"),
                  },
                  "View Details",
                ),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              className: "crd-side-wrap crd-side-right",
              onClick: () => go(idx + 1),
            },
            SideCard(rightProp),
          ),
        ),
        React.createElement("button", {
          className: "crs-btn",
          onClick: () => go(idx + 1),
          dangerouslySetInnerHTML: { __html: chevronRight },
        }),
      ),
    ),
    React.createElement(
      "div",
      { className: "dots" },
      listings.map((_, i) =>
        React.createElement("button", {
          key: i,
          className: "dot" + (i === idx ? " active" : ""),
          onClick: () => go(i),
        }),
      ),
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
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
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
            React.createElement('stop', { offset: '0', stopColor: 'rgba(0,201,167,0)' }),
            React.createElement('stop', { offset: '0.09', stopColor: 'rgba(0,201,167,0.34)' }),
            React.createElement('stop', { offset: '0.91', stopColor: 'rgba(0,201,167,0.34)' }),
            React.createElement('stop', { offset: '1', stopColor: 'rgba(0,201,167,0)' }),
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

const h = React.createElement;

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
        h('div', { className: 'tl-verified-sub' }, 'Checked by a HomeSure admin'),
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
        "Why HomeSure",
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
        "Where HomeSure Stands Today",
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
        "Join thousands of verified users discovering trusted properties in Sta. Maria, Bulacan",
      ),
      React.createElement(
        "div",
        { className: "cta-btns" },
        React.createElement(
          "button",
          {
            className: "cta-btn-white",
            onClick: () => (window.location.href = "auth/signup.html"),
          },
          "Sign Up as Buyer",
        ),
        React.createElement(
          "button",
          {
            className: "cta-btn-ghost",
            onClick: () => (window.location.href = "auth/signup.html"),
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
  const supportLinks = ["Help & Support", "Contact Us", "Report a Listing"];
  const legalLinks = ["Privacy Policy", "Terms of Service"];

  // Most of these were "#" — dead links that went nowhere. Browse and About are genuinely public
  // pages, so they go straight there; Help & Support already pointed at the public FAQ page
  // correctly. List Your Property, Contact Us and Report a Listing have no public page to land
  // on yet (reporting needs to know who is reporting; listing needs an account either way), so
  // those go to sign in instead of doing nothing.
  const footerHref = {
    "Browse Listings": "browse.html",
    "List Your Property": "auth/signup.html",
    "About Us": "about.html",
    "Help & Support": "faqs.html",
    "Contact Us": "auth/signin.html",
    "Report a Listing": "auth/signin.html",
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
          React.createElement("img", {
            src: LOGO_SRC,
            alt: "HomeSure",
            height: 28,
            style: { display: "block" },
          }),
          "HomeSure",
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
      "© 2026 HomeSure. All rights reserved.",
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
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Navbar),
    React.createElement(Hero),
    React.createElement(FeatureHighlights),
    React.createElement(TrustBanner),
    React.createElement(PlatformFeatures),
    React.createElement(HowItWorks),
    React.createElement(HowWeVerify),
    React.createElement(Features),
    React.createElement(Stats),
    React.createElement(CTA),
    React.createElement(Footer),
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
