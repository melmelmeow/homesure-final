import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { appOrigin } from "@/lib/email";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { getGoogleConfig, exchangeGoogleCode, getGoogleUserInfo } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const signinUrl = (err: string) =>
    NextResponse.redirect(new URL(`/auth/signin.html?error=${err}`, request.url));

  if (errorParam) {
    return signinUrl("google_cancelled");
  }

  if (!code) {
    return signinUrl("no_code");
  }

  let state: { action?: string; role?: string; redirect?: string } = {};
  if (stateRaw) {
    try {
      state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
    } catch {
      state = {};
    }
  }

  const config = getGoogleConfig();
  if (!config) {
    return signinUrl("google_not_configured");
  }

  const origin = appOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/google`;

  let tokens;
  try {
    tokens = await exchangeGoogleCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri,
    });
  } catch (err) {
    console.error("Error exchanging Google code:", err);
    return signinUrl("google_exchange_failed");
  }

  let userInfo;
  try {
    userInfo = await getGoogleUserInfo(tokens.access_token);
  } catch (err) {
    console.error("Error fetching Google userinfo:", err);
    return signinUrl("google_profile_failed");
  }

  const email = userInfo.email.toLowerCase().trim();
  const admin = getAdminSupabase();

  // Check if a profile exists for this email
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role, first_name, last_name, avatar_url")
    .eq("email", email)
    .maybeSingle();

  const tempPassword = crypto.randomUUID() + "Aa1!#";
  const safeRole = state.role === "seller" ? "seller" : "buyer";

  if (!existingProfile) {
    const firstName = userInfo.given_name || (userInfo.name ? userInfo.name.split(" ")[0] : "");
    const lastName = userInfo.family_name || (userInfo.name ? userInfo.name.split(" ").slice(1).join(" ") : "");
    const fullName = userInfo.name || [firstName, lastName].filter(Boolean).join(" ");

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        avatar_url: userInfo.picture,
        role: safeRole,
      },
    });

    if (createError) {
      console.error("Could not create Google user in Supabase:", createError.message);
      return signinUrl("create_failed");
    }
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(existingProfile.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        avatar_url: existingProfile.avatar_url || userInfo.picture,
      },
    });

    if (updateError) {
      console.error("Could not update existing user for Google signin:", updateError.message);
      return signinUrl("update_failed");
    }
  }

  // Obtain active session tokens via server client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serverClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signinData, error: signinError } = await serverClient.auth.signInWithPassword({
    email,
    password: tempPassword,
  });

  if (signinError || !signinData?.session) {
    console.error("Could not sign in with temp password:", signinError?.message);
    return signinUrl("signin_failed");
  }

  const { access_token, refresh_token } = signinData.session;
  const redirectParam = state.redirect ? `&redirect=${encodeURIComponent(state.redirect)}` : "";

  return NextResponse.redirect(
    new URL(
      `/auth/callback.html#access_token=${access_token}&refresh_token=${refresh_token}${redirectParam}`,
      request.url
    )
  );
}
