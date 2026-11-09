import { NextResponse } from "next/server";
<<<<<<< HEAD
import { timingSafeEqual } from "node:crypto";
=======
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
import { getAdminSupabase } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  // Fail closed: without a configured token anybody could mark payments as paid.
  const xenditToken = process.env.XENDIT_CALLBACK_TOKEN;
  if (!xenditToken) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
<<<<<<< HEAD
  // Constant-time comparison, so response timing cannot be used to guess the token a byte at a time.
  const given = Buffer.from(request.headers.get("x-callback-token") ?? "");
  const expected = Buffer.from(xenditToken);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
=======
  if (request.headers.get("x-callback-token") !== xenditToken) {
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { event, data } = body;

  if (event === "qr.paid" || data?.status === "COMPLETED") {
    // No UPDATE policy on payments for end users by design -> write with the service role.
    const supabase = getAdminSupabase();

    const { data: payment } = await supabase
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("xendit_charge_id", data.id)
      .select("*")
      .maybeSingle();

    if (payment) {
      await supabase.channel("payment-updates").send({
        type: "broadcast",
        event: "payment-paid",
        payload: payment,
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
