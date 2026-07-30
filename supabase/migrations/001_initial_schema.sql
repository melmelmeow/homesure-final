-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('buyer', 'landowner', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending_ocr', 'pending_lra', 'verified', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');
CREATE TYPE refund_status AS ENUM ('none', 'requested', 'processing', 'completed', 'rejected');

-- 2. USERS & PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role user_role DEFAULT 'buyer',
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROPERTY LISTINGS & LRA DATA
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(14,2) NOT NULL,
    
    title_type VARCHAR(10) CHECK (title_type IN ('TCT', 'OCT', 'CCT')),
    title_number VARCHAR(100) NOT NULL,
    registry_of_deeds VARCHAR(150) NOT NULL,
    tax_declaration_number VARCHAR(100),
    
    verification_state verification_status DEFAULT 'unverified',
    ocr_match_score DECIMAL(5,2) NULL,
    lra_eserbisyo_ref_no VARCHAR(100) NULL,
    is_encumbered BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ NULL,
    verified_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS & XENDIT LEDGER
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    buyer_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'QR_PH',
    xendit_charge_id VARCHAR(255) UNIQUE,
    xendit_qr_string TEXT,
    qr_code_url TEXT,
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INSTANT REFUNDS (DISBURSEMENT LEDGER)
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    disbursement_reference VARCHAR(255) UNIQUE,
    payout_channel VARCHAR(50) DEFAULT 'INSTAPAY',
    destination_account_no VARCHAR(100) NOT NULL,
    destination_bank_code VARCHAR(50) NOT NULL,
    status refund_status DEFAULT 'requested',
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INTERNAL SEARCH & DEMAND ANALYTICS
CREATE TABLE search_demand_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    search_query TEXT NULL,
    location_tag VARCHAR(150) NULL,
    price_min DECIMAL(12,2) NULL,
    price_max DECIMAL(12,2) NULL,
    results_returned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LRA AUDIT LOGS
CREATE TABLE lra_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    ref_no VARCHAR(100) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FAVORITES
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- 9. GSC METRICS
CREATE TABLE gsc_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    query TEXT NOT NULL,
    clicks INT DEFAULT 0,
    impressions INT DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    position DECIMAL(5,2) DEFAULT 0,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PERFORMANCE INDEXES
CREATE INDEX idx_properties_status ON properties(verification_state);
CREATE INDEX idx_search_trgm ON search_demand_logs USING gin (search_query gin_trgm_ops);
CREATE INDEX idx_payments_xendit_id ON payments(xendit_charge_id);
CREATE INDEX idx_payments_property ON payments(property_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_gsc_url ON gsc_metrics(url);
