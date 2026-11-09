import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const protectedRoutes = ["/dashboard", "/api/payments", "/api/refunds", "/api/verify", "/api/analytics"];
  const authRoutes = ["/auth/login", "/auth/signup"];
  
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isAuth = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  
  if (session && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
