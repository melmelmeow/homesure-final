

import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import PropertyTable from "@/components/property-table";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");
  let message = "Hello";
  //const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  const { data: properties, error, count, status } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <a href="/dashboard/properties/new" className="bg-blue-600 text-white px-4 py-2 rounded">List New Property</a>
      </div>
      <PropertyTable properties={properties || []}  />
    </div>
  );
}
