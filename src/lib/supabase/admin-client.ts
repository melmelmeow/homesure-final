import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dns from "node:dns";

if (typeof dns.setDefaultResultOrder === "function") {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Ignore in edge environments if any
  }
}

// Service-role client: bypasses RLS. Server-only — the `server-only` import above makes the build
// fail if a client component ever imports this file.
//
// Use it only for writes that RLS intentionally forbids to end users (payments, refunds, webhooks,
// OTP and rate-limit rows, analytics sync) AFTER the caller has been authenticated/authorised.
//
// SECURITY: the key is read from SUPABASE_SERVICE_ROLE_KEY only. It must NEVER carry a
// NEXT_PUBLIC_ prefix — Next.js inlines every NEXT_PUBLIC_ variable into the JavaScript sent to
// every browser, and this key bypasses all Row Level Security.
export function getAdminSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("[admin-client] SUPABASE_SERVICE_ROLE_KEY is not configured");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("[admin-client] NEXT_PUBLIC_SUPABASE_URL is not configured");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
