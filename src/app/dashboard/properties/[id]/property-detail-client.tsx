"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Property = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  title_type: string;
  title_number: string;
  registry_of_deeds: string;
  verification_state: string;
  ocr_match_score: number | null;
  is_encumbered: boolean;
  landowner_id: string;
};

type Props = {
  property: Property;
  userId: string;
};

export function PropertyDetailClient({ property, userId }: Props) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleOcr = async () => {
    setOcrLoading(true);
    if (!supabase) { alert("Supabase not configured"); setOcrLoading(false); return; }
    const fileInput = document.getElementById("title-image") as HTMLInputElement;
    if (!fileInput?.files?.[0]) { alert("Select an image first"); setOcrLoading(false); return; }

    const file = fileInput.files[0];
    const filePath = `${userId}/${property.id}/title-${Date.now()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("titles").upload(filePath, file);
    if (uploadError) { alert(uploadError.message); setOcrLoading(false); return; }

    const { data: urlData } = supabase.storage.from("titles").getPublicUrl(uploadData.path);
    setImageUrl(urlData.publicUrl);

    const res = await fetch("/api/verify/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, imagePath: uploadData.path }),
    });
    const result = await res.json();
    setOcrResult(result);
    setOcrLoading(false);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{property.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-xl font-bold">₱{property.price.toLocaleString()}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Title</p>
          <p className="font-semibold">{property.title_type} {property.title_number}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Registry of Deeds</p>
          <p className="font-semibold">{property.registry_of_deeds}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Verification State</p>
          <span className={`px-2 py-1 rounded text-sm ${property.verification_state === "verified" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {property.verification_state}
          </span>
          {property.ocr_match_score && <p className="text-xs text-gray-500 mt-1">OCR Match: {property.ocr_match_score}%</p>}
        </div>
      </div>

      {property.description && <p className="mb-6 text-gray-700">{property.description}</p>}

      {userId === property.landowner_id && property.verification_state === "unverified" && (
        <div className="border rounded p-4 mb-6">
          <h3 className="font-semibold mb-2">Upload Land Title for OCR Verification</h3>
          <input id="title-image" type="file" accept="image/*" className="mb-2" />
          <button onClick={handleOcr} disabled={ocrLoading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">
            {ocrLoading ? "Processing OCR..." : "Run OCR"}
          </button>
          {imageUrl && <img src={imageUrl} alt="Uploaded title" className="mt-4 max-h-64 border rounded" />}
          {ocrResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="font-semibold">OCR Result</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(ocrResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
