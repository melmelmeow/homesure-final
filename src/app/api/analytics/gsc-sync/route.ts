import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { url, query, clicks, impressions, ctr, position } = body;

  if (!url || !query) {
    return NextResponse.json({ error: "url and query are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gsc_metrics")
    .upsert({
      url,
      query,
      clicks: clicks || 0,
      impressions: impressions || 0,
      ctr: ctr || 0,
      position: position || 0,
      synced_at: new Date().toISOString(),
    }, { onConflict: ["url", "query"] as any })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ metric: data }, { status: 200 });
}
