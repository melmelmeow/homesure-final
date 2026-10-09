// HomeSure – Public Browse Listings

(function () {
  // ── Theme ───────────────────────────────────────────────────────────────────
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('hs-theme', mode);
  }

  function getTheme() {
    return localStorage.getItem('hs-theme') || 'light';
  }

  window.toggleTheme = function () {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Apply theme on load
  applyTheme(getTheme());

  // ── Get approved listings ───────────────────────────────────────────────────
  const allListings = FAKE_LISTINGS.filter(l =>
    l.status === 'approved' &&
    l.lifecycleStatus !== 'sold' &&
    l.lifecycleStatus !== 'rented'
  );

  // Get unique barangays for filter
  const barangays = [...new Set(allListings.map(l => l.barangay))].sort();
  const barangaySelect = document.getElementById('filterBarangay');
  barangays.forEach(b => {
    const option = document.createElement('option');
    option.value = b;
    option.textContent = b;
    barangaySelect.appendChild(option);
  });

  // ── Format helpers ──────────────────────────────────────────────────────────
  function formatPrice(listing) {
    const v = listing.price;
    if (listing.listingFor === 'rent') {
      return '₱' + v.toLocaleString('en-PH') + '/mo';
    }
    if (v >= 1000000) {
      return '₱' + (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1) + 'M';
    }
    if (v >= 1000) {
      return '₱' + Math.round(v / 1000) + 'K';
    }
    return '₱' + v.toLocaleString('en-PH');
  }

  // ── Build listing card ──────────────────────────────────────────────────────
  function buildCard(listing) {
    const image = (listing.images && listing.images[0])
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600';

    const typeClass = listing.listingFor === 'rent' ? 'rent' : 'sale';
    const typeLabel = listing.listingFor === 'rent' ? 'For Rent' : 'For Sale';

    return `
      <div class="listing-card" onclick="viewListing('${listing.id}')">
        <img src="${image}" alt="${listing.title}" class="listing-image"
             onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'" />
        <div class="listing-content">
          <div class="listing-header">
            <span class="listing-type ${typeClass}">${typeLabel}</span>
          </div>
          <div class="listing-title">${listing.title}</div>
          <div class="listing-address">${listing.address}</div>
          <div class="listing-price">${formatPrice(listing)}</div>
          <div class="listing-details">
            <div class="listing-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              ${listing.bedrooms} bed
            </div>
            <div class="listing-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 6 6 3 3 6"/><path d="M17 14h2a2 2 0 0 1 2 2v3H3v-3a2 2 0 0 1 2-2h2"/>
                <path d="M12 17v-3"/><path d="M13 6V3"/><path d="M7 10.5V7a4 4 0 1 1 8 0v3.5"/>
              </svg>
              ${listing.bathrooms} bath
            </div>
            <div class="listing-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              ${listing.floorArea}m²
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Filter & render ─────────────────────────────────────────────────────────
  window.applyFilters = function () {
    const typeFilter = document.getElementById('filterType').value;
    const forFilter = document.getElementById('filterFor').value;
    const barangayFilter = document.getElementById('filterBarangay').value;
    const searchQuery = document.getElementById('filterSearch').value.toLowerCase().trim();

    let filtered = allListings;

    if (typeFilter) {
      filtered = filtered.filter(l => l.type === typeFilter);
    }

    if (forFilter) {
      filtered = filtered.filter(l => l.listingFor === forFilter);
    }

    if (barangayFilter) {
      filtered = filtered.filter(l => l.barangay === barangayFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(searchQuery) ||
        l.address.toLowerCase().includes(searchQuery) ||
        l.barangay.toLowerCase().includes(searchQuery)
      );
    }

    // Update results count
    const count = filtered.length;
    document.getElementById('resultsCount').textContent =
      `${count} propert${count === 1 ? 'y' : 'ies'} found`;

    // Render cards or empty state
    const grid = document.getElementById('listingsGrid');
    const empty = document.getElementById('emptyState');

    if (filtered.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      empty.style.display = 'none';
      grid.innerHTML = filtered.map(l => buildCard(l)).join('');
    }
  };

  // ── View listing ────────────────────────────────────────────────────────────
  window.viewListing = function (id) {
    // Redirect to sign-in with return URL
    window.location.href = `auth/signin.html?redirect=module/buyer/listing.html?id=${id}`;
  };

  // ── Init ────────────────────────────────────────────────────────────────────
  applyFilters();
})();
