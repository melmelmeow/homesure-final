import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["seller"]);

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
