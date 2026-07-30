-- STORED FUNCTIONS & TRIGGERS

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    'buyer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Compute demand index (search velocity)
CREATE OR REPLACE FUNCTION public.compute_demand_index()
RETURNS JSON AS $$
DECLARE
  result JSON;
  property_views INT;
  favorites_count INT;
  inquiries_count INT;
  search_count INT;
BEGIN
  SELECT COUNT(*) INTO property_views FROM search_demand_logs WHERE search_query IS NULL;
  SELECT COUNT(*) INTO favorites_count FROM favorites;
  SELECT COUNT(*) INTO inquiries_count FROM payments WHERE status = 'paid';
  SELECT COUNT(*) INTO search_count FROM search_demand_logs WHERE search_query IS NOT NULL;
  
  result := json_build_object(
    'property_views', property_views,
    'favorites', favorites_count,
    'inquiries', inquiries_count,
    'searches', search_count,
    'demand_index', (search_count * 1.0 + property_views * 2.0 + favorites_count * 3.5 + inquiries_count * 5.0)
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
