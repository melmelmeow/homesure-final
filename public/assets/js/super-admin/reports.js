// ══════════════════════════════════════════════════════════════════════════════
// HomeSure – System Reports (Super Admin)
// The big boss dashboard. With great power comes great... analytics?
// Only the chosen ones (superadmins) shall pass.
// ══════════════════════════════════════════════════════════════════════════════

(function () {
  // ────────────────────────────────────────────────────────────────────────
  // Ultra-Secure Auth Guard
  // Not a superadmin? Yeet yourself out.
  // ────────────────────────────────────────────────────────────────────────
  const user = getSession();
  if (!user || user.role !== 'superadmin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'reports' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  // ══════════════════════════════════════════════════════════════════════════
  // Computed Stats
  // Crunching numbers like it's nobody's business
  // ══════════════════════════════════════════════════════════════════════════
  const buyers      = FAKE_USERS.filter(u => u.role === 'buyer').length;
  const sellers     = FAKE_USERS.filter(u => u.role === 'seller').length;
  const totalUsers  = buyers + sellers;
  const totalListings  = FAKE_LISTINGS.length;
  const pendingReports = FAKE_REPORTS.filter(r => r.status === 'pending').length;
  const activeAdmins   = FAKE_USERS.filter(u => u.role === 'admin').length;

  // ── Stat Cards ────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Users',     value: totalUsers,     color: 'teal',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { label: 'Total Listings',  value: totalListings,  color: 'blue',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
    { label: 'Pending Reports', value: pendingReports, color: 'amber',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
    { label: 'Active Admins',   value: activeAdmins,   color: 'purple', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
  ];

  document.getElementById('statGrid').style.gridTemplateColumns = 'repeat(4,1fr)';
  document.getElementById('statGrid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon ${s.color}">${s.icon}</div>
      <div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    </div>`).join('');

  // ══════════════════════════════════════════════════════════════════════════
  // User Growth Line Chart
  // Watching our user count go up like stonks
  // (Please go up. Pretty please.)
  // ══════════════════════════════════════════════════════════════════════════
  const growthData = {
    monthly: { labels: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'], values: [3,5,6,8,11,14,18], sub: 'Monthly new accounts — last 7 months' },
    weekly:  { labels: ['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7'], values: [2,3,2,4,3,5,4], sub: 'Weekly new accounts — last 7 weeks' },
    daily:   { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [1,2,1,3,2,1,2], sub: 'Daily new accounts — last 7 days' },
  };

  // ────────────────────────────────────────────────────────────────────────
  // renderUserGrowthChart() — Draw the Growth Line
  // SVG magic + Math wizardry = Pretty chart
  // Now with 100% more theme support (light mode people rejoice!)
  // ────────────────────────────────────────────────────────────────────────
  function renderUserGrowthChart(period) {
    // Check if user is in "I hate my eyes" mode (light theme)
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const axisColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const labelColor = isLight ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.38)';

    const { labels, values, sub } = growthData[period];
    document.getElementById('userGrowthSub').textContent = sub;
    const W = 500, H = 160, padL = 32, padR = 16, padT = 16, padB = 32;
    const maxVal = Math.max(...values);
    const xs = values.map((_, i) => padL + i * ((W - padL - padR) / (values.length - 1)));
    const ys = values.map(v => padT + (1 - v / maxVal) * (H - padT - padB));
    const linePath = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `L${x},${ys[i]}`)).join(' ');
    const areaPath = `${linePath} L${xs[xs.length-1]},${H-padB} L${xs[0]},${H-padB} Z`;
    const yGrids   = [0,0.25,0.5,0.75,1].map(p => padT + (1-p)*(H-padT-padB));
    const gridLines = yGrids.map(y => `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`).join('');
    const xLabels   = labels.map((m, i) => `<text x="${xs[i]}" y="${H-4}" text-anchor="middle" fill="${labelColor}" font-size="10" font-family="Plus Jakarta Sans">${m}</text>`).join('');
    const dots      = xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="4" fill="#00c9a7" stroke="var(--card)" stroke-width="2"/><title>${labels[i]}: ${values[i]} users</title>`).join('');
    const chartH = H - padT - padB;
    const axes = `
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="${axisColor}" stroke-width="2"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="${axisColor}" stroke-width="2"/>
    `;
    document.getElementById('userGrowthChart').setAttribute('viewBox', `0 0 ${W} ${H}`);
    document.getElementById('userGrowthChart').innerHTML = `
      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00c9a7" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#00c9a7" stop-opacity="0"/>
      </linearGradient></defs>
      ${axes}${gridLines}
      <path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="#00c9a7" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}${xLabels}`;
  }

  renderUserGrowthChart('monthly');

  window.setUserGrowthPeriod = function(period, el) {
    document.querySelectorAll('#userGrowthDropdown .period-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('userGrowthPeriodLabel').textContent = el.textContent;
    document.getElementById('userGrowthDropdown').classList.remove('open');
    renderUserGrowthChart(period);
  };

  // ── Listing Breakdown Donut ───────────────────────────────────────────────
  const listingPeriodData = {
    monthly: { approved: FAKE_LISTINGS.filter(l => l.status === 'approved').length, pending: FAKE_LISTINGS.filter(l => l.status === 'pending').length, rejected: FAKE_LISTINGS.filter(l => l.status === 'rejected').length, sub: 'All listings by current status' },
    weekly:  { approved: 8, pending: 3, rejected: 1, sub: 'Listings submitted this week' },
    daily:   { approved: 2, pending: 1, rejected: 0, sub: 'Listings submitted today' },
  };

  const approved = listingPeriodData.monthly.approved;
  const pending  = listingPeriodData.monthly.pending;
  const rejected = listingPeriodData.monthly.rejected;
  const total    = totalListings;

  const segments = [
    { label: 'Approved', count: approved, color: '#00c9a7' },
    { label: 'Pending',  count: pending,  color: '#f59e0b' },
    { label: 'Rejected', count: rejected, color: '#ef4444' },
  ];

  function donut(segs, total) {
    const R = 70, cx = 90, cy = 90, stroke = 28;
    const circ = 2 * Math.PI * R;
    let offset = 0;
    const paths = segs.map(s => {
      const pct  = total ? s.count / total : 0;
      const dash = pct * circ;
      const gap  = circ - dash;
      const el   = `<circle cx="${cx}" cy="${cy}" r="${R}"
        fill="none" stroke="${s.color}" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" />`;
      offset += dash;
      return el;
    });
    return `<svg viewBox="0 0 180 180" width="180" height="180">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${stroke}"/>
      ${paths.join('')}
    </svg>`;
  }

  const legendHtml = segments.map(s => {
    const pct = total ? Math.round(s.count / total * 100) : 0;
    return `
      <div class="legend-item">
        <div class="legend-dot" style="background:${s.color}"></div>
        <div class="legend-info">
          <div class="legend-name">${s.label}</div>
          <div class="legend-count">${s.count} listings</div>
        </div>
        <div class="legend-pct">${pct}%</div>
      </div>`;
  }).join('');

  function renderListingBreakdown(period) {
    const d    = listingPeriodData[period];
    const segs = [
      { label: 'Approved', count: d.approved, color: '#00c9a7' },
      { label: 'Pending',  count: d.pending,  color: '#f59e0b' },
      { label: 'Rejected', count: d.rejected, color: '#ef4444' },
    ];
    const t = d.approved + d.pending + d.rejected;
    document.getElementById('listingBreakdownSub').textContent = d.sub;
    const legend = segs.map(s => {
      const pct = t ? Math.round(s.count / t * 100) : 0;
      return `<div class="legend-item">
        <div class="legend-dot" style="background:${s.color}"></div>
        <div class="legend-info"><div class="legend-name">${s.label}</div><div class="legend-count">${s.count} listings</div></div>
        <div class="legend-pct">${pct}%</div>
      </div>`;
    }).join('');
    document.getElementById('listingBreakdown').innerHTML = `
      <div class="breakdown-wrap">
        <div class="donut-wrap">
          ${donut(segs, t)}
          <div class="donut-center"><div class="donut-total">${t}</div><div class="donut-label">Total</div></div>
        </div>
        <div class="breakdown-legend">${legend}</div>
      </div>`;
  }

  renderListingBreakdown('monthly');

  window.setListingPeriod = function(period, el) {
    document.querySelectorAll('#listingDropdown .period-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('listingPeriodLabel').textContent = el.textContent;
    document.getElementById('listingDropdown').classList.remove('open');
    renderListingBreakdown(period);
  };


  // ── Period dropdown helpers ───────────────────────────────────────────────
  window.toggleDropdown = function(id) {
    const el = document.getElementById(id);
    const isOpen = el.classList.contains('open');
    document.querySelectorAll('.period-dropdown.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) el.classList.add('open');
  };
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.period-dropdown')) {
      document.querySelectorAll('.period-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

  // ── Reports Table ─────────────────────────────────────────────────────────
  let reportFilter = 'all';
  let reports = [...FAKE_REPORTS];

  function renderReports() {
    const filtered = reportFilter === 'all'
      ? reports
      : reports.filter(r => r.status === reportFilter);

    const catLabels = { suspicious: 'Suspicious', fake: 'Fake', scam: 'Scam', misleading: 'Misleading', duplicate: 'Duplicate', other: 'Other' };

    document.getElementById('reportsTable').innerHTML = filtered.length
      ? filtered.map(r => {
          const listing    = FAKE_LISTINGS.find(l => l.id === r.listingId);
          const reporter   = FAKE_USERS.find(u => u.id === r.reportedBy);
          const listingName = listing ? listing.title : r.listingId;
          const reporterName = reporter ? reporter.firstName + ' ' + reporter.lastName : 'Unknown';
          const catLabel   = catLabels[r.category] || 'Other';
          const statusBadge = `<span class="badge ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>`;
          const actionBtns = r.status === 'pending'
            ? `<div class="action-btns">
                <button class="btn-sm resolve" onclick="resolveReport('${r.id}','resolved')">Resolve</button>
                <button class="btn-sm dismiss" onclick="resolveReport('${r.id}','dismissed')">Dismiss</button>
               </div>`
            : `<span style="font-size:12px;color:var(--muted)">${r.resolvedAt || '—'}</span>`;
          return `
            <tr>
              <td style="font-weight:600;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${listingName}</td>
              <td>${reporterName}</td>
              <td><span class="cat-badge ${r.category}">${catLabel}</span></td>
              <td><div class="reason-text" title="${r.reason}">${r.reason}</div></td>
              <td style="color:var(--muted);font-size:12px;white-space:nowrap">${r.reportedAt}</td>
              <td>${statusBadge}</td>
              <td>${actionBtns}</td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No reports found.</td></tr>`;
  }
  renderReports();

  window.resolveReport = function (id, status) {
    const r = reports.find(x => x.id === id);
    if (!r) return;
    r.status     = status;
    r.resolvedAt = new Date().toISOString().split('T')[0];
    renderReports();
    showToast(status === 'resolved' ? 'Report marked as resolved.' : 'Report dismissed.');
  };

  // Filter tabs
  document.getElementById('reportTabs').addEventListener('click', e => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('#reportTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    reportFilter = btn.dataset.status;
    renderReports();
  });

  // ── Export CSV ────────────────────────────────────────────────────────────
  window.exportReportsCSV = function () {
    const catLabels = { suspicious: 'Suspicious', fake: 'Fake', scam: 'Scam', misleading: 'Misleading', duplicate: 'Duplicate', other: 'Other' };
    const filtered = reportFilter === 'all' ? reports : reports.filter(r => r.status === reportFilter);

    const headers = ['Listing', 'Reported By', 'Category', 'Reason', 'Reported At', 'Status', 'Resolved At'];
    const rows = filtered.map(r => {
      const listing  = FAKE_LISTINGS.find(l => l.id === r.listingId);
      const reporter = FAKE_USERS.find(u => u.id === r.reportedBy);
      return [
        listing ? listing.title : r.listingId,
        reporter ? reporter.firstName + ' ' + reporter.lastName : 'Unknown',
        catLabels[r.category] || 'Other',
        r.reason,
        r.reportedAt,
        r.status,
        r.resolvedAt || '',
      ];
    });

    downloadCSV([headers, ...rows], 'system-reports.csv');
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

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = 'toast ' + type + ' show';
    document.getElementById('toastMsg').textContent = msg;
    setTimeout(() => t.classList.remove('show'), 3500);
  }

})();
