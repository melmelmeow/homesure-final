// FILE: assets/js/seller/seller-payments.js
// Kasafide – Seller Payment Management
//
// The payments are the real rows on this seller's own listings — the "Sellers read payments on own
// properties" policy is what limits them, not any filter written here. Confirming or rejecting one
// goes through /api/payments/confirm, because end users have no UPDATE policy on payments: the
// server checks that the caller really is the landowner before it writes.

(async function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'payments' });
  KasafideTopbar.init({ placeholder: 'Payment Management' });

  let ALL_PAYMENTS = [];
  let DEPOSITS = [];
  let LISTINGS = [];

  // Track which deposit a damage modal is targeting
  let activeDamageDepositId = null;

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
      .toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
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
      pending_confirmation: { cls: 'badge-pending_confirmation', label: 'Pending' },
      pending: { cls: 'badge-pending', label: 'Pending' },
      rejected: { cls: 'badge-overdue', label: 'Rejected' },
      overdue: { cls: 'badge-overdue', label: 'Overdue' },
    };
    const s = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${s.cls}">${esc(s.label)}</span>`;
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Same name, same colour, every time — so a tenant looks like themselves across the page.
  const AVATAR_COLORS = ['var(--k-avatar-1)', 'var(--k-avatar-3)', 'var(--k-avatar-2)', 'var(--k-avatar-6)', 'var(--k-avatar-4)', 'var(--k-avatar-5)'];
  function avatarColor(name) {
    let hash = 0;
    for (const ch of String(name || '')) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  const pending = () => ALL_PAYMENTS.filter((p) => p.status === 'pending_confirmation');

  // ── Load ──────────────────────────────────────────────────────────────────────
  async function load() {
    const results = await Promise.allSettled([
      HS.payments.forMyListings(),
      HS.deposits.list(),
      HS.listings.mine(),
    ]);

    if (results[0].status === 'fulfilled') {
      ALL_PAYMENTS = await HS.payments.payerNames(results[0].value);
      ALL_PAYMENTS.forEach((p) => {
        p.initials = initials(p.tenantName);
        p.color = avatarColor(p.tenantName);
      });
    } else {
      console.error('Could not load payments:', results[0].reason);
      showToast('Could not load your payments. Please refresh.');
    }

    if (results[1].status === 'fulfilled') {
      DEPOSITS = await HS.deposits.tenantNames(results[1].value.filter((d) => d.sellerId === user.id));
      DEPOSITS.forEach((d) => {
        d.initials = initials(d.tenantName);
        d.color = avatarColor(d.tenantName);
      });
    } else {
      console.error('Could not load deposits:', results[1].reason);
    }

    // Only needed to decide which modal follows a confirmed payment.
    LISTINGS = results[2].status === 'fulfilled' ? results[2].value : [];
  }

  function renderAll() {
    renderStats();
    renderPending();
    fillTenantFilter();
  }

  // ── Render Stats ──────────────────────────────────────────────────────────────
  function renderStats() {
    const totalReceived = ALL_PAYMENTS
      .filter((p) => p.status === 'confirmed')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingCount = pending().length;
    const activeDeposits = DEPOSITS.filter((d) => d.status === 'held' || d.status === 'partially_refunded');
    const depositsHeld = activeDeposits.reduce((s, d) => s + d.amount, 0);
    const damageDeductions = DEPOSITS.reduce((s, d) => s + d.totalDeductions, 0);

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon teal">
          <div style="font-size:24px;font-weight:600;">₱</div>
        </div>
        <div class="stat-label">Total Received</div>
        <div class="stat-value">${fmtMoney(totalReceived)}</div>
        <div class="stat-hint">All-time confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="stat-label">Pending Confirmation</div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-hint">Awaiting review</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-label">Deposits Held</div>
        <div class="stat-value">${fmtMoney(depositsHeld)}</div>
        <div class="stat-hint">${activeDeposits.length} active tenant${activeDeposits.length === 1 ? '' : 's'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="stat-label">Damage Deductions</div>
        <div class="stat-value">${fmtMoney(damageDeductions)}</div>
        <div class="stat-hint">Across all deposits</div>
      </div>
    `;
  }

  // ── Render Pending Tab ────────────────────────────────────────────────────────
  function renderPending() {
    const list = pending();

    const badge = document.getElementById('pendingBadge');
    if (badge) badge.textContent = list.length > 0 ? list.length : '';

    const container = document.getElementById('pendingContainer');
    if (!list.length) {
      container.innerHTML = `<div class="pending-empty">No pending payments to review. All caught up!</div>`;
      return;
    }

    container.innerHTML = list.map((p) => `
      <div class="pending-card" id="pcard-${esc(p.id)}">
        <div class="avatar" style="background:${p.color}">${esc(p.initials)}</div>
        <div class="pending-info">
          <div class="pending-name">${esc(p.tenantName)}</div>
          <div class="pending-property">${esc(p.listingTitle)}</div>
          <div class="pending-meta">
            <div class="pending-meta-item">
              <span class="pending-meta-label">Type</span>
              <span class="pending-meta-value">${formatPaymentType(p.paymentType)}</span>
            </div>
            <div class="pending-meta-item">
              <span class="pending-meta-label">Period</span>
              <span class="pending-meta-value">${esc(p.period) || '—'}</span>
            </div>
            <div class="pending-meta-item">
              <span class="pending-meta-label">Date Paid</span>
              <span class="pending-meta-value">${fmtDate(p.paidDate)}</span>
            </div>
            <div class="pending-meta-item">
              <span class="pending-meta-label">Method</span>
              <span class="pending-meta-value">${esc(p.method) || '—'}</span>
            </div>
            <div class="pending-meta-item">
              <span class="pending-meta-label">Reference</span>
              <span class="pending-meta-value" style="font-family:monospace;font-size:12px">${esc(p.reference) || '—'}</span>
            </div>
          </div>
          ${p.proofPath
            ? `<button class="btn-ghost" style="margin-top:8px;padding:6px 12px;font-size:12px;"
                       onclick="viewProof('${esc(p.id)}')">View proof</button>`
            : `<div class="pending-meta-label" style="margin-top:8px;">No proof was attached.</div>`}
        </div>
        <div class="pending-amount">${fmtMoney(p.amount)}</div>
        <div class="pending-actions">
          <button class="action-btn confirm" onclick="markReceived('${esc(p.id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
            Mark Received
          </button>
          <button class="action-btn reject" onclick="openRejectPaymentModal('${esc(p.id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Reject
          </button>
        </div>
      </div>
    `).join('');
  }

  // The buyer's screenshot is in a private bucket; a seller may read only the proof attached to a
  // payment on one of their own listings, and the link lasts an hour.
  window.viewProof = async function (paymentId) {
    const payment = ALL_PAYMENTS.find((p) => p.id === paymentId);
    if (!payment || !payment.proofPath) return;
    try {
      const url = await HS.payments.proofUrl(payment.proofPath);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      showToast('Could not open that file: ' + err.message);
    }
  };

  // ── Mark Received ─────────────────────────────────────────────────────────────
  window.markReceived = async function (id) {
    const payment = ALL_PAYMENTS.find((p) => p.id === id);
    if (!payment) return;

    const card = document.getElementById('pcard-' + id);
    card?.querySelectorAll('button').forEach((b) => { b.disabled = true; });

    try {
      const updated = await HS.payments.confirm(id);
      payment.status = updated.status;
      payment.confirmedAt = updated.confirmedAt;
    } catch (err) {
      card?.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      showToast('Could not confirm that payment: ' + err.message);
      return;
    }

    renderStats();
    renderPending();
    showToast(`Payment from ${payment.tenantName} marked as received.`);

    // A confirmed payment usually means a unit just went. Ask what happened to the listing.
    const listing = LISTINGS.find((l) => l.id === payment.listingId);
    setTimeout(() => {
      if (listing && listing.hasMultipleUnits && listing.availableUnits > 0) {
        AdjustAvailabilityModal.open({
          listingId: listing.id,
          listingTitle: listing.title,
          totalUnits: listing.totalUnits,
          availableUnits: listing.availableUnits,
          onConfirm: async () => { await load(); renderAll(); },
        });
      } else {
        CloseListingModal.openModal({
          listingId: payment.listingId,
          listingTitle: payment.listingTitle,
          tenantName: payment.tenantName,
          period: payment.period,
          amount: payment.amount,
        });
      }
    }, 1000);
  };

  // ── Reject Payment Modal ──────────────────────────────────────────────────────
  let pendingRejectPaymentId = null;

  window.openRejectPaymentModal = function (id) {
    const payment = ALL_PAYMENTS.find((p) => p.id === id);
    if (!payment) return;

    pendingRejectPaymentId = id;
    document.getElementById('rejectTenantName').textContent = payment.tenantName;
    document.getElementById('rejectAmount').textContent = fmtMoney(payment.amount);
    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectPaymentModal').style.display = 'flex';
  };

  window.closeRejectPaymentModal = function () {
    document.getElementById('rejectPaymentModal').style.display = 'none';
    pendingRejectPaymentId = null;
  };

  window.confirmRejectPayment = async function () {
    if (!pendingRejectPaymentId) return;

    const id = pendingRejectPaymentId;
    const reason = (document.getElementById('rejectReason').value || '').trim();
    const payment = ALL_PAYMENTS.find((p) => p.id === id);
    closeRejectPaymentModal();

    try {
      const updated = await HS.payments.reject(id, reason);
      if (payment) payment.status = updated.status;
    } catch (err) {
      showToast('Could not reject that payment: ' + err.message);
      return;
    }

    renderStats();
    renderPending();
    showToast(`Payment from ${payment ? payment.tenantName : 'the buyer'} has been rejected.`);
  };

  // ── Render All Payments Tab ───────────────────────────────────────────────────
  function fillTenantFilter() {
    const select = document.getElementById('tenantFilter');
    if (!select) return;

    const names = [...new Set(ALL_PAYMENTS.map((p) => p.tenantName).filter(Boolean))].sort();
    const chosen = select.value;
    select.innerHTML = `<option value="">All Tenants</option>` +
      names.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (names.includes(chosen)) select.value = chosen;
  }


  // Only the search box uses this. renderAllPayments() itself stays immediate, so the first render and
  // every call from code are unaffected.
  window.renderAllPaymentsSoon = hsDebounce(() => window.renderAllPayments(), 200);

  window.renderAllPayments = function () {
    const tenantFilter = document.getElementById('tenantFilter')?.value || '';
    const q = (document.getElementById('allSearch')?.value || '').toLowerCase().trim();

    let list = [...ALL_PAYMENTS];
    if (tenantFilter) list = list.filter((p) => p.tenantName === tenantFilter);
    if (q) {
      list = list.filter((p) =>
        String(p.reference || '').toLowerCase().includes(q) ||
        String(p.period || '').toLowerCase().includes(q) ||
        String(p.method || '').toLowerCase().includes(q) ||
        String(p.listingTitle || '').toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('allPaymentsBody');
    if (!list.length) {
      tbody.innerHTML = `<tr class="table-empty"><td colspan="7">No payment records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((p) => `
      <tr>
        <td>
          <div class="tenant-cell">
            <div class="avatar-sm" style="background:${p.color}">${esc(p.initials)}</div>
            ${esc(p.tenantName)}
          </div>
        </td>
        <td>${esc(p.listingTitle)}</td>
        <td>${formatPaymentType(p.paymentType)}</td>
        <td>${esc(p.period) || '—'}</td>
        <td class="amount-cell">${fmtMoney(p.amount)}</td>
        <td>${esc(p.method) || '—'}</td>
        <td>${statusBadge(p.status)}</td>
      </tr>
    `).join('');
  };

  // ── Render Deposits Tab ───────────────────────────────────────────────────────
  function renderDeposits() {
    const tbody = document.getElementById('depositsBody');

    if (!DEPOSITS.length) {
      tbody.innerHTML = `<tr class="table-empty"><td colspan="7">No security deposits on record yet.</td></tr>`;
      renderDamageReports();
      return;
    }

    const STATUS = {
      held: { cls: 'badge-active', label: 'Active' },
      partially_refunded: { cls: 'badge-pending', label: 'Partly refunded' },
      refunded: { cls: 'badge-confirmed', label: 'Refunded' },
      forfeited: { cls: 'badge-overdue', label: 'Forfeited' },
    };

    tbody.innerHTML = DEPOSITS.map((d) => {
      const s = STATUS[d.status] || { cls: 'badge-pending', label: d.status };
      const settled = d.status === 'refunded' || d.status === 'forfeited';
      return `
        <tr>
          <td>
            <div class="tenant-cell">
              <div class="avatar-sm" style="background:${d.color}">${esc(d.initials)}</div>
              ${esc(d.tenantName)}
            </div>
          </td>
          <td>${esc(d.listingTitle)}</td>
          <td class="amount-cell">${fmtMoney(d.amount)}</td>
          <td style="color: var(--red); font-weight:600">−${fmtMoney(d.totalDeductions)}</td>
          <td><span class="refund-chip">${fmtMoney(d.refundable)}</span></td>
          <td><span class="badge ${s.cls}">${esc(s.label)}</span></td>
          <td>
            ${settled
              ? '<span class="pending-meta-label">Closed</span>'
              : `<button class="btn-file-damage" onclick="openDamageModal('${esc(d.id)}')">File Damage</button>`}
          </td>
        </tr>
      `;
    }).join('');

    renderDamageReports();
  }

  // ── Render Damage Reports ─────────────────────────────────────────────────────
  function renderDamageReports() {
    const all = [];
    DEPOSITS.forEach((d) => {
      d.deductions.forEach((x) => {
        all.push({ ...x, tenantName: d.tenantName, listingTitle: d.listingTitle });
      });
    });
    all.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const container = document.getElementById('damageReportsList');
    if (!all.length) {
      container.innerHTML = `<div class="damage-empty">No damage reports filed yet.</div>`;
      return;
    }

    container.innerHTML = `<div class="damage-list">${all.map((r) => `
      <div class="damage-card">
        <div class="damage-card-info">
          <div class="damage-card-tenant">${esc(r.tenantName)}</div>
          <div class="damage-card-property">${esc(r.listingTitle)}</div>
          <div class="damage-card-reason">${esc(r.reason)}</div>
          <div class="damage-card-date">${fmtDate(r.date)}</div>
        </div>
        <div class="damage-card-right">
          <span class="cost-chip">−${fmtMoney(r.cost)}</span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  // ── Damage Modal ──────────────────────────────────────────────────────────────
  window.openDamageModal = function (depositId) {
    const dep = DEPOSITS.find((d) => d.id === depositId);
    if (!dep) return;

    activeDamageDepositId = depositId;
    document.getElementById('dTenant').value = dep.tenantName;
    document.getElementById('dDescription').value = '';
    document.getElementById('dCost').value = '';
    document.getElementById('dDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('damageModalSub').textContent = dep.listingTitle;
    document.getElementById('damageModal').style.display = 'flex';
  };

  window.closeDamageModal = function () {
    document.getElementById('damageModal').style.display = 'none';
    document.getElementById('damageForm').reset();
    activeDamageDepositId = null;
  };

  window.handleDamageBackdrop = function (e) {
    if (e.target === document.getElementById('damageModal')) closeDamageModal();
  };

  window.submitDamage = async function (e) {
    e.preventDefault();
    if (!activeDamageDepositId) return;

    const dep = DEPOSITS.find((d) => d.id === activeDamageDepositId);
    if (!dep) return;

    const reason = document.getElementById('dDescription').value.trim();
    const cost = Number(document.getElementById('dCost').value);
    const date = document.getElementById('dDate').value;

    if (!reason || !cost || !date) return;
    if (cost > dep.refundable) {
      showToast(`That is more than the ${fmtMoney(dep.refundable)} left on this deposit.`);
      return;
    }

    const id = activeDamageDepositId;
    const submit = e.target.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;

    try {
      await HS.deposits.addDeduction(id, { reason, cost, date });
    } catch (err) {
      if (submit) submit.disabled = false;
      showToast('Could not file that: ' + err.message);
      return;
    }
    if (submit) submit.disabled = false;

    closeDamageModal();
    await load();
    renderDeposits();
    renderStats();
    showToast('Damage report filed and deduction applied to deposit.');
  };

  // ── Tab Switching ─────────────────────────────────────────────────────────────
  window.switchTab = function (tab) {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach((el) => {
      el.style.display = el.id === 'tab-' + tab ? '' : 'none';
    });
    if (tab === 'all') renderAllPayments();
    if (tab === 'deposits') renderDeposits();
    if (tab === 'settings') loadPaymentMethodsPay();
  };

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
  // PAYMENT SETTINGS TAB — how this seller wants to be paid
  //
  // This used to be written into the browser session, so it vanished on sign-out and no buyer ever
  // saw it. It lives on the profile now, and a buyer reads it through get_seller_payment_methods().
  // ══════════════════════════════════════════════════════════════════════════════

  window.togglePaymentMethodPay = function (method, isEnabled) {
    const fields = document.getElementById(method + 'FieldsPay');
    if (fields) fields.style.display = isEnabled ? 'grid' : 'none';
  };

  window.savePaymentMethodsPay = async function () {
    const methods = {
      gcash: {
        enabled: document.getElementById('enableGcashPay').checked,
        number: HSPhone.full('0', document.getElementById('gcashNumberPay').value),
        name: document.getElementById('gcashNamePay').value.trim(),
      },
      maya: {
        enabled: document.getElementById('enableMayaPay').checked,
        number: HSPhone.full('0', document.getElementById('mayaNumberPay').value),
        name: document.getElementById('mayaNamePay').value.trim(),
      },
      bank: {
        enabled: document.getElementById('enableBankPay').checked,
        bankName: document.getElementById('bankNamePay').value.trim(),
        accountNumber: document.getElementById('bankAccountPay').value.trim(),
        accountName: document.getElementById('bankAccountNamePay').value.trim(),
      },
    };

    if (methods.gcash.enabled && (!methods.gcash.number || !methods.gcash.name)) {
      showToast('Please fill in all GCash fields.');
      return;
    }
    if (methods.maya.enabled && (!methods.maya.number || !methods.maya.name)) {
      showToast('Please fill in all Maya fields.');
      return;
    }
    if (methods.bank.enabled && (!methods.bank.bankName || !methods.bank.accountNumber || !methods.bank.accountName)) {
      showToast('Please fill in all Bank Transfer fields.');
      return;
    }

    try {
      await HS.profiles.savePaymentMethods(methods);
    } catch (err) {
      showToast('Could not save that: ' + err.message);
      return;
    }
    showToast('Payment methods saved.');
  };

  let paymentMethodsLoaded = false;
  async function loadPaymentMethodsPay() {
    if (paymentMethodsLoaded) return;

    let pm;
    try {
      pm = await HS.profiles.myPaymentMethods();
    } catch (err) {
      console.error('Could not load your payment methods:', err);
      return;
    }
    paymentMethodsLoaded = true;

    const fill = (key, fields) => {
      const saved = pm[key];
      if (!saved) return;
      document.getElementById(fields.toggle).checked = !!saved.enabled;
      Object.keys(fields.inputs).forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = fields.inputs[id];
        el.value = key === 'number' ? HSPhone.strip(saved[key]) : (saved[key] || '');
      });
      if (saved.enabled) {
        const box = document.getElementById(fields.box);
        if (box) box.style.display = 'grid';
      }
    };

    fill('gcash', {
      toggle: 'enableGcashPay', box: 'gcashFieldsPay',
      inputs: { gcashNumberPay: 'number', gcashNamePay: 'name' },
    });
    fill('maya', {
      toggle: 'enableMayaPay', box: 'mayaFieldsPay',
      inputs: { mayaNumberPay: 'number', mayaNamePay: 'name' },
    });
    fill('bank', {
      toggle: 'enableBankPay', box: 'bankFieldsPay',
      inputs: {
        bankNamePay: 'bankName',
        bankAccountPay: 'accountNumber',
        bankAccountNamePay: 'accountName',
      },
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  await load();
  renderAll();
})();
