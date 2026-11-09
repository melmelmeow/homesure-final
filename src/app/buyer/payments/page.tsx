import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { PaymentsTable } from "@/components/PaymentsTable";
import { PAYMENT_COLUMNS, toPaymentRows } from "@/lib/payments-view";

export const metadata: Metadata = { title: "My payments" };

export default async function BuyerPaymentsPage() {
  const { supabase, user } = await requireRole(["buyer"], "/buyer/payments");
  const { data } = await supabase
    .from("payments").select(PAYMENT_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My payments</h1>
      <PaymentsTable initialPayments={toPaymentRows(data)} />
    </div>
  );
}
