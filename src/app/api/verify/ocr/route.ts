import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";
import { rateLimit } from "@/lib/rate-limit";
import { ocrSchema } from "@/lib/schemas";

// Where land titles live: the PRIVATE "verification-docs" bucket, under "<user id>/<file>" — the
// layout data.js storage.upload() writes and the storage policies check. (This route used to read a
// public bucket called "titles", which no migration creates.)
const DOCS_BUCKET = "verification-docs";
const SAFE_FILE = /^[A-Za-z0-9._-]{1,150}\.(jpg|jpeg|png|webp)$/i;

export async function POST(request: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  // Each call is a paid Google Vision request.
  const limited = await rateLimit("ocr", user.id, 10, 600);
  if (!limited.ok) return limited.response;

  const parsed = ocrSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "propertyId and imagePath are required" }, { status: 400 });
  }
  const { propertyId, imagePath } = parsed.data;

  // imagePath must be exactly "<your user id>/<file name>": no other folders, no "..", no odd
  // characters. Without this a caller could point the route at any object in the bucket, including
  // other people's IDs and titles.
  const [folder, file, ...extra] = imagePath.split("/");
  if (extra.length > 0 || folder !== user.id || !file || file.includes("..") || !SAFE_FILE.test(file)) {
    return NextResponse.json(
      { error: "imagePath must be an image you uploaded to your own verification folder" },
      { status: 400 },
    );
  }

  // Only the owner may run OCR on a listing (RLS lets owners read their own, non-public listings).
  const { data: property } = await supabase.from("properties").select("id, landowner_id").eq("id", propertyId).single();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landowner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // A signed link that expires in 60 seconds — long enough for Vision to fetch it, and nothing
    // permanent is ever exposed. Created as the CALLER, so the storage policies still apply.
    const { data: signed, error: signError } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(imagePath, 60);
    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Could not access that document" }, { status: 404 });
    }
    const imageUrl = signed.signedUrl;

    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!visionApiKey) return NextResponse.json({ error: "Vision API not configured" }, { status: 500 });
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;

    const visionBody = {
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
        },
      ],
    };

    const visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visionBody),
    });

    const visionData = await visionRes.json();
    const fullText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    const titleNumberMatch = fullText.match(/Title\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9\-]+)/i);
    const ownerMatch = fullText.match(/Owner[s]?\s*:?\s*([A-Z][A-Z\s\.]+)/i);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

    let matchScore: number | null = null;
    if (profile?.full_name && ownerMatch) {
      const titleOwner = ownerMatch[1].trim();
      const profileName = String(profile.full_name).toUpperCase();
      const { data: similarityData } = await supabase.rpc("name_similarity", {
        str1: profileName,
        str2: titleOwner,
      });
      matchScore = similarityData;
    }

    // verification_state is admin/system-owned (owners are blocked by a DB trigger) -> service role.
    await getAdminSupabase().from("properties").update({
      verification_state: matchScore !== null && matchScore >= 0.85 ? "pending_lra" : "rejected",
      ocr_match_score: matchScore ? parseFloat((matchScore * 100).toFixed(2)) : null,
    }).eq("id", propertyId);

    return NextResponse.json({
      fullText,
      extractedTitleNumber: titleNumberMatch?.[1] || null,
      extractedOwner: ownerMatch?.[1] || null,
      matchScore,
    });
  } catch (error) {
    console.error("[ocr] failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
