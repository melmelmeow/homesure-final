# Security hardening + SSR conversion

## Do these before deploying
1. `npm install` (adds `zod`, `dompurify`, `server-only`; the lockfile needs regenerating).
2. Run `supabase/migrations/016_otp_and_rate_limits.sql` in the Supabase SQL editor.
3. **Rotate the Supabase service-role key.** It was readable from `NEXT_PUBLIC_SUPABASE_ROLE_KEY` in
   the browser bundle if that variable was ever set in a deployed build. Delete that variable
   (Vercel + `.env.local`), set `SUPABASE_SERVICE_ROLE_KEY`, redeploy.
4. Set `FRONTEND_ORIGINS` (production has no CORS defaults any more) and optionally `OTP_SECRET`.
5. Schedule `select public.purge_expired_security_rows();` hourly (pg_cron / Supabase scheduled job).

## Security findings
| # | Status | Where |
|---|---|---|
| 1 OTP in memory | Fixed, DB-backed, HMAC-hashed, single use, 5-try lock | `src/lib/otp.ts`, migration 016 |
| 2 "123456" bypass | Removed | `src/lib/brevo.ts` |
| 3 service key `NEXT_PUBLIC_` | Removed; `server-only` import guards the file | `src/lib/supabase/admin-client.ts` |
| 4 open AI route | Auth required for the paid model; anonymous gets free built-in answers; rate limited | `api/ai/customer-service` |
| 5 open OTP send | Auth required, code goes to the signed-in user's own email/phone only | `api/auth/2fa` |
| 6 open SMS | Auth required + limits | `api/auth/sms` |
| 7 SVG XSS | DOMPurify (React) / DOMParser sanitizer (static page) | `LandingPage.tsx`, `public/assets/js/index.js` |
| 8 rate limiting | Postgres-backed (works across serverless instances) on signup, forgot/reset password, resend, 2FA, SMS, AI, invoices, OCR | `src/lib/rate-limit.ts` |
| 9 Xendit error leak | Generic message, logged server-side. Same fix in refunds, payments, gsc-sync | routes |
| 10, 11 logging | `console.log(body)` removed | `api/auth/signup` |
| 12, 15 OCR path + public bucket | Path must be `<your user id>/<file>`; 60 s signed URL from the private `verification-docs` bucket | `api/verify/ocr` |
| 13 CORS | localhost defaults only outside production | `src/middleware.ts` |
| 14 Zod | Schemas on every JSON route | `src/lib/schemas.ts` |
| 16 placeholder Supabase client | Throws on missing env | `src/lib/supabase/client.ts` |

Deviations from the blueprint (the real code differed): the blueprint's in-memory rate limiter and
OTP table do not work on serverless, so both are in Postgres; the OCR route used a `titles` bucket
that no migration creates, so it now uses `verification-docs`; the blueprint's `used` flag and
bcrypt/sha256 were replaced by `used_at` and a keyed HMAC (6-digit codes are trivially reversible
from a plain hash). Also added: constant-time Xendit webhook token check.

## SSR conversion
Server-rendered with client islands: `/` (cached 60 s), `/browse` (GET-form filters), `/property/[id]`
(+ metadata), `/auth/login`, `/auth/signup`, `/buyer/{dashboard,payments,saved}`,
`/seller/{dashboard,listings}`, `/admin/{dashboard,users,listings,payments}`. Middleware refreshes the
Supabase cookie; every page calls `requireRole()` itself (layouts are not a reliable gate).

**Not converted:** seller "post listing" and ID/title verification, messages, viewings, super-admin and
the rest of `public/module/*`. They keep working as static pages. Important: those pages keep their
session in `localStorage`, the SSR pages in cookies, so signing in on one does not sign you in on the
other. Migrate the remaining pages (or bridge the session) before retiring the static front end.

## Not run
No dependencies could be installed here, so `npm run build`, `typecheck` and `lint` were NOT run, and
nothing was tested against a live Supabase. Run them before merging.
