// FILE: assets/js/buyer/buyer-payments.js
// HomeSure – Buyer Payments

(function () {
  const user = getSession();
  if (!user || user.role !== 'buyer') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'payments' });
  HomeSureTopbar.init({ placeholder: 'My Payments' });

  // ── Fake Data ─────────────────────────────────────────────────────────────────
  const PAYMENTS = [
    {
      id: 'PAY-001', listingTitle: '2BR Apartment — Poblacion', amount: 15000,
      paymentType: 'rent', dueDate: '2026-06-01', paidDate: '2026-05-28', status: 'pending_confirmation',
      method: 'GCash', reference: 'GC-78452', period: 'June 2026'
    },
    {
      id: 'PAY-004', listingTitle: '1-Bedroom Condo Unit — BGC', amount: 25000,
      paymentType: 'both', dueDate: '2026-07-01', paidDate: null, status: 'pending',
      method: null, reference: null, period: 'July 2026'
    },
    {
      id: 'PAY-005', listingTitle: 'Studio Apartment — Makati', amount: 12000,
      paymentType: 'rent', dueDate: '2026-07-05', paidDate: null, status: 'pending',
      method: null, reference: null, period: 'July 2026'
    },
    {
      id: 'PAY-006', listingTitle: 'Commercial Space — Ortigas', amount: 40000,
      paymentType: 'security', dueDate: '2026-06-15', paidDate: null, status: 'pending',
      method: null, reference: null, period: 'June 2026'
    },
    {
      id: 'PAY-002', listingTitle: '2BR Apartment — Poblacion', amount: 15000,
      paymentType: 'rent', dueDate: '2026-05-01', paidDate: '2026-04-29', status: 'confirmed',
      method: 'GCash', reference: 'GC-54321', period: 'May 2026'
    },
    {
      id: 'PAY-003', listingTitle: '2BR Apartment — Poblacion', amount: 15000,
      paymentType: 'security', dueDate: '2026-04-01', paidDate: '2026-03-30', status: 'confirmed',
      method: 'Bank Transfer', reference: 'BT-22100', period: 'April 2026'
    },
  ];

  const DEPOSIT = {
    amount: 30000,
    deductions: [
      { reason: 'Broken cabinet door', cost: 2500, date: '2026-05-15' }
    ],
    status: 'active'
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function fmtMoney(n) {
    return '₱' + Number(n).toLocaleString('en-PH');
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatPaymentType(type) {
    const typeMap = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security + Rent'
    };
    return typeMap[type] || 'Payment';
  }

  function fmtShortDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function statusBadge(status) {
    const map = {
      confirmed: { cls: 'badge-confirmed', label: 'Confirmed' },
      pending_confirmation: { cls: 'badge-pending', label: 'Pending Confirmation' },
      pending: { cls: 'badge-pending', label: 'Pending' },
      overdue: { cls: 'badge-overdue', label: 'Overdue' },
    };
    const s = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  }

  // ── Render Stat Cards ─────────────────────────────────────────────────────────
  function renderStats() {
    const totalDeductions = DEPOSIT.deductions.reduce((s, d) => s + d.cost, 0);
    const refundable = DEPOSIT.amount - totalDeductions;
    const paidThisMonth = PAYMENTS
      .filter(p => p.status === 'confirmed' && p.paidDate && p.paidDate.startsWith('2026-04'))
      .reduce((s, p) => s + p.amount, 0);

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div class="stat-label">Next Due</div>
        <div class="stat-value">${fmtMoney(15000)}</div>
        <div class="stat-hint">Due on Jun 1, 2026</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-label">Paid This Month</div>
        <div class="stat-value">${fmtMoney(15000)}</div>
        <div class="stat-hint">May 2026</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-label">Security Deposit</div>
        <div class="stat-value">${fmtMoney(DEPOSIT.amount)}</div>
        <div class="stat-hint">Held by landlord</div>
      </div>
    `;
  }

  // ── Render Upcoming Tab ───────────────────────────────────────────────────────
  function renderUpcoming() {
    const upcoming = PAYMENTS.filter(p => p.status === 'pending_confirmation' || p.status === 'pending');
    const container = document.getElementById('upcomingContainer');

    if (!upcoming.length) {
      container.innerHTML = `<div class="pay-card-empty">No upcoming payments. You are all caught up!</div>`;
      return;
    }

    container.innerHTML = upcoming.map(p => `
      <div class="pay-card">
        <div class="pay-card-left">
          <div class="pay-card-property">${p.listingTitle}</div>
          <div class="pay-card-meta">
            <div class="pay-card-item">
              <span class="pay-card-item-label">Type</span>
              <span class="pay-card-item-value" style="font-weight:700;color:#00c9a7;">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Period</span>
              <span class="pay-card-item-value">${p.period}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Due Date</span>
              <span class="pay-card-item-value">${fmtDate(p.dueDate)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Method</span>
              <span class="pay-card-item-value">${p.method}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Reference</span>
              <span class="pay-card-item-value">${p.reference}</span>
            </div>
          </div>
        </div>
        <div class="pay-card-right">
          <div class="pay-card-amount">${fmtMoney(p.amount)}</div>
          ${statusBadge(p.status)}
        </div>
      </div>
    `).join('');
  }

  // ── Render History Tab ────────────────────────────────────────────────────────
  function renderHistory() {
    const q = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
    const all = PAYMENTS.filter(p => p.status === 'confirmed' || p.status === 'pending_confirmation');
    const filtered = q
      ? all.filter(p =>
          p.period.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q)
        )
      : all;

    const container = document.getElementById('historyContainer');
    if (!filtered.length) {
      container.innerHTML = `<div class="pay-card-empty">No payment records found.</div>`;
      return;
    }

    container.innerHTML = filtered.map(p => `
      <div class="pay-card">
        <div class="pay-card-left">
          <div class="pay-card-property">${p.listingTitle}</div>
          <div class="pay-card-meta">
            <div class="pay-card-item">
              <span class="pay-card-item-label">Type</span>
              <span class="pay-card-item-value" style="font-weight:700;color:#00c9a7;">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Period</span>
              <span class="pay-card-item-value">${p.period}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Paid Date</span>
              <span class="pay-card-item-value">${fmtDate(p.paidDate)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Method</span>
              <span class="pay-card-item-value">${p.method}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Reference</span>
              <span class="pay-card-item-value">${p.reference}</span>
            </div>
          </div>
        </div>
        <div class="pay-card-right">
          <div class="pay-card-amount">${fmtMoney(p.amount)}</div>
          ${statusBadge(p.status)}
        </div>
      </div>
    `).join('');
  }

  // ── Render Deposit Tab ────────────────────────────────────────────────────────
  function renderDeposit() {
    const container = document.getElementById('depositContainer');
    const totalDeductions = DEPOSIT.deductions.reduce((s, d) => s + d.cost, 0);
    const refundable = DEPOSIT.amount - totalDeductions;
    const pct = Math.round((refundable / DEPOSIT.amount) * 100);

    const deductionItems = DEPOSIT.deductions.length
      ? DEPOSIT.deductions.map(d => `
          <div class="deduction-item">
            <div class="deduction-info">
              <span class="deduction-reason">${d.reason}</span>
              <span class="deduction-date">${fmtDate(d.date)}</span>
            </div>
            <span class="deduction-cost">−${fmtMoney(d.cost)}</span>
          </div>
        `).join('')
      : `<div class="deduction-empty">No deductions have been filed.</div>`;

    container.innerHTML = `
      <div class="deposit-card">
        <div class="deposit-card-header">
          <span class="deposit-card-title">Security Deposit — 2BR Apartment, Poblacion</span>
          <span class="deposit-card-status">Active</span>
        </div>
        <div class="deposit-body">
          <div class="deposit-row">
            <div class="deposit-item">
              <span class="deposit-item-label">Total Deposit</span>
              <span class="deposit-item-value">${fmtMoney(DEPOSIT.amount)}</span>
            </div>
            <div class="deposit-item">
              <span class="deposit-item-label">Total Deductions</span>
              <span class="deposit-item-value red">−${fmtMoney(totalDeductions)}</span>
            </div>
            <div class="deposit-item">
              <span class="deposit-item-label">Refundable Balance</span>
              <span class="deposit-item-value teal">${fmtMoney(refundable)}</span>
            </div>
          </div>
          <div class="progress-wrap">
            <div class="progress-label-row">
              <span>Refundable</span>
              <span>${pct}% of deposit</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="deduction-section">
          <div class="deduction-title">Damage Deductions</div>
          <div class="deduction-list">${deductionItems}</div>
        </div>
      </div>
    `;
  }

  // ── Tab Switching ─────────────────────────────────────────────────────────────
  window.switchTab = function (tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(el => {
      el.style.display = el.id === 'tab-' + tab ? '' : 'none';
    });
    if (tab === 'history') renderHistory();
    if (tab === 'deposit') renderDeposit();
  };

  // ── Mock payment state machine ────────────────────────────────────────────────
  let selectedPaymentType = null; // 'platform' or 'manual'
  let selectedMethod = null;
  let proofFileName  = null;

  // Open modal — show payment type selection first
  window.openPayModal = function () {
    selectedPaymentType = null;
    selectedMethod = null;
    proofFileName  = null;
    goToStep(0);
    document.getElementById('proofLabel').textContent = 'Click to attach screenshot or photo';
    document.getElementById('payModal').style.display = 'flex';
  };

  window.closePayModal = function () {
    document.getElementById('payModal').style.display = 'none';
  };

  // Step 0 → 1a or 1b based on payment type
  window.selectPaymentType = function (type) {
    selectedPaymentType = type;
    if (type === 'platform') {
      goToStep('1a');
    } else if (type === 'manual') {
      goToStep('1b');
    }
  };

  // Platform payment method selected (simulate QRPH)
  window.selectPlatformMethod = function (method) {
    // Simulate payment gateway redirect
    showToast('In production, you would be redirected to secure QRPH payment page...');
    setTimeout(() => {
      showToast('Payment of ₱15,390 completed successfully! (Demo)');
      closePayModal();
      // In real app, this would trigger after actual payment
      renderStats();
      renderUpcoming();
    }, 2000);
  };

  // Manual payment method selected
  window.selectManualMethod = function (method) {
    selectedMethod = method;
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.method-check').forEach(c => c.style.opacity = '0');
    document.getElementById('card-' + method).classList.add('selected');
    document.getElementById('check-' + method).style.opacity = '1';
    document.getElementById('proceedManualBtn').disabled = false;
  };

  // Go to proof upload step
  window.goToProofStep = function () {
    if (!selectedMethod) return;
    const labels = {
      gcash:'GCash',
      maya:'Maya',
      bpi:'BPI Bank Transfer',
      cash:'Cash'
    };
    document.getElementById('chosenMethodLabel').textContent = labels[selectedMethod] || selectedMethod;
    goToStep(2);
  };

  // Navigate between steps
  function goToStep(step) {
    document.getElementById('payStep0').style.display = step === 0 ? '' : 'none';
    document.getElementById('payStep1a').style.display = step === '1a' ? '' : 'none';
    document.getElementById('payStep1b').style.display = step === '1b' ? '' : 'none';
    document.getElementById('payStep2').style.display = step === 2 ? '' : 'none';
  }
  window.goToStep = goToStep; // Expose for onclick handlers

  window.onProofSelect = function (e) {
    proofFileName = e.target.files[0]?.name || null;
    document.getElementById('proofLabel').textContent = proofFileName || 'Click to attach screenshot or photo';
    document.getElementById('submitPayBtn').disabled = !proofFileName;
  };

  // Step 3 — submit (mock: sets status to pending_confirmation)
  window.submitPayment = function (e) {
    e.preventDefault();
    if (!selectedMethod || !proofFileName) return;

    const methodLabels = { gcash:'GCash', maya:'Maya', bpi:'BPI Bank Transfer', instapay:'InstaPay' };
    const ref = 'REF-' + Math.random().toString(36).slice(2,9).toUpperCase();

    PAYMENTS.unshift({
      id: 'PAY-' + Date.now(),
      listingTitle: '2BR Apartment — Poblacion',
      amount: 15000,
      dueDate: '2026-07-01',
      paidDate: new Date().toISOString().split('T')[0],
      status: 'pending_confirmation',
      method: methodLabels[selectedMethod],
      reference: ref,
      period: 'June 2026',
      proofFile: proofFileName,
    });

    closePayModal();
    renderUpcoming();
    renderHistory();
    showToast('Proof of payment submitted. Awaiting seller confirmation.');
  };

  // ── Toast ─────────────────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PROPERTY SELECTOR MODAL
  // ══════════════════════════════════════════════════════════════════════════════

  function initPropertySelector() {
    if (document.getElementById('propertySelectorBackdrop')) return;

    const html = `
      <div class="property-selector-backdrop" id="propertySelectorBackdrop">
        <div class="property-selector-modal">
          <div class="property-selector-header">
            <div>
              <div class="property-selector-title">Select Property to Pay</div>
              <div class="property-selector-subtitle">Choose which payment you want to make</div>
            </div>
            <button class="property-selector-close" onclick="closePropertySelector()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="property-selector-body" id="propertySelectorBody"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Close on backdrop click
    document.getElementById('propertySelectorBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'propertySelectorBackdrop') {
        closePropertySelector();
      }
    });
  }

  window.openPropertySelector = function() {
    initPropertySelector();

    const upcoming = PAYMENTS.filter(p => p.status === 'pending' || p.status === 'pending_confirmation');
    const container = document.getElementById('propertySelectorBody');

    if (!upcoming.length) {
      container.innerHTML = `
        <div class="property-selector-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div class="property-selector-empty-title">All Caught Up!</div>
          <div class="property-selector-empty-text">You have no pending payments at this time.</div>
        </div>
      `;
    } else {
      container.innerHTML = upcoming.map((p, index) => `
        <div class="property-selector-card" onclick="selectPropertyToPay(${index})">
          <div class="property-card-header">
            <div style="flex:1;">
              <div class="property-card-title">${p.listingTitle}</div>
              <span class="property-card-type">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="property-card-amount">${fmtMoney(p.amount)}</div>
          </div>
          <div class="property-card-meta">
            <div class="property-card-item">
              <span class="property-card-item-label">Period</span>
              <span class="property-card-item-value">${p.period}</span>
            </div>
            <div class="property-card-item">
              <span class="property-card-item-label">Due Date</span>
              <span class="property-card-item-value">${fmtDate(p.dueDate)}</span>
            </div>
          </div>
          <div class="property-card-footer">
            <div class="property-card-status">
              ${p.status === 'pending_confirmation' ? 'Awaiting confirmation' : 'Payment pending'}
            </div>
            <div class="property-card-arrow">→</div>
          </div>
        </div>
      `).join('');
    }

    document.getElementById('propertySelectorBackdrop').classList.add('active');
  };

  window.closePropertySelector = function() {
    document.getElementById('propertySelectorBackdrop')?.classList.remove('active');
  };

  window.selectPropertyToPay = function(index) {
    const upcoming = PAYMENTS.filter(p => p.status === 'pending' || p.status === 'pending_confirmation');
    const payment = upcoming[index];

    if (!payment) return;

    // Close property selector
    closePropertySelector();

    // Open QRPH payment modal with selected property details
    setTimeout(() => {
      PaymentIntegration.openPaymentModal({
        amount: payment.amount,
        listingTitle: payment.listingTitle,
        listingId: 'prop-001', // Would be real ID in production
        landlordId: 'usr-003', // Would be real ID in production
        period: payment.period,
        paymentType: payment.paymentType,
        dueDate: payment.dueDate,
        onSuccess: function(transaction) {
          // Refresh the page to show new payment
          setTimeout(() => {
            location.reload();
          }, 2000);
        }
      });
    }, 300);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW PAYMENT INTEGRATION (QRPH Demo)
  // ══════════════════════════════════════════════════════════════════════════════

  window.payNowWithQRPH = function() {
    // Open property selector first
    openPropertySelector();
  };

  // ── Init ──────────────────────────────────────────────────────────────────────
  renderStats();
  renderUpcoming();
})();
