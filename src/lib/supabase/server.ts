import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getServerUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) return null;

  const { data: { user } } = await supabaseServer.auth.getUser(token);
  return user;
}
