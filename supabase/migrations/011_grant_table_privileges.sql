-- ═════════════════════════════════════════════════════════════════════════════
-- 011_grant_table_privileges.sql
--
-- On a normal Supabase project, the platform itself bootstraps the public schema so that
-- anon/authenticated/service_role already have table-level privileges the moment a table is
-- created, and RLS policies are the only gate anyone actually has to think about. On a brand new
-- project created from scratch, that bootstrap step can be missing — every table then answers
-- "permission denied" no matter how correct the RLS policies on it are, because GRANT is checked
-- before RLS ever runs.
--
-- Found by running the migrations end to end on a fresh Supabase project: `anon` could read
-- `barangays` (006 grants that one explicitly) but not `properties` — meaning browse.html would
-- show nothing — and `service_role` could not read anything at all, breaking every API route that
-- uses the admin client.
--
-- This grants the table-level access RLS is written to assume, and nothing more: anon/authenticated
-- still only ever see what the policies in 002/006/007/008 let them see. Safe to re-run.
-- ═════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role bypasses RLS once it can reach the table at all — that is what it is for.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- anon/authenticated get the same broad table-level access; RLS policies already in place are what
-- actually decide which rows each one can see or touch.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- So a table created by a future migration gets the same access automatically, instead of quietly
-- reintroducing this exact problem the next time someone adds one.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;

-- Two tables were deliberately locked down from anon/authenticated earlier (008's
-- email_verifications, 007's get_seller_payment_methods) — the blanket GRANT above would have
-- reopened them, so put those two REVOKEs back on top.
REVOKE ALL ON TABLE email_verifications FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.get_seller_payment_methods(uuid) FROM public;

DO $$
BEGIN
  RAISE NOTICE 'Table-level grants restored for anon/authenticated/service_role. RLS policies are unchanged and remain the real gate.';
END $$;
