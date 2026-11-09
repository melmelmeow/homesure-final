(function () {
  const user = getSession();
  if (!user || user.role !== 'admin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  // ── Stat counts ───────────────────────────────────────────────────────────
  const allUsers        = FAKE_USERS.filter(u => ['buyer','seller'].includes(u.role));
  const verifiedSellers = FAKE_USERS.filter(u => u.role === 'seller' && u.accountStatus === 'verified');
  const pendingSellers  = FAKE_USERS.filter(u => u.role === 'seller' && u.accountStatus === 'pending');
  const openReports     = FAKE_REPORTS ? FAKE_REPORTS.filter(r => r.status === 'pending').length : 3;

  document.getElementById('totalListings').textContent    = FAKE_LISTINGS.length;
  document.getElementById('totalUsers').textContent       = allUsers.length;
  document.getElementById('verifiedSellers').textContent  = verifiedSellers.length;
  document.getElementById('pendingSellers').textContent   = pendingSellers.length;

  // ── Recent Listings ───────────────────────────────────────────────────────
  const recentListings = [...FAKE_LISTINGS]
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, 5);

  document.getElementById('recentListings').innerHTML = recentListings.map(l => {
    const seller = FAKE_USERS.find(u => u.id === l.sellerId);
    const sellerName = seller ? seller.firstName + ' ' + seller.lastName : 'Unknown';
    const price = l.listingFor === 'rent'
      ? '₱' + l.price.toLocaleString('en-PH') + '/mo'
      : '₱' + l.price.toLocaleString('en-PH');
    return `
      <div class="listing-row">
        <img class="listing-thumb" src="${l.images[0]}" alt="${l.title}" />
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
        <div class="action-desc">${FAKE_LISTINGS.filter(l => l.status === 'pending').length} awaiting approval</div>
      </div>
      <span class="action-badge review">Review</span>
    </div>
    <div class="action-row">
      <div class="action-icon blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      </div>
      <div class="action-body">
        <div class="action-title">Rejected Listings</div>
        <div class="action-desc">${FAKE_LISTINGS.filter(l => l.status === 'rejected').length} rejected — may need follow-up</div>
      </div>
      <span class="action-badge review">Review</span>
    </div>
  `;

  // ── Recent Seller Registrations ───────────────────────────────────────────
  const sellers = FAKE_USERS.filter(u => u.role === 'seller')
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

  document.getElementById('recentSellers').innerHTML = sellers.map(s => {
    const initials = (s.firstName[0] + s.lastName[0]).toUpperCase();
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
  const approved = FAKE_LISTINGS.filter(l => l.status === 'approved').length;
  const pending  = FAKE_LISTINGS.filter(l => l.status === 'pending').length;
  const rejected = FAKE_LISTINGS.filter(l => l.status === 'rejected').length;
  const forRent  = FAKE_LISTINGS.filter(l => l.listingFor === 'rent').length;
  const forSale  = FAKE_LISTINGS.filter(l => l.listingFor === 'sale').length;
  const total    = FAKE_LISTINGS.length || 1;

  const breakdown = [
    { label: 'Approved', count: approved, color: '#00c9a7', pct: Math.round(approved / total * 100) },
    { label: 'Pending',  count: pending,  color: '#fbbf24', pct: Math.round(pending  / total * 100) },
    { label: 'Rejected', count: rejected, color: '#f87171', pct: Math.round(rejected / total * 100) },
    { label: 'For Rent', count: forRent,  color: '#60a5fa', pct: Math.round(forRent  / total * 100) },
    { label: 'For Sale', count: forSale,  color: '#a78bfa', pct: Math.round(forSale  / total * 100) },
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
