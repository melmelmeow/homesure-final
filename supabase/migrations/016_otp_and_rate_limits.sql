-- ═════════════════════════════════════════════════════════════════════════════
-- 016_otp_and_rate_limits.sql
-- Run AFTER 011 and 015. Safe to re-run.
--
-- Why this exists (security audit VULN-1 and VULN-8)
--   * One-time codes (2FA email/SMS) were kept in a Map in the Node process. On serverless every
--     request may land on a different instance, so a code stored by one instance is invisible to
--     the one that verifies it. They now live here.
--   * Rate limits were not enforced anywhere. An in-process counter has the same serverless
--     problem as the OTP Map, so the counters live here too and are bumped by one atomic function.
--
-- Both tables are for the API routes only (service role). 011 sets default privileges that open
-- every NEW table to anon/authenticated, so each table below turns RLS on with no policy AND
-- revokes the grants explicitly. Without that, any signed-in user could read the code hashes.
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Run the earlier migrations first (table "profiles" does not exist)';
  END IF;
END $$;

-- ── One-time codes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- "<user id>:<email or phone, lowercased>" — a code is bound to the account that asked for it.
  identifier  text NOT NULL,
  -- HMAC-SHA256 of the code. The plain code is never stored.
  code_hash   text NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_tokens_identifier ON otp_tokens (identifier);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires ON otp_tokens (expires_at);

ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE otp_tokens FROM anon, authenticated;
GRANT ALL ON TABLE otp_tokens TO service_role;

-- ── Rate limit counters ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket     text PRIMARY KEY,                -- "<name>:<ip or user id>"
  hits       integer NOT NULL DEFAULT 0,
  reset_at   timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits (reset_at);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE rate_limits TO service_role;

-- Count one hit against a bucket and say whether it is allowed. A single statement, so two
-- simultaneous requests cannot both read "4 of 5" and both get through.
--
--   allowed      false once the bucket is over its limit for the current window
--   retry_after  seconds until the window resets (0 when allowed)
CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
RETURNS TABLE (allowed boolean, retry_after integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_hits  integer;
  v_reset timestamptz;
BEGIN
  INSERT INTO public.rate_limits AS r (bucket, hits, reset_at)
  VALUES (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE
    SET hits     = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.hits + 1 END,
        reset_at = CASE WHEN r.reset_at <= now() THEN now() + make_interval(secs => p_window_seconds)
                        ELSE r.reset_at END
  RETURNING r.hits, r.reset_at INTO v_hits, v_reset;

  allowed := v_hits <= p_limit;
  retry_after := CASE WHEN allowed THEN 0 ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset - now())))::integer) END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

-- ── Housekeeping ─────────────────────────────────────────────────────────────
-- Schedule with pg_cron / a Supabase scheduled job, e.g. hourly:
--   select public.purge_expired_security_rows();
CREATE OR REPLACE FUNCTION public.purge_expired_security_rows() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.otp_tokens  WHERE expires_at < now() - interval '1 day';
  DELETE FROM public.rate_limits WHERE reset_at   < now() - interval '1 day';
$$;

REVOKE ALL ON FUNCTION public.purge_expired_security_rows() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_security_rows() TO service_role;

DO $$
BEGIN
  RAISE NOTICE '016: otp_tokens and rate_limits ready (service role only).';
END $$;
