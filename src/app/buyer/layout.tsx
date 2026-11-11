import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

/**
 * Buyer section layout. Provides the design-system sidebar + topbar shell
 * for every page under /buyer/. Each page still calls requireRole() itself
 * to run its own data queries; this layout's call is for the shell user data.
 */
export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["buyer"]);

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
