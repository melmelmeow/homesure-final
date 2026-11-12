import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface VisionAnnotation {
  fullTextAnnotation?: {
    text?: string;
  };
}

interface VisionResponse {
  responses?: VisionAnnotation[];
  error?: { message: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check — session required
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OCR service is not configured.' },
        { status: 500 }
      );
    }

    // Parse multipart FormData
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'No image file provided. Send a "image" field in FormData.' },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Call Google Vision API
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      throw new Error(`Vision API error ${visionRes.status}: ${errText}`);
    }

    const visionData: VisionResponse = await visionRes.json();

    if (visionData.error) {
      throw new Error(visionData.error.message);
    }

    const extractedText =
      visionData.responses?.[0]?.fullTextAnnotation?.text ?? '';

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OCR] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
