import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { PropertyDetailClient } from "./property-detail-client";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: property } = await supabase.from("properties").select("*").eq("id", params.id).single();
  if (!property) return <div>Property not found</div>;

  return <PropertyDetailClient property={property} userId={session.user.id} />;
}
