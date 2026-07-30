import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const body = await request.json();
  const { event, data } = body;

  const xenditToken = process.env.XENDIT_CALLBACK_TOKEN;

  const callbackToken = request.headers.get("x-callback-token");
  if (xenditToken && callbackToken !== xenditToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (event === "qr.paid" || data?.status === "COMPLETED") {
    const { data: payment } = await supabase
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("xendit_charge_id", data.id)
      .select("*")
      .single();

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
