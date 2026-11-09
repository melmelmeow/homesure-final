import type { Metadata } from "next";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const { supabase } = await requireRole(ADMIN_ROLES, "/admin/users");
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, account_status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft text-xs uppercase text-text-muted">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Joined</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2">{u.full_name ?? "—"}</td>
                <td className="px-4 py-2">{u.email ?? "—"}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2"><StatusBadge status={u.account_status} /></td>
                <td className="px-4 py-2">{shortDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
