// FILE: assets/js/buyer/buyer-payments.js
// Kasafide – Buyer Payments
//
// Every row here comes from the payments and security_deposits tables. RLS is what limits them to
// this buyer, so there is no user filter to get wrong.

(async function () {
  const user = getSession();
  if (!user || user.role !== 'buyer') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'payments' });
  KasafideTopbar.init({ placeholder: 'My Payments' });

  let PAYMENTS = [];
  let DEPOSITS = [];

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtMoney(n) {
    if (n === null || n === undefined || n === '') return '—';
    return '₱' + Number(n).toLocaleString('en-PH');
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(String(d).slice(0, 10) + 'T00:00:00')
      .toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatPaymentType(type) {
    const typeMap = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security + Rent',
      reservation: 'Reservation Fee',
      sale: 'Purchase',
    };
    return typeMap[type] || 'Payment';
  }

  function statusBadge(status) {
    const map = {
      confirmed: { cls: 'badge-confirmed', label: 'Confirmed' },
      pending_confirmation: { cls: 'badge-pending', label: 'Pending Confirmation' },
      pending: { cls: 'badge-pending', label: 'Pending' },
      rejected: { cls: 'badge-overdue', label: 'Rejected' },
      overdue: { cls: 'badge-overdue', label: 'Overdue' },
    };
    const s = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${s.cls}">${esc(s.label)}</span>`;
  }

  // A payment is overdue when its due date has passed and nothing has been received. The database
  // has no 'overdue' status — it is a fact about today, so it is worked out here.
  function displayStatus(p) {
    if (p.status === 'pending' && p.dueDate && p.dueDate < today()) return 'overdue';
    return p.status;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  const isOpen = (p) => p.status === 'pending' || p.status === 'pending_confirmation' || p.status === 'rejected';
  const isSettled = (p) => p.status === 'confirmed' || p.status === 'pending_confirmation';

  // ── Load ──────────────────────────────────────────────────────────────────────
  async function load() {
    const results = await Promise.allSettled([HS.payments.mine(), HS.deposits.list()]);

    if (results[0].status === 'fulfilled') {
      PAYMENTS = results[0].value;
    } else {
      console.error('Could not load payments:', results[0].reason);
      showToast('Could not load your payments. Please refresh.');
    }

    // A buyer with no deposit yet is normal, so a failure here must not hide the payments.
    if (results[1].status === 'fulfilled') {
      DEPOSITS = results[1].value.filter((d) => d.buyerId === user.id);
    } else {
      console.error('Could not load deposits:', results[1].reason);
    }
  }

  // ── Render Stat Cards ─────────────────────────────────────────────────────────
  function renderStats() {
    const open = PAYMENTS.filter((p) => p.status === 'pending')
      .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
    const next = open[0] || null;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const paidThisMonth = PAYMENTS
      .filter((p) => p.status === 'confirmed' && p.paidDate && p.paidDate.startsWith(thisMonth))
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const depositHeld = DEPOSITS
      .filter((d) => d.status === 'held' || d.status === 'partially_refunded')
      .reduce((s, d) => s + d.amount, 0);

    const monthLabel = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div class="stat-label">Next Due</div>
        <div class="stat-value">${next ? fmtMoney(next.amount) : '—'}</div>
        <div class="stat-hint">${next && next.dueDate ? 'Due on ' + fmtDate(next.dueDate) : 'Nothing due'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-label">Paid This Month</div>
        <div class="stat-value">${fmtMoney(paidThisMonth)}</div>
        <div class="stat-hint">${esc(monthLabel)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-label">Security Deposit</div>
        <div class="stat-value">${fmtMoney(depositHeld)}</div>
        <div class="stat-hint">${depositHeld ? 'Held by landlord' : 'None on record'}</div>
      </div>
    `;
  }

  // ── Render Upcoming Tab ───────────────────────────────────────────────────────
  function renderUpcoming() {
    const upcoming = PAYMENTS.filter(isOpen)
      .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
    const container = document.getElementById('upcomingContainer');

    if (!upcoming.length) {
      container.innerHTML = `<div class="pay-card-empty">No upcoming payments. You are all caught up!</div>`;
      return;
    }

    container.innerHTML = upcoming.map((p) => `
      <div class="pay-card">
        <div class="pay-card-left">
          <div class="pay-card-property">${esc(p.listingTitle)}</div>
          <div class="pay-card-meta">
            <div class="pay-card-item">
              <span class="pay-card-item-label">Type</span>
              <span class="pay-card-item-value" style="font-weight:700;color:var(--primary);">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Period</span>
              <span class="pay-card-item-value">${esc(p.period) || '—'}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Due Date</span>
              <span class="pay-card-item-value">${fmtDate(p.dueDate)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Method</span>
              <span class="pay-card-item-value">${esc(p.method) || '—'}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Reference</span>
              <span class="pay-card-item-value">${esc(p.reference) || '—'}</span>
            </div>
          </div>
          ${p.status === 'rejected' && p.rejectionReason
            ? `<div class="pay-card-item-label" style="margin-top:8px;color:var(--danger);">
                 Your landlord rejected this: ${esc(p.rejectionReason)}
               </div>`
            : ''}
        </div>
        <div class="pay-card-right">
          <div class="pay-card-amount">${fmtMoney(p.amount)}</div>
          ${statusBadge(displayStatus(p))}
        </div>
      </div>
    `).join('');
  }

  // ── Render History Tab ────────────────────────────────────────────────────────
  function renderHistory() {
    const q = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
    const all = PAYMENTS.filter(isSettled);
    const filtered = q
      ? all.filter((p) =>
          String(p.period || '').toLowerCase().includes(q) ||
          String(p.method || '').toLowerCase().includes(q) ||
          String(p.reference || '').toLowerCase().includes(q) ||
          String(p.listingTitle || '').toLowerCase().includes(q)
        )
      : all;

    const container = document.getElementById('historyContainer');
    if (!filtered.length) {
      container.innerHTML = `<div class="pay-card-empty">No payment records found.</div>`;
      return;
    }

    container.innerHTML = filtered.map((p) => `
      <div class="pay-card">
        <div class="pay-card-left">
          <div class="pay-card-property">${esc(p.listingTitle)}</div>
          <div class="pay-card-meta">
            <div class="pay-card-item">
              <span class="pay-card-item-label">Type</span>
              <span class="pay-card-item-value" style="font-weight:700;color:var(--primary);">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Period</span>
              <span class="pay-card-item-value">${esc(p.period) || '—'}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Paid Date</span>
              <span class="pay-card-item-value">${fmtDate(p.paidDate)}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Method</span>
              <span class="pay-card-item-value">${esc(p.method) || '—'}</span>
            </div>
            <div class="pay-card-item">
              <span class="pay-card-item-label">Reference</span>
              <span class="pay-card-item-value">${esc(p.reference) || '—'}</span>
            </div>
          </div>
          ${p.proofPath
            ? `<button class="btn-ghost" style="margin-top:8px;padding:6px 12px;font-size:12px;"
                       onclick="viewProof('${esc(p.id)}')">View my proof</button>`
            : ''}
        </div>
        <div class="pay-card-right">
          <div class="pay-card-amount">${fmtMoney(p.amount)}</div>
          ${statusBadge(p.status)}
        </div>
      </div>
    `).join('');
  }

  // The proof sits in a private bucket, so it needs a signed link each time.
  window.viewProof = async function (paymentId) {
    const payment = PAYMENTS.find((p) => p.id === paymentId);
    if (!payment || !payment.proofPath) return;
    try {
      const url = await HS.payments.proofUrl(payment.proofPath);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      showToast('Could not open that file: ' + err.message);
    }
  };

  // ── Render Deposit Tab ────────────────────────────────────────────────────────
  function renderDeposit() {
    const container = document.getElementById('depositContainer');

    if (!DEPOSITS.length) {
      container.innerHTML = `<div class="pay-card-empty">No security deposit is on record for you yet.</div>`;
      return;
    }

    const STATUS_LABELS = {
      held: 'Active',
      partially_refunded: 'Partially refunded',
      refunded: 'Refunded',
      forfeited: 'Forfeited',
    };

    container.innerHTML = DEPOSITS.map((d) => {
      const pct = d.amount ? Math.round((d.refundable / d.amount) * 100) : 0;

      const deductionItems = d.deductions.length
        ? d.deductions.map((x) => `
            <div class="deduction-item">
              <div class="deduction-info">
                <span class="deduction-reason">${esc(x.reason)}</span>
                <span class="deduction-date">${fmtDate(x.date)}</span>
              </div>
              <span class="deduction-cost">−${fmtMoney(x.cost)}</span>
            </div>
          `).join('')
        : `<div class="deduction-empty">No deductions have been filed.</div>`;

      return `
        <div class="deposit-card">
          <div class="deposit-card-header">
            <span class="deposit-card-title">Security Deposit — ${esc(d.listingTitle)}</span>
            <span class="deposit-card-status">${esc(STATUS_LABELS[d.status] || d.status)}</span>
          </div>
          <div class="deposit-body">
            <div class="deposit-row">
              <div class="deposit-item">
                <span class="deposit-item-label">Total Deposit</span>
                <span class="deposit-item-value">${fmtMoney(d.amount)}</span>
              </div>
              <div class="deposit-item">
                <span class="deposit-item-label">Total Deductions</span>
                <span class="deposit-item-value red">−${fmtMoney(d.totalDeductions)}</span>
              </div>
              <div class="deposit-item">
                <span class="deposit-item-label">Refundable Balance</span>
                <span class="deposit-item-value teal">${fmtMoney(d.refundable)}</span>
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
    }).join('');
  }

  // ── Tab Switching ─────────────────────────────────────────────────────────────
  window.switchTab = function (tab) {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach((el) => {
      el.style.display = el.id === 'tab-' + tab ? '' : 'none';
    });
    if (tab === 'history') renderHistory();
    if (tab === 'deposit') renderDeposit();
  };

  document.getElementById('historySearch')?.addEventListener('input', hsDebounce(renderHistory, 200));

  // ── Toast ─────────────────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
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

    document.body.insertAdjacentHTML('beforeend', `
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
    `);

    document.getElementById('propertySelectorBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'propertySelectorBackdrop') closePropertySelector();
    });
  }

  // Only payments that still need money are payable: once a proof is in, the landlord has to act.
  const payable = () => PAYMENTS.filter((p) => p.status === 'pending' || p.status === 'rejected');

  window.openPropertySelector = function () {
    initPropertySelector();

    const list = payable();
    const container = document.getElementById('propertySelectorBody');

    if (!list.length) {
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
      container.innerHTML = list.map((p) => `
        <div class="property-selector-card" onclick="selectPropertyToPay('${esc(p.id)}')">
          <div class="property-card-header">
            <div style="flex:1;">
              <div class="property-card-title">${esc(p.listingTitle)}</div>
              <span class="property-card-type">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="property-card-amount">${fmtMoney(p.amount)}</div>
          </div>
          <div class="property-card-meta">
            <div class="property-card-item">
              <span class="property-card-item-label">Period</span>
              <span class="property-card-item-value">${esc(p.period) || '—'}</span>
            </div>
            <div class="property-card-item">
              <span class="property-card-item-label">Due Date</span>
              <span class="property-card-item-value">${fmtDate(p.dueDate)}</span>
            </div>
          </div>
          <div class="property-card-footer">
            <div class="property-card-status">
              ${p.status === 'rejected' ? 'Rejected — pay again' : 'Payment pending'}
            </div>
            <div class="property-card-arrow">→</div>
          </div>
        </div>
      `).join('');
    }

    document.getElementById('propertySelectorBackdrop').classList.add('active');
  };

  window.closePropertySelector = function () {
    document.getElementById('propertySelectorBackdrop')?.classList.remove('active');
  };

  window.selectPropertyToPay = function (paymentId) {
    const payment = payable().find((p) => p.id === paymentId);
    if (!payment) return;

    closePropertySelector();

    setTimeout(() => {
      PaymentIntegration.openPaymentModal({
        paymentId: payment.id,
        propertyId: payment.listingId,
        listingTitle: payment.listingTitle,
        amount: payment.amount,
        purpose: payment.purpose || 'rent',
        period: payment.period,
        dueDate: payment.dueDate,
        onSuccess: async function () {
          await load();
          renderStats();
          renderUpcoming();
          renderHistory();
        },
      });
    }, 300);
  };

  window.payNowWithQRPH = function () {
    openPropertySelector();
  };

  // ── Init ──────────────────────────────────────────────────────────────────────
  await load();
  renderStats();
  renderUpcoming();
})();
