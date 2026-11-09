// HomeSure – Listing Detail Page (Admin)

(function () {
  const user = getSession();
  if (!user || user.role !== 'admin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'listings' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const l      = FAKE_LISTINGS.find(x => x.id === id);

  if (!l) {
    document.getElementById('pageContent').innerHTML =
      `<div style="text-align:center;padding:80px;color:var(--muted)">Listing not found.</div>`;
    return;
  }

  const seller    = FAKE_USERS.find(u => u.id === l.sellerId);
  const sellerName = seller ? seller.firstName + ' ' + seller.lastName : 'Unknown';
  const price     = l.listingFor === 'rent'
    ? '₱' + l.price.toLocaleString('en-PH') + ' / month'
    : '₱' + l.price.toLocaleString('en-PH');

  // ── Gallery ──────────────────────────────────────────────────────────────────
  let galleryIdx = 0;
  const imgs = l.images || [];

  function renderGallery() {
    const thumbsHtml = imgs.map((src, i) =>
      `<img class="gallery-thumb${i === 0 ? ' active' : ''}" src="${src}" data-idx="${i}" alt="Photo ${i+1}" onclick="galleryGo(${i})" />`
    ).join('');
    return `
      <div class="gallery-card">
        <div class="gallery-main">
          <img id="galleryMain" src="${imgs[0]}" alt="${l.title}" />
          ${imgs.length > 1 ? `
            <button class="gallery-nav prev" onclick="galleryGo(galleryIdx-1)">&#8249;</button>
            <button class="gallery-nav next" onclick="galleryGo(galleryIdx+1)">&#8250;</button>
            <div class="gallery-counter" id="galleryCounter">1 / ${imgs.length}</div>` : ''}
        </div>
        ${imgs.length > 1 ? `<div class="gallery-thumbs" id="galleryThumbs">${thumbsHtml}</div>` : ''}
      </div>`;
  }

  window.galleryGo = function (idx) {
    galleryIdx = ((idx % imgs.length) + imgs.length) % imgs.length;
    document.getElementById('galleryMain').src = imgs[galleryIdx];
    document.getElementById('galleryCounter').textContent = (galleryIdx + 1) + ' / ' + imgs.length;
    document.querySelectorAll('.gallery-thumb').forEach((t, i) =>
      t.classList.toggle('active', i === galleryIdx));
  };

  // ── Rejection callout ─────────────────────────────────────────────────────
  const rejectionHtml = l.rejectionReason ? `
    <div class="rejection-callout">
      <div class="rejection-callout-label">Rejection Reason</div>
      <p>${l.rejectionReason}</p>
    </div>` : '';

  // ── Documents ─────────────────────────────────────────────────────────────
  const docsHtml = (l.documents && l.documents.length) ? `
    <div class="section-card">
      <div class="section-label">Submitted Documents</div>
      <div class="docs-grid">
        ${l.documents.map(d => `
          <a href="${d.url}" target="_blank" class="doc-card">
            <img src="${d.url}" alt="${d.label}" />
            <span>${d.label}</span>
          </a>`).join('')}
      </div>
    </div>` : '';

  // ── Amenities ─────────────────────────────────────────────────────────────
  const amenitiesHtml = (l.amenities && l.amenities.length) ? `
    <div class="section-card">
      <div class="section-label">Amenities</div>
      <div class="amenities-wrap">
        ${l.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
      </div>
    </div>` : '';

  // ── Action buttons ────────────────────────────────────────────────────────
  const approveBtn = l.status !== 'approved'
    ? `<button class="btn-action primary" onclick="doApprove()">Approve</button>`
    : `<button class="btn-action primary" disabled>Approved</button>`;
  const rejectBtn = l.status !== 'rejected'
    ? `<button class="btn-action danger" onclick="openRejectModal()">Reject</button>`
    : `<button class="btn-action danger" disabled>Rejected</button>`;

  // ── Seller sidebar stats ──────────────────────────────────────────────────
  const sellerListings = seller ? FAKE_LISTINGS.filter(x => x.sellerId === seller.id) : [];
  const sellerApproved = sellerListings.filter(x => x.status === 'approved').length;
  const sellerInitials = seller ? (seller.firstName[0] + seller.lastName[0]).toUpperCase() : '?';

  const statusLabel = l.status.charAt(0).toUpperCase() + l.status.slice(1);

  // ── Render page ───────────────────────────────────────────────────────────
  document.getElementById('pageContent').innerHTML = `
    <div class="detail-header">
      <div>
        <button class="back-btn" onclick="history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Listings
        </button>
        <div class="detail-title">${l.title}</div>
        <div class="detail-meta">${l.barangay} · ${l.address}</div>
      </div>
      <div class="header-actions">
        <span class="status-badge ${l.status}">${statusLabel}</span>
        ${rejectBtn}
        ${approveBtn}
      </div>
    </div>

    ${rejectionHtml}

    <div class="detail-grid">
      <div>
        ${renderGallery()}
        <div class="section-card">
          <div class="section-label">Property Details</div>
          <div class="info-grid">
            <div class="info-item"><label>Price</label><span>${price}</span></div>
            <div class="info-item"><label>Type</label><span style="text-transform:capitalize">${l.type}</span></div>
            <div class="info-item"><label>For</label><span style="text-transform:capitalize">${l.listingFor}</span></div>
            <div class="info-item"><label>Bedrooms</label><span>${l.bedrooms ?? '—'}</span></div>
            <div class="info-item"><label>Bathrooms</label><span>${l.bathrooms ?? '—'}</span></div>
            <div class="info-item"><label>Floor Area</label><span>${l.floorArea ? l.floorArea + ' sqm' : '—'}</span></div>
            ${l.lotArea ? `<div class="info-item"><label>Lot Area</label><span>${l.lotArea} sqm</span></div>` : ''}
            <div class="info-item"><label>Posted</label><span>${l.postedAt}</span></div>
            <div class="info-item"><label>Negotiable</label><span>${l.negotiable ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-label">Description</div>
          <p class="description-text">${l.description || '—'}</p>
        </div>
        ${amenitiesHtml}
        ${docsHtml}
      </div>

      <div>
        <div class="section-card">
          <div class="section-label">Seller</div>
          <div class="seller-avatar">${sellerInitials}</div>
          <div class="seller-name">${sellerName}</div>
          <div class="seller-email">${seller ? seller.email : '—'}</div>
          <div class="seller-stat"><label>Phone</label><span>${seller ? seller.phone : '—'}</span></div>
          <div class="seller-stat"><label>Joined</label><span>${seller ? seller.joinedAt : '—'}</span></div>
          <div class="seller-stat"><label>Total Listings</label><span>${sellerListings.length}</span></div>
          <div class="seller-stat"><label>Approved Listings</label><span>${sellerApproved}</span></div>
          <div class="seller-stat"><label>Verification</label><span>${seller && seller.accountStatus ? seller.accountStatus.charAt(0).toUpperCase() + seller.accountStatus.slice(1) : '—'}</span></div>
        </div>
      </div>
    </div>`;

  // ── Actions ───────────────────────────────────────────────────────────────
  window.doApprove = function () {
    l.status = 'approved';
    window.location.reload();
  };

  // ── Reject Modal ──────────────────────────────────────────────────────────
  const REJECT_REASONS = [
    'Incomplete property documents. Please re-upload a valid Transfer Certificate of Title (TCT).',
    'Photos are unclear or do not accurately represent the property.',
    'Property details (price, area, amenities) are inaccurate or misleading.',
    'Listing violates HomeSure community guidelines.',
    'Duplicate listing — this property has already been posted.',
    'Property address could not be verified in Sta. Maria, Bulacan.',
  ];

  window.openRejectModal = function () {
    document.getElementById('rejectCustom').value = '';
    document.getElementById('rejectReasons').innerHTML = REJECT_REASONS.map((r, i) => `
      <label class="reject-reason-item">
        <input type="radio" name="rejectReason" value="${i}" />
        <span>${r}</span>
      </label>`).join('');
    document.getElementById('rejectModal').style.display = 'flex';
  };

  window.closeRejectModal = function () {
    document.getElementById('rejectModal').style.display = 'none';
  };

  window.confirmReject = function () {
    const selected = document.querySelector('input[name="rejectReason"]:checked');
    const custom   = document.getElementById('rejectCustom').value.trim();
    const reason   = custom || (selected ? REJECT_REASONS[selected.value] : null);
    if (!reason) { alert('Please select or write a rejection reason.'); return; }
    l.status = 'rejected';
    l.rejectionReason = reason;
    closeRejectModal();
    window.location.reload();
  };

  document.getElementById('rejectModal').addEventListener('click', e => {
    if (e.target === document.getElementById('rejectModal')) closeRejectModal();
  });

})();
