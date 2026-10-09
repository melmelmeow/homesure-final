
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession();
  if (!session || session.role !== 'seller') window.location.href = '../../auth/signin.html';

  // ── Init shared components ──────────────────────────────────────────────────
  HomeSureSidebar.init({ activePage: 'viewing-requests' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  // ── Get seller's viewing requests ───────────────────────────────────────────
  let currentFilter = 'all';
  let currentRequestId = null;

  function getSellerRequests() {
    return FAKE_VIEWING_REQUESTS.filter(r => r.sellerId === session.id);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // ── Render requests ─────────────────────────────────────────────────────────
  function renderRequests() {
    const requests = getSellerRequests();

    // Update badges
    const all = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const confirmed = requests.filter(r => r.status === 'confirmed').length;
    const counter = requests.filter(r => r.status === 'counter-proposed').length;

    document.getElementById('badge-all').textContent = all;
    document.getElementById('badge-pending').textContent = pending;
    document.getElementById('badge-confirmed').textContent = confirmed;
    document.getElementById('badge-counter').textContent = counter;

    // Filter requests
    let filtered = requests;
    if (currentFilter !== 'all') {
      filtered = requests.filter(r => r.status === currentFilter);
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const listContainer = document.getElementById('requestsList');

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">No viewing requests${currentFilter !== 'all' ? ' in this category' : ''}</div>
          <div class="empty-sub">Viewing requests from buyers will appear here</div>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(req => {
      const statusClass = req.status.replace('-', '-');
      const statusLabel = req.status === 'counter-proposed' ? 'Counter-Proposed' :
                         req.status.charAt(0).toUpperCase() + req.status.slice(1);

      const requestedDateTime = `${formatDate(req.requestedDate)} at ${formatTime(req.requestedTime)}`;
      const proposedDateTime = req.proposedDate && req.proposedTime
        ? `${formatDate(req.proposedDate)} at ${formatTime(req.proposedTime)}`
        : null;

      const createdDate = new Date(req.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

      return `
        <div class="request-card">
          <div class="request-header">
            <div class="request-info">
              <div class="request-property">${req.listingTitle}</div>
              <div class="request-buyer">👤 ${req.buyerName}</div>
              <div class="request-date-info">Requested on ${createdDate}</div>
            </div>
            <div class="status-badge status-${statusClass}">${statusLabel}</div>
          </div>

          <div class="request-details">
            <div class="detail-item">
              <div class="detail-label">Requested Date</div>
              <div class="detail-value">${formatDate(req.requestedDate)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Requested Time</div>
              <div class="detail-value">${formatTime(req.requestedTime)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value">${statusLabel}</div>
            </div>
          </div>

          ${req.buyerNotes ? `
            <div class="request-notes">
              <div class="notes-label">Buyer Notes</div>
              <div class="notes-text">${req.buyerNotes}</div>
            </div>
          ` : ''}

          ${proposedDateTime ? `
            <div class="request-notes">
              <div class="notes-label">Your Counter-Proposal</div>
              <div class="notes-text">
                <strong>${proposedDateTime}</strong><br>
                ${req.sellerNotes || ''}
              </div>
            </div>
          ` : ''}

          <div class="request-actions">
            ${req.status === 'pending' ? `
              <button class="request-btn respond-btn" onclick="openResponseModal('${req.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Respond
              </button>
            ` : `
              <button class="request-btn view-btn" onclick="openResponseModal('${req.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Filter requests ─────────────────────────────────────────────────────────
  window.filterRequests = function(status) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });

    renderRequests();
  };

  // ── Open response modal ─────────────────────────────────────────────────────
  window.openResponseModal = function(requestId) {
    currentRequestId = requestId;
    const request = FAKE_VIEWING_REQUESTS.find(r => r.id === requestId);
    if (!request) return;

    // Populate modal
    document.getElementById('modalBuyer').textContent = request.buyerName;
    document.getElementById('modalProperty').textContent = request.listingTitle;
    document.getElementById('modalDate').textContent = formatDate(request.requestedDate);
    document.getElementById('modalTime').textContent = formatTime(request.requestedTime);

    if (request.buyerNotes) {
      document.getElementById('buyerNotesRow').style.display = 'flex';
      document.getElementById('modalBuyerNotes').textContent = request.buyerNotes;
    } else {
      document.getElementById('buyerNotesRow').style.display = 'none';
    }

    // Hide counter section initially
    document.getElementById('counterSection').style.display = 'none';

    // Show/hide action buttons based on status
    const modalActions = document.querySelector('.modal-actions');
    if (request.status !== 'pending') {
      modalActions.style.display = 'none';
    } else {
      modalActions.style.display = 'flex';
    }

    document.getElementById('responseModal').classList.add('active');
  };

  window.closeResponseModal = function() {
    document.getElementById('responseModal').classList.remove('active');
    currentRequestId = null;
  };

  // ── Toggle counter-proposal section ────────────────────────────────────────
  window.toggleCounterSection = function() {
    const section = document.getElementById('counterSection');
    const isVisible = section.style.display === 'block';
    section.style.display = isVisible ? 'none' : 'block';

    // Set minimum date to tomorrow
    if (!isVisible) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('counterDate').min = tomorrow.toISOString().split('T')[0];
    }
  };

  // ── Respond to request ──────────────────────────────────────────────────────
  window.respondToRequest = function(action) {
    const request = FAKE_VIEWING_REQUESTS.find(r => r.id === currentRequestId);
    if (!request) return;

    if (action === 'counter-proposed') {
      // Validate counter-proposal
      const counterDate = document.getElementById('counterDate').value;
      const counterTime = document.getElementById('counterTime').value;
      const counterNotes = document.getElementById('counterNotes').value;

      if (!counterDate || !counterTime) {
        alert('Please select a date and time for your counter-proposal');
        return;
      }

      // Update request
      request.status = 'counter-proposed';
      request.proposedDate = counterDate;
      request.proposedTime = counterTime;
      request.sellerNotes = counterNotes || null;
      request.updatedAt = new Date().toISOString();

      alert(`✅ Counter-Proposal Sent!\n\nYou proposed: ${formatDate(counterDate)} at ${formatTime(counterTime)}\n\nThe buyer will be notified and can accept your proposal.`);

    } else if (action === 'confirmed') {
      request.status = 'confirmed';
      request.updatedAt = new Date().toISOString();

      alert(`✅ Viewing Confirmed!\n\nDate: ${formatDate(request.requestedDate)}\nTime: ${formatTime(request.requestedTime)}\n\nThe buyer has been notified.`);

    } else if (action === 'declined') {
      if (!confirm('Are you sure you want to decline this viewing request?')) {
        return;
      }

      request.status = 'declined';
      request.updatedAt = new Date().toISOString();

      alert('❌ Viewing Request Declined\n\nThe buyer has been notified.');
    }

    closeResponseModal();
    renderRequests();
  };

  // ── Init ────────────────────────────────────────────────────────────────────
  renderRequests();

