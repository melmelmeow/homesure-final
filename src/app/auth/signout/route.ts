import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}`;
  }
  return request.url;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  const baseUrl = getBaseUrl(request);
<<<<<<< HEAD
  return NextResponse.redirect(new URL("/auth/login", baseUrl));
=======
  return NextResponse.redirect(new URL("/auth/signin.html", baseUrl));
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  const baseUrl = getBaseUrl(request);
<<<<<<< HEAD
  return NextResponse.redirect(new URL("/auth/login", baseUrl));
=======
  return NextResponse.redirect(new URL("/auth/signin.html", baseUrl));
>>>>>>> b8d0dd5299b9554463705fb605522211f7cb64d6
}


