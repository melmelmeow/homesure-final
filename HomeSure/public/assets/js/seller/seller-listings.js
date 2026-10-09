
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession();
  if (!session || session.role !== 'seller') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'listings' });
  HomeSureTopbar.init({ placeholder: 'Search your listings...' });

  // ── Resolve user & listings ─────────────────────────────────────────────────
  const fullUser   = FAKE_USERS.find(u => u.id === session.id) || {};
  const isVerified = fullUser.accountStatus === 'verified';

  let myListings = FAKE_LISTINGS.filter(l => l.sellerId === session.id);

  // ── Add button & warning banner ─────────────────────────────────────────────
  if (!isVerified) {
    document.getElementById('addListingBtn').classList.add('disabled');
    document.getElementById('addListingBtn').setAttribute('title', 'Complete verification to post listings');
    document.getElementById('warnBanner').style.display = 'flex';
  }

  // ── Buckets ─────────────────────────────────────────────────────────────────
  const getActive  = () => myListings.filter(l => l.status === 'approved');
  const getDraft   = () => myListings.filter(l => l.status === 'draft' || l.status === 'rejected');
  const getPending = () => myListings.filter(l => l.status === 'pending');
  const getClosed  = () => myListings.filter(l => l.status === 'closed');

  // ── Formatting helpers ──────────────────────────────────────────────────────
  function formatPrice(listing) {
    const v = listing.price;
    if (listing.listingFor === 'rent') return '\u20b1' + v.toLocaleString() + '/mo';
    if (v >= 1000000) return '\u20b1' + (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1) + 'M';
    if (v >= 1000)    return '\u20b1' + Math.round(v / 1000) + 'K';
    return '\u20b1' + v.toLocaleString();
  }

  function formatDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Build card HTML ─────────────────────────────────────────────────────────
  function buildCard(listing, tab) {
    const thumb = (listing.images && listing.images[0])
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400';

    const pillCls   = listing.listingFor === 'rent' ? 'pill-rent' : 'pill-sale';
    const pillLabel = listing.listingFor === 'rent' ? 'For Rent' : 'For Sale';

    const statusMap = {
      approved: { cls: 'approved', label: 'Active' },
      pending:  { cls: 'pending',  label: 'Under Review' },
      draft:    { cls: 'draft',    label: 'Draft' },
      rejected: { cls: 'rejected', label: 'Rejected' },
      closed:   { cls: 'closed',   label: 'Closed' },
    };
    const { cls: statusCls, label: statusLabel } = statusMap[listing.status] || { cls: 'draft', label: 'Draft' };

    // Action buttons per tab
    let actionBtns = '';
    if (tab === 'active') {
      const multiUnitBtn = listing.hasMultipleUnits
        ? `<button class="btn-adjust-avail" onclick="adjustAvailability('${listing.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            ${listing.availableUnits}/${listing.totalUnits} Available
          </button>`
        : '';

      actionBtns = `
        ${multiUnitBtn}
        <button class="btn-edit" onclick="handleEdit('${listing.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn-close" onclick="promptClose('${listing.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
          Close Listing
        </button>`;
    } else if (tab === 'draft') {
      actionBtns = `
        <button class="btn-edit" onclick="handleEdit('${listing.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn-submit" onclick="submitForReview('${listing.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Submit for Review
        </button>`;
    } else if (tab === 'pending') {
      actionBtns = `<span class="review-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Under admin review — editing disabled
      </span>`;
    } else if (tab === 'closed') {
      actionBtns = `
        <button class="btn-reopen" onclick="reopenListing('${listing.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.29"/></svg>
          Resubmit for Review
        </button>`;
    }

    // Rejection reason banner (only in draft tab for rejected listings)
    const rejectionBanner = (tab === 'draft' && listing.status === 'rejected')
      ? `<div class="rejection-banner-enhanced">
          <div class="rejection-banner-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span class="rejection-banner-title">Listing Rejected by Admin</span>
          </div>
          <div class="rejection-banner-body">
            <div class="rejection-reason">
              <strong>Reason:</strong> ${listing.rejectionReason || 'No specific reason provided'}
            </div>
            ${listing.rejectionNotes ? `<div class="rejection-notes">${listing.rejectionNotes}</div>` : ''}
            <div class="rejection-actions">
              <button class="btn-fix-edit" onclick="handleEdit('${listing.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Fix & Resubmit
              </button>
              <span class="rejection-help">Edit the listing to address the issues above, then submit for review again.</span>
            </div>
          </div>
        </div>`
      : '';

    return `
      <div class="listing-card" id="card-${listing.id}">
        <div class="listing-row">
          <img class="listing-thumb" src="${thumb}" alt="${listing.title}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'" />
          <div class="listing-info">
            <div class="listing-title-row">
              <span class="listing-title">${listing.title}</span>
              <span class="pill ${pillCls}">${pillLabel}</span>
            </div>
            <div class="listing-address">${listing.address}</div>
            <div class="listing-price">${formatPrice(listing)}</div>
            <div class="listing-posted">Posted ${formatDate(listing.postedAt)}</div>
          </div>
          <div class="listing-actions">
            <span class="status-badge ${statusCls}">
              <span class="status-dot"></span>${statusLabel}
            </span>
            <div class="action-btns">${actionBtns}</div>
          </div>
        </div>
        ${rejectionBanner}
        <div class="close-confirm" id="confirm-${listing.id}" style="display:none">
          <span class="close-confirm-text">Move this listing to Closed?</span>
          <button class="btn-confirm-close" onclick="confirmClose('${listing.id}')">Confirm</button>
          <button class="btn-cancel-close"  onclick="cancelClose('${listing.id}')">Cancel</button>
        </div>
      </div>`;
  }

  // ── Empty state HTML ────────────────────────────────────────────────────────
  function buildEmpty(tab) {
    const icons = {
      active:  `<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/>`,
      draft:   `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
      pending: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      closed:  `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
    };
    const messages = {
      active:  { title: 'No active listings',  sub: 'Your approved listings will appear here once published.' },
      draft:   { title: 'No draft listings',   sub: 'Save a listing as draft before submitting it for review.' },
      pending: { title: 'No pending listings', sub: 'Listings submitted for admin review will appear here.' },
      closed:  { title: 'No closed listings',  sub: 'Listings you\'ve closed will appear here.' },
    };
    const { title, sub } = messages[tab] || messages.closed;
    const cta = (tab === 'active') ? (isVerified
      ? `<button class="btn-empty-add" onclick="handleAddListing()">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
             <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
           </svg>
           Add your first listing
         </button>`
      : `<span style="font-size:13px;color:var(--muted)">Verify your account to start posting</span>`)
    : '';

    return `<div class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${icons[tab] || icons.closed}
        </svg>
      </div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
      ${cta}
    </div>`;
  }

  // ── Render a panel ──────────────────────────────────────────────────────────
  function renderPanel(tab, listings, containerId) {
    const el = document.getElementById(containerId);
    if (listings.length === 0) {
      el.innerHTML = buildEmpty(tab);
    } else {
      el.innerHTML = `<div class="listing-list">${listings.map(l => buildCard(l, tab)).join('')}</div>`;
    }
  }

  // ── Update counts in tabs ───────────────────────────────────────────────────
  function updateCounts() {
    document.getElementById('countActive').textContent  = getActive().length;
    document.getElementById('countDraft').textContent   = getDraft().length;
    document.getElementById('countPending').textContent = getPending().length;
    document.getElementById('countClosed').textContent  = getClosed().length;
  }

  // ── Initial full render ─────────────────────────────────────────────────────
  function renderAll() {
    updateCounts();
    renderPanel('active',  getActive(),  'listActive');
    renderPanel('draft',   getDraft(),   'listDraft');
    renderPanel('pending', getPending(), 'listPending');
    renderPanel('closed',  getClosed(),  'listClosed');
  }
  renderAll();

  // ── Tab switching ───────────────────────────────────────────────────────────
  let currentTab = 'active';
  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('listActive').style.display  = tab === 'active'  ? '' : 'none';
    document.getElementById('listDraft').style.display   = tab === 'draft'   ? '' : 'none';
    document.getElementById('listPending').style.display = tab === 'pending' ? '' : 'none';
    document.getElementById('listClosed').style.display  = tab === 'closed'  ? '' : 'none';
  }

  // ── Add listing ─────────────────────────────────────────────────────────────
  function handleAddListing() {
    if (!isVerified) return;
    window.location.href = 'post.html';
  }

  // ── Submit draft for admin review ───────────────────────────────────────────
  function submitForReview(id) {
    const listing = myListings.find(l => l.id === id);
    if (!listing) return;
    listing.status = 'pending';
    delete listing.rejectionReason;
    const card = document.getElementById('card-' + id);
    if (card) {
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        renderAll();
        switchTab('pending');
      }, { once: true });
    }
  }

  // ── Reopen closed listing (resubmit for review) ─────────────────────────────
  function reopenListing(id) {
    const listing = myListings.find(l => l.id === id);
    if (!listing) return;
    listing.status = 'pending';
    const card = document.getElementById('card-' + id);
    if (card) {
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        renderAll();
        switchTab('pending');
      }, { once: true });
    }
  }

  // ── Edit modal ───────────────────────────────────────────────────────────────
  let editingId = null;

  function handleEdit(id) {
    editingId = id;
    const listing = myListings.find(l => l.id === id);
    if (!listing) return;
    document.getElementById('editTitle').value   = listing.title;
    document.getElementById('editPrice').value   = listing.price;
    document.getElementById('editAddress').value = listing.address;
    document.getElementById('editType').value    = listing.listingFor;
    document.getElementById('editDeleteName').textContent = listing.title;
    document.getElementById('editModal').classList.add('open');
  }

  function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
    editingId = null;
  }

  function saveEdit() {
    if (!editingId) return;
    const listing = myListings.find(l => l.id === editingId);
    if (!listing) return;
    listing.title      = document.getElementById('editTitle').value.trim() || listing.title;
    listing.price      = parseFloat(document.getElementById('editPrice').value) || listing.price;
    listing.address    = document.getElementById('editAddress').value.trim() || listing.address;
    listing.listingFor = document.getElementById('editType').value;
    closeEditModal();
    renderAll();
  }

  function deleteFromEdit() {
    if (!editingId) return;
    closeEditModal();
    const card = document.getElementById('card-' + editingId);
    if (!card) return;
    card.classList.add('removing');
    card.addEventListener('animationend', () => {
      myListings = myListings.filter(l => l.id !== editingId);
      editingId = null;
      renderAll();
    }, { once: true });
  }

  // ── Close Listing ────────────────────────────────────────────────────────────
  function promptClose(id) {
    document.querySelectorAll('.close-confirm').forEach(el => {
      if (el.id !== 'confirm-' + id) el.style.display = 'none';
    });
    const row = document.getElementById('confirm-' + id);
    if (row) row.style.display = 'flex';
  }

  function cancelClose(id) {
    const row = document.getElementById('confirm-' + id);
    if (row) row.style.display = 'none';
  }

  function confirmClose(id) {
    const listing = myListings.find(l => l.id === id);
    if (!listing) return;
    listing.status = 'closed';
    const card = document.getElementById('card-' + id);
    if (card) {
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        renderAll();
        switchTab('closed');
      }, { once: true });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ADJUST AVAILABILITY (for multi-unit properties)
  // ══════════════════════════════════════════════════════════════════════════════

  window.adjustAvailability = function(id) {
    const listing = FAKE_LISTINGS.find(l => l.id === id);
    if (!listing) return;

    AdjustAvailabilityModal.open({
      listingId: listing.id,
      listingTitle: listing.title,
      totalUnits: listing.totalUnits,
      availableUnits: listing.availableUnits,
      onConfirm: (newAvailable) => {
        console.log(`✅ Availability updated: ${listing.title} now has ${newAvailable} units available`);
        renderAll();
      }
    });
  };
