import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kasafide - Real Estate Marketplace", template: "%s | Kasafide" },
  description: "Philippine real estate marketplace with instant payments and verified titles.",
};

// Runs before first paint so a returning visitor never sees a flash of the wrong theme. Same key as
// public/assets/js/kasafide-theme.js (kasafide_theme), so the app and the legacy pages agree.
// A fixed string written here — nothing from a request or the database is ever put in it.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('kasafide_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
