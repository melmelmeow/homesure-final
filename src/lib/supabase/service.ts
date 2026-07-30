import { getServerSupabase } from "./server-client";
import type { Profile, Property, Payment, Refund, SearchDemandLog, LraAuditLog, UserRole, VerificationStatus, PaymentStatus, RefundStatus } from "./types";

// Profiles
export async function getProfile(userId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

// Properties
export async function getProperties(filters?: { verified?: boolean; search?: string; minPrice?: number; maxPrice?: number; location?: string }) {
  const supabase = await getServerSupabase();
  let query = supabase.from("properties").select("*");

  if (filters?.verified !== undefined) {
    query = query.eq("verification_state", filters.verified ? "verified" : "unverified");
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,title_number.ilike.%${filters.search}%`);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters?.location) {
    query = query.ilike("registry_of_deeds", `%${filters.location}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Property[];
}

export async function getProperty(id: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Property;
}

export async function createProperty(property: Omit<Property, "id" | "created_at">) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("properties")
    .insert(property)
    .select("*")
    .single();
  if (error) throw error;
  return data as Property;
}

export async function updateProperty(id: string, updates: Partial<Property>) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Property;
}

export async function deleteProperty(id: string) {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

// Payments
export async function getPayment(id: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function getPaymentByXenditId(xenditChargeId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("xendit_charge_id", xenditChargeId)
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function createPayment(payment: Omit<Payment, "id" | "created_at">) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function updatePayment(id: string, updates: Partial<Payment>) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

// Refunds
export async function getRefund(id: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("refunds")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Refund;
}

export async function getRefundsByPayment(paymentId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("refunds")
    .select("*")
    .eq("payment_id", paymentId);
  if (error) throw error;
  return data as Refund[];
}

export async function createRefund(refund: Omit<Refund, "id" | "created_at">) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("refunds")
    .insert(refund)
    .select("*")
    .single();
  if (error) throw error;
  return data as Refund;
}

export async function updateRefund(id: string, updates: Partial<Refund>) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("refunds")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Refund;
}

// Search logs
export async function logSearch(log: Omit<SearchDemandLog, "id" | "created_at">) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("search_demand_logs")
    .insert(log)
    .select("*")
    .single();
  if (error) throw error;
  return data as SearchDemandLog;
}

// LRA Audit logs
export async function createLraAuditLog(log: Omit<LraAuditLog, "id" | "created_at">) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("lra_audit_logs")
    .insert(log)
    .select("*")
    .single();
  if (error) throw error;
  return data as LraAuditLog;
}

export async function getLraAuditLogs(propertyId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("lra_audit_logs")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as LraAuditLog[];
}

// Favorites
export async function getFavorites(userId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .select("*, properties(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addFavorite(userId: string, propertyId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, property_id: propertyId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeFavorite(userId: string, propertyId: string) {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("property_id", propertyId);
  if (error) throw error;
}

// GSC Metrics
export async function getGscMetrics() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("gsc_metrics")
    .select("*")
    .order("impressions", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertGscMetrics(metrics: Array<{ url: string; query: string; clicks: number; impressions: number; ctr: number; position: number }>) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("gsc_metrics")
    .upsert(metrics, { onConflict: ["url", "query"] as any })
    .select("*");
  if (error) throw error;
  return data;
}
