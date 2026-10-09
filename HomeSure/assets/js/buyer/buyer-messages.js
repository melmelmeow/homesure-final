(function() {
  // DEMO MODE: Create test buyer session if not logged in
  let user = getSession();
  if (!user || user.role !== 'buyer') {
    // Create demo buyer session
    const demoUser = {
      id: 'usr-001',
      role: 'buyer',
      firstName: 'Maria',
      lastName: 'Cruz',
      email: 'maria.cruz@example.com',
      phone: '09171234567',
      verified: true,
      accountStatus: 'verified'
    };
    sessionStorage.setItem('homesure_user', JSON.stringify(demoUser));
    user = demoUser;
  }

  HomeSureSidebar.init({ activePage: 'messages' });
  HomeSureTopbar.init({ placeholder: 'Search messages...' });

  // ── Fake conversations ─────────────────────────────────────────────────────
  const CONVS = [
    {
      id: 'c1', listingId: 'prop-002', sellerId: 'usr-003', unread: 2, dateLabel: 'Feb 27',
      messages: [
        { from: 'buyer',  text: "Hi! I'm interested in this apartment. Is it still available?", time: '9:15 AM', read: true },
        { from: 'seller', text: 'Hello! Thank you for your interest. Yes, the unit is still available.', time: '9:45 AM' },
        { from: 'buyer',  text: 'Great! Can I schedule a viewing this weekend?', time: '10:00 AM', read: true },
        { from: 'seller', text: 'Sure! Saturday or Sunday works for me. What time do you prefer?', time: '10:05 AM' },
        { from: 'seller', text: 'We have agreed on ₱15,000/month. Here is your payment request for June:', time: '10:08 AM' },
        {
          from: 'seller', type: 'payment_request', time: '10:08 AM',
          payment: {
            id: 'PR-001', property: '1-Bedroom Apartment for Rent near Town Proper',
            period: 'June 2026', amount: 15000,
            paymentType: 'rent',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'pending', // pending | paid | confirmed
          },
        },
      ],
    },
    {
      id: 'c2', listingId: 'prop-003', sellerId: 'usr-003', unread: 0, dateLabel: 'Feb 26',
      messages: [
        { from: 'buyer',  text: 'Hello, is the house still available for viewing?', time: '2:00 PM', read: true },
        { from: 'seller', text: 'Yes it is! The property also includes a garden area, perfect for families.', time: '2:30 PM' },
        { from: 'buyer',  text: 'That sounds great. What is the earliest move-in date?', time: '2:45 PM', read: true },
        { from: 'seller', text: 'We can arrange move-in as early as next month.', time: '3:00 PM' },
      ],
    },
    {
      id: 'c3', listingId: 'prop-009', sellerId: 'usr-004', unread: 0, dateLabel: 'Feb 25',
      messages: [
        { from: 'buyer',  text: 'Is there a possibility of negotiating the price?', time: '11:00 AM', read: true },
        { from: 'seller', text: 'The price is fixed for now but I can include some appliances.', time: '11:20 AM' },
        { from: 'buyer',  text: 'Thank you for the information!', time: '11:35 AM', read: true },
      ],
    },
    {
      id: 'c4', listingId: 'prop-001', sellerId: 'usr-003', unread: 1, dateLabel: 'Today',
      messages: [
        { from: 'buyer',  text: "Good morning! I'd like to rent the studio unit.", time: '8:00 AM', read: true },
        { from: 'seller', text: "Perfect timing! It just became available. Rent is ₱8,000/month.", time: '8:15 AM' },
        { from: 'buyer',  text: 'Great! I can move in next week.', time: '8:20 AM', read: true },
        { from: 'seller', text: 'Excellent! Here is the payment request for your first month:', time: '8:25 AM' },
        {
          from: 'seller', type: 'payment_request', time: '8:25 AM',
          payment: {
            id: 'PR-002', property: 'Cozy Studio Apartment',
            period: 'June 2026', amount: 8000,
            paymentType: 'both',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'paid',
          },
        },
        {
          from: 'buyer', type: 'payment_proof', time: '8:40 AM',
          proof: {
            id: 'PROOF-002', reqId: 'PR-002',
            method: 'GCash', amount: 8000,
            period: 'June 2026',
            property: 'Cozy Studio Apartment',
            paymentType: 'both',
            fileName: 'gcash_payment_8000.jpg',
            ref: 'REF-GC8X2K',
            status: 'pending',
          },
        },
        { from: 'seller', text: 'Thanks! Let me verify the payment.', time: '8:45 AM' },
      ],
    },
    {
      id: 'c5', listingId: 'prop-006', sellerId: 'usr-003', unread: 0, dateLabel: 'Yesterday',
      messages: [
        { from: 'seller', text: 'Hi Maria! Your May rent has been confirmed. Here is the request for June:', time: '3:00 PM' },
        {
          from: 'seller', type: 'payment_request', time: '3:00 PM',
          payment: {
            id: 'PR-003', property: 'Modern 2BR Apartment',
            period: 'June 2026', amount: 12000,
            paymentType: 'security',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'confirmed',
          },
        },
        {
          from: 'buyer', type: 'payment_proof', time: '3:30 PM',
          proof: {
            id: 'PROOF-003', reqId: 'PR-003',
            method: 'Maya', amount: 12000,
            period: 'June 2026',
            property: 'Modern 2BR Apartment',
            paymentType: 'security',
            fileName: 'maya_receipt_june.jpg',
            ref: 'REF-MY5A9P',
            status: 'confirmed',
          },
        },
        { from: 'seller', text: 'Payment confirmed! Thank you Maria. See you next month!', time: '3:45 PM' },
        { from: 'buyer',  text: 'Thank you po!', time: '3:46 PM', read: true },
      ],
    },
  ];

  // ── Icons ──────────────────────────────────────────────────────────────────
  const iconCheck2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconSend   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const iconClip   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;

  const iconVerify = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  let activeConvId = null;

  // ── Render conversation list ───────────────────────────────────────────────
  function renderConvList(filter = '') {
    const list = document.getElementById('convList');
    const filtered = CONVS.filter(c => {
      const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
      const s = FAKE_USERS.find(x => x.id === c.sellerId);
      const q = filter.toLowerCase();
      return !q || (l && l.title.toLowerCase().includes(q)) || (s && (s.firstName + ' ' + s.lastName).toLowerCase().includes(q));
    });

    list.innerHTML = filtered.map(c => {
      const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
      const s = FAKE_USERS.find(x => x.id === c.sellerId);
      if (!l || !s) return '';
      const last = c.messages[c.messages.length - 1];
      const sellerName = s.firstName + ' ' + s.lastName;
      return `
        <div class="conv-item ${c.id === activeConvId ? 'active' : ''}"
             onclick="openConv('${c.id}')">
          <img class="conv-avatar" src="${l.images[0]}" alt="${l.title}" />
          <div class="conv-info">
            <div class="conv-name">
              ${l.title.length > 22 ? l.title.slice(0, 22) + '…' : l.title}
              <span class="conv-verified">${iconVerify}</span>
            </div>
            <div class="conv-preview">${sellerName} · ${(last.text || 'Payment activity').slice(0, 32)}${(last.text || 'Payment activity').length > 32 ? '…' : ''}</div>
          </div>
          <div class="conv-meta">
            <span class="conv-time">${c.dateLabel}</span>
            ${c.unread > 0 ? `<span class="conv-badge">${c.unread}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function filterConvs() {
    renderConvList(document.getElementById('convSearch').value);
  }

  // ── Format payment type label ──────────────────────────────────────────────
  function formatPaymentType(type) {
    const typeMap = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security + Rent'
    };
    return typeMap[type] || 'Payment';
  }

  // ── Payment Request Card (rendered inside chat) ───────────────────────────
  function renderPaymentRequestCard(m, convId) {
    const p = m.payment;
    const statusMap = {
      pending:   { label: 'Awaiting Payment',    cls: 'pr-status-pending' },
      paid:      { label: 'Proof Submitted',      cls: 'pr-status-paid'    },
      confirmed: { label: 'Confirmed — Paid ✓',   cls: 'pr-status-done'    },
    };
    const s = statusMap[p.status] || statusMap.pending;

    const methodIcons = { GCash: '💙', 'Bank Transfer': '🏦', Cash: '💵' };
    const methodPills = p.methods.map(me =>
      `<span class="pr-method-pill">${methodIcons[me] || ''} ${me}</span>`
    ).join('');

    const action = p.status === 'pending'
      ? `<button class="pr-pay-btn" onclick="payFromChat('${convId}','${p.id}')">Pay Now →</button>`
      : p.status === 'paid'
      ? `<div class="pr-waiting">Proof submitted — waiting for seller confirmation</div>`
      : `<div class="pr-done">Payment confirmed by seller</div>`;

    return `
      <div class="msg-row seller">
        <div class="payment-request-card">
          <div class="pr-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Payment Request
            <span class="pr-status ${s.cls}">${s.label}</span>
          </div>
          <div class="pr-property">${p.property}</div>
          ${p.paymentType ? `<div class="pr-type" style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;"><strong>Type:</strong> ${formatPaymentType(p.paymentType)}</div>` : ''}
          <div class="pr-period">Period: ${p.period}</div>
          <div class="pr-amount">₱${p.amount.toLocaleString('en-PH')}</div>
          <div class="pr-methods">${methodPills}</div>
          <div class="pr-action">${action}</div>
        </div>
        <div class="msg-time">${m.time}</div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // QRPH INTEGRATION - Pay from chat
  // ══════════════════════════════════════════════════════════════════════════════

  window.payFromChat = function (convId, paymentReqId) {
    // Get payment details from the message
    const c   = CONVS.find(x => x.id === convId);
    const msg = c?.messages.find(m => m.payment?.id === paymentReqId);

    if (!msg || !msg.payment) return;

    const payment = msg.payment;

    // Open QRPH payment modal
    PaymentIntegration.openPaymentModal({
      amount: payment.amount,
      listingTitle: payment.property,
      listingId: c.listingId,
      landlordId: c.sellerId,
      period: payment.period,
      paymentType: payment.paymentType,
      dueDate: new Date().toISOString().split('T')[0],
      onSuccess: function(transaction) {
        // Mark payment request as paid in the conversation
        payment.status = 'paid';

        // Add payment proof message to conversation
        const time = new Date().toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit'
        });

        c.messages.push({
          from: 'buyer',
          type: 'payment_proof',
          time: time,
          proof: {
            id: transaction.id,
            reqId: paymentReqId,
            method: transaction.method === 'gcash' ? 'GCash' :
                    transaction.method === 'paymaya' ? 'Maya' : 'Card',
            amount: transaction.amount,
            period: payment.period,
            property: payment.property,
            paymentType: payment.paymentType,
            fileName: 'QRPH_receipt.pdf',
            ref: transaction.reference,
            status: 'confirmed'
          }
        });

        // Refresh the chat view
        setTimeout(() => {
          window.openChat(convId);
        }, 2000);
      }
    });
    // QRPH modal opens automatically - no need to show old modal
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // OLD PROOF UPLOAD FLOW (COMMENTED OUT)
  // Now using QR Code / Gateway flow defined in messages.html inline script
  // ═══════════════════════════════════════════════════════════════════════════
  /*
  window.closeChatPayModal = function () {
    document.getElementById('chatPayModal').style.display = 'none';
  };

  window.selectChatMethod = function (method) {
    chatPayMethod = method;
    document.querySelectorAll('.chat-method-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('cmc-' + method).classList.add('selected');
    document.getElementById('chatNextBtn').disabled = false;
  };

  window.chatGoToProof = function () {
    if (!chatPayMethod) return;
    const labels = { gcash: 'GCash', maya: 'Maya', bpi: 'BPI Bank Transfer', cash: 'Cash' };
    document.getElementById('chatChosenMethod').textContent = labels[chatPayMethod] || chatPayMethod;
    document.getElementById('chatPayStep1').style.display = 'none';
    document.getElementById('chatPayStep2').style.display = '';
  };

  window.chatProofSelected = function (e) {
    chatPayProofName = e.target.files[0]?.name || null;
    document.getElementById('chatProofLabel').textContent =
      chatPayProofName || 'Tap to attach screenshot or photo';
    document.getElementById('chatSubmitBtn').disabled = !chatPayProofName;
  };

  window.submitChatPayment = function () {
    if (!chatPayMethod || !chatPayProofName || !chatPayConvId) return;

    const labels = { gcash: 'GCash', maya: 'Maya', bpi: 'BPI Bank Transfer', cash: 'Cash' };
    const methodLabel = labels[chatPayMethod];
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const ref  = 'REF-' + Math.random().toString(36).slice(2, 9).toUpperCase();

    const c   = CONVS.find(x => x.id === chatPayConvId);
    const req = c?.messages.find(m => m.payment?.id === chatPayReqId);

    // Mark the original request as paid
    if (req) req.payment.status = 'paid';

    // Push a payment_proof message into the conversation
    const proofMsg = {
      from: 'buyer', type: 'payment_proof', time,
      proof: {
        id:       'PROOF-' + Date.now(),
        reqId:    chatPayReqId,
        method:   methodLabel,
        amount:   req?.payment?.amount || 0,
        period:   req?.payment?.period || '',
        property: req?.payment?.property || '',
        fileName: chatPayProofName,
        ref,
        status:   'pending', // pending | confirmed | rejected
      },
    };
    c.messages.push(proofMsg);

    closeChatPayModal();

    // Append the proof card to the live chat messages
    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderProofCard(proofMsg);
      msgs.appendChild(wrapper.firstElementChild);
      msgs.scrollTop = msgs.scrollHeight;
    }

    // Re-render conv list so last message updates
    renderConvList(document.getElementById('convSearch').value);
  };
  */

  // ── Render proof card (buyer side — read-only, shows status) ─────────────
  function renderProofCard(m) {
    const p = m.proof;
    const statusMap = {
      pending:   { cls: 'pr-status-pending', label: 'Awaiting Seller Confirmation' },
      confirmed: { cls: 'pr-status-done',    label: 'Confirmed — Paid ✓'           },
      rejected:  { cls: 'pr-status-rej',     label: 'Rejected — Resubmit'          },
    };
    const s = statusMap[p.status] || statusMap.pending;
    return `
      <div class="msg-row buyer">
        <div class="payment-request-card proof-card">
          <div class="pr-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Proof of Payment
            <span class="pr-status ${s.cls}">${s.label}</span>
          </div>
          <div class="pr-property">${p.property}</div>
          ${p.paymentType ? `<div class="pr-type" style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;"><strong>Type:</strong> ${formatPaymentType(p.paymentType)}</div>` : ''}
          <div class="pr-period">Period: ${p.period}</div>
          <div class="pr-amount">₱${p.amount.toLocaleString('en-PH')}</div>
          <div class="proof-detail-row">
            <span class="proof-detail-label">Method</span>
            <span class="proof-detail-val">${p.method}</span>
          </div>
          <div class="proof-detail-row">
            <span class="proof-detail-label">Reference</span>
            <span class="proof-detail-val" style="font-family:monospace;font-size:12px;">${p.ref}</span>
          </div>
          <div class="proof-file-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${p.fileName}
          </div>
        </div>
        <div class="msg-time">${m.time}</div>
      </div>`;
  }

  // ── Open a conversation ────────────────────────────────────────────────────
  window.openConv = function(id) {
    activeConvId = id;
    const c = CONVS.find(x => x.id === id);
    const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
    const s = FAKE_USERS.find(x => x.id === c.sellerId);
    c.unread = 0;

    renderConvList(document.getElementById('convSearch').value);

    const isRent     = l.listingFor === 'rent';
    const price      = '₱' + l.price.toLocaleString('en-PH');
    const sellerName = s.firstName + ' ' + s.lastName;

    const messagesHtml = `
      <div class="msg-date-divider">${c.dateLabel}</div>` +
      c.messages.map(m => {
        if (m.type === 'payment_request') return renderPaymentRequestCard(m, id);
        return `
          <div class="msg-row ${m.from}">
            <div class="msg-bubble">${m.text}</div>
            <div class="msg-time">
              ${m.time}
              ${m.from === 'buyer' && m.read ? iconCheck2 : ''}
            </div>
          </div>`;
      }).join('');

    const iconBack = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

    document.getElementById('chatPanel').innerHTML = `
      <div class="chat-header">
        <button class="chat-back-btn" onclick="closeMobileChat()" aria-label="Back">${iconBack}</button>
        <img class="chat-header-img" src="${l.images[0]}" alt="${l.title}" />
        <div class="chat-header-info">
          <div class="chat-header-title">${l.title}</div>
          <div class="chat-header-seller">${iconVerify} ${sellerName}</div>
        </div>
        <div class="chat-header-price">
          ${price}
          ${isRent ? `<span>/month</span>` : ''}
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">${messagesHtml}</div>

      <div class="chat-input-area">
        <button class="chat-input-btn" title="Attach file">${iconClip}</button>
        <input class="chat-input" id="chatInput" placeholder="Type a message..."
               onkeydown="if(event.key==='Enter') sendMessage('${id}')" />
        <button class="chat-send-btn" onclick="sendMessage('${id}')">${iconSend}</button>
      </div>
    `;

    // Mobile: slide into chat view
    document.querySelector('.messages-layout').classList.add('chat-open');

    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  window.closeMobileChat = function() {
    document.querySelector('.messages-layout').classList.remove('chat-open');
    activeConvId = null;
    renderConvList(document.getElementById('convSearch').value);
  };

  // ── Send a message ─────────────────────────────────────────────────────────
  window.sendMessage = function(convId) {
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    if (!text) return;

    const c = CONVS.find(x => x.id === convId);
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    c.messages.push({ from: 'buyer', text, time, read: false });
    input.value = '';

    const msgs = document.getElementById('chatMessages');
    const row  = document.createElement('div');
    row.className = 'msg-row buyer';
    row.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Show empty state ───────────────────────────────────────────────────────
  function showEmptyState() {
    const chatPanel = document.getElementById('chatPanel');
    if (chatPanel) {
      chatPanel.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" style="opacity:0.3;margin-bottom:20px;">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h3 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px;">No conversation selected</h3>
          <p style="font-size:13px;color:var(--muted);max-width:300px;">Select a conversation from the list to view messages</p>
        </div>
      `;
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  renderConvList();
  showEmptyState();
})();
