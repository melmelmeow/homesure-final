import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["seller"]);
  return (
    <DashboardShell
      title="Seller"
      name={me.profile.full_name ?? me.profile.email ?? "Seller"}
      nav={[
        { href: "/seller/dashboard", label: "Dashboard" },
        { href: "/seller/listings", label: "My listings" },
        // Posting a listing and ID/title upload are still the original pages (see README).
        { href: "/module/seller/post.html", label: "Post a listing" },
        { href: "/module/seller/verification.html", label: "Verification" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
