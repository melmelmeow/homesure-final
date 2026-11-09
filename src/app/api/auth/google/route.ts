import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/email";
import { getGoogleConfig, buildGoogleAuthUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "signin";
  const role = url.searchParams.get("role") || "buyer";
  const redirect = url.searchParams.get("redirect") || "";

  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/auth/signin.html?error=google_not_configured", request.url)
    );
  }

  const origin = appOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/google`;

  const statePayload = JSON.stringify({
    action,
    role: role === "seller" ? "seller" : "buyer",
    redirect,
    ts: Date.now(),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const googleUrl = buildGoogleAuthUrl({
    clientId: config.clientId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(googleUrl);
}
