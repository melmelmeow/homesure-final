import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { sendMail, verificationEmail, appOrigin, isEmailConfigured } from "@/lib/email";
import { issueToken } from "@/lib/verification";
import { rateLimitByIp } from "@/lib/rate-limit";
import { signupSchema, firstIssue } from "@/lib/schemas";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Create an account and email the confirmation link ourselves.
 *
 * The Supabase auth server requires a confirmed email before sign-in but has no SMTP, so its own
 * public signup endpoint fails with "Error sending confirmation email". The admin endpoint used
 * here sends nothing, so it cannot fail that way — we create the account UNCONFIRMED and send the
 * mail from this app instead.
 *
 * The account stays unusable until the link is opened. That is enforced by the auth server, not by
 * this code: signing in to an unconfirmed account is refused with "Email not confirmed" no matter
 * who asks.
 */
export async function POST(request: Request) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Sign-up is unavailable right now: this server cannot send email yet." },
      { status: 503 },
    );
  }

  // 5 sign-ups per IP per 15 minutes. Each one creates an auth user and sends an email.
  const limited = await rateLimitByIp(request, "signup", 5, 900);
  if (!limited.ok) return limited.response;

  // NEVER log the request body here: it contains the password.
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { email, password, firstName, lastName, fullName, phone, role } = parsed.data;

  // Only buyer and seller can be chosen here. Admin and superadmin are granted by an admin.
  const safeRole = role === "seller" ? "seller" : "buyer";
  const admin = getAdminSupabase();
  // An address with a sign-up started but never confirmed belongs to nobody yet. Whoever typed it
  // has not proved they can read that inbox, so they have no claim on it — and leaving the row in
  // place would lock the real owner out of their own address until an admin deleted it by hand.
  //
  // So an unconfirmed account is replaced by this sign-up. The person who can read the mail still
  // decides who gets in, because only they can open the link, and the password that ends up
  // working is the one from the most recent attempt.
  //
  // A confirmed account is never touched. Someone has proved they own that inbox, and nothing
  // here may take it from them.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingUser } = await admin.auth.admin.getUserById(existingProfile.id);

    if (existingUser?.user?.email_confirmed_at) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in, or reset your password." },
        { status: 409 },
      );
    }

    // Deleting the auth user cascades the profile and any tokens issued for it.
    const { error: deleteError } = await admin.auth.admin.deleteUser(existingProfile.id);
    if (deleteError) {
      console.error("Could not clear the unconfirmed account:", deleteError.message);
      return NextResponse.json(
        { error: "Something is wrong with that address. Please contact support." },
        { status: 409 },
      );
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,          // ← the whole point: unusable until the link is opened
    user_metadata: {
      full_name: fullName ?? [firstName, lastName].filter(Boolean).join(" "),
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      role: safeRole,
    },
  });
  if (createError) console.error("[signup] createUser error:", createError.message);
  if (createError || !created?.user) {
    const message = createError?.message ?? "Could not create the account.";
    // Reached only if two sign-ups for the same address land at the same moment, since an
    // unconfirmed one was cleared above.
    if (/already|registered|exists|duplicate/i.test(message)) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in, or reset your password." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = created.user.id;

  // From here on a failure leaves an account nobody can use, so roll it back and let them retry
  // with the same address rather than stranding it.
  try {
    const token = await issueToken(userId, email);
    const link = `${appOrigin(request)}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    const mail = verificationEmail({ firstName: firstName ?? "", link });
    await sendMail({ to: email, ...mail });
  } catch (err) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    const detail = err instanceof Error ? err.message : "unknown error";
    console.error("Signup rolled back, could not send the confirmation email:", detail);
    return NextResponse.json(
      { error: "We could not send your confirmation email. Please check the address and try again." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true, email, message: "Check your email for the confirmation link." },
    { status: 201 },
  );
}
