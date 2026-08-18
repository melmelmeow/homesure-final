import { Suspense } from "react";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server-client";
import { getProperties } from "@/lib/supabase/service";
import PropertyCard from "@/components/property-card";

export const dynamic = "force-dynamic";

async function SearchParams({ search }: { search: string }) {
  const filters: any = { verified: true };
  if (search) filters.search = search;
  const properties = await getProperties(filters);

  return (
    <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
      {properties.length === 0 && (
        <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 32px', color: 'var(--muted)', fontSize: '14px' }}>No properties found.</div>
      )}
    </div>
  );
}

export default function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <div className="layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2d3a 50%, #0a1f2e 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,201,167,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '80px 52px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,229,200,0.12)', border: '1px solid rgba(0,229,200,0.3)', borderRadius: '99px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, color: '#00e5c8', letterSpacing: '0.06em', textTransform: 'uppercase', width: 'fit-content' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
            Philippine Real Estate Marketplace
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 900, lineHeight: '1.08', letterSpacing: '-1.5px', color: '#ffffff !important' }}>
            Verified Land.<br />
            <span style={{ color: '#00e5c8' }}>Trusted Deals.</span>
          </h1>
          <p className="hero-desc" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', maxWidth: '440px', fontWeight: 500 }}>
            Browse verified land listings across the Philippines with instant QR Ph payments and secure escrow.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard/properties" style={{ background: 'var(--teal)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: '10px', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.18s' }} >
              Browse Listings
            </Link>
            <Link href="/auth/signup" style={{ background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--border)', padding: '12px 24px', borderRadius: '10px', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'border-color 0.18s' }} >
              Landowner? List Now
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', color: '#00e5c8' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              LRA Verified Titles
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', color: '#00e5c8' }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              QR Ph Instant Pay
            </div>
          </div>
        </div>
      </div>

      <section style={{ padding: '80px 52px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Featured Properties</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Handpicked verified listings across the Philippines.</p>
          </div>
          <form method="get" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search by title, location, or title number..."
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', minWidth: '280px' }}
            />
            <button type="submit" style={{ background: 'var(--teal)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Search</button>
          </form>
        </div>
        <Suspense fallback={<div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px' }}>Loading properties...</div>}>
          <SearchParams search={searchParams.q || ""} />
        </Suspense>
      </section>
    </div>
  );
}
