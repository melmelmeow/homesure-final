-- ═════════════════════════════════════════════════════════════════════════════
-- 012_fix_legacy_users_fk.sql
--
-- This database predates 001 (see CLAUDE.md) and was first built on an even older, unnumbered
-- schema that had its own "users" table. `001_initial_schema.sql` and later migrations declare
-- their foreign keys as REFERENCES profiles(id), but every one of those CREATE TABLE statements
-- is guarded with IF NOT EXISTS — so on THIS database, any table that already existed under the
-- old schema (saved_properties, viewing_requests, messages, reviews, payments, etc.) kept its
-- original foreign key pointing at the legacy "users" table and was never altered to point at
-- "profiles". Every account created since (through signup, the seed scripts, or Supabase Auth
-- directly) only ever gets a row in "profiles" and auth.users, not in the legacy "users" table —
-- so any insert referencing one of those accounts fails with "Key is not present in table
-- \"users\"." on a foreign key named after the real column (e.g.
-- saved_properties_user_id_fkey), even though the account is completely real and correctly
-- authenticated. Confirmed on this database with the saved_properties.user_id constraint; this
-- fixes every constraint in that state, not just the one found by hand.
--
-- Safe to re-run: it only repoints constraints currently targeting public.users(id); once none
-- are left, the loop below finds nothing to do. It preserves each constraint's original ON DELETE
-- behavior and name. The legacy "users" table itself is left in place, untouched — this only
-- changes what other tables are allowed to reference.
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
  del_clause text;
BEGIN
  FOR r IN
    SELECT
      con.conname,
      cl.relname  AS table_name,
      att.attname AS column_name,
      con.confdeltype
    FROM pg_constraint con
    JOIN pg_class cl       ON cl.oid = con.conrelid
    JOIN pg_namespace nsp  ON nsp.oid = cl.relnamespace
    JOIN pg_class fcl      ON fcl.oid = con.confrelid
    JOIN pg_namespace fnsp ON fnsp.oid = fcl.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute att  ON att.attrelid = cl.oid AND att.attnum = k.attnum
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND fnsp.nspname = 'public'
      AND fcl.relname = 'users'
      AND cardinality(con.conkey) = 1   -- single-column FKs only (every case here is)
  LOOP
    del_clause := CASE r.confdeltype
      WHEN 'c' THEN 'ON DELETE CASCADE'
      WHEN 'n' THEN 'ON DELETE SET NULL'
      WHEN 'd' THEN 'ON DELETE SET DEFAULT'
      WHEN 'r' THEN 'ON DELETE RESTRICT'
      ELSE ''
    END;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) %s',
      r.table_name, r.conname, r.column_name, del_clause
    );
    RAISE NOTICE 'Repointed %.% (%) from legacy users(id) to profiles(id)', r.table_name, r.column_name, r.conname;
  END LOOP;
END $$;
