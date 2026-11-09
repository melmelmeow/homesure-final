import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { peso, shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "My listings" };

export default async function SellerListingsPage() {
  const { supabase, user } = await requireRole(["seller"], "/seller/listings");
  const { data } = await supabase
    .from("properties")
    .select("id, title, price, listing_type, status, created_at")
    .eq("landowner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My listings</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft text-xs uppercase text-text-muted">
            <tr><th className="px-4 py-2">Title</th><th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Posted</th></tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No listings yet.</td></tr>}
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2"><Link href={`/property/${p.id}`} className="hover:underline">{p.title}</Link></td>
                <td className="px-4 py-2 capitalize">{p.listing_type}</td>
                <td className="px-4 py-2 text-right">{peso(p.price)}</td>
                <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-2">{shortDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
