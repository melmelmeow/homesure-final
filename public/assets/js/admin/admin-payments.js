// FILE: assets/js/admin/admin-payments.js
// HomeSure – Admin Payments Overview (Real Data Integration)

(async function () {
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'payments' });
  HomeSureTopbar.init({ placeholder: 'Payments Overview' });

  // Real Database Transactions & Deposits (All fake data removed)
  let ALL_TRANSACTIONS = [];
  let ALL_DEPOSITS = [];

  // Load real payments from database
  try {
    const rawPayments = await sb
      .from('payments')
      .select('*, properties(title, landowner_id), profiles:user_id(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (rawPayments && rawPayments.data) {
      ALL_TRANSACTIONS = rawPayments.data.map(p => {
        const tenantName = p.profiles ? (p.profiles.first_name + ' ' + p.profiles.last_name).trim() : 'Anonymous Tenant';
        const tenantInitials = hsInitials(p.profiles?.first_name, p.profiles?.last_name, p.profiles?.email);
        return {
          id: p.id || p.reference || ('PAY-' + p.created_at?.slice(0, 10)),
          tenantName,
          tenantInitials,
          tenantColor: '#0f766e',
          landlord: p.seller_name || 'Landlord',
          listingTitle: p.properties?.title || 'Property',
          period: p.created_at ? new Date(p.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : '—',
          amount: Number(p.amount) || 0,
          method: p.payment_method || 'Online / Xendit',
          reference: p.reference_number || p.xendit_invoice_id || '—',
          paymentType: p.payment_type || 'rent',
          dueDate: p.due_date || null,
          status: p.status === 'paid' ? 'confirmed' : (p.status || 'pending_confirmation'),
          paidDate: p.paid_at ? p.paid_at.slice(0, 10) : null
        };
      });
    }
  } catch (err) {
    console.warn('Real payments fetch note:', err.message);
  }

  // Populate landlord dropdown dynamically from real records
  const landlordSelect = document.getElementById('fLandlord');
  if (landlordSelect) {
    const uniqueLandlords = [...new Set(ALL_TRANSACTIONS.map(t => t.landlord).filter(Boolean))];
    uniqueLandlords.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      landlordSelect.appendChild(opt);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function fmtMoney(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH');
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatPaymentType(type) {
    const map = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security + Rent'
    };
    return map[type] || type || '—';
  }

  function paymentTypeBadge(type) {
    if (!type) return '<span class="badge-type">—</span>';
    const map = {
      security: { label: 'Security', cls: 'badge-type-security' },
      rent: { label: 'Rent', cls: 'badge-type-rent' },
      both: { label: 'Both', cls: 'badge-type-both' }
    };
    const t = map[type] || { label: type, cls: 'badge-type' };
    return `<span class="${t.cls}">${t.label}</span>`;
  }

  function statusBadge(status) {
    const map = {
      confirmed: { cls: 'badge-confirmed', label: 'Confirmed' },
      paid: { cls: 'badge-confirmed', label: 'Confirmed' },
      pending_confirmation: { cls: 'badge-pending_confirmation', label: 'Pending' },
      pending: { cls: 'badge-pending', label: 'Pending' },
      overdue: { cls: 'badge-overdue', label: 'Overdue' },
    };
    const s = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  }

  // ── Render Stats with REAL values ──────────────────────────────────────────────
  function renderStats() {
    const totalCollected = ALL_TRANSACTIONS
      .filter(t => t.status === 'confirmed' || t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0);

    const pendingCount = ALL_TRANSACTIONS
      .filter(t => t.status === 'pending_confirmation' || t.status === 'pending').length;

    const depositsHeld = ALL_DEPOSITS
      .reduce((s, d) => s + (d.amount || 0), 0);

    const damageDeductions = ALL_DEPOSITS
      .reduce((s, d) => s + (d.deductions ? d.deductions.reduce((a, x) => a + x.cost, 0) : 0), 0);

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-label">Total Collected</div>
        <div class="stat-value">${fmtMoney(totalCollected)}</div>
        <div class="stat-hint">Platform confirmed payments</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="stat-label">Pending Confirmation</div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-hint">Awaiting landlord / admin review</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-label">Security Deposits Held</div>
        <div class="stat-value">${fmtMoney(depositsHeld)}</div>
        <div class="stat-hint">${ALL_DEPOSITS.length} active deposits</div>
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

  // ── Render Transactions ───────────────────────────────────────────────────────
  window.renderTransactionsSoon = hsDebounce(() => window.renderTransactions(), 200);

  window.renderTransactions = function () {
    const dateFrom = document.getElementById('fDateFrom')?.value || '';
    const dateTo   = document.getElementById('fDateTo')?.value || '';
    const landlord = document.getElementById('fLandlord')?.value || '';
    const status   = document.getElementById('fStatus')?.value || '';
    const paymentType = document.getElementById('fPaymentType')?.value || '';
    const q        = (document.getElementById('fSearch')?.value || '').toLowerCase().trim();

    let list = [...ALL_TRANSACTIONS];

    if (dateFrom) list = list.filter(t => t.paidDate && t.paidDate >= dateFrom);
    if (dateTo)   list = list.filter(t => t.paidDate && t.paidDate <= dateTo);
    if (landlord) list = list.filter(t => t.landlord === landlord);
    if (status)   list = list.filter(t => t.status === status);
    if (paymentType) list = list.filter(t => t.paymentType === paymentType);
    if (q)        list = list.filter(t =>
      (t.tenantName && t.tenantName.toLowerCase().includes(q)) ||
      (t.landlord && t.landlord.toLowerCase().includes(q)) ||
      (t.reference && t.reference.toLowerCase().includes(q)) ||
      (t.listingTitle && t.listingTitle.toLowerCase().includes(q)) ||
      (t.period && t.period.toLowerCase().includes(q))
    );

    const countEl = document.getElementById('txCount');
    if (countEl) countEl.textContent = list.length + ' record' + (list.length !== 1 ? 's' : '');

    const tbody = document.getElementById('transactionsBody');
    if (!list.length) {
      tbody.innerHTML = `<tr class="table-empty"><td colspan="9" style="text-align:center;padding:40px;color:var(--muted);">No transactions found. Payments completed via Xendit or Manual Bank Transfer will appear here automatically.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar-sm" style="background:${t.tenantColor}">${t.tenantInitials}</div>
            ${t.tenantName}
          </div>
        </td>
        <td>${t.landlord}</td>
        <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.listingTitle}</td>
        <td style="white-space:nowrap">${t.period}</td>
        <td class="amount-cell">${fmtMoney(t.amount)}</td>
        <td>${paymentTypeBadge(t.paymentType)}</td>
        <td>${t.method}</td>
        <td>${statusBadge(t.status)}</td>
        <td>
          <button class="btn-view" onclick="viewTransaction('${t.id}')">View</button>
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
      tbody.innerHTML = `<tr class="table-empty"><td colspan="8" style="text-align:center;padding:32px;color:var(--muted);">No security deposits currently on hold.</td></tr>`;
      return;
    }

    tbody.innerHTML = ALL_DEPOSITS.map(d => {
      const totalDed = (d.deductions || []).reduce((s, x) => s + x.cost, 0);
      const refund = d.amount - totalDed;
      const hasPending = d.pendingDeductions && d.pendingDeductions.length > 0;
      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="avatar-sm" style="background:${d.tenantColor}">${d.tenantInitials}</div>
              ${d.tenantName}
            </div>
          </td>
          <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.listingTitle}</td>
          <td class="amount-cell">${fmtMoney(d.amount)}</td>
          <td style="color: var(--red); font-weight:600; white-space:nowrap">
            ${totalDed > 0 ? '−' + fmtMoney(totalDed) : '—'}
          </td>
          <td><span class="refund-chip">${fmtMoney(refund)}</span></td>
          <td>
            <span class="badge badge-active">Active</span>
            ${hasPending ? `<span class="badge badge-pending-deduction">${d.pendingDeductions.length} Pending</span>` : ''}
          </td>
          <td>${d.landlord}</td>
          <td>
            ${hasPending ? `<button class="btn-view" onclick="viewDeductionRequests('${d.id}')">Review</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── View Transaction Modal ────────────────────────────────────────────────────
  function initTransactionModal() {
    if (document.getElementById('transactionModalBackdrop')) return;

    const modalHtml = `
      <div class="transaction-modal-backdrop" id="transactionModalBackdrop">
        <div class="transaction-modal">
          <div class="transaction-modal-header">
            <div class="transaction-modal-title">Payment Details</div>
            <button class="transaction-modal-close" onclick="closeTransactionModal()">×</button>
          </div>
          <div class="transaction-modal-body" id="transactionModalBody"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('transactionModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'transactionModalBackdrop') {
        closeTransactionModal();
      }
    });
  }

  window.viewTransaction = function (id) {
    const t = ALL_TRANSACTIONS.find(x => x.id === id);
    if (!t) return;

    initTransactionModal();

    const body = document.getElementById('transactionModalBody');
    body.innerHTML = `
      <div class="tx-detail-section">
        <div class="tx-detail-label">Transaction ID / Reference</div>
        <div class="tx-detail-value">${t.id}</div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Tenant</div>
        <div class="tx-detail-value">
          <div class="user-cell">
            <div class="avatar-sm" style="background:${t.tenantColor}">${t.tenantInitials}</div>
            ${t.tenantName}
          </div>
        </div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Landlord</div>
        <div class="tx-detail-value">${t.landlord}</div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Property</div>
        <div class="tx-detail-value">${t.listingTitle}</div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Amount</div>
        <div class="tx-detail-value" style="font-size:20px;font-weight:800;color:var(--teal)">${fmtMoney(t.amount)}</div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Payment Method</div>
        <div class="tx-detail-value">${t.method}</div>
      </div>
      <div class="tx-detail-section">
        <div class="tx-detail-label">Status</div>
        <div class="tx-detail-value">${statusBadge(t.status)}</div>
      </div>
    `;

    document.getElementById('transactionModalBackdrop').classList.add('active');
  };

  window.closeTransactionModal = function () {
    document.getElementById('transactionModalBackdrop')?.classList.remove('active');
  };

  // ── Init ──────────────────────────────────────────────────────────────────────
  renderStats();
  renderTransactions();
  renderDeposits();
})();
