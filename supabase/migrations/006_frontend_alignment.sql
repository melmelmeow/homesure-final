-- 006: align the database with the Kasafide front end, and close the security holes found on the way.
-- Run AFTER 005. Safe to re-run.
--
-- The live database was not built from 001 — it has its own (better) shape: a `barangays` lookup,
-- `latitude`/`longitude`, `floor_area_sqm`, jsonb `images`, `saved_properties`, `land_titles`, and
-- PayMongo columns on `payments`. THOSE NAMES ARE THE CANONICAL ONES. This migration adds only what
-- is genuinely missing and never renames or drops a column that holds data.
--
-- What it does
--   * profiles: verification fields; contact details stop being world-readable (public_profiles view);
--     nobody can promote themselves or approve their own account.
--   * properties: the moderation fields the admin pages need (draft/pending/approved/rejected/closed),
--     multi-unit fields, and the OCR/LRA columns the backend expects.
--   * creates only the tables that do not exist yet; `saved_properties` is used as-is for saved listings.
--   * leaves `users`, `listings`, `notes` and `land_titles` completely alone.

-- ═════════════════════════════════════════════════════════════════════════════
-- 0. Preconditions
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Table "profiles" does not exist';
  END IF;
  IF to_regclass('public.properties') IS NULL THEN
    RAISE EXCEPTION 'Table "properties" does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                 WHERE t.typname = 'user_role' AND e.enumlabel = 'seller') THEN
    RAISE EXCEPTION 'Run 005_roles_seller_superadmin.sql first (role "seller" does not exist yet)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                 WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin') THEN
    RAISE EXCEPTION 'Run 005_roles_seller_superadmin.sql first (role "superadmin" does not exist yet)';
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Helpers
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text = 'superadmin'
  );
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. profiles
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_kyc_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_expiry date,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_verification_at timestamptz,
  ADD COLUMN IF NOT EXISTS moa_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_docs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS new_verification_docs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS new_submitted_verification_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reject_reason text,
  ADD COLUMN IF NOT EXISTS warning_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('unverified', 'pending', 'verified', 'reverification'));

-- `phone` is the column the app uses. 001-shaped databases keep their data in `phone_number`,
-- so move it across, then drop `phone_number` only when it holds nothing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_number') THEN
    UPDATE profiles SET phone = phone_number
    WHERE (phone IS NULL OR phone = '') AND phone_number IS NOT NULL AND phone_number <> '';

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE phone_number IS NOT NULL AND phone_number <> '') THEN
      ALTER TABLE profiles DROP COLUMN phone_number;
    END IF;
  END IF;
END $$;

-- Fill in whichever name half is missing, in both directions.
UPDATE profiles
SET first_name = COALESCE(first_name, NULLIF(split_part(COALESCE(full_name, ''), ' ', 1), '')),
    last_name  = COALESCE(last_name,
                          NULLIF(trim(substr(COALESCE(full_name, ''),
                                 length(split_part(COALESCE(full_name, ''), ' ', 1)) + 1)), ''))
WHERE full_name IS NOT NULL AND full_name <> '' AND (first_name IS NULL OR last_name IS NULL);

UPDATE profiles
SET full_name = trim(concat_ws(' ', first_name, last_name))
WHERE (full_name IS NULL OR full_name = '')
  AND trim(concat_ws(' ', first_name, last_name)) <> '';

UPDATE profiles SET account_status = 'verified', verified_at = COALESCE(verified_at, now())
WHERE is_kyc_verified AND account_status = 'unverified';

