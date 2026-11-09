import type { Metadata } from "next";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(ADMIN_ROLES, "/admin/dashboard");
  const head = { count: "exact" as const, head: true };

  const [users, listings, pending, payments] = await Promise.all([
    supabase.from("profiles").select("id", head),
    supabase.from("properties").select("id", head).eq("status", "approved"),
    supabase.from("properties").select("id", head).eq("status", "pending"),
    supabase.from("payments").select("id", head),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.count ?? 0} />
        <StatCard label="Live listings" value={listings.count ?? 0} />
        <StatCard label="Awaiting approval" value={pending.count ?? 0} />
        <StatCard label="Payments" value={payments.count ?? 0} />
      </div>
    </div>
  );
}
