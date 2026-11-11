import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Call it inside event handlers / effects, not at module level.
 *
 * It throws when the environment is not configured. It used to fall back to a placeholder project,
 * which turned a missing .env into confusing network errors on every sign-in instead of one clear
 * message. NEXT_PUBLIC_ variables are inlined at build time, so a missing value means the build was
 * made without them.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  return createBrowserClient(url, key);
}
