// HomeSure – Public Browse Listings

(function () {
  // ── Theme ───────────────────────────────────────────────────────────────────
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('hs-theme', mode);
  }

  function getTheme() {
    return localStorage.getItem('hs-theme') || 'dark';
  }

  window.toggleTheme = function () {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Apply theme on load
  applyTheme(getTheme());

  // ── Load approved listings (public: RLS only returns admin-approved ones) ───
  let allListings = [];

  function fillBarangays() {
    const barangaySelect = document.getElementById('filterBarangay');
    const barangays = [...new Set(allListings.map(l => l.barangay))].filter(Boolean).sort();
    barangays.forEach(b => {
      const option = document.createElement('option');
      option.value = b;
      option.textContent = b;
      barangaySelect.appendChild(option);
    });
  }

  // The landing page map links straight to a barangay: browse.html?barangay=Poblacion.
  //
  // The dropdown above is built from the barangays that actually have listings, so a link to a
  // barangay with none would set a value no <option> carries. A <select> ignores that and keeps
  // showing "All", which would quietly list every property in the municipality — the opposite of
  // what the visitor clicked. Adding the option means they get an honest "0 properties found"
  // with the barangay still named in the filter.
  function applyBarangayFromURL() {
    const wanted = new URLSearchParams(window.location.search).get('barangay');
    if (!wanted) return;

    const select = document.getElementById('filterBarangay');
    const match = [...select.options].find(
      o => o.value.toLowerCase() === wanted.toLowerCase());

    if (match) {
      select.value = match.value;
    } else {
      const option = document.createElement('option');
      option.value = wanted;
      option.textContent = wanted;
      select.appendChild(option);
      select.value = wanted;
    }
  }

  async function loadListings() {
    try {
      allListings = await HS.listings.approved();
    } catch (err) {
      console.error('Failed to load listings:', err);
      document.getElementById('resultsCount').textContent = 'Could not load listings';
      return;
    }
    fillBarangays();
    applyBarangayFromURL();
    applyFilters();
  }

  // ── Format helpers ──────────────────────────────────────────────────────────
  function formatPrice(listing) {
    const v = Number(listing.price) || 0;
    if (listing.listingFor === 'rent') {
      return '₱' + v.toLocaleString('en-PH') + '/mo';
    }
    if (v >= 1000000) {
      return '₱' + (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 2) + 'M';
    }
    return '₱' + v.toLocaleString('en-PH');
  }

  // Bedrooms / bathrooms / area, skipping what a listing does not have (e.g. a lot).
  function details(l) {
    const svgBed  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
    const svgBath = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6 3 3 6"/><path d="M17 14h2a2 2 0 0 1 2 2v3H3v-3a2 2 0 0 1 2-2h2"/><path d="M12 17v-3"/><path d="M13 6V3"/><path d="M7 10.5V7a4 4 0 1 1 8 0v3.5"/></svg>';
    const svgArea = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
    const out = [];
    if (l.bedrooms !== null && l.bedrooms !== undefined) out.push(svgBed + ' ' + (l.bedrooms === 0 ? 'Studio' : l.bedrooms + ' bed'));
    if (l.bathrooms !== null && l.bathrooms !== undefined) out.push(svgBath + ' ' + l.bathrooms + ' bath');
    const area = l.floorArea || l.lotArea;
    if (area) out.push(svgArea + ' ' + area + 'm²');
    return out.map(t => '<div class="listing-detail">' + t + '</div>').join('');
  }

  // ── Build listing card ──────────────────────────────────────────────────────
  function buildCard(listing) {
    const image = HS.cover(listing);

    const typeClass = listing.listingFor === 'rent' ? 'rent' : 'sale';
    const typeLabel = listing.listingFor === 'rent' ? 'For Rent' : 'For Sale';

    return `
      <div class="listing-card" onclick="viewListing('${listing.id}')">
        <img src="${image}" alt="${listing.title}" class="listing-image"
             onerror="this.src=HS.PLACEHOLDER_IMG" />
        <div class="listing-content">
          <div class="listing-header">
            <span class="listing-type ${typeClass}">${typeLabel}</span>
          </div>
          <div class="listing-title">${listing.title}</div>
          <div class="listing-address">${listing.address}</div>
          <div class="listing-price">${formatPrice(listing)}</div>
          <div class="listing-details">${details(listing)}</div>
        </div>
      </div>
    `;
  }

  // ── Filter & render ─────────────────────────────────────────────────────────

  // Only the search box uses this. applyFilters() itself stays immediate, so the first render and
  // every call from code are unaffected.
  window.applyFiltersSoon = hsDebounce(() => window.applyFilters(), 200);

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
        (l.title || '').toLowerCase().includes(searchQuery) ||
        (l.address || '').toLowerCase().includes(searchQuery) ||
        (l.barangay || '').toLowerCase().includes(searchQuery)
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
    const target = 'module/buyer/listing.html?id=' + id;
    const me = typeof getSession === 'function' ? getSession() : null;
    if (me && me.role === 'buyer') { window.location.href = target; return; }
    // Everyone else signs in first and is sent back to the listing afterwards (see auth.js)
    window.location.href = 'auth/signin.html?redirect=' + encodeURIComponent(target);
  };

  // ── Init ────────────────────────────────────────────────────────────────────
  loadListings();
})();
