// FILE: assets/js/seller/seller-tenants.js
// Kasafide – My Tenants
//
// A tenant is not a row in a table. It is a conclusion: somebody with a confirmed payment or a
// security deposit on one of your listings. HS.tenants.mine() draws it from what is already
// there, so this page adds no new storage — it gathers what was spread across Payments, Deposits
// and Messages into one place.

(async function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'tenants' });
  KasafideTopbar.init({ placeholder: 'Search tenants...' });

  let TENANTS = [];

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Same name, same colour everywhere, so a tenant looks like themselves across pages.
  const AVATAR_COLORS = ['var(--k-avatar-1)', 'var(--k-avatar-3)', 'var(--k-avatar-2)', 'var(--k-avatar-6)', 'var(--k-avatar-4)', 'var(--k-avatar-5)'];
  function avatarColor(name) {
    let hash = 0;
    for (const ch of String(name || '')) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  // ── Load ────────────────────────────────────────────────────────────────────
  const listEl = document.getElementById('tenantList');
  listEl.innerHTML = `<div class="empty"><div class="empty-text">Loading…</div></div>`;

  try {
    TENANTS = await HS.tenants.mine();
  } catch (err) {
    console.error('Could not load tenants:', err);
    listEl.innerHTML = `
      <div class="empty">
        <div class="empty-title">Could not load your tenants</div>
        <div class="empty-text">Something went wrong reaching the database. Please refresh the page.</div>
      </div>`;
    return;
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  function renderStats() {
    const held = TENANTS.reduce((s, t) => s + (t.deposit ? t.deposit.refundable : 0), 0);
    const owing = TENANTS.filter((t) => t.nextDue && t.nextDue.overdue).length;

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Tenants</div>
        <div class="stat-value">${TENANTS.length}</div>
        <div class="stat-hint">${TENANTS.length === 1 ? 'person' : 'people'} across your listings</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Deposits Held</div>
        <div class="stat-value">${fmtMoney(held)}</div>
        <div class="stat-hint">refundable balance</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Overdue</div>
        <div class="stat-value" style="${owing ? 'color:var(--danger)' : ''}">${owing}</div>
        <div class="stat-hint">${owing ? 'need following up' : 'everyone is current'}</div>
      </div>
    `;
  }

  // ── List ────────────────────────────────────────────────────────────────────
  function statusBadge(t) {
    if (t.nextDue && t.nextDue.overdue) return `<span class="badge badge-overdue">Overdue</span>`;
    if (t.awaitingConfirmation) {
      return `<span class="badge badge-waiting">${t.awaitingConfirmation} to confirm</span>`;
    }
    return `<span class="badge badge-clear">Up to date</span>`;
  }

  function render() {
    const q = (document.getElementById('tenantSearch')?.value || '').toLowerCase().trim();
    const shown = q
      ? TENANTS.filter((t) =>
          t.name.toLowerCase().includes(q) || String(t.listingTitle || '').toLowerCase().includes(q))
      : TENANTS;

    if (!TENANTS.length) {
      document.getElementById('toolbar').style.display = 'none';
      listEl.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div class="empty-title">No tenants yet</div>
          <div class="empty-text">
            People appear here once you confirm a payment from them, or once you record a security
            deposit. Enquiries and viewing requests on their own do not make someone a tenant.
          </div>
        </div>`;
      return;
    }

    document.getElementById('toolbar').style.display = '';

    if (!shown.length) {
      listEl.innerHTML = `
        <div class="empty">
          <div class="empty-title">No match</div>
          <div class="empty-text">Nobody matches “${esc(q)}”.</div>
        </div>`;
      return;
    }

    listEl.innerHTML = `<div class="tenant-list">${shown.map((t) => {
      const due = t.nextDue;
      return `
      <div class="tenant-card" role="button" tabindex="0" data-id="${esc(t.id)}">
        <div class="tenant-avatar" style="background:${avatarColor(t.name)}">
          ${t.avatar ? `<img src="${esc(t.avatar)}" alt="">` : esc(initials(t.name))}
        </div>

        <div class="tenant-main">
          <div class="tenant-name">${esc(t.name)} ${statusBadge(t)}</div>
          <div class="tenant-property">${esc(t.listingTitle) || 'Listing no longer available'}</div>

          <div class="tenant-meta">
            <div class="tenant-meta-item">
              <span class="tenant-meta-label">Total Paid</span>
              <span class="tenant-meta-value teal">${fmtMoney(t.totalPaid)}</span>
            </div>
            <div class="tenant-meta-item">
              <span class="tenant-meta-label">Deposit Held</span>
              <span class="tenant-meta-value">${t.deposit ? fmtMoney(t.deposit.refundable) : '—'}</span>
            </div>
            <div class="tenant-meta-item">
              <span class="tenant-meta-label">Next Due</span>
              <span class="tenant-meta-value ${due && due.overdue ? 'red' : 'muted'}">
                ${due ? fmtMoney(due.amount) + ' · ' + fmtDate(due.dueDate) : 'Nothing due'}
              </span>
            </div>
            <div class="tenant-meta-item">
              <span class="tenant-meta-label">Tenant Since</span>
              <span class="tenant-meta-value muted">${fmtDate(t.since)}</span>
            </div>
          </div>
        </div>

        <div class="tenant-actions">
          <button class="tenant-btn" data-action="message" data-id="${esc(t.id)}">Message</button>
          <button class="tenant-btn" data-action="profile" data-id="${esc(t.id)}">Profile</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  // One listener on the container rather than a handler per card, so re-rendering on every
  // keystroke costs nothing.
  listEl.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (button) {
      e.stopPropagation();
      const id = button.dataset.id;
      window.location.href = button.dataset.action === 'message'
        ? `messages.html?to=${encodeURIComponent(id)}`
        : `buyer-profile.html?id=${encodeURIComponent(id)}`;
      return;
    }
    const card = e.target.closest('.tenant-card');
    if (card) window.location.href = `buyer-profile.html?id=${encodeURIComponent(card.dataset.id)}`;
  });

  listEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.tenant-card');
    if (!card) return;
    e.preventDefault();
    window.location.href = `buyer-profile.html?id=${encodeURIComponent(card.dataset.id)}`;
  });

  document.getElementById('tenantSearch')?.addEventListener('input', hsDebounce(render, 200));

  renderStats();
  render();
})();
