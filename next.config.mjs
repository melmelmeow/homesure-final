/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The landing page is public/index.html (plain HTML/JS, wired to the database through HS).
  // Without this, "/" is served by src/app/page.tsx, an older React copy of the landing page.
  // permanent: false so a browser does not cache the redirect forever.
  async redirects() {
    return [{ source: "/", destination: "/index.html", permanent: false }];
  },
  output: "standalone",	
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
