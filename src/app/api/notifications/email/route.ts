import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/brevo";

export const dynamic = "force-dynamic";

/**
 * Transactional Email Notifications via Brevo (Issue 4)
 * Allows sending custom email alerts (new listing, price drop, message, payment receipt, status change)
 */
export async function POST(request: Request) {
  try {
    const { to, subject, title, message, actionUrl, actionText } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Recipient email (to), subject, and message are required" }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <div style="background:#0d1b2a;padding:24px 32px;border-bottom:3px solid #00c9a7;">
          <h2 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:-0.3px;">HomeSure</h2>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">Property Platform &bull; Sta. Maria, Bulacan</p>
        </div>
        <div style="padding:32px 32px 24px;">
          ${title ? `<h3 style="color:#0f172a;margin:0 0 16px;font-size:18px;">${title}</h3>` : ""}
          <p style="font-size:14.5px;color:#334155;line-height:1.7;margin:0 0 24px;">
            ${message}
          </p>
          ${actionUrl ? `
            <div style="margin:24px 0;">
              <a href="${actionUrl}" style="display:inline-block;background:#00c9a7;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                ${actionText || "View Details"}
              </a>
            </div>
          ` : ""}
        </div>
        <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;font-size:11.5px;color:#94a3b8;line-height:1.6;">
          You received this email because of your notification preferences on HomeSure.<br>
          HomeSure Philippines &bull; Sta. Maria, Bulacan
        </div>
      </div>
    `;

    const result = await sendBrevoEmail({
      to,
      subject,
      htmlContent,
      textContent: message,
    });

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error || "Failed to send email notification" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Email notification sent via Brevo", messageId: result.messageId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
