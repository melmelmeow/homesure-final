import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { PAYMENT_PURPOSES, MANUAL_METHODS, amountFor, isValidDueDate, type PaymentPurpose } from "@/lib/payments";

type Body = {
  paymentId?: string;      // paying off a payment that was already raised
  propertyId?: string;     // or starting a new one
  purpose?: string;
  period?: string;
  dueDate?: string;
  depositMonths?: number;
  method?: string;
  reference?: string;
  proofPath?: string;      // path inside the payment-proofs bucket
};

/**
 * Record a payment made outside Xendit — GCash, a bank slip, cash. Nothing is confirmed here: the
 * row lands on `pending_confirmation` and the seller decides in /api/payments/confirm.
 *
 * There is no INSERT or UPDATE policy on payments for end users, so this writes with the service
 * role and does the ownership checks itself.
 */
export async function POST(request: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  const body = (await request.json().catch(() => ({}))) as Body;
  const { paymentId, propertyId, purpose = "rent", period, dueDate, depositMonths = 1, method, reference, proofPath } = body;

  if (!method || !MANUAL_METHODS.includes(method as (typeof MANUAL_METHODS)[number])) {
    return NextResponse.json({ error: `method must be one of ${MANUAL_METHODS.join(", ")}` }, { status: 400 });
  }
  if (!proofPath || typeof proofPath !== "string") {
    return NextResponse.json({ error: "proofPath is required" }, { status: 400 });
  }
  // The bucket policy already pins uploads to the caller's folder; this stops a caller attaching
  // somebody else's file to their own payment.
  if (!proofPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "proofPath must be a file you uploaded" }, { status: 403 });
  }
  if (dueDate && !isValidDueDate(dueDate)) {
    return NextResponse.json({ error: "dueDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const now = new Date().toISOString();

  // ── Paying off a payment that already exists ──────────────────────────────────
  if (paymentId) {
    const { data: existing } = await admin
      .from("payments")
      .select("id, user_id, status")
      .eq("id", paymentId)
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (existing.status !== "pending" && existing.status !== "rejected") {
      return NextResponse.json({ error: `This payment is already ${existing.status}` }, { status: 409 });
    }

    const { data: payment, error } = await admin
      .from("payments")
      .update({
        status: "pending_confirmation",
        method,
        reference: reference || null,
        proof_url: proofPath,
        paid_at: now,
        rejection_reason: null,
      })
      .eq("id", paymentId)
      .select("*")
      .single();

<<<<<<< HEAD
    if (error) {
      console.error("[payments/manual-proof] insert failed:", error.message);
      return NextResponse.json({ error: "Could not record the payment. Please try again." }, { status: 500 });
    }
=======
    if (error) return NextResponse.json({ error: `Could not record payment: ${error.message}` }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
    return NextResponse.json({ payment }, { status: 200 });
  }

  // ── Starting a new one ────────────────────────────────────────────────────────
  if (!propertyId) return NextResponse.json({ error: "paymentId or propertyId is required" }, { status: 400 });
  if (!PAYMENT_PURPOSES.includes(purpose as PaymentPurpose)) {
    return NextResponse.json({ error: `purpose must be one of ${PAYMENT_PURPOSES.join(", ")}` }, { status: 400 });
  }
  const months = Math.trunc(Number(depositMonths));
  if (!Number.isFinite(months) || months < 1 || months > 3) {
    return NextResponse.json({ error: "depositMonths must be 1, 2 or 3" }, { status: 400 });
  }

  // RLS only lets the caller see publicly visible listings.
  const { data: property } = await supabase
    .from("properties")
    .select("id, price, status, lifecycle_status, listing_type, landowner_id")
    .eq("id", propertyId)
    .single();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landowner_id === user.id) {
    return NextResponse.json({ error: "You cannot pay for your own listing" }, { status: 400 });
  }

  const price = Number(property.price);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "This listing has no usable price" }, { status: 400 });
  }

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      property_id: propertyId,
      user_id: user.id,
      amount: amountFor(price, purpose as PaymentPurpose, months),
      currency: "PHP",
      purpose,
      type: property.listing_type === "rent" ? "rent" : "sale",
      period: period || null,
      due_date: dueDate || null,
      method,
      reference: reference || null,
      proof_url: proofPath,
      paid_at: now,
      status: "pending_confirmation",
    })
    .select("*")
    .single();

<<<<<<< HEAD
  if (error) {
    console.error("[payments/manual-proof] insert failed:", error.message);
    return NextResponse.json({ error: "Could not record the payment. Please try again." }, { status: 500 });
  }
=======
  if (error) return NextResponse.json({ error: `Could not record payment: ${error.message}` }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  return NextResponse.json({ payment }, { status: 201 });
}
