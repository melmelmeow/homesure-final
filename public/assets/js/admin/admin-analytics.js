// ══════════════════════════════════════════════════════════════════════════════
// Kasafide – Admin Analytics
// Where numbers tell stories and charts look pretty
// ══════════════════════════════════════════════════════════════════════════════

(async function () {
  // ──────────────────────────────────────────────────────────────────────────
  // Auth Guard — Admins Only Beyond This Point
  // Regular users? There's the door.
  // ──────────────────────────────────────────────────────────────────────────
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'analytics' });
  KasafideTopbar.init({ placeholder: 'Search...' });
  let LISTINGS = [];
  let USERS = [];
  let REPORTS_DATA = [];
  let VIEWINGS = [];

  // Everything below adds up these rows. Load them once; RLS decides what this account may see.
  try {
    [LISTINGS, USERS, REPORTS_DATA, VIEWINGS] = await Promise.all([
      HS.listings.all(), HS.admin.users(), HS.reports.list(), HS.admin.viewingRequests(),
    ]);
  } catch (err) {
    console.error('Could not load dashboard data:', err);
    hsToast('Could not load the dashboard data. Please refresh.', 'error');
    return;
  }


  // ══════════════════════════════════════════════════════════════════════════
  // Computed Data
  // Math is happening here. Numbers go brrr.
  // ══════════════════════════════════════════════════════════════════════════
  const totalListings   = LISTINGS.length;
  const approved        = LISTINGS.filter(l => l.status === 'approved').length;
  const pending         = LISTINGS.filter(l => l.status === 'pending').length;
  const forRent         = LISTINGS.filter(l => l.listingFor === 'rent').length;
  const forSale         = LISTINGS.filter(l => l.listingFor === 'sale').length;
  const totalUsers      = USERS.filter(u => ['buyer','seller'].includes(u.role)).length;
  const totalSellers    = USERS.filter(u => u.role === 'seller').length;
  const verifiedSellers = USERS.filter(u => u.role === 'seller' && u.accountStatus === 'verified').length;
  const totalReports    = REPORTS_DATA.length;
  const approvalRate    = totalListings ? Math.round(approved / totalListings * 100) : 0;
  // Approved listings only — rejected test/junk listings shouldn't drag a "market price" around.
  const APPROVED_LISTINGS = LISTINGS.filter(l => l.status === 'approved');
  const avgPrice        = APPROVED_LISTINGS.length
    ? Math.round(APPROVED_LISTINGS.reduce((s, l) => s + (l.price || 0), 0) / APPROVED_LISTINGS.length)
    : 0;

  // ── Stat Cards ───────────────────────────────────────────────────────────────
  document.getElementById('analyticsStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon teal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div class="stat-info">
        <div class="stat-label">Total Listings</div>
        <div class="stat-value">${totalListings}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div class="stat-info">
        <div class="stat-label">Verified Sellers</div>
        <div class="stat-value">${verifiedSellers}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="stat-info">
        <div class="stat-label">Active Listings</div>
        <div class="stat-value">${approved}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon amber">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      </div>
      <div class="stat-info">
        <div class="stat-label">Reported Listings</div>
        <div class="stat-value">${totalReports}</div>
      </div>
    </div>
  `;
  // Cards rise in one after another and their numbers count up (chart-anim.css / chart-anim.js).
  const statRoot = document.getElementById('analyticsStats');
  statRoot.querySelectorAll('.stat-card').forEach((card, i) => {
    card.classList.add('hsc-rise');
    card.style.setProperty('--i', i);
    const v = card.querySelector('.stat-value');
    if (v) v.dataset.count = v.textContent.trim();
  });
  hsCountUp(statRoot);

  // ══════════════════════════════════════════════════════════════════════════
  // High-Demand Areas (Vertical Bar Chart)
  // Visualizing which barangays are the MVPs of real estate
  // Pulong Buhangin probably winning again, let's be real
  // ══════════════════════════════════════════════════════════════════════════
  // Demand = viewing requests buyers actually sent, grouped by the listing's barangay, over the
  // last 30 / 7 / 1 day(s). Listings posted per area would measure supply, not demand.
  const DAY_MS = 86400000;
  const barangayOf = {};
  LISTINGS.forEach(l => { barangayOf[l.id] = l.barangay || 'Unknown'; });

  function topAreasSince(days) {
    const cutoff = Date.now() - days * DAY_MS;
    const counts = {};
    VIEWINGS.forEach(v => {
      if (new Date(v.createdAt).getTime() < cutoff) return;
      const b = barangayOf[v.listingId];
      if (!b) return;
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }

  const demandData = {
    monthly: topAreasSince(30),
    weekly:  topAreasSince(7),
    daily:   topAreasSince(1),
  };

  // ────────────────────────────────────────────────────────────────────────
  // drawVerticalBars() — Render Bar Chart
  // Making rectangles look fancy since 2026
  // Pro tip: Light mode users exist, respect their eyeballs
  // ────────────────────────────────────────────────────────────────────────
  // Rounds only the top two corners of a bar — plain rect+rx rounds all four, which on a short
  // bar (radius comparable to its own height) reads as a pill/capsule instead of a bar. r is
  // capped by both half the bar's width and height so a short or narrow bar never gets a radius
  // bigger than it can actually show.
  function roundedTopBarPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h));
    return `M ${x},${y + r} Q ${x},${y} ${x + r},${y} L ${x + w - r},${y} Q ${x + w},${y} ${x + w},${y + r} ` +
           `L ${x + w},${y + h} L ${x},${y + h} Z`;
  }

  function drawVerticalBars(items) {
    if (!items.length) {
      document.getElementById('demandChart').innerHTML =
        '<div style="padding:60px 20px;text-align:center;color:var(--muted);font-size:13px">No viewing requests in this period yet.</div>';
      return;
    }
    // Theme-aware colors because we're not savages
    const gridColor = 'var(--chart-grid, rgb(var(--text-rgb) / 0.08))';
    const axisColor = 'var(--chart-axis, rgb(var(--text-rgb) / 0.2))';
    const textColor = 'var(--chart-text, rgb(var(--text-rgb) / 0.72))';
    const labelColor = 'var(--chart-text, rgb(var(--text-rgb) / 0.78))';

    const rawMax = Math.max(...items.map(i => i[1]), 1);
    const step   = Math.max(1, Math.ceil(rawMax / 4));
    const max    = step * 4;
    // Horizontal, readable labels instead of 6.5px text rotated -45° — that rotation pushed the
    // first bar's label far enough left that .chart-card's overflow:hidden clipped it off-screen
    // entirely, and at that size nothing was legible anyway. Wider bar pitch gives each name more
    // room now that it isn't running diagonally.
    // Fixed canvas, same as the line chart beside it. The SVG is width:100%, so a canvas sized to
    // the number of bars got scaled up to fill the card — with only 2 bars, every bar and label
    // rendered several times too large. Bars now share the fixed width instead.
    const totalW = 340, totalH = 206, padL = 36, padR = 16, padT = 20, padB = 30;
    const chartH = totalH - padT - padB;
    const slot   = (totalW - padL - padR) / items.length;
    const barW   = Math.min(36, slot * 0.55);
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const val = step * (4 - i);
      const y   = padT + Math.round(i / 4 * chartH);
      return `<line x1="${padL}" y1="${y}" x2="${totalW - padR}" y2="${y}" style="stroke:${gridColor}" stroke-width="1"/>
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10" style="fill:${textColor}" font-weight="600" font-family="Plus Jakarta Sans">${val}</text>`;
    }).join('');
    const bars = items.map(([name, val], i) => {
      const barH = Math.max(Math.round(val / max * chartH), 4);
      const x = padL + i * slot + (slot - barW) / 2;
      const y = padT + chartH - barH;
      const labelX = x + barW / 2;
      const labelY = padT + chartH + 16;
      // Names longer than the bar's own pitch would overlap their neighbors — trimmed with an
      // ellipsis rather than left to collide, same idea text-overflow would apply in CSS.
      const label = name.length > 9 ? name.slice(0, 8) + '…' : name;
      return `<path class="hsc-bar" style="--i:${i};fill:var(--primary)" d="${roundedTopBarPath(x, y, barW, barH, 6)}" opacity="0.95"><title>${name}: ${val} viewing request${val === 1 ? '' : 's'}</title></path>
        <text class="hsc-label" style="--i:${i};fill:${labelColor}" x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" font-weight="600" font-family="Plus Jakarta Sans">${label}</text>`;
    }).join('');
    const axes = `
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" style="stroke:${axisColor}" stroke-width="2"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${totalW - padR}" y2="${padT + chartH}" style="stroke:${axisColor}" stroke-width="2"/>
    `;
    document.getElementById('demandChart').innerHTML =
      `<svg viewBox="0 0 ${totalW} ${totalH}" style="width:100%;display:block;overflow:visible;padding:4px">${axes}${yLabels}${bars}</svg>`;
  }

  drawVerticalBars(demandData.monthly);

  window.setDemandPeriod = function(period, el) {
    document.querySelectorAll('#demandDropdown .period-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('demandPeriodLabel').textContent = el.textContent;
    document.getElementById('demandDropdown').classList.remove('open');
    drawVerticalBars(demandData[period]);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Search Trends (Line Chart)
  // Is it going up? Good. Down? Not good. Sideways? Interesting.
  // Chart goes brrr when numbers go up
  // ══════════════════════════════════════════════════════════════════════════
  // There's no search tracking anywhere in the database, so a "search trends" chart could only
  // ever be invented numbers. New (email-confirmed) buyer/seller accounts over time is the
  // closest real growth signal the data actually has.
  const joinDates = USERS
    .filter(u => ['buyer', 'seller'].includes(u.role) && u.joinedAt)
    .map(u => new Date(u.joinedAt + 'T00:00:00'));

  function countBetween(start, end) {
    return joinDates.filter(d => d >= start && d < end).length;
  }

  function buildTrends() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const fmtMonth = d => d.toLocaleDateString('en-PH', { month: 'short' });
    const fmtDay   = d => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

    const months = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getFullYear(), today.getMonth() - 6 + i, 1);
      const end   = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      return { label: fmtMonth(start), value: countBetween(start, end) };
    });
    const weeks = Array.from({ length: 7 }, (_, i) => {
      const end   = new Date(today.getTime() + DAY_MS - (6 - i) * 7 * DAY_MS);
      const start = new Date(end.getTime() - 7 * DAY_MS);
      return { label: fmtDay(start), value: countBetween(start, end) };
    });
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getTime() - (6 - i) * DAY_MS);
      const end   = new Date(start.getTime() + DAY_MS);
      return { label: start.toLocaleDateString('en-PH', { weekday: 'short' }), value: countBetween(start, end) };
    });

    const pack = (rows, title) => ({ labels: rows.map(r => r.label), values: rows.map(r => r.value), title });
    return {
      monthly: pack(months, 'New Accounts (Last 7 Months)'),
      weekly:  pack(weeks,  'New Accounts (Last 7 Weeks)'),
      daily:   pack(days,   'New Accounts (Last 7 Days)'),
    };
  }

  const trendsData = buildTrends();

  // ────────────────────────────────────────────────────────────────────────
  // drawLineChart() — Render Line Chart with Gradient
  // Connecting the dots, but make it smooth
  // That gradient fill? *Chef's kiss*
  // ────────────────────────────────────────────────────────────────────────
  // "Nice" axis step — 93 / 136 / 179 / 221 / 264 (a raw range/4 split) reads like nobody chose
  // those numbers on purpose. Rounds the step itself to 1/2/2.5/5/10 x a power of ten (the
  // standard d3-style "nice scale" trick), the way axis labels on an actual chart look.
  function niceStep(raw) {
    const mag  = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return niceNorm * mag;
  }

  function drawLineChart(data) {
    // Theme detection: are we in vampire mode or not?
    const gridColor = 'var(--chart-grid, rgb(var(--text-rgb) / 0.08))';
    const axisColor = 'var(--chart-axis, rgb(var(--text-rgb) / 0.2))';
    const textColor = 'var(--chart-text, rgb(var(--text-rgb) / 0.72))';
    const labelColor = 'var(--chart-text, rgb(var(--text-rgb) / 0.78))';

    const { labels, values, title } = data;
    document.getElementById('trendChartTitle').textContent = title;
    const W = 340, H = 206, pL = 36, pR = 16, pT = 20, pB = 36;
    const cW = W - pL - pR, cH = H - pT - pB;
    const rawMin = Math.min(...values), rawMax = Math.max(...values);
    // Values are whole-number counts, so a step below 1 would just produce 0.5-style ticks.
    let step = Math.max(1, niceStep((rawMax - rawMin) / 4 || 1));
    let minV = Math.floor(rawMin / step) * step;
    // floor()-ing the min can leave less than 4 steps' worth of room for rawMax — re-nice once
    // against the actual needed range rather than letting the last gridline fall short of it.
    if (minV + step * 4 < rawMax) step = Math.max(1, niceStep((rawMax - minV) / 4));
    step = Math.ceil(step);   // 2.5 is a nice step for prices, not for a count of accounts
    minV = Math.floor(rawMin / step) * step;
    const maxV = minV + step * 4;
    const toX = i => pL + (i / (labels.length - 1)) * cW;
    const toY = v => pT + (1 - (v - minV) / (maxV - minV)) * cH;
    const grid = Array.from({ length: 5 }, (_, i) => {
      const val = minV + step * (4 - i);
      const y   = toY(val);
      return `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" style="stroke:${gridColor}" stroke-width="1"/>
        <text x="${pL - 8}" y="${y + 4}" text-anchor="end" font-size="10" style="fill:${textColor}" font-weight="600" font-family="Plus Jakarta Sans">${val}</text>`;
    }).join('');
    const xLabels = labels.map((m, i) =>
      `<text x="${toX(i)}" y="${H - 8}" text-anchor="middle" font-size="10" style="fill:${labelColor}" font-weight="600" font-family="Plus Jakarta Sans">${m}</text>`
    ).join('');
    const ptArr    = values.map((v, i) => `${toX(i)},${toY(v)}`);
    const areaPath = `M ${toX(0)},${pT + cH} ` + values.map((v, i) => `L ${toX(i)},${toY(v)}`).join(' ') + ` L ${toX(values.length - 1)},${pT + cH} Z`;
    const dots     = values.map((v, i) => `<circle class="hsc-dot" style="--i:${i};fill:var(--primary);stroke:var(--card)" cx="${toX(i)}" cy="${toY(v)}" r="4.5" stroke-width="2.5"><title>${labels[i]}: ${v} new account${v === 1 ? '' : 's'}</title></circle>`).join('');
    const axes = `
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT + cH}" style="stroke:${axisColor}" stroke-width="2"/>
      <line x1="${pL}" y1="${pT + cH}" x2="${W - pR}" y2="${pT + cH}" style="stroke:${axisColor}" stroke-width="2"/>
    `;
    document.getElementById('trendsChart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;overflow:visible;padding:4px">
        <defs><linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-opacity="0.22" style="stop-color:var(--primary)"/>
          <stop offset="100%" stop-opacity="0" style="stop-color:var(--primary)"/>
        </linearGradient></defs>
        ${axes}${grid}${xLabels}
        <path class="hsc-area" d="${areaPath}" fill="url(#lineAreaGrad)"/>
        <polyline class="hsc-line" pathLength="1" points="${ptArr.join(' ')}" fill="none" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--primary)"/>
        ${dots}
      </svg>`;
  }

  drawLineChart(trendsData.monthly);

  window.setTrendsPeriod = function(period, el) {
    document.querySelectorAll('#trendsDropdown .period-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('trendsPeriodLabel').textContent = el.textContent;
    document.getElementById('trendsDropdown').classList.remove('open');
    drawLineChart(trendsData[period]);
  };

  window.togglePeriodDropdown = function(id) {
    const el = document.getElementById(id);
    const isOpen = el.classList.contains('open');
    document.querySelectorAll('.period-dropdown.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) el.classList.add('open');
  };
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.period-dropdown'))
      document.querySelectorAll('.period-dropdown.open').forEach(d => d.classList.remove('open'));
  });

  // ── Key Insights ─────────────────────────────────────────────────────────────
  // Every figure below is computed from the loaded rows — this period (last 30 days) against the
  // 30 days before it. No real "time to rent" exists in the data (nothing records when a rental
  // was actually taken), so that card is replaced by viewing requests, which are recorded.
  const now = Date.now();
  const inWindow = (iso, fromDaysAgo, toDaysAgo) => {
    const t = new Date(iso).getTime();
    return t >= now - fromDaysAgo * DAY_MS && t < now - toDaysAgo * DAY_MS;
  };
  const avgOf = arr => arr.length ? Math.round(arr.reduce((s, l) => s + (l.price || 0), 0) / arr.length) : null;

  function changeText(cur, prev) {
    if (cur === null || prev === null) return { text: 'Not enough data to compare yet', positive: false };
    if (prev === 0) return cur > 0 ? { text: 'New in the last 30 days', positive: true } : { text: 'No activity yet', positive: false };
    const pct = Math.round((cur - prev) / prev * 100);
    return { text: `${pct >= 0 ? '+' : ''}${pct}% vs previous 30 days`, positive: pct >= 0 };
  }

  const priceNow  = avgOf(APPROVED_LISTINGS.filter(l => l.postedAt && inWindow(l.postedAt, 30, 0)));
  const pricePrev = avgOf(APPROVED_LISTINGS.filter(l => l.postedAt && inWindow(l.postedAt, 60, 30)));
  const priceChange = changeText(priceNow, pricePrev);

  const viewsNow  = VIEWINGS.filter(v => inWindow(v.createdAt, 30, 0)).length;
  const viewsPrev = VIEWINGS.filter(v => inWindow(v.createdAt, 60, 30)).length;
  const viewsChange = changeText(viewsNow, viewsPrev);

  const kiItems = [
    {
      label: 'Average Listing Price',
      value: `₱${avgPrice.toLocaleString()}`,
      change: priceChange.text,
      positive: priceChange.positive,
    },
    {
      label: 'Viewing Requests (30 days)',
      value: `${viewsNow}`,
      change: viewsChange.text,
      positive: viewsChange.positive,
    },
    {
      label: 'Listing Approval Rate',
      value: `${approvalRate}%`,
      change: `${approved} of ${totalListings} listings approved`,
      positive: approvalRate >= 70,
    },
  ];

  document.getElementById('keyInsights').innerHTML = kiItems.map((k, i) => `
    <div class="ki-card hsc-rise" style="--i:${i + 3}">
      <div class="ki-label">${k.label}</div>
      <div class="ki-value">${k.value}</div>
      <div class="ki-change ${k.positive ? 'positive' : 'neutral'}">${k.change}</div>
    </div>`).join('');

  // ── Barangay Table ───────────────────────────────────────────────────────────
  // Only listings that are live or awaiting review — the same ones the Approved/Pending columns
  // count, so each row's total actually adds up. Rejected and draft listings never reach the
  // marketplace (and old rejected ones often have no barangay at all, which showed as a blank row).
  const AREA_LISTINGS = LISTINGS.filter(l => l.status === 'approved' || l.status === 'pending');
  const barangays = [...new Set(AREA_LISTINGS.map(l => l.barangay || 'Not set'))].sort();
  document.getElementById('barangayTable').innerHTML = barangays.length ? barangays.map(b => {
    const bl = AREA_LISTINGS.filter(l => (l.barangay || 'Not set') === b);
    const total    = bl.length;
    const approvedB = bl.filter(l => l.status === 'approved').length;
    const pendingB  = bl.filter(l => l.status === 'pending').length;
    const rentB     = bl.filter(l => l.listingFor === 'rent').length;
    const saleB     = bl.filter(l => l.listingFor === 'sale').length;
    return `<tr>
      <td><strong>${b}</strong></td>
      <td>${total}</td>
      <td>${rentB}</td>
      <td>${saleB}</td>
      <td><span class="badge approved">${approvedB}</span></td>
      <td><span class="badge pending">${pendingB}</span></td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">No approved or pending listings yet.</td></tr>';

  // ── Export CSV ───────────────────────────────────────────────────────────────
  window.exportCSV = function () {
    const headers = ['ID','Title','Type','For','Barangay','Price','Status','Seller','Posted'];
    const rows = LISTINGS.map(l => {
      const seller = USERS.find(u => u.id === l.sellerId);
      return [l.id, `"${l.title}"`, l.type, l.listingFor, l.barangay, l.price,
        l.status, seller ? `"${seller.firstName} ${seller.lastName}"` : 'Unknown', l.postedAt].join(',');
    });
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'kasafide-listings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export JSON ──────────────────────────────────────────────────────────────
  window.exportJSON = function () {
    const data = {
      exportedAt: new Date().toISOString(),
      summary: { totalListings, approved, pending, forRent, forSale, totalUsers, totalSellers, verifiedSellers },
      listings: LISTINGS,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'kasafide-analytics.json'; a.click();
    URL.revokeObjectURL(url);
  };

})();

