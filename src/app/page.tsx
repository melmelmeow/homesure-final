"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ── Fallback Featured Properties Data ──────────────────────────────────────
const fallbackProperties = [
  {
    id: "1",
    title: "House for Sale",
    location: "Pulong Buhangin, Sta. Maria, Bulacan",
    price: "₱10,000",
    period: "/month",
    verified: true,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  },
  {
    id: "2",
    title: "Cozy Studio Apartment",
    location: "Poblacion, Sta. Maria, Bulacan",
    price: "₱8,000",
    period: "/month",
    verified: true,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  },
  {
    id: "3",
    title: "Modern 2BR Apartment",
    location: "Poblacion, Sta. Maria, Bulacan",
    price: "₱12,000",
    period: "/month",
    verified: true,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  },
  {
    id: "4",
    title: "Spacious Family Home",
    location: "Bagbaguin, Sta. Maria, Bulacan",
    price: "₱15,000",
    period: "/month",
    verified: true,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    id: "5",
    title: "Studio Loft Unit",
    location: "Pulong Buhangin, Sta. Maria",
    price: "₱6,500",
    period: "/month",
    verified: false,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  },
  {
    id: "6",
    title: "Townhouse for Rent",
    location: "Tumana, Sta. Maria, Bulacan",
    price: "₱10,500",
    period: "/month",
    verified: true,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  },
];

const categories = [
  {
    name: "Houses",
    count: "342 listings",
    color: "var(--primary)",
    bg: "rgba(26,158,143,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: "Apartments",
    count: "218 listings",
    color: "var(--info)",
    bg: "rgba(108,99,255,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="8" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="16" y2="21" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="2" y1="15" x2="22" y2="15" />
      </svg>
    ),
  },
  {
    name: "Townhouses",
    count: "97 listings",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M1 22h22" />
        <path d="M5 22V7l7-5 7 5v15" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
];

const steps = [
  {
    num: "01",
    label: "Account",
    title: "Create an Account",
    desc: "Sign up as a buyer or seller. Verify your identity so the person on the other side knows who they are dealing with.",
    screen: "verification" as const,
  },
  {
    num: "02",
    label: "Discover",
    title: "Browse or List",
    desc: "Search by barangay, budget and property type across Sta. Maria — or post your own listing and let buyers come to you.",
    screen: "listing" as const,
  },
  {
    num: "03",
    label: "Connect",
    title: "Message the Owner",
    desc: "Talk to the seller inside Kasafide. Arrange a viewing, ask about the place, and keep the whole conversation in one thread.",
    screen: "messages" as const,
  },
  {
    num: "04",
    label: "Payment",
    title: "Pay and Move In",
    desc: "Pay through the platform or upload proof of a direct payment. The seller confirms it, and both of you keep a record.",
    screen: "payment" as const,
  },
];

const whyFeatures = [
  {
    title: "Verified Sellers",
    desc: "All property owners undergo identity verification with government ID and selfie before publishing listings.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Local Focus",
    desc: "Find properties by barangay within Sta. Maria, Bulacan with easy filtering options.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "Direct Messaging",
    desc: "Connect directly with verified sellers through our secure in-platform messaging system.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const verifySteps = [
  {
    tag: "Step 1",
    title: "The email has to be real",
    desc: "Signing up does not get you in. We send a one-time link to the address given, and the account stays closed until it is opened. An address nobody can receive mail at never becomes an account.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 6 10-6" />
      </svg>
    ),
  },
  {
    tag: "Step 2",
    title: "A government ID and a live selfie",
    desc: "Sellers submit a valid ID and take a selfie through the camera, in the app — not a photo chosen from a gallery. An administrator compares the two before the account is marked verified.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="9" cy="12" r="2.6" />
        <path d="M14.5 10h4M14.5 14h3" />
      </svg>
    ),
  },
  {
    tag: "Step 3",
    title: "Proof the property is theirs",
    desc: "Every listing carries photographs of its Deed of Sale or Transfer Certificate of Title, or a tax declaration. One per property — a verified seller still cannot post a house they cannot document.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    tag: "Step 4",
    title: "Nothing is public until it is reviewed",
    desc: "A new listing is not hidden behind a label — it is not on the site at all. It appears in browse only after an administrator approves it, and it comes straight back down if a seller’s verification lapses.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

// Helper hook for scroll reveals
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}

// Typing Text Component
const typingPhrases = [
  "Find your home.",
  "Find verified properties.",
  "Find your perfect place.",
  "Find trusted listings.",
  "Find your next home.",
];

