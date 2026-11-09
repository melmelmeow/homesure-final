-- 009: the indexes that were missing.
-- Run AFTER 008. Safe to re-run.
--
-- 22 indexes already exist across the earlier migrations, but `profiles` had none at all — and two
-- API routes look it up by email on every sign-up and every resend:
--
--   src/app/api/auth/signup/route.ts               .eq("email", email)
--   src/app/api/auth/resend-verification/route.ts  .eq("email", email)
--
-- Without an index that reads every profile row. With one it is a direct lookup.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Run the earlier migrations first (table "profiles" does not exist)';
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- profiles.email
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Unique, and on lower(email), because the sign-up route lowercases the address before storing it.
-- Without lower() "Juan@gmail.com" and "juan@gmail.com" become two accounts for one inbox — and
-- then the second person to sign up is told the address is taken while the first keeps the
-- account. The index does the speeding up and the prevention in one object.
--
-- A unique index cannot be built over existing duplicates, so check first and say what is in the
-- way rather than failing with a message about an index nobody asked about.

DO $$
DECLARE dupes text;
BEGIN
  SELECT string_agg(e, ', ') INTO dupes
  FROM (
    SELECT lower(email) AS e
    FROM public.profiles
    WHERE email IS NOT NULL
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) d;

  IF dupes IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add the unique email index: these addresses appear more than once (%). Merge or delete the extra profiles first.',
      dupes;
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower
    ON public.profiles (lower(email))
    WHERE email IS NOT NULL;
END $$;

-- Admin and super-admin lists filter by role, and the super admin's Admin Management page reads
-- it on every load.
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- The Users page sorts newest first.
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- properties: the public browse query
-- ═════════════════════════════════════════════════════════════════════════════
--
-- browse.html asks for approved listings newest first on every visit. One index covering both the
-- filter and the sort means the database walks it in order instead of sorting the result.

CREATE INDEX IF NOT EXISTS idx_properties_status_created
  ON public.properties (status, created_at DESC);
