import { NextResponse } from "next/server";
import { generateOtpCode, storeOtp, verifyOtpCode, sendBrevoSms } from "@/lib/brevo";

export const dynamic = "force-dynamic";

/**
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

      const smsResult = await sendBrevoSms({
        to: phone,
        content: `HomeSure verification code: ${otp}. Valid for 10 minutes. Do not share this code.`,
      });

      if (!smsResult.success) {
        return NextResponse.json({ ok: false, error: smsResult.error || "Failed to send SMS" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "SMS verification code sent via Brevo",
        reference: smsResult.messageId,
      });
    }

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
  }
}
