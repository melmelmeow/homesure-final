-- 005: align role names with the front end (buyer / seller / admin / superadmin).
--
-- Run this on its own, not pasted together with 006: Postgres will not let a newly added enum
-- value be used in the same transaction that added it.
--
-- Works whichever shape the database is in:
--   * profiles.role is already the user_role enum  -> rename 'landowner' to 'seller', add 'superadmin'
--   * profiles.role is a plain text column         -> fix the stored values, create the enum, convert the column
-- Safe to re-run.

-- ── Baseline columns ─────────────────────────────────────────────────────────
-- Not every database was created by running 001 verbatim. In particular 003 installs a trigger that
-- writes profiles.updated_at, so that column has to exist before anything updates a profile.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name       varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone_number    varchar(50)  NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_kyc_verified boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz  NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz  NOT NULL DEFAULT now();

-- ── Case A: the enum already exists ──────────────────────────────────────────
DO $$
DECLARE enum_schema text;
BEGIN
  SELECT n.nspname INTO enum_schema
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'user_role' AND t.typtype = 'e'
  LIMIT 1;

  IF enum_schema IS NULL THEN
    RAISE NOTICE 'No user_role enum yet - the text column will be converted below.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'landowner'
  ) THEN
    EXECUTE format('ALTER TYPE %I.user_role RENAME VALUE %L TO %L', enum_schema, 'landowner', 'seller');
  END IF;
END $$;

-- ADD VALUE cannot run inside the DO block above (it may not be used in the same transaction),
-- so it is a plain statement here. IF NOT EXISTS makes re-running safe.
DO $$
DECLARE enum_schema text;
BEGIN
  SELECT n.nspname INTO enum_schema
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'user_role' AND t.typtype = 'e'
  LIMIT 1;

  IF enum_schema IS NOT NULL THEN
    EXECUTE format('ALTER TYPE %I.user_role ADD VALUE IF NOT EXISTS %L', enum_schema, 'superadmin');
  END IF;
END $$;

-- ── Case B: profiles.role is a plain text column ─────────────────────────────
-- Postgres refuses to change a column's type while a policy mentions it ("cannot alter type of a
-- column used in a policy definition"), so the policies are saved, dropped, and put back afterwards
-- with their `role` references cast to text so they keep working against the enum.
DO $$
DECLARE
  col_type text;
  bad_values text;
  pol record;
  recreate text[] := '{}';
  stmt text;
  q text;
  wc text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role';

  IF col_type IS NULL THEN
    RAISE EXCEPTION 'Table public.profiles has no "role" column - run 001_initial_schema.sql first';
  END IF;

  IF col_type <> 'text' AND col_type <> 'character varying' THEN
    RETURN;                                   -- already an enum: case A handled it
  END IF;

  -- Old name -> new name, before the values have to satisfy the enum.
  UPDATE public.profiles SET role = 'seller' WHERE role = 'landowner';

  SELECT string_agg(DISTINCT role, ', ') INTO bad_values
  FROM public.profiles
  WHERE role IS NOT NULL AND role NOT IN ('buyer', 'seller', 'admin', 'superadmin');

  IF bad_values IS NOT NULL THEN
    RAISE EXCEPTION 'profiles.role holds values that are not valid roles: % - fix these rows first', bad_values;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'user_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'admin', 'superadmin');
  END IF;

  -- Remember every policy on profiles, rewriting bare `role` references to `role::text`
  -- (so "role = 'admin'" still compares correctly once the column is an enum).
  FOR pol IN
    SELECT policyname, permissive, cmd, roles, qual, with_check
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    q  := regexp_replace(COALESCE(pol.qual, ''),       '\yrole\y(?![ ]*\()', 'role::text', 'g');
    wc := regexp_replace(COALESCE(pol.with_check, ''), '\yrole\y(?![ ]*\()', 'role::text', 'g');
    q  := replace(q,  '::text::text', '::text');
    wc := replace(wc, '::text::text', '::text');

    recreate := recreate || format(
      'CREATE POLICY %I ON public.profiles AS %s FOR %s TO %s%s%s',
      pol.policyname,
      pol.permissive,
      pol.cmd,
      array_to_string(pol.roles, ', '),
      CASE WHEN pol.qual       IS NULL THEN '' ELSE ' USING (' || q || ')' END,
      CASE WHEN pol.with_check IS NULL THEN '' ELSE ' WITH CHECK (' || wc || ')' END);

    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;

  -- The default has to go before the type changes, then come back.
  ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
  ALTER TABLE public.profiles
    ALTER COLUMN role TYPE public.user_role USING COALESCE(role, 'buyer')::public.user_role;
  ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'buyer'::public.user_role;

  FOREACH stmt IN ARRAY recreate LOOP
    EXECUTE stmt;
  END LOOP;

  RAISE NOTICE 'profiles.role converted from text to the user_role enum (% policies restored).', array_length(recreate, 1);
END $$;
