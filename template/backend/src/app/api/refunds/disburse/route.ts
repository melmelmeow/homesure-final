import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { refundId } = body;

  const { data: refund, error: refundError } = await supabase
    .from("refunds")
    .select("*, payments(*)")
    .eq("id", refundId)
    .single();

  if (refundError || !refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 });

  const xenditSecret = process.env.XENDIT_SECRET_KEY;
  if (!xenditSecret) return NextResponse.json({ error: "Xendit not configured" }, { status: 500 });

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
      account_holder_name: "Refund Beneficiary",
      account_number: refund.destination_account_no,
      description: `Instant Refund for Payment ID ${refund.payment_id}`,
    }),
  });

  if (!disbursementRes.ok) {
    const err = await disbursementRes.text();
    return NextResponse.json({ error: `Xendit disbursement error: ${err}` }, { status: 500 });
  }

  const disbursement = await disbursementRes.json();

  const { error: updateError } = await supabase
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