-- Sign-up: honour the role the front end sends, but only buyer/seller (admins are granted by an admin).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta    jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text  := NULLIF(trim(meta->>'first_name'), '');
  v_last  text  := NULLIF(trim(meta->>'last_name'), '');
  v_full  text  := COALESCE(NULLIF(trim(meta->>'full_name'), ''),
                            NULLIF(trim(concat_ws(' ', v_first, v_last)), ''), '');
  v_role  public.user_role := CASE WHEN meta->>'role' = 'seller'
                                   THEN 'seller'::public.user_role
                                   ELSE 'buyer'::public.user_role END;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_full,
    COALESCE(v_first, NULLIF(split_part(v_full, ' ', 1), '')),
    COALESCE(v_last, NULLIF(trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 1)), '')),
    NULLIF(meta->>'phone_number', ''),
    v_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- End users must not be able to change their own role or verification state.
-- auth.uid() is NULL for the service role and for the SQL editor, so those stay unrestricted.
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

      -- A user may only submit documents for review: unverified/reverification -> pending, or
      -- (already verified, renewing) verified -> reverification. Approving is an admin decision.
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

CREATE OR REPLACE TRIGGER protect_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Contact details were readable by everyone, including anonymous visitors.
-- Own row + admins only; everyone else gets the safe columns through public_profiles.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users read own profile"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON profiles FOR UPDATE USING (
  public.is_admin() AND (role::text <> 'superadmin' OR public.is_superadmin())
);

-- Runs with the view owner's rights, but only exposes safe columns of buyers and sellers.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, first_name, last_name, full_name, avatar_url, role, account_status, created_at
  FROM public.profiles
  WHERE role::text IN ('buyer', 'seller');

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. barangays (lookup used by properties.barangay_id)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS barangays (
  id serial PRIMARY KEY,
  name text NOT NULL,
  municipality text,
  province text
);

ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Barangays are public" ON barangays;
CREATE POLICY "Barangays are public" ON barangays FOR SELECT USING (true);
GRANT SELECT ON barangays TO anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. properties
--
-- The listing columns (property_type, listing_type, latitude, floor_area_sqm, images, …) already
-- exist on the live database; ADD COLUMN IF NOT EXISTS fills them in on any database that lacks them.
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS listing_type text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS price_negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS barangay_id integer REFERENCES barangays(id),
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms integer,
  ADD COLUMN IF NOT EXISTS floor_area_sqm numeric,
  ADD COLUMN IF NOT EXISTS lot_area_sqm numeric,
  ADD COLUMN IF NOT EXISTS amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  -- moderation (new)
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifecycle_status text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejection_notes text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  -- multi-unit rentals (new)
  ADD COLUMN IF NOT EXISTS has_multiple_units boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_units integer,
  ADD COLUMN IF NOT EXISTS available_units integer,
  -- documents + title verification (new)
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_state varchar DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS ocr_match_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS lra_eserbisyo_ref_no varchar(100),
  ADD COLUMN IF NOT EXISTS is_encumbered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS registry_of_deeds varchar(150),
  ADD COLUMN IF NOT EXISTS tax_declaration_number varchar(100),
  ADD COLUMN IF NOT EXISTS title_number varchar(100),
  ADD COLUMN IF NOT EXISTS title_type varchar(10);

-- Normalise whatever wording existing rows use into the vocabulary the pages expect.
UPDATE properties SET status = CASE lower(trim(status))
    WHEN 'active'     THEN 'approved'
    WHEN 'published'  THEN 'approved'
    WHEN 'available'  THEN 'approved'
    WHEN 'live'       THEN 'approved'
    WHEN 'for_review' THEN 'pending'
    WHEN 'under_review' THEN 'pending'
    WHEN 'submitted'  THEN 'pending'
    WHEN 'declined'   THEN 'rejected'
    WHEN 'sold'       THEN 'closed'
    WHEN 'rented'     THEN 'closed'
    WHEN 'archived'   THEN 'closed'
    WHEN 'inactive'   THEN 'closed'
    ELSE lower(trim(status))
  END
WHERE status IS NOT NULL;

