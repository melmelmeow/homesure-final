-- 007: the columns the payments pages need, and security deposits.
-- Run AFTER 006. Safe to re-run.
--
-- The team settled on **Xendit**. The PayMongo columns on `payments` are left alone so nothing is
-- lost, but the API routes and the front end use the Xendit ones.
--
-- What this adds
--   * payments: due_date, period, method, reference — a rent payment is for a period and is due on
--     a date, and once paid it has a method and a reference number to show the other party.
--   * security_deposits: the amount a seller holds, with itemised deductions, so the buyer can see
--     what is refundable.
--   * profiles.payment_methods: where a seller says how to be paid, so a buyer paying outside the
--     platform can actually read the number.
--   * a private payment-proofs bucket for the screenshots.

DO $$
BEGIN
  IF to_regclass('public.payments') IS NULL THEN
    RAISE EXCEPTION 'Run 006_frontend_alignment.sql first (table "payments" does not exist)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'user_id') THEN
    RAISE EXCEPTION 'Run 006_frontend_alignment.sql first (payments.user_id is missing)';
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. payments
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS due_date  date,
  ADD COLUMN IF NOT EXISTS period    text,      -- e.g. "June 2026"
  ADD COLUMN IF NOT EXISTS method    text,      -- QRPH / GCash / Maya / Bank Transfer / Cash
  ADD COLUMN IF NOT EXISTS reference text,      -- what the buyer shows the seller
  -- Paying outside Xendit (a GCash screenshot, a bank slip) means a human confirms it, so the row
  -- needs somewhere to keep the proof and the seller's decision.
  ADD COLUMN IF NOT EXISTS proof_url        text,
  ADD COLUMN IF NOT EXISTS confirmed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by     uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- A database built from 001 has neither of the next two, because 001's payments table was
-- written before any of this existed. The live database has both already. Add what is missing so
-- the same migration works either way — that is what lets a second deployment start from nothing.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS purpose text;

-- 001 declares status as the enum payment_status (pending, paid, failed, expired); the live
-- database uses plain text. Where it is an enum, the two words this flow adds have to be taught
-- to it, or every manual payment fails on insert.
DO $$
DECLARE enum_name text;
BEGIN
  SELECT t.typname INTO enum_name
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'payments' AND a.attname = 'status'
    AND t.typtype = 'e';

  IF enum_name IS NOT NULL THEN
    EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', enum_name, 'pending_confirmation');
    EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', enum_name, 'rejected');
    RAISE NOTICE 'payments.status is the enum %, added pending_confirmation and rejected', enum_name;
  END IF;
END $$;

-- The status vocabulary used from here on:
--   pending              invoice raised / rent due, nothing received
--   pending_confirmation buyer submitted proof of a manual payment, the seller has not acted
--   paid                 money confirmed (the Xendit webhook, or the seller accepting the proof)
--   rejected             the seller rejected the proof
-- The front end shows "paid" as "Confirmed"; the column keeps the backend's own word.

-- `purpose` carries what the payment is for. Normalise the wording the pages use.
UPDATE payments SET purpose = lower(trim(purpose)) WHERE purpose IS NOT NULL;

DO $$
DECLARE bad text;
BEGIN
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_purpose_check;
  SELECT string_agg(DISTINCT purpose, ', ') INTO bad FROM payments
  WHERE purpose IS NOT NULL AND purpose NOT IN ('rent', 'security', 'both', 'reservation', 'sale');
  IF bad IS NULL THEN
    ALTER TABLE payments ADD CONSTRAINT payments_purpose_check
      CHECK (purpose IS NULL OR purpose IN ('rent', 'security', 'both', 'reservation', 'sale'));
  ELSE
    RAISE NOTICE 'payments.purpose holds unexpected values (%), constraint not added', bad;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. security_deposits
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS security_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'partially_refunded', 'refunded', 'forfeited')),
  -- [{ "reason": "Broken cabinet door", "cost": 2500, "date": "2026-05-15" }]
  deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_security_deposits_buyer  ON security_deposits(buyer_id);
CREATE INDEX IF NOT EXISTS idx_security_deposits_seller ON security_deposits(seller_id);

