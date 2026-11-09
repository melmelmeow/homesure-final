// Kasafide – Admin Listings Management

(function () {
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'listings' });
  KasafideTopbar.init({ placeholder: 'Search listings...', onSearch: () => window.renderListings && window.renderListings() });

  let activeStatus = 'all';

  // ── Data (all statuses; admins can read every listing) ──────────────────────
  let listings = [];
  let paidIds  = new Set();   // listings that have a confirmed payment

  const fmtDate = iso => (iso ? String(iso).slice(0, 10) : '');

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  document.getElementById('filterTabs').addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeStatus = tab.dataset.status;
    renderListings();
  });

  // ── Render table ────────────────────────────────────────────────────────────
  window.renderListings = function () {
    const q = (document.getElementById('hsSearch') || {}).value?.toLowerCase() || '';
    const filtered = listings.filter(l => {
      if (l.status === 'draft') return false; // not visible until seller submits
      const matchStatus = activeStatus === 'all' || l.status === activeStatus;
      const matchQ = !q || l.title.toLowerCase().includes(q) || l.barangay.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });

    const tbody = document.getElementById('listingsBody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No listings found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(l => {
      const sellerName = l.seller ? l.seller.name : 'Unknown';
      const price = l.listingFor === 'rent'
        ? '₱' + l.price.toLocaleString('en-PH') + '/mo'
        : '₱' + l.price.toLocaleString('en-PH');

      // A confirmed payment indicates the property is probably occupied
      const hasConfirmedPayment = paidIds.has(l.id);
      const paymentBadge = hasConfirmedPayment
        ? `<span style="display:inline-block;background:rgb(var(--warning-rgb) / 0.15);color:var(--warning);border:1px solid rgb(var(--warning-rgb) / 0.3);padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;margin-left:6px;" title="This listing has confirmed payments - likely occupied">💰 PAYMENT CONFIRMED</span>`
        : '';

      const approveBtn = l.status !== 'approved'
        ? `<button class="btn-sm approve" onclick="setStatus('${l.id}','approved')">Approve</button>`
        : `<button class="btn-sm approve" disabled style="opacity:0.3;cursor:not-allowed">Approve</button>`;
      const rejectBtn = l.status !== 'rejected'
        ? `<button class="btn-sm reject" onclick="openRejectModal('${l.id}')">Reject</button>`
        : `<button class="btn-sm reject" disabled style="opacity:0.3;cursor:not-allowed">Reject</button>`;
      const closeBtn = l.status === 'approved'
        ? `<button class="btn-sm" style="background:var(--warning);border-color:var(--warning);" onclick="openAdminCloseListing('${l.id}','${l.title.replace(/'/g, "\\'")}','${sellerName}')">Close</button>`
        : '';
      const eyeBtn = `<button class="btn-sm btn-icon" onclick="window.location.href='listing-detail.html?id=${l.id}'" title="View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>`;

      return `
        <tr>
          <td>
            <div class="listing-col">
              <img class="thumb" src="${HS.cover(l)}" alt="${l.title}" />
              <div class="listing-col-info">
                <div class="l-title">${l.title}${paymentBadge}</div>
                <div class="l-loc">${l.barangay}</div>
              </div>
            </div>
          </td>
          <td>${sellerName}</td>
          <td style="text-transform:capitalize">${l.type || '—'}</td>
          <td>${price}</td>
          <td>${fmtDate(l.postedAt)}</td>
          <td><span class="badge ${l.status}">${l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span></td>
          <td>
            <div class="action-btns">
              ${approveBtn}
              ${rejectBtn}
              ${closeBtn}
              ${eyeBtn}
            </div>
          </td>
        </tr>`;
    }).join('');
  };

  // ── Set status ──────────────────────────────────────────────────────────────
  window.setStatus = async function (id, status, reason) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    try {
      const updated = status === 'approved' ? await HS.listings.approve(id) : await HS.listings.reject(id, reason);
      Object.assign(l, updated);
      HS.audit.log(status === 'approved' ? 'Approved listing' : 'Rejected listing', 'listing',
        l.title + (reason ? ' – ' + reason : ''));
    } catch (err) {
      hsToast('Could not update the listing: ' + err.message, 'error');
      return;
    }
    renderListings();
    closeModal();
  };

  // ── Reject Modal ─────────────────────────────────────────────────────────────
  const REJECT_REASONS = [
    'Incomplete property documents. Please re-upload a valid Transfer Certificate of Title (TCT).',
    'Photos are unclear or do not accurately represent the property.',
    'Property details (price, area, amenities) are inaccurate or misleading.',
    'Listing violates Kasafide community guidelines.',
    'Duplicate listing — this property has already been posted.',
    'Property address could not be verified in Sta. Maria, Bulacan.',
  ];

  let _rejectTargetId = null;

  window.openRejectModal = function (id) {
    _rejectTargetId = id;
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
    _rejectTargetId = null;
  };

  window.confirmReject = function () {
    const selected = document.querySelector('input[name="rejectReason"]:checked');
    const custom   = document.getElementById('rejectCustom').value.trim();
    const reason   = custom || (selected ? REJECT_REASONS[selected.value] : null);
    if (!reason) {
      hsToast('Please select or write a rejection reason.', 'error');
      return;
    }
    setStatus(_rejectTargetId, 'rejected', reason);
    closeRejectModal();
  };

  document.getElementById('rejectModal').addEventListener('click', e => {
    if (e.target === document.getElementById('rejectModal')) closeRejectModal();
  });

  // ── Modal ───────────────────────────────────────────────────────────────────
  let _carouselIdx = 0;
  let _carouselImgs = [];

  window.carouselGo = function (dir) {
    _carouselIdx = (_carouselIdx + dir + _carouselImgs.length) % _carouselImgs.length;
    document.getElementById('carouselImg').src = _carouselImgs[_carouselIdx];
    document.getElementById('carouselCounter').textContent = (_carouselIdx + 1) + ' / ' + _carouselImgs.length;
    document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === _carouselIdx));
  };

  window.openModal = async function (id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    const sellerName = l.seller ? l.seller.name : 'Unknown';
    const docs = await HS.storage.resolveDocs(l.documents);
    const price = l.listingFor === 'rent'
      ? '₱' + l.price.toLocaleString('en-PH') + '/month'
      : '₱' + l.price.toLocaleString('en-PH');

    _carouselIdx  = 0;
    _carouselImgs = (l.images && l.images.length) ? l.images : [HS.PLACEHOLDER_IMG];

    const dotsHtml = _carouselImgs.map((_, i) =>
      `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`
    ).join('');

    const docsHtml = docs.length
      ? `<div class="modal-docs-title">Submitted Documents</div>
         <div class="modal-docs-row">
           ${docs.map(d => `
             <a href="${d.url}" target="_blank" class="modal-doc-thumb" title="${d.label}">
               <img src="${d.url}" alt="${d.label}" />
               <span>${d.label}</span>
             </a>`).join('')}
         </div>`
      : '';

    const rejectionHtml = l.rejectionReason
      ? `<div class="modal-rejection"><strong>Rejection Reason:</strong> ${l.rejectionReason}</div>`
      : '';

    document.getElementById('listingModalContent').innerHTML = `
      <div class="modal-carousel">
        <img class="carousel-img" id="carouselImg" src="${_carouselImgs[0]}" alt="${l.title}" />
        ${_carouselImgs.length > 1 ? `
          <button class="carousel-btn prev" onclick="carouselGo(-1)">&#8249;</button>
          <button class="carousel-btn next" onclick="carouselGo(1)">&#8250;</button>
          <div class="carousel-counter" id="carouselCounter">1 / ${_carouselImgs.length}</div>
          <div class="carousel-dots">${dotsHtml}</div>` : ''}
      </div>
      <div class="modal-inner">
        <div class="modal-title">${l.title}</div>
        <div class="modal-meta">${l.barangay} · ${l.address}</div>
        <div class="modal-detail">
          <div class="modal-detail-item"><label>Seller</label><span>${sellerName}</span></div>
          <div class="modal-detail-item"><label>Price</label><span>${price}</span></div>
          <div class="modal-detail-item"><label>Type</label><span style="text-transform:capitalize">${l.type || '—'}</span></div>
          <div class="modal-detail-item"><label>For</label><span style="text-transform:capitalize">${l.listingFor}</span></div>
          <div class="modal-detail-item"><label>Bedrooms</label><span>${l.bedrooms ?? '—'}</span></div>
          <div class="modal-detail-item"><label>Bathrooms</label><span>${l.bathrooms ?? '—'}</span></div>
          <div class="modal-detail-item"><label>Floor Area</label><span>${l.floorArea ? l.floorArea + ' sqm' : '—'}</span></div>
          <div class="modal-detail-item"><label>Posted</label><span>${fmtDate(l.postedAt)}</span></div>
        </div>
        ${rejectionHtml}
        ${docsHtml}
      </div>
      <div class="modal-actions">
        ${l.status !== 'approved' ? `<button class="btn-modal approve" onclick="setStatus('${l.id}','approved')">Approve</button>` : ''}
        ${l.status !== 'rejected' ? `<button class="btn-modal reject" onclick="closeModal();openRejectModal('${l.id}')">Reject</button>` : ''}
        <button class="btn-modal close" onclick="closeModal()">Close</button>
      </div>`;
    document.getElementById('listingModal').classList.add('open');
  };

  window.closeModal = function () {
    document.getElementById('listingModal').classList.remove('open');
  };

  document.getElementById('listingModal').addEventListener('click', e => {
    if (e.target === document.getElementById('listingModal')) closeModal();
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // ADMIN: CLOSE LISTING
  // Allows admin to close listings when sellers forget
  // ══════════════════════════════════════════════════════════════════════════════

  window.openAdminCloseListing = function(listingId, listingTitle, sellerName) {
    CloseListingModal.openModal({
      listingId: listingId,
      listingTitle: listingTitle,
      tenantName: 'Admin Action', // No specific tenant
      period: 'N/A',
      amount: 0,
      isAdmin: true, // Flag to customize modal for admin
      onClosed: function() {
        const listing = listings.find(l => l.id === listingId);
        if (listing) listing.status = 'closed';
        renderListings();
      }
    });
  };

  async function loadAll() {
    document.getElementById('listingsBody').innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Loading…</td></tr>';
    try {
      const [all, paid] = await Promise.all([HS.listings.all(), HS.admin.paidPropertyIds()]);
      listings = await HS.listings.withSellers(all);
      paidIds = paid;
    } catch (err) {
      console.error('Failed to load listings:', err);
      document.getElementById('listingsBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Could not load listings. Please try again.</td></tr>';
      return;
    }
    renderListings();
  }

  loadAll();
})();

