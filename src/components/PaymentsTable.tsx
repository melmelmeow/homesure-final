"use client";

import { useMemo, useState } from "react";
import { peso, shortDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type PaymentRow = {
  id: string;
  amount: number | string;
  status: string;
  type: string | null;
  created_at: string;
  property_title: string | null;
  payer?: string | null;
};

/**
 * Sort and filter run in the browser over rows the server already fetched, so the table is there on
 * first paint and every click is instant.
 */
export function PaymentsTable({ initialPayments, showPayer = false }: { initialPayments: PaymentRow[]; showPayer?: boolean }) {
  const [status, setStatus] = useState("all");
  const [newestFirst, setNewestFirst] = useState(true);

  const rows = useMemo(() => {
    const filtered = initialPayments.filter((p) => status === "all" || p.status === status);
    return [...filtered].sort((a, b) => (newestFirst ? -1 : 1) * a.created_at.localeCompare(b.created_at));
  }, [initialPayments, status, newestFirst]);

  return (
    <div>
      <div className="mb-3 flex gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text">
          <option value="all">All statuses</option>
          {["pending", "paid", "confirmed", "failed", "expired"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={() => setNewestFirst((v) => !v)} className="rounded-lg border border-border px-3 py-1.5 text-sm">
          {newestFirst ? "Newest first ↓" : "Oldest first ↑"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-2">Date</th><th className="px-4 py-2">Property</th>
              {showPayer && <th className="px-4 py-2">Payer</th>}
              <th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={showPayer ? 6 : 5} className="px-4 py-8 text-center text-text-muted">No payments.</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2">{shortDate(p.created_at)}</td>
                <td className="px-4 py-2">{p.property_title ?? "—"}</td>
                {showPayer && <td className="px-4 py-2">{p.payer ?? "—"}</td>}
                <td className="px-4 py-2 capitalize">{p.type ?? "—"}</td>
                <td className="px-4 py-2 text-right font-medium">{peso(p.amount)}</td>
                <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
