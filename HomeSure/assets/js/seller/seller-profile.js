
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession();
  if (!session || session.role !== 'seller') window.location.href = '../../auth/signin.html';

  // ── Init shared components ──────────────────────────────────────────────────
  HomeSureSidebar.init({ activePage: 'profile' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  // ── Resolve current seller from FAKE_USERS ──────────────────────────────────
  const seller = FAKE_USERS.find(u => u.id === session.id) || null;
  if (!seller) window.location.href = '../../auth/signin.html';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const iconBed  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
  const iconBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const iconArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
  const iconPin  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const iconHome = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  function formatJoinDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ── Approved listings for this seller ───────────────────────────────────────
  const approvedListings = FAKE_LISTINGS.filter(
    l => l.sellerId === seller.id && l.status === 'approved'
  );

  // ── Render profile card ──────────────────────────────────────────────────────
  const initials      = (seller.firstName[0] || '') + (seller.lastName[0] || '');
  const profileAvatar = document.getElementById('profileAvatar');

  function renderSellerAvatar() {
    if (session.avatar) {
      profileAvatar.textContent = '';
      profileAvatar.style.backgroundImage = `url(${session.avatar})`;
      profileAvatar.style.backgroundSize = 'cover';
      profileAvatar.style.backgroundPosition = 'center';
    } else {
      profileAvatar.textContent = initials.toUpperCase();
      profileAvatar.style.backgroundImage = '';
    }
  }
  renderSellerAvatar();

  // Avatar upload
  const avatarInput = document.getElementById('avatarInput');
  document.getElementById('avatarEditBtn').addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      session.avatar = e.target.result;
      saveSession(session);
      renderSellerAvatar();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profileName').textContent =
    seller.firstName + ' ' + seller.lastName;

  const activeCount = approvedListings.length;

  // Count sold/rented listings
  const soldCount = FAKE_LISTINGS.filter(l => l.sellerId === seller.id && l.lifecycleStatus === 'sold').length;
  const rentedCount = FAKE_LISTINGS.filter(l => l.sellerId === seller.id && l.lifecycleStatus === 'rented').length;
  const closedCount = soldCount + rentedCount;

  const metaItems = [
    `<span class="profile-meta-item">${activeCount} Active Listing${activeCount !== 1 ? 's' : ''}</span>`,
    `<span class="meta-dot"></span>`,
    `<span class="profile-meta-item">${closedCount} Sold/Rented</span>`,
    `<span class="meta-dot"></span>`,
    `<span class="profile-meta-item">Member since ${formatJoinDate(seller.joinedAt)}</span>`,
  ];
  document.getElementById('profileMeta').innerHTML = metaItems.join('');

  // Status badge
  const status = seller.accountStatus || 'unverified';
  let badgeHTML = '';
  if (status === 'verified') {
    badgeHTML = `
      <div class="status-badge status-verified">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Verified
      </div>`;
  } else if (status === 'pending') {
    badgeHTML = `
      <div class="status-badge status-pending">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Pending
      </div>`;
  } else {
    badgeHTML = `<div class="status-badge status-unverified">Unverified</div>`;
  }
  document.getElementById('statusBadge').innerHTML = badgeHTML;

  // ── Listings section header ──────────────────────────────────────────────────
  const firstName = seller.firstName;
  document.getElementById('sectionTitle').textContent = `${firstName}'s Listings`;
  document.getElementById('sectionSub').textContent =
    activeCount === 0
      ? 'No properties found'
      : `${activeCount} propert${activeCount !== 1 ? 'ies' : 'y'} found`;

  // ── Render listings ──────────────────────────────────────────────────────────
  const container = document.getElementById('listingsContainer');

  if (approvedListings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${iconHome}</div>
        <div class="empty-title">${seller.firstName} ${seller.lastName} has no active listings yet.</div>
        <div class="empty-sub">Approved listings will appear here once published.</div>
      </div>`;
  } else {
    const grid = document.createElement('div');
    grid.className = 'listings-grid';

    grid.innerHTML = approvedListings.map((l, i) => {
      const isRent = l.listingFor === 'rent';
      const typeBadge = isRent
        ? `<span class="badge-tl badge-rent">For Rent</span>`
        : `<span class="badge-tl badge-sale">For Sale</span>`;
      const photoBadge = `<span class="badge-tr">${l.images.length} Photo${l.images.length !== 1 ? 's' : ''}</span>`;

      // Lifecycle status badge (Sold/Rented)
      const lifecycleBadge = l.lifecycleStatus === 'sold'
        ? `<div class="lifecycle-badge lifecycle-sold">SOLD</div>`
        : l.lifecycleStatus === 'rented'
        ? `<div class="lifecycle-badge lifecycle-rented">RENTED</div>`
        : '';

      const verifiedBadge = l.verified
        ? `<span class="verified-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`
        : '';
      const bedsLabel = l.bedrooms === 0 ? 'Studio' : l.bedrooms;
      const price     = '&#8369;' + l.price.toLocaleString('en-PH');
      const priceSub  = isRent ? '<span class="prop-price-per"> / month</span>' : '';

      return `
        <div class="prop-card${l.lifecycleStatus ? ' listing-closed' : ''}"
             onclick="window.location.href='listing.html?id=${l.id}'">
          <div class="prop-img-wrap">
            <img src="${l.images[0]}" alt="${l.title}" loading="lazy" />
            ${typeBadge}
            ${photoBadge}
            ${lifecycleBadge}
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
          </div>
        </div>`;
    }).join('');

    container.appendChild(grid);
  }

  // ── Ratings & Reviews Section ──────────────────────────────────────────────
  const renderStars = (rating, size = 16) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else if (i === fullStars && hasHalf) {
        stars += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="url(#half-${rating})" stroke="none"><defs><linearGradient id="half-${rating}"><stop offset="50%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else {
        stars += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#e5e7eb" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
    }
    return stars;
  };

  const sellerReviews = FAKE_REVIEWS.filter(r => r.type === 'buyer-to-seller' && r.sellerId === seller.id);
  const reviewCount   = sellerReviews.length;
  const avgRating     = reviewCount > 0
    ? (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : 0;

  const starCounts = [0, 0, 0, 0, 0];
  sellerReviews.forEach(r => starCounts[r.rating - 1]++);

  const ratingsHtml = reviewCount === 0 ? `
    <div class="ratings-section">
      <div class="section-header">
        <div class="section-title">My Reviews</div>
        <div class="section-sub">Ratings and feedback from buyers</div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">No reviews yet</div>
        <div class="empty-sub">Complete transactions to receive buyer feedback</div>
      </div>
    </div>
  ` : `
    <div class="ratings-section">
      <div class="section-header">
        <div class="section-title">My Reviews</div>
        <div class="section-sub">${reviewCount} review${reviewCount !== 1 ? 's' : ''} from buyers • ${avgRating} average rating</div>
      </div>
      <div class="ratings-overview">
        <div class="avg-rating-display">
          <div class="avg-rating-number">${avgRating}</div>
          <div class="avg-rating-stars">${renderStars(avgRating, 20)}</div>
          <div class="avg-rating-count">${reviewCount} review${reviewCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="star-distribution">
          ${[5,4,3,2,1].map(s => {
            const cnt = starCounts[s - 1];
            const pct = reviewCount > 0 ? Math.round((cnt / reviewCount) * 100) : 0;
            return `
              <div class="star-bar-row">
                <div class="star-bar-label">${s} ⭐</div>
                <div class="star-bar-track">
                  <div class="star-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="star-bar-count">${cnt}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="reviews-list">
        ${sellerReviews.sort((a,b) => new Date(b.reviewDate) - new Date(a.reviewDate)).map(rev => {
          const buyer = FAKE_USERS.find(u => u.id === rev.buyerId);
          const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Anonymous';
          const buyerInitials = buyer ? buyer.firstName[0] + buyer.lastName[0] : '?';
          const reviewDate = new Date(rev.reviewDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
          return `
            <div class="review-card">
              <div class="review-header">
                <div class="review-avatar">${buyerInitials}</div>
                <div class="review-meta">
                  <div class="review-author">${buyerName}</div>
                  <div class="review-stars">${renderStars(rev.rating, 14)}</div>
                </div>
                <div class="review-date">${reviewDate}</div>
              </div>
              <div class="review-comment">${rev.comment}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Insert ratings section after listings
  const ratingsDiv = document.createElement('div');
  ratingsDiv.innerHTML = ratingsHtml;
  document.querySelector('.content').appendChild(ratingsDiv);


  // ── Edit Profile Modal ──────────────────────────────────────────────────────
  window.openEditModal = function() {
    // Populate modal with current values
    document.getElementById('editFirstName').value = seller.firstName || '';
    document.getElementById('editLastName').value = seller.lastName || '';
    document.getElementById('editPhone').value = seller.phone || '';
    document.getElementById('editEmail').value = seller.email || '';

    // Show modal
    document.getElementById('editModal').classList.add('active');
  };

  window.closeEditModal = function() {
    document.getElementById('editModal').classList.remove('active');
  };

  window.saveProfile = function() {
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    // Validation
    if (!firstName || !lastName) {
      alert('Please enter both first and last name');
      return;
    }

    // Update seller data
    seller.firstName = firstName;
    seller.lastName = lastName;
    seller.phone = phone;

    // Update session
    session.firstName = firstName;
    session.lastName = lastName;
    session.phone = phone;
    saveSession(session);

    // Update FAKE_USERS
    const userIndex = FAKE_USERS.findIndex(u => u.id === seller.id);
    if (userIndex !== -1) {
      FAKE_USERS[userIndex] = { ...FAKE_USERS[userIndex], firstName, lastName, phone };
    }

    // Close modal
    closeEditModal();

    // Refresh page to show updated info
    alert('✅ Profile updated successfully!');
    location.reload();
  };

