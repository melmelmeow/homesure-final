-- ═════════════════════════════════════════════════════════════════════════════
-- 013_viewing_slot_locking.sql
--
-- Nothing stopped two buyers from requesting — or even both getting approved for — the exact
-- same property/date/time viewing slot. This closes that gap for the one state that actually
-- means something was promised: a *confirmed* viewing (requests still sitting at 'pending' or
-- 'counter-proposed' are not reservations; they're just asks the seller hasn't acted on yet).
--
-- Three pieces:
--   1. A partial unique index — the actual guarantee. Even if two sellers' tabs race to confirm
--      the same slot for two different buyers, only one UPDATE can win; the second fails the
--      constraint instead of silently double-booking.
--   2. A trigger that, the moment a request is confirmed, auto-declines every other *pending*
--      request still sitting on that exact property/date/time — so a seller can't later approve
--      a second request for a slot that's already taken, and the losing buyer(s) get a real
--      decline (mirrored into their chat, same shape HS.viewing.respond() already produces)
--      instead of silence.
--   3. get_confirmed_viewing_slots(property_id) — a SECURITY DEFINER RPC so a buyer who hasn't
--      requested a viewing yet (and so isn't a participant on any row for this property) can
--      still see which slots are already taken before they submit. "Participants read viewing
--      requests" (002/006) intentionally keeps full request rows — buyer identities, notes —
--      restricted to the people on them; this returns only the date/time of confirmed slots,
--      nothing else, so that stays true while still letting the schedule-viewing modal check
--      availability up front instead of failing after the fact.
--
-- Safe to re-run: CREATE INDEX/TRIGGER/FUNCTION use IF NOT EXISTS / DROP IF EXISTS / OR REPLACE.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. One confirmed slot per property/date/time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_confirmed_viewing_slot
  ON viewing_requests (property_id, requested_date, requested_time)
  WHERE status = 'confirmed';

-- 2. Auto-decline conflicting pending requests once one is confirmed.
CREATE OR REPLACE FUNCTION public.decline_conflicting_viewing_requests() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loser RECORD;
BEGIN
  IF NEW.status <> 'confirmed' OR OLD.status IS NOT DISTINCT FROM 'confirmed' THEN
    RETURN NEW;
  END IF;

  FOR loser IN
    SELECT id, buyer_id FROM viewing_requests
    WHERE property_id = NEW.property_id
      AND requested_date = NEW.requested_date
      AND requested_time = NEW.requested_time
      AND id <> NEW.id
      AND status = 'pending'
  LOOP
    UPDATE viewing_requests
    SET status = 'declined',
        seller_notes = COALESCE(seller_notes, 'Automatically declined — this time slot was booked by another buyer.'),
        updated_at = now()
    WHERE id = loser.id;

    INSERT INTO messages (sender_id, receiver_id, type, property_id, viewing_request_id, status, viewing_data)
    VALUES (
      NEW.seller_id, loser.buyer_id, 'viewing-response', NEW.property_id, loser.id, 'declined',
      jsonb_build_object(
        'listingId', NEW.property_id,
        'originalDate', NEW.requested_date, 'originalTime', NEW.requested_time,
        'sellerNotes', 'Automatically declined — this time slot was booked by another buyer.'
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decline_conflicting_viewing_requests ON viewing_requests;
CREATE TRIGGER trg_decline_conflicting_viewing_requests
  AFTER UPDATE ON viewing_requests
  FOR EACH ROW EXECUTE FUNCTION public.decline_conflicting_viewing_requests();

-- 3. Confirmed slots for a listing, visible to anyone (not just that request's buyer/seller) —
-- only the date and time, nothing identifying.
CREATE OR REPLACE FUNCTION public.get_confirmed_viewing_slots(p_property uuid)
RETURNS TABLE (requested_date date, requested_time time)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT requested_date, requested_time
  FROM viewing_requests
  WHERE property_id = p_property AND status = 'confirmed';
$$;

GRANT EXECUTE ON FUNCTION public.get_confirmed_viewing_slots(uuid) TO authenticated;
