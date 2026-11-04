// Kasafide – Admin Reports

(function () {
  const user = getSession();
  if (!user || (!['admin', 'superadmin', 'super_duper_admin'].includes(user.role))) {
    window.location.href = '../../auth/signin.html';
    return;
  }

  KasafideSidebar.init({ activePage: 'reports' });
  KasafideTopbar.init({ placeholder: 'Search reports...', onSearch: () => window.renderReports && window.renderReports() });

  // ── Reports (from listing_reports; RLS gives admins every row) ───────────────
  //
  // The database keeps a report as category + reason + status. This page also shows a severity and
  // a comment thread, which have no columns yet, so severity is derived from the category and the
  // single admin_notes field stands in for the thread.
  let REPORTS = [];

  const SEVERITY_BY_CATEGORY = {
    fraudulent: 'high', scam: 'high', fake: 'high',
    misleading: 'medium', incorrect: 'medium', price: 'medium', sold: 'medium',
    inappropriate: 'high', spam: 'low', duplicate: 'low', other: 'low',
  };

  function toPageShape(r) {
    return {
      id: r.id,
      type: 'listing',
      severity: SEVERITY_BY_CATEGORY[r.category] || 'low',
      subject: r.category ? r.category.charAt(0).toUpperCase() + r.category.slice(1).replace(/_/g, ' ') : 'Report',
      description: r.reason || '',
      listingId: r.listingId,
      listingTitle: r.listingTitle,
      reportedBy: r.reportedBy,
      reporterName: r.reporterName,
      sellerName: r.sellerName,
      status: r.status === 'dismissed' ? 'rejected' : r.status,
      actionTaken: r.actionTaken,
      adminNotes: r.adminNotes,
      submittedAt: (r.reportedAt || '').slice(0, 10),
      comments: r.adminNotes ? [{ text: r.adminNotes, by: 'Admin', at: (r.resolvedAt || r.reportedAt || '').slice(0, 16).replace('T', ' ') }] : [],
    };
  }


  const ACTION_LABELS = {
    listing_removed:       'Listing Removed',
    corrections_requested: 'Corrections Requested',
    warning_issued:        'Warning Issued',
    account_suspended:     'Account Suspended',
    report_rejected:       'Report Rejected',
  };

  let activeStatus = 'all';

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  document.getElementById('filterTabs').addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeStatus = tab.dataset.status;
    renderReports();
  });

  // ── Severity icon/color ─────────────────────────────────────────────────────
  function severityIcon(severity) {
    if (severity === 'high')   return { cls: 'red',   svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` };
    if (severity === 'medium') return { cls: 'amber', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` };
    return { cls: 'blue', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>` };
  }

  // ── Status badge label ──────────────────────────────────────────────────────
  function statusLabel(status) {
    return { pending: 'Pending', under_review: 'Under Review', resolved: 'Resolved', rejected: 'Rejected' }[status] || status;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  window.renderReports = function () {
    const q = (document.getElementById('hsSearch') || {}).value?.toLowerCase() || '';
    const filtered = REPORTS.filter(r => {
      const matchStatus = activeStatus === 'all' || r.status === activeStatus;
      const matchQ = !q || r.subject.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });

    const container = document.getElementById('reportsContainer');
    if (!filtered.length) {
      container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--muted)">No reports found.</div>`;
      return;
    }

    container.innerHTML = filtered.map(r => {
      const reporterName = r.reporterName || 'Kasafide user';
      const listing = r.listingTitle ? { title: r.listingTitle } : null;
      const { cls, svg } = severityIcon(r.severity);

      let actionBtns = '';
      if (r.status === 'pending') {
        actionBtns = `<button class="btn-sm review" onclick="event.stopPropagation();markUnderReview('${r.id}')">Under Review</button>
                      <button class="btn-sm open-modal" onclick="event.stopPropagation();openModal('${r.id}')">Take Action</button>`;
      } else if (r.status === 'under_review') {
        actionBtns = `<button class="btn-sm open-modal" onclick="event.stopPropagation();openModal('${r.id}')">Take Action</button>`;
      }

      return `
        <div class="report-row ${r.severity}" onclick="openModal('${r.id}')">
          <div class="report-icon ${cls}">${svg}</div>
          <div class="report-body">
            <div class="report-title">${r.subject}</div>
            <div class="report-desc">${r.description.slice(0, 100)}${r.description.length > 100 ? '…' : ''}</div>
            <div class="report-meta">Reported by ${reporterName} · ${listing ? listing.title : r.listingId} · ${r.submittedAt}</div>
            ${r.actionTaken ? `<div class="action-tag">${ACTION_LABELS[r.actionTaken]}</div>` : ''}
          </div>
          <div class="report-right" onclick="event.stopPropagation()">
            <span class="badge ${r.status}">${statusLabel(r.status)}</span>
            <div class="action-btns">${actionBtns}</div>
          </div>
        </div>`;
    }).join('');
  };

  // ── Mark Under Review ───────────────────────────────────────────────────────
  window.markUnderReview = async function (id) {
    const r = REPORTS.find(x => x.id === id);
    if (!r) return;
    try {
      await HS.reports.resolve(id, { status: 'under_review' });
      r.status = 'under_review';
      HS.audit.log('Marked report under review', 'report', r.subject + ' – ' + r.listingTitle);
    } catch (err) {
      showToast('Could not update the report: ' + err.message);
      return;
    }
    renderReports();
  };

  // ── Add comment ─────────────────────────────────────────────────────────────
  // There is one admin_notes field per report, so a new note replaces the old one.
  window.addComment = async function (id) {
    const r = REPORTS.find(x => x.id === id);
    if (!r) return;
    const textarea = document.getElementById('commentTextarea');
    const text = textarea.value.trim();
    if (!text) {
      showToast('Please enter a comment');
      return;
    }
    try {
      await HS.reports.resolve(id, { status: r.status === 'rejected' ? 'dismissed' : r.status, adminNotes: text });
    } catch (err) {
      showToast('Could not save your note: ' + err.message);
      return;
    }
    const at = new Date().toISOString().slice(0, 16).replace('T', ' ');
    r.adminNotes = text;
    r.comments = [{ text, by: 'Admin', at }];
    textarea.value = '';
    openModal(id);
    showToast('Note saved');
  };

  // ── Take action (resolve) ───────────────────────────────────────────────────
  window.takeAction = async function (id, action) {
    const r = REPORTS.find(x => x.id === id);
    if (!r) return;
    const dbStatus = action === 'report_rejected' ? 'dismissed' : 'resolved';
    const label = ACTION_LABELS[action] || action;

    try {
      await HS.reports.resolve(id, { status: dbStatus, actionTaken: action });
      HS.audit.log('Resolved report', 'report', r.subject + ' – ' + label);
    } catch (err) {
      showToast('Could not record your action: ' + err.message);
      return;
    }

    r.actionTaken = action;
    r.status = dbStatus === 'dismissed' ? 'rejected' : 'resolved';
    renderReports();
    closeModal();
    showToast(`Action taken: ${label}. Reporter has been notified.`);
  };

  // ── Modal ───────────────────────────────────────────────────────────────────
  window.openModal = function (id) {
    const r = REPORTS.find(x => x.id === id);
    if (!r) return;
    const reporterName = r.reporterName || 'Kasafide user';
    const listing = r.listingTitle ? { title: r.listingTitle } : null;
    const seller = r.sellerName ? { firstName: r.sellerName, lastName: '' } : null;
    const { cls, svg } = severityIcon(r.severity);

    const isActionable = r.status === 'pending' || r.status === 'under_review';

    const actionPanel = isActionable ? `
      <div class="modal-section-label" style="margin-top:18px">Take Action</div>
      <div class="action-grid">
        ${r.type === 'listing' ? `
          <button class="action-btn danger" onclick="takeAction('${r.id}','listing_removed')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Remove Listing
          </button>
          <button class="action-btn warning" onclick="takeAction('${r.id}','corrections_requested')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Request Corrections
          </button>
        ` : ''}
        <button class="action-btn warning" onclick="takeAction('${r.id}','warning_issued')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Issue Warning
        </button>
        ${r.type === 'seller' ? `
          <button class="action-btn danger" onclick="takeAction('${r.id}','account_suspended')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Suspend Account
          </button>
        ` : ''}
        <button class="action-btn neutral" onclick="takeAction('${r.id}','report_rejected')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Reject Report
        </button>
      </div>` : (r.actionTaken ? `
      <div class="modal-section-label" style="margin-top:18px">Action Taken</div>
      <div class="action-result"><span class="badge ${r.status}">${statusLabel(r.status)}</span> ${ACTION_LABELS[r.actionTaken]}</div>
      ` : '');

    const photoStrip = listing && listing.images && listing.images.length
      ? `<div class="modal-section-label">Listing Photos</div>
         <div class="modal-photo-strip">
           ${listing.images.map(src => `<img src="${src}" alt="Listing photo" class="modal-photo" />`).join('')}
         </div>`
      : '';

    const commentsSection = `
      <div class="modal-section-label">Internal Comments</div>
      ${r.comments.length ? `
        <div class="comments-list">
          ${r.comments.map(c => `
            <div class="comment-item">
              <div class="comment-header">
                <strong>${c.by}</strong>
                <span class="comment-time">${c.at}</span>
              </div>
              <div class="comment-text">${c.text}</div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="comments-empty">No comments yet</div>'}
      <div class="comment-input-row">
        <textarea id="commentTextarea" class="comment-textarea" placeholder="Add internal note or comment..." rows="2"></textarea>
        <button class="btn-add-comment" onclick="addComment('${r.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Add Comment
        </button>
      </div>
    `;

    document.getElementById('reportModalContent').innerHTML = `
      <div class="modal-header ${cls}">
        <div class="modal-icon ${cls}">${svg}</div>
        <div>
          <div class="modal-title">${r.subject}</div>
          <div class="modal-sub">${r.type === 'seller' ? 'Seller Report' : 'Listing Report'} · Submitted ${r.submittedAt}</div>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-section-label">Description</div>
        <div class="modal-text">${r.description}</div>
        ${photoStrip}
        <div class="modal-section-label">Details</div>
        <div class="modal-detail">
          <div class="modal-detail-item"><label>Reported By</label><span>${reporterName}</span></div>
          <div class="modal-detail-item"><label>Severity</label><span style="text-transform:capitalize">${r.severity}</span></div>
          <div class="modal-detail-item"><label>Listing</label><span>${listing ? listing.title : r.listingId}</span></div>
          <div class="modal-detail-item"><label>Seller</label><span>${seller ? seller.firstName + ' ' + seller.lastName : '—'}</span></div>
          <div class="modal-detail-item"><label>Status</label><span style="text-transform:capitalize">${statusLabel(r.status)}</span></div>
          <div class="modal-detail-item"><label>Submitted</label><span>${r.submittedAt}</span></div>
        </div>
        ${commentsSection}
        ${actionPanel}
      </div>
      <div class="modal-actions">
        ${r.status === 'pending' ? `<button class="btn-modal review" onclick="markUnderReview('${r.id}');closeModal()">Mark Under Review</button>` : ''}
        <button class="btn-modal close" onclick="closeModal()">Close</button>
      </div>`;
    document.getElementById('reportModal').classList.add('open');
  };

  window.closeModal = function () {
    document.getElementById('reportModal').classList.remove('open');
  };

  document.getElementById('reportModal').addEventListener('click', e => {
    if (e.target === document.getElementById('reportModal')) closeModal();
  });

  // ── Toast notification ──────────────────────────────────────────────────────
  window.showToast = function (msg) {
    const t = document.createElement('div');
    t.className = 'hs-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
  };

  renderReports();
})();

