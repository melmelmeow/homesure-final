import fs from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing mail for Kasafide.
 *
 * This lives in the Next.js app rather than in the Supabase auth server on purpose: that server
 * belongs to someone else and has no SMTP configured, so its own confirmation mail fails. Sending
 * from here means the whole flow is driven by `.env.local`, which is ours to change.
 *
 * Works with any SMTP provider — Brevo, Gmail, Mailtrap, Resend's SMTP bridge. Nothing here is
 * specific to one of them.
 */

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

/** Reads the SMTP settings, or says exactly which one is missing. */
export function smtpConfig(): { ok: true; config: SmtpConfig } | { ok: false; missing: string[] } {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  const missing = Object.entries({ SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASSWORD: pass, SMTP_FROM: from })
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) return { ok: false, missing };

  const portNumber = Number(port);
  return {
    ok: true,
    config: {
      host: host!,
      port: portNumber,
      // 465 is implicit TLS; 587 and 2525 start plain and upgrade with STARTTLS.
      secure: portNumber === 465,
      user: user!,
      pass: pass!,
      from: from!,
    },
  };
}

export function isEmailConfigured(): boolean {
  return smtpConfig().ok;
}

let transporter: Transporter | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
  }
  return transporter;
}

/** An image sent with the message and referenced as cid:<cid> from the HTML. */
export type InlineImage = { filename: string; path: string; cid: string };

export async function sendMail({ to, subject, html, text, images }: {
  to: string; subject: string; html: string; text: string; images?: InlineImage[];
}): Promise<void> {
  const settings = smtpConfig();
  if (!settings.ok) {
    throw new Error(`Email is not configured on this server (missing ${settings.missing.join(", ")}).`);
  }

  await getTransporter(settings.config).sendMail({
    from: settings.config.from,
    to,
    subject,
    text,
    html,
    // Attached rather than linked. A linked image needs a public URL, and on localhost there is
    // none — the logo would be a broken box for everyone but the sender.
    attachments: images?.map((img) => ({
      filename: img.filename,
      path: img.path,
      cid: img.cid,
      contentDisposition: "inline" as const,
    })),
  });
}

/** The Kasafide mark, attached to every message so it renders with no public URL. */
export function brandImages(): InlineImage[] {
  const logo = path.join(process.cwd(), "public", "assets", "img", "kasafide-logo-email.png");
  if (!fs.existsSync(logo)) return [];
  return [{ filename: "kasafide.png", path: logo, cid: "kasafide-logo" }];
}

/** The address the verification link points back at. */
export function appOrigin(request: Request): string {
  const configured = process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/+$/, "");

  // Behind a proxy the forwarded headers are the only honest source; otherwise use the Host.
  const headers = request.headers;
  const proto = headers.get("x-forwarded-proto") ?? "http";
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

// Brand colours, matching the site (public/assets/css/kasafide-theme.css). Email clients do not
// support CSS variables, so the values are spelled out here once and nowhere else in this file.
const PEACH = "#FF8A65";
const PLUM = "#5B3A8E";
const INK = "#2B1B3D";
const MUTED = "#6B5A80";
const SOFT_TEXT = "#4A3B5E";
const CREAM = "#FBF6F0";
const LILAC = "#F1E9F7";
const LINE = "#E3D8EE";

/**
 * The confirmation email.
 *
 * Built with tables and inline styles on purpose. Mail clients are roughly fifteen years behind
 * browsers: Gmail strips <style> blocks, Outlook renders through Word, and flexbox and grid are
 * not available in either. Tables are the only layout that survives all of them.
 */
