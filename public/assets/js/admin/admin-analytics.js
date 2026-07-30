// ══════════════════════════════════════════════════════════════════════════════
// HomeSure – Admin Analytics
// Where numbers tell stories and charts look pretty
// ══════════════════════════════════════════════════════════════════════════════

(function () {
  // ──────────────────────────────────────────────────────────────────────────
  // Auth Guard — Admins Only Beyond This Point
  // Regular users? There's the door.
  // ──────────────────────────────────────────────────────────────────────────
  const user = getSession();
  if (!user || user.role !== 'admin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'analytics' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  // ══════════════════════════════════════════════════════════════════════════
  // Computed Data
  // Math is happening here. Numbers go brrr.
  // ══════════════════════════════════════════════════════════════════════════
  const totalListings   = FAKE_LISTINGS.length;
  const approved        = FAKE_LISTINGS.filter(l => l.status === 'approved').length;
  const pending         = FAKE_LISTINGS.filter(l => l.status === 'pending').length;
  const forRent         = FAKE_LISTINGS.filter(l => l.listingFor === 'rent').length;
  const forSale         = FAKE_LISTINGS.filter(l => l.listingFor === 'sale').length;
  const totalUsers      = FAKE_USERS.filter(u => ['buyer','seller'].includes(u.role)).length;
  const totalSellers    = FAKE_USERS.filter(u => u.role === 'seller').length;
  const verifiedSellers = FAKE_USERS.filter(u => u.role === 'seller' && u.accountStatus === 'verified').length;
  const totalReports    = typeof FAKE_REPORTS !== 'undefined' ? FAKE_REPORTS.length : 8;
  const approvalRate    = totalListings ? Math.round(approved / totalListings * 100) : 0;
  const avgPrice        = FAKE_LISTINGS.length
    ? Math.round(FAKE_LISTINGS.reduce((s, l) => s + (l.price || 0), 0) / FAKE_LISTINGS.length)
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

  // ══════════════════════════════════════════════════════════════════════════
  // High-Demand Areas (Vertical Bar Chart)
  // Visualizing which barangays are the MVPs of real estate
  // Pulong Buhangin probably winning again, let's be real
  // ══════════════════════════════════════════════════════════════════════════
  const barangayCounts = {};
  FAKE_LISTINGS.forEach(l => { barangayCounts[l.barangay] = (barangayCounts[l.barangay] || 0) + 1; });
  const topAreasMonthly = Object.entries(barangayCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const demandData = {
    monthly: topAreasMonthly,
    weekly:  [['Pulong',3],['San Isidro',2],['Bagbaguin',2],['Balasing',1],['Poblacion',1],['Tumana',1]],
    daily:   [['Pulong',4],['San Isidro',1],['Bagbaguin',0],['Balasing',1],['Poblacion',0],['Tumana',1]],
  };

  // ────────────────────────────────────────────────────────────────────────
  // drawVerticalBars() — Render Bar Chart
  // Making rectangles look fancy since 2026
  // Pro tip: Light mode users exist, respect their eyeballs
  // ────────────────────────────────────────────────────────────────────────
  function drawVerticalBars(items) {
    // Theme-aware colors because we're not savages
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const axisColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const textColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
    const labelColor = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)';

    const rawMax = Math.max(...items.map(i => i[1]), 1);
    const step   = Math.max(1, Math.ceil(rawMax / 4));
    const max    = step * 4;
    const chartH = 150, barW = 32, gap = 18, padL = 36, padT = 20, totalW = padL + items.length * (barW + gap) - gap + 16, totalH = padT + chartH + 36;
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const val = step * (4 - i);
      const y   = padT + Math.round(i / 4 * chartH);
      return `<line x1="${padL}" y1="${y}" x2="${totalW - 8}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="${textColor}" font-weight="600" font-family="Plus Jakarta Sans">${val}</text>`;
    }).join('');
    const bars = items.map(([name, val], i) => {
      const barH = Math.max(Math.round(val / max * chartH), 4);
      const x = padL + i * (barW + gap);
      const y = padT + chartH - barH;
      const labelX = x + barW / 2;
      const labelY = padT + chartH + 12;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="6" fill="#00c9a7" opacity="0.95"/>
        <text x="${labelX}" y="${labelY}" text-anchor="end" font-size="6.5" fill="${labelColor}" font-weight="500" font-family="Plus Jakarta Sans" transform="rotate(-45 ${labelX} ${labelY})">${name}</text>`;
    }).join('');
    const axes = `
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="${axisColor}" stroke-width="2"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${totalW - 8}" y2="${padT + chartH}" stroke="${axisColor}" stroke-width="2"/>
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
  const trendsData = {
    monthly: { labels: ['Aug','Sep','Oct','Nov','Dec','Jan','Feb'], values: [110,128,142,158,175,204,240], title: 'Search Trends (Last 7 Months)' },
    weekly:  { labels: ['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7'], values: [38,42,39,50,47,55,61], title: 'Search Trends (Last 7 Weeks)' },
    daily:   { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [18,22,19,28,25,20,16], title: 'Search Trends (Last 7 Days)' },
  };

  // ────────────────────────────────────────────────────────────────────────
  // drawLineChart() — Render Line Chart with Gradient
  // Connecting the dots, but make it smooth
  // That gradient fill? *Chef's kiss*
  // ────────────────────────────────────────────────────────────────────────
  function drawLineChart(data) {
    // Theme detection: are we in vampire mode or not?
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const axisColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const textColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
    const labelColor = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)';

    const { labels, values, title } = data;
    document.getElementById('trendChartTitle').textContent = title;
    const W = 340, H = 206, pL = 36, pR = 16, pT = 20, pB = 36;
    const cW = W - pL - pR, cH = H - pT - pB;
    const minV = Math.floor(Math.min(...values) * 0.85);
    const maxV = Math.ceil(Math.max(...values) * 1.1);
    const toX = i => pL + (i / (labels.length - 1)) * cW;
    const toY = v => pT + (1 - (v - minV) / (maxV - minV)) * cH;
    const grid = Array.from({ length: 5 }, (_, i) => {
      const val = Math.round(minV + (maxV - minV) * i / 4);
      const y   = toY(val);
      return `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>
        <text x="${pL - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="${textColor}" font-weight="600" font-family="Plus Jakarta Sans">${val}</text>`;
    }).join('');
    const xLabels = labels.map((m, i) =>
      `<text x="${toX(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="${labelColor}" font-weight="600" font-family="Plus Jakarta Sans">${m}</text>`
    ).join('');
    const ptArr    = values.map((v, i) => `${toX(i)},${toY(v)}`);
    const areaPath = `M ${toX(0)},${pT + cH} ` + values.map((v, i) => `L ${toX(i)},${toY(v)}`).join(' ') + ` L ${toX(values.length - 1)},${pT + cH} Z`;
    const dots     = values.map((v, i) => `<circle cx="${toX(i)}" cy="${toY(v)}" r="4.5" fill="#00c9a7" stroke="var(--card)" stroke-width="2.5"/>`).join('');
    const axes = `
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT + cH}" stroke="${axisColor}" stroke-width="2"/>
      <line x1="${pL}" y1="${pT + cH}" x2="${W - pR}" y2="${pT + cH}" stroke="${axisColor}" stroke-width="2"/>
    `;
    document.getElementById('trendsChart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;overflow:visible;padding:4px">
        <defs><linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00c9a7" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#00c9a7" stop-opacity="0"/>
        </linearGradient></defs>
        ${axes}${grid}${xLabels}
        <path d="${areaPath}" fill="url(#lineAreaGrad)"/>
        <polyline points="${ptArr.join(' ')}" fill="none" stroke="#00c9a7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
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
  const avgRentDays = 12; // simulated
  const kiItems = [
    {
      label: 'Average Listing Price',
      value: `₱${avgPrice.toLocaleString()}`,
      change: '+5.2% from last month',
      positive: true,
    },
    {
      label: 'Avg. Time to Rent',
      value: `${avgRentDays} days`,
      change: '+13% faster',
      positive: true,
    },
    {
      label: 'Listing Approval Rate',
      value: `${approvalRate}%`,
      change: approvalRate >= 70 ? '+Healthy pipeline' : 'Review pending items',
      positive: approvalRate >= 70,
    },
  ];

  document.getElementById('keyInsights').innerHTML = kiItems.map(k => `
    <div class="ki-card">
      <div class="ki-label">${k.label}</div>
      <div class="ki-value">${k.value}</div>
      <div class="ki-change ${k.positive ? 'positive' : 'neutral'}">${k.change}</div>
    </div>`).join('');

  // ── Barangay Table ───────────────────────────────────────────────────────────
  const barangays = [...new Set(FAKE_LISTINGS.map(l => l.barangay))].sort();
  document.getElementById('barangayTable').innerHTML = barangays.map(b => {
    const bl = FAKE_LISTINGS.filter(l => l.barangay === b);
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
  }).join('');

  // ── Export CSV ───────────────────────────────────────────────────────────────
  window.exportCSV = function () {
    const headers = ['ID','Title','Type','For','Barangay','Price','Status','Seller','Posted'];
    const rows = FAKE_LISTINGS.map(l => {
      const seller = FAKE_USERS.find(u => u.id === l.sellerId);
      return [l.id, `"${l.title}"`, l.type, l.listingFor, l.barangay, l.price,
        l.status, seller ? `"${seller.firstName} ${seller.lastName}"` : 'Unknown', l.postedAt].join(',');
    });
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'homesure-listings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export JSON ──────────────────────────────────────────────────────────────
  window.exportJSON = function () {
    const data = {
      exportedAt: new Date().toISOString(),
      summary: { totalListings, approved, pending, forRent, forSale, totalUsers, totalSellers, verifiedSellers },
      listings: FAKE_LISTINGS,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'homesure-analytics.json'; a.click();
    URL.revokeObjectURL(url);
  };

})();
