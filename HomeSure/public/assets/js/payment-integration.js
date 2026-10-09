/* ═══════════════════════════════════════════════════════════════════════════
   HOMESURE - QRPH PAYMENT INTEGRATION (Demo/Prototype)

   FOR CAPSTONE DEFENSE:
   This simulates a complete QRPH payment flow for demonstration purposes.
   In production, this would connect to:
   1. Backend server (Node.js/PHP) to create Payment Intent
   2. QRPH API for actual payment processing
   3. Database to store transaction records
   4. Webhook receiver for real-time payment status updates

   SECURITY NOTE FOR DEFENSE:
   - API secret keys MUST be stored on backend server (never in frontend)
   - Frontend only receives checkout URL and payment status
   - Webhooks ensure payment status is accurate even if user closes browser
   ═══════════════════════════════════════════════════════════════════════════ */

const PaymentIntegration = (function() {

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION (In production, this comes from backend)
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    // QRPH Test Keys (FOR DEMO ONLY - In production, these are on backend)
    // Public Key: pk_test_... (safe to use in frontend)
    // Secret Key: sk_test_... (MUST be on backend only!)

    // Simulated processing time (milliseconds)
    PROCESSING_DELAY: 3000,

    // QRPH supported payment methods
    PAYMENT_METHODS: {
      GCASH: { id: 'gcash', name: 'GCash', desc: 'Pay via GCash e-wallet' },
      MAYA: { id: 'paymaya', name: 'Maya', desc: 'Pay via Maya (formerly PayMaya)' },
      CARD: { id: 'card', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, JCB' }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  let currentPayment = null;
  let selectedMethod = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function initModal() {
    // Check if modal already exists
    if (document.getElementById('paymentModalBackdrop')) return;

    // Create modal HTML structure
    const modalHTML = `
      <div id="paymentModalBackdrop" class="payment-modal-backdrop">
        <div class="payment-modal">
          <!-- HEADER -->
          <div class="payment-modal-header">
            <h2 class="payment-modal-title">Complete Payment</h2>
            <button class="payment-modal-close" onclick="PaymentIntegration.closeModal()">&times;</button>
          </div>

          <!-- BODY -->
          <div class="payment-modal-body" id="paymentModalBody">
            <!-- Payment form will be inserted here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on backdrop click
    document.getElementById('paymentModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'paymentModalBackdrop') {
        closeModal();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPEN PAYMENT MODAL
  // This is called when tenant clicks "Pay Now" button
  // ═══════════════════════════════════════════════════════════════════════════

  function openPaymentModal(paymentData) {
    /*
      paymentData structure:
      {
        amount: 15000,
        listingTitle: "2BR Apartment — Poblacion",
        listingId: "prop-001",
        landlordId: "usr-003",
        period: "June 2026",
        dueDate: "2026-06-01"
      }
    */

    initModal();
    currentPayment = paymentData;

    // Render payment form
    renderPaymentForm();

    // Show modal
    document.getElementById('paymentModalBackdrop').classList.add('active');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PAYMENT FORM
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPaymentForm() {
    const body = document.getElementById('paymentModalBody');

    body.innerHTML = `
      <!-- PAYMENT SUMMARY -->
      <div class="payment-summary">
        <div class="payment-summary-row">
          <span class="payment-summary-label">Property</span>
          <span class="payment-summary-value">${currentPayment.listingTitle}</span>
        </div>
        ${currentPayment.paymentType ? `
        <div class="payment-summary-row">
          <span class="payment-summary-label">Payment Type</span>
          <span class="payment-summary-value" style="font-weight:700;color:#00c9a7;">${formatPaymentType(currentPayment.paymentType)}</span>
        </div>
        ` : ''}
        <div class="payment-summary-row">
          <span class="payment-summary-label">Period</span>
          <span class="payment-summary-value">${currentPayment.period}</span>
        </div>
        <div class="payment-summary-row">
          <span class="payment-summary-label">Due Date</span>
          <span class="payment-summary-value">${formatDate(currentPayment.dueDate)}</span>
        </div>
        <div class="payment-summary-row">
          <span class="payment-summary-label">Total Amount</span>
          <span class="payment-summary-value">${formatMoney(currentPayment.amount)}</span>
        </div>
      </div>

      <!-- PAYMENT METHODS -->
      <div class="payment-methods-section">
        <h3 class="payment-section-title">Select Payment Method</h3>

        <!-- GCash -->
        <div class="payment-method-option" onclick="PaymentIntegration.selectMethod('gcash')">
          <div class="payment-method-icon gcash">GCash</div>
          <div class="payment-method-info">
            <div class="payment-method-name">GCash</div>
            <div class="payment-method-desc">Pay via GCash e-wallet</div>
          </div>
          <div class="payment-method-radio"></div>
        </div>

        <!-- Maya -->
        <div class="payment-method-option" onclick="PaymentIntegration.selectMethod('paymaya')">
          <div class="payment-method-icon maya">Maya</div>
          <div class="payment-method-info">
            <div class="payment-method-name">Maya</div>
            <div class="payment-method-desc">Pay via Maya (formerly PayMaya)</div>
          </div>
          <div class="payment-method-radio"></div>
        </div>

        <!-- Card -->
        <div class="payment-method-option" onclick="PaymentIntegration.selectMethod('card')">
          <div class="payment-method-icon card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
              <line x1="5" y1="15" x2="9" y2="15"/>
            </svg>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Credit/Debit Card</div>
            <div class="payment-method-desc">Visa, Mastercard, JCB</div>
          </div>
          <div class="payment-method-radio"></div>
        </div>
      </div>

      <!-- SECURITY NOTICE -->
      <div class="payment-security-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <div class="payment-security-notice-text">
          <strong>Secure Payment:</strong> Your payment is processed securely through QRPH.
          Your financial information is encrypted and never stored on our servers.
        </div>
      </div>

      <!-- PAY BUTTON -->
      <button
        class="payment-submit-btn"
        id="paymentSubmitBtn"
        disabled
        onclick="PaymentIntegration.processPayment()"
      >
        Select a payment method
      </button>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECT PAYMENT METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  function selectMethod(methodId) {
    selectedMethod = methodId;

    // Update UI - remove all selected states
    document.querySelectorAll('.payment-method-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Add selected state to clicked option
    event.currentTarget.classList.add('selected');

    // Enable pay button
    const btn = document.getElementById('paymentSubmitBtn');
    btn.disabled = false;
    btn.textContent = `Pay ${formatMoney(currentPayment.amount)}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS PAYMENT
  // This simulates the complete payment flow
  // ═══════════════════════════════════════════════════════════════════════════

  function processPayment() {
    if (!selectedMethod) return;

    /*
      IN PRODUCTION, THIS WOULD:
      1. Send request to YOUR backend server
      2. Backend creates QRPH Payment Intent with secret key
      3. Backend returns checkout URL
      4. Frontend redirects user to QRPH checkout page
      5. User completes payment on QRPH
      6. QRPH redirects back to your site
      7. QRPH sends webhook to your backend
      8. Backend updates database with payment status
      9. Frontend shows success/failure message
    */

    // Show processing state
    showProcessingState();

    // Simulate payment processing delay
    setTimeout(() => {
      // Generate transaction reference (in production, this comes from QRPH)
      const transactionRef = generateTransactionReference(selectedMethod);

      // Create transaction record
      const transaction = createTransactionRecord(transactionRef);

      // Save to localStorage (in production, this goes to database via backend)
      saveTransaction(transaction);

      // Show success state
      showSuccessState(transaction);

      // Trigger callback if provided (to update UI)
      if (currentPayment.onSuccess) {
        currentPayment.onSuccess(transaction);
      }
    }, CONFIG.PROCESSING_DELAY);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW PROCESSING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showProcessingState() {
    const body = document.getElementById('paymentModalBody');
    const methodName = CONFIG.PAYMENT_METHODS[selectedMethod.toUpperCase()]?.name || 'Payment Method';

    body.innerHTML = `
      <div class="payment-processing">
        <div class="payment-processing-spinner"></div>
        <div class="payment-processing-text">Processing Payment...</div>
        <div class="payment-processing-subtext">
          Connecting to ${methodName}. Please wait.
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showSuccessState(transaction) {
    const body = document.getElementById('paymentModalBody');
    const methodName = CONFIG.PAYMENT_METHODS[selectedMethod.toUpperCase()]?.name || 'Payment Method';

    body.innerHTML = `
      <div class="payment-success">
        <!-- Success Icon -->
        <div class="payment-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <!-- Success Message -->
        <div class="payment-success-title">Payment Successful!</div>
        <div class="payment-success-message">
          Your payment of ${formatMoney(transaction.amount)} via ${methodName}
          has been processed successfully.
        </div>

        <!-- Transaction Details -->
        <div class="payment-success-details">
          <div class="payment-detail-row">
            <span class="payment-detail-label">Transaction ID</span>
            <span class="payment-detail-value">${transaction.id}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Reference Number</span>
            <span class="payment-detail-value">${transaction.reference}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Date & Time</span>
            <span class="payment-detail-value">${formatDateTime(transaction.paidDate)}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Payment Method</span>
            <span class="payment-detail-value">${methodName}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Amount Paid</span>
            <span class="payment-detail-value">${formatMoney(transaction.amount)}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="payment-success-actions">
          <button class="payment-btn-secondary" onclick="PaymentIntegration.downloadReceipt('${transaction.id}')">
            Download Receipt
          </button>
          <button class="payment-submit-btn" onclick="PaymentIntegration.closeModal()">
            Done
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE TRANSACTION REFERENCE
  // In production, this comes from QRPH API
  // ═══════════════════════════════════════════════════════════════════════════

  function generateTransactionReference(method) {
    const prefix = {
      'gcash': 'GC',
      'paymaya': 'MY',
      'card': 'CD'
    }[method] || 'PM';

    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `${prefix}-${timestamp}${random}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE TRANSACTION RECORD
  // ═══════════════════════════════════════════════════════════════════════════

  function createTransactionRecord(reference) {
    const user = getSession();
    const now = new Date();

    return {
      id: `TXN-${Date.now()}`,
      reference: reference,
      amount: currentPayment.amount,
      status: 'confirmed', // In production: pending → paid → confirmed
      method: selectedMethod,
      listingTitle: currentPayment.listingTitle,
      listingId: currentPayment.listingId,
      period: currentPayment.period,
      dueDate: currentPayment.dueDate,
      paidDate: now.toISOString().split('T')[0],
      paidDateTime: now.toISOString(),
      tenantId: user.id,
      tenantName: `${user.firstName} ${user.lastName}`,
      landlordId: currentPayment.landlordId,
      // In production, would include QRPH payment_intent_id
      paymongoPaymentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE TRANSACTION
  // In production, this would be saved to database via backend API
  // ═══════════════════════════════════════════════════════════════════════════

  function saveTransaction(transaction) {
    // Get existing transactions from localStorage
    const transactions = JSON.parse(localStorage.getItem('homesure_transactions') || '[]');

    // Add new transaction
    transactions.unshift(transaction);

    // Save back to localStorage
    localStorage.setItem('homesure_transactions', JSON.stringify(transactions));

    // Decrease available units if property has multiple units
    decreaseAvailableUnits(transaction.listingId);

    console.log('💾 Transaction saved:', transaction);
    console.log('📝 FOR DEFENSE: In production, this would be saved to database via POST /api/transactions');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DECREASE AVAILABLE UNITS (for multi-unit properties)
  // ═══════════════════════════════════════════════════════════════════════════

  function decreaseAvailableUnits(listingId) {
    // Find the listing in FAKE_LISTINGS
    const listing = window.FAKE_LISTINGS?.find(l => l.id === listingId);

    if (listing && listing.hasMultipleUnits && listing.availableUnits > 0) {
      listing.availableUnits--;

      console.log(`📉 Available units decreased for ${listingId}: ${listing.availableUnits + 1} → ${listing.availableUnits}`);

      // If no units left, mark as fully occupied
      if (listing.availableUnits === 0) {
        listing.status = 'occupied';
        console.log(`🏠 ${listingId} is now fully occupied`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function getTransactions(filters = {}) {
    const allTransactions = JSON.parse(localStorage.getItem('homesure_transactions') || '[]');

    // Apply filters if provided
    let filtered = allTransactions;

    if (filters.tenantId) {
      filtered = filtered.filter(t => t.tenantId === filters.tenantId);
    }

    if (filters.landlordId) {
      filtered = filtered.filter(t => t.landlordId === filters.landlordId);
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    return filtered;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOWNLOAD RECEIPT
  // ═══════════════════════════════════════════════════════════════════════════

  function downloadReceipt(transactionId) {
    // In production, this would generate PDF receipt
    alert(`📄 Receipt for ${transactionId} would be downloaded here.\n\nIn production: Generate PDF receipt with transaction details.`);

    console.log('📄 FOR DEFENSE: Generate PDF receipt using library like jsPDF or backend PDF generator');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOSE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function closeModal() {
    document.getElementById('paymentModalBackdrop').classList.remove('active');
    currentPayment = null;
    selectedMethod = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function formatMoney(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatPaymentType(type) {
    const typeMap = {
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security Deposit + Rent'
    };
    return typeMap[type] || 'Payment';
  }

  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '—';
    return new Date(dateTimeStr).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getSession() {
    // Get current user session
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    openPaymentModal,
    selectMethod,
    processPayment,
    closeModal,
    downloadReceipt,
    getTransactions,

    // For testing in console
    _testPayment: () => {
      openPaymentModal({
        amount: 15000,
        listingTitle: "2BR Apartment — Poblacion",
        listingId: "prop-001",
        landlordId: "usr-003",
        period: "June 2026",
        dueDate: "2026-06-01"
      });
    }
  };

})();

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═══════════════════════════════════════════════════════════════════════════

console.log('✅ QRPH Payment Integration loaded (Demo Mode)');
console.log('💡 Test in console: PaymentIntegration._testPayment()');
