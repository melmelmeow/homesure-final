"use client";

import Script from "next/script";
import type { ReactNode } from "react";
import { useEffect } from "react";

export type DashboardUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
};

/**
 * DashboardShell — restored to the original Kasafide design system.
 *
 * Renders the .layout > #hs-sidebar + .main > #hs-topbar + .content structure
 * that the public/components/sidebar.js and topbar.js expect. The SSR page
 * passes user data via props; this client component writes them to
 * window.__kasafide_ssr_user before the scripts run so the sidebar can show
 * the correct avatar, name and nav for each role.
 *
 * CSS is loaded via <link> tags (the same stylesheets the static module pages
 * use), so the visual appearance is identical across SSR and static pages.
 */
export function DashboardShell({
  user,
  activePage,
  children,
}: {
  user: DashboardUser;
  activePage: string;
  children: ReactNode;
}) {
  // Write SSR user into window so sidebar.js / topbar.js can read it
  // synchronously when they initialise. This runs before the scripts that
  // follow because useEffect fires after hydration but we also set it inline
  // via dangerouslySetInnerHTML below for the first paint.
  useEffect(() => {
    (window as Window & { __kasafide_ssr_user?: DashboardUser }).__kasafide_ssr_user = user;
  }, [user]);

  const initScript = `
    window.__kasafide_ssr_user = ${JSON.stringify(user)};
    // Apply saved theme before first paint (prevents flash)
    (function(){
      try {
        var t = localStorage.getItem('kasafide_theme');
        if (t !== 'light' && t !== 'dark') {
          t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        document.documentElement.setAttribute('data-theme', t);
      } catch(e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;

  const sidebarInit = `
    if (typeof KasafideSidebar !== 'undefined') {
      KasafideSidebar.init({
        activePage: ${JSON.stringify(activePage)},
        role: ${JSON.stringify(user.role)},
        user: window.__kasafide_ssr_user,
        signOutUrl: '/auth/signout',
      });
    }
  `;

  const topbarInit = `
    if (typeof KasafideTopbar !== 'undefined') {
      KasafideTopbar.init({
        user: window.__kasafide_ssr_user,
        placeholder: 'Search…',
        signOutUrl: '/auth/signout',
      });
    }
  `;

  return (
    <>
      {/* Theme + user bootstrap — must be first so scripts below see the data */}
      <script dangerouslySetInnerHTML={{ __html: initScript }} />

      {/* Design-system CSS — same files the static module pages import */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/kasafide-theme.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/dashboard.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href={`/assets/css/${user.role}/dashboard.css`}
        // Not all roles have a role-specific dashboard.css — 404s are silent
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/responsive.css" />

      <div className="layout">
        {/* Sidebar — hydrated by sidebar.js after it loads */}
        <div id="hs-sidebar" />

        <div className="main">
          {/* Topbar — hydrated by topbar.js after it loads */}
          <div id="hs-topbar" />

          {/* Page content */}
          <div className="content">{children}</div>
        </div>
      </div>

      {/* Core JS — load after DOM is ready */}
      <Script src="/assets/js/kasafide-theme.js" strategy="afterInteractive" />
      <Script src="/assets/js/kasafide-logo.js" strategy="afterInteractive" />
      <Script src="/assets/js/config.js" strategy="afterInteractive" />
      <Script src="/assets/js/session.js" strategy="afterInteractive" />
      <Script src="/components/sidebar.js" strategy="afterInteractive" />
      <Script src="/components/topbar.js" strategy="afterInteractive" />

      {/* Init sidebar + topbar after all component scripts are loaded */}
      <Script
        id="hs-dashboard-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: sidebarInit + topbarInit }}
      />
    </>
  );
}
