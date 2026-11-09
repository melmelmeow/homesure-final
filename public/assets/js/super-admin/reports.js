// ══════════════════════════════════════════════════════════════════════════════
// Kasafide – System Reports (Super Admin)
// The big boss dashboard. With great power comes great... analytics?
// Only the chosen ones (superadmins) shall pass.
// ══════════════════════════════════════════════════════════════════════════════

(async function () {
  // ────────────────────────────────────────────────────────────────────────
  // Ultra-Secure Auth Guard
  // Not a superadmin? Yeet yourself out.
  // ────────────────────────────────────────────────────────────────────────
  const user = getSession();
  if (!user || (user.role !== 'superadmin' && user.role !== 'super_duper_admin')) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'reports' });
  KasafideTopbar.init({ placeholder: 'Search...' });
  let LISTINGS = [];
  let USERS = [];
  let REPORTS_DATA = [];

  // Everything below adds up these rows. Load them once; RLS decides what this account may see.
  try {
    LISTINGS = await HS.listings.all();
    USERS    = await HS.admin.users();
    REPORTS_DATA = await HS.reports.list();
  } catch (err) {
    console.error('Could not load dashboard data:', err);
    hsToast('Could not load the dashboard data. Please refresh.', 'error');
    return;
  }


  // ══════════════════════════════════════════════════════════════════════════
  // Computed Stats
  // Crunching numbers like it's nobody's business
  // ══════════════════════════════════════════════════════════════════════════
  const buyers      = USERS.filter(u => u.role === 'buyer').length;
  const sellers     = USERS.filter(u => u.role === 'seller').length;
  const totalUsers  = buyers + sellers;
  const totalListings  = LISTINGS.length;
  const pendingReports = REPORTS_DATA.filter(r => r.status === 'pending').length;
  const activeAdmins   = USERS.filter(u => u.role === 'admin').length;

  // ── Stat Cards ────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Users',     value: totalUsers,     color: 'teal',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { label: 'Total Listings',  value: totalListings,  color: 'blue',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
    { label: 'Pending Reports', value: pendingReports, color: 'amber',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
    { label: 'Active Admins',   value: activeAdmins,   color: 'purple', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
  ];

  document.getElementById('statGrid').style.gridTemplateColumns = 'repeat(4,1fr)';
  document.getElementById('statGrid').innerHTML = stats.map((s, i) => `
    <div class="stat-card hsc-rise" style="--i:${i}">
      <div class="stat-icon ${s.color}">${s.icon}</div>
      <div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value" data-count="${s.value}">${s.value}</div>
      </div>
    </div>`).join('');
  hsCountUp(document.getElementById('statGrid'));

  // ══════════════════════════════════════════════════════════════════════════
  // User Growth Line Chart
  // Watching our user count go up like stonks
  // (Please go up. Pretty please.)
  // ══════════════════════════════════════════════════════════════════════════
  // Real sign-ups: email-confirmed buyer/seller accounts (HS.admin.users() already leaves out
  // unconfirmed ones), counted per month / week / day. These used to be invented arrays — the
  // monthly one even ran Oct → Apr, months that hadn't happened yet.
  const DAY_MS = 86400000;
  const joinDates = USERS
    .filter(u => (u.role === 'buyer' || u.role === 'seller') && u.joinedAt)
    .map(u => new Date(u.joinedAt + 'T00:00:00'));
  const countBetween = (start, end) => joinDates.filter(d => d >= start && d < end).length;

  function buildGrowth() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const months = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getFullYear(), today.getMonth() - 6 + i, 1);
      const end   = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      return [start.toLocaleDateString('en-PH', { month: 'short' }), countBetween(start, end)];
    });
    const weeks = Array.from({ length: 7 }, (_, i) => {
      const end   = new Date(today.getTime() + DAY_MS - (6 - i) * 7 * DAY_MS);
      const start = new Date(end.getTime() - 7 * DAY_MS);
      return [start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), countBetween(start, end)];
    });
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getTime() - (6 - i) * DAY_MS);
      return [start.toLocaleDateString('en-PH', { weekday: 'short' }), countBetween(start, new Date(start.getTime() + DAY_MS))];
    });
    const pack = (rows, sub) => ({ labels: rows.map(r => r[0]), values: rows.map(r => r[1]), sub });
    return {
      monthly: pack(months, 'Monthly new accounts — last 7 months'),
      weekly:  pack(weeks,  'Weekly new accounts — last 7 weeks'),
      daily:   pack(days,   'Daily new accounts — last 7 days'),
    };
  }
  const growthData = buildGrowth();

  // ────────────────────────────────────────────────────────────────────────
  // renderUserGrowthChart() — Draw the Growth Line
  // SVG magic + Math wizardry = Pretty chart
  // Now with 100% more theme support (light mode people rejoice!)
  // ────────────────────────────────────────────────────────────────────────
  function renderUserGrowthChart(period) {
    // Check if user is in "I hate my eyes" mode (light theme)
    const gridColor = 'var(--chart-grid, rgb(var(--text-rgb) / 0.05))';
    const axisColor = 'var(--chart-axis, rgb(var(--text-rgb) / 0.2))';
    const labelColor = 'var(--chart-text, rgb(var(--text-rgb) / 0.78))';

    const { labels, values, sub } = growthData[period];
    document.getElementById('userGrowthSub').textContent = sub;
    const W = 500, H = 160, padL = 32, padR = 16, padT = 16, padB = 32;
    // Whole-number axis from 0 that always has 4 even steps. A plain Math.max() divided by zero
    // for a period with no sign-ups, and left the axis with no numbers on it at all.
    const step   = Math.max(1, Math.ceil(Math.max(...values, 1) / 4));
    const maxVal = step * 4;
    const xs = values.map((_, i) => padL + i * ((W - padL - padR) / (values.length - 1)));
    const ys = values.map(v => padT + (1 - v / maxVal) * (H - padT - padB));
    const linePath = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `L${x},${ys[i]}`)).join(' ');
    const areaPath = `${linePath} L${xs[xs.length-1]},${H-padB} L${xs[0]},${H-padB} Z`;
    const yGrids   = [0,0.25,0.5,0.75,1].map(p => ({ y: padT + (1-p)*(H-padT-padB), v: Math.round(p * maxVal) }));
    const gridLines = yGrids.map(({ y, v }) =>
      `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" style="stroke:${gridColor}" stroke-width="1"/>
       <text x="${padL - 7}" y="${y + 3.5}" text-anchor="end" style="fill:${labelColor}" font-size="9.5" font-weight="600" font-family="Plus Jakarta Sans">${v}</text>`).join('');
    const xLabels   = labels.map((m, i) => `<text x="${xs[i]}" y="${H-4}" text-anchor="middle" style="fill:${labelColor}" font-size="10" font-family="Plus Jakarta Sans">${m}</text>`).join('');
    const dots      = xs.map((x, i) => `<circle class="hsc-dot" style="--i:${i};fill:var(--primary);stroke:var(--card)" cx="${x}" cy="${ys[i]}" r="4" stroke-width="2"><title>${labels[i]}: ${values[i]} new account${values[i] === 1 ? '' : 's'}</title></circle>`).join('');
    const chartH = H - padT - padB;
    const axes = `
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" style="stroke:${axisColor}" stroke-width="2"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" style="stroke:${axisColor}" stroke-width="2"/>
    `;
    document.getElementById('userGrowthChart').setAttribute('viewBox', `0 0 ${W} ${H}`);
    document.getElementById('userGrowthChart').innerHTML = `
      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-opacity="0.25" style="stop-color:var(--primary)"/>
        <stop offset="100%" stop-opacity="0" style="stop-color:var(--primary)"/>
      </linearGradient></defs>
      ${axes}${gridLines}
      <path class="hsc-area" d="${areaPath}" fill="url(#areaGrad)"/>
      <path class="hsc-line" pathLength="1" d="${linePath}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--primary)"/>
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
  // Weekly / Daily used to be invented numbers (8 / 3 / 1 and 2 / 1 / 0). Now: the current
  // status of listings actually submitted in that window.
  const statusCounts = (list, sub) => ({
    approved: list.filter(l => l.status === 'approved').length,
    pending:  list.filter(l => l.status === 'pending').length,
    rejected: list.filter(l => l.status === 'rejected').length,
    sub,
  });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const postedSince = (since) => LISTINGS.filter(l => l.postedAt && new Date(l.postedAt) >= since);
  const listingPeriodData = {
    monthly: statusCounts(LISTINGS, 'All listings by current status'),
    weekly:  statusCounts(postedSince(new Date(Date.now() - 7 * DAY_MS)), 'Listings submitted in the last 7 days'),
    daily:   statusCounts(postedSince(todayStart), 'Listings submitted today'),
  };

  function donut(segs, total) {
    const R = 70, cx = 90, cy = 90, stroke = 28;
    const circ = 2 * Math.PI * R;
    let offset = 0;
    let shown = 0;
    const paths = segs.map(s => {
      const pct  = total ? s.count / total : 0;
      const dash = pct * circ;
      const gap  = circ - dash;
      // hsc-seg sweeps each segment in from nothing to its length, one after another
      // (chart-anim.css); the dasharray attribute is what stays if animation is off.
      const el   = dash > 0 ? `<circle class="hsc-seg" cx="${cx}" cy="${cy}" r="${R}"
        style="--i:${shown};--dash:${dash}px;--gap:${gap}px;--circ:${circ}px;stroke:${s.color}"
        fill="none" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" />` : '';
      if (dash > 0) shown++;
      offset += dash;
      return el;
    });
    return `<svg viewBox="0 0 180 180" width="180" height="180">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke-width="${stroke}" style="stroke:var(--chart-track, rgb(var(--wash-rgb) / 0.05))"/>
      ${paths.join('')}
    </svg>`;
  }


  function renderListingBreakdown(period) {
    const d    = listingPeriodData[period];
    const segs = [
      { label: 'Approved', count: d.approved, color: 'var(--primary)' },
      { label: 'Pending',  count: d.pending,  color: 'var(--warning)' },
      { label: 'Rejected', count: d.rejected, color: 'var(--danger)' },
    ];
    const t = d.approved + d.pending + d.rejected;
    document.getElementById('listingBreakdownSub').textContent = d.sub;
    const legend = segs.map((s, i) => {
      const pct = t ? Math.round(s.count / t * 100) : 0;
      return `<div class="legend-item hsc-rise" style="--i:${i + 2}">
        <div class="legend-dot" style="background:${s.color}"></div>
        <div class="legend-info"><div class="legend-name">${s.label}</div><div class="legend-count">${s.count} listing${s.count === 1 ? '' : 's'}</div></div>
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
  let reports = [...REPORTS_DATA];

  function renderReports() {
    const filtered = reportFilter === 'all'
      ? reports
      : reports.filter(r => r.status === reportFilter);

    const catLabels = { suspicious: 'Suspicious', fake: 'Fake', scam: 'Scam', misleading: 'Misleading', duplicate: 'Duplicate', other: 'Other' };

    document.getElementById('reportsTable').innerHTML = filtered.length
      ? filtered.map(r => {
          const listing    = LISTINGS.find(l => l.id === r.listingId);
          const reporter   = USERS.find(u => u.id === r.reportedBy);
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
      const listing  = LISTINGS.find(l => l.id === r.listingId);
      const reporter = USERS.find(u => u.id === r.reportedBy);
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
