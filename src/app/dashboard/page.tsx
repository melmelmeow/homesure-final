import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", session.user.id).single();

  return (
    <div>
      <h1 className="dash-title" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
      <p className="dash-sub" style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px' }}>Welcome back, {profile?.full_name || 'User'}. Here&apos;s what&apos;s happening.</p>

      <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        <div className="card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', transition: 'transform 0.18s ease, border-color 0.2s ease' }}>
          <div className="card-label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Role</div>
          <div className="card-value" style={{ fontSize: '28px', fontWeight: 800, color: '#00c9a7', textTransform: 'capitalize' }}>{profile?.role || "Unknown"}</div>
        </div>
        <div className="card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
          <div className="card-label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Account</div>
          <div className="card-value" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</div>
        </div>
        <div className="card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
          <div className="card-label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Status</div>
          <div className="card-value" style={{ fontSize: '14px', fontWeight: 700, color: '#00c9a7' }}>Active</div>
        </div>
      </div>

      <div className="placeholder-section" style={{ background: 'var(--card)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: '50px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '14px', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>Quick Actions</h3>
        <p style={{ margin: 0, fontSize: '12px', marginBottom: '20px' }}>Use the sidebar to navigate through your dashboard.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/dashboard/properties/new" style={{ background: 'var(--teal)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>List Property</a>
          <a href="/dashboard/payments" style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>View Payments</a>
        </div>
      </div>
    </div>
  );
}
