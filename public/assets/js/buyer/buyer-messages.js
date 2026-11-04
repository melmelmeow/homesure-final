// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Buyer Messages
//  Depends on: config.js, session.js, data.js (HS.messages), sidebar.js, topbar.js
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const user = getSession();
  if (!user || user.role !== 'buyer') {
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
  let convs = [];            // from HS.messages.conversations()
  let activeConvId = null;   // the other person's id
  let buyerPaidPayments = []; // cached paid payments for refunds

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const fmtDay  = (iso) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

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
        ${convs.length ? 'No conversations match your search.' : 'No messages yet. Open a listing and message the seller.'}
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
            <div class="conv-name">
              ${esc(title.length > 22 ? title.slice(0, 22) + '…' : title)}
              ${c.other && c.other.verified ? `<span class="conv-verified">${iconVerify}</span>` : ''}
            </div>
            <div class="conv-preview">${esc(name)} · ${esc(preview.slice(0, 32))}${preview.length > 32 ? '…' : ''}</div>
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

  // ── Render Specific Message Cards ──────────────────────────────────────────

  function renderPaymentRequestCard(m) {
    const p = m.paymentData || m.viewingData || {};
    const status = m.status || p.status || 'pending';
    const isPaid = status === 'paid' || status === 'confirmed';
    const isPendingConfirmation = status === 'pending_confirmation';

    let statusLabel = 'Awaiting Payment';
    let statusCls = 'pr-status-pending';
    if (isPaid) {
      statusLabel = 'Paid ✓';
      statusCls = 'pr-status-paid';
    } else if (isPendingConfirmation) {
      statusLabel = 'Proof Submitted';
      statusCls = 'pr-status-pending';
    }

    const methods = Array.isArray(p.methods) ? p.methods : ['QR Ph', 'GCash', 'Maya', 'Bank Transfer'];

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
              ? `<div class="pr-done">Payment Completed ✓</div>`
              : isPendingConfirmation
                ? `<div class="pr-waiting">Proof submitted · Landlord confirming</div>`
                : `<button class="pr-pay-btn" onclick="payPaymentRequest('${esc(m.id)}')">Pay Now</button>`
            }
          </div>
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderProofCard(m) {
    const p = m.paymentData || m.viewingData || {};
    const status = m.status || p.status || 'pending';
    const statusMap = {
      pending:              { label: 'Awaiting Landlord Confirmation', cls: 'pr-status-pending' },
      pending_confirmation: { label: 'Awaiting Landlord Confirmation', cls: 'pr-status-pending' },
      paid:                 { label: 'Confirmed ✓',                   cls: 'pr-status-done' },
      confirmed:            { label: 'Confirmed ✓',                   cls: 'pr-status-done' },
      rejected:             { label: 'Rejected',                      cls: 'pr-status-rej' },
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
          <div class="pr-property">${esc(p.propertyTitle || 'Payment')}</div>
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
          ${status === 'confirmed' || status === 'paid' ? `
            <div class="pr-done" style="margin-top:4px;">Payment Confirmed ✓</div>
          ` : status === 'rejected' ? `
            <div style="font-size:12px;color:#f87171;font-weight:700;text-align:center;padding:6px 0;">Payment was rejected by landlord</div>
          ` : `
            <div class="pr-waiting">Waiting for landlord to confirm…</div>
          `}
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
      rejected:   { label: 'Refund Rejected',  cls: 'pr-status-rej' },
    };
    const s = statusMap[status] || statusMap.requested;

    return `
      <div class="msg-row buyer">
        <div class="payment-request-card refund-card">
          <div class="pr-header" style="color:#fbbf24;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Refund Request
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
          <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;line-height:1.4;">
            Held safely in Escrow. HomeSure verifies and returns funds upon review.
          </div>
        </div>
        <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
      </div>`;
  }

  function renderFileAttachment(m, me) {
    const d = m.viewingData || {};
    const isImage = d.fileType && d.fileType.startsWith('image/');
    const mine = m.senderId === me;
    const side = mine ? 'buyer' : 'seller';

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

  // ── Dispatch message rendering ─────────────────────────────────────────────
  function renderMessage(m, me) {
    const mine = m.senderId === me;
    const side = mine ? 'buyer' : 'seller';

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

    if (m.type === 'viewing-request' || m.type === 'viewing-response') {
      const d = m.viewingData || {};
      const when = [d.requestedDate || d.proposedDate, d.requestedTime || d.proposedTime].filter(Boolean).join(' at ');
      const notes = d.buyerNotes || d.sellerNotes;
      return `
        <div class="msg-row ${side}">
          <div class="msg-bubble" style="border-left:3px solid var(--teal)">
            <div style="font-weight:700;margin-bottom:4px">
              ${m.type === 'viewing-request' ? 'Viewing request' : 'Viewing response'}
            </div>
            ${d.listingTitle ? `<div style="font-size:12px;opacity:.8">${esc(d.listingTitle)}</div>` : ''}
            ${when ? `<div style="font-size:12px;margin-top:2px">${esc(when)}</div>` : ''}
            ${notes ? `<div style="font-size:12px;margin-top:6px;opacity:.85">${esc(notes)}</div>` : ''}
            ${m.status ? `<div style="font-size:11px;margin-top:6px;text-transform:capitalize;opacity:.7">${esc(m.status)}</div>` : ''}
          </div>
          <div class="msg-time">${esc(fmtTime(m.timestamp))}</div>
        </div>`;
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
          <div class="chat-header-title">${esc(l ? l.title : name)}</div>
          <div class="chat-header-seller">${c.other && c.other.verified ? iconVerify : ''} ${esc(name)}</div>
        </div>
        <div class="chat-header-price">
          ${esc(price)}
          ${isRent ? `<span>/month</span>` : ''}
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">${messagesHtml}</div>

      <div class="chat-input-area">
        <div class="chat-attach-wrap">
          <button class="chat-input-btn" id="attachBtn" title="Attach / Pay / Refund" onclick="toggleAttachMenu(event)">${iconClip}</button>
          <div class="chat-attach-menu" id="chatAttachMenu" style="display:none;">
            <button type="button" class="attach-menu-item" onclick="openPaymentModalFromChat()">
              <div class="attach-item-icon" style="background:rgba(0,201,167,0.15);color:#00c9a7;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Send Payment</div>
                <div class="attach-item-desc">Pay rent, deposit, or reservation via QR Ph or transfer</div>
              </div>
            </button>
            <button type="button" class="attach-menu-item" onclick="openRefundModalFromChat()">
              <div class="attach-item-icon" style="background:rgba(251,191,36,0.15);color:#fbbf24;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Request Refund</div>
                <div class="attach-item-desc">Request refund for a paid transaction</div>
              </div>
            </button>
            <button type="button" class="attach-menu-item" onclick="triggerFileInput()">
              <div class="attach-item-icon" style="background:rgba(99,102,241,0.15);color:#818cf8;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <div class="attach-item-text">
                <div class="attach-item-title">Attach File / Photo</div>
                <div class="attach-item-desc">Share proof receipt, document, or photo</div>
              </div>
            </button>
          </div>
        </div>
        <input class="chat-input" id="chatInput" placeholder="Type a message..."
               onkeydown="if(event.key==='Enter') sendMessage('${c.id}')" />
        <button class="chat-send-btn" onclick="sendMessage('${c.id}')">${iconSend}</button>
      </div>
    `;

    document.querySelector('.messages-layout').classList.add('chat-open');
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
    document.querySelector('.messages-layout').classList.remove('chat-open');
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

  // Close attach menu on click outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('chatAttachMenu');
    if (menu && menu.style.display !== 'none' && !e.target.closest('.chat-attach-wrap')) {
      menu.style.display = 'none';
    }
  });

  // ── Pay from Chat (Interacting with Payment Request) ────────────────────────
  window.payPaymentRequest = function (msgId) {
    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;
    const msg = c.messages.find((m) => m.id === msgId);
    if (!msg) return;
    const p = msg.paymentData || msg.viewingData || {};

    PaymentIntegration.openPaymentModal({
      propertyId: c.listing ? c.listing.id : null,
      listingTitle: c.listing ? c.listing.title : (p.propertyTitle || 'Property Rental'),
      amount: p.amount,
      purpose: p.purpose || 'rent',
      period: p.period,
      onSuccess: async function (payment) {
        try {
          const isAutoConfirmed = payment.status === 'confirmed' || payment.status === 'paid';
          const newStatus = isAutoConfirmed ? 'paid' : 'pending_confirmation';

          // 1. Update the original payment request message
          await HS.messages.updateMessage(msg.id, {
            status: newStatus,
            data: { ...p, status: newStatus, paymentId: payment.id },
          });
          msg.status = newStatus;
          if (msg.paymentData) msg.paymentData.status = newStatus;

          // 2. Resolve signed proof url if available
          let proofUrl = null;
          if (payment.proofPath) {
            try { proofUrl = await HS.payments.proofUrl(payment.proofPath); } catch (e) { /* ignore */ }
          }

          // 3. Post companion Proof of Payment message into chat
          const proofMsg = await HS.messages.send({
            to: activeConvId,
            body: isAutoConfirmed
              ? `Payment completed for ${p.period || 'rental'}: ₱${Number(payment.amount).toLocaleString('en-PH')} via ${payment.method || 'QR Ph'}`
              : `Payment proof submitted for ${p.period || 'rental'}: ₱${Number(payment.amount).toLocaleString('en-PH')} via ${payment.method || 'Direct transfer'}`,
            propertyId: c.listing ? c.listing.id : null,
            status: isAutoConfirmed ? 'confirmed' : 'pending',
            data: {
              messageType: 'payment-proof',
              paymentId: payment.id,
              propertyTitle: c.listing ? c.listing.title : (p.propertyTitle || 'Property'),
              amount: payment.amount,
              period: payment.period || p.period || '',
              method: payment.method || (isAutoConfirmed ? 'QRPH' : 'Manual'),
              reference: payment.reference || ('REF-' + (payment.id || '').slice(0, 8)),
              proofUrl: proofUrl,
              status: isAutoConfirmed ? 'confirmed' : 'pending',
            },
          });

          c.messages.push(proofMsg);
          c.lastMessage = proofMsg;
          c.updatedAt = proofMsg.timestamp;

          // Re-render conversation
          window.openConv(activeConvId);
          hsToast('Payment submitted successfully!', 'success');
        } catch (err) {
          console.error('Failed to post payment proof in chat:', err);
          hsToast('Payment recorded, but could not update chat: ' + err.message, 'error');
        }
      },
    });
  };

  // ── Proactive Payment from Attach Menu ─────────────────────────────────────
  window.openPaymentModalFromChat = function () {
    const menu = document.getElementById('chatAttachMenu');
    if (menu) menu.style.display = 'none';

    const c = convs.find((x) => x.id === activeConvId);
    if (!c || !c.listing) {
      hsToast('No listing associated with this conversation to pay for.', 'error');
      return;
    }

    PaymentIntegration.openPaymentModal({
      propertyId: c.listing.id,
      listingTitle: c.listing.title,
      amount: c.listing.price,
      purpose: c.listing.listingFor === 'rent' ? 'rent' : 'reservation',
      onSuccess: async function (payment) {
        try {
          const isAutoConfirmed = payment.status === 'confirmed' || payment.status === 'paid';
          let proofUrl = null;
          if (payment.proofPath) {
            try { proofUrl = await HS.payments.proofUrl(payment.proofPath); } catch (e) { /* ignore */ }
          }

          const proofMsg = await HS.messages.send({
            to: activeConvId,
            body: isAutoConfirmed
              ? `Payment completed: ₱${Number(payment.amount).toLocaleString('en-PH')} via ${payment.method || 'QR Ph'}`
              : `Payment proof submitted: ₱${Number(payment.amount).toLocaleString('en-PH')} via ${payment.method || 'Direct transfer'}`,
            propertyId: c.listing.id,
            status: isAutoConfirmed ? 'confirmed' : 'pending',
            data: {
              messageType: 'payment-proof',
              paymentId: payment.id,
              propertyTitle: c.listing.title,
              amount: payment.amount,
              period: payment.period || '',
              method: payment.method || (isAutoConfirmed ? 'QRPH' : 'Manual'),
              reference: payment.reference || ('REF-' + (payment.id || '').slice(0, 8)),
              proofUrl: proofUrl,
              status: isAutoConfirmed ? 'confirmed' : 'pending',
            },
          });

          c.messages.push(proofMsg);
          c.lastMessage = proofMsg;
          c.updatedAt = proofMsg.timestamp;

          window.openConv(activeConvId);
          hsToast('Payment submitted successfully!', 'success');
        } catch (err) {
          console.error('Failed to post payment proof:', err);
        }
      },
    });
  };

  // ── Refund Process from Attach Menu ────────────────────────────────────────
  window.openRefundModalFromChat = async function () {
    const menu = document.getElementById('chatAttachMenu');
    if (menu) menu.style.display = 'none';

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;

    const modal = document.getElementById('buyerRefundModal');
    if (!modal) return;

    const propEl = document.getElementById('refundPropertyName');
    if (propEl) propEl.textContent = c.listing ? c.listing.title : (c.other ? c.other.name : 'HomeSure Transaction');

    const select = document.getElementById('refundPaymentSelect');
    if (select) select.innerHTML = '<option value="">Loading your payments...</option>';

    modal.style.display = 'flex';

    try {
      const allPayments = await HS.payments.mine();
      // Filter payments for this property if propertyId is available
      const eligible = allPayments.filter((p) => {
        const isPaid = p.status === 'confirmed' || p.status === 'paid';
        if (!isPaid) return false;
        if (c.listing && p.listingId) return p.listingId === c.listing.id;
        return true;
      });

      buyerPaidPayments = eligible;

      if (!eligible.length) {
        if (select) {
          select.innerHTML = '<option value="">No confirmed payments found to refund</option>';
        }
        document.getElementById('refundAmount').value = '';
        document.getElementById('refundSubmitBtn').disabled = true;
        return;
      }

      document.getElementById('refundSubmitBtn').disabled = false;
      if (select) {
        select.innerHTML = '<option value="">Select a payment to refund</option>' +
          eligible.map((p) => `
            <option value="${esc(p.id)}">
              ₱${Number(p.amount).toLocaleString('en-PH')} - ${esc(p.period || p.purpose || 'Payment')} (${p.paidDate || String(p.createdAt || '').slice(0, 10)})
            </option>
          `).join('');
      }

      // Auto-select first payment
      if (select && select.options.length > 1) {
        select.selectedIndex = 1;
        window.onRefundPaymentChange();
      }
    } catch (err) {
      console.error('Failed to load eligible refund payments:', err);
      if (select) select.innerHTML = '<option value="">Failed to load payments</option>';
    }
  };

  window.onRefundPaymentChange = function () {
    const select = document.getElementById('refundPaymentSelect');
    if (!select) return;
    const paymentId = select.value;
    const p = buyerPaidPayments.find((x) => x.id === paymentId);
    if (p) {
      document.getElementById('refundAmount').value = p.amount;
    }
  };

  window.closeBuyerRefundModal = function () {
    const modal = document.getElementById('buyerRefundModal');
    if (modal) modal.style.display = 'none';
  };

  window.submitRefundRequest = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const c = convs.find((x) => x.id === activeConvId);
    if (!c) return;

    const paymentId = document.getElementById('refundPaymentSelect').value;
    const amount = parseFloat(document.getElementById('refundAmount').value);
    const bankCode = document.getElementById('refundBankCode').value;
    const accountNo = document.getElementById('refundAccountNo').value.trim();
    const reason = document.getElementById('refundReason').value.trim();

    if (!paymentId) {
      hsToast('Please select a payment to refund.', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      hsToast('Please enter a valid refund amount.', 'error');
      return;
    }
    if (!accountNo || !reason) {
      hsToast('Please fill in your account details and reason.', 'error');
      return;
    }

    const btn = document.getElementById('refundSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    try {
      const res = await HS.refunds.request({
        paymentId,
        propertyId: c.listing ? c.listing.id : null,
        amount,
        destinationAccountNo: accountNo,
        destinationBankCode: bankCode,
        reason,
      });

      // Post refund request card into chat
      const refundMsg = await HS.messages.send({
        to: activeConvId,
        body: `Refund requested: ₱${Number(amount).toLocaleString('en-PH')} for ${c.listing ? c.listing.title : 'property'}. Reason: ${reason}`,
        propertyId: c.listing ? c.listing.id : null,
        status: 'requested',
        data: {
          messageType: 'refund-request',
          refundId: res.refund ? res.refund.id : null,
          paymentId: paymentId,
          propertyTitle: c.listing ? c.listing.title : 'Property',
          amount: amount,
          bankCode: bankCode,
          accountNo: accountNo,
          reason: reason,
          status: 'requested',
        },
      });

      c.messages.push(refundMsg);
      c.lastMessage = refundMsg;
      c.updatedAt = refundMsg.timestamp;

      closeBuyerRefundModal();
      window.openConv(activeConvId);
      hsToast('Refund request submitted! Both you and the seller can see this in chat.', 'success');
    } catch (err) {
      hsToast('Could not submit refund request: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Refund Request';
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
      // Upload to listing-images bucket
      const path = await HS.storage.upload('listing-images', file, 'chat-attachment');
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

  // Backward compatibility hook
  window.payFromChat = function () {
    window.openPaymentModalFromChat();
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  (async function load() {
    const list = document.getElementById('convList');
    if (list) list.innerHTML = `<div style="padding:28px 18px;text-align:center;color:var(--muted);font-size:13px">Loading…</div>`;
    showEmptyState();

    try {
      convs = await HS.messages.conversations();
    } catch (err) {
      console.error('Failed to load messages:', err);
      if (list) list.innerHTML = `<div style="padding:28px 18px;text-align:center;color:var(--muted);font-size:13px">Could not load your messages. Please try again.</div>`;
      return;
    }
    renderConvList();
  })();
})();
