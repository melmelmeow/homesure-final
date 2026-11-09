/* ═══════════════════════════════════════════════════════════════════════════
   KASAFIDE — PAYMENT MODAL

   Two ways to pay, both real:

   1. QR Ph through Xendit. The browser asks POST /api/payments/create-invoice, which raises the
      charge with the secret key on the server and writes the payments row with the service role.
      The amount is computed there from the listing price, never sent from here. Xendit then calls
      POST /api/webhooks/xendit, which is what marks the row paid — so this modal polls the row
      instead of deciding for itself that the money arrived.

   2. Paying outside the platform (GCash to the landlord, a bank transfer, cash). The buyer uploads
      proof, the row lands on "awaiting confirmation", and the seller accepts or rejects it on their
      own payments page.

   Nothing here is stored in localStorage and nothing here decides a payment is complete.
   ═══════════════════════════════════════════════════════════════════════════ */

const PaymentIntegration = (function () {
  'use strict';

  // Methods the buyer can pick for a manual payment. These strings are what the API accepts.
  const MANUAL_METHODS = [
    { id: 'GCash',         label: 'GCash',         desc: 'Send to the landlord’s GCash number' },
    { id: 'Maya',          label: 'Maya',          desc: 'Send to the landlord’s Maya account' },
    { id: 'Bank Transfer', label: 'Bank Transfer', desc: 'InstaPay, PESONet or over the counter' },
    { id: 'Cash',          label: 'Cash',          desc: 'Paid in person, with a receipt' },
  ];

  // How long to keep asking whether the QR was paid. The Xendit charge itself expires in 15 min.
  const POLL_EVERY_MS = 3000;
  const POLL_FOR_MS   = 15 * 60 * 1000;

  let currentPayment = null;   // what openPaymentModal was given
  let selectedMethod = null;
  let proofFile      = null;
  let pollTimer      = null;

  // ── Modal shell ─────────────────────────────────────────────────────────────

  function initModal() {
    if (document.getElementById('paymentModalBackdrop')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="paymentModalBackdrop" class="payment-modal-backdrop">
        <div class="payment-modal">
          <div class="payment-modal-header">
            <h2 class="payment-modal-title">Complete Payment</h2>
            <button class="payment-modal-close" onclick="PaymentIntegration.closeModal()">&times;</button>
          </div>
          <div class="payment-modal-body" id="paymentModalBody"></div>
        </div>
      </div>
    `);

    document.getElementById('paymentModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'paymentModalBackdrop') closeModal();
    });
  }

  /**
   * paymentData:
   *   paymentId?     an existing pending row to pay off
   *   propertyId     required when there is no paymentId
   *   listingTitle   for the summary
   *   amount         for the summary only — the server computes what is charged
   *   purpose        rent | security | both | reservation | sale
   *   period, dueDate, depositMonths
   *   onSuccess(payment)
   */
  function openPaymentModal(paymentData) {
    initModal();
    currentPayment = paymentData || {};
    selectedMethod = null;
    proofFile = null;
    stopPolling();
    renderChoice();
    document.getElementById('paymentModalBackdrop').classList.add('active');
  }

  function body() {
    return document.getElementById('paymentModalBody');
  }

  function summaryHtml() {
    return `
      <div class="payment-summary">
        <div class="payment-summary-row">
          <span class="payment-summary-label">Property</span>
          <span class="payment-summary-value">${esc(currentPayment.listingTitle || '')}</span>
        </div>
        ${currentPayment.purpose ? `
        <div class="payment-summary-row">
          <span class="payment-summary-label">Payment Type</span>
          <span class="payment-summary-value" style="font-weight:700;color:var(--primary);">${formatPaymentType(currentPayment.purpose)}</span>
        </div>` : ''}
        ${currentPayment.period ? `
        <div class="payment-summary-row">
          <span class="payment-summary-label">Period</span>
          <span class="payment-summary-value">${esc(currentPayment.period)}</span>
        </div>` : ''}
        ${currentPayment.dueDate ? `
        <div class="payment-summary-row">
          <span class="payment-summary-label">Due Date</span>
          <span class="payment-summary-value">${formatDate(currentPayment.dueDate)}</span>
        </div>` : ''}
        <div class="payment-summary-row">
          <span class="payment-summary-label">Total Amount</span>
          <span class="payment-summary-value">${formatMoney(currentPayment.amount)}</span>
        </div>
      </div>
    `;
  }

  // ── Step 1: how to pay ──────────────────────────────────────────────────────

  function renderChoice() {
    body().innerHTML = `
      ${summaryHtml()}
      <div class="payment-methods-section">
        <h3 class="payment-section-title">How would you like to pay?</h3>

        <div class="payment-method-option" onclick="PaymentIntegration.chooseRoute('qrph')">
          <div class="payment-method-icon gcash">QR Ph</div>
          <div class="payment-method-info">
            <div class="payment-method-name">Pay through Kasafide</div>
            <div class="payment-method-desc">Scan one QR with GCash, Maya or your bank app. Confirmed automatically.</div>
          </div>
          <div class="payment-method-radio"></div>
        </div>

        <div class="payment-method-option" onclick="PaymentIntegration.chooseRoute('manual')">
          <div class="payment-method-icon card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">I paid the landlord directly</div>
            <div class="payment-method-desc">Upload your proof. The landlord confirms it.</div>
          </div>
          <div class="payment-method-radio"></div>
        </div>
      </div>

      <div class="payment-security-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <div class="payment-security-notice-text">
          <strong>Paying through Kasafide is safer.</strong> The amount is set by the listing, the
          payment is confirmed by the provider, and you have a record either side can show.
        </div>
      </div>
    `;
  }

  function chooseRoute(route) {
    if (route === 'qrph') startQrph();
    else renderManualMethods();
  }

  // ── QR Ph through Xendit ────────────────────────────────────────────────────

  async function startQrph() {
    body().innerHTML = `
      <div class="payment-processing">
        <div class="payment-processing-spinner"></div>
        <div class="payment-processing-text">Creating your QR code…</div>
        <div class="payment-processing-subtext">This takes a moment.</div>
      </div>
    `;

    let result;
    try {
      result = await HS.payments.startQrph({
        propertyId: currentPayment.propertyId || currentPayment.listingId,
        purpose: currentPayment.purpose || 'rent',
        period: currentPayment.period,
        dueDate: currentPayment.dueDate,
        depositMonths: currentPayment.depositMonths,
      });
    } catch (err) {
      renderError(err.message, 'PaymentIntegration.chooseRoute(\'qrph\')');
      return;
    }

    renderQr(result.payment, result.qr);
    pollUntilPaid(result.payment.id);
  }

  function renderQr(payment, qr) {
    // Xendit returns the QR as a string for the merchant to render. If the account also returns a
    // hosted image, show that; otherwise show the string, which any QR Ph app can take.
    const imageUrl = payment.qr_code_url || (qr && qr.qr_code_url) || null;
    const qrString = payment.xendit_qr_string || (qr && qr.qr_string) || '';

    body().innerHTML = `
      ${summaryHtml()}
      <div class="payment-methods-section">
        <h3 class="payment-section-title">Scan to pay</h3>
        ${imageUrl
          ? `<div style="text-align:center;padding:12px 0;">
               <img src="${esc(imageUrl)}" alt="QR Ph code" style="width:240px;max-width:100%;border-radius:12px;">
             </div>`
          : `<div style="padding:14px;border:1px dashed var(--border);border-radius:12px;">
               <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">
                 Copy this QR Ph string into your banking or e-wallet app:
               </div>
               <textarea readonly id="qrPhString" style="width:100%;height:84px;font-family:monospace;font-size:11px;
                 border:1px solid var(--border);border-radius:8px;padding:8px;resize:none;">${esc(qrString)}</textarea>
               <button class="payment-btn-secondary" style="margin-top:8px;"
                 onclick="PaymentIntegration.copyQrString()">Copy code</button>
             </div>`}
        <div class="payment-security-notice" style="margin-top:14px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div class="payment-security-notice-text">
            This code expires in 15 minutes. Keep this window open — it updates on its own once
            the payment goes through.
          </div>
        </div>
      </div>
      <div id="qrWaitRow" style="display:flex;align-items:center;gap:10px;justify-content:center;
           padding:14px;color:var(--text-muted);font-size:13px;">
        <div class="payment-processing-spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></div>
        Waiting for your payment…
      </div>
    `;
  }

  function copyQrString() {
    const el = document.getElementById('qrPhString');
    if (!el) return;
    el.select();
    navigator.clipboard.writeText(el.value).catch(() => document.execCommand('copy'));
  }

  // The webhook is the only thing that marks a charge paid, so ask the row how it is doing.
  function pollUntilPaid(paymentId) {
    const until = Date.now() + POLL_FOR_MS;

    pollTimer = setInterval(async () => {
      if (Date.now() > until) {
        stopPolling();
        const row = document.getElementById('qrWaitRow');
        if (row) {
          row.innerHTML = 'This code has expired. Close this window and start again when you are ready.';
        }
        return;
      }

      let payment;
      try {
        payment = await HS.payments.byId(paymentId);
      } catch (err) {
        return;                                  // a dropped request is not an answer; try again
      }
      if (!payment || payment.status === 'pending') return;

      stopPolling();
      if (payment.status === 'confirmed') {
        renderSuccess(payment);
        if (currentPayment.onSuccess) currentPayment.onSuccess(payment);
      } else {
        renderError('This payment came back as ' + payment.status + '.', 'PaymentIntegration.chooseRoute(\'qrph\')');
      }
    }, POLL_EVERY_MS);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  // ── Paying the landlord directly ────────────────────────────────────────────

  function renderManualMethods() {
    body().innerHTML = `
      ${summaryHtml()}
      <div class="payment-methods-section">
        <h3 class="payment-section-title">How did you pay?</h3>
        ${MANUAL_METHODS.map((m) => `
          <div class="payment-method-option" id="pm-${esc(m.id)}"
               onclick="PaymentIntegration.selectMethod('${esc(m.id)}')">
            <div class="payment-method-icon card">${esc(m.label)}</div>
            <div class="payment-method-info">
              <div class="payment-method-name">${esc(m.label)}</div>
              <div class="payment-method-desc">${m.desc}</div>
            </div>
            <div class="payment-method-radio"></div>
          </div>
        `).join('')}
      </div>
      <button class="payment-submit-btn" id="paymentSubmitBtn" disabled
              onclick="PaymentIntegration.goToProof()">Select how you paid</button>
    `;
  }

  function selectMethod(methodId) {
    selectedMethod = methodId;
    document.querySelectorAll('.payment-method-option').forEach((o) => o.classList.remove('selected'));
    const card = document.getElementById('pm-' + methodId);
    if (card) card.classList.add('selected');
    const btn = document.getElementById('paymentSubmitBtn');
    btn.disabled = false;
    btn.textContent = 'Continue';
  }

  function goToProof() {
    if (!selectedMethod) return;
    body().innerHTML = `
      ${summaryHtml()}
      <div class="payment-methods-section">
        <h3 class="payment-section-title">Proof of your ${esc(selectedMethod)} payment</h3>
        <label style="display:block;padding:18px;border:1px dashed var(--border);border-radius:12px;
               text-align:center;cursor:pointer;color:var(--text-muted);font-size:13px;">
          <input type="file" accept="image/*" style="display:none"
                 onchange="PaymentIntegration.onProofSelect(event)">
          <span id="proofLabel">Click to attach a screenshot or photo of the receipt</span>
        </label>
        <div style="margin-top:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">
            Reference number (optional)
          </label>
          <input type="text" id="manualReference" placeholder="e.g. GC-78452"
                 style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;">
        </div>
        <div class="payment-security-notice" style="margin-top:14px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="payment-security-notice-text">
            Your landlord sees this proof and nobody else. The payment counts once they confirm it.
          </div>
        </div>
      </div>
      <button class="payment-submit-btn" id="paymentSubmitBtn" disabled
              onclick="PaymentIntegration.submitProof()">Attach your proof first</button>
    `;
  }

  function onProofSelect(e) {
    proofFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    document.getElementById('proofLabel').textContent =
      proofFile ? proofFile.name : 'Click to attach a screenshot or photo of the receipt';
    const btn = document.getElementById('paymentSubmitBtn');
    btn.disabled = !proofFile;
    btn.textContent = proofFile ? 'Submit proof of payment' : 'Attach your proof first';
  }

  async function submitProof() {
    if (!proofFile || !selectedMethod) return;

    const reference = (document.getElementById('manualReference') || {}).value || '';
    body().innerHTML = `
      <div class="payment-processing">
        <div class="payment-processing-spinner"></div>
        <div class="payment-processing-text">Sending your proof…</div>
        <div class="payment-processing-subtext">Uploading the file and recording the payment.</div>
      </div>
    `;

    let payment;
    try {
      const proofPath = await HS.payments.uploadProof(proofFile);
      payment = await HS.payments.submitProof({
        paymentId: currentPayment.paymentId || null,
        propertyId: currentPayment.propertyId || currentPayment.listingId,
        purpose: currentPayment.purpose || 'rent',
        period: currentPayment.period,
        dueDate: currentPayment.dueDate,
        depositMonths: currentPayment.depositMonths,
        method: selectedMethod,
        reference: reference.trim(),
        proofPath,
      });
    } catch (err) {
      renderError(err.message, 'PaymentIntegration.goToProof()');
      return;
    }

    renderAwaitingConfirmation(payment);
    if (currentPayment.onSuccess) currentPayment.onSuccess(payment);
  }

  // ── Outcomes ────────────────────────────────────────────────────────────────

  function renderSuccess(payment) {
    body().innerHTML = `
      <div class="payment-success">
        <div class="payment-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="payment-success-title">Payment Successful</div>
        <div class="payment-success-message">
          Your payment of ${formatMoney(payment.amount)} went through.
        </div>
        <div class="payment-success-details">
          <div class="payment-detail-row">
            <span class="payment-detail-label">Reference</span>
            <span class="payment-detail-value">${esc(payment.reference || payment.id)}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Date &amp; Time</span>
            <span class="payment-detail-value">${formatDateTime(payment.paidAt)}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Method</span>
            <span class="payment-detail-value">${esc(payment.method || 'QR Ph')}</span>
          </div>
          <div class="payment-detail-row">
            <span class="payment-detail-label">Amount Paid</span>
            <span class="payment-detail-value">${formatMoney(payment.amount)}</span>
          </div>
        </div>
        <div class="payment-success-actions">
          <button class="payment-submit-btn" onclick="PaymentIntegration.closeModal()">Done</button>
        </div>
      </div>
    `;
  }

  function renderAwaitingConfirmation(payment) {
    body().innerHTML = `
      <div class="payment-success">
        <div class="payment-success-icon" style="background:rgb(var(--warning-rgb) / 0.12);color:var(--warning);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="payment-success-title">Proof submitted</div>
        <div class="payment-success-message">
          Your landlord has been asked to confirm ${formatMoney(payment.amount)}
          ${payment.period ? 'for ' + esc(payment.period) : ''}. You will see it on this page as soon
          as they do.
        </div>
        <div class="payment-success-details">
          <div class="payment-detail-row">
            <span class="payment-detail-label">Method</span>
            <span class="payment-detail-value">${esc(payment.method || selectedMethod)}</span>
          </div>
          ${payment.reference ? `
          <div class="payment-detail-row">
            <span class="payment-detail-label">Reference</span>
            <span class="payment-detail-value">${esc(payment.reference)}</span>
          </div>` : ''}
          <div class="payment-detail-row">
            <span class="payment-detail-label">Status</span>
            <span class="payment-detail-value">Awaiting confirmation</span>
          </div>
        </div>
        <div class="payment-success-actions">
          <button class="payment-submit-btn" onclick="PaymentIntegration.closeModal()">Done</button>
        </div>
      </div>
    `;
  }

  function renderError(message, retryCall) {
    body().innerHTML = `
      <div class="payment-success">
        <div class="payment-success-icon" style="background:rgb(var(--danger-rgb) / 0.12);color:var(--danger);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="payment-success-title">That did not go through</div>
        <div class="payment-success-message">${esc(message || 'Please try again.')}</div>
        <div class="payment-success-actions">
          <button class="payment-btn-secondary" onclick="PaymentIntegration.closeModal()">Close</button>
          <button class="payment-submit-btn" onclick="${retryCall}">Try again</button>
        </div>
      </div>
    `;
  }

  function closeModal() {
    stopPolling();
    const backdrop = document.getElementById('paymentModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    currentPayment = null;
    selectedMethod = null;
    proofFile = null;
  }

  // ── Formatting ──────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatMoney(amount) {
    if (amount === null || amount === undefined || amount === '') return '—';
    return '₱' + Number(amount).toLocaleString('en-PH');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(String(dateStr).slice(0, 10) + 'T00:00:00')
      .toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function formatPaymentType(type) {
    return ({
      security: 'Security Deposit',
      rent: 'Rent Payment',
      both: 'Security Deposit + Rent',
      reservation: 'Reservation Fee',
      sale: 'Purchase',
    })[type] || 'Payment';
  }

  return {
    openPaymentModal,
    chooseRoute,
    selectMethod,
    goToProof,
    onProofSelect,
    submitProof,
    copyQrString,
    closeModal,
    formatPaymentType,
  };
})();
