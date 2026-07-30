
  const user = getSession();
  if (!user || user.role !== 'seller') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({ placeholder: 'Search properties...' });

  // ── Icons ──────────────────────────────────────────────────────────────────
  const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconHeart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  // ── Helper: Render stars ───────────────────────────────────────────────────
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

  // ── Load buyer ─────────────────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const buyer = FAKE_USERS.find(u => u.id === params.get('id') && u.role === 'buyer');
  const wrap   = document.getElementById('profileContent');

  if (!buyer) {
    wrap.innerHTML = `<p style="color:var(--muted);text-align:center;padding:60px 0">Buyer not found.</p>`;
  } else {
    const initials      = buyer.firstName[0] + buyer.lastName[0];
    const joined        = new Date(buyer.joinedAt);
    const memberSince   = joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const savedCount    = buyer.savedListings ? buyer.savedListings.length : 0;

    // ── Ratings & Reviews ──────────────────────────────────────────────────────
    const buyerReviews = FAKE_REVIEWS.filter(r => r.type === 'seller-to-buyer' && r.buyerId === buyer.id);
    const reviewCount   = buyerReviews.length;
    const avgRating     = reviewCount > 0
      ? (buyerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : 0;

    // Star distribution
    const starCounts = [0, 0, 0, 0, 0];
    buyerReviews.forEach(r => starCounts[r.rating - 1]++);

    const ratingsHtml = reviewCount === 0 ? `
      <div class="ratings-section">
        <div class="ratings-header">
          <div class="ratings-title">Reviews</div>
        </div>
        <div class="empty-state">No reviews yet for this buyer.</div>
      </div>
    ` : `
      <div class="ratings-section">
        <div class="ratings-header">
          <div class="ratings-title">Reviews</div>
          <div class="ratings-summary">
            <div class="avg-rating">${avgRating}</div>
            <div class="avg-rating-meta">
              <div class="avg-stars">${renderStars(avgRating, 18)}</div>
              <div class="review-count">${reviewCount} review${reviewCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        <div class="star-bars">
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
        <div class="reviews-list">
          ${buyerReviews.sort((a,b) => new Date(b.reviewDate) - new Date(a.reviewDate)).map(rev => {
            const seller = FAKE_USERS.find(u => u.id === rev.sellerId);
            const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : 'Anonymous';
            const sellerInitials = seller ? seller.firstName[0] + seller.lastName[0] : '?';
            const reviewDate = new Date(rev.reviewDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
              <div class="review-card">
                <div class="review-header">
                  <div class="review-avatar">${sellerInitials}</div>
                  <div class="review-meta">
                    <div class="review-author">${sellerName}</div>
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

    wrap.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">${initials}</div>
        <div class="profile-info">
          <div class="profile-name-row">
            <span class="profile-name">${buyer.firstName} ${buyer.lastName}</span>
            <span class="profile-verified-badge">${iconCheck} Verified</span>
          </div>
          <div class="profile-buyer-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
            Verified Buyer
          </div>
          <div class="profile-stats">
            <strong>${savedCount}</strong> Saved Listing${savedCount !== 1 ? 's' : ''}
            <span class="profile-stats-dot">•</span>
            Member since ${memberSince}
            ${reviewCount > 0 ? `<span class="profile-stats-dot">•</span> ${avgRating} ⭐ (${reviewCount})` : ''}
          </div>
        </div>
      </div>

      ${ratingsHtml}

      <div class="info-section">
        <div class="info-title">About This Buyer</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Account Type</div>
            <div class="info-value">Verified Buyer</div>
          </div>
          <div class="info-item">
            <div class="info-label">Joined</div>
            <div class="info-value">${memberSince}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Saved Properties</div>
            <div class="info-value">${savedCount} listing${savedCount !== 1 ? 's' : ''}</div>
          </div>
          ${reviewCount > 0 ? `
            <div class="info-item">
              <div class="info-label">Average Rating</div>
              <div class="info-value">${avgRating} / 5.0</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
