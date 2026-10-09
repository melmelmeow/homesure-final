
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession();
  if (!session || session.role !== 'buyer') window.location.href = '../../auth/signin.html';

  // ── Init shared components ──────────────────────────────────────────────────
  HomeSureSidebar.init({ activePage: 'profile' });
  HomeSureTopbar.init({ placeholder: 'Search properties...' });

  // ── Resolve current buyer from FAKE_USERS ───────────────────────────────────
  const buyer = FAKE_USERS.find(u => u.id === session.id) || null;
  if (!buyer) window.location.href = '../../auth/signin.html';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const iconHome = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  const iconSale = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
  const iconRent = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  function formatJoinDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ── Render profile card ──────────────────────────────────────────────────────
  const initials      = (buyer.firstName[0] || '') + (buyer.lastName[0] || '');
  const profileAvatar = document.getElementById('profileAvatar');

  function renderBuyerAvatar() {
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
  renderBuyerAvatar();

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
      renderBuyerAvatar();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profileName').textContent =
    buyer.firstName + ' ' + buyer.lastName;

  // Get buyer transactions
  const buyerTransactions = FAKE_TRANSACTIONS.filter(t => t.buyerId === buyer.id && t.status === 'completed');
  const transactionCount = buyerTransactions.length;

  // Get buyer reviews
  const buyerReviews = FAKE_REVIEWS.filter(r => r.type === 'seller-to-buyer' && r.buyerId === buyer.id);
  const reviewCount = buyerReviews.length;

  const metaItems = [
    `<span class="profile-meta-item">${transactionCount} Transaction${transactionCount !== 1 ? 's' : ''}</span>`,
    `<span class="meta-dot"></span>`,
    `<span class="profile-meta-item">${reviewCount} Review${reviewCount !== 1 ? 's' : ''}</span>`,
    `<span class="meta-dot"></span>`,
    `<span class="profile-meta-item">Member since ${formatJoinDate(buyer.joinedAt)}</span>`,
  ];
  document.getElementById('profileMeta').innerHTML = metaItems.join('');

  // Status badge
  const status = buyer.accountStatus || 'unverified';
  let badgeHTML = '';
  if (status === 'verified') {
    badgeHTML = `
      <div class="status-badge status-verified">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Verified Buyer
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

  // ── My Transactions Section ─────────────────────────────────────────────────
  const transactionsHtml = transactionCount === 0 ? `
    <div class="transactions-section">
      <div class="section-header">
        <div class="section-title">My Transactions</div>
        <div class="section-sub">Properties you've purchased or rented</div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${iconHome}</div>
        <div class="empty-title">No transactions yet</div>
        <div class="empty-sub">Your completed purchases and rentals will appear here</div>
      </div>
    </div>
  ` : `
    <div class="transactions-section">
      <div class="section-header">
        <div class="section-title">My Transactions</div>
        <div class="section-sub">${transactionCount} propert${transactionCount !== 1 ? 'ies' : 'y'} purchased/rented</div>
      </div>
      <div class="transactions-grid">
        ${buyerTransactions.map(txn => {
          const isSale = txn.type === 'sale';
          const typeIcon = isSale ? iconSale : iconRent;
          const typeClass = isSale ? 'sale' : 'rent';
          const moveDate = new Date(txn.moveInDate || txn.transactionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
          const txnDate = new Date(txn.transactionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
          return `
            <div class="transaction-card">
              <div class="transaction-header">
                <div class="transaction-title">${txn.listingTitle}</div>
                <div class="transaction-type-icon ${typeClass}">${typeIcon}</div>
              </div>
              <div class="transaction-details">
                <div class="transaction-detail">
                  <div class="transaction-detail-label">Type</div>
                  <div class="transaction-detail-value">${isSale ? 'Purchase' : 'Rental'}</div>
                </div>
                <div class="transaction-detail">
                  <div class="transaction-detail-label">Amount</div>
                  <div class="transaction-detail-value">₱${txn.amount.toLocaleString('en-PH')}</div>
                </div>
                <div class="transaction-detail">
                  <div class="transaction-detail-label">Payment</div>
                  <div class="transaction-detail-value">${txn.paymentMethod}</div>
                </div>
                <div class="transaction-detail">
                  <div class="transaction-detail-label">${isSale ? 'Move-in' : 'Start Date'}</div>
                  <div class="transaction-detail-value">${moveDate}</div>
                </div>
              </div>
              <div class="transaction-footer">
                Sold by ${txn.sellerName} • ${txnDate}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const transactionsDiv = document.createElement('div');
  transactionsDiv.innerHTML = transactionsHtml;
  document.querySelector('.content').appendChild(transactionsDiv);

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

  const avgRating = reviewCount > 0
    ? (buyerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : 0;

  const starCounts = [0, 0, 0, 0, 0];
  buyerReviews.forEach(r => starCounts[r.rating - 1]++);

  const ratingsHtml = reviewCount === 0 ? `
    <div class="ratings-section">
      <div class="section-header">
        <div class="section-title">My Reviews</div>
        <div class="section-sub">Ratings and feedback from sellers</div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">No reviews yet</div>
        <div class="empty-sub">Complete transactions to receive seller feedback</div>
      </div>
    </div>
  ` : `
    <div class="ratings-section">
      <div class="section-header">
        <div class="section-title">My Reviews</div>
        <div class="section-sub">${reviewCount} review${reviewCount !== 1 ? 's' : ''} from sellers • ${avgRating} average rating</div>
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

  // Insert ratings section after transactions
  const ratingsDiv = document.createElement('div');
  ratingsDiv.innerHTML = ratingsHtml;
  document.querySelector('.content').appendChild(ratingsDiv);

  // ── Edit Profile Modal ──────────────────────────────────────────────────────
  window.openEditModal = function() {
    // Populate modal with current values
    document.getElementById('editFirstName').value = buyer.firstName || '';
    document.getElementById('editLastName').value = buyer.lastName || '';
    document.getElementById('editPhone').value = buyer.phone || '';
    document.getElementById('editEmail').value = buyer.email || '';

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

    // Update buyer data
    buyer.firstName = firstName;
    buyer.lastName = lastName;
    buyer.phone = phone;

    // Update session
    session.firstName = firstName;
    session.lastName = lastName;
    session.phone = phone;
    saveSession(session);

    // Update FAKE_USERS
    const userIndex = FAKE_USERS.findIndex(u => u.id === buyer.id);
    if (userIndex !== -1) {
      FAKE_USERS[userIndex] = { ...FAKE_USERS[userIndex], firstName, lastName, phone };
    }

    // Close modal
    closeEditModal();

    // Refresh page to show updated info
    alert('✅ Profile updated successfully!');
    location.reload();
  };

