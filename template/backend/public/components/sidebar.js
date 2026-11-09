// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Sidebar Component
//  Usage:
//    <div id="hs-sidebar"></div>
//    <script src="../components/sidebar.js"></script>
//    <script>HomeSureSidebar.init({ activePage: 'dashboard' })</script>
// ─────────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  // ── SVG Icon Library ────────────────────────────────────────────────────────
  const IC = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  };

  // ── Nav configs per role ─────────────────────────────────────────────────────
  const NAV = {
    buyer: [
      { id: 'dashboard', label: 'Dashboard',      icon: 'grid'    },
      { id: 'saved',     label: 'Saved Listings', icon: 'heart'   },
      { id: 'messages',  label: 'Messages',       icon: 'message' },
      { id: 'payments',  label: 'Payments',       icon: 'wallet'  },
    ],
    seller: [
      { id: 'dashboard', label: 'Dashboard',   icon: 'grid'    },
      { id: 'listings',  label: 'My Listings', icon: 'home'    },
      { id: 'messages',  label: 'Messages',    icon: 'message' },
      { id: 'payments',  label: 'Payments',    icon: 'wallet'  },
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard',          icon: 'grid'    },
      { id: 'listings',  label: 'Listings Management', icon: 'home'    },
      { id: 'users',     label: 'Users',              icon: 'users'   },
      {
        id: 'operations',
        label: 'Operations',
        icon: 'briefcase',
        submenu: [
          { id: 'payments',  label: 'Payments',  icon: 'wallet' },
          { id: 'reports',   label: 'Reports',   icon: 'flag'   },
          { id: 'analytics', label: 'Analytics', icon: 'chart'  },
        ]
      },
    ],
    superadmin: [
      { id: 'dashboard',   label: 'Dashboard',        icon: 'grid'   },
      { id: 'admins',      label: 'Admin Management', icon: 'shield' },
      { id: 'audit-trail', label: 'Audit Trail',      icon: 'flag'   },
      { id: 'reports',     label: 'System Reports',   icon: 'chart'  },
    ],
  };

  // ── Injected CSS ─────────────────────────────────────────────────────────────
  const CSS = `
    @keyframes hs-slide-in {
      from { opacity: 0; transform: translateX(-14px); }
      to   { opacity: 1; transform: translateX(0);     }
    }
    @keyframes hs-fade-down {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes hs-pulse-dot {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    .hs-sidebar {
      width: 205px;
      min-width: 205px;
      background: #0F766E;
      border-right: 1px solid rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      padding: 22px 14px 18px;
      height: 100vh;
      position: sticky;
      top: 0;
      overflow: hidden;
      animation: hs-fade-down 0.4s ease;
    }

    /* ── Logo ── */
    .hs-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px;
      margin-bottom: 30px;
      animation: hs-fade-down 0.4s ease 0.05s both;
    }
    .hs-logo-img { height: 28px; width: auto; display: block; }
    .hs-logo-text {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* ── Nav ── */
    .hs-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .hs-nav-item {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 10px 13px;
      border-radius: 10px;
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 100%;
      text-align: left;
      position: relative;
      overflow: hidden;
      /* base transition for hover (slide-in anim sets its own on load) */
      transition: background 0.22s ease, color 0.22s ease, transform 0.18s ease;
    }

    .hs-nav-item svg {
      width: 16px; height: 16px;
      flex-shrink: 0;
      transition: transform 0.22s ease;
    }

    /* ripple pseudo-element */
    .hs-nav-item::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 10px;
      background: rgba(255,255,255,0.06);
      opacity: 0;
      transform: scaleX(0.8);
      transform-origin: left;
      transition: opacity 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1);
    }

    .hs-nav-item:hover::before { opacity: 1; transform: scaleX(1); }
    .hs-nav-item:hover { color: rgba(255,255,255,0.9); transform: translateX(2px); }
    .hs-nav-item:hover svg { transform: scale(1.1); }

    .hs-nav-item.active {
      background: rgba(0,201,167,0.13);
      color: #ffffff;
      font-weight: 700;
      border-left: 3px solid #00c9a7;
      padding-left: 10px;
    }
    .hs-nav-item.active::before { opacity: 0 !important; }
    .hs-nav-item.active svg { color: #00c9a7; }

    /* ── Section Header (non-clickable) ── */
    .hs-nav-header {
      cursor: default !important;
      opacity: 0.5;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      padding: 8px 13px !important;
    }
    .hs-nav-header:hover {
      background: transparent !important;
      transform: none !important;
    }
    .hs-nav-header::before {
      display: none !important;
    }

    /* ── Submenu Group ── */
    .hs-nav-group {
      margin-bottom: 4px;
    }

    /* ── Submenu Container ── */
    .hs-nav-submenu-container {
      max-height: 0;
      overflow: visible;
      transition: max-height 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    }
    .hs-nav-group.expanded .hs-nav-submenu-container {
      max-height: 500px !important;
      opacity: 1 !important;
      overflow: visible !important;
    }

    /* ── Submenu Items ── */
    .hs-nav-submenu {
      padding-left: 44px !important;
      font-size: 13px !important;
    }
    .hs-nav-submenu svg {
      width: 14px !important;
      height: 14px !important;
    }

    /* ── Bottom ── */
    .hs-bottom { padding-top: 6px; }

    .hs-divider {
      height: 1px;
      background: rgba(255,255,255,0.09);
      margin-bottom: 14px;
    }

    .hs-theme-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 13px 12px;
    }
    .hs-theme-label {
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* pill toggle */
    .hs-theme-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,0.4);
      border-radius: 30px;
      padding: 3px;
      cursor: pointer;
      position: relative;
      width: 68px;
      height: 32px;
      border: 1px solid rgba(255,255,255,0.12);
      transition: background 0.25s;
    }
    .hs-theme-pill:hover { background: rgba(0,0,0,0.55); border-color: rgba(255,255,255,0.2); }

    .hs-pill-opt {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px; height: 26px;
      flex-shrink: 0;
      z-index: 1;
      pointer-events: none;
      line-height: 1;
    }
    .hs-pill-opt svg {
      width: 13px; height: 13px;
      color: rgba(255,255,255,0.5);
      display: block;
      margin: auto;
    }

    .hs-pill-thumb {
      position: absolute;
      width: 28px; height: 26px;
      background: #ffffff;
      border-radius: 20px;
      transition: left 0.28s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      top: 50%;
      transform: translateY(-50%);
    }
    .hs-pill-thumb.dark-mode  { left: 37px; }
    .hs-pill-thumb.light-mode { left: 3px;  }

    /* when pill is in dark mode, moon icon gets white colour */
    .hs-theme-pill[data-mode="dark"]  .hs-pill-opt.moon svg { color: #0F766E; }
    .hs-theme-pill[data-mode="light"] .hs-pill-opt.sun svg  { color: #0F766E; }

    /* logout */
    .hs-logout-btn {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 10px 13px;
      border-radius: 10px;
      color: rgba(255,255,255,0.55);
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 100%;
      text-align: left;
      transition: background 0.22s ease, color 0.22s ease;
      animation: hs-slide-in 0.35s ease 0.4s both;
    }
    .hs-logout-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
    .hs-logout-btn:hover { background: rgba(239,68,68,0.14); color: #f87171; }

    /* ── Mobile Drawer ── */
    .hs-sidebar-overlay {
      display: none; position: fixed; inset: 0; z-index: 490;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(2px);
    }
    .hs-sidebar-overlay.active { display: block; }

    /* ── Bottom Nav (mobile only) ── */
    .hs-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 500;
      background: #0F766E;
      border-top: 1px solid rgba(0,0,0,0.18);
      height: 62px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .hs-bn-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
      color: rgba(255,255,255,0.58);
      background: none;
      border: none;
      padding: 8px 0 6px;
      font-family: inherit;
      position: relative;
      transition: color 0.18s;
    }
    .hs-bn-item svg { width: 20px; height: 20px; stroke: currentColor; fill: none; flex-shrink: 0; }
    .hs-bn-item span { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; line-height: 1; }
    .hs-bn-item.active { color: #fff; }
    .hs-bn-item.active::before {
      content: '';
      position: absolute;
      top: 0; left: 22%; right: 22%;
      height: 2px;
      background: rgba(255,255,255,0.9);
      border-radius: 0 0 3px 3px;
    }
    .hs-bn-item:hover { color: rgba(255,255,255,0.88); }

    @media (max-width: 768px) {
      .hs-sidebar { display: none !important; }
      .hs-sidebar-overlay { display: none !important; }
      .hs-bottom-nav { display: flex; }
    }
  `;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('hs-sidebar-style')) return;
    const style = document.createElement('style');
    style.id = 'hs-sidebar-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getBasePath() {
    const p = window.location.pathname;
    if (p.includes('/module/')) return '../../';
    if (p.includes('/auth/'))   return '../';
    return './';
  }

  function getTheme() {
    return localStorage.getItem('hs-theme') || 'light';
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('hs-theme', mode);
  }

  // ── Build HTML ───────────────────────────────────────────────────────────────
  function buildHTML(items, activePage, basePath, theme) {
    const isDark = theme === 'dark';

    const navHTML = items.map((item) => {
      // Check if item has submenu (always expanded, no toggle)
      if (item.submenu) {
        const submenuHTML = item.submenu.map(sub => `
          <button class="hs-nav-item hs-nav-submenu ${sub.id === activePage ? 'active' : ''}" data-page="${sub.id}">
            ${IC[sub.icon] || IC.grid}
            <span>${sub.label}</span>
          </button>
        `).join('');

        return `
          <div class="hs-nav-group expanded">
            <div class="hs-nav-item hs-nav-header">
              ${IC[item.icon] || IC.grid}
              <span>${item.label}</span>
            </div>
            <div class="hs-nav-submenu-container">
              ${submenuHTML}
            </div>
          </div>
        `;
      }

      // Regular nav item (no submenu)
      return `
        <button class="hs-nav-item ${item.id === activePage ? 'active' : ''}" data-page="${item.id}">
          ${IC[item.icon] || IC.grid}
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="hs-logo">
        <img class="hs-logo-img" src="${basePath}assets/img/image.png" alt="HomeSure"
             onerror="this.style.display='none'" />
        <span class="hs-logo-text">HomeSure</span>
      </div>

      <nav class="hs-nav" id="hsSidebarNav">${navHTML}</nav>

      <div class="hs-bottom">
        <div class="hs-divider"></div>
      </div>
    `;
  }

  // ── Entrance animation (instant) ────────────────────────────────────────────
  function animateIn(el) {
    el.querySelectorAll('.hs-nav-item').forEach(item => {
      item.style.opacity = '1';
      item.style.transform = 'none';
    });
  }

  // ── Bind events ──────────────────────────────────────────────────────────────
  function bindEvents(el) {
    // Nav routing
    const NAV_ROUTES = {
      buyer:      { dashboard: 'buyer.html', saved: 'saved.html', messages: 'messages.html', payments: 'payments.html' },
      seller:     { dashboard: 'seller.html', listings: 'listings.html', messages: 'messages.html', payments: 'payments.html' },
      admin:      { dashboard: 'admin.html', listings: 'listings.html', users: 'users.html', reports: 'reports.html', analytics: 'analytics.html', payments: 'payments.html' },
      superadmin: { dashboard: 'super-admin.html', admins: 'admins.html', 'audit-trail': 'audit-trail.html', reports: 'reports.html' },
    };
    const sessionUser = typeof getSession === 'function' ? getSession() : null;
    const navRole = sessionUser ? sessionUser.role : 'buyer';
    const routes = NAV_ROUTES[navRole] || {};
    // Handle nav items (excluding headers)
    el.querySelectorAll('.hs-nav-item:not(.hs-nav-header)').forEach(btn => {
      const page = btn.dataset.page;
      if (routes[page]) btn.addEventListener('click', () => {
        if (window.location.href.includes(routes[page])) return;
        window.location.href = routes[page];
      });
    });

  }

  // ── Public API ───────────────────────────────────────────────────────────────
  function init({ activePage = 'dashboard' } = {}) {
    injectCSS();

    const el = document.getElementById('hs-sidebar');
    if (!el) { console.warn('HomeSureSidebar: #hs-sidebar not found.'); return; }

    const user = typeof getSession === 'function' ? getSession() : null;
    const role = user ? user.role : 'buyer';
    const basePath = getBasePath();
    const theme = getTheme();

    // Apply saved theme immediately
    applyTheme(theme);

    const items = NAV[role] || NAV.buyer;
    el.className = 'hs-sidebar';
    el.innerHTML = buildHTML(items, activePage, basePath, theme);

    bindEvents(el);
    animateIn(el);

    // ── Mobile overlay ─────────────────────────────────────────────────────────
    let overlay = document.getElementById('hs-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'hs-sidebar-overlay';
      overlay.className = 'hs-sidebar-overlay';
      document.body.appendChild(overlay);
    }
    overlay.addEventListener('click', () => {
      el.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });

    global.HomeSureSidebar.toggleMobile = function () {
      const isOpen = el.classList.toggle('mobile-open');
      overlay.classList.toggle('active', isOpen);
    };

    // ── Bottom Nav (mobile) ────────────────────────────────────────────────────
    const bnId = 'hs-bottom-nav';
    let bn = document.getElementById(bnId);
    if (!bn) {
      bn = document.createElement('nav');
      bn.id = bnId;
      bn.className = 'hs-bottom-nav';
      document.body.appendChild(bn);
    }

    const BN_ROUTES = {
      buyer:      { dashboard: 'buyer.html',       saved: 'saved.html',       messages: 'messages.html',  payments: 'payments.html' },
      seller:     { dashboard: 'seller.html',       listings: 'listings.html', messages: 'messages.html', payments: 'payments.html' },
      admin:      { dashboard: 'admin.html',        listings: 'listings.html', users: 'users.html',       reports: 'reports.html', analytics: 'analytics.html', payments: 'payments.html' },
      superadmin: { dashboard: 'super-admin.html',  admins: 'admins.html',     'audit-trail': 'audit-trail.html', reports: 'reports.html' },
    };
    const bnRoutes = BN_ROUTES[role] || {};

    bn.innerHTML = items.map(item => `
      <button class="hs-bn-item ${item.id === activePage ? 'active' : ''}" data-page="${item.id}">
        ${IC[item.icon] || IC.grid}
        <span>${item.label}</span>
      </button>
    `).join('');

    bn.querySelectorAll('.hs-bn-item').forEach(btn => {
      const page = btn.dataset.page;
      if (bnRoutes[page]) btn.addEventListener('click', () => {
        if (window.location.href.includes(bnRoutes[page])) return;
        window.location.href = bnRoutes[page];
      });
    });
  }

  global.HomeSureSidebar = { init };

})(window);
