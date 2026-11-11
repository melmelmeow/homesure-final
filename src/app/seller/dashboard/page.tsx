import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = { title: "Seller dashboard" };

export default async function SellerDashboardPage() {
  const { supabase, user, profile } = await requireRole(["seller"], "/seller/dashboard");

  const count = (status?: string) => {
    let q = supabase.from("properties").select("id", { count: "exact", head: true }).eq("landowner_id", user.id);
    if (status) q = q.eq("status", status);
    return q;
  };
  const [all, approved, pending] = await Promise.all([count(), count("approved"), count("pending")]);

  return (
    <div>
      <h1 className="dash-title">Welcome, {profile.first_name ?? profile.full_name ?? "there"}</h1>
      <p className="dash-sub">
        Account status: <StatusBadge status={profile.account_status} />
      </p>
      <div className="cards">
        <StatCard label="Total listings" value={all.count ?? 0} />
        <StatCard label="Live" value={approved.count ?? 0} />
        <StatCard label="Awaiting approval" value={pending.count ?? 0} />
      </div>
    </div>
  );
}
