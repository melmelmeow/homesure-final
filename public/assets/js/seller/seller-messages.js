// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Seller Messages
//  Depends on: config.js, session.js, data.js (HS.messages, HS.viewing, HS.payments), sidebar.js, topbar.js
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'messages' });
  HomeSureTopbar.init({ placeholder: 'Search messages...' });

  // ── Icons ──────────────────────────────────────────────────────────────────
  const iconCheck2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconSend   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const iconClip   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
  const iconVerify = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  // ── State ──────────────────────────────────────────────────────────────────
  let convs = [];
  let viewings = [];
  let activeConvId = null;

  // Rejection modal state
  let currentRejectMsgId = null;
  let currentRejectPaymentId = null;
  let currentRejectAmount = 0;

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const fmtDay  = (iso) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

  function fmtClock(t) {
    if (!t) return '';
    const [h, m] = String(t).split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  function formatPaymentType(type) {
    const typeMap = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security Deposit + Rent',
      reservation: 'Reservation Fee',
      sale: 'Property Purchase',
    };
    return typeMap[type] || 'Payment';
  }

  // ── Conversation list ──────────────────────────────────────────────────────
  function renderConvList(filter = '') {
    const list = document.getElementById('convList');
    if (!list) return;

    const q = (filter || '').toLowerCase();
    const filtered = convs.filter((c) => {
      if (!q) return true;
      const title = c.listing ? c.listing.title : '';
      const name = c.other ? c.other.name : '';
      return title.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });

    if (!filtered.length) {
      list.innerHTML = `<div style="padding:28px 18px;text-align:center;color:var(--muted);font-size:13px">
        ${convs.length ? 'No conversations match your search.' : 'No messages yet. Buyers who contact you will appear here.'}
      </div>`;
      return;
    }

    list.innerHTML = filtered.map((c) => {
      const name = c.other ? c.other.name : 'HomeSure user';
      const title = c.listing ? c.listing.title : name;
      const preview = previewOf(c.lastMessage);
      const thumb = c.listing ? HS.cover(c.listing) : HS.PLACEHOLDER_IMG;
      return `
        <div class="conv-item ${c.id === activeConvId ? 'active' : ''}"
             onclick="openConv('${c.id}')">
          <img class="conv-avatar" src="${esc(thumb)}" alt="${esc(title)}" />
          <div class="conv-info">
            <div class="conv-name">${esc(name)}</div>
            <div class="conv-preview">${esc(title.slice(0, 20))} · ${esc(preview.slice(0, 28))}${preview.length > 28 ? '…' : ''}</div>
          </div>
          <div class="conv-meta">
            <span class="conv-time">${esc(fmtDay(c.updatedAt))}</span>
            ${c.unread > 0 ? `<span class="conv-badge">${c.unread}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function previewOf(m) {
    if (!m) return '';
    if (m.type === 'viewing-request') return 'Viewing request';
    if (m.type === 'viewing-response') return 'Viewing response';
    if (m.type === 'payment-request' || m.type === 'payment_request') return '💳 Payment Request';
    if (m.type === 'payment-proof' || m.type === 'payment_proof') return '🧾 Payment Proof';
    if (m.type === 'refund-request') return '🔄 Refund Request';
    if (m.type === 'file-attachment') return '📎 Attachment';
    return m.text || '';
  }

  window.filterConvsSoon = hsDebounce(() => window.filterConvs(), 200);

  window.filterConvs = function () {
    const box = document.getElementById('convSearch');
    renderConvList(box ? box.value : '');
  };

  // ── Render Message Cards ───────────────────────────────────────────────────

  function renderPaymentRequestCard(m) {
    const p = m.paymentData || m.viewingData || {};
    const status = m.status || p.status || 'pending';
    const isPaid = status === 'paid' || status === 'confirmed';
    const isPendingConfirmation = status === 'pending_confirmation';

    let statusLabel = 'Awaiting Buyer Payment';
    let statusCls = 'pr-status-pending';
    if (isPaid) {
      statusLabel = 'Paid ✓';
      statusCls = 'pr-status-paid';
    } else if (isPendingConfirmation) {
      statusLabel = 'Proof Submitted';
      statusCls = 'pr-status-pending';
    }

    const methods = Array.isArray(p.methods) ? p.methods : ['QR Ph', 'GCash', 'Maya', 'Card'];

    return `
      <div class="msg-row seller">
        <div class="payment-request-card" id="pr-card-${esc(m.id)}">
          <div class="pr-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Payment Request
            <span class="pr-status ${statusCls}">${statusLabel}</span>
          </div>
          <div class="pr-property">${esc(p.propertyTitle || 'Rental Unit')}</div>
          ${p.purpose ? `<div style="font-size:12px;color:rgba(255,255,255,0.65);"><strong>Type:</strong> ${esc(formatPaymentType(p.purpose))}</div>` : ''}
          ${p.period ? `<div class="pr-period">Period: ${esc(p.period)}</div>` : ''}
          <div class="pr-amount">₱${Number(p.amount || 0).toLocaleString('en-PH')}</div>
          <div class="pr-methods">
            ${methods.map((method) => {
              const mStr = String(method);
              const cls = mStr.toLowerCase().includes('gcash') ? 'pr-gcash' : mStr.toLowerCase().includes('maya') ? 'pr-maya' : 'pr-bank';
              return `<span class="pr-method-pill ${cls}">${esc(mStr)}</span>`;
            }).join('')}
          </div>
          <div class="pr-action">
            ${isPaid
              ? `<div class="pr-done">Payment Received &amp; Confirmed ✓</div>`
              : isPendingConfirmation
                ? `<div class="pr-waiting">Proof received from buyer · Review below</div>`
                : `<div class="pr-waiting">Waiting for buyer payment…</div>`
            }
          </div>
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderProofCard(m) {
    const p = m.paymentData || m.viewingData || {};
    const status = m.status || p.status || 'pending';
    const isPending = status === 'pending' || status === 'pending_confirmation';
    const isConfirmed = status === 'confirmed' || status === 'paid';
    const isRejected = status === 'rejected';

    const statusMap = {
      pending:              { label: 'Action Required', cls: 'pr-status-pending' },
      pending_confirmation: { label: 'Action Required', cls: 'pr-status-pending' },
      paid:                 { label: 'Confirmed ✓',    cls: 'pr-status-done' },
      confirmed:            { label: 'Confirmed ✓',    cls: 'pr-status-done' },
      rejected:             { label: 'Rejected',       cls: 'pr-status-rej' },
    };
    const s = statusMap[status] || statusMap.pending;

    return `
      <div class="msg-row buyer">
        <div class="payment-request-card proof-card" id="proof-card-${esc(m.id)}">
          <div class="pr-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Proof of Payment
            <span class="pr-status ${s.cls}">${s.label}</span>
          </div>
          <div class="pr-property">${esc(p.propertyTitle || 'Payment Proof')}</div>
          <div class="pr-amount">₱${Number(p.amount || 0).toLocaleString('en-PH')}</div>
          <div class="proof-detail-row">
            <span class="proof-detail-label">Method</span>
            <span class="proof-detail-val">${esc(p.method || 'Online Payment')}</span>
          </div>
          ${p.period ? `
            <div class="proof-detail-row">
              <span class="proof-detail-label">Period</span>
              <span class="proof-detail-val">${esc(p.period)}</span>
            </div>` : ''}
          ${p.reference ? `
            <div class="proof-detail-row">
              <span class="proof-detail-label">Reference</span>
              <span class="proof-detail-val" style="font-family:monospace;font-size:11px;">${esc(p.reference)}</span>
            </div>` : ''}
          ${p.proofUrl ? `
            <div style="margin-top:6px;">
              <a href="${esc(p.proofUrl)}" target="_blank" rel="noopener noreferrer" class="proof-file-chip" style="text-decoration:none;display:inline-flex;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Attached Receipt
              </a>
            </div>` : ''}
          ${isPending ? `
            <div class="proof-actions">
              <button class="proof-btn proof-btn-confirm" onclick="confirmPaymentProof('${esc(m.id)}', '${esc(p.paymentId || '')}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm
              </button>
              <button class="proof-btn proof-btn-reject" onclick="openRejectModal('${esc(m.id)}', '${esc(p.paymentId || '')}', ${p.amount || 0})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject &amp; Refund
              </button>
            </div>
          ` : isConfirmed ? `
            <div class="pr-done" style="margin-top:4px;">Confirmed — Marked as Paid ✓</div>
          ` : isRejected ? `
            <div style="font-size:12px;color:#f87171;font-weight:700;text-align:center;padding:6px 0;">Rejected — Refund Triggered</div>
          ` : ''}
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderRefundCard(m) {
    const p = m.paymentData || m.viewingData || {};
    const status = m.status || p.status || 'requested';
    const statusMap = {
      requested:  { label: 'Refund Requested', cls: 'pr-status-pending' },
      processing: { label: 'Processing',       cls: 'pr-status-pending' },
      completed:  { label: 'Refunded ✓',       cls: 'pr-status-done' },
      rejected:   { label: 'Rejected',         cls: 'pr-status-rej' },
    };
    const s = statusMap[status] || statusMap.requested;

    return `
      <div class="msg-row buyer">
        <div class="payment-request-card refund-card">
          <div class="pr-header" style="color:#fbbf24;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Refund Request from Buyer
            <span class="pr-status ${s.cls}">${s.label}</span>
          </div>
          <div class="pr-property">${esc(p.propertyTitle || 'Property Refund')}</div>
          <div class="pr-amount" style="color:#fbbf24;">₱${Number(p.amount || 0).toLocaleString('en-PH')}</div>
          <div class="proof-detail-row">
            <span class="proof-detail-label">Destination</span>
            <span class="proof-detail-val">${esc(p.bankCode || 'E-Wallet')} (${esc(p.accountNo || '***')})</span>
          </div>
          ${p.reason ? `
            <div class="proof-detail-row" style="align-items:flex-start;">
              <span class="proof-detail-label">Reason</span>
              <span class="proof-detail-val" style="font-size:11.5px;max-width:180px;text-align:right;">${esc(p.reason)}</span>
            </div>` : ''}
          <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:6px;line-height:1.4;">
            💡 Buyer requested a refund. In Escrow, HomeSure holds funds safely and coordinates disbursement back to the buyer.
          </div>
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderFileAttachment(m, me) {
    const d = m.viewingData || {};
    const isImage = d.fileType && d.fileType.startsWith('image/');
    const mine = m.senderId === me;
    const side = mine ? 'seller' : 'buyer';

    return `
      <div class="msg-row ${side}">
        <div class="msg-bubble" style="padding:10px;">
          ${isImage ? `
            <a href="${esc(d.fileUrl)}" target="_blank" rel="noopener noreferrer">
              <img src="${esc(d.fileUrl)}" alt="Attachment" style="max-width:240px;max-height:200px;border-radius:8px;display:block;margin-bottom:6px;object-fit:cover;" />
            </a>
          ` : `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style="font-size:12.5px;font-weight:600;">${esc(d.fileName || 'Attachment')}</span>
            </div>
          `}
          ${m.text && m.text !== d.fileName ? `<div style="font-size:13px;margin-top:4px;">${esc(m.text)}</div>` : ''}
          ${!isImage && d.fileUrl ? `
            <a href="${esc(d.fileUrl)}" target="_blank" download="${esc(d.fileName || 'download')}" style="font-size:11.5px;color:var(--teal);text-decoration:underline;">Download File</a>
          ` : ''}
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  // Viewing request cards
  function renderViewingRequestCard(m, side) {
    const d = m.viewingData || {};
    const req = viewings.find((v) => v.id === m.viewingRequestId);
    const status = req ? req.status : (m.status || 'pending');
    const when = [fmtDate(d.requestedDate), fmtClock(d.requestedTime)].filter(Boolean).join(' at ');

    const actions = status === 'pending' && m.viewingRequestId
      ? `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
           <button class="pr-pay-btn" onclick="answerViewing('${m.viewingRequestId}','confirmed')">Confirm</button>
           <button class="pr-pay-btn" style="background:transparent;border:1px solid var(--border);color:var(--text)"
                   onclick="answerViewing('${m.viewingRequestId}','declined')">Decline</button>
         </div>`
      : `<div style="font-size:11px;margin-top:8px;text-transform:capitalize;opacity:.75">${esc(status)}</div>`;

    return `
      <div class="msg-row ${side}">
        <div class="msg-bubble" style="border-left:3px solid var(--teal)">
          <div style="font-weight:700;margin-bottom:4px">Viewing request</div>
          ${d.listingTitle ? `<div style="font-size:12px;opacity:.8">${esc(d.listingTitle)}</div>` : ''}
          ${when ? `<div style="font-size:12px;margin-top:2px">${esc(when)}</div>` : ''}
          ${d.buyerNotes ? `<div style="font-size:12px;margin-top:6px;opacity:.85">${esc(d.buyerNotes)}</div>` : ''}
          ${actions}
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderViewingResponseCard(m, side) {
    const d = m.viewingData || {};
    const proposed = [fmtDate(d.proposedDate), fmtClock(d.proposedTime)].filter(Boolean).join(' at ');
    return `
      <div class="msg-row ${side}">
        <div class="msg-bubble" style="border-left:3px solid var(--teal)">
          <div style="font-weight:700;margin-bottom:4px">Viewing response</div>
          ${d.listingTitle ? `<div style="font-size:12px;opacity:.8">${esc(d.listingTitle)}</div>` : ''}
          ${proposed ? `<div style="font-size:12px;margin-top:2px">New time: ${esc(proposed)}</div>` : ''}
          ${d.sellerNotes ? `<div style="font-size:12px;margin-top:6px;opacity:.85">${esc(d.sellerNotes)}</div>` : ''}
          ${m.status ? `<div style="font-size:11px;margin-top:6px;text-transform:capitalize;opacity:.7">${esc(m.status)}</div>` : ''}
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  // ── Dispatch message rendering ─────────────────────────────────────────────
  function renderMessage(m, me) {
    const mine = m.senderId === me;
    const side = mine ? 'seller' : 'buyer';

    if (m.type === 'payment-request' || m.type === 'payment_request') {
      return renderPaymentRequestCard(m);
    }
    if (m.type === 'payment-proof' || m.type === 'payment_proof') {
      return renderProofCard(m);
    }
    if (m.type === 'refund-request') {
      return renderRefundCard(m);
    }
    if (m.type === 'file-attachment') {
      return renderFileAttachment(m, me);
    }
    if (m.type === 'viewing-request') {
      return renderViewingRequestCard(m, side);
    }
    if (m.type === 'viewing-response') {
      return renderViewingResponseCard(m, side);
    }

    return `
      <div class="msg-row ${side}">
        <div class="msg-bubble">${esc(m.text)}</div>
        <div class="msg-time">
          ${esc(fmtTime(m.timestamp))}
          ${mine && m.read ? iconCheck2 : ''}
        </div>
      </div>`;
  }

  // ── Answer a viewing request ───────────────────────────────────────────────
  window.answerViewing = async function (viewingId, status) {
    if (status === 'declined' && !confirm('Decline this viewing request?')) return;
    try {
      const updated = await HS.viewing.respond(viewingId, { status });
      const i = viewings.findIndex((v) => v.id === viewingId);
      if (i >= 0) Object.assign(viewings[i], updated); else viewings.push(updated);
      hsToast(status === 'confirmed' ? 'Viewing confirmed. The buyer has been notified.'
                                     : 'Viewing declined. The buyer has been notified.');
      await reload(activeConvId);
    } catch (err) {
      hsToast('Could not send your answer: ' + err.message, 'error');
    }
  };

  // ── Open a conversation ────────────────────────────────────────────────────
  window.openConv = async function (otherId) {
    activeConvId = otherId;
    const c = convs.find((x) => x.id === otherId);
    if (!c) return;

    const me = user.id;
    const name = c.other ? c.other.name : 'HomeSure user';
    const l = c.listing;
    const isRent = l && l.listingFor === 'rent';
    const price = l ? '₱' + Number(l.price).toLocaleString('en-PH') : '';

    let lastDay = '';
    const messagesHtml = c.messages.map((m) => {
      const day = fmtDay(m.timestamp);
      const divider = day !== lastDay ? `<div class="msg-date-divider">${esc(day)}</div>` : '';
      lastDay = day;
      return divider + renderMessage(m, me);
    }).join('');

    const iconBack = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

    document.getElementById('chatPanel').innerHTML = `
      <div class="chat-header">
        <button class="chat-back-btn" onclick="closeMobileChat()" aria-label="Back">${iconBack}</button>
        <img class="chat-header-img" src="${esc(l ? HS.cover(l) : HS.PLACEHOLDER_IMG)}" alt="${esc(l ? l.title : name)}" />
        <div class="chat-header-info">
          <div class="chat-header-title">${esc(name)}</div>
          <div class="chat-header-seller">${c.other && c.other.verified ? iconVerify : ''} ${esc(l ? l.title : '')}</div>
        </div>
        <div class="chat-header-price">
          ${esc(price)}
          ${isRent ? `<span>/month</span>` : ''}
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">${messagesHtml}</div>

      <div class="chat-input-area">
        <div class="chat-attach-wrap">
          <button class="chat-input-btn" id="attachBtn" title="Attach / Request Payment / Refund" onclick="toggleAttachMenu(event)">${iconClip}</button>
          <div class="chat-attach-menu" id="chatAttachMenu" style="display:none;">
            <button type="button" class="attach-menu-item" onclick="openPayReqModal()">
              <div class="attach-item-icon" style="background:rgba(0,201,167,0.15);color:#00c9a7;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Request Payment</div>
                <div class="attach-item-desc">Send rent or deposit request to buyer</div>
              </div>
            </button>
            <button type="button" class="attach-menu-item" onclick="openSellerRefundInfo()">
              <div class="attach-item-icon" style="background:rgba(251,191,36,0.15);color:#fbbf24;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Refund &amp; Escrow</div>
                <div class="attach-item-desc">View buyer refunds &amp; deposit info</div>
              </div>
            </button>
            <button type="button" class="attach-menu-item" onclick="triggerFileInput()">
              <div class="attach-item-icon" style="background:rgba(99,102,241,0.15);color:#818cf8;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Attach File / Photo</div>
                <div class="attach-item-desc">Share lease agreement, document, or image</div>
              </div>
            </button>
          </div>
        </div>
        <button class="chat-pay-req-btn" onclick="openPayReqModal()" title="Send Payment Request">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Request Payment
        </button>
        <input class="chat-input" id="chatInput" placeholder="Type a message..."
               onkeydown="if(event.key==='Enter') sendMessage('${c.id}')" />
        <button class="chat-send-btn" onclick="sendMessage('${c.id}')">${iconSend}</button>
      </div>
    `;

    const layout = document.querySelector('.messages-layout');
    if (layout) layout.classList.add('chat-open');
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    if (c.unread > 0) {
      try {
        await HS.messages.markRead(otherId);
        c.messages.forEach((m) => { if (m.receiverId === me) m.read = true; });
        c.unread = 0;
        renderConvList(document.getElementById('convSearch')?.value || '');
      } catch (err) {
        console.error('Could not mark messages read:', err);
      }
    }
  };

  window.closeMobileChat = function () {
    const layout = document.querySelector('.messages-layout');
    if (layout) layout.classList.remove('chat-open');
    activeConvId = null;
    renderConvList(document.getElementById('convSearch')?.value || '');
  };

  // ── Send Standard Text Message ─────────────────────────────────────────────
  window.sendMessage = async function (otherId) {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const c = convs.find((x) => x.id === otherId);
    if (!c) return;

    input.value = '';
    input.disabled = true;

    try {
      const sent = await HS.messages.send({
        to: otherId,
        body: text,
        propertyId: c.listing ? c.listing.id : null,
      });
      c.messages.push(sent);
      c.lastMessage = sent;
      c.updatedAt = sent.timestamp;

      const msgs = document.getElementById('chatMessages');
      if (msgs) {
        msgs.insertAdjacentHTML('beforeend', renderMessage(sent, user.id));
        msgs.scrollTop = msgs.scrollHeight;
      }
      renderConvList(document.getElementById('convSearch')?.value || '');
    } catch (err) {
      input.value = text;
      hsToast('Could not send: ' + err.message, 'error');
    } finally {
      input.disabled = false;
      input.focus();
    }
  };

  // ── Attach Menu Toggle ─────────────────────────────────────────────────────
  window.toggleAttachMenu = function (e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('chatAttachMenu');
    if (!menu) return;
    menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'flex' : 'none';
  };

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('chatAttachMenu');
    if (menu && menu.style.display !== 'none' && !e.target.closest('.chat-attach-wrap')) {
      menu.style.display = 'none';
    }
  });

  // ── Payment Request Modal Logic ────────────────────────────────────────────
  window.openPayReqModal = function () {
    const menu = document.getElementById('chatAttachMenu');
    if (menu) menu.style.display = 'none';

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) {
      hsToast('Please select a conversation first.', 'error');
      return;
    }

    const modal = document.getElementById('payReqModal');
    if (!modal) return;

    const l = c.listing;
    const propNameEl = document.getElementById('prPropertyName');
    if (propNameEl) propNameEl.textContent = l ? l.title : 'Rental Property';

    const amountInput = document.getElementById('prAmount');
    if (amountInput && l && l.price) {
      amountInput.value = l.price;
    }

    const periodInput = document.getElementById('prPeriod');
    if (periodInput && !periodInput.value) {
      const now = new Date();
      periodInput.value = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    }

    // Toggle handlers for method checkboxes
    const gcashCheck = document.getElementById('enableGcash');
    const mayaCheck = document.getElementById('enableMaya');
    const gcashNum = document.getElementById('gcashNumber');
    const gcashName = document.getElementById('gcashName');
    const mayaNum = document.getElementById('mayaNumber');
    const mayaName = document.getElementById('mayaName');

    if (gcashCheck && gcashNum) {
      gcashCheck.onchange = () => {
        const d = gcashCheck.checked ? 'block' : 'none';
        gcashNum.style.display = d;
        if (gcashName) gcashName.style.display = d;
      };
    }
    if (mayaCheck && mayaNum) {
      mayaCheck.onchange = () => {
        const d = mayaCheck.checked ? 'block' : 'none';
        mayaNum.style.display = d;
        if (mayaName) mayaName.style.display = d;
      };
    }

    modal.style.display = 'flex';
  };

  window.closePayReqModal = function () {
    const modal = document.getElementById('payReqModal');
    if (modal) modal.style.display = 'none';
  };

  window.sendPaymentRequest = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;

    const paymentType = document.getElementById('prPaymentType').value;
    const amount = parseFloat(document.getElementById('prAmount').value);
    const period = document.getElementById('prPeriod').value.trim();

    if (!paymentType) {
      hsToast('Please select a payment type.', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      hsToast('Please enter a valid amount.', 'error');
      return;
    }
    if (!period) {
      hsToast('Please enter the period / month.', 'error');
      return;
    }

    const methods = ['QR Ph'];
    const gcashCheck = document.getElementById('enableGcash');
    const mayaCheck = document.getElementById('enableMaya');
    const cardCheck = document.getElementById('enableCard');

    if (gcashCheck && gcashCheck.checked) methods.push('GCash');
    if (mayaCheck && mayaCheck.checked) methods.push('Maya');
    if (cardCheck && cardCheck.checked) methods.push('Bank Transfer / Card');

    try {
      const propTitle = c.listing ? c.listing.title : 'Property Rental';
      const sent = await HS.messages.send({
        to: activeConvId,
        body: `Payment request for ${period}: ₱${Number(amount).toLocaleString('en-PH')} (${formatPaymentType(paymentType)})`,
        propertyId: c.listing ? c.listing.id : null,
        status: 'pending',
        data: {
          messageType: 'payment-request',
          propertyTitle: propTitle,
          purpose: paymentType,
          amount: amount,
          period: period,
          methods: methods,
          status: 'pending',
        },
      });

      c.messages.push(sent);
      c.lastMessage = sent;
      c.updatedAt = sent.timestamp;

      closePayReqModal();
      window.openConv(activeConvId);
      hsToast('Payment request sent to buyer!', 'success');
    } catch (err) {
      hsToast('Could not send payment request: ' + err.message, 'error');
    }
  };

  // ── Confirm Payment Proof ──────────────────────────────────────────────────
  window.confirmPaymentProof = async function (msgId, paymentId) {
    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;
    const msg = c.messages.find((m) => m.id === msgId);

    try {
      if (paymentId) {
        await HS.payments.confirm(paymentId);
      }
      await HS.messages.updateMessage(msgId, {
        status: 'confirmed',
        data: { ...(msg ? msg.viewingData : {}), status: 'confirmed' },
      });

      if (msg) {
        msg.status = 'confirmed';
        if (msg.paymentData) msg.paymentData.status = 'confirmed';
      }

      // Send confirmation notice in chat
      await HS.messages.send({
        to: activeConvId,
        body: 'Payment received and confirmed! Thank you.',
        propertyId: c.listing ? c.listing.id : null,
      });

      await reload(activeConvId);
      hsToast('Payment confirmed successfully!', 'success');
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      hsToast('Could not confirm payment: ' + err.message, 'error');
    }
  };

  // ── Reject Payment Proof & Initiate Refund ─────────────────────────────────
  window.openRejectModal = function (msgId, paymentId, amount) {
    currentRejectMsgId = msgId;
    currentRejectPaymentId = paymentId;
    currentRejectAmount = amount || 0;

    const modal = document.getElementById('rejectConfirmModal');
    if (!modal) return;

    const amtEl = modal.querySelector('strong');
    if (amtEl) amtEl.textContent = '₱' + Number(amount || 0).toLocaleString('en-PH');

    modal.style.display = 'flex';
  };

  window.closeRejectModal = function () {
    const modal = document.getElementById('rejectConfirmModal');
    if (modal) modal.style.display = 'none';
    currentRejectMsgId = null;
    currentRejectPaymentId = null;
    currentRejectAmount = 0;
  };

  window.proceedReject = async function () {
    const msgId = currentRejectMsgId;
    const paymentId = currentRejectPaymentId;
    const amount = currentRejectAmount;

    const c = convs.find((x) => x.id === activeConvId);
    const msg = c ? c.messages.find((m) => m.id === msgId) : null;

    closeRejectModal();

    try {
      if (paymentId) {
        await HS.payments.reject(paymentId, 'Seller rejected proof. Auto-refund initiated to buyer.');
      }
      if (msgId) {
        await HS.messages.updateMessage(msgId, {
          status: 'rejected',
          data: { ...(msg ? msg.viewingData : {}), status: 'rejected' },
        });
      }

      if (msg) {
        msg.status = 'rejected';
        if (msg.paymentData) msg.paymentData.status = 'rejected';
      }

      // Post rejection & refund notice into the chat
      if (c) {
        await HS.messages.send({
          to: activeConvId,
          body: `Payment proof of ₱${Number(amount).toLocaleString('en-PH')} was rejected by the seller. The refund process has been initiated.`,
          propertyId: c.listing ? c.listing.id : null,
        });
      }

      await reload(activeConvId);
      hsToast('Payment rejected and refund process initiated.', 'info');
    } catch (err) {
      console.error('Failed to reject payment:', err);
      hsToast('Could not process rejection: ' + err.message, 'error');
    }
  };

  // ── Refund Status from Attach Menu ─────────────────────────────────────────
  window.openSellerRefundInfo = async function () {
    const menu = document.getElementById('chatAttachMenu');
    if (menu) menu.style.display = 'none';

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;

    hsToast('Checking escrow and refunds for this tenant…', 'info');
    try {
      const deposits = await HS.deposits.list();
      const dep = deposits.find((d) => d.buyerId === activeConvId || (c.listing && d.listingId === c.listing.id));
      if (dep) {
        hsToast(`Security deposit: ₱${Number(dep.amount).toLocaleString('en-PH')} (Refundable: ₱${Number(dep.refundable).toLocaleString('en-PH')})`, 'info');
      } else {
        hsToast('No held security deposits found for this conversation.', 'info');
      }
    } catch (e) {
      hsToast('Refund & Escrow: HomeSure holds payments securely until confirmed.', 'info');
    }
  };

  // ── File / Photo Attachment ────────────────────────────────────────────────
  window.triggerFileInput = function () {
    const menu = document.getElementById('chatAttachMenu');
    if (menu) menu.style.display = 'none';

    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) fileInput.click();
  };

  window.handleFileSelect = async function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;

    if (file.size > 10 * 1024 * 1024) {
      hsToast('File is too large. Please select a file smaller than 10MB.', 'error');
      e.target.value = '';
      return;
    }

    hsToast('Uploading attachment…', 'info');

    try {
      const path = await HS.storage.upload('listing-images', file, 'seller-chat-attachment');
      const publicUrl = supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl;

      const fileMsg = await HS.messages.send({
        to: activeConvId,
        body: file.name,
        propertyId: c.listing ? c.listing.id : null,
        status: 'sent',
        data: {
          messageType: 'file-attachment',
          fileName: file.name,
          fileType: file.type,
          fileUrl: publicUrl,
        },
      });

      c.messages.push(fileMsg);
      c.lastMessage = fileMsg;
      c.updatedAt = fileMsg.timestamp;

      const msgs = document.getElementById('chatMessages');
      if (msgs) {
        msgs.insertAdjacentHTML('beforeend', renderMessage(fileMsg, user.id));
        msgs.scrollTop = msgs.scrollHeight;
      }
      renderConvList(document.getElementById('convSearch')?.value || '');
      hsToast('Attachment sent!', 'success');
    } catch (err) {
      console.error('Error uploading file attachment:', err);
      hsToast('Failed to upload attachment: ' + err.message, 'error');
    } finally {
      e.target.value = '';
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  function showEmptyState(message) {
    const chatPanel = document.getElementById('chatPanel');
    if (!chatPanel) return;
    chatPanel.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" style="opacity:0.3;margin-bottom:20px;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px;">${esc(message || 'No conversation selected')}</h3>
        <p style="font-size:13px;color:var(--muted);max-width:300px;">Select a conversation from the list to view messages</p>
      </div>`;
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  async function reload(keepOpen) {
    convs = await HS.messages.conversations();
    try { viewings = await HS.viewing.list(); } catch (e) { viewings = []; }
    renderConvList(document.getElementById('convSearch')?.value || '');
    if (keepOpen && convs.some((c) => c.id === keepOpen)) await window.openConv(keepOpen);
  }

  (async function init() {
    const list = document.getElementById('convList');
    if (list) list.innerHTML = `<div style="padding:28px 18px;text-align:center;color:var(--muted);font-size:13px">Loading…</div>`;
    showEmptyState();

    const wanted = new URLSearchParams(window.location.search).get('to');

    try {
      await reload(wanted || null);
    } catch (err) {
      console.error('Failed to load messages:', err);
      if (list) list.innerHTML = `<div style="padding:28px 18px;text-align:center;color:var(--muted);font-size:13px">Could not load your messages. Please try again.</div>`;
    }
  })();
})();
