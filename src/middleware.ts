import { NextResponse, type NextRequest } from "next/server";
<<<<<<< HEAD
import { updateSession } from "@/lib/supabase/middleware";

// Origins of a front end hosted somewhere else that may call /api/*. With one server — the normal
// setup — pages and API share an origin and this never comes into play.
//
// Set FRONTEND_ORIGINS (comma separated, e.g. https://homesure.ph) in production. The localhost
// defaults below apply ONLY outside production: they used to apply everywhere, so a production
// deploy with FRONTEND_ORIGINS unset still trusted any page served from a developer's own machine.
const DEV_ORIGINS = [
=======

// Origins of the front end that may call /api/*. With one server — the normal setup — the pages and
// the API share an origin and this never comes into play. Override with FRONTEND_ORIGINS
// (comma separated) only when the front end is hosted somewhere else.
const DEFAULT_FRONTEND_ORIGINS = [
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8080",
  "http://localhost:5173",
];

<<<<<<< HEAD
function allowedOrigins(): string[] {
  if (process.env.FRONTEND_ORIGINS) {
    return process.env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
=======
function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = process.env.FRONTEND_ORIGINS
    ? process.env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : DEFAULT_FRONTEND_ORIGINS;

  if (!origin || !allowed.includes(origin)) return {};
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

<<<<<<< HEAD
// Areas that need a signed-in user. The layouts and pages inside each one check the ROLE as well;
// this is the first, cheap gate.
const PROTECTED_PREFIXES = ["/buyer", "/seller", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API: CORS only ────────────────────────────────────────────────────────
  // Routes authenticate themselves (guardApi) and must answer 401 as JSON — never redirect a
  // fetch() caller to an HTML login page.
  if (pathname.startsWith("/api")) {
    const cors = corsHeaders(request.headers.get("origin"));
    if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: cors });
    const response = NextResponse.next();
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  // ── Pages: refresh the session cookie, then gate the protected areas ───────
  const { response, user } = await updateSession(request);

  if (!user && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

=======
/**
 * The only job left here is CORS for the API.
 *
 * Routes authenticate themselves — guardApi() verifies the Bearer token the front end sends — and
 * answer 401 as JSON. They must never be redirected to an HTML login page, which is what a fetch()
 * caller would choke on.
 */
export function middleware(request: NextRequest) {
  const cors = corsHeaders(request.headers.get("origin"));

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors });
  }

  const response = NextResponse.next();
  Object.entries(cors).forEach(([key, value]) => response.headers.set(key, value));
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  return response;
}

export const config = {
<<<<<<< HEAD
  // The API, plus every page. Static files (anything with an extension, and /_next) are skipped, so
  // the legacy pages and assets in public/ are still served straight from disk.
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
=======
  // Only the API needs this. The front end in public/ is served straight from disk, so no page or
  // asset request pays for middleware.
  matcher: ["/api/:path*"],
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
};
