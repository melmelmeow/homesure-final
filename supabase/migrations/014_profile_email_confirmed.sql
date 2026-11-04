-- ═════════════════════════════════════════════════════════════════════════════
-- 014_profile_email_confirmed.sql
--
-- `handle_new_user()` (003/006) inserts a profiles row the instant an auth.users row appears —
-- which, per src/app/api/auth/signup's own design, happens BEFORE the person has proved they own
-- that email address (the account is created with email_confirm: false and stays unusable until
-- the confirmation link is opened). profiles had no record of that distinction at all, so every
-- abandoned signup attempt (someone who typed an email, never opened the link, and walked away)
-- sat in `profiles` forever and showed up in the admin Users list and every count built on
-- HS.admin.users() (dashboard totals, analytics, reports) right alongside real, usable accounts.
--
-- Adds profiles.email_confirmed_at, mirrored from auth.users.email_confirmed_at: set at insert
-- time by handle_new_user(), and kept in sync afterward by a trigger on auth.users (fires once,
-- the moment GET /api/auth/verify-email or any other path confirms the address). Existing rows are
-- backfilled from auth.users in one pass so this takes effect immediately, not just for new signups.
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS first.
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;

-- Backfill from the auth server's own record — the only source of truth for this.
UPDATE profiles p
SET email_confirmed_at = u.email_confirmed_at
FROM auth.users u
WHERE u.id = p.id
  AND p.email_confirmed_at IS DISTINCT FROM u.email_confirmed_at;

-- handle_new_user(): also carry over whatever confirmation state the auth row already has at
-- creation (normally NULL, but not necessarily — an admin-created account could start confirmed).
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
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, role, email_confirmed_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_full,
    COALESCE(v_first, NULLIF(split_part(v_full, ' ', 1), '')),
    COALESCE(v_last, NULLIF(trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 1)), '')),
    NULLIF(meta->>'phone_number', ''),
    v_role,
    NEW.email_confirmed_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Keep profiles.email_confirmed_at in sync the moment the auth server's own column changes.
CREATE OR REPLACE FUNCTION public.sync_profile_email_confirmed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.profiles SET email_confirmed_at = NEW.email_confirmed_at WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email_confirmed();
