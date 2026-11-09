import type { Database } from "./database.types";

export type {
  UserRole,
  AccountStatus,
  VerificationStatus,
  PaymentStatus,
  RefundStatus,
  PropertyType,
  ListingFor,
  ListingStatus,
  LifecycleStatus,
  ViewingStatus,
} from "./database.types";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type Property = Tables["properties"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type Refund = Tables["refunds"]["Row"];
export type SearchDemandLog = Tables["search_demand_logs"]["Row"];
export type LraAuditLog = Tables["lra_audit_logs"]["Row"];
export type ViewingRequest = Tables["viewing_requests"]["Row"];
export type Message = Tables["messages"]["Row"];
export type Review = Tables["reviews"]["Row"];
export type ListingReport = Tables["listing_reports"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type AuditLog = Tables["audit_logs"]["Row"];
