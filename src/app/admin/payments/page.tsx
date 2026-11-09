import type { Metadata } from "next";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { PaymentsTable } from "@/components/PaymentsTable";
import { toPaymentRows } from "@/lib/payments-view";

export const metadata: Metadata = { title: "All payments" };

export default async function AdminPaymentsPage() {
  const { supabase } = await requireRole(ADMIN_ROLES, "/admin/payments");
  const { data } = await supabase
    .from("payments")
    .select("id, amount, status, type, created_at, properties(title), profiles:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  const payers = new Map<string, string | null>();
  ((data ?? []) as unknown as { id: string; profiles: { full_name: string | null } | { full_name: string | null }[] | null }[]).forEach((r) =>
    payers.set(r.id, (Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name) ?? null));

  const rows = toPaymentRows(data).map((r) => ({ ...r, payer: payers.get(r.id) ?? null }));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">All payments</h1>
      <PaymentsTable initialPayments={rows} showPayer />
    </div>
  );
}
