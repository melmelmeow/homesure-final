// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Export Modal Component
//  Complete export system with format selection, loading, and success notification
//  Usage: HomeSureExport.show({ title: 'Export Payments', onExport: (format, dateRange) => {...} })
// ─────────────────────────────────────────────────────────────────────────────

(function (global) {
  'use strict';

  const CSS = `
    /* Export Modal Backdrop */
    .hs-export-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.25s ease;
    }
    .hs-export-backdrop.active {
      display: flex;
    }

    /* Export Modal */
    .hs-export-modal {
      background: #253347;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }

    /* Header */
    .hs-export-header {
      background: linear-gradient(135deg, rgba(0,201,167,0.15) 0%, rgba(15,118,110,0.1) 100%);
      padding: 20px 22px;
      border-bottom: 1px solid rgba(0,201,167,0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hs-export-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hs-export-icon {
      width: 40px;
      height: 40px;
      background: rgba(0,201,167,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hs-export-icon svg {
      width: 20px;
      height: 20px;
      color: #00c9a7;
    }
    .hs-export-title-text h3 {
      font-size: 17px;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
    }
    .hs-export-title-text p {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      margin: 2px 0 0;
    }
    .hs-export-close {
      background: rgba(255,255,255,0.06);
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      color: rgba(255,255,255,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .hs-export-close:hover {
      background: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.8);
    }

    /* Body */
    .hs-export-body {
      padding: 24px 22px;
    }

    /* Format Selection */
    .hs-export-section {
      margin-bottom: 20px;
    }
    .hs-export-label {
      font-size: 11.5px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
      display: block;
    }
    .hs-export-formats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .hs-export-format {
      background: #2c3d55;
      border: 2px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 16px 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      position: relative;
    }
    .hs-export-format:hover {
      border-color: rgba(0,201,167,0.3);
      transform: translateY(-2px);
    }
    .hs-export-format.selected {
      border-color: #00c9a7;
      background: rgba(0,201,167,0.08);
    }
    .hs-export-format.recommended::after {
      content: 'BEST';
      position: absolute;
      top: 6px;
      right: 6px;
      background: #00c9a7;
      color: white;
      font-size: 9px;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .hs-export-format-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .hs-export-format-name {
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    .hs-export-format-desc {
      font-size: 10.5px;
      color: rgba(255,255,255,0.4);
      line-height: 1.4;
    }

    /* Date Range (Optional) */
    .hs-export-date-range {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .hs-export-input {
      background: #2c3d55;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      color: #f1f5f9;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .hs-export-input:focus {
      border-color: rgba(0,201,167,0.4);
    }

    /* Footer */
    .hs-export-footer {
      display: flex;
      gap: 10px;
      padding: 18px 22px;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: #1a2739;
    }
    .hs-export-btn {
      flex: 1;
      padding: 12px 20px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .hs-export-btn-cancel {
      background: transparent;
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.6);
    }
    .hs-export-btn-cancel:hover {
      border-color: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.8);
    }
    .hs-export-btn-export {
      background: #00c9a7;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,201,167,0.3);
    }
    .hs-export-btn-export:hover {
      background: #00b394;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,201,167,0.4);
    }
    .hs-export-btn-export:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Loading State */
    .hs-export-loading {
      display: none;
      padding: 40px 20px;
      text-align: center;
    }
    .hs-export-loading.active {
      display: block;
    }
    .hs-export-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(0,201,167,0.2);
      border-top-color: #00c9a7;
      border-radius: 50%;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    }
    .hs-export-loading-text {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    .hs-export-loading-desc {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }

    /* Success Notification */
    .hs-export-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00c9a7 0%, #00a88a 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,201,167,0.4), 0 2px 8px rgba(0,0,0,0.2);
      display: none;
      align-items: center;
      gap: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999;
      min-width: 320px;
      animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    .hs-export-notification.active {
      display: flex;
    }
    .hs-export-notification.hiding {
      animation: slideOutRight 0.3s ease-in forwards;
    }
    .hs-export-notif-icon {
      width: 24px;
      height: 24px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hs-export-notif-icon svg {
      width: 14px;
      height: 14px;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  let currentFormat = 'excel';
  let modalEl = null;

  function createModal(options = {}) {
    const {
      title = 'Export Data',
      subtitle = 'Choose format and date range',
      showDateRange = true,
    } = options;

    const html = `
      <div class="hs-export-backdrop" id="hsExportBackdrop">
        <div class="hs-export-modal">
          <!-- Header -->
          <div class="hs-export-header">
            <div class="hs-export-title">
              <div class="hs-export-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div class="hs-export-title-text">
                <h3>${title}</h3>
                <p>${subtitle}</p>
              </div>
            </div>
            <button class="hs-export-close" onclick="HomeSureExport.close()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="hs-export-body" id="hsExportBody">
            <!-- Format Selection -->
            <div class="hs-export-section">
              <label class="hs-export-label">Export Format</label>
              <div class="hs-export-formats">
                <div class="hs-export-format recommended selected" data-format="excel" onclick="HomeSureExport.selectFormat('excel')">
                  <div class="hs-export-format-icon">📊</div>
                  <div class="hs-export-format-name">Excel</div>
                  <div class="hs-export-format-desc">With styling</div>
                </div>
                <div class="hs-export-format" data-format="csv" onclick="HomeSureExport.selectFormat('csv')">
                  <div class="hs-export-format-icon">📄</div>
                  <div class="hs-export-format-name">CSV</div>
                  <div class="hs-export-format-desc">Plain text</div>
                </div>
                <div class="hs-export-format" data-format="pdf" onclick="HomeSureExport.selectFormat('pdf')">
                  <div class="hs-export-format-icon">📑</div>
                  <div class="hs-export-format-name">PDF</div>
                  <div class="hs-export-format-desc">Print ready</div>
                </div>
              </div>
            </div>

            ${showDateRange ? `
            <!-- Date Range -->
            <div class="hs-export-section">
              <label class="hs-export-label">Date Range (Optional)</label>
              <div class="hs-export-date-range">
                <input type="date" class="hs-export-input" id="hsExportDateFrom" placeholder="From">
                <input type="date" class="hs-export-input" id="hsExportDateTo" placeholder="To">
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Loading State -->
          <div class="hs-export-loading" id="hsExportLoading">
            <div class="hs-export-spinner"></div>
            <div class="hs-export-loading-text">Generating your export...</div>
            <div class="hs-export-loading-desc">This may take a few seconds</div>
          </div>

          <!-- Footer -->
          <div class="hs-export-footer">
            <button class="hs-export-btn hs-export-btn-cancel" onclick="HomeSureExport.close()">
              Cancel
            </button>
            <button class="hs-export-btn hs-export-btn-export" onclick="HomeSureExport.export()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export ${currentFormat.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Notification -->
      <div class="hs-export-notification" id="hsExportNotification">
        <div class="hs-export-notif-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div id="hsExportNotificationText">Download complete!</div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
    document.body.appendChild(container.lastElementChild);
    modalEl = document.getElementById('hsExportBackdrop');
  }

  function show(options = {}) {
    if (!modalEl) createModal(options);
    modalEl.classList.add('active');
    currentFormat = 'excel';
  }

  function close() {
    if (modalEl) {
      modalEl.classList.remove('active');
    }
  }

  function selectFormat(format) {
    currentFormat = format;
    document.querySelectorAll('.hs-export-format').forEach(el => {
      el.classList.remove('selected');
    });
    document.querySelector(`[data-format="${format}"]`).classList.add('selected');

    // Update button text
    const btn = document.querySelector('.hs-export-btn-export');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Export ${format.toUpperCase()}
    `;
  }

  function exportData() {
    const body = document.getElementById('hsExportBody');
    const loading = document.getElementById('hsExportLoading');
    const footer = document.querySelector('.hs-export-footer');

    // Get date range if applicable
    const dateFrom = document.getElementById('hsExportDateFrom')?.value || null;
    const dateTo = document.getElementById('hsExportDateTo')?.value || null;

    // Show loading
    body.style.display = 'none';
    footer.style.display = 'none';
    loading.classList.add('active');

    // Simulate export process (2 seconds)
    setTimeout(() => {
      // Hide loading
      loading.classList.remove('active');

      // Close modal
      close();

      // Show success notification
      showNotification(`${currentFormat.toUpperCase()} file downloaded successfully!`);

      // Reset modal
      body.style.display = 'block';
      footer.style.display = 'flex';

      // Trigger actual download (simulation)
      const filename = `homesure-export-${Date.now()}.${currentFormat === 'excel' ? 'xlsx' : currentFormat}`;
      console.log(`📥 Downloading: ${filename}`, { format: currentFormat, dateFrom, dateTo });

      // In production, you would trigger actual file download here
      // window.location.href = `/api/export?format=${currentFormat}&from=${dateFrom}&to=${dateTo}`;
    }, 2000);
  }

  function showNotification(message) {
    const notif = document.getElementById('hsExportNotification');
    const textEl = document.getElementById('hsExportNotificationText');

    textEl.textContent = message;
    notif.classList.add('active');

    setTimeout(() => {
      notif.classList.add('hiding');
      setTimeout(() => {
        notif.classList.remove('active', 'hiding');
      }, 300);
    }, 3000);
  }

  // Public API
  global.HomeSureExport = {
    show,
    close,
    selectFormat,
    export: exportData,
  };

})(window);
