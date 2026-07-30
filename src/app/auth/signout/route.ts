import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server-client";

export async function GET() {
  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}

export async function POST() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
