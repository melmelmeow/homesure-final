"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Refund = {
  id: string;
  amount: number;
  status: string;
  reason: string;
  processed_at: string | null;
  created_at: string;
  payments: { amount: number; properties: { title: string } };
};

type Props = { refunds: Refund[]; userRole: string };

export default function RefundsTable({ refunds, userRole }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Property</th>
            <th className="border p-2 text-left">Amount</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Reason</th>
            <th className="border p-2 text-left">Date</th>
            {userRole === "admin" && <th className="border p-2 text-left">Disburse</th>}
          </tr>
        </thead>
        <tbody>
          {refunds.map((refund) => (
            <tr key={refund.id}>
              <td className="border p-2">{refund.payments?.properties?.title || "Unknown"}</td>
              <td className="border p-2">₱{refund.amount.toLocaleString()}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${refund.status === "completed" ? "bg-green-100 text-green-800" : refund.status === "requested" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                  {refund.status}
                </span>
              </td>
              <td className="border p-2">{refund.reason}</td>
              <td className="border p-2">{new Date(refund.created_at).toLocaleDateString()}</td>
              {userRole === "admin" && (
                <td className="border p-2">
                  {refund.status === "requested" && (
                    <RefundDisburseButton refundId={refund.id} />
                  )}
                </td>
              )}
            </tr>
          ))}
          {refunds.length === 0 && (
            <tr>
              <td colSpan={userRole === "admin" ? 6 : 5} className="border p-4 text-center text-gray-500">No refunds found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RefundDisburseButton({ refundId }: { refundId: string }) {
  const [loading, setLoading] = useState(false);
  const handleDisburse = async () => {
    setLoading(true);
    const res = await fetch("/api/refunds/disburse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refundId }),
    });
    if (res.ok) {
      alert("Disbursement initiated");
      window.location.reload();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to disburse");
    }
    setLoading(false);
  };
  return (
    <button onClick={handleDisburse} disabled={loading} className="bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:bg-gray-400">
      {loading ? "Processing..." : "Disburse"}
    </button>
  );
}
