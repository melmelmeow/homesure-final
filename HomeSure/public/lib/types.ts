export type UserRole = 'buyer' | 'seller' | 'admin' | 'super-admin';
export type ListingStatus = 'available' | 'rented' | 'pending' | 'inactive';
export type ViewingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
export type PaymentMethod = 'GCASH' | 'MAYA' | 'QRPH' | 'CARD' | 'UNKNOWN';
export type PaymentType = 'rent' | 'deposit' | 'service_fee';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  id_type?: string;
  id_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  property_type: string;
  price: number;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  status: ListingStatus;
  images: string[];
  amenities: string[];
  created_at?: string;
  updated_at?: string;
  seller?: Partial<UserProfile>;
}

export interface ViewingRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  preferred_date: string;
  preferred_time: string;
  status: ViewingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  listing?: Partial<PropertyListing>;
  buyer?: Partial<UserProfile>;
}

export interface PaymentTransaction {
  id: string;
  external_id: string;
  xendit_invoice_id?: string;
  xendit_qr_id?: string;
  user_id: string;
  seller_id?: string;
  listing_id?: string;
  amount: number;
  fee: number;
  net_amount: number;
  type: PaymentType;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  checkout_url?: string;
  qr_code_url?: string;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
  listing?: Partial<PropertyListing>;
}

export interface CreateInvoiceRequest {
  amount: number;
  user_id: string;
  seller_id?: string;
  listing_id?: string;
  payer_email: string;
  description: string;
  payment_type?: PaymentType;
  redirect_url?: string;
}

export interface CreateQRRequest {
  amount: number;
  user_id: string;
  seller_id?: string;
  listing_id?: string;
}

export interface XenditWebhookPayload {
  id?: string;
  external_id: string;
  status: PaymentStatus;
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
}
