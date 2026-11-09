import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Origins of a front end hosted somewhere else that may call /api/*. With one server — the normal
// setup — pages and API share an origin and this never comes into play.
//
// Set FRONTEND_ORIGINS (comma separated, e.g. https://homesure.ph) in production. The localhost
// defaults below apply ONLY outside production: they used to apply everywhere, so a production
// deploy with FRONTEND_ORIGINS unset still trusted any page served from a developer's own machine.
const DEV_ORIGINS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8080",
  "http://localhost:5173",
];

function allowedOrigins(): string[] {
  if (process.env.FRONTEND_ORIGINS) {
    return process.env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

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

  return response;
}

export const config = {
  // The API, plus every page. Static files (anything with an extension, and /_next) are skipped, so
  // the legacy pages and assets in public/ are still served straight from disk.
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
