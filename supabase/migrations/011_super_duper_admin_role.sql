-- 011_super_duper_admin_role.sql
-- Migration: Add 'super_duper_admin' role to Postgres user_role enum
-- and grant combined authority across all admin and superadmin RLS policies.
-- Safe to re-run.

-- 1. Add 'super_duper_admin' to user_role enum if not already present
DO $$
DECLARE
  enum_schema text;
BEGIN
  SELECT n.nspname INTO enum_schema
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'user_role' AND t.typtype = 'e'
  LIMIT 1;

  IF enum_schema IS NOT NULL THEN
    EXECUTE format('ALTER TYPE %I.user_role ADD VALUE IF NOT EXISTS %L', enum_schema, 'super_duper_admin');
  END IF;
END $$;

-- 2. Update is_admin() helper to include 'super_duper_admin'
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin', 'super_duper_admin')
  );
$$;

-- 3. Update is_superadmin() helper to include 'super_duper_admin'
CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('superadmin', 'super_duper_admin')
  );
$$;

-- 4. Update is_super_duper_admin() dedicated helper
CREATE OR REPLACE FUNCTION public.is_super_duper_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text = 'super_duper_admin'
  );
$$;

-- 5. Update profiles protection trigger so only superadmin or super_duper_admin can change roles
CREATE OR REPLACE FUNCTION public.protect_profile_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_superadmin() THEN
      RAISE EXCEPTION 'Only a super admin can change roles' USING ERRCODE = '42501';
    END IF;

    IF NOT public.is_admin() THEN
      IF NEW.email IS DISTINCT FROM OLD.email
         OR NEW.is_kyc_verified IS DISTINCT FROM OLD.is_kyc_verified
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verification_expiry IS DISTINCT FROM OLD.verification_expiry
         OR NEW.phone_verified IS DISTINCT FROM OLD.phone_verified
         OR NEW.warning_count IS DISTINCT FROM OLD.warning_count
         OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
         OR NEW.verification_reject_reason IS DISTINCT FROM OLD.verification_reject_reason THEN
        RAISE EXCEPTION 'These profile fields can only be changed by an admin' USING ERRCODE = '42501';
      END IF;

      IF NEW.account_status IS DISTINCT FROM OLD.account_status
         AND NOT (
           (NEW.account_status = 'pending' AND OLD.account_status IN ('unverified', 'reverification'))
           OR (NEW.account_status = 'reverification' AND OLD.account_status = 'verified')
         ) THEN
        RAISE EXCEPTION 'Account status can only be changed by an admin' USING ERRCODE = '42501';
      END IF;

      IF OLD.moa_signed_at IS NOT NULL AND NEW.moa_signed_at IS DISTINCT FROM OLD.moa_signed_at THEN
        RAISE EXCEPTION 'MOA signature cannot be altered' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF NEW.account_status IN ('pending', 'reverification')
     AND OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    NEW.verification_reject_reason := NULL;
  END IF;

  NEW.is_kyc_verified := (NEW.account_status = 'verified');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
