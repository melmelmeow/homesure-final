import { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Refund = Database["public"]["Tables"]["refunds"]["Row"];
export type SearchDemandLog = Database["public"]["Tables"]["search_demand_logs"]["Row"];
export type LraAuditLog = Database["public"]["Tables"]["lra_audit_logs"]["Row"];

export type UserRole = "buyer" | "landowner" | "admin";
export type VerificationStatus = "unverified" | "pending_ocr" | "pending_lra" | "verified" | "rejected";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type RefundStatus = "none" | "requested" | "processing" | "completed" | "rejected";