export function verificationEmail({ firstName, link }: { firstName: string; link: string }) {
  const hello = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";

  const text = [
    firstName ? `Hi ${firstName}, welcome to Kasafide.` : "Welcome to Kasafide.",
    "",
    "We are glad you are here. One tap on the link below confirms your email, and your account is",
    "ready to use:",
    "",
    link,
    "",
    "After that you can browse listings, message sellers and save the places you like.",
    "",
    "The link lasts 24 hours. If it expires, ask for a new one from the sign-in page.",
    "",
    "Not you? Nothing to do. Ignore this and no account will be created.",
    "",
    "See you soon,",
    "The Kasafide team",
    "Sta. Maria, Bulacan",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Confirm your Kasafide email</title>
  </head>
  <body style="margin:0;padding:0;background:${LILAC};">
    <!-- Shown in the inbox list under the subject, before anyone opens it. -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      One tap and you are in. Your Kasafide account is almost ready.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LILAC};">
      <tr>
        <td align="center" style="padding:32px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                 style="width:600px;max-width:100%;background:${CREAM};border-radius:16px;overflow:hidden;
                        box-shadow:0 2px 16px rgba(43,27,61,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:${PLUM};padding:32px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:12px;vertical-align:middle;">
                      <img src="cid:kasafide-logo" width="40" height="40" alt=""
                           style="display:block;width:40px;height:40px;border:0;">
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;
                                  font-weight:800;color:${CREAM};letter-spacing:-0.4px;line-height:1;">
                        Kasafide
                      </div>
                      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;
                                  color:rgba(255,255,255,0.55);margin-top:4px;letter-spacing:0.3px;">
                        Sta. Maria, Bulacan
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Teal rule under the header -->
            <tr><td style="height:4px;background:${PEACH};font-size:0;line-height:0;">&nbsp;</td></tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 40px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                <div style="font-size:26px;font-weight:800;color:${INK};letter-spacing:-0.5px;margin-bottom:18px;">
                  Welcome to Kasafide
                </div>
                <p style="font-size:15.5px;color:${INK};line-height:1.7;margin:0 0 14px;">${hello}</p>
                <p style="font-size:15.5px;color:${SOFT_TEXT};line-height:1.75;margin:0 0 14px;">
                  We are glad you are here. One tap below confirms your email, and your account is
                  ready to use.
                </p>
                <p style="font-size:15.5px;color:${SOFT_TEXT};line-height:1.75;margin:0 0 30px;">
                  After that you can browse listings, message sellers directly, and save the places
                  you want to come back to.
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center" style="padding:0 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="background:${PEACH};border-radius:10px;">
                      <a href="${escapeHtml(link)}"
                         style="display:inline-block;padding:15px 40px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                font-size:15px;font-weight:700;color:${INK};text-decoration:none;letter-spacing:0.2px;">
                        Yes, this is me
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:0 40px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                <div style="border-top:1px solid ${LINE};padding-top:20px;">
                  <div style="font-size:12px;color:${MUTED};margin-bottom:6px;">
                    Button not working? Paste this into your browser:
                  </div>
                  <div style="font-size:12px;color:${SOFT_TEXT};word-break:break-all;line-height:1.5;">
                    ${escapeHtml(link)}
                  </div>
                </div>
              </td>
            </tr>

            <!-- What Kasafide is, for anyone who does not recognise the name -->
            <tr>
              <td style="padding:0 40px 36px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="background:${LILAC};border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-size:13.5px;font-weight:700;color:${INK};margin-bottom:7px;">
                        You are dealing with real people here
                      </div>
                      <div style="font-size:13px;color:${SOFT_TEXT};line-height:1.65;">
                        We check identity documents and land titles before any listing goes live. No
                        ghost listings, no sellers who cannot prove the property is theirs.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:${CREAM};border-top:1px solid ${LINE};padding:24px 40px;
                         font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                <div style="font-size:12px;color:${MUTED};line-height:1.7;">
                  The link lasts 24 hours. If it expires, just ask for a new one from the sign-in page.
                </div>
                <div style="font-size:12px;color:${MUTED};line-height:1.7;margin-top:10px;">
                  Not you? Nothing to do — ignore this and no account will be created.
                </div>
                <div style="font-size:12px;color:${MUTED};margin-top:16px;">
                  See you soon,<br>
                  <span style="color:${MUTED};font-weight:600;">The Kasafide team</span><br>
                  <span style="color:${MUTED};">Sta. Maria, Bulacan</span>
                </div>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: "Confirm your Kasafide email", text, html, images: brandImages() };
}

