// Hand-maintained types for the schema in supabase/migrations (001-006).
// Prefer regenerating with `supabase gen types typescript` once the Supabase CLI is set up.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Insert = required columns + everything else optional; Update = everything optional.
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        email: string;
        full_name: string;
        first_name: string | null;
        last_name: string | null;
        phone_number: string;
        avatar_url: string | null;
        role: UserRole;
        account_status: AccountStatus;
        is_kyc_verified: boolean;
        verified_at: string | null;
        verification_expiry: string | null;
        phone_verified: boolean;
        submitted_verification_at: string | null;
        moa_signed_at: string | null;
        verification_docs: Json;
        warning_count: number;
        suspended_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "email" | "full_name" | "phone_number">;

      properties: Table<{
        id: string;
        landowner_id: string;
        title: string;
        description: string | null;
        price: number;
        // listing fields used by the front end
        type: PropertyType | null;
        listing_for: ListingFor;
        barangay: string | null;
        address: string | null;
        lat: number | null;
        lng: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        floor_area: number | null;
        lot_area: number | null;
        negotiable: boolean;
        featured: boolean;
        amenities: string[];
        images: string[];
        documents: Json;
        has_multiple_units: boolean;
        total_units: number | null;
        available_units: number | null;
        // admin moderation
        status: ListingStatus;
        lifecycle_status: LifecycleStatus | null;
        rejection_reason: string | null;
        rejection_notes: string | null;
        approved_by: string | null;
        approved_at: string | null;
        // title verification (OCR + LRA)
        title_type: "TCT" | "OCT" | "CCT" | null;
        title_number: string | null;
        registry_of_deeds: string | null;
        tax_declaration_number: string | null;
        verification_state: VerificationStatus;
        ocr_match_score: number | null;
        lra_eserbisyo_ref_no: string | null;
        is_encumbered: boolean;
        verified_at: string | null;
        verified_by: string | null;
        created_at: string;
        updated_at: string;
      }, "landowner_id" | "title" | "price">;

      payments: Table<{
        id: string;
        property_id: string;
        user_id: string;                 // the payer (the live database calls it user_id)
        amount: number;
        currency: string | null;
        purpose: string | null;
        type: "sale" | "rent" | null;
        move_in_date: string | null;
        status: string;                  // plain text in the live database, not an enum
        qr_code_url: string | null;
        paid_at: string | null;
        expires_at: string | null;
        created_at: string;
        // PayMongo (already in the database)
        paymongo_source_id: string | null;
        paymongo_reference: string | null;
        webhook_payload: string | null;
        webhook_received_at: string | null;
        // Xendit (used by the API routes)
        xendit_charge_id: string | null;
        xendit_qr_string: string | null;
      }, "property_id" | "user_id" | "amount">;

      refunds: Table<{
        id: string;
        payment_id: string;
        requested_by: string;
        amount: number;
        reason: string;
        disbursement_reference: string | null;
        payout_channel: string;
        destination_account_no: string;
        destination_bank_code: string;
        status: RefundStatus;
        processed_at: string | null;
        created_at: string;
      }, "payment_id" | "requested_by" | "amount" | "reason" | "destination_account_no" | "destination_bank_code">;

      search_demand_logs: Table<{
        id: string;
        user_id: string | null;
        search_query: string | null;
        location_tag: string | null;
        price_min: number | null;
        price_max: number | null;
        results_returned: number;
        created_at: string;
      }, never>;

      lra_audit_logs: Table<{
        id: string;
        property_id: string;
        admin_id: string;
        action: string;
        notes: string | null;
        ref_no: string | null;
        created_at: string;
      }, "property_id" | "admin_id" | "action">;

      gsc_metrics: Table<{
        id: string;
        url: string;
        query: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
        synced_at: string;
      }, "url" | "query">;

      favorites: Table<{
        id: string;
        user_id: string;
        property_id: string;
        created_at: string;
      }, "user_id" | "property_id">;

      viewing_requests: Table<{
        id: string;
        property_id: string;
        buyer_id: string;
        seller_id: string; // forced to the listing owner by a trigger
        status: ViewingStatus;
        requested_date: string;
        requested_time: string;
        proposed_date: string | null;
        proposed_time: string | null;
        buyer_notes: string | null;
        seller_notes: string | null;
        created_at: string;
        updated_at: string;
      }, "property_id" | "buyer_id" | "requested_date" | "requested_time">;

      messages: Table<{
        id: string;
        sender_id: string;
        receiver_id: string;
        type: "text" | "viewing-request" | "viewing-response";
        body: string | null;
        property_id: string | null;
        viewing_request_id: string | null;
        viewing_data: Json | null;
        status: string | null;
        read: boolean;
        created_at: string;
        conversation_key: string; // generated
      }, "sender_id" | "receiver_id">;

      reviews: Table<{
        id: string;
        type: "buyer-to-seller" | "seller-to-buyer";
        reviewer_id: string;
        reviewee_id: string;
        property_id: string | null;
        rating: number;
        comment: string | null;
        helpful: number;
        created_at: string;
      }, "type" | "reviewer_id" | "reviewee_id" | "rating">;

      listing_reports: Table<{
        id: string;
        property_id: string;
        reported_by: string;
        category: string;
        reason: string;
        status: "pending" | "under_review" | "resolved" | "dismissed";
        action_taken: string | null;
        admin_notes: string | null;
        resolved_by: string | null;
        resolved_at: string | null;
        created_at: string;
      }, "property_id" | "reported_by" | "category" | "reason">;

      notifications: Table<{
        id: string;
        user_id: string;
        type: string;
        title: string | null;
        body: string;
        link: string | null;
        data: Json;
        read: boolean;
        created_at: string;
      }, "user_id" | "body">;

      audit_logs: Table<{
        id: string;
        actor_id: string | null;
        actor_name: string | null;
        actor_role: string | null;
        action: string;
        type: string;
        status: "success" | "failed";
        details: string | null;
        ip_address: string | null;
        created_at: string;
      }, "action">;
    };
    Views: {
      // Safe subset of profiles (no email/phone) for showing other users.
      public_profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          account_status: AccountStatus;
          created_at: string;
        };
      };
    };
    Functions: {
      compute_demand_index: {
        Args: {};
        Returns: Json;
      };
      name_similarity: {
        Args: { str1: string; str2: string };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      payment_status: PaymentStatus;
      refund_status: RefundStatus;
    };
  };
}

export type UserRole = "buyer" | "seller" | "admin" | "superadmin" | "super_duper_admin";
export type AccountStatus = "unverified" | "pending" | "verified" | "reverification";
export type VerificationStatus = "unverified" | "pending_ocr" | "pending_lra" | "verified" | "rejected";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type RefundStatus = "none" | "requested" | "processing" | "completed" | "rejected";
export type PropertyType = "house" | "apartment" | "condo" | "commercial" | "lot";
export type ListingFor = "sale" | "rent";
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "closed";
export type LifecycleStatus = "sold" | "rented";
export type ViewingStatus = "pending" | "accepted" | "declined" | "counter-proposed" | "confirmed" | "cancelled";
