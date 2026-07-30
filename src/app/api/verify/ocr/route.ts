import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { propertyId, imagePath } = body;

  if (!propertyId || !imagePath) {
    return NextResponse.json({ error: "propertyId and imagePath are required" }, { status: 400 });
  }

  try {
    const { data: { publicUrl } } = supabase.storage.from("titles").getPublicUrl(imagePath);

    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;

    const visionBody = {
      requests: [
        {
          image: { source: { imageUri: publicUrl } },
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

    const { data: property } = await supabase.from("properties").select("*").eq("id", propertyId).single();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();

    let matchScore: number | null = null;
    if (property && profile && ownerMatch) {
      const titleOwner = ownerMatch[1].trim();
      const profileName = profile.full_name.toUpperCase();
      const { data: similarityData } = await supabase.rpc("similarity", {
        str1: profileName,
        str2: titleOwner,
      });
      matchScore = similarityData;
    }

    await supabase.from("properties").update({
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
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
