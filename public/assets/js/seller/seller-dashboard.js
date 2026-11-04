
  // ── Auth guard ────────────────────────────────────────────────────────────
  const session = getSession();
  if (!session || session.role !== 'seller') window.location.href = '../../auth/signin.html';

  // ── Init components ───────────────────────────────────────────────────────
  KasafideSidebar.init({ activePage: 'dashboard' });
  KasafideTopbar.init({
    placeholder: 'Search by property, location, or seller...',
    onSearch: renderListings,
  });

  // ── Seller state (read fresh from the database on load) ──────────────────
  let isVerified = false;
  let approved   = [];      // marketplace listings from every seller

  function showVerification(fullUser) {
    isVerified = fullUser.accountStatus === 'verified';
    const isPending = fullUser.accountStatus === 'pending';

    // Verified sellers don't get a badge here at all — once there's nothing to act on, it's just
    // clutter next to the page title. Pending/unverified sellers still need the nudge, and an
    // expiring-soon verified seller already gets the separate expiry banner below.
    const badge = document.getElementById('verifyBadge');
    if (isVerified) {
      badge.classList.add('is-hidden');
    } else if (isPending) {
      badge.textContent = '⏳ Pending Review';
      badge.className = 'verify-badge pending';
    } else {
      badge.textContent = '✕ Unverified';
      badge.className = 'verify-badge unverified';
    }

    document.getElementById('verifyBanner').classList.toggle('is-hidden', isVerified);

    // Show expiry banner on dashboard only when near expiry (≤30 days) or expired
    if (isVerified && fullUser.verificationExpiry) {
      const expiry   = new Date(fullUser.verificationExpiry);
      const today    = new Date();
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      const expiryFormatted = expiry.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
      const banner = document.getElementById('expiryBanner');

      if (daysLeft <= 0) {
        banner.style.display = 'block';
        banner.innerHTML = `
          <div class="expiry-banner danger">
            <div class="expiry-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--danger)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="expiry-body">
              <div class="expiry-title">Verification Expired</div>
              <div class="expiry-sub">Your seller verification expired on <strong>${expiryFormatted}</strong>. Your listings have been paused until you re-verify.</div>
            </div>
            <a href="verification.html?reverify=true" class="expiry-btn">Re-verify Now</a>
          </div>`;
      } else if (daysLeft <= 30) {
        banner.style.display = 'block';
        banner.innerHTML = `
          <div class="expiry-banner warn">
            <div class="expiry-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--warning)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="expiry-body">
              <div class="expiry-title">Verification Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}</div>
              <div class="expiry-sub">Your seller verification expires on <strong>${expiryFormatted}</strong>. Re-verify before it expires to avoid interruptions to your listings.</div>
            </div>
            <a href="verification.html?reverify=true" class="expiry-btn">Re-verify</a>
          </div>`;
      }
    }
  }

  // ── Populate barangay dropdown (once the listings are in) ─────────────────
  function fillBarangays() {
    const barSel = document.getElementById('filterBarangay');
    [...new Set(approved.map(l => l.barangay))].filter(Boolean).sort().forEach(b => {
      const o = document.createElement('option'); o.value = b; o.textContent = b; barSel.appendChild(o);
    });
  }

  // ── SVG Icons ─────────────────────────────────────────────────────────────
  const iconBed  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
  const iconBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const iconArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
  const iconPin  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  // ── Sort ──────────────────────────────────────────────────────────────────
  let currentSort = 'recommended';

  function toggleSortDropdown() {
    document.getElementById('sortBtn').classList.toggle('open');
    document.getElementById('sortDropdown').classList.toggle('open');
  }

  function setSort(value, label, el) {
    currentSort = value;
    document.getElementById('sortLabel').textContent = label;
    document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('sortBtn').classList.remove('open');
    document.getElementById('sortDropdown').classList.remove('open');
    renderListings();
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.sort-wrap')) {
      document.getElementById('sortBtn').classList.remove('open');
      document.getElementById('sortDropdown').classList.remove('open');
    }
  });

  // ── Render Listings ───────────────────────────────────────────────────────

  // Only the search box uses this. renderListings() itself stays immediate, so the first render and
  // every call from code are unaffected.
  window.renderListingsSoon = hsDebounce(() => window.renderListings(), 200);

  // ── Mobile filter sheet ───────────────────────────────────────────────────
  // Same pattern as buyer-dashboard.js's #filterPanel: on mobile the Marketplace filters open as
  // a bottom sheet instead of sitting inline above the listings.
  function resetFilters() {
    document.getElementById('filterBarangay').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterMin').value = '';
    document.getElementById('filterMax').value = '';
    renderListings();
  }

  function openFilterSheet() {
    document.getElementById('sellerFilterPanel').classList.add('sheet-open');
    document.getElementById('filterBackdrop').classList.add('open');
    document.querySelector('.content').style.overflow = 'hidden';
  }

  function closeFilterSheet() {
    document.getElementById('sellerFilterPanel').classList.remove('sheet-open');
    document.getElementById('filterBackdrop').classList.remove('open');
    document.querySelector('.content').style.overflow = '';
  }

  window.resetFilters     = resetFilters;
  window.openFilterSheet  = openFilterSheet;
  window.closeFilterSheet = closeFilterSheet;

  function renderListings() {
    const q        = (document.getElementById('hsSearch') || {}).value || '';
    const barangay = document.getElementById('filterBarangay').value;
    const type     = document.getElementById('filterType').value;
    const minP     = parseFloat(document.getElementById('filterMin').value) || 0;
    const maxP     = parseFloat(document.getElementById('filterMax').value) || Infinity;
    const qLow     = q.toLowerCase();

    let list = approved.filter(l => {
      if (barangay && l.barangay !== barangay) return false;
      if (type     && l.type     !== type)     return false;
      if (l.price < minP || l.price > maxP)    return false;
      if (q) {
        const sellerName = l.seller ? l.seller.name.toLowerCase() : '';
        if (!l.title.toLowerCase().includes(qLow) &&
            !l.address.toLowerCase().includes(qLow) &&
            !sellerName.includes(qLow)) return false;
      }
      return true;
    });

    if (currentSort === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (currentSort === 'newest')     list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    const countEl = document.getElementById('listingsCount');
    if (countEl) countEl.textContent = list.length ? `(${list.length})` : '';

    const grid = document.getElementById('listingsGrid');
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">No properties found matching your filters.</div>`;
      return;
    }

    const verifiedCheck = `<span class="verified-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;

    grid.innerHTML = list.map((l, i) => {
      const isRent    = l.listingFor === 'rent';
      const isMine    = l.sellerId === session.id;
      const typeBadge = isRent
        ? `<span class="badge-tl badge-rent">For Rent</span>`
        : `<span class="badge-tl badge-sale">For Sale</span>`;
      const photoBadge = `<span class="badge-tr">${l.images.length} Photo${l.images.length !== 1 ? 's' : ''}</span>`;
      const mineBadge  = isMine ? `<span class="badge-mine">Your Listing</span>` : '';
      const bedsLabel  = l.bedrooms === 0 ? 'Studio' : (l.bedrooms ?? '–');
      const price      = '₱' + l.price.toLocaleString('en-PH');
      const priceSub   = isRent ? '<span class="prop-price-per"> / month</span>' : '';
      const sellerName = l.seller ? l.seller.name : '';

      const sellerRow = isMine
        ? `<div class="prop-seller" style="color:var(--teal);font-weight:600">Your listing</div>`
        : sellerName ? `<div class="prop-seller">Listed by <a onclick="event.stopPropagation()">${sellerName}</a></div>` : '';

      return `
        <div class="prop-card"
             onclick="window.location.href='../buyer/listing.html?id=${l.id}'">
          <div class="prop-img-wrap">
            <img src="${HS.cover(l)}" alt="${l.title}" loading="lazy" />
            ${typeBadge}
            ${photoBadge}
            ${mineBadge}
          </div>
          <div class="prop-body">
            <div class="prop-title">${l.title}${l.verified ? verifiedCheck : ''}</div>
            <div class="prop-address">${iconPin} ${l.address}</div>
            <div class="prop-amenities">
              <span class="amenity">${iconBed} ${bedsLabel}</span>
              <span class="amenity">${iconBath} ${l.bathrooms ?? '–'}</span>
              <span class="amenity">${iconArea} ${l.floorArea || l.lotArea || '–'} sqm</span>
            </div>
            <div class="prop-footer">
              <div class="prop-price">${price}${priceSub}</div>
              ${l.negotiable ? `<span class="badge-negotiable">Negotiable</span>` : ''}
            </div>
            ${sellerRow}
          </div>
        </div>`;
    }).join('');
  }

  async function loadDashboard() {
    const grid = document.getElementById('listingsGrid');
    grid.innerHTML = '<div class="empty-state">Loading properties…</div>';
    try {
      const [me, mine, market] = await Promise.all([HS.auth.refresh(), HS.listings.mine(), HS.listings.approved()]);
      if (!me) { window.location.href = '../../auth/signin.html'; return; }
      showVerification(me);
      document.getElementById('statActive').textContent  = mine.filter(l => l.status === 'approved').length;
      document.getElementById('statPending').textContent = mine.filter(l => l.status === 'pending').length;
      approved = await HS.listings.withSellers(market);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      grid.innerHTML = '<div class="empty-state">Could not load your dashboard. Please try again.</div>';
      return;
    }
    fillBarangays();
    renderListings();
  }

  loadDashboard();
