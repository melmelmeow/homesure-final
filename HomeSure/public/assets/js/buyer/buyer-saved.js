
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'saved' });
  HomeSureTopbar.init({ placeholder: 'Search saved properties...' });

  // ── Icons ──────────────────────────────────────────────────────────────────
  const iconPin  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const iconBed  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
  const iconBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const iconArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;

  // Fake saved dates per listing
  const SAVED_DATES = {
    'prop-002': 'Feb 25, 2026', 'prop-004': 'Feb 24, 2026',
    'prop-006': 'Mar 01, 2026', 'prop-007': 'Mar 05, 2026', 'prop-009': 'Mar 10, 2026',
  };

  function renderSaved() {
    const savedIds = user.savedListings || [];
    let list = FAKE_LISTINGS.filter(l => savedIds.includes(l.id) && l.status === 'approved');
    const sort = document.getElementById('sortSelect').value;
    if (sort === 'price-asc')  list = list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = list.sort((a, b) => b.price - a.price);

    document.getElementById('savedCount').textContent =
      list.length + ' propert' + (list.length !== 1 ? 'ies' : 'y') + ' saved';

    const container = document.getElementById('savedList');
    if (!list.length) {
      container.innerHTML = `<div class="empty-state">You have no saved listings yet.</div>`;
      return;
    }

    container.innerHTML = list.map((l, i) => {
      const isRent    = l.listingFor === 'rent';
      const price     = '₱' + l.price.toLocaleString('en-PH');
      const bedsLabel = l.bedrooms === 0 ? 'Studio' : l.bedrooms + ' bed';
      const savedDate = SAVED_DATES[l.id] || '';

      return `
        <div class="saved-card" style="animation-delay:${0.05 + i * 0.05}s"
             onclick="window.location.href='listing.html?id=${l.id}&from=saved'">
          <div class="saved-img-wrap"><img class="saved-img" src="${l.images[0]}" alt="${l.title}" loading="lazy" /></div>
          <div class="saved-body">
            <div class="saved-title">${l.title}</div>
            <div class="saved-location">${iconPin} ${l.address}</div>
            <div class="saved-desc">${l.description}</div>
            <div class="saved-specs">
              <span>${bedsLabel}</span>
              <span class="saved-specs-dot">•</span>
              <span>${l.bathrooms} bath</span>
              <span class="saved-specs-dot">•</span>
              <span>${l.floorArea} sqm</span>
            </div>
            ${savedDate ? `<div class="saved-date">${iconClock} Saved ${savedDate}</div>` : ''}
          </div>
          <div class="saved-price-col">
            <div class="saved-price">${price}</div>
            ${isRent ? `<div class="saved-price-per">/month</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  renderSaved();