UPDATE properties SET lifecycle_status = 'sold'
WHERE lifecycle_status IS NULL AND lower(trim(COALESCE(status, ''))) IN ('sold');
UPDATE properties SET lifecycle_status = 'rented'
WHERE lifecycle_status IS NULL AND lower(trim(COALESCE(status, ''))) IN ('rented');

UPDATE properties SET status = 'draft' WHERE status IS NULL OR trim(status) = '';

UPDATE properties SET listing_type = CASE lower(trim(listing_type))
    WHEN 'for_sale' THEN 'sale'
    WHEN 'for sale' THEN 'sale'
    WHEN 'selling'  THEN 'sale'
    WHEN 'for_rent' THEN 'rent'
    WHEN 'for rent' THEN 'rent'
    WHEN 'renting'  THEN 'rent'
    WHEN 'rental'   THEN 'rent'
    ELSE lower(trim(listing_type))
  END
WHERE listing_type IS NOT NULL;
UPDATE properties SET listing_type = 'sale' WHERE listing_type IS NULL OR trim(listing_type) = '';

UPDATE properties SET property_type = lower(trim(property_type)) WHERE property_type IS NOT NULL;

UPDATE properties SET verification_state = 'unverified'
WHERE verification_state IS NULL OR trim(verification_state::text) = '';

-- Constraints are added only when every existing row already satisfies them, so a database with
-- unexpected wording still migrates (and the admin pages can show those rows so they can be fixed).
DO $$
DECLARE bad text;
BEGIN
  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
  SELECT string_agg(DISTINCT status, ', ') INTO bad FROM properties
  WHERE status NOT IN ('draft', 'pending', 'approved', 'rejected', 'closed');
  IF bad IS NULL THEN
    ALTER TABLE properties ADD CONSTRAINT properties_status_check
      CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'closed'));
  ELSE
    RAISE NOTICE 'properties.status holds unexpected values (%), constraint not added', bad;
  END IF;

  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;
  SELECT string_agg(DISTINCT listing_type, ', ') INTO bad FROM properties
  WHERE listing_type NOT IN ('sale', 'rent');
  IF bad IS NULL THEN
    ALTER TABLE properties ADD CONSTRAINT properties_listing_type_check
      CHECK (listing_type IN ('sale', 'rent'));
  ELSE
    RAISE NOTICE 'properties.listing_type holds unexpected values (%), constraint not added', bad;
  END IF;

  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
  SELECT string_agg(DISTINCT property_type, ', ') INTO bad FROM properties
  WHERE property_type IS NOT NULL
    AND property_type NOT IN ('house', 'apartment', 'condo', 'commercial', 'lot');
  IF bad IS NULL THEN
    ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
      CHECK (property_type IS NULL OR property_type IN ('house', 'apartment', 'condo', 'commercial', 'lot'));
  ELSE
    RAISE NOTICE 'properties.property_type holds unexpected values (%), constraint not added', bad;
  END IF;
END $$;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_lifecycle_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_lifecycle_status_check
  CHECK (lifecycle_status IS NULL OR lifecycle_status IN ('sold', 'rented'));

-- The listing form does not collect these; they are filled in during title verification.
DO $$
BEGIN
  BEGIN ALTER TABLE properties ALTER COLUMN title_number DROP NOT NULL;      EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TABLE properties ALTER COLUMN registry_of_deeds DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'draft';      EXCEPTION WHEN others THEN NULL; END;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Tables that do not exist yet
--    (saved_properties, barangays, land_titles, payments are used as they already are)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_properties (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS viewing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'counter-proposed', 'confirmed', 'cancelled')),
  requested_date date NOT NULL,
  requested_time time NOT NULL,
  proposed_date date,
  proposed_time time,
  buyer_notes text,
  seller_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'viewing-request', 'viewing-response')),
  body text,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  viewing_request_id uuid REFERENCES viewing_requests(id) ON DELETE SET NULL,
  viewing_data jsonb,
  status text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  conversation_key text GENERATED ALWAYS AS (
    least(sender_id::text, receiver_id::text) || '_' || greatest(sender_id::text, receiver_id::text)
  ) STORED,
  CHECK (sender_id <> receiver_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('buyer-to-seller', 'seller-to-buyer')),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  helpful int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reviewer_id <> reviewee_id),
  UNIQUE (reviewer_id, reviewee_id, property_id)
);

CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  action_taken text,
  admin_notes text,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text,
  body text NOT NULL,
  link text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  details text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  amount numeric(12,2) NOT NULL,
  reason text NOT NULL,
  disbursement_reference text UNIQUE,
  payout_channel text DEFAULT 'INSTAPAY',
  destination_account_no text NOT NULL,
  destination_bank_code text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('none', 'requested', 'processing', 'completed', 'rejected')),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Written by the admin LRA verification screen (src/components/verification-table.tsx).
CREATE TABLE IF NOT EXISTS lra_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  notes text,
  ref_no text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_demand_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  search_query text,
  location_tag text,
  price_min numeric(12,2),
  price_max numeric(12,2),
  results_returned int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gsc_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  query text NOT NULL,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr numeric(5,4) DEFAULT 0,
  position numeric(5,2) DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now()
);

-- payments doubles as the front end's "transactions" list.
-- The live database calls the payer `user_id`; a 001-shaped one calls it `buyer_id`. `user_id` wins.
DO $$
BEGIN
  IF  EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'buyer_id')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'user_id') THEN
    ALTER TABLE payments RENAME COLUMN buyer_id TO user_id;
  END IF;
END $$;

-- The provider columns sit side by side on purpose: the database already holds PayMongo fields, and
-- the API routes are written against Xendit. Both sets are kept so neither piece of work is lost,
-- and whichever provider the team settles on simply uses its own columns.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PHP',
  ADD COLUMN IF NOT EXISTS qr_code_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS move_in_date date,
  -- Xendit (used by backend/src/app/api/payments and /api/webhooks/xendit)
  ADD COLUMN IF NOT EXISTS xendit_charge_id text,
  ADD COLUMN IF NOT EXISTS xendit_qr_string text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_xendit_charge ON payments (xendit_charge_id)
  WHERE xendit_charge_id IS NOT NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Cross-table helpers (SECURITY DEFINER so policies don't recurse into each other)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.owns_property(p_property uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property AND landowner_id = auth.uid());
$$;

-- A buyer keeps access to a listing they saved, asked to view or paid for, even after it closes.
CREATE OR REPLACE FUNCTION public.has_property_relation(p_property uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.saved_properties WHERE property_id = p_property AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.viewing_requests  WHERE property_id = p_property AND buyer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.payments          WHERE property_id = p_property AND user_id = auth.uid());
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. properties: guard + RLS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_property_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.status, 'draft') NOT IN ('draft', 'pending')
         OR COALESCE(NEW.verification_state::text, 'unverified') NOT IN ('unverified', 'pending_ocr')
         OR NEW.ocr_match_score IS NOT NULL OR NEW.lra_eserbisyo_ref_no IS NOT NULL
         OR NEW.is_encumbered OR NEW.verified_at IS NOT NULL OR NEW.verified_by IS NOT NULL
         OR NEW.featured OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL
         OR NEW.rejection_reason IS NOT NULL OR NEW.rejection_notes IS NOT NULL THEN
        RAISE EXCEPTION 'New listings must start as draft or pending' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.landowner_id IS DISTINCT FROM OLD.landowner_id
         OR (NEW.verification_state IS DISTINCT FROM OLD.verification_state
             AND NEW.verification_state::text NOT IN ('unverified', 'pending_ocr'))
         OR NEW.ocr_match_score IS DISTINCT FROM OLD.ocr_match_score
         OR NEW.lra_eserbisyo_ref_no IS DISTINCT FROM OLD.lra_eserbisyo_ref_no
         OR NEW.is_encumbered IS DISTINCT FROM OLD.is_encumbered
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
         OR NEW.featured IS DISTINCT FROM OLD.featured
         OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
         OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
         OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
         OR NEW.rejection_notes IS DISTINCT FROM OLD.rejection_notes THEN
        RAISE EXCEPTION 'These listing fields can only be changed by an admin' USING ERRCODE = '42501';
      END IF;

      IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Only an admin can approve or reject a listing' USING ERRCODE = '42501';
      END IF;

      IF OLD.status = 'rejected' AND NEW.status IN ('draft', 'pending') THEN
        NEW.rejection_reason := NULL;
        NEW.rejection_notes := NULL;
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_property_columns
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_property_columns();

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read verified properties" ON properties;
DROP POLICY IF EXISTS "Landowners insert own" ON properties;
DROP POLICY IF EXISTS "Landowners update own" ON properties;
DROP POLICY IF EXISTS "Public read approved properties" ON properties;
DROP POLICY IF EXISTS "Owners read own properties" ON properties;
DROP POLICY IF EXISTS "Admins read all properties" ON properties;
DROP POLICY IF EXISTS "Read properties I saved, requested or paid for" ON properties;
DROP POLICY IF EXISTS "Sellers insert own" ON properties;
DROP POLICY IF EXISTS "Owners update own" ON properties;
DROP POLICY IF EXISTS "Admins update any" ON properties;
DROP POLICY IF EXISTS "Owners delete own unapproved" ON properties;
DROP POLICY IF EXISTS "Admins delete any" ON properties;

