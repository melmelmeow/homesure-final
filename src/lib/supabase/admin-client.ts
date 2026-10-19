import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only (never import from a client component, never
// expose SUPABASE_SERVICE_ROLE_KEY to the browser). Use it only for writes that RLS intentionally
// forbids to end users (payments, refunds, webhooks, analytics sync) AFTER the caller has been
// authenticated/authorised in the route.
export function getAdminSupabase(): SupabaseClient {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  return createClient(process.env.SUPABASE_INTERNAL_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
