import { NextResponse } from "next/server";
import { generateOtpCode, storeOtp, verifyOtpCode, sendBrevoEmail, sendBrevoSms } from "@/lib/brevo";
import { getGoogleConfig, getGoogleUserInfo } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

/**
 * 2FA API endpoint for HomeSure
 * Supports:
 * - action: 'send' -> generates and sends 6-digit OTP code to user's email and/or SMS via Brevo
 * - action: 'verify' -> verifies entered 6-digit OTP code
 * - action: 'google_verify' -> verifies Google Client OAuth credential
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, phone, code, googleToken } = body;

    // 1. Send OTP (Email and/or SMS via Brevo)
    if (action === "send") {
      if (!email && !phone) {
        return NextResponse.json({ ok: false, error: "Email or phone number is required" }, { status: 400 });
      }

      const otp = generateOtpCode();
      const identifier = email || phone;
      storeOtp(identifier, otp);

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
    if (action === "verify") {
      const identifier = email || phone;
      if (!identifier || !code) {
        return NextResponse.json({ ok: false, error: "Identifier and code are required" }, { status: 400 });
      }

      const isValid = verifyOtpCode(identifier, code);
      if (!isValid) {
        return NextResponse.json({ ok: false, error: "Invalid or expired verification code." }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: "Two-Factor Authentication verified and enabled successfully!",
      });
    }

    // 3. Verify with Google Client
    if (action === "google_verify") {
      const config = getGoogleConfig();
      if (!config) {
        return NextResponse.json({ ok: false, error: "Google OAuth client is not configured" }, { status: 500 });
      }

      if (!googleToken) {
        return NextResponse.json({ ok: false, error: "Google access token is required" }, { status: 400 });
      }

      try {
        const userInfo = await getGoogleUserInfo(googleToken);
        if (email && userInfo.email && userInfo.email.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({
            ok: false,
            error: `Google account (${userInfo.email}) does not match your account email (${email})`,
          }, { status: 400 });
        }

        return NextResponse.json({
          ok: true,
          message: "Google Client identity verified successfully!",
          googleEmail: userInfo.email,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google token verification failed";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
