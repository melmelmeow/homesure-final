import type { Metadata } from "next";
import Link from "next/link";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { peso, shortDate } from "@/lib/format";
import { reviewListing } from "./actions";

export const metadata: Metadata = { title: "Pending listings" };

export default async function AdminListingsPage() {
  const { supabase } = await requireRole(ADMIN_ROLES, "/admin/listings");
  const { data } = await supabase
    .from("properties")
    .select("id, title, price, listing_type, created_at, profiles:landowner_id(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as unknown as {
    id: string; title: string; price: number; listing_type: string; created_at: string;
    profiles: { full_name: string | null } | { full_name: string | null }[] | null;
  }[];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Pending listings</h1>
      {rows.length === 0 && <p className="text-text-muted">Nothing waiting for review.</p>}
      <div className="flex flex-col gap-3">
        {rows.map((p) => {
          const owner = Array.isArray(p.profiles) ? p.profiles[0]?.full_name : p.profiles?.full_name;
          return (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
              <div>
                <Link href={`/property/${p.id}`} className="font-semibold hover:underline">{p.title}</Link>
                <p className="text-sm text-text-muted">{owner ?? "Unknown seller"} · {peso(p.price)} · {p.listing_type} · {shortDate(p.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <form action={reviewListing}>
                  <input type="hidden" name="id" value={p.id} />
                  <button name="decision" value="approve" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary">Approve</button>
                </form>
                <form action={reviewListing} className="flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="reason" maxLength={500} placeholder="Reason" className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm" />
                  <button name="decision" value="reject" className="rounded-lg border border-border px-3 py-1.5 text-sm">Reject</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
