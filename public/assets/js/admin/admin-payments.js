// FILE: assets/js/admin/admin-payments.js
// Kasafide – Admin Payments Overview
//
// Read-only monitoring of every payment and security deposit on the platform, straight from the
// database (admins can read all rows of both by policy). Admins don't act on payments here — the
// listing's seller confirms or rejects them, and records deposit deductions themselves; there is
// no admin approval step for either in the schema.

(async function () {
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'payments' });
  KasafideTopbar.init({ placeholder: 'Payments Overview' });

  let ALL_TRANSACTIONS = [];
  let ALL_DEPOSITS = [];

  // ── Helpers ───────────────────────────────────────────────────────────────────
  // Names, titles and references are typed by users, and everything here is rendered as HTML.
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtMoney(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH');
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(String(d).slice(0, 10) + 'T00:00:00')
      .toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  const AVATAR_COLORS = ['var(--k-avatar-1)', 'var(--k-avatar-3)', 'var(--k-avatar-2)', 'var(--k-avatar-4)', 'var(--k-avatar-6)', 'var(--k-avatar-5)'];
  function avatarColor(seed) {
    let h = 0;
    for (const c of String(seed || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  const TYPE_LABELS = {
    security: 'Security Deposit', rent: 'Rent Payment', both: 'Security + Rent',
    reservation: 'Reservation', sale: 'Sale',
    land_title_verification_fee: 'Title Verification Fee',
  };

  // A title verification fee is a seller paying Kasafide, not a tenant paying a landlord.
  const PLATFORM_FEES = new Set(['land_title_verification_fee']);
  function formatPaymentType(type) {
    return TYPE_LABELS[type] || type || '—';
  }

  function paymentTypeBadge(type) {
    if (!type) return '<span class="badge-type">—</span>';
    const map = {
      security:    { label: 'Security',    cls: 'badge-type-security' },
      rent:        { label: 'Rent',        cls: 'badge-type-rent' },
      both:        { label: 'Both',        cls: 'badge-type-both' },
      reservation: { label: 'Reservation', cls: 'badge-type' },
      sale:        { label: 'Sale',        cls: 'badge-type' },
      land_title_verification_fee: { label: 'Title Fee', cls: 'badge-type' },
    };
    const t = map[type] || { label: type, cls: 'badge-type' };
    return `<span class="${t.cls}">${esc(t.label)}</span>`;
  }

  // Database statuses: 'pending' (a QR charge raised, not paid yet), 'pending_confirmation'
  // (proof uploaded, waiting on the seller), 'paid' (shown as 'confirmed'), 'rejected'.
  function statusBadge(status) {
    const map = {
      confirmed:            { cls: 'badge-confirmed',            label: 'Confirmed' },
      pending_confirmation: { cls: 'badge-pending_confirmation', label: 'Awaiting Seller' },
      pending:              { cls: 'badge-pending',              label: 'Awaiting Payment' },
      rejected:             { cls: 'badge-overdue',              label: 'Rejected' },
    };
    const s = map[status] || { cls: 'badge-pending', label: status || '—' };
    return `<span class="badge ${s.cls}">${esc(s.label)}</span>`;
  }

  const DEPOSIT_STATUS = {
    held:               { cls: 'badge-active',               label: 'Held' },
    partially_refunded: { cls: 'badge-pending_confirmation', label: 'Partly Refunded' },
    refunded:           { cls: 'badge-confirmed',            label: 'Refunded' },
    forfeited:          { cls: 'badge-overdue',              label: 'Forfeited' },
  };
  function depositBadge(status) {
    const s = DEPOSIT_STATUS[status] || { cls: 'badge-active', label: status || '—' };
    return `<span class="badge ${s.cls}">${esc(s.label)}</span>`;
  }

  // ── Load ──────────────────────────────────────────────────────────────────────
  async function load() {
    const [payments, deposits] = await Promise.all([HS.admin.payments(), HS.deposits.list()]);

    const people = await HS.profiles.byIds([
      ...payments.flatMap(p => [p.buyerId, p.sellerId]),
      ...deposits.flatMap(d => [d.buyerId, d.sellerId]),
    ]);
    const nameOf = (id) => (people[id] && people[id].name) || 'Kasafide user';

    ALL_TRANSACTIONS = payments.map(p => ({
      ...p,
      tenantName: nameOf(p.buyerId),
      landlord: PLATFORM_FEES.has(p.paymentType) ? 'Kasafide' : nameOf(p.sellerId),
      // When it happened, for the date filters: when it was paid, or when it was raised if not yet.
      txDate: p.paidDate || (p.createdAt ? String(p.createdAt).slice(0, 10) : null),
    }));
    ALL_DEPOSITS = deposits.map(d => ({
      ...d,
      tenantName: nameOf(d.buyerId),
      landlord: nameOf(d.sellerId),
    }));
  }

  // ── Render Stats ──────────────────────────────────────────────────────────────
  function renderStats() {
    const confirmed = ALL_TRANSACTIONS.filter(t => t.status === 'confirmed');
    const totalCollected = confirmed.reduce((s, t) => s + t.amount, 0);
    const pendingCount = ALL_TRANSACTIONS.filter(t => t.status === 'pending_confirmation').length;
    const active = ALL_DEPOSITS.filter(d => d.status === 'held' || d.status === 'partially_refunded');
    const depositsHeld = active.reduce((s, d) => s + d.refundable, 0);
    const damageDeductions = ALL_DEPOSITS.reduce((s, d) => s + d.totalDeductions, 0);
    const deductionCount = ALL_DEPOSITS.reduce((s, d) => s + d.deductions.length, 0);

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-label">Total Collected</div>
        <div class="stat-value">${fmtMoney(totalCollected)}</div>
        <div class="stat-hint">${confirmed.length} confirmed payment${confirmed.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="stat-label">Pending Confirmation</div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-hint">Awaiting landlord action</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-label">Security Deposits Held</div>
        <div class="stat-value">${fmtMoney(depositsHeld)}</div>
        <div class="stat-hint">${active.length} active deposit${active.length !== 1 ? 's' : ''}, after deductions</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="stat-label">Damage Deductions</div>
        <div class="stat-value">${fmtMoney(damageDeductions)}</div>
        <div class="stat-hint">${deductionCount} deduction${deductionCount !== 1 ? 's' : ''} across all deposits</div>
      </div>
    `;
  }

  // The landlord filter lists whoever actually has payments, not a typed-in pair of names.
  function fillLandlordFilter() {
    const sel = document.getElementById('fLandlord');
    const names = [...new Set(ALL_TRANSACTIONS.map(t => t.landlord))].sort((a, b) => a.localeCompare(b));
    sel.innerHTML = '<option value="">All Recipients</option>' +
      names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }

  // ── Render Transactions ───────────────────────────────────────────────────────

  // Only the search box uses this. renderTransactions() itself stays immediate, so the first render and
  // every call from code are unaffected.
  window.renderTransactionsSoon = hsDebounce(() => window.renderTransactions(), 200);

  window.renderTransactions = function () {
    const dateFrom = document.getElementById('fDateFrom')?.value || '';
    const dateTo   = document.getElementById('fDateTo')?.value || '';
    const landlord = document.getElementById('fLandlord')?.value || '';
    const status   = document.getElementById('fStatus')?.value || '';
    const paymentType = document.getElementById('fPaymentType')?.value || '';
    const q        = (document.getElementById('fSearch')?.value || '').toLowerCase().trim();

    let list = [...ALL_TRANSACTIONS];

    if (dateFrom) list = list.filter(t => t.txDate && t.txDate >= dateFrom);
    if (dateTo)   list = list.filter(t => t.txDate && t.txDate <= dateTo);
    if (landlord) list = list.filter(t => t.landlord === landlord);
    if (status)   list = list.filter(t => t.status === status);
    if (paymentType) list = list.filter(t => t.paymentType === paymentType);
    if (q)        list = list.filter(t =>
      [t.tenantName, t.landlord, t.reference, t.listingTitle, t.period]
        .some(v => String(v || '').toLowerCase().includes(q))
    );

    const countEl = document.getElementById('txCount');
    if (countEl) countEl.textContent = list.length + ' record' + (list.length !== 1 ? 's' : '');

    const tbody = document.getElementById('transactionsBody');
    if (!list.length) {
      tbody.innerHTML = `<tr class="table-empty"><td colspan="9">${ALL_TRANSACTIONS.length
        ? 'No transactions match the current filters.' : 'No payments have been made on the platform yet.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td data-label="Paid By">
          <div class="user-cell">
            <div class="avatar-sm" style="background:${avatarColor(t.buyerId)}">${esc(initials(t.tenantName))}</div>
            ${esc(t.tenantName)}
          </div>
        </td>
        <td data-label="Paid To">${esc(t.landlord)}</td>
        <td data-label="Property" style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.listingTitle || '—')}</td>
        <td data-label="Period" style="white-space:nowrap">${esc(t.period || '—')}</td>
        <td data-label="Amount" class="amount-cell">${fmtMoney(t.amount)}</td>
        <td data-label="Type">${paymentTypeBadge(t.paymentType)}</td>
        <td data-label="Method">${esc(t.method || '—')}</td>
        <td data-label="Status">${statusBadge(t.status)}</td>
        <td data-label="Actions">
          <button class="btn-view" onclick="viewTransaction('${esc(t.id)}')">View</button>
        </td>
      </tr>
    `).join('');
  };

  // ── Render Deposits ───────────────────────────────────────────────────────────
  function renderDeposits() {
    const countEl = document.getElementById('depCount');
    if (countEl) countEl.textContent = ALL_DEPOSITS.length + ' deposit' + (ALL_DEPOSITS.length !== 1 ? 's' : '');

    const tbody = document.getElementById('depositsBody');
    if (!ALL_DEPOSITS.length) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="8">No security deposits recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = ALL_DEPOSITS.map(d => `
        <tr>
          <td data-label="Tenant">
            <div class="user-cell">
              <div class="avatar-sm" style="background:${avatarColor(d.buyerId)}">${esc(initials(d.tenantName))}</div>
              ${esc(d.tenantName)}
            </div>
          </td>
          <td data-label="Property" style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.listingTitle || '—')}</td>
          <td data-label="Deposit" class="amount-cell">${fmtMoney(d.amount)}</td>
          <td data-label="Deductions" style="color: var(--red); font-weight:600; white-space:nowrap">
            ${d.totalDeductions > 0 ? '−' + fmtMoney(d.totalDeductions) : '—'}
          </td>
          <td data-label="Refundable"><span class="refund-chip">${fmtMoney(d.refundable)}</span></td>
          <td data-label="Status">${depositBadge(d.status)}</td>
          <td data-label="Landlord">${esc(d.landlord)}</td>
          <td data-label="Actions">
            ${d.deductions.length ? `<button class="btn-view" onclick="viewDeductions('${esc(d.id)}')">Deductions</button>` : ''}
          </td>
        </tr>
      `).join('');
  }

  // ── Modal (shared by payment details and deduction lists) ─────────────────────
  function initModal() {
    if (document.getElementById('transactionModalBackdrop')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="transaction-modal-backdrop" id="transactionModalBackdrop">
        <div class="transaction-modal">
          <div class="transaction-modal-header">
            <div class="transaction-modal-title" id="transactionModalTitle">Payment Details</div>
            <button class="transaction-modal-close" onclick="closeTransactionModal()">×</button>
          </div>
          <div class="transaction-modal-body" id="transactionModalBody"></div>
        </div>
      </div>
    `);

    document.getElementById('transactionModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'transactionModalBackdrop') closeTransactionModal();
    });
  }

  function openModal(title, html) {
    initModal();
    document.getElementById('transactionModalTitle').textContent = title;
    document.getElementById('transactionModalBody').innerHTML = html;
    document.getElementById('transactionModalBackdrop').classList.add('active');
  }

  const row = (label, value) => `
    <div class="tx-detail-section">
      <div class="tx-detail-label">${label}</div>
      <div class="tx-detail-value">${value}</div>
    </div>`;

  window.viewTransaction = function (id) {
    const t = ALL_TRANSACTIONS.find(x => x.id === id);
    if (!t) return;

    openModal('Payment Details', [
      row('Transaction ID', `<span style="font-family:monospace">${esc(t.id)}</span>`),
      row('Paid By', `<div class="user-cell"><div class="avatar-sm" style="background:${avatarColor(t.buyerId)}">${esc(initials(t.tenantName))}</div>${esc(t.tenantName)}</div>`),
      row('Paid To', esc(t.landlord)),
      row('Property', esc(t.listingTitle || '—')),
      row('Payment Type', `${paymentTypeBadge(t.paymentType)} ${esc(formatPaymentType(t.paymentType))}`),
      row('Period', esc(t.period || '—')),
      row('Due Date', fmtDate(t.dueDate)),
      row('Amount', `<span style="font-size:20px;font-weight:800;color:var(--teal)">${fmtMoney(t.amount)}</span>`),
      row('Payment Method', esc(t.method || '—')),
      row('Reference Number', `<span style="font-family:monospace;font-weight:600">${esc(t.reference || '—')}</span>`),
      row('Paid Date', fmtDate(t.paidDate)),
      row('Status', statusBadge(t.status)),
      t.rejectionReason ? row('Rejection Reason', esc(t.rejectionReason)) : '',
    ].join(''));
  };

  window.viewDeductions = function (id) {
    const d = ALL_DEPOSITS.find(x => x.id === id);
    if (!d) return;

    openModal('Deposit Deductions', `
      <div class="deduction-info">
        <div class="deduction-info-row"><span class="deduction-info-label">Tenant:</span><span class="deduction-info-value">${esc(d.tenantName)}</span></div>
        <div class="deduction-info-row"><span class="deduction-info-label">Landlord:</span><span class="deduction-info-value">${esc(d.landlord)}</span></div>
        <div class="deduction-info-row"><span class="deduction-info-label">Property:</span><span class="deduction-info-value">${esc(d.listingTitle || '—')}</span></div>
        <div class="deduction-info-row"><span class="deduction-info-label">Deposit:</span><span class="deduction-info-value">${fmtMoney(d.amount)}</span></div>
        <div class="deduction-info-row"><span class="deduction-info-label">Refundable:</span><span class="deduction-info-value">${fmtMoney(d.refundable)}</span></div>
      </div>
      <div class="pending-deductions-list">
        ${d.deductions.map(ded => `
          <div class="deduction-request-card">
            <div class="deduction-header">
              <div class="deduction-amount">${fmtMoney(ded.cost)}</div>
              <div class="deduction-date">${fmtDate(ded.date)}</div>
            </div>
            <div class="deduction-reason"><strong>Reason:</strong> ${esc(ded.reason || '—')}</div>
          </div>
        `).join('')}
      </div>
    `);
  };

  window.closeTransactionModal = function () {
    document.getElementById('transactionModalBackdrop')?.classList.remove('active');
  };

  // ── Init ──────────────────────────────────────────────────────────────────────
  document.getElementById('transactionsBody').innerHTML =
    '<tr class="table-empty"><td colspan="9">Loading…</td></tr>';
  document.getElementById('depositsBody').innerHTML =
    '<tr class="table-empty"><td colspan="8">Loading…</td></tr>';

  try {
    await load();
  } catch (err) {
    console.error('Could not load payments:', err);
    document.getElementById('transactionsBody').innerHTML =
      '<tr class="table-empty"><td colspan="9">Could not load payments. Please refresh.</td></tr>';
    document.getElementById('depositsBody').innerHTML =
      '<tr class="table-empty"><td colspan="8">Could not load deposits. Please refresh.</td></tr>';
    return;
  }

  renderStats();
  fillLandlordFilter();
  renderTransactions();
  renderDeposits();
})();

