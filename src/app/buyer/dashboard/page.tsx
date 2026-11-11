import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { PaymentsTable } from "@/components/PaymentsTable";
import { PAYMENT_COLUMNS, toPaymentRows } from "@/lib/payments-view";

export const metadata: Metadata = { title: "Buyer dashboard" };

export default async function BuyerDashboardPage() {
  const { supabase, user, profile } = await requireRole(["buyer"], "/buyer/dashboard");

  // All three queries run at the same time.
  const [payments, saved, unread] = await Promise.all([
    supabase.from("payments").select(PAYMENT_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("saved_properties").select("property_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ]);

  const rows = toPaymentRows(payments.data);

  return (
    <div>
      <h1 className="dash-title">Welcome, {profile.first_name ?? profile.full_name ?? "there"}</h1>
      <p className="dash-sub">Here&apos;s a summary of your activity</p>
      <div className="cards">
        <StatCard label="Recent payments" value={rows.length} />
        <StatCard label="Saved listings" value={saved.count ?? 0} />
        <StatCard label="Unread alerts" value={unread.count ?? 0} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Latest payments</h2>
      <PaymentsTable initialPayments={rows} />
    </div>
  );
}
