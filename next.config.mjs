/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
  // "/" is the server-rendered landing page (src/app/page.tsx). The old plain-HTML pages in public/
  // are still served at their own .html URLs while they are migrated to the app router.
  output: "standalone",
=======
  // The landing page is public/index.html (plain HTML/JS, wired to the database through HS).
  // Without this, "/" is served by src/app/page.tsx, an older React copy of the landing page.
  // permanent: false so a browser does not cache the redirect forever.
  async redirects() {
    return [{ source: "/", destination: "/index.html", permanent: false }];
  },
  output: "standalone",	
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.xendit.co" },
      { protocol: "https", hostname: "**.google.com" },
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
