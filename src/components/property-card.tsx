import Link from "next/link";

type Property = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  verification_state: string;
  registry_of_deeds: string;
  title_number: string;
  title_type: string;
};

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="prop-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease' }}>
      <div className="prop-img-wrap" style={{ position: 'relative', height: '155px', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2840 0%, #162032 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          No Image
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none' }} />
      </div>
      <div className="prop-body" style={{ padding: '13px 14px 14px' }}>
        <div className="prop-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {property.title}
          {property.verification_state === "verified" && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', borderRadius: '50%', background: '#00c9a7', flexShrink: 0 }} title="Verified">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '9px', height: '9px', color: '#fff' }}><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          )}
        </div>
        <div className="prop-address" style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '11px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px', flexShrink: 0, marginTop: '1px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {property.registry_of_deeds}
        </div>
        <div className="prop-footer" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="prop-price" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', lineHeight: '1.2' }}>₱{property.price.toLocaleString()}</div>
            <span className="prop-price-per" style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 400 }}>{property.title_type} {property.title_number}</span>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#00c9a7', color: '#fff', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Sale</span>
        </div>
        <Link href={`/dashboard/properties/${property.id}`} style={{ display: 'block', marginTop: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--teal)', textDecoration: 'none', textAlign: 'right' }}>View Details →</Link>
      </div>
    </div>
  );
}
