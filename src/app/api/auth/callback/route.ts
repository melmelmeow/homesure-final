import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const supabase = await getServerSupabase();
  const code = new URL(request.url).searchParams.get("code");

  // The React login page this used to return to is gone; the front end's own sign-in page is the
  // one place people sign in now. Nothing uses OAuth yet, but the exchange is kept so turning it
  // on later is a provider setting rather than new code.
  if (!code) {
    return NextResponse.redirect(new URL("/auth/signin.html?error=no_code", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth/signin.html?error=exchange_failed", request.url));
  }

  return NextResponse.redirect(new URL("/index.html", request.url));
}
