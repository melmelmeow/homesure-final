// HomeSure – Super Admin Dashboard

(function () {
  const user = getSession();
  if (!user || user.role !== 'superadmin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  document.getElementById('dashTitle').textContent =
    'Welcome back, ' + user.firstName + ' ' + user.lastName;

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalUsers      = FAKE_USERS.filter(u => ['buyer','seller'].includes(u.role)).length;
  const totalAdmins     = FAKE_USERS.filter(u => u.role === 'admin').length;
  const totalSellers    = FAKE_USERS.filter(u => u.role === 'seller').length;
  const totalBuyers     = FAKE_USERS.filter(u => u.role === 'buyer').length;
  const totalListings   = FAKE_LISTINGS.length;
  const openReports     = FAKE_REPORTS.filter(r => r.status === 'pending').length;
  const approved        = FAKE_LISTINGS.filter(l => l.status === 'approved').length;
  const verifiedSellers = FAKE_USERS.filter(u => u.role === 'seller' && u.accountStatus === 'verified').length;
  const approvalRate    = totalListings ? Math.round(approved / totalListings * 100) : 0;
  const verifyRate      = totalSellers  ? Math.round(verifiedSellers / totalSellers * 100) : 0;

  // ── Stat Cards ──────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Users',   value: totalUsers,   color: 'teal',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { label: 'Admins',        value: totalAdmins,  color: 'purple', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
    { label: 'Sellers',       value: totalSellers, color: 'blue',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>` },
    { label: 'Buyers',        value: totalBuyers,  color: 'teal',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { label: 'Listings',      value: totalListings, color: 'green', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
    { label: 'Open Reports',  value: openReports,  color: 'amber',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>` },
  ];

  document.getElementById('statGrid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon ${s.color}">${s.icon}</div>
      <div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    </div>`).join('');

  // ── System Health ───────────────────────────────────────────────────────────
  const health = [
    { label: 'Listing Approval Rate', value: approvalRate + '%',      note: approvalRate >= 70 ? 'Healthy' : 'Needs review', ok: approvalRate >= 70 },
    { label: 'Seller Verification',   value: verifyRate + '%',         note: verifyRate >= 50 ? 'Good trust level' : 'Encourage verification', ok: verifyRate >= 50 },
    { label: 'Open Reports',          value: openReports,              note: openReports === 0 ? 'All cleared' : openReports + ' need attention', ok: openReports === 0 },
    { label: 'Pending Listings',      value: FAKE_LISTINGS.filter(l => l.status === 'pending').length, note: 'Awaiting admin review', ok: true },
  ];

  document.getElementById('healthRow').innerHTML = health.map(h => `
    <div class="health-card">
      <div class="health-label">${h.label}</div>
      <div class="health-value">${h.value}</div>
      <div class="health-note ${h.ok ? 'ok' : 'warn'}">${h.note}</div>
    </div>`).join('');

  // ── Admin Management ────────────────────────────────────────────────────────
  let adminList = [...FAKE_ADMINS];

  function renderAdminTable() {
    document.getElementById('adminTable').innerHTML = adminList.map(a => {
      const initials = (a.firstName[0] + a.lastName[0]).toUpperCase();
      const statusBadge = a.status === 'active'
        ? `<span class="badge active">Active</span>`
        : `<span class="badge inactive">Inactive</span>`;
      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-avatar">${initials}</div>
              <span>${a.firstName} ${a.lastName}</span>
            </div>
          </td>
          <td>${a.email}</td>
          <td>${statusBadge}</td>
          <td>${a.addedAt || '—'}</td>
          <td>${a.addedBy || '—'}</td>
          <td>
            <div class="action-btns">
              <button class="btn-sm ${a.status === 'active' ? 'deactivate' : 'activate'}"
                onclick="toggleAdmin('${a.id}')">
                ${a.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button class="btn-sm reset" onclick="resetPassword('${a.id}', '${a.firstName}')">
                Reset Password
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }
  renderAdminTable();

  window.toggleAdmin = function (id) {
    const admin = adminList.find(a => a.id === id);
    if (!admin) return;
    admin.status = admin.status === 'active' ? 'inactive' : 'active';
    renderAdminTable();
    showToast(`${admin.firstName} ${admin.lastName} has been ${admin.status === 'active' ? 'activated' : 'deactivated'}.`);
    addAuditEntry('Ricardo Dela Cruz', 'superadmin',
      admin.status === 'active' ? 'Activated admin account' : 'Deactivated admin account',
      `${admin.firstName} ${admin.lastName} (${admin.email})`, 'admin');
  };

  window.resetPassword = function (id, name) {
    showToast(`Password reset link sent to ${name}.`);
    addAuditEntry('Ricardo Dela Cruz', 'superadmin', 'Reset admin password',
      `${name} – temporary password issued`, 'admin');
  };

  // ── Add Admin Modal ─────────────────────────────────────────────────────────
  const modal = document.getElementById('addAdminModal');
  document.getElementById('addAdminBtn').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  document.getElementById('closeAdminModal').addEventListener('click', closeModal);
  document.getElementById('cancelAdminModal').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() {
    modal.style.display = 'none';
    ['newAdminFirst','newAdminLast','newAdminEmail','newAdminPass'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  document.getElementById('confirmAddAdmin').addEventListener('click', () => {
    const fn    = document.getElementById('newAdminFirst').value.trim();
    const ln    = document.getElementById('newAdminLast').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const pass  = document.getElementById('newAdminPass').value.trim();
    if (!fn || !ln || !email || !pass) {
      showToast('Please fill in all fields.', 'error'); return;
    }
    const newAdmin = {
      id: 'usr-' + Date.now(), role: 'admin',
      firstName: fn, lastName: ln, email, password: pass,
      status: 'active', addedBy: user.firstName + ' ' + user.lastName,
      addedAt: new Date().toISOString().split('T')[0],
    };
    adminList.push(newAdmin);
    renderAdminTable();
    closeModal();
    showToast(`Admin account created for ${fn} ${ln}.`);
    addAuditEntry('Ricardo Dela Cruz', 'superadmin', 'Added admin account',
      `${fn} ${ln} (${email})`, 'admin');
  });

  // ── Audit Trail Preview (latest 5) ─────────────────────────────────────────
  const roleColors = { admin: '#3b82f6', superadmin: '#8b5cf6' };

  function renderAuditPreview() {
    const preview = FAKE_AUDIT_TRAIL.slice(0, 5);
    document.getElementById('auditTable').innerHTML = preview.map(e => {
      const initials   = e.actor.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const roleLabel  = e.actorRole === 'superadmin' ? 'Super Admin' : 'Admin';
      const roleColor  = roleColors[e.actorRole] || '#6b7280';
      const statusBg   = e.status === 'success' ? '#00c9a7' : '#ef4444';
      const statusLabel = e.status === 'success' ? 'Success' : 'Failed';
      return `
      <tr>
        <td style="color:var(--muted);font-size:12px;white-space:nowrap">${e.timestamp}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar" style="background:${roleColor}">${initials}</div>
            <span style="font-weight:700">${e.actor}</span>
          </div>
        </td>
        <td><span class="type-badge" style="background:${roleColor}">${roleLabel}</span></td>
        <td style="font-weight:600">${e.action}</td>
        <td style="font-family:monospace;font-size:12px;color:var(--muted2)">${e.ipAddress || '—'}</td>
        <td><span class="badge" style="background:${statusBg};color:#fff">${statusLabel}</span></td>
        <td style="color:var(--muted2);font-size:12.5px">${e.details}</td>
      </tr>`;
    }).join('');
  }
  renderAuditPreview();

  function addAuditEntry(actor, actorRole, action, details, type, status = 'success') {
    const now = new Date();
    const ts  = now.toISOString().slice(0, 16).replace('T', ' ');
    FAKE_AUDIT_TRAIL.unshift({ id: 'aud-' + Date.now(), actor, actorRole, action, details, type, ipAddress: '10.0.0.1', status, timestamp: ts });
    renderAuditPreview();
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = 'toast ' + type + ' show';
    document.getElementById('toastMsg').textContent = msg;
    setTimeout(() => t.classList.remove('show'), 3500);
  }

})();
