-- ═════════════════════════════════════════════════════════════════════════════
-- 015_password_resets.sql
-- Run AFTER 008 (and 011). Safe to re-run.
--
-- Why this exists
--   "Forgot password" used to call the Supabase auth server's own reset mail
--   (sb.auth.resetPasswordForEmail). That server has no SMTP configured — the same reason 008
--   exists — so the request failed (the page showed "{}"), and even when it did send, the link
--   landed on the sign-in page, which has no way to set a new password.
--
--   So Kasafide sends the reset mail itself, the same way 008 handles confirmation:
--   POST /api/auth/forgot-password stores a token here and emails the link through our SMTP;
--   POST /api/auth/reset-password checks it and sets the new password through the admin API.
--
--   Kept apart from email_verifications on purpose: issuing a token there spends every earlier
--   one for that user, so sharing the table would let a reset request silently cancel a pending
--   email confirmation (or the other way round).
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Run the earlier migrations first (table "profiles" does not exist)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- Only the SHA-256 of the token is kept, so reading this table never yields a working link.
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_hash ON password_resets(token_hash);

-- Nobody reaches this table from a browser: RLS on with no policy at all, and no table grants for
-- anon/authenticated. Only the API routes, with the service role, read and write it.
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE password_resets FROM anon, authenticated;
GRANT ALL ON TABLE password_resets TO service_role;

-- Housekeeping, same as 008's.
CREATE OR REPLACE FUNCTION public.purge_expired_password_resets() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.password_resets
  WHERE used_at IS NULL AND expires_at < now() - interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.purge_expired_password_resets() FROM public;

DO $$
BEGIN
  RAISE NOTICE '015: password_resets ready. "Forgot password" now works through /api/auth/forgot-password.';
END $$;
