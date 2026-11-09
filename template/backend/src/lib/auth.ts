import { getServerSupabase } from "./supabase/server-client";

export async function requireAuth() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error("Forbidden");
  }
  
  return { session, profile };
}
