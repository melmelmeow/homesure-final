import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

// A layout is NOT re-rendered when someone moves between its child pages, so this is only the first
// gate. Every page below calls requireRole() itself too.
export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["buyer"]);
  return (
    <DashboardShell
      title="Buyer"
      name={me.profile.full_name ?? me.profile.email ?? "Buyer"}
      nav={[
        { href: "/buyer/dashboard", label: "Dashboard" },
        { href: "/buyer/payments", label: "Payments" },
        { href: "/buyer/saved", label: "Saved listings" },
        { href: "/browse", label: "Browse" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
