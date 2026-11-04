// Kasafide – Admin Users Management

(function () {
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'users' });
  KasafideTopbar.init({ placeholder: 'Search users...', onSearch: renderUsers });

  // Only buyers and sellers are shown here (loaded from the database; admins can read every profile)
  let users = [];
  let activeFilter = 'all';

  const avatarColors = {
    buyer: 'var(--k-avatar-1)', seller: 'var(--k-avatar-3)',
  };

  // ── Render Table ─────────────────────────────────────────────────────────────
  function renderUsers() {
    const q = (document.getElementById('hsSearch') || {}).value?.toLowerCase() || '';
    const filtered = users.filter(u => {
      const matchRole   = activeFilter === 'all' || activeFilter === u.role ||
                          (activeFilter === 'pending' && (u.accountStatus === 'pending' || u.accountStatus === 'reverification'));
      const matchSearch = !q ||
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });

    const tbody = document.getElementById('usersBody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const initials  = (((u.firstName || '')[0] || '') + ((u.lastName || '')[0] || '')).toUpperCase() || '?';
      const avatarBg  = avatarColors[u.role] || 'var(--k-avatar-6)';
      const roleBadge = u.role === 'buyer'
        ? `<span class="badge buyer-role">Buyer</span>`
        : `<span class="badge seller-role">Seller</span>`;

      // Buyers are verified too now (documents reviewed by an admin), so both roles show their status.
      const s = u.accountStatus || 'unverified';
      const statusBadge = `<span class="badge ${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;

      const needsReview = u.accountStatus === 'pending' || u.accountStatus === 'reverification';
      const actionBtns = needsReview
        ? `<button class="btn-sm approve" onclick="window.location.href='user-detail.html?id=${u.id}'">Review</button>`
        : `<button class="btn-sm btn-icon" onclick="window.location.href='user-detail.html?id=${u.id}'" title="View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
           </button>`;

      const moaCell = u.role === 'seller'
        ? (u.moaSignedAt
            ? `<span class="badge approved" title="Signed on ${u.moaSignedAt}">Signed</span>`
            : `<span class="badge pending">Unsigned</span>`)
        : `<span style="color:var(--muted);font-size:12px">—</span>`;

      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-avatar" style="background:${avatarBg}">${initials}</div>
              <div>
                <div style="font-weight:700">${u.firstName} ${u.lastName}</div>
                <div style="font-size:11px;color:var(--muted)">${u.phone || '—'}</div>
              </div>
            </div>
          </td>
          <td style="color:var(--muted2)">${u.email}</td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td>${moaCell}</td>
          <td style="color:var(--muted);font-size:12px">${u.joinedAt || '—'}</td>
          <td><div class="action-btns">${actionBtns}</div></td>
        </tr>`;
    }).join('');
  }
  async function loadUsers() {
    document.getElementById('usersBody').innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Loading…</td></tr>';
    try {
      users = (await HS.admin.users()).filter(u => u.role === 'buyer' || u.role === 'seller');
    } catch (err) {
      console.error('Failed to load users:', err);
      document.getElementById('usersBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Could not load users. Please try again.</td></tr>';
      return;
    }
    renderUsers();
  }
  loadUsers();

  // ── Filter Tabs ──────────────────────────────────────────────────────────────
  document.getElementById('filterTabs').addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderUsers();
  });


  // ── Verification Modal ───────────────────────────────────────────────────────
  let _currentUserId = null;

  window.openVerifModal = async function (id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    const docs = await HS.storage.resolveDocs(u.newVerificationDocs.length ? u.newVerificationDocs : u.verificationDocs);
    _currentUserId = id;

    document.getElementById('verif-name').textContent  = u.firstName + ' ' + u.lastName;
    document.getElementById('verif-email').textContent = u.email;

    // Info grid
    const statusLabel = u.accountStatus
      ? u.accountStatus.charAt(0).toUpperCase() + u.accountStatus.slice(1)
      : 'Active';
    const infoItems = u.role === 'seller' ? `
      <div class="verif-info-item"><label>Role</label><span>Seller</span></div>
      <div class="verif-info-item"><label>Joined</label><span>${u.joinedAt || '—'}</span></div>
      <div class="verif-info-item"><label>Verification Status</label><span>${statusLabel}</span></div>
      <div class="verif-info-item"><label>Submitted</label><span>${u.submittedVerificationAt || '—'}</span></div>
      ${u.verifiedAt ? `<div class="verif-info-item"><label>Verified On</label><span>${u.verifiedAt}</span></div>` : ''}
      ${u.verificationExpiry ? `<div class="verif-info-item"><label>Expiry</label><span>${u.verificationExpiry}</span></div>` : ''}
    ` : `
      <div class="verif-info-item"><label>Role</label><span>Buyer</span></div>
      <div class="verif-info-item"><label>Joined</label><span>${u.joinedAt || '—'}</span></div>
      <div class="verif-info-item"><label>Phone</label><span>${u.phone || '—'}</span></div>
      <div class="verif-info-item"><label>Status</label><span>Active</span></div>
    `;

    // Documents
    let docsHtml = '';
    if (u.role === 'seller') {
      if (docs.length) {
        docsHtml = `
          <div class="docs-section-title">Submitted Documents</div>
          <div class="docs-grid">
            ${docs.map(d => `
              <a href="${d.url}" target="_blank" class="doc-card">
                <img src="${d.url}" alt="${d.label}" />
                <span>${d.label}</span>
              </a>`).join('')}
          </div>`;
      } else {
        docsHtml = `<div class="docs-section-title">Submitted Documents</div>
                    <div class="no-docs">No documents submitted yet.</div>`;
      }
    }

    document.getElementById('verif-body').innerHTML = `
      <div class="verif-info">${infoItems}</div>
      ${docsHtml}`;

    // Footer buttons
    let footerHtml = `<button class="btn-modal close" onclick="closeVerifModal()">Close</button>`;
    if (u.role === 'seller') {
      const isVerified   = u.accountStatus === 'verified';
      const isUnverified = u.accountStatus === 'unverified';
      const approveBtn = isVerified
        ? `<button class="btn-modal approve" disabled style="opacity:0.3;cursor:not-allowed">Approve</button>`
        : `<button class="btn-modal approve" onclick="resolveVerif('approved')">Approve</button>`;
      const rejectBtn = isUnverified
        ? `<button class="btn-modal reject" disabled style="opacity:0.3;cursor:not-allowed">Reject</button>`
        : `<button class="btn-modal reject" onclick="openVerifRejectModal()">Reject</button>`;
      footerHtml = `
        <button class="btn-modal close" onclick="closeVerifModal()">Close</button>
        ${rejectBtn}
        ${approveBtn}`;
    }
    document.getElementById('verif-footer').innerHTML = footerHtml;

    document.getElementById('verifModal').classList.add('open');
  };

  window.closeVerifModal = function () {
    document.getElementById('verifModal').classList.remove('open');
    _currentUserId = null;
  };

  document.getElementById('verifModal').addEventListener('click', e => {
    if (e.target === document.getElementById('verifModal')) closeVerifModal();
  });

  window.resolveVerif = async function (decision, reason) {
    const u = users.find(x => x.id === _currentUserId);
    if (!u) return;
    try {
      if (decision === 'approved') {
        await HS.admin.approveVerification(u.id);
        HS.audit.log('Verified ' + u.role, 'user', u.name + ' (' + u.email + ')');
        showToast(`${u.firstName} ${u.lastName} has been verified.`);
      } else {
        await HS.admin.rejectVerification(u.id, reason);
        HS.audit.log('Rejected verification', 'user', u.name + ' – ' + (reason || ''));
        showToast(`${u.firstName} ${u.lastName}'s verification was rejected.`, 'error');
      }
      Object.assign(u, await HS.admin.user(u.id));
    } catch (err) {
      showToast('Could not update the account: ' + err.message, 'error');
      return;
    }
    closeVerifModal();
    renderUsers();
  };

  // ── Verif Reject Reason Modal ─────────────────────────────────────────────────
  const VERIF_REJECT_REASONS = [
    'Submitted ID is expired or not a valid government-issued ID.',
    'Transfer Certificate of Title (TCT) is missing or unreadable.',
    'Documents appear tampered or do not match the property details.',
    'Tax Declaration does not match the submitted address.',
    'Incomplete submission — one or more required documents are missing.',
    'Property ownership cannot be verified with the provided documents.',
  ];

  window.openVerifRejectModal = function () {
    document.getElementById('verifRejectCustom').value = '';
    document.getElementById('verifRejectReasons').innerHTML = VERIF_REJECT_REASONS.map((r, i) => `
      <label class="reject-reason-item">
        <input type="radio" name="verifRejectReason" value="${i}" />
        <span>${r}</span>
      </label>`).join('');
    document.getElementById('verifRejectModal').style.display = 'flex';
  };

  window.closeVerifRejectModal = function () {
    document.getElementById('verifRejectModal').style.display = 'none';
  };

  window.confirmVerifReject = function () {
    const selected = document.querySelector('input[name="verifRejectReason"]:checked');
    const custom   = document.getElementById('verifRejectCustom').value.trim();
    const reason   = custom || (selected ? VERIF_REJECT_REASONS[selected.value] : null);
    if (!reason) { hsToast('Please select or write a rejection reason.', 'error'); return; }
    closeVerifRejectModal();
    resolveVerif('rejected', reason);
  };

  document.getElementById('verifRejectModal').addEventListener('click', e => {
    if (e.target === document.getElementById('verifRejectModal')) closeVerifRejectModal();
  });

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = 'toast ' + type + ' show';
    document.getElementById('toastMsg').textContent = msg;
    setTimeout(() => t.classList.remove('show'), 3500);
  }

})();

