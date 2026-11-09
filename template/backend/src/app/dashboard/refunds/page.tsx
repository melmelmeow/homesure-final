import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import RefundsTable from "@/components/refunds-table";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  const { data: refunds } = await supabase
    .from("refunds")
    .select("*, payments!inner(amount, properties(title))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Refunds</h1>
      <RefundsTable refunds={refunds || []} userRole={profile?.role || "buyer"} />
    </div>
  );
}