CREATE POLICY "Public read approved properties" ON properties FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners read own properties" ON properties FOR SELECT USING (auth.uid() = landowner_id);
CREATE POLICY "Admins read all properties" ON properties FOR SELECT USING (public.is_admin());
CREATE POLICY "Read properties I saved, requested or paid for" ON properties FOR SELECT
  USING (public.has_property_relation(id));
CREATE POLICY "Sellers insert own" ON properties FOR INSERT WITH CHECK (
  auth.uid() = landowner_id
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role::text IN ('seller', 'admin', 'superadmin'))
);
CREATE POLICY "Owners update own" ON properties FOR UPDATE USING (auth.uid() = landowner_id);
CREATE POLICY "Admins update any" ON properties FOR UPDATE USING (public.is_admin());
CREATE POLICY "Owners delete own unapproved" ON properties FOR DELETE
  USING (auth.uid() = landowner_id AND status <> 'approved');
CREATE POLICY "Admins delete any" ON properties FOR DELETE USING (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. RLS for everything else
-- ═════════════════════════════════════════════════════════════════════════════

-- saved_properties (the front end's "saved listings") ---------------------------
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own saved" ON saved_properties;
DROP POLICY IF EXISTS "Users save own" ON saved_properties;
DROP POLICY IF EXISTS "Users unsave own" ON saved_properties;
DROP POLICY IF EXISTS "Admins read saved" ON saved_properties;
CREATE POLICY "Users read own saved" ON saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users save own"       ON saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave own"     ON saved_properties FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins read saved"    ON saved_properties FOR SELECT USING (public.is_admin());

-- payments (PayMongo). Writes happen through the API with the service role. -----
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers read own payments" ON payments;
DROP POLICY IF EXISTS "Admins read all payments" ON payments;
DROP POLICY IF EXISTS "Sellers read payments on own properties" ON payments;
CREATE POLICY "Buyers read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all payments" ON payments FOR SELECT USING (public.is_admin());
CREATE POLICY "Sellers read payments on own properties" ON payments FOR SELECT
  USING (public.owns_property(property_id));

-- refunds ----------------------------------------------------------------------
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers read own refunds" ON refunds;
DROP POLICY IF EXISTS "Admins read all refunds" ON refunds;
CREATE POLICY "Buyers read own refunds" ON refunds FOR SELECT USING (
  auth.uid() = requested_by OR EXISTS (
    SELECT 1 FROM payments WHERE payments.id = refunds.payment_id AND payments.user_id = auth.uid()
  )
);
CREATE POLICY "Admins read all refunds" ON refunds FOR SELECT USING (public.is_admin());

-- land_titles: owners see their own, admins see all (the table itself is untouched)
DO $$
BEGIN
  IF to_regclass('public.land_titles') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE land_titles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Owners read own titles" ON land_titles';
    EXECUTE 'DROP POLICY IF EXISTS "Owners submit titles" ON land_titles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins read all titles" ON land_titles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins review titles" ON land_titles';
    EXECUTE 'CREATE POLICY "Owners read own titles" ON land_titles FOR SELECT USING (auth.uid() = owner_id)';
    EXECUTE 'CREATE POLICY "Owners submit titles" ON land_titles FOR INSERT WITH CHECK (auth.uid() = owner_id)';
    EXECUTE 'CREATE POLICY "Admins read all titles" ON land_titles FOR SELECT USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "Admins review titles" ON land_titles FOR UPDATE USING (public.is_admin())';
  END IF;
END $$;

-- viewing_requests --------------------------------------------------------------
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- The seller of a request is always the listing's owner, whatever the client sends.
CREATE OR REPLACE FUNCTION public.set_viewing_request_seller() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT landowner_id INTO NEW.seller_id FROM public.properties WHERE id = NEW.property_id;
    IF NEW.seller_id IS NULL THEN
      RAISE EXCEPTION 'Listing not found' USING ERRCODE = '23503';
    END IF;
    IF NEW.seller_id = NEW.buyer_id THEN
      RAISE EXCEPTION 'You cannot request a viewing of your own listing' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'property, buyer and seller cannot change' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_viewing_request_seller
  BEFORE INSERT OR UPDATE ON viewing_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_viewing_request_seller();

DROP POLICY IF EXISTS "Participants read viewing requests" ON viewing_requests;
DROP POLICY IF EXISTS "Buyers create viewing requests" ON viewing_requests;
DROP POLICY IF EXISTS "Participants update viewing requests" ON viewing_requests;
CREATE POLICY "Participants read viewing requests" ON viewing_requests FOR SELECT
  USING (auth.uid() IN (buyer_id, seller_id) OR public.is_admin());
CREATE POLICY "Buyers create viewing requests" ON viewing_requests FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update viewing requests" ON viewing_requests FOR UPDATE
  USING (auth.uid() IN (buyer_id, seller_id));

-- messages ----------------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.protect_message_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.viewing_request_id IS DISTINCT FROM OLD.viewing_request_id
     OR NEW.viewing_data IS DISTINCT FROM OLD.viewing_data
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read/status can be updated on a message' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_message_columns
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_columns();

DROP POLICY IF EXISTS "Participants read messages" ON messages;
DROP POLICY IF EXISTS "Users send messages" ON messages;
DROP POLICY IF EXISTS "Participants update messages" ON messages;
CREATE POLICY "Participants read messages" ON messages FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Participants update messages" ON messages FOR UPDATE USING (auth.uid() IN (sender_id, receiver_id));

-- reviews -----------------------------------------------------------------------
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.protect_review_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND NEW.helpful <> 0 THEN
      RAISE EXCEPTION 'helpful is managed by the system' USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND (NEW.helpful IS DISTINCT FROM OLD.helpful
        OR NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id
        OR NEW.reviewee_id IS DISTINCT FROM OLD.reviewee_id
        OR NEW.type IS DISTINCT FROM OLD.type) THEN
      RAISE EXCEPTION 'Only rating and comment can be edited' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_review_columns
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_columns();

DROP POLICY IF EXISTS "Reviews are public" ON reviews;
DROP POLICY IF EXISTS "Users write own reviews" ON reviews;
DROP POLICY IF EXISTS "Users edit own reviews" ON reviews;
DROP POLICY IF EXISTS "Users delete own reviews" ON reviews;
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users edit own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users delete own reviews" ON reviews FOR DELETE USING (auth.uid() = reviewer_id OR public.is_admin());

-- listing_reports ---------------------------------------------------------------
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users file reports" ON listing_reports;
DROP POLICY IF EXISTS "Users read own reports, admins read all" ON listing_reports;
DROP POLICY IF EXISTS "Admins handle reports" ON listing_reports;
CREATE POLICY "Users file reports" ON listing_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by AND status = 'pending');
CREATE POLICY "Users read own reports, admins read all" ON listing_reports FOR SELECT
  USING (auth.uid() = reported_by OR public.is_admin());
CREATE POLICY "Admins handle reports" ON listing_reports FOR UPDATE USING (public.is_admin());

-- notifications -----------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins create notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins create notifications" ON notifications FOR INSERT WITH CHECK (public.is_admin());

-- audit_logs: append-only, super admins only ------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins write audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Super admins read audit logs" ON audit_logs;
CREATE POLICY "Admins write audit logs" ON audit_logs FOR INSERT
  WITH CHECK (public.is_admin() AND actor_id = auth.uid());
CREATE POLICY "Super admins read audit logs" ON audit_logs FOR SELECT USING (public.is_superadmin());

-- analytics ---------------------------------------------------------------------
ALTER TABLE lra_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins insert audit" ON lra_audit_logs;
DROP POLICY IF EXISTS "Admins read audit" ON lra_audit_logs;
CREATE POLICY "Admins insert audit" ON lra_audit_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins read audit"   ON lra_audit_logs FOR SELECT USING (public.is_admin());

ALTER TABLE search_demand_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own log" ON search_demand_logs;
DROP POLICY IF EXISTS "Admins read all logs" ON search_demand_logs;
CREATE POLICY "Users insert own log" ON search_demand_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all logs" ON search_demand_logs FOR SELECT USING (public.is_admin());

ALTER TABLE gsc_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read gsc" ON gsc_metrics;
CREATE POLICY "Admins read gsc" ON gsc_metrics FOR SELECT USING (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. Fixes to earlier migrations
-- ═════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_url_query ON gsc_metrics (url, query);

-- 004 originally defined public.similarity(text, text), which collides with pg_trgm's own function:
-- it either refuses to apply or calls itself forever. Remove any leftover copy.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public' AND p.proname = 'similarity' AND l.lanname = 'plpgsql'
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 10. Indexes
-- ═════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_properties_landowner      ON properties(landowner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status         ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_barangay       ON properties(barangay_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_user     ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_buyer    ON viewing_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_seller   ON viewing_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation     ON messages(conversation_key, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread  ON messages(receiver_id) WHERE NOT read;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee          ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status    ON listing_reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created        ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lra_audit_property       ON lra_audit_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_property         ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_user             ON payments(user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 11. Storage buckets (skipped automatically when the storage schema is absent)
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not found - create the listing-images / verification-docs buckets by hand';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
    ON CONFLICT (id) DO NOTHING;

  -- Files live under "<user id>/<file>" so ownership can be checked from the path.
  DROP POLICY IF EXISTS "Listing images are public" ON storage.objects;
  DROP POLICY IF EXISTS "Users upload own listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users update own listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users delete own listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users upload own verification docs" ON storage.objects;
  DROP POLICY IF EXISTS "Users read own verification docs" ON storage.objects;
  DROP POLICY IF EXISTS "Admins read verification docs" ON storage.objects;

  CREATE POLICY "Listing images are public" ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-images');
  CREATE POLICY "Users upload own listing images" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Users update own listing images" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Users delete own listing images" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "Users upload own verification docs" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Users read own verification docs" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Admins read verification docs" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'verification-docs' AND public.is_admin());
END $$;
