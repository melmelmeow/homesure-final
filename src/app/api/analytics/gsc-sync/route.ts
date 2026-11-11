import { NextResponse } from "next/server";
import { ADMIN_ROLES, guardApi } from "@/lib/api";
import { getAdminSupabase } from "@/lib/supabase/admin-client";

export async function POST(request: Request) {
  const guard = await guardApi(ADMIN_ROLES);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const { url, query, clicks, impressions, ctr, position } = body;

  if (!url || !query) {
    return NextResponse.json({ error: "url and query are required" }, { status: 400 });
  }

  // gsc_metrics has no write policies by design -> write with the service role (after the admin check).
  const { data, error } = await getAdminSupabase()
    .from("gsc_metrics")
    .upsert({
      url,
      query,
      clicks: clicks || 0,
      impressions: impressions || 0,
      ctr: ctr || 0,
      position: position || 0,
      synced_at: new Date().toISOString(),
    }, { onConflict: "url,query" })
    .select("*")
    .single();

  if (error) {
    console.error("[gsc-sync] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save the analytics data." }, { status: 500 });
  }
  return NextResponse.json({ metric: data }, { status: 200 });
}
