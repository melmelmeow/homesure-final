import { redirect } from "next/navigation";
import { getMe, homeFor } from "@/lib/auth";

// Landing spot right after sign-in: send the person to the dashboard for their role.
export default async function ContinuePage() {
  const me = await getMe();
  redirect(me ? homeFor(me.profile.role) : "/auth/login");
}
