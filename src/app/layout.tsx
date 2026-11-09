import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
<<<<<<< HEAD
  title: { default: "Kasafide - Real Estate Marketplace", template: "%s | Kasafide" },
  description: "Philippine real estate marketplace with instant payments and verified titles.",
};

// Runs before first paint so a returning visitor never sees a flash of the wrong theme. Same key as
// public/assets/js/kasafide-theme.js (kasafide_theme), so the app and the legacy pages agree.
// A fixed string written here — nothing from a request or the database is ever put in it.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('kasafide_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;

=======
  title: "Kasafide - Real Estate Marketplace",
  description: "Philippine real estate marketplace with instant payments and verified titles.",
};

>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
=======
    <html lang="en">
      <body>
        {children}
      </body>
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
    </html>
  );
}
