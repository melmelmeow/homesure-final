// FILE: assets/js/seller/seller-reviews.js
// Kasafide – Seller Reviews
//
// What buyers have written about this seller. Reviews are public to read, so no filtering is done
// here beyond asking for the ones about me — RLS already limits what anyone may write.

(async function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'dashboard' });
  KasafideTopbar.init({ placeholder: 'Search reviews...' });

  let REVIEWS = [];
  let filter = 'all';

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

  // "2 days ago" reads better than a date on a review, and matches what was there before.
  function ago(iso) {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  const STAR = `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  const stars = (n) => STAR.repeat(Math.max(0, Math.min(5, Math.round(n))));

  // ── Load ────────────────────────────────────────────────────────────────────
  const listEl = document.getElementById('reviewsList');
  if (listEl) listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--muted)">Loading…</div>`;

  try {
    REVIEWS = await HS.reviews.about(user.id);
  } catch (err) {
    console.error('Could not load reviews:', err);
    if (listEl) {
      listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--muted)">
        Could not load your reviews. Please refresh the page.</div>`;
    }
    return;
  }

  // Listing titles, so a review can say which property it is about. One request for all of them.
  const listingTitles = {};
  try {
    const mine = await HS.listings.mine();
    mine.forEach((l) => { listingTitles[l.id] = l.title; });
  } catch (err) {
    console.error('Could not load listing titles:', err);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  function renderStats() {
    const s = HS.reviews.summary(REVIEWS);
    const positive = REVIEWS.filter((r) => r.rating >= 4).length;
    const positivePct = s.count ? Math.round((positive / s.count) * 100) : 0;

    const cards = document.querySelectorAll('.stat-card');
    if (cards.length < 4) return;

    const set = (card, value, sub) => {
      const v = card.querySelector('.stat-value');
      const t = card.querySelector('.stat-subtext');
      if (v) v.textContent = value;
      if (t) t.textContent = sub;
    };

    set(cards[0], s.count ? s.average.toFixed(1) : '—', s.count ? 'Across all properties' : 'No reviews yet');
    const starWrap = cards[0].querySelector('.stat-stars');
    if (starWrap) starWrap.innerHTML = s.count ? stars(s.average) : '';

    set(cards[1], String(s.count), s.count ? 'From verified tenants' : 'Nobody has reviewed you yet');
    set(cards[2], s.count ? positivePct + '%' : '—', '4-5 star ratings');

    // Response rate needs replies, and reviews have none. Showing an invented 100% would be a
    // claim the data cannot support, so the card reports what is actually known.
    set(cards[3], s.count ? String(s.breakdown[5] || 0) : '—', '5-star reviews');
    const label = cards[3].querySelector('.stat-label');
    if (label) label.textContent = 'Top Rated';
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
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;">No reviews yet</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.7;max-width:380px;margin:0 auto;">
            Buyers can review you after a completed transaction. Their feedback will appear here.
          </div>
        </div>`;
      return;
    }

    if (!shown.length) {
      listEl.innerHTML = `<div class="review-card" style="text-align:center;color:var(--muted);padding:32px;">
        No reviews match that filter.</div>`;
      return;
    }

    listEl.innerHTML = shown.map((r) => {
      const name = r.reviewerName || 'Kasafide user';
      const title = r.listingId ? listingTitles[r.listingId] : null;
      return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar" style="background:${avatarColor(name)};display:flex;
               align-items:center;justify-content:center;font-weight:800;color:var(--text);font-size:14px;">
            ${esc(initials(name))}
          </div>
          <div class="review-user-info">
            <div class="review-user-name">${esc(name)}</div>
            <div class="review-stars">${stars(r.rating)}</div>
          </div>
          <div class="review-date">${esc(ago(r.reviewDate))}</div>
        </div>
        ${r.comment ? `<div class="review-content">${esc(r.comment)}</div>` : ''}
        ${title ? `
        <div class="review-property">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          ${esc(title)}
        </div>` : ''}
      </div>`;
    }).join('');
  }

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  // "Verified Only" is gone: every review already comes from a real account, so the tab divided
  // nothing. The remaining tabs map to what the data can answer.
  const FILTERS = [
    ['all', 'All Reviews'], ['5', '5 Stars'], ['4', '4 Stars'], ['3', '3 Stars'], ['recent', 'Recent'],
  ];

  const tabWrap = document.querySelector('.filter-tabs');
  if (tabWrap) {
    tabWrap.innerHTML = FILTERS.map(([value, label], i) =>
      `<button class="filter-tab${i === 0 ? ' active' : ''}" data-filter="${value}">${label}</button>`).join('');

    tabWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-tab');
      if (!btn) return;
      filter = btn.dataset.filter;
      tabWrap.querySelectorAll('.filter-tab').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  }

  renderStats();
  render();
})();
