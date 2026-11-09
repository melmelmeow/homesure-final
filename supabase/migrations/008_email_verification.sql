-- 008: email verification Kasafide sends itself.
-- Run AFTER 007. Safe to re-run.
--
-- Why this exists
--   The Supabase auth server is configured with mailer_autoconfirm = false, so it insists on a
--   confirmed email before anyone may sign in — but it has no SMTP configured, so its own
--   confirmation mail fails and signing up dies with "Error sending confirmation email".
--   Changing that is a server setting we do not control.
--
--   So Kasafide sends the mail. /api/auth/signup creates the account UNCONFIRMED through the admin
--   API (which sends nothing and therefore cannot fail), stores a token here, and emails the link
--   itself. /api/auth/verify-email confirms the account when that link is opened.
--
--   The important part: the gate is still the auth server's. An unconfirmed account is refused at
--   sign-in by Supabase itself with "Email not confirmed", not by anything in our code, so it
--   cannot be bypassed by calling the database directly.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Run the earlier migrations first (table "profiles" does not exist)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- Only the SHA-256 of the token is kept. Whoever can read this table still cannot verify
  -- somebody else's address, because the hash will not go back into a working link.
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_hash ON email_verifications(token_hash);

-- Nobody reaches this table from a browser. Every row is written and read by the API routes with
-- the service role, which bypasses RLS. Enabling RLS with no policy at all is what makes that
-- true: anon and authenticated get nothing, whatever query they send.
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to email_verifications" ON email_verifications;

REVOKE ALL ON TABLE email_verifications FROM anon, authenticated;

-- Housekeeping: a token that was never used is useless once it expires.
CREATE OR REPLACE FUNCTION public.purge_expired_email_verifications() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.email_verifications
  WHERE used_at IS NULL AND expires_at < now() - interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.purge_expired_email_verifications() FROM public;
