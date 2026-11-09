import { NextResponse } from "next/server";
import { ADMIN_ROLES, guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

// Sends money out, so: admins only, and a refund can only be claimed once.
export async function POST(request: Request) {
  const guard = await guardApi(ADMIN_ROLES);
  if (!guard.ok) return guard.response;

  const { refundId } = (await request.json().catch(() => ({}))) as { refundId?: string };
  if (!refundId) return NextResponse.json({ error: "refundId is required" }, { status: 400 });

  const xenditSecret = process.env.XENDIT_SECRET_KEY;
  if (!xenditSecret) return NextResponse.json({ error: "Xendit not configured" }, { status: 500 });

  const admin = getAdminSupabase();

  // Atomically claim the refund (requested -> processing) so a double click can't pay out twice.
  const { data: refund } = await admin
    .from("refunds")
    .update({ status: "processing" })
    .eq("id", refundId)
    .eq("status", "requested")
    .select("*")
    .maybeSingle();

  if (!refund) {
    return NextResponse.json({ error: "Refund not found or not in 'requested' state" }, { status: 409 });
  }

  const { data: requester } = await admin.from("profiles").select("full_name").eq("id", refund.requested_by).single();

  const auth = Buffer.from(`${xenditSecret}:`).toString("base64");

  const disbursementRes = await fetch("https://api.xendit.co/v2/disbursements", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: `REFUND-${refund.id}`,
      amount: refund.amount,
      bank_code: refund.destination_bank_code,
      account_holder_name: requester?.full_name || "Refund Beneficiary",
      account_number: refund.destination_account_no,
      description: `Instant Refund for Payment ID ${refund.payment_id}`,
    }),
  });

  if (!disbursementRes.ok) {
    const err = await disbursementRes.text();
    await admin.from("refunds").update({ status: "requested" }).eq("id", refund.id);
<<<<<<< HEAD
    console.error("[Xendit] disbursement failed:", disbursementRes.status, err);
    return NextResponse.json({ error: "The refund could not be sent. Please try again or contact support." }, { status: 502 });
=======
    return NextResponse.json({ error: `Xendit disbursement error: ${err}` }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  }

  const disbursement = await disbursementRes.json();

  const { error: updateError } = await admin
    .from("refunds")
    .update({
      status: "completed",
      disbursement_reference: disbursement.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", refund.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, disbursement }, { status: 200 });
}
