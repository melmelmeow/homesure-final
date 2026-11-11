import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(ADMIN_ROLES);

  const shellUser = {
    id: user.id,
    email: profile.email ?? user.email ?? "",
    role: profile.role,
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    fullName: profile.full_name ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
  };

  return (
    <DashboardShell user={shellUser} activePage="dashboard">
      {children}
    </DashboardShell>
  );
}
