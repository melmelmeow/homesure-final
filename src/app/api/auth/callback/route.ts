import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ROLE_DASHBOARD: Record<string, string> = {
  buyer: "/buyer/dashboard",
  seller: "/seller/dashboard",
  admin: "/admin/dashboard",
  superadmin: "/super-admin/dashboard",
  super_duper_admin: "/super-admin/dashboard",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=auth_callback_failed`
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] exchangeCodeForSession error:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/signin?error=auth_callback_failed`
      );
    }

    // Fetch the authenticated user's role for dashboard redirect
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role && ROLE_DASHBOARD[profile.role]) {
        return NextResponse.redirect(`${origin}${ROLE_DASHBOARD[profile.role]}`);
      }
    }

    // Fall back to the `next` param or root
    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[auth/callback] unexpected error:", err);
    return NextResponse.redirect(
      `${origin}/auth/signin?error=auth_callback_failed`
    );
  }
}
