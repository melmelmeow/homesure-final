-- RLS POLICIES

-- Profiles: Users can read all, update own. Admins can update role.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Properties: Public read verified; landowners CRUD own; admins all.
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read verified properties" ON properties FOR SELECT USING (verification_state = 'verified');
CREATE POLICY "Landowners insert own" ON properties FOR INSERT WITH CHECK (auth.uid() = landowner_id);
CREATE POLICY "Landowners update own" ON properties FOR UPDATE USING (auth.uid() = landowner_id);
CREATE POLICY "Admins update any" ON properties FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins delete any" ON properties FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments: Buyers read own; admins all. No direct inserts from client (API routes only).
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own payments" ON payments FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Admins read all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Refunds: Buyers read own refunds; admins all.
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own refunds" ON refunds FOR SELECT USING (
  auth.uid() = requested_by OR EXISTS (
    SELECT 1 FROM payments WHERE payments.id = refunds.payment_id AND payments.buyer_id = auth.uid()
  )
);
CREATE POLICY "Admins read all refunds" ON refunds FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Search logs: Users insert own; admins read all.
ALTER TABLE search_demand_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own log" ON search_demand_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all logs" ON search_demand_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- LRA audit logs: Admins only.
ALTER TABLE lra_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins insert audit" ON lra_audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins read audit" ON lra_audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Favorites: Users CRUD own.
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own favorite" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users delete own favorite" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- GSC metrics: Admins only.
ALTER TABLE gsc_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read gsc" ON gsc_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
