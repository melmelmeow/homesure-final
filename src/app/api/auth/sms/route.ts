import { NextResponse } from "next/server";
import { sendBrevoSms, normalizePhilippinePhone } from "@/lib/brevo";
import { generateOtpCode, storeOtp, verifyOtp, otpKey, OTP_MESSAGES } from "@/lib/otp";
import { guardApi } from "@/lib/api";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { smsSchema, firstIssue } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
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

      const smsResult = await sendBrevoSms({
        to: phone,
        content: `HomeSure verification code: ${otp}. Valid for 10 minutes. Do not share this code.`,
      });

      if (!smsResult.success) {
        console.error("[sms] send failed:", smsResult.error);
        return NextResponse.json({ ok: false, error: "We could not send the SMS. Please try again shortly." }, { status: 502 });
      }

      return NextResponse.json({
        ok: true,
        message: "SMS verification code sent",
        reference: smsResult.messageId,
      });
    }

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
  }
}
