(async function () {
  const user = getSession();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'super_duper_admin')) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'dashboard' });
  KasafideTopbar.init({ placeholder: 'Search...' });

  // ── Load everything the dashboard shows ───────────────────────────────────
  let LISTINGS, USERS, openReports;
  try {
    const [listings, users, reports] = await Promise.all([HS.listings.all(), HS.admin.users(), HS.admin.openReportsCount()]);
    LISTINGS    = await HS.listings.withSellers(listings.filter(l => l.status !== 'draft'));   // drafts are not the admins' business yet
    USERS       = users;
    openReports = reports;
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    hsToast('Could not load the dashboard data. Please refresh.', 'error');
    return;
  }

  // ── Stat counts ───────────────────────────────────────────────────────────
  const allUsers        = USERS.filter(u => ['buyer','seller'].includes(u.role));
  const verifiedSellers = USERS.filter(u => u.role === 'seller' && u.accountStatus === 'verified');
  const pendingSellers  = USERS.filter(u => u.role === 'seller' && (u.accountStatus === 'pending' || u.accountStatus === 'reverification'));

  document.getElementById('totalListings').textContent    = LISTINGS.length;
  document.getElementById('totalUsers').textContent       = allUsers.length;
  document.getElementById('verifiedSellers').textContent  = verifiedSellers.length;
  document.getElementById('pendingSellers').textContent   = pendingSellers.length;

  // ── Recent Listings ───────────────────────────────────────────────────────
  const recentListings = [...LISTINGS]
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, 5);

  document.getElementById('recentListings').innerHTML = recentListings.map(l => {
    const sellerName = l.seller ? l.seller.name : 'Unknown';
    const price = l.listingFor === 'rent'
      ? '₱' + l.price.toLocaleString('en-PH') + '/mo'
      : '₱' + l.price.toLocaleString('en-PH');
    return `
      <div class="listing-row">
        <img class="listing-thumb" src="${HS.cover(l)}" alt="${l.title}" />
        <div class="listing-info">
          <div class="listing-title">${l.title}</div>
          <div class="listing-meta">${sellerName} · ${l.barangay} · ${price}</div>
        </div>
        <span class="badge ${l.status}">${l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span>
      </div>`;
  }).join('');

  // ── Pending Actions ───────────────────────────────────────────────────────
  document.getElementById('pendingActions').innerHTML = `
    <div class="action-row">
      <div class="action-icon amber">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="action-body">
        <div class="action-title">Seller Verifications</div>
        <div class="action-desc">${pendingSellers.length} pending review${pendingSellers.length !== 1 ? 's' : ''}</div>
      </div>
      <span class="action-badge urgent">Urgent</span>
    </div>
    <div class="action-row">
      <div class="action-icon red">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="action-body">
        <div class="action-title">Reported Listings</div>
        <div class="action-desc">${openReports} report${openReports !== 1 ? 's' : ''} to review</div>
      </div>
      <span class="action-badge critical">Critical</span>
    </div>
    <div class="action-row">
      <div class="action-icon blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div class="action-body">
        <div class="action-title">Pending Listings</div>
        <div class="action-desc">${LISTINGS.filter(l => l.status === 'pending').length} awaiting approval</div>
      </div>
      <span class="action-badge review">Review</span>
    </div>
    <div class="action-row">
      <div class="action-icon blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      </div>
      <div class="action-body">
        <div class="action-title">Rejected Listings</div>
        <div class="action-desc">${LISTINGS.filter(l => l.status === 'rejected').length} rejected — may need follow-up</div>
      </div>
      <span class="action-badge review">Review</span>
    </div>
  `;

  // ── Recent Seller Registrations ───────────────────────────────────────────
  const sellers = USERS.filter(u => u.role === 'seller')
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    .slice(0, 8);

  document.getElementById('recentSellers').innerHTML = sellers.map(s => {
    const initials = (((s.firstName || '')[0] || '') + ((s.lastName || '')[0] || '')).toUpperCase() || '?';
    const statusClass = s.accountStatus === 'verified' ? 'verified'
      : s.accountStatus === 'pending' ? 'pending' : 'unverified';
    const statusLabel = s.accountStatus
      ? s.accountStatus.charAt(0).toUpperCase() + s.accountStatus.slice(1)
      : 'Unverified';
    return `
      <div class="seller-row">
        <div class="seller-avatar">${initials}</div>
        <div class="seller-info">
          <div class="seller-name">${s.firstName} ${s.lastName}</div>
          <div class="seller-meta">${s.email} · Joined ${s.joinedAt}</div>
        </div>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>`;
  }).join('');

  // ── Listing Breakdown ─────────────────────────────────────────────────────
  const approved = LISTINGS.filter(l => l.status === 'approved').length;
  const pending  = LISTINGS.filter(l => l.status === 'pending').length;
  const rejected = LISTINGS.filter(l => l.status === 'rejected').length;
  const forRent  = LISTINGS.filter(l => l.listingFor === 'rent').length;
  const forSale  = LISTINGS.filter(l => l.listingFor === 'sale').length;
  const total    = LISTINGS.length || 1;

  const breakdown = [
    { label: 'Approved', count: approved, color: 'var(--primary)', pct: Math.round(approved / total * 100) },
    { label: 'Pending',  count: pending,  color: 'var(--warning)', pct: Math.round(pending  / total * 100) },
    { label: 'Rejected', count: rejected, color: 'var(--danger)', pct: Math.round(rejected / total * 100) },
    { label: 'For Rent', count: forRent,  color: 'var(--accent)', pct: Math.round(forRent  / total * 100) },
    { label: 'For Sale', count: forSale,  color: 'var(--info)', pct: Math.round(forSale  / total * 100) },
  ];

  document.getElementById('listingBreakdown').innerHTML = breakdown.map(b => `
    <div class="breakdown-row">
      <div class="breakdown-label">${b.label}</div>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar" style="width:${b.pct}%;background:${b.color}"></div>
      </div>
      <div class="breakdown-count">${b.count}</div>
    </div>`).join('');

})();
