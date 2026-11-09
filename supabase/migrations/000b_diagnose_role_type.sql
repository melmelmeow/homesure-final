-- READ-ONLY. Changes nothing.
-- Run this when 005 says: type "user_role" does not exist.
-- It shows what the profiles.role column really is and where (if anywhere) the enum lives.

SELECT 'search_path' AS item, current_setting('search_path') AS value, '' AS extra
UNION ALL
SELECT 'current_schema', current_schema(), ''
UNION ALL
SELECT 'profiles table', CASE WHEN to_regclass('public.profiles') IS NULL THEN 'MISSING' ELSE 'exists' END, ''
UNION ALL
SELECT
  'profiles.role column',
  COALESCE((SELECT data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'), 'MISSING'),
  COALESCE((SELECT udt_schema || '.' || udt_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'), '')
UNION ALL
SELECT
  'enum types named user_role',
  COALESCE((SELECT string_agg(n.nspname || '.' || t.typname, ', ')
            FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'user_role'), 'NONE FOUND'),
  COALESCE((SELECT string_agg(e.enumlabel, ' | ' ORDER BY e.enumsortorder)
            FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role'), '')
UNION ALL
-- Read through query_to_xml so this still runs (instead of failing to parse) when profiles is missing.
SELECT
  'role values actually stored',
  CASE WHEN to_regclass('public.profiles') IS NULL THEN '(no profiles table)'
       ELSE COALESCE((xpath('/row/v/text()', query_to_xml(
              'SELECT string_agg(DISTINCT role::text, '' | '') AS v FROM public.profiles',
              false, true, '')))[1]::text, '(no rows yet)') END,
  CASE WHEN to_regclass('public.profiles') IS NULL THEN ''
       ELSE COALESCE((xpath('/row/v/text()', query_to_xml(
              'SELECT count(*)::text || '' profile row(s)'' AS v FROM public.profiles',
              false, true, '')))[1]::text, '') END
UNION ALL
SELECT
  'other enums in this database',
  COALESCE((SELECT string_agg(DISTINCT n.nspname || '.' || t.typname, ', ')
            FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typtype = 'e' AND n.nspname NOT IN ('pg_catalog', 'information_schema')), 'none'),
  '';
