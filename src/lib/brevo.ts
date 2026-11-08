import nodemailer from "nodemailer";

/**
 * Brevo Integration for HomeSure
 * Supports:
 * 1. Brevo Transactional Email (via REST API or SMTP)
 * 2. Brevo Transactional SMS (via REST API)
 * 3. 2FA OTP generation and storage
 */

export type BrevoEmailOptions = {
  to: string | { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { name: string; email: string };
};

export type BrevoSmsOptions = {
  to: string; // E.164 format or 09XX Philippine number
  content: string;
  sender?: string;
};

// Clean Brevo API Key
function getBrevoApiKey(): string {
  return (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SIB_API_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, "");
}

// Normalize phone numbers to Philippine format (+639XXXXXXXXX)
export function normalizePhilippinePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("09")) {
    cleaned = "+63" + cleaned.slice(1);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "+63" + cleaned;
  } else if (cleaned.startsWith("639") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

/**
 * Send Transactional Email via Brevo API or SMTP Relay
 */
export async function sendBrevoEmail(options: BrevoEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = getBrevoApiKey();
  const defaultSender = {
    name: "HomeSure Philippines",
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@homesure.ph",
  };

  const sender = options.sender || defaultSender;
  const toList = Array.isArray(options.to)
    ? options.to
    : [{ email: options.to, name: options.to.split("@")[0] }];

  // 1. Try Brevo REST API first if API key is provided
  if (apiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: toList,
          subject: options.subject,
          htmlContent: options.htmlContent,
          textContent: options.textContent || options.subject,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, messageId: data.messageId };
      }
      console.warn("Brevo API email failed, attempting SMTP fallback:", data);
    } catch (err: unknown) {
      console.warn("Brevo API network error, trying SMTP:", err);
    }
  }

  // 2. Fallback to SMTP relay (e.g., Brevo SMTP or custom SMTP from .env.local)
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: `"${sender.name}" <${sender.email}>`,
        to: toList.map(t => t.email).join(", "),
        subject: options.subject,
        text: options.textContent,
        html: options.htmlContent,
      });

      return { success: true, messageId: info.messageId };
    } catch (smtpErr: unknown) {
      const msg = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);
      console.error("SMTP relay error:", msg);
      return { success: false, error: msg };
    }
  }

  return { success: false, error: "Neither Brevo API Key nor SMTP credentials are configured" };
}

/**
 * Send Transactional SMS via Brevo API
 */
export async function sendBrevoSms(options: BrevoSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = getBrevoApiKey();
  const recipient = normalizePhilippinePhone(options.to);
  const sender = (options.sender || "HomeSure").slice(0, 11); // Brevo max sender length is 11 chars

  if (!apiKey) {
    console.warn("BREVO_API_KEY not configured. Simulating SMS to " + recipient + ": " + options.content);
    return { success: true, messageId: "simulated-" + Date.now() };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        recipient,
        content: options.content,
        type: "transactional",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, messageId: String(data.reference || data.messageId || "sent") };
    }

    console.error("Brevo SMS API returned error:", data);
    return { success: false, error: data.message || "Failed to send SMS via Brevo" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Brevo SMS network error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Generate a 6-digit random verification code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP storage with 10-minute expiry
// Key: email or phone -> { code: string, expiresAt: number }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function storeOtp(identifier: string, code: string): void {
  const key = identifier.toLowerCase().trim();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(key, { code, expiresAt });
}

export function verifyOtpCode(identifier: string, code: string): boolean {
  const key = identifier.toLowerCase().trim();
  // Allow master demo bypass in development or test if needed
  if (code === "123456" && process.env.NODE_ENV !== "production") {
    return true;
  }
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (entry.code === code.trim()) {
    otpStore.delete(key);
    return true;
  }
  return false;
}
