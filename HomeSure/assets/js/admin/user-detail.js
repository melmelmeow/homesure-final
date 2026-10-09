// HomeSure – User Detail Page (Admin)

(function () {
  const admin = getSession();
  if (!admin || admin.role !== 'admin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'users' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const u      = FAKE_USERS.find(x => x.id === id);

  if (!u) {
    document.getElementById('pageContent').innerHTML =
      `<div style="text-align:center;padding:80px;color:var(--muted)">User not found.</div>`;
    return;
  }

  const initials    = (u.firstName[0] + u.lastName[0]).toUpperCase();
  const avatarColor = u.role === 'buyer' ? '#3b82f6' : '#8b5cf6';
  const roleLabel   = u.role === 'buyer' ? 'Buyer' : 'Seller';
  const statusLabel = u.accountStatus
    ? u.accountStatus.charAt(0).toUpperCase() + u.accountStatus.slice(1)
    : 'Active';
  const statusClass = u.accountStatus || (u.role === 'buyer' ? 'active' : 'unverified');

  // ── Rejection callout (if previously rejected) ────────────────────────────
  const rejectionHtml = u.verificationRejectReason ? `
    <div class="rejection-callout">
      <div class="rejection-callout-label">Previous Rejection Reason</div>
      <p>${u.verificationRejectReason}</p>
    </div>` : '';

  // ── Docs renderer ─────────────────────────────────────────────────────────
  function docsGrid(docs) {
    if (!docs || !docs.length) return `<div class="no-docs">No documents submitted.</div>`;
    return `<div class="docs-grid">${docs.map(d => `
      <a href="${d.url}" target="_blank" class="doc-card">
        <img src="${d.url}" alt="${d.label}" />
        <span>${d.label}</span>
      </a>`).join('')}</div>`;
  }

  // ── Verification section ──────────────────────────────────────────────────
  let verifSection = '';

  if (u.role === 'seller') {
    const isPending        = u.accountStatus === 'pending';
    const isReverification = u.accountStatus === 'reverification';

    if (isReverification) {
      // Side-by-side comparison
      verifSection = `
        <div class="notice-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>This seller was previously verified on <strong>${u.verifiedAt || '—'}</strong> and has submitted new documents for reverification. Compare old and new docs below. Reverification is a lighter review — approve if the documents are valid and consistent.</p>
        </div>
        <div class="compare-grid">
          <div class="compare-col">
            <div class="compare-col-label old">Previously Approved Documents</div>
            <div class="compare-col-body">${docsGrid(u.verificationDocs)}</div>
          </div>
          <div class="compare-col">
            <div class="compare-col-label new">New Submission</div>
            <div class="compare-col-body">${docsGrid(u.newVerificationDocs)}</div>
          </div>
        </div>`;
    } else if (isPending) {
      verifSection = `
        <div class="section-card">
          <div class="section-label">Submitted Documents</div>
          ${docsGrid(u.verificationDocs)}
        </div>`;
    } else {
      verifSection = `
        <div class="section-card">
          <div class="section-label">Verification Documents</div>
          ${docsGrid(u.verificationDocs)}
        </div>`;
    }
  }

  // ── Header action buttons ─────────────────────────────────────────────────
  let actionBtns = '';
  if (u.role === 'seller') {
    const isVerified   = u.accountStatus === 'verified';
    const isUnverified = u.accountStatus === 'unverified';
    const approveBtn   = isVerified
      ? `<button class="btn-action primary" disabled>Verified</button>`
      : `<button class="btn-action primary" onclick="doApprove()">Approve</button>`;
    const rejectBtn    = isUnverified
      ? `<button class="btn-action danger" disabled>Already Rejected</button>`
      : `<button class="btn-action danger" onclick="openRejectModal()">Reject</button>`;
    actionBtns = rejectBtn + approveBtn;
  }

  // ── Listings count ────────────────────────────────────────────────────────
  const userListings = u.role === 'seller'
    ? FAKE_LISTINGS.filter(l => l.sellerId === u.id)
    : (u.savedListings || []);

  // ── Render page ───────────────────────────────────────────────────────────
  document.getElementById('pageContent').innerHTML = `
    <div class="detail-header">
      <div>
        <button class="back-btn" onclick="history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Users
        </button>
        <div class="detail-title">${u.firstName} ${u.lastName}</div>
        <div class="detail-meta">${u.email} · Joined ${u.joinedAt || '—'}</div>
      </div>
      <div class="header-actions">${actionBtns}</div>
    </div>

    <div class="profile-card">
      <div class="profile-avatar" style="background:${avatarColor}">${initials}</div>
      <div>
        <div class="profile-name">${u.firstName} ${u.lastName}</div>
        <div class="profile-email">${u.email}</div>
        <div class="profile-badges">
          <span class="badge ${u.role === 'buyer' ? 'buyer-role' : 'seller-role'}">${roleLabel}</span>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-label">Account Information</div>
      <div class="info-grid">
        <div class="info-item"><label>Phone</label><span>${u.phone || '—'}</span></div>
        <div class="info-item"><label>Joined</label><span>${u.joinedAt || '—'}</span></div>
        ${u.role === 'seller' ? `
          <div class="info-item"><label>Total Listings</label><span>${userListings.length}</span></div>
          <div class="info-item"><label>Verified On</label><span>${u.verifiedAt || '—'}</span></div>
          <div class="info-item"><label>Expiry</label><span>${u.verificationExpiry || '—'}</span></div>
          <div class="info-item"><label>Submitted</label><span>${u.submittedVerificationAt || u.newSubmittedAt || '—'}</span></div>
        ` : `
          <div class="info-item"><label>Saved Listings</label><span>${userListings.length}</span></div>
        `}
      </div>
    </div>

    ${rejectionHtml}
    ${verifSection}`;

  // ── Approve ───────────────────────────────────────────────────────────────
  window.doApprove = function () {
    u.accountStatus      = 'verified';
    u.verifiedAt         = new Date().toISOString().split('T')[0];
    const expiry         = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
    u.verificationExpiry = expiry.toISOString().split('T')[0];
    if (u.newVerificationDocs) {
      u.verificationDocs    = u.newVerificationDocs;
      u.newVerificationDocs = null;
    }
    window.location.reload();
  };

  // ── Reject Modal ──────────────────────────────────────────────────────────
  const isReverif = u.accountStatus === 'reverification';

  const VERIF_REASONS = [
    'Submitted ID is expired or not a valid government-issued ID.',
    'Transfer Certificate of Title (TCT) is missing or unreadable.',
    'Documents appear tampered or do not match the property details.',
    'Tax Declaration does not match the submitted address.',
    'Incomplete submission — one or more required documents are missing.',
    'Property ownership cannot be verified with the provided documents.',
  ];

  const REVERIF_REASONS = [
    'New ID does not match the name on the previously approved documents.',
    'Renewed documents are expired or invalid.',
    'New documents do not match the property on record.',
    'Submitted documents are the same as the previously rejected ones.',
    'Incomplete reverification — please resubmit all required documents.',
  ];

  const reasons = isReverif ? REVERIF_REASONS : VERIF_REASONS;

  window.openRejectModal = function () {
    document.getElementById('rejectModalTitle').textContent = isReverif ? 'Reject Reverification' : 'Reject Verification';
    document.getElementById('rejectModalSub').textContent   = isReverif
      ? 'Select why the new documents were not accepted.'
      : 'Select a reason for rejection. The seller will see this message and know what to fix.';
    document.getElementById('rejectCustom').value = '';
    document.getElementById('rejectReasons').innerHTML = reasons.map((r, i) => `
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
    const reason   = custom || (selected ? reasons[selected.value] : null);
    if (!reason) { alert('Please select or write a rejection reason.'); return; }
    u.accountStatus              = 'unverified';
    u.verificationRejectReason   = reason;
    closeRejectModal();
    window.location.reload();
  };

  document.getElementById('rejectModal').addEventListener('click', e => {
    if (e.target === document.getElementById('rejectModal')) closeRejectModal();
  });

})();
