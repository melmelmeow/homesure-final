import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PropertyCard, type CardProperty } from "@/components/PropertyCard";
import { first } from "@/lib/format";

export const metadata: Metadata = { title: "Browse properties" };

type SP = { [k: string]: string | string[] | undefined };

// The filter is a plain GET form, so it works with no JavaScript and every filtered view has its
// own shareable URL. The query itself runs on the server.
export default async function BrowsePage({ searchParams }: { searchParams: SP }) {
  const supabase = await createClient();
  const barangay = first(searchParams.barangay);
  const type = first(searchParams.type);
  const min = Number(first(searchParams.min));
  const max = Number(first(searchParams.max));

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("properties")
    .select("id, title, price, listing_type, address, images, thumbnail_url, barangay_id, barangays(name)")
    .eq("status", "approved")
    .not("lifecycle_status", "in", "(sold,rented)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (/^\d+$/.test(barangay)) query = query.eq("barangay_id", Number(barangay));
  if (type === "rent" || type === "sale") query = query.eq("listing_type", type);
  if (Number.isFinite(min) && min > 0) query = query.gte("price", min);
  if (Number.isFinite(max) && max > 0) query = query.lte("price", max);

  const [{ data: properties }, { data: barangays }, savedRes] = await Promise.all([
    query,
    supabase.from("barangays").select("id, name").order("name"),
    user ? supabase.from("saved_properties").select("property_id").eq("user_id", user.id) : Promise.resolve({ data: null }),
  ]);

  const saved = new Set((savedRes.data ?? []).map((r: { property_id: string }) => r.property_id));
  const cards = (properties ?? []) as unknown as CardProperty[];
  const field = "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text";

  return (
    <main className="mx-auto max-w-6xl bg-bg px-4 py-8 text-text">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse properties</h1>
        <Link href="/" className="text-sm text-text-muted underline">Home</Link>
      </div>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-5">
        <select name="barangay" defaultValue={barangay} className={field} aria-label="Barangay">
          <option value="">All barangays</option>
          {(barangays ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select name="type" defaultValue={type} className={field} aria-label="Listing type">
          <option value="">Rent or sale</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
        <input name="min" type="number" min={0} defaultValue={min > 0 ? min : ""} placeholder="Min price" className={field} />
        <input name="max" type="number" min={0} defaultValue={max > 0 ? max : ""} placeholder="Max price" className={field} />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Search</button>
      </form>

      {cards.length === 0 ? (
        <p className="mt-10 text-center text-text-muted">No listings match those filters.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((p) => (
            <PropertyCard key={p.id} property={p} saved={user ? saved.has(p.id) : undefined} />
          ))}
        </div>
      )}
    </main>
  );
}
