
  // ══════════════════════════════════════════════════════════════════════════
  // Auth Guard — Bouncer Mode Activated
  // Sellers trying to sneak in? NOPE. Buyers only club.
  // ══════════════════════════════════════════════════════════════════════════
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  // ──────────────────────────────────────────────────────────────────────────
  // Initialize Sidebar & Topbar Components
  // Like setting up your workspace, but make it aesthetic
  // ──────────────────────────────────────────────────────────────────────────
  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({
    placeholder: 'Search by property, location, or seller name...',
    onSearch: renderListings,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Populate Barangay Dropdown
  // All 16 barangays of Valenzuela, alphabetically sorted
  // (because chaos is not an option here)
  // ──────────────────────────────────────────────────────────────────────────
  const approved = FAKE_LISTINGS.filter(l => l.status === 'approved');
  const barangays = [...new Set(approved.map(l => l.barangay))].sort();
  const barSel = document.getElementById('filterBarangay');
  barangays.forEach(b => {
    const o = document.createElement('option'); o.value = b; o.textContent = b; barSel.appendChild(o);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Property Icons
  // Because words are boring, icons are forever
  // ══════════════════════════════════════════════════════════════════════════
  const iconBed  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
  const iconBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const iconArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
  const iconPin  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  // ══════════════════════════════════════════════════════════════════════════
  // Sort Dropdown Logic
  // Recommended? Cheapest? Newest? Yes to all, picky buyer!
  // ══════════════════════════════════════════════════════════════════════════
  let currentSort = 'recommended';

  function toggleSortDropdown() {
    const btn = document.getElementById('sortBtn');
    const dd  = document.getElementById('sortDropdown');
    btn.classList.toggle('open');
    dd.classList.toggle('open');
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

  // ── Render listings ───────────────────────────────────────────────────────
  function renderListings() {
    const q        = (document.getElementById('hsSearch') || {}).value || '';
    const barangay = document.getElementById('filterBarangay').value;
    const type     = document.getElementById('filterType').value;
    const minP     = parseFloat(document.getElementById('filterMin').value) || 0;
    const maxP     = parseFloat(document.getElementById('filterMax').value) || Infinity;

    const qLow = q.toLowerCase();
    const list = FAKE_LISTINGS.filter(l => {
      if (l.status !== 'approved') return false;
      if (barangay && l.barangay !== barangay) return false;
      if (type     && l.type     !== type)     return false;
      if (l.price < minP || l.price > maxP)    return false;
      if (q) {
        const seller = FAKE_USERS.find(u => u.id === l.sellerId);
        const sellerName = seller ? (seller.firstName + ' ' + seller.lastName).toLowerCase() : '';
        if (!l.title.toLowerCase().includes(qLow) &&
            !l.address.toLowerCase().includes(qLow) &&
            !sellerName.includes(qLow)) return false;
      }
      return true;
    });

    if (currentSort === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (currentSort === 'newest')     list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    const grid = document.getElementById('listingsGrid');

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">No properties found matching your filters.</div>`;
      return;
    }

    grid.innerHTML = list.map((l, i) => {
      const isRent = l.listingFor === 'rent';
      const typeBadge  = isRent
        ? `<span class="badge-tl badge-rent">For Rent</span>`
        : `<span class="badge-tl badge-sale">For Sale</span>`;
      const rightBadge = `<span class="badge-tr">${l.images.length} Photo${l.images.length !== 1 ? 's' : ''}</span>`;
      const verifiedBadge = `<span class="verified-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;
      const bedsLabel  = l.bedrooms === 0 ? 'Studio' : l.bedrooms;
      const price      = '₱' + l.price.toLocaleString('en-PH');
      const priceSub   = isRent ? '<span class="prop-price-per"> / month</span>' : '';
      const seller     = FAKE_USERS.find(u => u.id === l.sellerId);
      const sellerName = seller ? seller.firstName + ' ' + seller.lastName : '';

      return `
        <div class="prop-card" onclick="window.location.href='listing.html?id=${l.id}'">
          <div class="prop-img-wrap">
            <img src="${l.images[0]}" alt="${l.title}" loading="lazy" />
            ${typeBadge}
            ${rightBadge}
          </div>
          <div class="prop-body">
            <div class="prop-title">${l.title}${verifiedBadge}</div>
            <div class="prop-address">${iconPin} ${l.address}</div>
            <div class="prop-amenities">
              <span class="amenity">${iconBed} ${bedsLabel}</span>
              <span class="amenity">${iconBath} ${l.bathrooms}</span>
              <span class="amenity">${iconArea} ${l.floorArea} sqm</span>
            </div>
            <div class="prop-footer">
              <div class="prop-price">${price}${priceSub}</div>
              ${l.negotiable ? `<span class="badge-negotiable">Negotiable</span>` : ''}
            </div>
            ${sellerName ? `<div class="prop-seller">Listed by <a onclick="event.stopPropagation();window.location.href='seller-profile.html?id=${l.sellerId}'">${sellerName}</a></div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  renderListings();
