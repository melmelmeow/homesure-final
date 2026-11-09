import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous Supabase client for PUBLIC data (approved listings, barangay names, counts).
 *
 * It reads no cookies, so a page that only uses it is not forced to render per request and can be
 * cached with `export const revalidate = 60`. RLS still applies: it sees exactly what a signed-out
 * visitor may see. Never use it for anything that depends on who is signed in.
 */
export function createPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
