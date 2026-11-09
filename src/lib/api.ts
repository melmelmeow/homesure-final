import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAuth } from "./supabase/server-client";

type Guard =
  | { ok: true; supabase: SupabaseClient; user: User; role: string }
  | { ok: false; response: NextResponse };

/**
 * Authenticate an API request. Pass `roles` to also require one of those profile roles
 * (e.g. ["admin", "superadmin"]). Callers return `guard.response` when `guard.ok` is false.
 */
export async function guardApi(roles?: string[]): Promise<Guard> {
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile?.role as string | undefined) ?? "buyer";

  if (roles && !roles.includes(role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, supabase, user, role };
}

export const ADMIN_ROLES = ["admin", "superadmin", "super_duper_admin"];
