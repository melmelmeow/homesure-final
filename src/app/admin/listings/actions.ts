"use server";

import { revalidatePath } from "next/cache";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";

/**
 * Server actions are public POST endpoints that anyone can call directly, so each one re-checks the
 * caller's role itself — hiding the button in the page is not protection. The update runs as the
 * signed-in admin, so row level security applies on top.
 */
export async function reviewListing(formData: FormData): Promise<void> {
  const { supabase, user } = await requireRole(ADMIN_ROLES);

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || (decision !== "approve" && decision !== "reject")) return;

  const patch =
    decision === "approve"
      ? { status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }
      : { status: "rejected", rejection_reason: String(formData.get("reason") ?? "").slice(0, 500) || null };

  const { error } = await supabase.from("properties").update(patch).eq("id", id).eq("status", "pending");
  if (error) console.error("[admin/listings] review failed:", error.message);

  revalidatePath("/admin/listings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/browse");
  revalidatePath("/");
}
