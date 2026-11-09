// FILE: assets/js/buyer/buyer-reviews.js
// Kasafide – Buyer Reviews
//
// The reviews this buyer has written, and the form for writing another.
//
// The property dropdown only lists places they have actually paid for. The database itself is more
// permissive — its only rule is that you are the author of your own review — but a buyer reviewing
// a property they never rented is not a review, and the page should not invite it.

(async function () {
  const user = getSession();
  if (!user || user.role !== 'buyer') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'reviews' });
  KasafideTopbar.init({ placeholder: 'Search reviews...' });

  let REVIEWS = [];
  let REVIEWABLE = [];          // { propertyId, sellerId, title }
  let filter = 'all';
  let selectedRating = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const AVATAR_COLORS = ['var(--k-avatar-1)', 'var(--k-avatar-3)', 'var(--k-avatar-2)', 'var(--k-avatar-6)', 'var(--k-avatar-4)', 'var(--k-avatar-5)'];
  function avatarColor(name) {
    let hash = 0;
    for (const ch of String(name || '')) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  function ago(iso) {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'} ago`;
  }

  const stars = (n) => '<span class="star">★</span>'.repeat(Math.max(0, Math.min(5, Math.round(n))));

  function toast(message) {
    if (typeof hsToast === 'function') hsToast(message);
    else alert(message);
  }

  // ── Load ────────────────────────────────────────────────────────────────────
  const listEl = document.getElementById('reviewsList');
  if (listEl) listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--text-muted)">Loading…</div>`;

  try {
    REVIEWS = await HS.reviews.by(user.id);
  } catch (err) {
    console.error('Could not load reviews:', err);
    if (listEl) {
      listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--text-muted)">
        Could not load your reviews. Please refresh the page.</div>`;
    }
    return;
  }

  // Which properties may be reviewed, and who the seller is on each. Built from confirmed
  // payments, so the dropdown only offers places this buyer actually rented or bought.
  const titles = {};
  try {
    const paid = await HS.payments.mine();
    const seen = new Set();
    paid.filter((p) => p.status === 'confirmed').forEach((p) => {
      titles[p.listingId] = p.listingTitle;
      if (p.listingId && p.sellerId && !seen.has(p.listingId)) {
        seen.add(p.listingId);
        REVIEWABLE.push({ propertyId: p.listingId, sellerId: p.sellerId, title: p.listingTitle });
      }
    });
  } catch (err) {
    console.error('Could not work out which properties you can review:', err);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  function renderStats() {
    const s = HS.reviews.summary(REVIEWS);
    const cards = document.querySelectorAll('.stat-card');
    if (cards.length < 4) return;

    const set = (card, value, label) => {
      const v = card.querySelector('.stat-number');
      const l = card.querySelector('.stat-label');
      if (v) v.textContent = value;
      if (l && label) l.textContent = label;
    };

    set(cards[0], s.count ? s.average.toFixed(1) : '—', 'Average You Gave');
    const starWrap = cards[0].querySelector('.star-display');
    if (starWrap) starWrap.innerHTML = s.count ? stars(s.average) : '';

    set(cards[1], String(s.count), 'Reviews Written');
    set(cards[2], String(s.breakdown[5] || 0), '5-Star Reviews');
    set(cards[3], String(REVIEWABLE.length), 'Places You Can Review');
  }

  // ── List ────────────────────────────────────────────────────────────────────
  function visible() {
    if (filter === 'all') return REVIEWS;
    if (filter === 'recent') {
      const cutoff = Date.now() - 30 * 86400000;
      return REVIEWS.filter((r) => new Date(r.reviewDate).getTime() >= cutoff);
    }
    return REVIEWS.filter((r) => r.rating === Number(filter));
  }

  function render() {
    if (!listEl) return;
    const shown = visible();

    if (!REVIEWS.length) {
      listEl.innerHTML = `
        <div class="review-card" style="text-align:center;padding:48px 24px;">
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;">You have not written a review yet</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.7;max-width:400px;margin:0 auto;">
            ${REVIEWABLE.length
              ? 'Use “Write a Review” above to tell other buyers what a place was like.'
              : 'Once you have completed a payment on a listing, you will be able to review it here.'}
          </div>
        </div>`;
      return;
    }

    if (!shown.length) {
      listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--text-muted);padding:32px;">
        No reviews match that filter.</div>`;
      return;
    }

    const myName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'You';

    listEl.innerHTML = shown.map((r) => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar" style="background:${avatarColor(myName)};display:flex;
               align-items:center;justify-content:center;font-weight:800;color:var(--text);font-size:13px;">
            ${esc(initials(myName))}
          </div>
          <div class="review-user-info">
            <div class="review-user-name">You</div>
            <div class="review-meta">${esc(ago(r.reviewDate))}</div>
          </div>
          <div class="review-stars">${stars(r.rating)}</div>
        </div>
        ${r.comment ? `<div class="review-content">${esc(r.comment)}</div>` : ''}
        ${r.listingId && titles[r.listingId] ? `
        <div class="review-property">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          ${esc(titles[r.listingId])}
        </div>` : ''}
      </div>`).join('');
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  // "Verified Only" is gone — every review here is one you wrote from your own account, so the
  // tab separated nothing.
  const FILTERS = [['all', 'All Reviews'], ['5', '5 Stars'], ['4', '4 Stars'], ['3', '3 Stars'], ['recent', 'Recent']];

  const filterWrap = document.querySelector('.filters');
  if (filterWrap) {
    filterWrap.innerHTML = FILTERS.map(([value, label], i) =>
      `<button class="filter-btn${i === 0 ? ' active' : ''}" data-filter="${value}">${label}</button>`).join('');

    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filter = btn.dataset.filter;
      filterWrap.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  }

  // ── Write a review ──────────────────────────────────────────────────────────
  function updateStars() {
    document.querySelectorAll('#starRating .star').forEach((star) => {
      star.classList.toggle('active', Number(star.dataset.rating) <= selectedRating);
    });
  }

  document.getElementById('starRating')?.addEventListener('click', (e) => {
    const star = e.target.closest('.star');
    if (!star) return;
    selectedRating = Number(star.dataset.rating);
    updateStars();
  });

  window.openReviewModal = function () {
    if (!REVIEWABLE.length) {
      toast('You can review a listing once a payment on it has been confirmed.');
      return;
    }

    const select = document.querySelector('#reviewForm select');
    if (select) {
      // The hardcoded options are replaced by the places this buyer actually paid for.
      select.innerHTML = REVIEWABLE.map((r) =>
        `<option value="${esc(r.propertyId)}">${esc(r.title || 'Listing')}</option>`).join('');
    }

    selectedRating = 0;
    updateStars();
    const comment = document.querySelector('#reviewForm textarea');
    if (comment) comment.value = '';

    document.getElementById('reviewModal').classList.add('active');
  };

  window.closeReviewModal = function () {
    document.getElementById('reviewModal').classList.remove('active');
    selectedRating = 0;
    updateStars();
  };

  window.submitReview = async function () {
    if (selectedRating === 0) {
      toast('Please choose a rating first.');
      return;
    }

    const select = document.querySelector('#reviewForm select');
    const chosen = REVIEWABLE.find((r) => r.propertyId === select?.value);
    if (!chosen) {
      toast('Please choose which property you are reviewing.');
      return;
    }

    const comment = (document.querySelector('#reviewForm textarea')?.value || '').trim();
    const button = document.querySelector('.btn-submit');
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }

    try {
      await HS.reviews.create({
        type: 'buyer-to-seller',
        revieweeId: chosen.sellerId,
        propertyId: chosen.propertyId,
        rating: selectedRating,
        comment,
      });
    } catch (err) {
      if (button) { button.disabled = false; button.textContent = 'Submit Review'; }
      toast('Could not save your review: ' + err.message);
      return;
    }

    if (button) { button.disabled = false; button.textContent = 'Submit Review'; }
    window.closeReviewModal();

    REVIEWS = await HS.reviews.by(user.id).catch(() => REVIEWS);
    renderStats();
    render();
    toast('Thank you — your review is published.');
  };

  document.getElementById('reviewModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'reviewModal') window.closeReviewModal();
  });

  renderStats();
  render();
})();
