import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { propertyId, amount, destinationAccountNo, destinationBankCode, reason } = body;

  if (!propertyId || !amount || !destinationAccountNo || !destinationBankCode || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("property_id", propertyId)
    .eq("buyer_id", session.user.id)
    .eq("status", "paid")
    .single();

  if (!payment) return NextResponse.json({ error: "No paid payment found for this property" }, { status: 404 });

  const { data: refund, error } = await supabase
    .from("refunds")
    .insert({
      payment_id: payment.id,
      requested_by: session.user.id,
      amount: parseFloat(amount),
      reason,
      destination_account_no: destinationAccountNo,
      destination_bank_code: destinationBankCode,
      status: "requested",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ refund }, { status: 200 });
}
