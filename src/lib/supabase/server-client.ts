import { createClient as createSupabaseJsClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createClient as createCookieClient } from "./server";

// The static front end (separate origin) keeps its Supabase session in localStorage and
// sends `Authorization: Bearer <access_token>`. The Next.js dashboard keeps it in cookies.
// This module supports both so API routes work for either caller.

async function getBearerToken(): Promise<string | null> {
  const header = (await headers()).get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/** Supabase client that runs queries as the calling user (RLS applies). */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const token = await getBearerToken();
  if (!token) return createCookieClient();

  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );
}

/** Verified caller. `user` is null when not signed in (token is validated by the Auth server). */
export async function getAuth(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const token = await getBearerToken();
  const supabase = await getServerSupabase();
  const { data, error } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}
