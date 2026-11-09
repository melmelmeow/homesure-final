// Kasafide – Audit Trail (Super Admin)

(function () {
  const user = getSession();
  if (!user || (user.role !== 'superadmin' && user.role !== 'super_duper_admin')) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'audit-trail' });
  KasafideTopbar.init({ placeholder: 'Search user, action, IP…', onSearch: function() { searchQuery = (document.getElementById('hsSearch')||{}).value?.trim() || ''; renderTable(); } });

  const roleColors = { admin: 'var(--k-avatar-1)', superadmin: 'var(--k-avatar-3)', super_duper_admin: 'var(--k-avatar-4)' };
  let auditFilter  = 'all';
  let searchQuery  = '';
  let entries      = [];      // loaded from audit_logs; only super admins can read it

  function buildRow(e) {
    const initials    = (e.actor || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const roleLabel   = e.actorRole === 'superadmin' ? 'Super Admin' : 'Admin';
    const roleColor   = roleColors[e.actorRole] || 'var(--k-avatar-6)';
    const statusBg    = e.status === 'success' ? 'var(--success)' : 'var(--danger)';
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
      <td><span class="badge" style="background:${statusBg};color:var(--on-primary)">${statusLabel}</span></td>
      <td style="color:var(--muted2);font-size:12.5px">${e.details}</td>
    </tr>`;
  }

  function renderTable() {
    const q = searchQuery.toLowerCase();
    const filtered = entries.filter(e => {
      const matchType   = auditFilter === 'all' || e.type === auditFilter;
      const matchSearch = !q ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.ipAddress || '').includes(q) ||
        e.details.toLowerCase().includes(q);
      return matchType && matchSearch;
    });

    document.getElementById('auditTable').innerHTML = filtered.length
      ? filtered.map(buildRow).join('')
      : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No entries found.</td></tr>`;
  }

  renderTable();

  // ── Export CSV ────────────────────────────────────────────────────────────
  window.exportAuditCSV = function () {
    const q = searchQuery.toLowerCase();
    const filtered = entries.filter(e => {
      const matchType   = auditFilter === 'all' || e.type === auditFilter;
      const matchSearch = !q ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.ipAddress || '').includes(q) ||
        e.details.toLowerCase().includes(q);
      return matchType && matchSearch;
    });

    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'IP Address', 'Status', 'Details'];
    const rows = filtered.map(e => [
      e.timestamp,
      e.actor,
      e.actorRole === 'superadmin' ? 'Super Admin' : 'Admin',
      e.action,
      e.ipAddress || '',
      e.status,
      e.details,
    ]);

    downloadCSV([headers, ...rows], 'audit-trail.csv');
  };

  function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Load the trail, then draw ───────────────────────────────────────────────
  (async function load() {
    try {
      entries = await HS.audit.list(300);
    } catch (err) {
      console.error('Could not load the audit trail:', err);
    }
    renderTable();
  })();

  // Filter tabs
  document.getElementById('auditTabs').addEventListener('click', e => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('#auditTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    auditFilter = btn.dataset.type;
    renderTable();
  });


})();
