/* ═══════════════════════════════════════════════════════════════════════════
   CLOSE LISTING AFTER PAYMENT
   Prompts seller to close listing when payment is confirmed
   ═══════════════════════════════════════════════════════════════════════════ */

const CloseListingModal = (function() {

  let currentListing = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function initModal() {
    // Check if modal already exists
    if (document.getElementById('closeListingBackdrop')) return;

    // Create modal HTML
    const modalHTML = `
      <div id="closeListingBackdrop" class="close-listing-backdrop">
        <div class="close-listing-modal">
          <div class="close-listing-content" id="closeListingContent">
            <!-- Content will be inserted here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on backdrop click
    document.getElementById('closeListingBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'closeListingBackdrop') {
        closeModal();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPEN MODAL - Show prompt to close listing
  // ═══════════════════════════════════════════════════════════════════════════

  function openModal(listingData) {
    /*
      listingData structure:
      {
        listingId: 'prop-001',
        listingTitle: '2BR Apartment — Poblacion',
        tenantName: 'Maria Santos',
        period: 'June 2026',
        amount: 15000
      }
    */

    initModal();
    currentListing = listingData;

    const content = document.getElementById('closeListingContent');

    content.innerHTML = `
      <!-- Icon -->
      <div class="close-listing-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>

      <!-- Title & Message -->
      <div class="close-listing-title">Close this listing?</div>
      <div class="close-listing-message">
        Payment has been confirmed. Would you like to mark this property as no longer available?
      </div>

      <!-- Listing Details -->
      <div class="close-listing-details">
        <div class="close-listing-detail-row">
          <span class="close-listing-detail-label">Property</span>
          <span class="close-listing-detail-value">${listingData.listingTitle}</span>
        </div>
        ${listingData.isAdmin ? `
          <div class="close-listing-detail-row">
            <span class="close-listing-detail-label">Reason</span>
            <span class="close-listing-detail-value" style="text-align:left;max-width:100%;">
              <select id="adminCloseReason" style="width:100%;background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-family:inherit;font-size:13px;">
                <option value="occupied">Property is Occupied</option>
                <option value="seller_request">Seller Request</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="other">Other</option>
              </select>
            </span>
          </div>
        ` : `
          <div class="close-listing-detail-row">
            <span class="close-listing-detail-label">Tenant</span>
            <span class="close-listing-detail-value">${listingData.tenantName}</span>
          </div>
          <div class="close-listing-detail-row">
            <span class="close-listing-detail-label">Period</span>
            <span class="close-listing-detail-value">${listingData.period}</span>
          </div>
          <div class="close-listing-detail-row">
            <span class="close-listing-detail-label">Amount</span>
            <span class="close-listing-detail-value">${formatMoney(listingData.amount)}</span>
          </div>
        `}
      </div>

      <!-- Warning -->
      <div class="close-listing-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div class="close-listing-warning-text">
          ${listingData.isAdmin
            ? '<strong>Admin Action:</strong> Closing this listing will mark it as "Occupied" and remove it from search results. The seller will be notified.'
            : '<strong>Note:</strong> Closing the listing will mark it as "No Longer Available" and remove it from search results. You can reopen it later if needed.'
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="close-listing-actions">
        <button class="close-listing-btn-cancel" onclick="CloseListingModal.closeModal()">
          Not Yet
        </button>
        <button class="close-listing-btn-confirm" onclick="CloseListingModal.confirmClose()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Yes, Close Listing
        </button>
      </div>
    `;

    // Show modal
    document.getElementById('closeListingBackdrop').classList.add('active');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM CLOSE - Actually close the listing
  // ═══════════════════════════════════════════════════════════════════════════

  function confirmClose() {
    if (!currentListing) return;

    // Get closure reason if admin
    let closeReason = 'Payment confirmed';
    if (currentListing.isAdmin) {
      const reasonSelect = document.getElementById('adminCloseReason');
      const reasonMap = {
        'occupied': 'Property is now occupied',
        'seller_request': 'Closed per seller request',
        'maintenance': 'Property under maintenance',
        'other': 'Other reason'
      };
      closeReason = reasonSelect ? reasonMap[reasonSelect.value] : 'Closed by admin';
    }

    // Update listing status in fake-data.js (in production, this would be API call)
    const listing = window.ALL_LISTINGS?.find(l => l.id === currentListing.listingId);
    if (listing) {
      listing.availability = 'Occupied';
      listing.status = 'closed';
      listing.closedReason = closeReason;
      listing.closedBy = currentListing.isAdmin ? 'admin' : 'seller';
      listing.closedAt = new Date().toISOString();
      console.log('✅ Listing closed:', listing);
    }

    // Save to localStorage for persistence
    const closedListings = JSON.parse(localStorage.getItem('homesure_closed_listings') || '[]');
    const closureData = {
      listingId: currentListing.listingId,
      reason: closeReason,
      closedBy: currentListing.isAdmin ? 'admin' : 'seller',
      closedAt: new Date().toISOString()
    };

    const existingIndex = closedListings.findIndex(c => c.listingId === currentListing.listingId);
    if (existingIndex >= 0) {
      closedListings[existingIndex] = closureData;
    } else {
      closedListings.push(closureData);
    }
    localStorage.setItem('homesure_closed_listings', JSON.stringify(closedListings));

    // Show success state
    showSuccessState();

    // Auto-close after 2 seconds
    setTimeout(() => {
      closeModal();

      // Trigger callback if provided
      if (currentListing.onClosed) {
        currentListing.onClosed();
      }

      // Reload page to refresh listings
      setTimeout(() => {
        location.reload();
      }, 500);
    }, 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showSuccessState() {
    const content = document.getElementById('closeListingContent');

    content.innerHTML = `
      <!-- Success Icon -->
      <div class="close-listing-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <!-- Success Message -->
      <div class="close-listing-title">Listing Closed!</div>
      <div class="close-listing-message">
        ${currentListing.listingTitle} has been marked as no longer available.
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOSE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function closeModal() {
    const backdrop = document.getElementById('closeListingBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    currentListing = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK IF LISTING IS CLOSED
  // ═══════════════════════════════════════════════════════════════════════════

  function isListingClosed(listingId) {
    const closedListings = JSON.parse(localStorage.getItem('homesure_closed_listings') || '[]');
    return closedListings.includes(listingId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function formatMoney(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    openModal,
    confirmClose,
    closeModal,
    isListingClosed
  };

})();

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═══════════════════════════════════════════════════════════════════════════

console.log('✅ Close Listing Modal loaded');
