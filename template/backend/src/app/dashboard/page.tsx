import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

  // Fetch real platform metrics or fallback to defaults
  const { count: propertyCount } = await supabase.from("properties").select("*", { count: 'exact', head: true });
  const { count: userCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });

  const role = profile?.role || "user";
  const fullName = profile?.full_name || session.user.email?.split("@")[0] || "User";

  return (
    <div className="dashboard-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {fullName}</h1>
          <p className="page-sub">HomeSure Dashboard & Platform Overview ({role.toUpperCase()})</p>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="stat-body">
            <div className="stat-label">Total Properties</div>
            <div className="stat-value">{propertyCount ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-body">
            <div className="stat-label">Platform Users</div>
            <div className="stat-value">{userCount ?? 1}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="stat-body">
            <div className="stat-label">Your Role</div>
            <div className="stat-value" style={{ fontSize: '20px', textTransform: 'capitalize' }}>{role}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="stat-body">
            <div className="stat-label">Account Status</div>
            <div className="stat-value" style={{ fontSize: '20px', color: '#00c9a7' }}>Active</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Quick Actions Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Quick Actions</span>
          </div>
          <div className="action-list">
            <Link href="/dashboard/properties/new" className="action-row">
              <div className="action-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div className="action-body">
                <div className="action-title">Create New Listing</div>
                <div className="action-desc">Add a new property for sale or rent</div>
              </div>
              <span className="action-badge review">New</span>
            </Link>

            <Link href="/dashboard/payments" className="action-row">
              <div className="action-icon amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div className="action-body">
                <div className="action-title">Manage Payments</div>
                <div className="action-desc">Check payment transactions and balances</div>
              </div>
            </Link>

            {role === "admin" && (
              <Link href="/dashboard/verifications" className="action-row">
                <div className="action-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="action-body">
                  <div className="action-title">Pending Verifications</div>
                  <div className="action-desc">Review seller & property submission requests</div>
                </div>
                <span className="action-badge urgent">Action Required</span>
              </Link>
            )}
          </div>
        </div>

        {/* Account Info Breakdown */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Profile Info</span>
          </div>
          <div className="breakdown-list">
            <div className="breakdown-row">
              <span className="breakdown-label">Email</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{session.user.email}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Full Name</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{fullName}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Account Role</span>
              <span className="badge approved">{role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
