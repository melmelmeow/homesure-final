import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  // Fail closed: without a configured token anybody could mark payments as paid.
  const xenditToken = process.env.XENDIT_CALLBACK_TOKEN;
  if (!xenditToken) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  // Constant-time comparison, so response timing cannot be used to guess the token a byte at a time.
  const given = Buffer.from(request.headers.get("x-callback-token") ?? "");
  const expected = Buffer.from(xenditToken);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
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