function TypingText() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = typingPhrases[phraseIdx];
    let timer: NodeJS.Timeout;

    if (!deleting) {
      if (displayed.length < current.length) {
        timer = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          68 + Math.random() * 38
        );
      } else {
        timer = setTimeout(() => setDeleting(true), 1900);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(
          () => setDisplayed((d) => d.slice(0, -1)),
          28 + Math.random() * 18
        );
      } else {
        timer = setTimeout(() => {
          setPhraseIdx((i) => (i + 1) % typingPhrases.length);
          setDeleting(false);
        }, 280);
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, deleting, phraseIdx]);

  return (
    <>
      {displayed}
      <span className="typing-cursor" />
    </>
  );
}

// ── Interactive Map Component with Client-Side Fetch ───────────────────────
function HeroMap() {
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgContent, setSvgContent] = useState("");
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  // Client fetch barangay listing counts
  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      try {
        const supabase = createClient();
        const { data: rows, error } = await supabase
          .from("properties")
          .select("lifecycle_status, barangays(name)")
          .eq("status", "approved")
          .limit(1000);

        if (error) throw error;

        const map: Record<string, number> = {};
        for (const r of (rows as any[]) || []) {
          if (r.lifecycle_status === "sold" || r.lifecycle_status === "rented") continue;
          const name = r.barangays && r.barangays.name;
          if (!name) continue;
          map[name] = (map[name] || 0) + 1;
        }
        if (!cancelled) setCounts(map);
      } catch (err) {
        console.error("Could not load the listing count per barangay:", err);
      }
    }
    loadCounts();
    return () => { cancelled = true; };
  }, []);

  // Fetch SVG map artwork
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return;

    let cancelled = false;
    fetch("/assets/img/Sta. Maria Map.svg")
      .then((res) => res.text())
      .then((svg) => { if (!cancelled) setSvgContent(svg); })
      .catch((err) => console.error("Map SVG load error:", err));

    return () => { cancelled = true; };
  }, []);

  // Property markers placement based on live counts
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const existingMarkers = containerRef.current.querySelectorAll(".property-marker");
    existingMarkers.forEach((m) => m.remove());

    const positions = [
      { x: 35, y: 68, barangay: "Poblacion" },
      { x: 40, y: 58, barangay: "Guyong" },
      { x: 25, y: 73, barangay: "Bagbaguin" },
      { x: 45, y: 78, barangay: "Tumana" },
      { x: 63, y: 58, barangay: "Catmon" },
      { x: 63, y: 28, barangay: "Pulong Buhangin" },
    ];

    const pins: HTMLElement[] = [];
    positions.forEach((p, i) => {
      const n = counts ? (counts[p.barangay] || 0) : 0;
      // Only place pin if counts are loaded and > 0, or fallback if counts is still loading
      if (counts && n === 0) return;

      const pin = document.createElement("div");
      pin.className = "property-marker";
      pin.style.left = `${p.x}%`;
      pin.style.top = `${p.y}%`;
      pin.style.animationDelay = `${i * 0.3}s`;
      pin.setAttribute("role", "link");
      pin.setAttribute("tabindex", "0");
      pin.innerHTML = `
        <div class="marker-pulse"></div>
        <div class="marker-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/></svg>
        </div>
        <div class="marker-tooltip">${n || "View"} ${n === 1 ? "property" : "properties"} in ${p.barangay}</div>
      `;

      const open = (e: Event) => {
        e.stopPropagation();
        window.location.href = `/browse.html?barangay=${encodeURIComponent(p.barangay)}`;
      };
      pin.addEventListener("click", open);
      pin.addEventListener("mousedown", (e) => e.stopPropagation());

      containerRef.current?.appendChild(pin);
      pins.push(pin);
    });

    return () => pins.forEach((p) => p.remove());
  }, [svgContent, counts]);

  useEffect(() => {
    if (!mapWrapRef.current) return;
    const wrap = mapWrapRef.current;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.5, transform.scale + delta), 3);
      setTransform((prev) => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.shiftKey) {
        setIsRotating(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isRotating) {
        const deltaX = e.clientX - dragStart.x;
        setTransform((prev) => ({
          ...prev,
          rotate: prev.rotate + deltaX * 0.5,
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    wrap.addEventListener("wheel", handleWheel, { passive: false });
    wrap.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      wrap.removeEventListener("wheel", handleWheel);
      wrap.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [transform, isDragging, isRotating, dragStart]);

  return (
    <div
      className="hero-map-wrap"
      ref={mapWrapRef}
      style={{ cursor: isDragging ? "grabbing" : isRotating ? "crosshair" : "grab" }}
    >
      <div
        ref={containerRef}
        className="hero-map-container"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
          transformOrigin: "center center",
          transition: isDragging || isRotating ? "none" : "transform 0.1s ease-out",
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

// ── Navbar Component ────────────────────────────────────────────────────────
function Navbar() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("hs-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("hs-theme", next);
    setTheme(next);
  };

  return (
    <nav>
      <Link className="nav-logo" href="/">
        <span className="nav-catstone-wrap">
          <Image src="/assets/img/CatsTone Logo.svg" alt="CatsTone" width={28} height={28} className="nav-catstone-img" priority />
        </span>
        <span className="nav-logo-divider" />
        <Image src="/assets/img/kasafide-logo.svg" alt="Kasafide logo" width={30} height={30} className="img-logo" style={{ display: "block" }} priority />
        <span>Kasafide</span>
      </Link>
      <div className="nav-btns">
        <button
          className="nav-theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <Link href="/auth/signin.html" className="btn-outline">
          Sign In
        </Link>
        <Link href="/auth/signup.html" className="btn-solid">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

// ── Hero Section Component ──────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero">
      <div className="hero-particles" />
      <div className="hero-left">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Sta. Maria, Bulacan — Property Platform
        </div>
        <h1 className="hero-title">
          Buy. Sell. Rent.<br />
          All in one place.<br />
          <span className="hero-title-accent">
            <TypingText />
          </span>
        </h1>
        <p className="hero-desc">
          Kasafide connects buyers with verified property owners across Sta. Maria, Bulacan. No hidden listings. No unverified sellers.
        </p>
        <div className="hero-ctas">
          <Link href="/browse.html" className="hero-btn-primary hero-btn-browse" style={{ textDecoration: 'none' }}>
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <span>Browse Listings</span>
          </Link>
          <Link href="/auth/signup.html" className="hero-btn-secondary hero-btn-list" style={{ textDecoration: 'none' }}>
            <span>List Your Property</span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </Link>
          <Link href="/auth/signin.html" className="hero-btn-mobile-signin">
            Sign In
          </Link>
          <Link href="/auth/signup.html" className="hero-btn-mobile-signup">
            Sign Up
          </Link>
        </div>
        <div className="hero-trust">
          <span className="hero-trust-item">
            <span className="hero-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>Verified Listings</span>
          </span>
          <span className="hero-trust-item">
            <span className="hero-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span>Secure Messaging</span>
          </span>
        </div>
      </div>
      <div className="hero-right">
        <HeroMap />
      </div>
    </section>
  );
}

// ── Feature Highlights Section with Tilt ───────────────────────────────────
const TILT_DEGREES = 9;

function useCardTilt(gridRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    grid.classList.add("tilt-on");

    let frame = 0;
    let pending: { card: HTMLElement; px: number; py: number; w: number; h: number } | null = null;
    let current: HTMLElement | null = null;

    function clear(card: HTMLElement | null) {
      if (!card) return;
      card.classList.remove("is-tilting");
      for (const prop of ["--rx", "--ry", "--gx", "--gy"]) card.style.removeProperty(prop);
    }

    function apply() {
      frame = 0;
      if (!pending) return;
      const { card, px, py, w, h } = pending;
      card.style.setProperty("--rx", `${(0.5 - py / h) * TILT_DEGREES}deg`);
      card.style.setProperty("--ry", `${(px / w - 0.5) * TILT_DEGREES}deg`);
      card.style.setProperty("--gx", `${px}px`);
      card.style.setProperty("--gy", `${py}px`);
    }

    function onMove(e: PointerEvent) {
      const card = (e.target as HTMLElement)?.closest?.(".feature-card") as HTMLElement | null;
      if (!card) {
        if (current) {
          clear(current);
          current = null;
        }
        return;
      }

      if (current && current !== card) clear(current);
      if (current !== card) {
        card.classList.add("is-tilting");
        current = card;
      }

      const r = card.getBoundingClientRect();
      pending = { card, px: e.clientX - r.left, py: e.clientY - r.top, w: r.width, h: r.height };
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function onLeave() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      pending = null;
      clear(current);
      current = null;
    }

    grid.addEventListener("pointermove", onMove as any);
    grid.addEventListener("pointerleave", onLeave);

    return () => {
      grid.removeEventListener("pointermove", onMove as any);
      grid.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      clear(current);
      grid.classList.remove("tilt-on");
    };
  }, [gridRef]);
}

function FeatureHighlights() {
  const gridRef = useRef<HTMLDivElement>(null);
  useCardTilt(gridRef);

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Admin-Verified Listings",
      desc: "Every listing reviewed before publishing",
      color: "var(--primary)",
      badge: "VERIFIED",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: "Secure In-Chat Payments",
      desc: "Agree on price and send payment requests within the chat",
      color: "var(--accent)",
      badge: "SECURE",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Anti-Fraud Protection",
      desc: "Government ID verification for all sellers",
      color: "var(--warning)",
      badge: "PROTECTED",
    },
  ];

  return (
    <section className="feature-highlights">
      <div className="feature-grid" ref={gridRef}>
        {features.map((feat, i) => (
          <div key={i} className="feature-card feature-3d" style={{ ["--feature-color" as string]: feat.color }}>
            <div className="feature-card-bg" aria-hidden="true">
              <span className="feature-card-glare" />
            </div>
            <div className="feature-card-icon">{feat.icon}</div>
            <div className="feature-card-badge">{feat.badge}</div>
            <h3 className="feature-card-title">{feat.title}</h3>
            <p className="feature-card-desc">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Trust Banner Component ─────────────────────────────────────────────────
function TrustBanner() {
  return (
    <section className="trust-banner">
      <div className="trust-content">
        <div className="trust-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="trust-text">
          Every listing is reviewed. Every seller is verified. <span className="trust-highlight">No exceptions.</span>
        </h3>
        <p className="trust-subtext">
          Your safety is our priority. All sellers undergo government ID verification before posting.
        </p>
      </div>
    </section>
  );
}

// ── Platform Features Section ──────────────────────────────────────────────
function PlatformFeatures() {
  const platformList = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: "In-Chat Payment Requests",
      desc: "Request and track payments directly in conversations",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Security Deposit Management",
      desc: "Automated deposit tracking and refund processing",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: "Damage Reporting System",
      desc: "Photo uploads and dispute resolution tools",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Barangay-Level Search",
      desc: "Find properties in all 24 barangays of Sta. Maria",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Verified Seller Badges",
      desc: "Government ID verification for all property owners",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "Real-Time Messaging",
      desc: "Instant chat with sellers, no phone numbers required",
    },
  ];

  return (
    <section className="platform-features">
      <h2 className="section-title">Platform Features</h2>
      <p className="section-subtitle">Everything you need for safe and secure property rentals</p>
      <div className="platform-grid">
        {platformList.map((feat, i) => (
          <div key={i} className="platform-item">
            <div className="platform-icon">{feat.icon}</div>
            <h3 className="platform-title">{feat.title}</h3>
            <p className="platform-desc">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Categories Component ───────────────────────────────────────────────────
function Categories() {
  const [ref, visible] = useReveal();
  return (
    <section className={`section reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <span className="section-label">Browse by Type</span>
      <h2 className="section-title">Find What You&apos;re Looking For</h2>
      <p className="section-sub">Filter by property type or listing category</p>
      <div className="categories-grid">
        {categories.map((c, i) => (
          <div key={i} className="cat-card">
            <div className="cat-icon" style={{ background: c.bg }}>
              <span style={{ color: c.color }}>{c.icon}</span>
            </div>
            <div className="cat-name">{c.name}</div>
            <div className="cat-count">{c.count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Carousel / Featured Properties Component ──────────────────────────────
function Carousel({ propertiesList }: { propertiesList: any[] }) {
  const [ref, visible] = useReveal();
  const list = propertiesList.length > 0 ? propertiesList : fallbackProperties;
  const len = list.length;
  const [idx, setIdx] = useState(0);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % len), 3500);
    return () => clearInterval(t);
  }, [autoKey, len]);

  const go = (next: number) => {
    setIdx((next + len) % len);
    setAutoKey((k) => k + 1);
  };

  const leftProp = list[(idx - 1 + len) % len];
  const centerProp = list[idx];
  const rightProp = list[(idx + 1) % len];

  const SideCard = (prop: any) => (
    <div className="crd-side">
      <Image className="crd-img" src={prop.image || prop.images?.[0] || fallbackProperties[0].image} alt={prop.title || "Property"} width={320} height={130} unoptimized />
      <div className="crd-body-side">
        <div className="card-title-side">{prop.title}</div>
        <div className="card-loc">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{prop.location || prop.address}</span>
        </div>
        <div className="card-price-side">
          {typeof prop.price === "number" ? `₱${prop.price.toLocaleString()}` : prop.price}
        </div>
      </div>
    </div>
  );

  return (
    <section className={`section-alt reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <span className="section-label">Featured Properties</span>
      <h2 className="section-title">Curated Listings Near You</h2>
      <p className="section-sub">Hand-picked from verified sellers in Sta. Maria, Bulacan</p>
      <div className="crs-stage">
        <div className="crs-row">
          <button className="crs-btn" onClick={() => go(idx - 1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="crs-clip">
            <div className="crd-side-wrap crd-side-left" onClick={() => go(idx - 1)}>
              {SideCard(leftProp)}
            </div>
            <div className="crd-center">
              <div style={{ position: "relative" }}>
                <Image
                  className="crd-img-center"
                  src={centerProp.image || centerProp.images?.[0] || fallbackProperties[0].image}
                  alt={centerProp.title || "Property"}
                  width={600}
                  height={200}
                  unoptimized
                  priority
                />
                {(centerProp.verified || centerProp.seller?.is_verified) && (
                  <div className="verified-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>{" "}
                    Verified
                  </div>
                )}
              </div>
              <div className="crd-body-center">
                <div className="card-title">{centerProp.title}</div>
                <div className="card-loc">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{centerProp.location || centerProp.address}</span>
                </div>
                <div className="card-footer-row">
                  <div className="card-price">
                    {typeof centerProp.price === "number" ? `₱${centerProp.price.toLocaleString()}` : centerProp.price}
                    <span>{centerProp.period || "/month"}</span>
                  </div>
                  <Link href="/browse.html" className="card-link">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
            <div className="crd-side-wrap crd-side-right" onClick={() => go(idx + 1)}>
              {SideCard(rightProp)}
            </div>
          </div>
          <button className="crs-btn" onClick={() => go(idx + 1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="dots">
        {list.map((_, i) => (
          <button key={i} className={`dot${i === idx ? " active" : ""}`} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}

// ── How It Works Section with Interactive Previews ─────────────────────────
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0;
  for (let node: HTMLElement | null = el; node && node !== root; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

function useCurvedSpine(containerRef: React.RefObject<HTMLDivElement | null>, pathRef: React.RefObject<SVGPathElement | null>) {
  useEffect(() => {
    const box = containerRef.current;
    const path = pathRef.current;
    if (!box || !path) return;

    const twoColumn = window.matchMedia("(min-width: 861px)");

    function draw() {
      if (!path || !box) return;
      const svg = path.parentNode as SVGSVGElement | null;
      if (!svg) return;
      if (!twoColumn.matches) {
        svg.style.display = "none";
        return;
      }
      svg.style.display = "";

      const rect = { width: box.offsetWidth, height: box.offsetHeight };
      const dotEls = Array.from(box.querySelectorAll<HTMLElement>(".tl-dot"));
      const dots = dotEls.map((dot) => {
        const at = offsetWithin(dot, box);
        return { x: at.x + dot.offsetWidth / 2, y: at.y + dot.offsetHeight / 2 };
      });
      if (dots.length < 2) return;

      svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

      const swoop = Math.min(78, rect.width * 0.085);
      const radius = Math.min(46, rect.width * 0.043);
      const halfChord = radius * 0.76;

      let d = `M ${dots[0].x} ${dots[0].y}`;

      for (let i = 1; i < dots.length; i++) {
        const a = dots[i - 1];
        const b = dots[i];
        const dy = b.y - a.y;
        const side = i % 2 ? 1 : -1;

        if (i % 2) {
          const loopSide = ((i - 1) / 2) % 2 ? -1 : 1;
          const mid = (a.y + b.y) / 2;
          const enter = mid - halfChord;
          const leave = mid + halfChord;

          d += ` C ${a.x + swoop * loopSide * 0.45} ${a.y + dy * 0.26}, ${a.x} ${enter - dy * 0.2}, ${a.x} ${enter}`;
          d += ` A ${radius} ${radius} 0 1 ${loopSide > 0 ? 1 : 0} ${a.x} ${leave}`;
          d += ` C ${b.x} ${leave + dy * 0.2}, ${b.x + swoop * loopSide * 0.45} ${b.y - dy * 0.26}, ${b.x} ${b.y}`;
        } else {
          const reach = dy * 0.42;
          d += ` C ${a.x + swoop * side} ${a.y + reach}, ${b.x + swoop * side} ${b.y - reach}, ${b.x} ${b.y}`;
        }
      }

      path.setAttribute("d", d);
    }

    draw();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(draw);
      observer.observe(box);
    } else {
      window.addEventListener("resize", draw);
    }
    twoColumn.addEventListener("change", draw);

    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", draw);
      twoColumn.removeEventListener("change", draw);
    };
  }, [containerRef, pathRef]);
}

function StepPreviewWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tl-window">
      <div className="tl-window-bar">
        <span className="tl-dot-r" />
        <span className="tl-dot-y" />
        <span className="tl-dot-g" />
        <span className="tl-window-title">{title}</span>
      </div>
      <div className="tl-window-body">{children}</div>
    </div>
  );
}

function StepPreview({ screen }: { screen: "verification" | "listing" | "messages" | "payment" }) {
  if (screen === "verification") {
    return (
      <StepPreviewWindow title="Verification">
        <div className="tl-docs">
          <div className="tl-doc">
            <div className="tl-doc-thumb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <circle cx="12" cy="12" r="10" /><polyline points="16 10 11 15 8 12" />
              </svg>
            </div>
            <div className="tl-doc-info">
              <div className="tl-doc-name">Valid ID</div>
              <div className="tl-doc-meta">Driver’s Licence · front and back</div>
            </div>
            <span className="tl-chip tl-chip-ok">Approved</span>
          </div>
          <div className="tl-doc">
            <div className="tl-doc-thumb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <circle cx="12" cy="12" r="10" /><polyline points="16 10 11 15 8 12" />
              </svg>
            </div>
            <div className="tl-doc-info">
              <div className="tl-doc-name">Selfie with ID</div>
              <div className="tl-doc-meta">Taken in app</div>
            </div>
            <span className="tl-chip tl-chip-ok">Approved</span>
          </div>
        </div>
        <div className="tl-verified">
          <span className="tl-verified-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <div>
            <div className="tl-verified-title">Verified Seller</div>
            <div className="tl-verified-sub">Checked by a Kasafide admin</div>
          </div>
        </div>
      </StepPreviewWindow>
    );
  }

  if (screen === "listing") {
    return (
      <StepPreviewWindow title="Browse">
        <div className="tl-filters">
          <span className="tl-filter">Poblacion</span>
          <span className="tl-filter">Up to ₱20,000</span>
          <span className="tl-filter">Apartment</span>
        </div>
        <div className="tl-listing">
          <div className="tl-listing-img">
            <span className="tl-listing-type">For Rent</span>
          </div>
          <div className="tl-listing-body">
            <div className="tl-listing-title">2BR Apartment</div>
            <div className="tl-listing-addr">Poblacion, Sta. Maria</div>
            <div className="tl-listing-price">₱15,000 <span>/month</span></div>
            <div className="tl-listing-specs">
              <span><i>🛏</i> 2</span>
              <span><i>🚿</i> 1</span>
              <span><i>📐</i> 48 sqm</span>
            </div>
          </div>
        </div>
      </StepPreviewWindow>
    );
  }

  if (screen === "messages") {
    return (
      <StepPreviewWindow title="Messages">
        <div className="tl-msg tl-msg-them">
          <div className="tl-msg-bubble">Hi! Is the unit still available?</div>
          <div className="tl-msg-time">9:15 AM</div>
        </div>
        <div className="tl-msg tl-msg-me">
          <div className="tl-msg-bubble">Yes it is. Free this Saturday?</div>
          <div className="tl-msg-time">9:18 AM</div>
        </div>
        <div className="tl-msg tl-msg-them">
          <div className="tl-msg-bubble tl-msg-viewing">
            <div className="tl-viewing-tag">Viewing Request</div>
            <div className="tl-viewing-when">Sat, 14 June · 10:00 AM</div>
            <div className="tl-viewing-state">Accepted</div>
          </div>
          <div className="tl-msg-time">9:22 AM</div>
        </div>
      </StepPreviewWindow>
    );
  }

  return (
    <StepPreviewWindow title="Payments">
      <div className="tl-pay">
        <div className="tl-pay-left">
          <div className="tl-pay-property">2BR Apartment — Poblacion</div>
          <div className="tl-pay-meta">
            <div className="tl-pay-item"><span className="tl-pay-label">Type</span><span className="tl-pay-value">Rent</span></div>
            <div className="tl-pay-item"><span className="tl-pay-label">Period</span><span className="tl-pay-value">June 2026</span></div>
            <div className="tl-pay-item"><span className="tl-pay-label">Method</span><span className="tl-pay-value">GCash</span></div>
            <div className="tl-pay-item"><span className="tl-pay-label">Reference</span><span className="tl-pay-value">GC-78452</span></div>
          </div>
        </div>
        <div className="tl-pay-right">
          <div className="tl-pay-amount">₱15,000</div>
          <span className="tl-chip tl-chip-ok">Confirmed</span>
        </div>
      </div>
    </StepPreviewWindow>
  );
}

function HowItWorks() {
  const [ref, visible] = useReveal();
  const stepsRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  useCurvedSpine(stepsRef, pathRef);

  return (
    <section className={`section reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <span className="section-label">How It Works</span>
      <h2 className="section-title">Simple Steps to Your Next Home</h2>
      <p className="section-sub">Get started in minutes — no complicated process</p>
      <div className="how-steps" ref={stepsRef}>
        <svg className="tl-spine" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="tl-spine-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "rgb(var(--primary-rgb) / 0)" }} />
              <stop offset="0.09" style={{ stopColor: "rgb(var(--primary-rgb) / 0.34)" }} />
              <stop offset="0.91" style={{ stopColor: "rgb(var(--primary-rgb) / 0.34)" }} />
              <stop offset="1" style={{ stopColor: "rgb(var(--primary-rgb) / 0)" }} />
            </linearGradient>
          </defs>
          <path className="tl-spine-path" ref={pathRef} fill="none" />
        </svg>
        {steps.map((s, i) => (
          <div key={i} className={`how-step tl-step${i % 2 ? " tl-flip" : ""}`}>
            <div className="tl-preview">
              <StepPreview screen={s.screen} />
            </div>
            <div className="tl-dot" aria-hidden="true" />
            <div className="tl-text">
              <div className="tl-head">
                <span className="tl-num">{s.num}</span>
                <span className="tl-label">{s.label}</span>
              </div>
              <h3 className="tl-title">{s.title}</h3>
              <p className="tl-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How We Verify Component ────────────────────────────────────────────────
function HowWeVerify() {
  const [ref, visible] = useReveal();

  return (
    <section className={`section reveal-section verify-section${visible ? " in-view" : ""}`} ref={ref} id="how-we-verify">
      <span className="section-label">How We Verify</span>
      <h2 className="section-title">Four Things Nobody Gets Past</h2>
      <p className="section-sub">
        Not a promise about how careful we are — four checks the platform refuses to skip
      </p>
      <div className="verify-grid">
        {verifySteps.map((s, i) => (
          <div key={i} className="verify-card">
            <div className="verify-card-top">
              <span className="verify-icon">{s.icon}</span>
              <span className="verify-tag">{s.tag}</span>
            </div>
            <h3 className="verify-title">{s.title}</h3>
            <p className="verify-desc">{s.desc}</p>
          </div>
        ))}
      </div>
      <p className="verify-note">
        Verification does not expire quietly. When a seller’s documents lapse they are moved back to re-verification, and their listings leave the site until the new ones are approved.
      </p>
    </section>
  );
}

// ── Why Kasafide Component ─────────────────────────────────────────────────
function WhyKasafide() {
  const [ref, visible] = useReveal();
  return (
    <section className={`section-alt reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <div className="features-inner">
        <span className="section-label">Why Kasafide</span>
        <h2 className="section-title">Built for Trust & Transparency</h2>
        <p className="section-sub">A platform designed with security and convenience at its core</p>
        <div className="features-card-wrap">
          {whyFeatures.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Live Stats Component with Client-Side Fetch ────────────────────────────
function StatBox({ stat }: { stat: { end: number; suffix: string; label: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setActive(true);
      },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    if (stat.end <= 0) {
      setVal(stat.end);
      return;
    }
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(stat.end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= stat.end) {
        setVal(stat.end);
        clearInterval(timer);
      } else {
        setVal(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, stat.end]);

  return (
    <div className="stat-box" ref={ref}>
      <div className="stat-value">
        {val.toLocaleString()}
        {stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

function Stats() {
  const [ref, visible] = useReveal();
  const [liveStats, setLiveStats] = useState<{
    barangays: number;
    listings: number;
    verifiedSellers: number;
  } | null>(null);

  // Client fetch live counts from Supabase
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const supabase = createClient();
        const [listingsRes, sellersRes, barangaysRes] = await Promise.all([
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("public_profiles").select("*", { count: "exact", head: true }).eq("role", "seller").eq("account_status", "verified"),
          supabase.from("barangays").select("id", { count: "exact", head: true }),
        ]);

        if (!cancelled) {
          setLiveStats({
            listings: listingsRes.count || 0,
            verifiedSellers: sellersRes.count || 0,
            barangays: barangaysRes.count || 24,
          });
        }
      } catch (err) {
        console.error("Could not load public stats:", err);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const statsData = [
    { key: "barangays", end: liveStats ? liveStats.barangays : 24, suffix: "", label: "Barangays Covered" },
    { key: "listings", end: liveStats ? liveStats.listings : 0, suffix: "", label: "Listings Live" },
    { key: "verifiedSellers", end: liveStats ? liveStats.verifiedSellers : 0, suffix: "", label: "Verified Sellers" },
    { key: null, end: 0, suffix: "", label: "Unverified Listings" },
  ];

  return (
    <section className={`section reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <div className="stats-inner">
        <span className="section-label">Our Numbers</span>
        <h2 className="section-title">Where Kasafide Stands Today</h2>
        <p className="section-sub">Counted live from the platform, not rounded up for a landing page</p>
        <div className="stats-grid">
          {statsData.map((s, i) => (
            <StatBox key={i} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner Component ───────────────────────────────────────────────────
function CTA() {
  const [ref, visible] = useReveal();
  return (
    <div className={`cta-section reveal-section${visible ? " in-view" : ""}`} ref={ref}>
      <div className="cta-inner">
        <h2 className="cta-title">Ready to Find Your Next Home?</h2>
        <p className="cta-sub">
          Join thousands of verified users discovering trusted properties in Sta. Maria, Bulacan
        </p>
        <div className="cta-btns">
          <Link href="/auth/signup.html" className="cta-btn-white" style={{ textDecoration: 'none' }}>
            Sign Up as Buyer
          </Link>
          <Link href="/auth/signup.html" className="cta-btn-ghost" style={{ textDecoration: 'none' }}>
            List Your Property
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Footer Component ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            <Image src="/assets/img/kasafide-logo.svg" alt="Kasafide logo" width={28} height={28} style={{ display: "block" }} />
            Kasafide
          </div>
          <p className="footer-tagline">
            A verified housing platform for secure property rentals and purchases in Sta. Maria, Bulacan.
          </p>
        </div>
        <div>
          <div className="footer-col-title">Platform</div>
          <Link href="/browse.html" className="footer-link">
            Browse Listings
          </Link>
          <Link href="/auth/signup.html" className="footer-link">
            List Your Property
          </Link>
          <Link href="/about.html" className="footer-link">
            About Us
          </Link>
        </div>
        <div>
          <div className="footer-col-title">Support</div>
          <Link href="/faqs.html" className="footer-link">
            Help & Support
          </Link>
          <Link href="/help.html" className="footer-link">
            Contact Us
          </Link>
          <Link href="/help.html" className="footer-link">
            Report a Listing
          </Link>
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          <Link href="/privacy-policy.html" className="footer-link">
            Privacy Policy
          </Link>
          <Link href="/terms.html" className="footer-link">
            Terms of Service
          </Link>
        </div>
      </div>
      <div className="footer-divider" />
      <div className="footer-copy">© 2026 Kasafide. All rights reserved.</div>
    </footer>
  );
}

// ── Main Landing Page Component (Client Fetch) ─────────────────────────────
export default function HomePage() {
  const [propertiesList, setPropertiesList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("properties")
          .select("id, title, price, listing_type, address, images, status, lifecycle_status, barangays(name)")
          .eq("status", "approved")
          .limit(6);

        if (!error && data && data.length > 0) {
          const formatted = data
            .filter((p: any) => p.lifecycle_status !== "sold" && p.lifecycle_status !== "rented")
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              location: p.barangays?.name ? `${p.barangays.name}, Sta. Maria` : p.address,
              price: typeof p.price === "number" ? `₱${p.price.toLocaleString()}` : p.price,
              period: p.listing_type === "rent" ? "/month" : "",
              verified: true,
              image: (p.images && p.images[0]) || fallbackProperties[0].image,
            }));
          if (formatted.length > 0) {
            setPropertiesList(formatted);
          }
        }
      } catch (e) {
        console.error("Error fetching properties for landing page:", e);
      }
    }
    fetchProperties();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <Navbar />
      <Hero />
      <FeatureHighlights />
      <TrustBanner />
      <PlatformFeatures />
      <Categories />
      <Carousel propertiesList={propertiesList} />
      <HowItWorks />
      <HowWeVerify />
      <WhyKasafide />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}
