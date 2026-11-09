import { createPublicClient } from "@/lib/supabase/public";

export type LandingStats = { barangays: number; listings: number; verifiedSellers: number };

export type LandingProperty = {
  id: string;
  title: string;
  location: string;
  price: string;
  period: string;
  verified: boolean;
  image: string;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80";

type CountRow = { lifecycle_status: string | null; barangays: { name: string } | { name: string }[] | null };
type FeaturedRow = {
  id: string;
  title: string;
  price: number | string | null;
  listing_type: string | null;
  address: string | null;
  images: string[] | null;
  lifecycle_status: string | null;
  barangays: { name: string } | { name: string }[] | null;
};

const barangayName = (b: CountRow["barangays"]): string | null => (Array.isArray(b) ? b[0]?.name : b?.name) ?? null;
const isAvailable = (lifecycle: string | null) => lifecycle !== "sold" && lifecycle !== "rented";

/**
 * Everything the landing page shows that comes from the database, fetched on the server in one
 * round of parallel queries. A failure of any one query degrades that section to its empty state
 * instead of failing the whole page.
 */
export async function getLandingData(): Promise<{
  stats: LandingStats;
  barangayCounts: Record<string, number>;
  featured: LandingProperty[];
}> {
  const supabase = createPublicClient();

  const [listingsRes, sellersRes, barangaysRes, countRowsRes, featuredRes] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("public_profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "seller")
      .eq("account_status", "verified"),
    supabase.from("barangays").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("lifecycle_status, barangays(name)").eq("status", "approved").limit(1000),
    supabase
      .from("properties")
      .select("id, title, price, listing_type, address, images, lifecycle_status, barangays(name)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const barangayCounts: Record<string, number> = {};
  for (const r of (countRowsRes.data as CountRow[] | null) ?? []) {
    if (!isAvailable(r.lifecycle_status)) continue;
    const name = barangayName(r.barangays);
    if (name) barangayCounts[name] = (barangayCounts[name] || 0) + 1;
  }

  const featured: LandingProperty[] = ((featuredRes.data as FeaturedRow[] | null) ?? [])
    .filter((p) => isAvailable(p.lifecycle_status))
    .slice(0, 6)
    .map((p) => {
      const name = barangayName(p.barangays);
      return {
        id: p.id,
        title: p.title,
        location: name ? `${name}, Sta. Maria` : p.address ?? "Sta. Maria, Bulacan",
        price: typeof p.price === "number" ? `₱${p.price.toLocaleString("en-PH")}` : String(p.price ?? ""),
        period: p.listing_type === "rent" ? "/month" : "",
        verified: true,
        image: p.images?.[0] || FALLBACK_IMAGE,
      };
    });

  return {
    stats: {
      listings: listingsRes.count ?? 0,
      verifiedSellers: sellersRes.count ?? 0,
      barangays: barangaysRes.count || 24,
    },
    barangayCounts,
    featured,
  };
}
