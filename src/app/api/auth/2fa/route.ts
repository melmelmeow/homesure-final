import { NextResponse } from "next/server";
import { sendBrevoEmail, sendBrevoSms } from "@/lib/brevo";
import { generateOtpCode, storeOtp, verifyOtp, otpKey, OTP_MESSAGES } from "@/lib/otp";
import { getGoogleConfig, getGoogleUserInfo } from "@/lib/auth/google";
import { guardApi } from "@/lib/api";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { twoFactorSchema, firstIssue } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * 2FA API endpoint for HomeSure
 * Supports:
 * - action: 'send' -> generates and sends 6-digit OTP code to user's email and/or SMS via Brevo
 * - action: 'verify' -> verifies entered 6-digit OTP code
 * - action: 'google_verify' -> verifies Google Client OAuth credential
 *
 * Security:
 *  - Every action needs a signed-in user. This route used to be open, so anyone could make it mail
 *    or text a code to any address or number and run up the Brevo bill.
 *  - The code is only ever sent to the signed-in user's OWN email and the phone number on their
 *    profile. Whatever email/phone the request body carries is ignored.
 *  - Limits: per user (the real control) plus a looser per-IP ceiling. The IP limit is deliberately
 *    loose because many mobile networks put thousands of people behind one address.
 *  - Codes live in the database, are single-use, expire after 10 minutes and lock after 5 wrong
 *    guesses (see src/lib/otp.ts).
 */
export async function POST(request: Request) {
  try {
    const guard = await guardApi();
    if (!guard.ok) return guard.response;
    const { supabase, user } = guard;

    const parsed = twoFactorSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: firstIssue(parsed.error) }, { status: 400 });
    }
    const input = parsed.data;
    const key = otpKey(user.id, "2fa");

    // 1. Send OTP (Email and/or SMS via Brevo)
    if (input.action === "send") {
      const ip = await rateLimitByIp(request, "2fa:send:ip", 20, 600);
      if (!ip.ok) return ip.response;
      const perUser = await rateLimit("2fa:send:user", user.id, 3, 600);
      if (!perUser.ok) return perUser.response;

      const email = user.email ?? "";
      const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
      const phone = (profile?.phone as string | undefined)?.trim() || "";

      if (!email && !phone) {
        return NextResponse.json({ ok: false, error: "Your account has no email or phone number on file." }, { status: 400 });
      }

      const otp = generateOtpCode();
      await storeOtp(key, otp);

      let emailSent = false;
      let smsSent = false;

      // Send via Brevo Email
      if (email) {
        const html = `
          <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
            <div style="background:#0d1b2a;padding:24px 28px;border-bottom:3px solid #00c9a7;">
              <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:-0.3px;">HomeSure Security</h2>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">Two-Factor Authentication</p>
            </div>
            <div style="padding:28px 28px 20px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Hello,</p>
              <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
                You are setting up or verifying Two-Factor Authentication for your HomeSure account. Use the 6-digit code below to complete the verification:
              </p>
              <div style="background:#f1f5f9;border:1.5px dashed #00c9a7;border-radius:12px;padding:16px;text-align:center;margin:0 0 20px;">
                <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#0f766e;font-family:monospace;">${otp}</span>
              </div>
              <p style="font-size:12.5px;color:#64748b;line-height:1.5;margin:0 0 8px;">
                This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
              <p style="font-size:12.5px;color:#94a3b8;margin:16px 0 0;">
                If you did not request this, please change your password immediately.
              </p>
            </div>
            <div style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
              HomeSure Philippines &bull; Sta. Maria, Bulacan
            </div>
          </div>
        `;

        const res = await sendBrevoEmail({
          to: email,
          subject: `Your HomeSure 2FA Code: ${otp}`,
          htmlContent: html,
          textContent: `Your HomeSure Two-Factor Authentication code is: ${otp}. Valid for 10 minutes.`,
        });
        emailSent = res.success;
      }

      // Send via Brevo SMS if phone provided
      if (phone) {
        const smsRes = await sendBrevoSms({
          to: phone,
          content: `HomeSure: Your 2FA security code is ${otp}. Valid for 10 minutes. Do not share.`,
        });
        smsSent = smsRes.success;
      }

      return NextResponse.json({
        ok: true,
        message: "Verification code sent successfully",
        method: email && phone ? "email_and_sms" : email ? "email" : "sms",
        emailSent,
        smsSent,
      });
    }

    // 2. Verify OTP
    if (input.action === "verify") {
      const ip = await rateLimitByIp(request, "2fa:verify:ip", 60, 300);
      if (!ip.ok) return ip.response;
      const perUser = await rateLimit("2fa:verify:user", user.id, 10, 300);
      if (!perUser.ok) return perUser.response;

      const result = await verifyOtp(key, input.code);
      if (result !== "ok") {
        return NextResponse.json({ ok: false, error: OTP_MESSAGES[result] }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: "Two-Factor Authentication verified and enabled successfully!",
      });
    }

    // 3. Verify with Google Client
    if (input.action === "google_verify") {
      const ip = await rateLimitByIp(request, "2fa:google:ip", 20, 300);
      if (!ip.ok) return ip.response;

      const config = getGoogleConfig();
      if (!config) {
        return NextResponse.json({ ok: false, error: "Google OAuth client is not configured" }, { status: 500 });
      }

      try {
        const userInfo = await getGoogleUserInfo(input.googleToken);
        // Compare against the signed-in account's email, not one supplied in the request body.
        if (userInfo.email && user.email && userInfo.email.toLowerCase() !== user.email.toLowerCase()) {
          return NextResponse.json({
            ok: false,
            error: "That Google account does not match your Kasafide account email.",
          }, { status: 400 });
        }

        return NextResponse.json({
          ok: true,
          message: "Google Client identity verified successfully!",
          googleEmail: userInfo.email,
        });
      } catch (err: unknown) {
        console.error("[2fa] Google token check failed:", err instanceof Error ? err.message : err);
        return NextResponse.json({ ok: false, error: "Google token verification failed" }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[2fa] unexpected error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
