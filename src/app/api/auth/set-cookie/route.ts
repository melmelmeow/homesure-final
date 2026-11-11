import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/set-cookie
 *
 * Receives { access_token, refresh_token } from the client-side static HTML
 * auth pages (public/auth/signin.html, signup.html) after a successful
 * supabase-js sign-in and writes the session into HTTP cookies so the SSR
 * middleware can recognise the user on protected routes like /buyer/dashboard.
 *
 * This is the "static → SSR session bridge". It is intentionally simple and
 * does not need SUPABASE_SERVICE_ROLE_KEY; the anon key plus valid JWTs is
 * sufficient for setSession().
 */
export async function POST(request: NextRequest) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { access_token, refresh_token } = body;
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}
