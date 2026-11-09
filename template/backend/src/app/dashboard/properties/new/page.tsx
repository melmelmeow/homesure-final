"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type TitleType = "TCT" | "OCT" | "CCT";

export default function NewPropertyPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    title_type: "TCT" as TitleType,
    title_number: "",
    registry_of_deeds: "",
    tax_declaration_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!supabase) { setError("Supabase not configured"); setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Unauthorized"); setLoading(false); return; }

    const { error } = await supabase.from("properties").insert({
      ...formData,
      landowner_id: session.user.id,
      price: parseFloat(formData.price),
      verification_state: "pending_ocr",
    });
    if (error) setError(error.message);
    else router.push("/dashboard/properties");
  };

  const inputClass = "w-full border rounded p-2 mb-2";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">List New Property</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className={inputClass} placeholder="Property Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
        <textarea className={`${inputClass} h-32`} placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <input className={inputClass} type="number" placeholder="Price (PHP)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
        <select className={inputClass} value={formData.title_type} onChange={e => setFormData({...formData, title_type: e.target.value as TitleType})}>
          <option value="TCT">TCT</option>
          <option value="OCT">OCT</option>
          <option value="CCT">CCT</option>
        </select>
        <input className={inputClass} placeholder="Title Number" value={formData.title_number} onChange={e => setFormData({...formData, title_number: e.target.value})} required />
        <input className={inputClass} placeholder="Registry of Deeds" value={formData.registry_of_deeds} onChange={e => setFormData({...formData, registry_of_deeds: e.target.value})} required />
        <input className={inputClass} placeholder="Tax Declaration Number" value={formData.tax_declaration_number} onChange={e => setFormData({...formData, tax_declaration_number: e.target.value})} />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
    </div>
  );
}
