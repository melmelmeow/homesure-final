import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { propertyId } = body;

  const { data: property } = await supabase.from("properties").select("*").eq("id", propertyId).single();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.verification_state !== "verified") return NextResponse.json({ error: "Property is not verified" }, { status: 400 });

  const xenditSecret = process.env.XENDIT_SECRET_KEY;
  if (!xenditSecret) return NextResponse.json({ error: "Xendit not configured" }, { status: 500 });

  const auth = Buffer.from(`${xenditSecret}:`).toString("base64");

  const xenditRes = await fetch("https://api.xendit.co/qr_codes", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: `property-${propertyId}-${Date.now()}`,
      amount: property.price,
      currency: "PHP",
      channel_codes: ["PH_QRPH"],
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });

  if (!xenditRes.ok) {
    const err = await xenditRes.text();
    return NextResponse.json({ error: `Xendit error: ${err}` }, { status: 500 });
  }

  const qr = await xenditRes.json();

  const { data: payment } = await supabase
    .from("payments")
    .insert({
      property_id: propertyId,
      buyer_id: session.user.id,
      amount: property.price,
      xendit_charge_id: qr.id,
      xendit_qr_string: qr.qr_string,
      qr_code_url: qr.qr_code_url,
      status: "pending",
    })
    .select("*")
    .single();

  return NextResponse.json({ payment, qr }, { status: 200 });
}
