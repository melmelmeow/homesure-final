import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { sendMail, passwordResetEmail, appOrigin, isEmailConfigured } from "@/lib/email";
import { issueResetToken, resetCooldownRemaining, RESET_TTL_MINUTES } from "@/lib/verification";

/**
 * "Forgot password": email a reset link, sent by Kasafide rather than the Supabase auth server.
 *
 * The auth server's own reset mail (sb.auth.resetPasswordForEmail) cannot work here: it has no
 * SMTP configured (the same reason /api/auth/signup sends its own confirmation), and its mail
 * still carried the old HomeSure branding. Migration 015 adds the token table this uses.
 *
 * The answer is the same whether or not the address has an account, so this cannot be used to
 * find out who is registered. Only a confirmed account gets a link: an unconfirmed one should
 * finish signing up first, and resetting it would not let it sign in anyway.
 */
export async function POST(request: Request) {
  const ok = NextResponse.json(
    { ok: true, message: "If that email has a Kasafide account, a reset link is on its way." },
    { status: 200 },
  );

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "This server cannot send email yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = getAdminSupabase();

  // There is no "get user by email" in the admin API, so find the profile first.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return ok;

  const { data: existing } = await admin.auth.admin.getUserById(profile.id);
  if (!existing?.user || !existing.user.email_confirmed_at) return ok;

  const wait = await resetCooldownRemaining(profile.id);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Please wait ${wait} more second${wait === 1 ? "" : "s"} before asking again.`, retryAfter: wait },
      { status: 429 },
    );
  }

  try {
    const token = await issueResetToken(profile.id, email);
    const link = `${appOrigin(request)}/auth/reset-password.html?token=${encodeURIComponent(token)}`;
    await sendMail({
      to: email,
      ...passwordResetEmail({ firstName: profile.first_name ?? "", link, minutes: RESET_TTL_MINUTES }),
    });
  } catch (err) {
    console.error("Could not send the reset email:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "We could not send that email. Please try again shortly." }, { status: 502 });
  }

  return ok;
}
