import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

type Body = { paymentId?: string; action?: "confirm" | "reject"; reason?: string };

/**
 * The seller accepts or rejects a manual payment on one of their own listings.
 *
 * Only the landowner of the listing may decide, and only while the payment is waiting — a confirmed
 * payment cannot be un-confirmed here, so a seller cannot quietly reverse a receipt the buyer has
 * already been shown.
 */
export async function POST(request: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  const { paymentId, action, reason } = (await request.json().catch(() => ({}))) as Body;
  if (!paymentId) return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ error: "action must be confirm or reject" }, { status: 400 });
  }

  const admin = getAdminSupabase();

  const { data: payment } = await admin
    .from("payments")
    .select("id, status, property_id, user_id, amount, period, properties(landowner_id, title)")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const property = payment.properties as { landowner_id?: string; title?: string } | null;
  if (!property || property.landowner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (payment.status !== "pending_confirmation") {
    return NextResponse.json({ error: `This payment is ${payment.status}, not awaiting confirmation` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const patch = action === "confirm"
    ? { status: "paid", confirmed_at: now, confirmed_by: user.id, rejection_reason: null }
    : { status: "rejected", confirmed_at: now, confirmed_by: user.id, rejection_reason: reason || "The seller could not match this payment." };

  const { data: updated, error } = await admin
    .from("payments")
    .update(patch)
    .eq("id", paymentId)
    .eq("status", "pending_confirmation")   // lose the race rather than decide twice
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[payments/confirm] update failed:", error.message);
    return NextResponse.json({ error: "Could not update the payment. Please try again." }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "This payment was already decided" }, { status: 409 });

  // Tell the buyer. A failed notification must not undo a confirmed payment, so it is best effort.
  await admin.from("notifications").insert({
    user_id: payment.user_id,
    type: "payment",
    title: action === "confirm" ? "Payment confirmed" : "Payment rejected",
    body: action === "confirm"
      ? `Your payment${payment.period ? ` for ${payment.period}` : ""} on ${property.title ?? "your rental"} was confirmed.`
      : `Your payment${payment.period ? ` for ${payment.period}` : ""} on ${property.title ?? "your rental"} was rejected. ${patch.rejection_reason}`,
    link: "/module/buyer/payments.html",
  }).then(({ error: notifyError }) => {
    if (notifyError) console.error("Could not notify the buyer:", notifyError.message);
  });

  return NextResponse.json({ payment: updated }, { status: 200 });
}