/**
 * The password-reset email. Same look as the confirmation email above (tables and inline styles
 * for the same reasons). Sent by POST /api/auth/forgot-password rather than by the Supabase auth
 * server, whose mailer has no SMTP and still carried the old HomeSure branding.
 */
export function passwordResetEmail({ firstName, link, minutes }: { firstName: string; link: string; minutes: number }) {
  const hello = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const safeLink = escapeHtml(link);

  const text = [
    firstName ? `Hi ${firstName},` : "Hi,",
    "",
    "We got a request to reset the password for your Kasafide account. Open the link below to",
    "choose a new one:",
    "",
    link,
    "",
    `The link works once and lasts ${minutes} minutes.`,
    "",
    "Did not ask for this? Ignore this email. Your password stays the same.",
    "",
    "The Kasafide team",
    "Sta. Maria, Bulacan",
  ].join("\n");

  const font = "font-family:'Segoe UI',Helvetica,Arial,sans-serif;";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Reset your Kasafide password</title>
  </head>
  <body style="margin:0;padding:0;background:${LILAC};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Someone asked to reset your Kasafide password. If it was you, the link is inside.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LILAC};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                 style="width:600px;max-width:100%;background:${CREAM};border-radius:16px;overflow:hidden;
                        box-shadow:0 2px 16px rgba(43,27,61,0.08);">
            <tr>
              <td style="background:${PLUM};padding:32px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:12px;vertical-align:middle;">
                      <img src="cid:kasafide-logo" width="40" height="40" alt=""
                           style="display:block;width:40px;height:40px;border:0;">
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="${font}font-size:22px;font-weight:800;color:${CREAM};letter-spacing:-0.4px;line-height:1;">Kasafide</div>
                      <div style="${font}font-size:12px;color:rgba(255,255,255,0.55);margin-top:4px;letter-spacing:0.3px;">Sta. Maria, Bulacan</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td style="height:4px;background:${PEACH};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:40px 40px 8px;${font}">
                <div style="font-size:26px;font-weight:800;color:${INK};letter-spacing:-0.5px;margin-bottom:18px;">Reset your password</div>
                <p style="font-size:15.5px;color:${INK};line-height:1.7;margin:0 0 14px;">${hello}</p>
                <p style="font-size:15.5px;color:${SOFT_TEXT};line-height:1.75;margin:0 0 30px;">
                  We got a request to reset the password for your Kasafide account. Tap the button
                  below to choose a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="background:${PEACH};border-radius:10px;">
                      <a href="${safeLink}"
                         style="display:inline-block;padding:15px 40px;${font}font-size:15px;font-weight:700;color:${INK};text-decoration:none;letter-spacing:0.2px;">
                        Choose a new password
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;${font}">
                <div style="border-top:1px solid ${LINE};padding-top:20px;">
                  <div style="font-size:12px;color:${MUTED};margin-bottom:6px;">Button not working? Paste this into your browser:</div>
                  <div style="font-size:12px;color:${SOFT_TEXT};word-break:break-all;line-height:1.5;">${safeLink}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:${CREAM};border-top:1px solid ${LINE};padding:24px 40px;${font}">
                <div style="font-size:12px;color:${MUTED};line-height:1.7;">The link works once and lasts ${minutes} minutes.</div>
                <div style="font-size:12px;color:${MUTED};line-height:1.7;margin-top:10px;">
                  Did not ask for this? Ignore this email. Your password stays the same.
                </div>
                <div style="font-size:12px;color:${MUTED};margin-top:16px;">
                  <span style="font-weight:600;">The Kasafide team</span><br>Sta. Maria, Bulacan
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: "Reset your Kasafide password", text, html, images: brandImages() };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
