import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import PaymentsTable from "@/components/payments-table";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();

  let query = supabase.from("payments").select("*, properties(title), profiles!buyer_id(full_name, email)").order("created_at", { ascending: false });
  if (profile?.role !== "admin") {
    query = query.eq("buyer_id", session.user.id);
  }

  const { data: payments } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <PaymentsTable payments={payments || []} userRole={profile?.role || "buyer"} buyerId={session.user.id} />
    </div>
  );
}
