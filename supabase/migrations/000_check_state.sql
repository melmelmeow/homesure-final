-- READ-ONLY. Changes nothing. Run this first to see which migrations your database still needs.
-- Each row says "APPLIED" or "RUN THIS". Run the "RUN THIS" ones in numeric order.

WITH state AS (
  SELECT
    to_regclass('public.profiles')          IS NOT NULL AS has_core_tables,
    to_regclass('public.saved_properties')  IS NOT NULL AS has_saved,
    to_regclass('public.viewing_requests')  IS NOT NULL AS has_new_tables,
    EXISTS (SELECT 1 FROM pg_policies  WHERE tablename = 'profiles')                                   AS has_rls,
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = 'handle_new_user')                               AS has_triggers,
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = 'name_similarity')                              AS has_name_similarity,
    EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'seller')                                  AS has_seller_role,
    EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin')                              AS has_superadmin_role,
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'lifecycle_status') AS has_fe_columns,
    to_regclass('public.security_deposits') IS NOT NULL AS has_deposits,
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'due_date')          AS has_payment_columns,
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'payment_methods')   AS has_payment_methods,
    to_regclass('public.email_verifications') IS NOT NULL AS has_email_verification
)
SELECT * FROM (
  SELECT 1 AS n, '001_initial_schema'          AS migration,
         CASE WHEN has_core_tables      THEN 'APPLIED' ELSE 'RUN THIS' END AS status,
         'profiles / properties / payments / … tables'                     AS what FROM state
  UNION ALL
  SELECT 2, '002_rls_policies',
         CASE WHEN has_rls              THEN 'APPLIED' ELSE 'RUN THIS' END,
         'row level security policies' FROM state
  UNION ALL
  SELECT 3, '003_functions_triggers',
         CASE WHEN has_triggers         THEN 'APPLIED' ELSE 'RUN THIS' END,
         'auto-create profile on signup' FROM state
  UNION ALL
  SELECT 4, '004_similarity_function',
         CASE WHEN has_name_similarity  THEN 'APPLIED' ELSE 'RUN THIS' END,
         'name matching for OCR (fixed version)' FROM state
  UNION ALL
  SELECT 5, '005_roles_seller_superadmin',
         CASE WHEN has_seller_role AND has_superadmin_role THEN 'APPLIED' ELSE 'RUN THIS' END,
         'roles: landowner -> seller, add superadmin' FROM state
  UNION ALL
  SELECT 6, '006_frontend_alignment',
         CASE WHEN has_fe_columns AND has_new_tables THEN 'APPLIED' ELSE 'RUN THIS' END,
         'moderation columns, messages/reviews/…, RLS fixes' FROM state
  UNION ALL
  SELECT 7, '007_payments_and_deposits',
         CASE WHEN has_deposits AND has_payment_columns AND has_payment_methods
              THEN 'APPLIED' ELSE 'RUN THIS' END,
         'payment periods + proofs, security deposits, seller payment details' FROM state
  UNION ALL
  SELECT 8, '008_email_verification',
         CASE WHEN has_email_verification THEN 'APPLIED' ELSE 'RUN THIS' END,
         'confirmation links Kasafide emails itself' FROM state
) rows ORDER BY n;
