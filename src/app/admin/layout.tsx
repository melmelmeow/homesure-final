import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(ADMIN_ROLES);
  return (
    <DashboardShell
      title="Admin"
      name={me.profile.full_name ?? me.profile.email ?? "Admin"}
      nav={[
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/listings", label: "Pending listings" },
        { href: "/admin/payments", label: "Payments" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
