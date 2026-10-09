// ══════════════════════════════════════════════════════════════════════════════
// HomeSure Seller Messages
// Where deals happen, viewings get scheduled, and "pls respond" is sent at 2AM
// ══════════════════════════════════════════════════════════════════════════════

(function() {
  // ────────────────────────────────────────────────────────────────────────
  // DEMO MODE: Auto-Login for Testing
  // Forgot to sign in? We got you fam. Here's Juan Santos.
  // ────────────────────────────────────────────────────────────────────────
  let user = getSession();
  if (!user || user.role !== 'seller') {
    // Instant seller transformation, no registration required
    const demoUser = {
      id: 'usr-003',
      role: 'seller',
      firstName: 'Juan',
      lastName: 'Santos',
      email: 'juan.santos@example.com',
      phone: '09187654321',
      verified: true,
      accountStatus: 'verified'
    };
    sessionStorage.setItem('homesure_user', JSON.stringify(demoUser));
    user = demoUser;
  }

  HomeSureSidebar.init({ activePage: 'messages' });
  HomeSureTopbar.init({ placeholder: 'Search messages...' });

  const sellerData = FAKE_USERS.find(u => u.id === user.id) || {};
  const isVerified = user.accountStatus === 'verified' || sellerData.accountStatus === 'verified';

  // ══════════════════════════════════════════════════════════════════════════
  // Fake Conversations
  // Realistic chat data for testing without actual buyers
  // (Spoiler: They all want viewings)
  // ══════════════════════════════════════════════════════════════════════════
  const CONVS = [
    // ★ NEW: Viewing Request Sample
    {
      id: 'c-viewing', listingId: 'prop-001', buyerName: 'Maria Santos', unread: 1, dateLabel: 'Today',
      messages: [
        { from: 'buyer', text: 'Hi! I saw your property listing. Is it still available?', time: '9:00 AM', read: true },
        { from: 'seller', text: 'Yes, it is! Would you like to schedule a viewing?', time: '10:30 AM' },
        {
          from: 'buyer', type: 'viewing_request', time: '10:35 AM',
          viewingRequest: {
            id: 'view-001',
            listingId: 'prop-001',
            listingTitle: '3-Bedroom House for Sale in Brgy. Poblacion',
            requestedDate: '2026-06-05',
            requestedTime: '14:00',
            buyerNotes: 'I would like to see the property this Friday afternoon.',
            status: 'pending' // pending, accepted, declined, counter-proposed
          }
        },
      ],
    },
    // ★ NEW: Viewing Request with Chat Flow + Counter-Proposal
    {
      id: 'c-viewing-counter', listingId: 'prop-001', buyerName: 'Jose Reyes', unread: 0, dateLabel: 'Feb 26',
      messages: [
        { from: 'buyer', text: 'Good morning! Is this house still for sale?', time: '8:15 AM', read: true },
        { from: 'seller', text: 'Good morning! Yes, it is. Would you like to view it?', time: '8:45 AM' },
        { from: 'buyer', text: 'Yes please! Can I see it tomorrow morning?', time: '8:50 AM', read: true },
        {
          from: 'buyer', type: 'viewing_request', time: '8:52 AM',
          viewingRequest: {
            id: 'view-counter-001',
            listingId: 'prop-001',
            listingTitle: '3-Bedroom House for Sale in Brgy. Poblacion',
            requestedDate: '2026-06-23',
            requestedTime: '09:00',
            buyerNotes: 'I prefer morning viewing if possible.',
            status: 'counter-proposed'
          }
        },
        { from: 'seller', text: 'I have another appointment at 9 AM. How about 11 AM instead? Same day.', time: '9:05 AM' },
        { from: 'buyer', text: 'Perfect! 11 AM works for me. See you tomorrow!', time: '9:10 AM', read: true },
        { from: 'seller', text: 'Great! Looking forward to it. See you at 11 AM 😊', time: '9:12 AM' },
      ],
    },
    // ★ NEW: Multi-unit apartment building - for testing adjust availability modal
    {
      id: 'c-multi-unit', listingId: 'prop-002', buyerName: 'John Dela Cruz', unread: 1, dateLabel: 'Today',
      messages: [
        { from: 'buyer',  text: "Hi! I'm interested in one of the units in your apartment building. How many units are still available?", time: '11:00 AM', read: true },
        { from: 'seller', text: "Hello John! We currently have 3 units available out of 8 total. All units are 1-bedroom with aircon.", time: '11:10 AM' },
        { from: 'buyer',  text: 'Perfect! I would like to rent one unit starting next month.', time: '11:15 AM', read: true },
        { from: 'seller', text: 'Great! Here is your payment request for June 2026:', time: '11:20 AM' },
        {
          from: 'seller', type: 'payment_request', time: '11:20 AM',
          payment: {
            id: 'PR-MULTI-001', property: '1-Bedroom Apartment Building (Multi-Unit)',
            period: 'June 2026', amount: 8000,
            paymentType: 'rent',
            methods: ['GCash', 'PayMaya', 'Card'],
            status: 'paid',
          },
        },
        {
          from: 'buyer', type: 'payment_proof', time: '11:45 AM',
          proof: {
            id: 'PROOF-MULTI-001', reqId: 'PR-MULTI-001',
            method: 'GCash', amount: 8000,
            period: 'June 2026',
            property: '1-Bedroom Apartment Building (Unit 5)',
            paymentType: 'rent',
            fileName: 'gcash_unit5_june2026.jpg',
            ref: 'REF-GC9M2X',
            status: 'pending', // ← Waiting for seller confirmation - will trigger adjust availability modal!
          },
        },
        { from: 'buyer',  text: 'Payment sent! I rented Unit 5. 😊', time: '11:46 AM', read: false },
      ],
    },
    {
      id: 'c1', listingId: 'prop-002', buyerName: 'Maria Santos', unread: 1, dateLabel: 'Today',
      messages: [
        { from: 'buyer',  text: "Hi! I'm interested in this apartment. Is it still available?", time: '9:45 AM', read: true },
        { from: 'seller', text: "Yes it is! It's available starting April 15.", time: '9:50 AM' },
        { from: 'seller', text: 'Here is your payment request for June 2026:', time: '10:05 AM' },
        {
          from: 'seller', type: 'payment_request', time: '10:05 AM',
          payment: {
            id: 'PR-001', property: '1-Bedroom Apartment for Rent near Town Proper',
            period: 'June 2026', amount: 15000,
            paymentType: 'rent',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'paid',
          },
        },
        // Buyer submitted proof — this is what appears after buyer uploads receipt
        {
          from: 'buyer', type: 'payment_proof', time: '10:22 AM',
          proof: {
            id: 'PROOF-001', reqId: 'PR-001',
            method: 'GCash', amount: 15000,
            period: 'June 2026',
            property: '1-Bedroom Apartment for Rent near Town Proper',
            paymentType: 'rent',
            fileName: 'gcash_receipt_june2026.jpg',
            ref: 'REF-AB3X9K',
            status: 'pending',
          },
        },
      ],
    },
    {
      id: 'c2', listingId: 'prop-001', buyerName: 'Jose Reyes', unread: 0, dateLabel: 'Feb 26',
      messages: [
        { from: 'buyer',  text: "Hello, I'm interested in the house in Pulong Yantok. What's the best price?", time: '9:15 AM', read: true },
        { from: 'seller', text: "We can discuss, it's open for negotiation.", time: '9:20 AM' },
        { from: 'buyer',  text: 'Thank you for the info!', time: '9:35 AM', read: true },
      ],
    },
    {
      id: 'c3', listingId: 'prop-006', buyerName: 'Carlo Mendoza', unread: 1, dateLabel: 'Feb 25',
      messages: [
        { from: 'buyer',  text: "Good day, I'd like to inquire about the studio in Sonoma.", time: 'Yesterday 3:10 PM', read: true },
        { from: 'seller', text: "Hello! It's fully furnished and available immediately.", time: 'Yesterday 3:22 PM' },
        { from: 'buyer',  text: 'Can I schedule a viewing?', time: 'Yesterday 3:45 PM', read: false },
      ],
    },
    {
      id: 'c4', listingId: 'prop-003', buyerName: 'Anna Reyes', unread: 0, dateLabel: 'Feb 24',
      messages: [
        { from: 'buyer',  text: 'Hello po! Interested ako sa 2BR apartment.', time: '10:00 AM', read: true },
        { from: 'seller', text: 'Hi Anna! Yes available pa. ₱12,000/month with parking.', time: '10:15 AM' },
        { from: 'buyer',  text: 'Perfect! When can I move in?', time: '10:20 AM', read: true },
        { from: 'seller', text: 'Anytime this week. Here is your payment request:', time: '10:25 AM' },
        {
          from: 'seller', type: 'payment_request', time: '10:25 AM',
          payment: {
            id: 'PR-004', property: 'Modern 2BR Apartment',
            period: 'June 2026', amount: 12000,
            paymentType: 'security',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'confirmed',
          },
        },
        {
          from: 'buyer', type: 'payment_proof', time: '11:00 AM',
          proof: {
            id: 'PROOF-004', reqId: 'PR-004',
            method: 'GCash', amount: 12000,
            period: 'June 2026',
            property: 'Modern 2BR Apartment',
            paymentType: 'security',
            fileName: 'gcash_12k_june.jpg',
            ref: 'REF-GC7M4P',
            status: 'confirmed',
          },
        },
        { from: 'seller', text: 'Received and confirmed! Welcome to the building Anna!', time: '11:10 AM' },
        { from: 'buyer',  text: 'Salamat po! See you this weekend.', time: '11:15 AM', read: true },
      ],
    },
    {
      id: 'c5', listingId: 'prop-009', buyerName: 'David Cruz', unread: 0, dateLabel: 'Feb 23',
      messages: [
        { from: 'buyer',  text: 'Available pa ba yung house and lot?', time: '2:00 PM', read: true },
        { from: 'seller', text: 'Yes po! ₱25,000/month. 3BR, 2 bath, with garage.', time: '2:10 PM' },
        { from: 'seller', text: 'Sending payment request for first month + deposit:', time: '2:15 PM' },
        {
          from: 'seller', type: 'payment_request', time: '2:15 PM',
          payment: {
            id: 'PR-005', property: 'Spacious Family Home',
            period: 'June 2026 + Deposit', amount: 50000,
            paymentType: 'both',
            methods: ['GCash', 'Bank Transfer', 'Cash'],
            status: 'pending',
          },
        },
        { from: 'buyer',  text: 'Ok po, let me check my budget first.', time: '2:30 PM', read: true },
      ],
    },
  ];

  // Make CONVS accessible globally for action handlers
  window.CONVS = CONVS;

  // ── Icons ──────────────────────────────────────────────────────────────────
  const iconCheck2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconSend   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const iconClip   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
  const iconVerify = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  let activeConvId = null;

  // ── Render conversation list ───────────────────────────────────────────────
  function renderConvList(filter = '') {
    const list = document.getElementById('convList');

    if (!isVerified) {
      list.innerHTML = '';
      return;
    }

    const filtered = CONVS.filter(c => {
      const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
      const q = filter.toLowerCase();
      return !q
        || c.buyerName.toLowerCase().includes(q)
        || (l && l.title.toLowerCase().includes(q));
    });

    list.innerHTML = filtered.map(c => {
      const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
      if (!l) return '';
      const last = c.messages[c.messages.length - 1];
      const previewText = last.text || 'Payment activity';
      return `
        <div class="conv-item ${c.id === activeConvId ? 'active' : ''}"
             onclick="openConv('${c.id}')">
          <img class="conv-avatar" src="${l.images[0]}" alt="${l.title}" />
          <div class="conv-info">
            <div class="conv-name">
              ${c.buyerName}
              <span class="conv-verified">${iconVerify}</span>
            </div>
            <div class="conv-preview">${l.title.length > 20 ? l.title.slice(0, 20) + '…' : l.title} · ${previewText.slice(0, 28)}${previewText.length > 28 ? '…' : ''}</div>
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

  // ── Render payment request card (seller's own sent card) ──────────────────
  function renderSellerPayReqCard(m) {
    const p = m.payment;
    const statusMap = {
      pending:   { cls: 'pr-status-pending', label: 'Awaiting Payment'   },
      paid:      { cls: 'pr-status-paid',    label: 'Proof Submitted'     },
      confirmed: { cls: 'pr-status-done',    label: 'Confirmed — Paid ✓' },
    };
    const s = statusMap[p.status] || statusMap.pending;
    return `
      <div class="msg-row seller">
        <div class="payment-request-card">
          <div class="pr-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Payment Request (sent)
            <span class="pr-status ${s.cls}">${s.label}</span>
          </div>
          <div class="pr-property">${p.property}</div>
          ${p.paymentType ? `<div class="pr-type" style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;"><strong>Type:</strong> ${formatPaymentType(p.paymentType)}</div>` : ''}
          <div class="pr-period">Period: ${p.period}</div>
          <div class="pr-amount">₱${p.amount.toLocaleString('en-PH')}</div>
        </div>
        <div class="msg-time">${m.time}</div>
      </div>`;
  }

  // ── Render buyer's proof card (seller side — with Confirm / Reject) ────────
  function renderProofCardSeller(m, convId) {
    const p = m.proof;
    const statusMap = {
      pending:   { cls: 'pr-status-pending', label: 'Proof Received — Action Required' },
      confirmed: { cls: 'pr-status-done',    label: 'Confirmed — Marked as Paid ✓'    },
      rejected:  { cls: 'pr-status-rej',     label: 'Rejected'                         },
    };
    const s = statusMap[p.status] || statusMap.pending;

    const actions = p.status === 'pending' ? `
      <div class="proof-actions">
        <button class="proof-btn proof-btn-confirm" onclick="confirmProof('${convId}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
          Confirm Receipt
        </button>
      </div>` : '';

    return `
      <div class="msg-row buyer" id="proof-card-${p.id}">
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
          ${actions}
        </div>
        <div class="msg-time">${m.time}</div>
      </div>`;
  }

  // ── Confirm / Reject proof ────────────────────────────────────────────────
  window.confirmProof = function (convId, proofId) {
    const c   = CONVS.find(x => x.id === convId);
    const msg = c?.messages.find(m => m.proof?.id === proofId);
    if (!msg) return;
    msg.proof.status = 'confirmed';

    // Also mark the original payment request as confirmed
    const req = c.messages.find(m => m.payment?.id === msg.proof.reqId);
    if (req) req.payment.status = 'confirmed';

    // Re-render just the proof card in place
    const card = document.getElementById('proof-card-' + proofId);
    if (card) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderProofCardSeller(msg, convId);
      card.replaceWith(wrapper.firstElementChild);
    }

    // Append a system confirmation message
    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      const row = document.createElement('div');
      row.className = 'msg-date-divider';
      row.style.cssText = 'color:#22c55e;font-weight:700;font-size:12px;';
      row.textContent = '✓ Payment confirmed. Transaction marked as Paid.';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TRIGGER MODAL: Adjust Availability (multi-unit) OR Close Listing (single unit)
    // ══════════════════════════════════════════════════════════════════════════════
    setTimeout(() => {
      const listing = FAKE_LISTINGS.find(l => l.id === c.listingId);

      if (listing && listing.hasMultipleUnits && listing.availableUnits > 0) {
        // Multi-unit property with available units → show adjust availability modal
        AdjustAvailabilityModal.open({
          listingId: listing.id,
          listingTitle: listing.title,
          totalUnits: listing.totalUnits,
          availableUnits: listing.availableUnits,
          onConfirm: (newAvailable) => {
            console.log(`✅ Availability updated after payment: ${newAvailable} units remaining`);
          }
        });
      } else {
        // Single unit OR no units left → show close listing modal
        CloseListingModal.openModal({
          listingId: c.listingId,
          listingTitle: msg.proof.property,
          tenantName: c.buyerName,
          period: msg.proof.period,
          amount: msg.proof.amount
        });
      }
    }, 2000); // 2 second delay so user can see the confirmation message
  };

  // Store pending rejection
  let pendingRejectConvId = null;
  let pendingRejectProofId = null;

  window.openRejectModal = function(convId, proofId) {
    pendingRejectConvId = convId;
    pendingRejectProofId = proofId;
    document.getElementById('rejectConfirmModal').style.display = 'flex';
  };

  window.closeRejectModal = function() {
    document.getElementById('rejectConfirmModal').style.display = 'none';
    pendingRejectConvId = null;
    pendingRejectProofId = null;
  };

  window.proceedReject = function() {
    if (pendingRejectConvId && pendingRejectProofId) {
      rejectProof(pendingRejectConvId, pendingRejectProofId);
    }
    closeRejectModal();
  };

  function rejectProof(convId, proofId) {
    const c   = CONVS.find(x => x.id === convId);
    const msg = c?.messages.find(m => m.proof?.id === proofId);
    if (!msg) return;
    msg.proof.status = 'rejected';

    const card = document.getElementById('proof-card-' + proofId);
    if (card) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderProofCardSeller(msg, convId);
      card.replaceWith(wrapper.firstElementChild);
    }

    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      const row = document.createElement('div');
      row.className = 'msg-date-divider';
      row.style.cssText = 'color:#f87171;font-weight:700;font-size:12px;';
      row.textContent = 'Proof rejected. Buyer will be notified to resubmit.';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }
  };

  // ── Open a conversation ────────────────────────────────────────────────────
  window.openConv = function(id) {
    console.log('openConv called with id:', id);
    activeConvId = id;
    const c = CONVS.find(x => x.id === id);
    if (!c) {
      console.error('Conversation not found:', id);
      return;
    }
    const l = FAKE_LISTINGS.find(x => x.id === c.listingId);
    if (!l) {
      console.error('Listing not found:', c.listingId);
      return;
    }
    c.unread = 0;

    // Show loading state
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;">
        <div style="text-align:center;">
          <div class="loading-spinner"></div>
          <p style="font-size:13px;color:var(--muted);margin-top:12px;">Loading conversation...</p>
        </div>
      </div>
    `;

    // Small delay for smooth transition
    setTimeout(() => {
      renderConvList(document.getElementById('convSearch').value);
      renderConversation(id, c, l);
    }, 150);
  };

  function renderConversation(id, c, l) {
    const isRent  = l.listingFor === 'rent';
    const price   = '₱' + l.price.toLocaleString('en-PH');

    const messagesHtml = `
      <div class="msg-date-divider">${c.dateLabel}</div>` +
      c.messages.map(m => {
        if (m.type === 'payment_request') return renderSellerPayReqCard(m);
        if (m.type === 'payment_proof')   return renderProofCardSeller(m, id);
        if (m.type === 'viewing_request') return renderViewingRequestCard(m, id);
        const side = m.from === 'seller' ? 'buyer' : 'seller';
        return `
          <div class="msg-row ${side}">
            <div class="msg-bubble">${m.text}</div>
            <div class="msg-time">
              ${m.time}
              ${m.from === 'seller' && m.read ? iconCheck2 : ''}
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
          <div class="chat-header-seller">${iconVerify} ${c.buyerName}</div>
        </div>
        <div class="chat-header-price">
          ${price}
          ${isRent ? `<span>/month</span>` : ''}
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">${messagesHtml}</div>

      <div class="chat-input-area">
        <button class="chat-pay-req-btn" onclick="openPayReqModal('${id}')" title="Send Payment Request">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Request
        </button>
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
  };

  // ── Send a message ─────────────────────────────────────────────────────────
  window.sendMessage = function(convId) {
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    if (!text) return;

    const c = CONVS.find(x => x.id === convId);
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    c.messages.push({ from: 'seller', text, time, read: false });
    input.value = '';

    const msgs = document.getElementById('chatMessages');
    const row  = document.createElement('div');
    row.className = 'msg-row buyer'; // seller messages on right
    row.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Payment Request (seller sends to buyer) ────────────────────────────────
  let payReqConvId = null;

  window.openPayReqModal = function (convId) {
    payReqConvId = convId;
    const c = CONVS.find(x => x.id === convId);
    const l = FAKE_LISTINGS.find(x => x.id === c?.listingId);
    if (l) {
      document.getElementById('prPropertyName').textContent = l.title;
      document.getElementById('prAmount').value = l.price;
    }
    const now = new Date();
    document.getElementById('prPeriod').value =
      now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    document.getElementById('payReqModal').style.display = 'flex';
  };

  window.closePayReqModal = function () {
    document.getElementById('payReqModal').style.display = 'none';
  };

  window.sendPaymentRequest = function (e) {
    e.preventDefault();
    const paymentType = document.getElementById('prPaymentType').value;
    const amount = parseInt(document.getElementById('prAmount').value, 10);
    const period = document.getElementById('prPeriod').value.trim();
    if (!paymentType || !amount || !period || !payReqConvId) return;

    const c = CONVS.find(x => x.id === payReqConvId);
    const l = FAKE_LISTINGS.find(x => x.id === c?.listingId);
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Push intro message
    const introMsg = { from: 'seller', text: `Here is your payment request for ${period}:`, time };
    c.messages.push(introMsg);

    // Push payment request card
    const prMsg = {
      from: 'seller', type: 'payment_request', time,
      payment: {
        id: 'PR-' + Date.now(),
        property: l?.title || 'Your rental unit',
        period,
        amount,
        paymentType,
        methods: ['GCash', 'Bank Transfer', 'Cash'],
        status: 'pending',
      },
    };
    c.messages.push(prMsg);

    closePayReqModal();

    // Re-render the chat
    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      const introRow = document.createElement('div');
      introRow.className = 'msg-row buyer';
      introRow.innerHTML = `<div class="msg-bubble">${introMsg.text}</div><div class="msg-time">${time}</div>`;
      msgs.appendChild(introRow);

      const cardRow = document.createElement('div');
      cardRow.innerHTML = `
        <div class="msg-row seller">
          <div class="payment-request-card">
            <div class="pr-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Payment Request
              <span class="pr-status pr-status-pending">Awaiting Payment</span>
            </div>
            <div class="pr-property">${prMsg.payment.property}</div>
            <div class="pr-type" style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;"><strong>Type:</strong> ${formatPaymentType(paymentType)}</div>
            <div class="pr-period">Period: ${period}</div>
            <div class="pr-amount">₱${amount.toLocaleString('en-PH')}</div>
            <div class="pr-methods">
              <span class="pr-method-pill">💙 GCash</span>
              <span class="pr-method-pill">🏦 Bank Transfer</span>
              <span class="pr-method-pill">💵 Cash</span>
            </div>
            <div class="pr-waiting" style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.45);text-align:center;padding:8px 0;">
              Sent — waiting for buyer payment
            </div>
          </div>
          <div class="msg-time">${time}</div>
        </div>`;
      msgs.appendChild(cardRow.firstElementChild);
      msgs.scrollTop = msgs.scrollHeight;
    }
  };

  // ── Unverified state ───────────────────────────────────────────────────────
  if (!isVerified) {
    document.getElementById('chatPanel').innerHTML = `
      <div class="chat-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:42px;height:42px;opacity:0.35"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>Complete your verification to receive messages from buyers.</p>
        <a href="verification.html" style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;background:#00c9a7;color:#fff;font-size:13px;font-weight:700;border-radius:9px;padding:9px 20px;text-decoration:none;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Complete Verification
        </a>
      </div>
    `;
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


  // ── Render Viewing Request Card ─────────────────────────────────────────────
  function renderViewingRequestCard(m, convId) {
    const v = m.viewingRequest;
    if (!v) return '';

    const date = new Date(v.requestedDate + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const [hours, minutes] = v.requestedTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;

    const isPending = v.status === 'pending';

    return `
      <div class="msg-row buyer">
        <div class="viewing-request-card">
          <div class="vr-header">
            <div class="vr-header-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>VIEWING REQUEST</span>
            </div>
            ${!isPending ? (
              v.status === 'accepted' ? `
                <div class="vr-status-badge accepted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Accepted
                </div>
              ` :
              v.status === 'declined' ? `
                <div class="vr-status-badge declined">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Declined
                </div>
              ` :
              `
                <div class="vr-status-badge counter">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Counter Proposed
                </div>
              `
            ) : ''}
          </div>

          <h4 class="vr-property">${v.listingTitle}</h4>

          <div class="vr-detail">
            <span class="vr-label">Period:</span>
            <span class="vr-value">${formattedDate}</span>
          </div>

          <div class="vr-amount">${formattedTime}</div>

          ${v.buyerNotes ? `
            <div class="vr-notes">
              <strong>Message:</strong> ${v.buyerNotes}
            </div>
          ` : ''}

          ${isPending ? `
            <div class="vr-actions">
              <button class="vr-btn vr-btn-reject" onclick="openRejectModal('${v.id}', '${convId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Reject
              </button>
              <button class="vr-btn vr-btn-accept" onclick="acceptViewing('${v.id}', '${convId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Accept
              </button>
            </div>
          ` : ''}
        </div>
        <div class="msg-time">${m.time}</div>
      </div>
    `;
  }



  // ── Viewing Request Actions ─────────────────────────────────────────────────
  window.acceptViewing = function(viewingId, convId) {
    const c = window.CONVS.find(x => x.id === convId);
    const msg = c?.messages.find(m => m.viewingRequest?.id === viewingId);
    if (!msg) return;

    msg.viewingRequest.status = 'accepted';
    openConv(convId);

    showNotification('✅ Viewing confirmed! The buyer will be notified.', 'success');
  };

  window.openRejectModal = function(viewingId, convId) {
    // Store the IDs for later use
    window.currentViewingId = viewingId;
    window.currentConvId = convId;

    // Create and show modal
    const modal = document.getElementById('rejectViewingModal');
    if (!modal) {
      createRejectModal();
    }

    document.getElementById('rejectViewingModal').classList.add('active');
    document.getElementById('rejectMessage').value = '';
    document.getElementById('rejectMessage').focus();
  };

  window.closeRejectModal = function() {
    document.getElementById('rejectViewingModal').classList.remove('active');
  };

  window.submitReject = function() {
    const textarea = document.getElementById('rejectMessage');
    const message = textarea.value.trim();
    const errorMsg = document.getElementById('rejectError');

    if (!message) {
      // Show custom error
      if (!errorMsg) {
        const error = document.createElement('div');
        error.id = 'rejectError';
        error.className = 'reject-error';
        error.textContent = 'Please enter a message';
        textarea.parentNode.appendChild(error);
      }
      textarea.classList.add('error');
      textarea.focus();
      return;
    }

    // Remove error if exists
    if (errorMsg) errorMsg.remove();
    textarea.classList.remove('error');

    const viewingId = window.currentViewingId;
    const convId = window.currentConvId;

    const c = window.CONVS.find(x => x.id === convId);
    const msg = c?.messages.find(m => m.viewingRequest?.id === viewingId);
    if (!msg) return;

    // Update status to declined
    msg.viewingRequest.status = 'declined';

    // Add seller's message to chat
    c.messages.push({
      from: 'seller',
      text: message,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    });

    closeRejectModal();
    openConv(convId);

    showNotification('Viewing declined and message sent to buyer', 'success');
  };

  function createRejectModal() {
    const modalHTML = `
      <div id="rejectViewingModal" class="reject-modal">
        <div class="reject-modal-content">
          <div class="reject-modal-header">
            <h3>Decline Viewing Request</h3>
            <button class="reject-modal-close" onclick="closeRejectModal()">×</button>
          </div>

          <div class="reject-modal-body">
            <label for="rejectMessage">Message to buyer:</label>
            <textarea
              id="rejectMessage"
              placeholder="Explain why you're declining or suggest an alternative time..."
              rows="4"
              oninput="clearRejectError()"
            ></textarea>
            <p class="reject-help">💬 This message will be sent to the buyer in your chat</p>
          </div>

          <div class="reject-modal-actions">
            <button class="reject-modal-btn reject-send" onclick="submitReject()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Decline & Send Message
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  window.clearRejectError = function() {
    const errorMsg = document.getElementById('rejectError');
    const textarea = document.getElementById('rejectMessage');
    if (errorMsg) errorMsg.remove();
    if (textarea) textarea.classList.remove('error');
  };

  // Custom notification function
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

