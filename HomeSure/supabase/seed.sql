-- ==========================================
-- HomeSure Supabase Seed Data for Development
-- ==========================================

-- Note: In production, user profiles are created automatically via Auth triggers.
-- For local testing or Supabase SQL editor seed:

INSERT INTO public.profiles (id, email, full_name, role, phone, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'buyer@homesure.com', 'Juan Dela Cruz', 'buyer', '+639171234567', true),
('00000000-0000-0000-0000-000000000002', 'seller@homesure.com', 'Maria Santos', 'seller', '+639189876543', true),
('00000000-0000-0000-0000-000000000003', 'admin@homesure.com', 'Admin User', 'admin', '+639190001122', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.listings (id, seller_id, title, description, property_type, price, location, address, bedrooms, bathrooms, area_sqm, status, images, amenities) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Modern 2BR Condo in BGC Taguig', 'Fully furnished 2-bedroom condominium unit with skyline view.', 'condo', 35000.00, 'Bonifacio Global City, Taguig', 'Unit 14B, High Street Towers, BGC', 2, 2, 65.5, 'available', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], ARRAY['Air Conditioner', 'Swimming Pool', 'Gym', '24/7 Security', 'Balcony']),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Spacious 3BR House in Quezon City', 'Quiet residential house ideal for families with private garage.', 'house', 50000.00, 'Quezon City', '45 Katipunan Avenue, Loyola Heights, QC', 3, 3, 150.0, 'available', ARRAY['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7'], ARRAY['Garage', 'Garden', 'Pet Friendly', 'Balcony']),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'Cozy Studio Apartment near Makati CBD', 'Compact modern studio unit, walking distance to Greenbelt.', 'apartment', 22000.00, 'Legazpi Village, Makati', '102 Dela Rosa St, Makati City', 1, 1, 32.0, 'available', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], ARRAY['Wifi', 'Air Conditioner', 'Elevator', 'Security'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, external_id, xendit_invoice_id, user_id, seller_id, listing_id, amount, fee, net_amount, type, status, payment_method, checkout_url) VALUES
('44444444-4444-4444-4444-444444444444', 'INV-20261009-001', 'inv_xendit_demo_001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 35000.00, 0.00, 35000.00, 'rent', 'PAID', 'GCASH', 'https://checkout.xendit.co/web/inv_xendit_demo_001')
ON CONFLICT (id) DO NOTHING;
