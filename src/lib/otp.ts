import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

/**
 * One-time codes for 2FA and phone verification, stored in the database (table otp_tokens,
 * migration 016) instead of a Map in the Node process.
 *
 * Why the Map had to go: on serverless the request that sends a code and the request that verifies
 * it can run on different instances, so a code kept in one instance's memory is invisible to the
 * other. Verification then fails for everybody in production.
 *
 * What is stored: only an HMAC of the code, keyed with a server secret. A 6-digit code has just a
 * million possibilities, so a plain hash could be reversed instantly by anyone who read the table.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpResult = "ok" | "invalid" | "expired" | "locked";

/** A random 6-digit code from the OS CSPRNG (Math.random is predictable and must not be used). */
export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

/**
 * The bucket a code belongs to. Tying it to the user id means a code sent to one account can never
 * be used to verify as another, even for the same email address or phone number.
 */
export function otpKey(userId: string, identifier: string): string {
  return `${userId}:${identifier.toLowerCase().trim()}`;
}

function secret(): string {
  const s = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("[otp] OTP_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not configured");
  return s;
}

function hashCode(key: string, code: string): string {
  return createHmac("sha256", secret()).update(`${key}:${code.trim()}`).digest("hex");
}

/** Save a fresh code. Any earlier code for the same key is replaced, so only the newest works. */
export async function storeOtp(key: string, code: string): Promise<void> {
  const { error } = await getAdminSupabase()
    .from("otp_tokens")
    .upsert(
      {
        identifier: key,
        code_hash: hashCode(key, code),
        attempts: 0,
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        used_at: null,
      },
      { onConflict: "identifier" },
    );
  if (error) throw new Error(`[otp] could not store code: ${error.message}`);
}

/**
 * Check a code. Single use, expires after 10 minutes, and locks after 5 wrong guesses — without
 * the lock, 10^6 combinations can be brute-forced.
 */
export async function verifyOtp(key: string, code: string): Promise<OtpResult> {
  const admin = getAdminSupabase();

  const { data: row } = await admin
    .from("otp_tokens")
    .select("id, code_hash, attempts, expires_at, used_at")
    .eq("identifier", key)
    .maybeSingle();

  if (!row || row.used_at) return "invalid";

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("otp_tokens").delete().eq("id", row.id);
    return "expired";
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from("otp_tokens").delete().eq("id", row.id);
    return "locked";
  }

  // Spend a guess BEFORE comparing. The update only matches while `attempts` still has the value we
  // read, so parallel requests cannot all slip through on the same count: the losers get "invalid".
  const { data: bumped } = await admin
    .from("otp_tokens")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts)
    .select("id");
  if (!bumped || bumped.length === 0) return "invalid";

  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashCode(key, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return "invalid";

  // Consume it. Matching only unused rows means two simultaneous correct submissions cannot both win.
  const { data: consumed } = await admin
    .from("otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id");

  return consumed && consumed.length > 0 ? "ok" : "invalid";
}

export const OTP_MESSAGES: Record<Exclude<OtpResult, "ok">, string> = {
  invalid: "Invalid or expired verification code.",
  expired: "That code has expired. Request a new one.",
  locked: "Too many wrong attempts. Request a new code.",
};
