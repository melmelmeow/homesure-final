import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { hashToken } from "@/lib/verification";

/**
 * Set a new password from the link in the reset email (auth/reset-password.html posts here).
 *
 * The token is the only proof of identity, so it is checked hard: it must exist, be unused and
 * unexpired, and it is spent as soon as the password changes. The password itself is set through
 * the admin API, so the auth server's own rules (and its password hashing) still apply.
 *
 * GET with ?token= only checks whether the link is still good, so the page can say "this link has
 * expired" before someone types a new password into it.
 */
async function findToken(token: string | null | undefined) {
  if (!token) return { status: "missing" as const };
  const { data: row } = await getAdminSupabase()
    .from("password_resets")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!row) return { status: "invalid" as const };
  if (row.used_at) return { status: "used" as const };
  if (new Date(row.expires_at).getTime() < Date.now()) return { status: "expired" as const };
  return { status: "ok" as const, row };
}

const MESSAGES: Record<string, string> = {
  missing: "This page needs the link from your reset email.",
  invalid: "That reset link is not valid. Ask for a new one.",
  used: "That reset link was already used. Ask for a new one if you still need it.",
  expired: "That reset link has expired. Ask for a new one.",
};

export async function GET(request: Request) {
  const found = await findToken(new URL(request.url).searchParams.get("token"));
  if (found.status !== "ok") {
    return NextResponse.json({ ok: false, status: found.status, error: MESSAGES[found.status] }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string; password?: string } | null;
  const password = body?.password ?? "";

  if (password.length < 8) {
    return NextResponse.json({ error: "Your password must be at least 8 characters." }, { status: 400 });
  }

  const found = await findToken(body?.token);
  if (found.status !== "ok") {
    return NextResponse.json({ error: MESSAGES[found.status], status: found.status }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const { error } = await admin.auth.admin.updateUserById(found.row.user_id, { password });
  if (error) {
    console.error("Could not set the new password:", error.message);
    return NextResponse.json({ error: "We could not change your password. Please try again." }, { status: 502 });
  }

  // Spend this token, and any other unused one for the same account, only once it worked.
  await admin
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", found.row.user_id)
    .is("used_at", null);

  return NextResponse.json({ ok: true });
}
