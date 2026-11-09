import type { PaymentRow } from "@/components/PaymentsTable";

type Raw = {
  id: string;
  amount: number | string;
  status: string;
  type: string | null;
  created_at: string;
  properties: { title: string } | { title: string }[] | null;
};

export const PAYMENT_COLUMNS = "id, amount, status, type, created_at, properties(title)";

export function toPaymentRows(rows: unknown[] | null): PaymentRow[] {
  return ((rows ?? []) as Raw[]).map((r) => ({
    id: r.id,
    amount: r.amount,
    status: r.status,
    type: r.type,
    created_at: r.created_at,
    property_title: (Array.isArray(r.properties) ? r.properties[0]?.title : r.properties?.title) ?? null,
  }));
}
