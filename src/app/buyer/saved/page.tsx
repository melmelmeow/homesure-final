import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PropertyCard, type CardProperty } from "@/components/PropertyCard";

export const metadata: Metadata = { title: "Saved listings" };

export default async function SavedPage() {
  const { supabase, user } = await requireRole(["buyer"], "/buyer/saved");
  const { data } = await supabase
    .from("saved_properties")
    .select("properties(id, title, price, listing_type, address, images, thumbnail_url, barangays(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cards = ((data ?? []) as unknown as { properties: CardProperty | CardProperty[] | null }[])
    .map((r) => (Array.isArray(r.properties) ? r.properties[0] : r.properties))
    .filter((p): p is CardProperty => Boolean(p));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Saved listings</h1>
      {cards.length === 0 ? (
        <p className="text-text-muted">Nothing saved yet. <Link href="/browse" className="text-primary underline">Browse listings</Link></p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((p) => <PropertyCard key={p.id} property={p} saved />)}
        </div>
      )}
    </div>
  );
}
