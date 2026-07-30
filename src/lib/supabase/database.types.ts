export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone_number: string;
          role: "buyer" | "landowner" | "admin";
          is_kyc_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          phone_number: string;
          role?: "buyer" | "landowner" | "admin";
          is_kyc_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone_number?: string;
          role?: "buyer" | "landowner" | "admin";
          is_kyc_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          landowner_id: string;
          title: string;
          description: string | null;
          price: number;
          title_type: "TCT" | "OCT" | "CCT";
          title_number: string;
          registry_of_deeds: string;
          tax_declaration_number: string | null;
          verification_state: VerificationStatus;
          ocr_match_score: number | null;
          lra_eserbisyo_ref_no: string | null;
          is_encumbered: boolean;
          verified_at: string | null;
          verified_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          landowner_id: string;
          title: string;
          description?: string | null;
          price: number;
          title_type: "TCT" | "OCT" | "CCT";
          title_number: string;
          registry_of_deeds: string;
          tax_declaration_number?: string | null;
          verification_state?: VerificationStatus;
          ocr_match_score?: number | null;
          lra_eserbisyo_ref_no?: string | null;
          is_encumbered?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
        };
        Update: {
          landowner_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          title_type?: "TCT" | "OCT" | "CCT";
          title_number?: string;
          registry_of_deeds?: string;
          tax_declaration_number?: string | null;
          verification_state?: VerificationStatus;
          ocr_match_score?: number | null;
          lra_eserbisyo_ref_no?: string | null;
          is_encumbered?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          property_id: string;
          buyer_id: string;
          amount: number;
          payment_method: string;
          xendit_charge_id: string | null;
          xendit_qr_string: string | null;
          qr_code_url: string | null;
          status: PaymentStatus;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          buyer_id: string;
          amount: number;
          payment_method?: string;
          xendit_charge_id?: string | null;
          xendit_qr_string?: string | null;
          qr_code_url?: string | null;
          status?: PaymentStatus;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          property_id?: string;
          buyer_id?: string;
          amount?: number;
          payment_method?: string;
          xendit_charge_id?: string | null;
          xendit_qr_string?: string | null;
          qr_code_url?: string | null;
          status?: PaymentStatus;
          paid_at?: string | null;
          created_at?: string;
        };
      };
      refunds: {
        Row: {
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
        };
        Insert: {
          id?: string;
          payment_id: string;
          requested_by: string;
          amount: number;
          reason: string;
          disbursement_reference?: string | null;
          payout_channel?: string;
          destination_account_no: string;
          destination_bank_code: string;
          status?: RefundStatus;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          payment_id?: string;
          requested_by?: string;
          amount?: number;
          reason?: string;
          disbursement_reference?: string | null;
          payout_channel?: string;
          destination_account_no?: string;
          destination_bank_code?: string;
          status?: RefundStatus;
          processed_at?: string | null;
          created_at?: string;
        };
      };
      search_demand_logs: {
        Row: {
          id: string;
          user_id: string | null;
          search_query: string | null;
          location_tag: string | null;
          price_min: number | null;
          price_max: number | null;
          results_returned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          search_query?: string | null;
          location_tag?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          results_returned?: number;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          search_query?: string | null;
          location_tag?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          results_returned?: number;
          created_at?: string;
        };
      };
      lra_audit_logs: {
        Row: {
          id: string;
          property_id: string;
          admin_id: string;
          action: string;
          notes: string | null;
          ref_no: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          admin_id: string;
          action: string;
          notes?: string | null;
          ref_no?: string | null;
          created_at?: string;
        };
        Update: {
          property_id?: string;
          admin_id?: string;
          action?: string;
          notes?: string | null;
          ref_no?: string | null;
          created_at?: string;
        };
      };
      gsc_metrics: {
        Row: {
          id: string;
          url: string;
          query: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
          synced_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          query: string;
          clicks?: number;
          impressions?: number;
          ctr?: number;
          position?: number;
          synced_at?: string;
        };
        Update: {
          url?: string;
          query?: string;
          clicks?: number;
          impressions?: number;
          ctr?: number;
          position?: number;
          synced_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      compute_demand_index: {
        Args: {};
        Returns: Json;
      };
    };
    Enums: {
      user_role: "buyer" | "landowner" | "admin";
      verification_status: "unverified" | "pending_ocr" | "pending_lra" | "verified" | "rejected";
      payment_status: "pending" | "paid" | "failed" | "expired";
      refund_status: "none" | "requested" | "processing" | "completed" | "rejected";
    };
  };
}

export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type RefundStatus = Database["public"]["Enums"]["refund_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
