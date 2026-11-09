import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { appOrigin } from "@/lib/email";
import { hashToken } from "@/lib/verification";

/**
 * The target of the link in the confirmation email.
 *
 * Opening it marks the account confirmed with the auth server, which is what lets the person sign
 * in. Either way they land back on the sign-in page with a message, because somebody clicking a
 * link in their mail should see a page, not JSON.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const back = (status: string) => NextResponse.redirect(`${appOrigin(request)}/auth/signin.html?verified=${status}`, 303);

  if (!token) return back("missing");

  const admin = getAdminSupabase();

  const { data: row } = await admin
    .from("email_verifications")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!row) return back("invalid");

  if (row.used_at) {
    // Mail clients and scanners pre-fetch links, and people click twice. If the account is already
    // confirmed say so plainly instead of calling a second click an error.
    const { data: existing } = await admin.auth.admin.getUserById(row.user_id);
    return back(existing?.user?.email_confirmed_at ? "already" : "invalid");
  }

  if (new Date(row.expires_at).getTime() < Date.now()) return back("expired");

  const { error: confirmError } = await admin.auth.admin.updateUserById(row.user_id, {
    email_confirm: true,
  });

  if (confirmError) {
    console.error("Could not confirm the account:", confirmError.message);
    return back("failed");
  }

  // Spend the token only once the account is actually confirmed, so a failure above leaves the
  // link still usable rather than burning it.
  await admin
    .from("email_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  return back("success");
}
