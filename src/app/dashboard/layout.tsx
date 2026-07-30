import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/properties", label: "Properties", icon: "home" },
    { href: "/dashboard/properties/new", label: "List Property", icon: "plus" },
    ...(profile?.role === "admin" ? [{ href: "/dashboard/verifications", label: "Verifications", icon: "check" }] : []),
    { href: "/dashboard/payments", label: "Payments", icon: "wallet" },
    { href: "/dashboard/refunds", label: "Refunds", icon: "wallet" },
    ...(profile?.role === "admin" ? [{ href: "/dashboard/analytics", label: "Analytics", icon: "chart" }] : []),
  ];

  const icons: Record<string, React.ReactNode> = {
    grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  };

  return (
    <div className="layout" style={{ display: 'flex', height: '100vh' }}>
      <aside className="hs-sidebar" style={{ width: '205px', minWidth: '205px', background: '#0F766E', borderRight: '1px solid rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', padding: '22px 14px 18px', height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
        <div className="hs-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '30px' }}>
          <img className="hs-logo-img" src="/assets/img/image.png" alt="HomeSure" height="28" style={{ height: '28px', width: 'auto', display: 'block' }} />
          <span className="hs-logo-text" style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>HomeSure</span>
        </div>
        <nav className="hs-nav" style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hs-nav-item" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 13px', borderRadius: '10px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', transition: 'background 0.22s ease, color 0.22s ease, transform 0.18s ease' }}>
              <span style={{ width: '16px', height: '16px', flexShrink: 0 }}>{icons[item.icon]}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="hs-bottom" style={{ paddingTop: '6px' }}>
          <div className="hs-divider" style={{ height: '1px', background: 'rgba(255,255,255,0.09)', marginBottom: '14px' }} />
          <p style={{ padding: '0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{profile?.full_name}</p>
          <p style={{ padding: '0 8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginBottom: '8px' }}>{profile?.role}</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="hs-logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 13px', borderRadius: '10px', color: 'rgba(255,255,255,0.55)', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', transition: 'background 0.22s ease, color 0.22s ease' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 40px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
