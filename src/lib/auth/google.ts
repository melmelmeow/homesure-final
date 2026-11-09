import dns from "node:dns";

if (typeof dns.setDefaultResultOrder === "function") {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Ignore in edge environments
  }
}

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
};

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

/**
 * Clean any surrounding quotes or whitespace from env strings.
 */
function cleanEnv(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Returns Google OAuth client ID and Secret from environment variables.
 */
export function getGoogleConfig(): GoogleConfig | null {
  const clientId =
    cleanEnv(process.env.AUTH_GOOGLE_ID) ||
    cleanEnv(process.env.GOOGLE_CLIENT_ID);
  const clientSecret =
    cleanEnv(process.env.AUTH_GOOGLE_SECRET) ||
    cleanEnv(process.env.GOOGLE_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

/**
 * Generates the Google OAuth 2.0 authorization URL.
 */
export function buildGoogleAuthUrl({
  clientId,
  redirectUri,
  state,
}: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/**
 * Exchanges the Google authorization code for access and ID tokens.
 */
export async function exchangeGoogleCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; id_token?: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to exchange Google auth code");
  }

  return {
    access_token: data.access_token,
    id_token: data.id_token,
  };
}

/**
 * Fetches the user profile from Google's userinfo endpoint.
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.email) {
    throw new Error(data.error_description || data.error || "Failed to fetch Google profile");
  }

  return data as GoogleUserInfo;
}
