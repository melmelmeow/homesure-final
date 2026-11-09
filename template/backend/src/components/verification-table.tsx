"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Property = {
  id: string;
  title: string;
  title_number: string;
  verification_state: string;
  ocr_match_score: number | null;
  registry_of_deeds: string;
};

type Props = { properties: Property[] };

export default function VerificationTable({ properties }: Props) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [refNo, setRefNo] = useState<{ [key: string]: string }>({});

  const handleVerify = async (propertyId: string, action: "verify" | "reject") => {
    setProcessing(propertyId + action);
    if (!supabase) { alert("Supabase not configured"); setProcessing(null); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Unauthorized"); setProcessing(null); return; }

    const logAction = action === "verify" ? "lra_verified" : "lra_rejected";
    await supabase.from("lra_audit_logs").insert({
      property_id: propertyId,
      admin_id: session.user.id,
      action: logAction,
      ref_no: action === "verify" ? refNo[propertyId] : null,
      notes: action === "verify" ? "Admin verified via LRA eSerbisyo" : "Rejected by admin",
    });

    await supabase.from("properties").update({
      verification_state: action === "verify" ? "verified" : "rejected",
      lra_eserbisyo_ref_no: action === "verify" ? refNo[propertyId] : null,
      verified_at: action === "verify" ? new Date().toISOString() : null,
      verified_by: session.user.id,
    }).eq("id", propertyId);

    setProcessing(null);
    window.location.reload();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Title</th>
            <th className="border p-2 text-left">Title No.</th>
            <th className="border p-2 text-left">RD</th>
            <th className="border p-2 text-left">OCR Score</th>
            <th className="border p-2 text-left">State</th>
            <th className="border p-2 text-left">LRA Ref No.</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.title}</td>
              <td className="border p-2">{p.title_number}</td>
              <td className="border p-2">{p.registry_of_deeds}</td>
              <td className="border p-2">{p.ocr_match_score ? `${p.ocr_match_score}%` : "N/A"}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${p.verification_state === "verified" ? "bg-green-100 text-green-800" : p.verification_state === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {p.verification_state}
                </span>
              </td>
              <td className="border p-2">
                <input
                  type="text"
                  placeholder="LRA Ref No."
                  value={refNo[p.id] || ""}
                  onChange={e => setRefNo({ ...refNo, [p.id]: e.target.value })}
                  className="border rounded p-1 w-40"
                />
              </td>
              <td className="border p-2">
                {p.verification_state !== "verified" && p.verification_state !== "rejected" && (
                  <>
                    <button onClick={() => handleVerify(p.id, "verify")} disabled={processing === p.id + "verify"} className="bg-green-600 text-white px-2 py-1 rounded text-xs mr-1 disabled:bg-gray-400">
                      {processing === p.id + "verify" ? "Processing..." : "Verify"}
                    </button>
                    <button onClick={() => handleVerify(p.id, "reject")} disabled={processing === p.id + "reject"} className="bg-red-600 text-white px-2 py-1 rounded text-xs disabled:bg-gray-400">
                      {processing === p.id + "reject" ? "Processing..." : "Reject"}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {properties.length === 0 && (
            <tr>
              <td colSpan={7} className="border p-4 text-center text-gray-500">No pending verifications.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
