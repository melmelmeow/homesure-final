/* ═══════════════════════════════════════════════════════════════════════════
   ADJUST AVAILABILITY MODAL
   For multi-unit properties - seller can adjust available units
   ═══════════════════════════════════════════════════════════════════════════ */

const AdjustAvailabilityModal = (function() {

  let currentListing = null;
  let currentCallback = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function initModal() {
    if (document.getElementById('adjustAvailBackdrop')) return;

    const modalHTML = `
      <div id="adjustAvailBackdrop" class="adjust-avail-backdrop">
        <div class="adjust-avail-modal">
          <div id="adjustAvailContent">
            <!-- Content will be inserted here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on backdrop click
    document.getElementById('adjustAvailBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'adjustAvailBackdrop') {
        close();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPEN MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function open(options = {}) {
    /*
      options: {
        listingId: 'prop-002',
        listingTitle: '1-Bedroom Apartment',
        totalUnits: 8,
        availableUnits: 3,
        onConfirm: (newAvailable) => { ... }
      }
    */

    initModal();
    currentListing = options;
    currentCallback = options.onConfirm || null;

    const content = document.getElementById('adjustAvailContent');

    content.innerHTML = `
      <div class="adjust-avail-header">
        <div class="adjust-avail-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="adjust-avail-title">Adjust Availability</div>
      </div>

      <div class="adjust-avail-body">
        <div class="adjust-avail-listing-info">
          <div class="adjust-avail-listing-title">${options.listingTitle}</div>
          <div class="adjust-avail-listing-meta">Total Units: ${options.totalUnits}</div>
        </div>

        <div class="adjust-avail-current">
          <span class="adjust-avail-current-label">Currently Available:</span>
          <span class="adjust-avail-current-value">${options.availableUnits}</span>
        </div>

        <div class="adjust-avail-field">
          <div class="adjust-avail-field-label">New Available Units</div>
          <input
            type="number"
            id="newAvailableUnits"
            class="adjust-avail-input"
            min="0"
            max="${options.totalUnits}"
            value="${options.availableUnits}"
            placeholder="Enter number of available units"
          />
          <div class="adjust-avail-hint">Must be between 0 and ${options.totalUnits}</div>
        </div>

        <div class="adjust-avail-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            This will update how many units are shown as available to buyers. Set to 0 when all units are occupied.
          </div>
        </div>

        <div class="adjust-avail-actions">
          <button class="adjust-avail-btn adjust-avail-btn-cancel" onclick="AdjustAvailabilityModal.close()">
            Cancel
          </button>
          <button class="adjust-avail-btn adjust-avail-btn-confirm" onclick="AdjustAvailabilityModal.confirm()">
            Update Availability
          </button>
        </div>
      </div>
    `;

    // Show modal
    document.getElementById('adjustAvailBackdrop').classList.add('active');

    // Focus input
    setTimeout(() => {
      document.getElementById('newAvailableUnits').focus();
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM
  // ═══════════════════════════════════════════════════════════════════════════

  function confirm() {
    if (!currentListing) return;

    const input = document.getElementById('newAvailableUnits');
    const newAvailable = parseInt(input.value);

    // Validation
    if (isNaN(newAvailable) || newAvailable < 0 || newAvailable > currentListing.totalUnits) {
      alert(`Please enter a valid number between 0 and ${currentListing.totalUnits}`);
      return;
    }

    // Update listing in FAKE_LISTINGS
    const listing = window.FAKE_LISTINGS?.find(l => l.id === currentListing.listingId);
    if (listing) {
      listing.availableUnits = newAvailable;

      // Update status based on availability
      if (newAvailable === 0) {
        listing.status = 'occupied';
      } else if (listing.status === 'occupied') {
        listing.status = 'approved'; // Reopen if was occupied
      }

      console.log(`✅ Availability updated for ${currentListing.listingId}: ${newAvailable} units available`);
    }

    // Show success state
    showSuccess(newAvailable);

    // Call callback
    if (currentCallback) {
      currentCallback(newAvailable);
    }

    // Auto-close after 2 seconds
    setTimeout(() => {
      close();
      // Reload page to refresh listings
      setTimeout(() => {
        location.reload();
      }, 300);
    }, 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showSuccess(newAvailable) {
    const content = document.getElementById('adjustAvailContent');

    content.innerHTML = `
      <div class="adjust-avail-body" style="text-align:center;padding:40px 24px;">
        <div class="adjust-avail-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="adjust-avail-success-title">Availability Updated!</div>
        <div class="adjust-avail-success-message">
          ${newAvailable === 0
            ? 'All units are now marked as occupied'
            : `${newAvailable} unit${newAvailable !== 1 ? 's' : ''} now available for booking`
          }
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOSE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function close() {
    const backdrop = document.getElementById('adjustAvailBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    currentListing = null;
    currentCallback = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    open,
    confirm,
    close
  };

})();

console.log('✅ Adjust Availability Modal loaded');
