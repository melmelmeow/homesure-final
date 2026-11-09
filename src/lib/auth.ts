import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "buyer" | "seller" | "admin" | "superadmin" | "super_duper_admin";

export const ADMIN_ROLES: AppRole[] = ["admin", "superadmin", "super_duper_admin"];

export type Me = {
  supabase: SupabaseClient;
  user: User;
  profile: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: AppRole;
    account_status: string | null;
  };
};

/** The signed-in user and their profile, or null. Cached per request, so layouts and pages share one lookup. */
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, avatar_url, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: {
      id: user.id,
      full_name: profile?.full_name ?? null,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      email: profile?.email ?? user.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: (profile?.role as AppRole | undefined) ?? "buyer",
      account_status: profile?.account_status ?? null,
    },
  };
});

export function homeFor(role: AppRole): string {
  if (role === "seller") return "/seller/dashboard";
  if (ADMIN_ROLES.includes(role)) return "/admin/dashboard";
  return "/buyer/dashboard";
}

/**
 * Gate for Server Components. Call it at the top of every page — not just the layout — because a
 * layout is not re-rendered when someone navigates between its child pages, so a layout-only check
 * is not a reliable gate. Anyone who is not allowed is redirected, never shown the page.
 */
export async function requireRole(allowed: AppRole[], returnTo?: string): Promise<Me> {
  const me = await getMe();
  if (!me) redirect(`/auth/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  if (!allowed.includes(me.profile.role)) redirect(homeFor(me.profile.role));
  return me;
}
