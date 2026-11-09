import { NextResponse } from "next/server";
<<<<<<< HEAD
import { sendBrevoSms, normalizePhilippinePhone } from "@/lib/brevo";
import { generateOtpCode, storeOtp, verifyOtp, otpKey, OTP_MESSAGES } from "@/lib/otp";
import { guardApi } from "@/lib/api";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { smsSchema, firstIssue } from "@/lib/schemas";
=======
import { generateOtpCode, storeOtp, verifyOtpCode, sendBrevoSms } from "@/lib/brevo";
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6

export const dynamic = "force-dynamic";

/**
<<<<<<< HEAD
 * Phone-number verification by SMS (Brevo).
 * - action: 'send'   -> sends a 6-digit code to the phone number
 * - action: 'verify' -> checks the code
 *
 * Security: signed-in users only (the route used to be open to the whole internet, so anyone could
 * make it text any number), rate limited per user and per IP, and the code is bound to the user and
 * the number it was sent to, stored in the database, single use, and locked after 5 wrong guesses.
 */
export async function POST(request: Request) {
  try {
    const guard = await guardApi();
    if (!guard.ok) return guard.response;
    const { user } = guard;

    const parsed = smsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { action, phone, code } = parsed.data;
    const key = otpKey(user.id, `sms:${normalizePhilippinePhone(phone)}`);

    if (action === "send") {
      const ip = await rateLimitByIp(request, "sms:send:ip", 20, 600);
      if (!ip.ok) return ip.response;
      const perUser = await rateLimit("sms:send:user", user.id, 5, 600);
      if (!perUser.ok) return perUser.response;

      const otp = generateOtpCode();
      await storeOtp(key, otp);
=======
 * SMS Authentication via Brevo (Issue 5)
 * - action: 'send' -> sends 6-digit OTP to mobile phone number via Brevo SMS API
 * - action: 'verify' -> validates 6-digit SMS OTP
 */
export async function POST(request: Request) {
  try {
    const { action, phone, code } = await request.json();

    if (!phone) {
      return NextResponse.json({ ok: false, error: "Phone number is required" }, { status: 400 });
    }

    if (action === "send") {
      const otp = generateOtpCode();
      storeOtp(phone, otp);
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6

      const smsResult = await sendBrevoSms({
        to: phone,
        content: `HomeSure verification code: ${otp}. Valid for 10 minutes. Do not share this code.`,
      });

      if (!smsResult.success) {
<<<<<<< HEAD
        console.error("[sms] send failed:", smsResult.error);
        return NextResponse.json({ ok: false, error: "We could not send the SMS. Please try again shortly." }, { status: 502 });
=======
        return NextResponse.json({ ok: false, error: smsResult.error || "Failed to send SMS" }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
      }

      return NextResponse.json({
        ok: true,
<<<<<<< HEAD
        message: "SMS verification code sent",
=======
        message: "SMS verification code sent via Brevo",
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
        reference: smsResult.messageId,
      });
    }

<<<<<<< HEAD
    // action === "verify"
    if (!code) {
      return NextResponse.json({ ok: false, error: "Verification code is required" }, { status: 400 });
    }
    const ip = await rateLimitByIp(request, "sms:verify:ip", 60, 300);
    if (!ip.ok) return ip.response;
    const perUser = await rateLimit("sms:verify:user", user.id, 10, 300);
    if (!perUser.ok) return perUser.response;

    const result = await verifyOtp(key, code);
    if (result !== "ok") {
      return NextResponse.json({ ok: false, error: OTP_MESSAGES[result] }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Phone number verified successfully!" });
  } catch (err: unknown) {
    console.error("[sms] unexpected error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
=======
    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ ok: false, error: "Verification code is required" }, { status: 400 });
      }

      const isValid = verifyOtpCode(phone, code);
      if (!isValid) {
        return NextResponse.json({ ok: false, error: "Invalid or expired SMS verification code" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: "Phone number verified successfully!",
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
  }
}
