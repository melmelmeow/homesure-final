import "server-only";
import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

/**
 * Rate limiting backed by the database (table rate_limits + function hit_rate_limit, migration 016).
 *
 * An in-process Map is not good enough here: on serverless each instance has its own memory, so an
 * attacker who is spread across instances is never counted. The counter lives in Postgres and one
 * atomic statement bumps it, so every instance sees the same number.
 *
 * Behaviour if the database call itself fails: in production the request is refused (these routes
 * guard SMS/email spend and OTP guessing, so "can't count" must not mean "unlimited"); in
 * development it is allowed through so a missing migration does not block local work.
 */

export type RateLimitResult = { ok: true } | { ok: false; response: NextResponse };

/**
 * Best-effort client address. Vercel and most reverse proxies set x-real-ip / x-forwarded-for;
 * if you deploy behind something else, make sure it overwrites these headers rather than
 * appending to whatever the client sent.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/**
 * @param name       logical bucket, e.g. "2fa:send"
 * @param id         who is being limited (an IP or a user id)
 * @param limit      requests allowed per window
 * @param windowSec  window length in seconds
 */
export async function rateLimit(name: string, id: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  try {
    const { data, error } = await getAdminSupabase().rpc("hit_rate_limit", {
      p_bucket: `${name}:${id}`,
      p_limit: limit,
      p_window_seconds: windowSec,
    });
    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      const retryAfter = Math.max(1, Number(row.retry_after) || windowSec);
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Too many requests. Please wait before trying again.", retryAfter },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        ),
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("[rate-limit] could not count a request:", err instanceof Error ? err.message : err);
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Service temporarily unavailable. Please try again shortly." },
          { status: 503 },
        ),
      };
    }
    return { ok: true };
  }
}

export function rateLimitByIp(request: Request, name: string, limit: number, windowSec: number) {
  return rateLimit(name, clientIp(request), limit, windowSec);
}
