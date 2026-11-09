import Link from "next/link";
import { peso } from "@/lib/format";
import { SaveButton } from "@/components/SaveButton";

export type CardProperty = {
  id: string;
  title: string;
  price: number | string | null;
  listing_type: string | null;
  images: string[] | null;
  thumbnail_url?: string | null;
  address?: string | null;
  barangays: { name: string } | { name: string }[] | null;
};

const barangay = (b: CardProperty["barangays"]) => (Array.isArray(b) ? b[0]?.name : b?.name) ?? "";

/**
 * Server component. The photo, title and price are plain HTML; only the save button is a client
 * component, so a page of 50 cards ships 50 tiny buttons' worth of JS, not 50 cards' worth.
 * `saved` is undefined for signed-out visitors, which hides the button.
 */
export function PropertyCard({ property, saved }: { property: CardProperty; saved?: boolean }) {
  const img = property.thumbnail_url || property.images?.[0];
  const place = barangay(property.barangays) || property.address || "Sta. Maria, Bulacan";
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[4/3] bg-surface-soft">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={property.title} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
        {saved !== undefined && (
          <div className="absolute right-2 top-2">
            <SaveButton propertyId={property.id} initiallySaved={saved} />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {property.listing_type === "rent" ? "For rent" : "For sale"} · {place}
        </p>
        <h3 className="mt-1 line-clamp-1 font-semibold text-text">
          <Link href={`/property/${property.id}`} className="hover:underline">{property.title}</Link>
        </h3>
        <p className="mt-2 text-lg font-bold text-primary">
          {peso(property.price)}
          {property.listing_type === "rent" && <span className="text-sm font-normal text-text-muted"> /month</span>}
        </p>
      </div>
    </article>
  );
}
