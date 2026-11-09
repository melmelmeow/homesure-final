import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
<<<<<<< HEAD
import { rateLimit } from "@/lib/rate-limit";
import { createInvoiceSchema, firstIssue } from "@/lib/schemas";
=======

type Body = {
  propertyId?: string;
  purpose?: string;
  period?: string;
  dueDate?: string;
  depositMonths?: number;
};

const PURPOSES = ["rent", "security", "both", "reservation", "sale"];
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6

export async function POST(request: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

<<<<<<< HEAD
  // Each call creates a real Xendit QR code, so keep one user from creating them in a loop.
  const limited = await rateLimit("create-invoice", user.id, 10, 600);
  if (!limited.ok) return limited.response;

  const parsed = createInvoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { propertyId, purpose = "rent", period, dueDate, depositMonths: months = 1 } = parsed.data;
=======
  const { propertyId, purpose = "rent", period, dueDate, depositMonths = 1 } =
    ((await request.json().catch(() => ({}))) as Body);

  if (!propertyId) return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  if (!PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: `purpose must be one of ${PURPOSES.join(", ")}` }, { status: 400 });
  }
  const months = Math.trunc(Number(depositMonths));
  if (!Number.isFinite(months) || months < 1 || months > 3) {
    return NextResponse.json({ error: "depositMonths must be 1, 2 or 3" }, { status: 400 });
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ error: "dueDate must be YYYY-MM-DD" }, { status: 400 });
  }
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6

  // RLS only lets the caller see publicly visible (admin-approved) listings.
  const { data: property } = await supabase
    .from("properties")
    .select("id, price, status, lifecycle_status, listing_type, landowner_id")
    .eq("id", propertyId)
    .single();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.status !== "approved") return NextResponse.json({ error: "Property is not available" }, { status: 400 });
  if (property.lifecycle_status === "sold" || property.lifecycle_status === "rented") {
    return NextResponse.json({ error: "Property is no longer available" }, { status: 400 });
  }
  if (property.landowner_id === user.id) {
    return NextResponse.json({ error: "You cannot pay for your own listing" }, { status: 400 });
  }

  // The amount is computed here, never taken from the request: a client that could name its own
  // price could pay ₱1 for a ₱15,000 month.
  const price = Number(property.price);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "This listing has no usable price" }, { status: 400 });
  }
  const amount =
    purpose === "security" ? price * months :
    purpose === "both"     ? price + price * months :
    price;

  const xenditSecret = process.env.XENDIT_SECRET_KEY;
  if (!xenditSecret) return NextResponse.json({ error: "Xendit not configured" }, { status: 500 });

  const auth = Buffer.from(`${xenditSecret}:`).toString("base64");
  const referenceId = `property-${propertyId}-${Date.now()}`;

  const xenditRes = await fetch("https://api.xendit.co/qr_codes", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: referenceId,
      amount,
      currency: "PHP",
      channel_codes: ["PH_QRPH"],
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });

  if (!xenditRes.ok) {
<<<<<<< HEAD
    // Log the gateway's answer here; never forward it to the browser. Payment-gateway error bodies
    // can carry internal reference ids and account details.
    const err = await xenditRes.text();
    console.error("[Xendit] QR code creation failed:", xenditRes.status, err);
    return NextResponse.json(
      { error: "Payment could not be initiated. Please try again or contact support." },
      { status: 502 },
    );
=======
    const err = await xenditRes.text();
    return NextResponse.json({ error: `Xendit error: ${err}` }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  }

  const qr = await xenditRes.json();

  // No INSERT policy on payments for end users by design -> write with the service role.
  const { data: payment, error } = await getAdminSupabase()
    .from("payments")
    .insert({
      property_id: propertyId,
      user_id: user.id,
      amount,
      currency: "PHP",
      purpose,
      type: property.listing_type === "rent" ? "rent" : "sale",
      period: period || null,
      due_date: dueDate || null,
      method: "QRPH",
      reference: referenceId,
      xendit_charge_id: qr.id,
      xendit_qr_string: qr.qr_string,
      qr_code_url: qr.qr_code_url,
      status: "pending",
    })
    .select("*")
    .single();

<<<<<<< HEAD
  if (error) {
    console.error("[create-invoice] could not record payment:", error.message);
    return NextResponse.json({ error: "Could not record the payment. Please try again." }, { status: 500 });
  }
=======
  if (error) return NextResponse.json({ error: `Could not record payment: ${error.message}` }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6

  return NextResponse.json({ payment, qr }, { status: 200 });
}
