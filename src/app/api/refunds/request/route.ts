import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  const body = await request.json().catch(() => ({}));
  const { paymentId, propertyId, amount, destinationAccountNo, destinationBankCode, reason } = body;

  if ((!paymentId && !propertyId) || !amount || !destinationAccountNo || !destinationBankCode || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const requested = parseFloat(amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // RLS limits this to the caller's own payments; the payer column is checked again explicitly.
  let query = supabase.from("payments").select("*").eq("user_id", user.id).eq("status", "paid");
  query = paymentId ? query.eq("id", paymentId) : query.eq("property_id", propertyId);
  const { data: payment } = await query.order("paid_at", { ascending: false }).limit(1).maybeSingle();

  if (!payment) return NextResponse.json({ error: "No paid payment found" }, { status: 404 });
  if (requested > Number(payment.amount)) {
    return NextResponse.json({ error: "Refund amount exceeds the amount paid" }, { status: 400 });
  }

  const admin = getAdminSupabase();

  const { data: existing } = await admin
    .from("refunds")
    .select("id")
    .eq("payment_id", payment.id)
    .in("status", ["requested", "processing", "completed"])
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "A refund already exists for this payment" }, { status: 409 });
  }

  // No INSERT policy on refunds for end users by design -> write with the service role.
  const { data: refund, error } = await admin
    .from("refunds")
    .insert({
      payment_id: payment.id,
      requested_by: user.id,
      amount: requested,
      reason,
      destination_account_no: destinationAccountNo,
      destination_bank_code: destinationBankCode,
      status: "requested",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[refunds/request] insert failed:", error.message);
    return NextResponse.json({ error: "Could not record the refund request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ refund }, { status: 200 });
}