-- The seller on a deposit is always the listing's owner, whatever the client sends — the same rule
-- viewing_requests uses.
CREATE OR REPLACE FUNCTION public.set_deposit_seller() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT landowner_id INTO NEW.seller_id FROM public.properties WHERE id = NEW.property_id;
    IF NEW.seller_id IS NULL THEN
      RAISE EXCEPTION 'Listing not found' USING ERRCODE = '23503';
    END IF;
    IF NEW.seller_id = NEW.buyer_id THEN
      RAISE EXCEPTION 'A deposit cannot be held against your own listing' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.buyer_id  IS DISTINCT FROM OLD.buyer_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'property, buyer and seller cannot change' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_deposit_seller
  BEFORE INSERT OR UPDATE ON security_deposits
  FOR EACH ROW EXECUTE FUNCTION public.set_deposit_seller();

-- A buyer may read their deposit but never change it: the money is held by the seller, so only the
-- seller (or an admin) records deductions.
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Both sides read the deposit" ON security_deposits;
DROP POLICY IF EXISTS "Sellers record a deposit" ON security_deposits;
DROP POLICY IF EXISTS "Sellers update the deposit" ON security_deposits;
DROP POLICY IF EXISTS "Admins read deposits" ON security_deposits;
DROP POLICY IF EXISTS "Admins update deposits" ON security_deposits;

CREATE POLICY "Both sides read the deposit" ON security_deposits FOR SELECT
  USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "Sellers record a deposit" ON security_deposits FOR INSERT
  WITH CHECK (public.owns_property(property_id));
CREATE POLICY "Sellers update the deposit" ON security_deposits FOR UPDATE
  USING (auth.uid() = seller_id);
CREATE POLICY "Admins read deposits" ON security_deposits FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update deposits" ON security_deposits FOR UPDATE USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Where a seller says how to pay them
-- ════════════════════════════════════════════════════════════════════════════
--
-- The seller fills a GCash number, a Maya number and a bank account in Settings; a buyer paying
-- outside the platform has to be able to read them. The payments pages were writing this into the
-- browser session, so it was lost on sign-out and the buyer never saw it.
--
-- { "gcash": {"enabled":true,"number":"09171234567","name":"Juan Cruz"},
--   "maya":  {"enabled":false,"number":"","name":""},
--   "bank":  {"enabled":true,"bankName":"BPI","accountNumber":"1234567890","accountName":"Juan Cruz"} }
--
-- These are contact details, so they follow the same rule as a phone number: they are NOT in
-- public_profiles. A buyer reads them through get_seller_payment_methods() below, which answers
-- only for a seller they are actually dealing with.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.get_seller_payment_methods(p_seller uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in first' USING ERRCODE = '42501';
  END IF;

  -- Your own details are always yours to read.
  IF auth.uid() <> p_seller THEN
    -- Otherwise there has to be a reason to ask: a payment, a viewing or a conversation about one
    -- of this seller's listings.
    IF NOT EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.landowner_id = p_seller
        AND (public.has_property_relation(pr.id) OR EXISTS (
          SELECT 1 FROM public.messages m
          WHERE m.property_id = pr.id AND auth.uid() IN (m.sender_id, m.receiver_id)
        ))
    ) THEN
      RAISE EXCEPTION 'You are not dealing with this seller' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT payment_methods INTO result FROM public.profiles WHERE id = p_seller;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_seller_payment_methods(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_seller_payment_methods(uuid) TO authenticated;

-- 006 has a trigger that stops a profile from editing its own privileged columns. payment_methods
-- is not one of those: it is the seller's own contact detail, like their phone number.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Proof-of-payment storage
-- ════════════════════════════════════════════════════════════════════════════
--
-- A GCash screenshot shows a real name and number, so the bucket is private. The seller does not
-- own the file, so their policy is tied to the payment row instead: a seller can read exactly the
-- proof attached to a payment on a listing of theirs, and nothing else.

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present, skipping the payment-proofs bucket';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
  ON CONFLICT (id) DO NOTHING;

  DROP POLICY IF EXISTS "Buyers upload own proofs" ON storage.objects;
  DROP POLICY IF EXISTS "Buyers read own proofs" ON storage.objects;
  DROP POLICY IF EXISTS "Sellers read proofs on own listings" ON storage.objects;
  DROP POLICY IF EXISTS "Admins read proofs" ON storage.objects;

  CREATE POLICY "Buyers upload own proofs" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Buyers read own proofs" ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Sellers read proofs on own listings" ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs' AND EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.proof_url = storage.objects.name AND public.owns_property(p.property_id)
    ));
  CREATE POLICY "Admins read proofs" ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs' AND public.is_admin());
END $$;
