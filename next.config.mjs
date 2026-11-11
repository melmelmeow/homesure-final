/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // "/" is the server-rendered landing page (src/app/page.tsx). The old plain-HTML pages in public/
  // are still served at their own .html URLs while they are migrated to the app router.
  output: "standalone",

  // ── Auth page redirects ───────────────────────────────────────────────────
  // /auth/login and /auth/signup redirect to the full animated static HTML
  // design. The session bridge API route (src/app/api/auth/set-cookie) keeps
  // SSR cookies in sync after the client-side sign-in succeeds.
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/auth/signin.html",
        permanent: false,
      },
      {
        source: "/auth/signup",
        destination: "/auth/signup.html",
        permanent: false,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.xendit.co" },
      { protocol: "https", hostname: "**.google.com" },
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Self-hosted Supabase instance
      { protocol: "https", hostname: "srv1824055.hstgr.cloud" },
    ],
  },
};

export default nextConfig;
