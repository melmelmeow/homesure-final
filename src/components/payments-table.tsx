"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Payment = {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  properties: { title: string } | null;
  profiles: { full_name: string; email: string } | null;
};

type Props = {
  payments: Payment[];
  userRole: string;
  buyerId: string;
};

export default function PaymentsTable({ payments, userRole, buyerId }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRefund = async (paymentId: string, amount: number) => {
    setProcessingId(paymentId);
    const accountNo = prompt("Enter destination e-wallet/bank account number:");
    const bankCode = prompt("Enter bank code (e.g., GCASH, MAYA, BDO):");
    if (!accountNo || !bankCode) { setProcessingId(null); return; }

    const reason = prompt("Enter refund reason:");
    if (!reason) { setProcessingId(null); return; }

    const res = await fetch("/api/refunds/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, amount, reason, destinationAccountNo: accountNo, destinationBankCode: bankCode }),
    });

    if (res.ok) {
      alert("Refund requested successfully");
      window.location.reload();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to request refund");
    }
    setProcessingId(null);
  };

  const handleDisburse = async (refundId: string) => {
    setProcessingId(refundId);
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
    setProcessingId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Property</th>
            <th className="border p-2 text-left">Amount</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Date</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="border p-2">{payment.properties?.title || "Unknown"}</td>
              <td className="border p-2">₱{payment.amount.toLocaleString()}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${payment.status === "paid" ? "bg-green-100 text-green-800" : payment.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                  {payment.status}
                </span>
              </td>
              <td className="border p-2">{new Date(payment.created_at).toLocaleDateString()}</td>
              <td className="border p-2">
                {payment.status === "paid" && (
                  <button onClick={() => handleRefund(payment.id, payment.amount)} disabled={processingId === payment.id} className="bg-red-600 text-white px-2 py-1 rounded text-xs disabled:bg-gray-400">
                    {processingId === payment.id ? "Processing..." : "Request Refund"}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={5} className="border p-4 text-center text-gray-500">No payments found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
