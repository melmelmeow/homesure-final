import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { peso } from "@/lib/format";
import { SaveButton } from "@/components/SaveButton";

type Props = { params: { id: string } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  // RLS decides what is visible: an approved listing to everyone, the owner's own to the owner.
  const { data } = await supabase
    .from("properties")
    .select("*, barangays(name)")
    .eq("id", id)
    .maybeSingle();
  return { supabase, property: data };
}

// Search engines and link previews get real title/description/image from the server.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await load(params.id);
  const p = loaded?.property;
  if (!p) return { title: "Listing not found" };
  return {
    title: p.title,
    description: (p.description as string | null)?.slice(0, 160) ?? `${p.title} in Sta. Maria, Bulacan`,
    openGraph: { images: p.thumbnail_url || p.images?.[0] ? [p.thumbnail_url || p.images[0]] : [] },
  };
}

export default async function PropertyPage({ params }: Props) {
  const loaded = await load(params.id);
  if (!loaded?.property) notFound();
  const { supabase, property: p } = loaded;

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: seller }, savedRes] = await Promise.all([
    supabase.from("public_profiles").select("full_name, account_status").eq("id", p.landowner_id).maybeSingle(),
    user
      ? supabase.from("saved_properties").select("property_id").eq("user_id", user.id).eq("property_id", p.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const images: string[] = Array.isArray(p.images) ? p.images : [];
  const place = p.barangays?.name ? `${p.barangays.name}, Sta. Maria` : p.address;
  const facts: [string, string | number | null][] = [
    ["Bedrooms", p.bedrooms],
    ["Bathrooms", p.bathrooms],
    ["Floor area", p.floor_area_sqm ? `${p.floor_area_sqm} sqm` : null],
    ["Lot area", p.lot_area_sqm ? `${p.lot_area_sqm} sqm` : null],
  ];

  return (
    <main className="mx-auto max-w-5xl bg-bg px-4 py-8 text-text">
      <Link href="/browse" className="text-sm text-text-muted underline">← Back to listings</Link>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {images.slice(0, 3).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`${p.title} photo ${i + 1}`} className={`h-64 w-full rounded-xl object-cover ${i === 0 ? "sm:col-span-2 sm:row-span-1" : ""}`} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{p.listing_type === "rent" ? "For rent" : "For sale"} · {place}</p>
          <h1 className="mt-1 text-3xl font-bold">{p.title}</h1>
          <p className="mt-2 text-2xl font-bold text-primary">
            {peso(p.price)}{p.listing_type === "rent" && <span className="text-base font-normal text-text-muted"> /month</span>}
          </p>
        </div>
        {user ? (
          <SaveButton propertyId={p.id} initiallySaved={Boolean(savedRes.data)} />
        ) : (
          <Link href={`/auth/login?next=/property/${p.id}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
            Sign in to save or enquire
          </Link>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4">
            <dt className="text-xs text-text-muted">{k}</dt>
            <dd className="mt-1 font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {p.description && <p className="mt-6 whitespace-pre-line leading-relaxed">{p.description}</p>}

      {seller && (
        <p className="mt-6 text-sm text-text-muted">
          Listed by <span className="font-medium text-text">{seller.full_name ?? "a Kasafide seller"}</span>
          {seller.account_status === "verified" && " · verified seller"}
        </p>
      )}
    </main>
  );
}
