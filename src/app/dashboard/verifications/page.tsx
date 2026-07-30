import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import VerificationTable from "@/components/verification-table";

export const dynamic = "force-dynamic";

export default async function VerificationsPage() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .neq("verification_state", "verified")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Verification Queue</h1>
      <VerificationTable properties={properties || []} />
    </div>
  );
}
