// HomeSure – Seller MOA

(function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'moa' });
  HomeSureTopbar.init({ placeholder: 'Memorandum of Agreement' });

  const fullUser   = FAKE_USERS.find(u => u.id === user.id);
  const storageKey = 'hs-moa-signed-' + user.id;

  // Check signed state — prefer fake-data flag, fall back to localStorage
  let signedAt = (fullUser && fullUser.moaSignedAt) || localStorage.getItem(storageKey) || null;

  const col        = document.getElementById('moaCol');
  const statusBadge = document.getElementById('moaStatusBadge');

  // ── Status badge ──────────────────────────────────────────────────────────────
  function renderStatusBadge() {
    statusBadge.innerHTML = signedAt
      ? `<span class="moa-signed-badge">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
           Signed on ${fmtDate(signedAt)}
         </span>`
      : `<span class="moa-pending-badge">Awaiting Signature</span>`;
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // ── MOA document text ─────────────────────────────────────────────────────────
  const MOA_SECTIONS = [
    {
      title: 'RECITALS',
      body: `This Memorandum of Agreement ("MOA") is entered into by and between HomeSure Online Property Marketplace ("HomeSure" or "the Platform") and the undersigned registered seller ("the Seller") on the date of electronic acceptance below.

HomeSure is an online real estate marketplace that connects property sellers and landlords with prospective buyers and tenants within the Municipality of Sta. Maria, Bulacan. The Seller wishes to list one or more properties on HomeSure and agrees to the following terms and conditions.`,
    },
    {
      title: 'ARTICLE I — PURPOSE',
      body: `The purpose of this MOA is to establish the rights, obligations, and responsibilities of HomeSure and the Seller with respect to the posting, management, and promotion of property listings on the HomeSure platform. This agreement promotes transparency, accountability, and a safe marketplace for all parties.`,
    },
    {
      title: 'ARTICLE II — OBLIGATIONS OF THE SELLER',
      items: [
        'The Seller shall provide accurate, truthful, and complete information for all property listings, including but not limited to the property address, type, price, photos, and availability.',
        'The Seller shall not post duplicate listings, fictitious properties, or listings that the Seller does not have the authority to sell or rent.',
        'The Seller shall ensure that all property photos submitted are genuine and accurately represent the property being listed.',
        'The Seller shall respond to buyer or tenant inquiries in a timely and professional manner.',
        'The Seller shall immediately notify HomeSure of any changes in property status (e.g., property has been sold or rented).',
        'The Seller shall comply with all applicable local government ordinances, national laws, and regulations governing real estate transactions in the Philippines.',
        'The Seller shall undergo and pass HomeSure's identity verification process before publishing active listings.',
        'The Seller shall not engage in any fraudulent, misleading, or deceptive practices on the platform.',
      ],
    },
    {
      title: 'ARTICLE III — OBLIGATIONS OF HOMESURE',
      items: [
        'HomeSure shall maintain the Seller's listings on the platform in accordance with these terms for the duration of the Seller's active account.',
        'HomeSure shall provide the Seller with access to listing management tools, inquiry notifications, and analytics within the platform.',
        'HomeSure shall handle all personal data provided by the Seller in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).',
        'HomeSure shall process verification documents securely and use them solely for identity verification purposes.',
        'HomeSure reserves the right to remove or suspend any listing found to be in violation of platform policies or applicable laws.',
        'HomeSure shall notify the Seller prior to any material changes in platform policies that affect their listed properties.',
      ],
    },
    {
      title: 'ARTICLE IV — INTELLECTUAL PROPERTY',
      body: `By submitting photos, descriptions, and other content to HomeSure, the Seller grants HomeSure a non-exclusive, royalty-free license to display, reproduce, and promote such content for the purpose of operating and marketing the platform. The Seller represents and warrants that they hold the necessary rights to all submitted content.`,
    },
    {
      title: 'ARTICLE V — CONFIDENTIALITY',
      body: `Both parties agree to keep confidential any proprietary or sensitive information exchanged under this MOA and not to disclose such information to third parties without prior written consent, except as required by law.`,
    },
    {
      title: 'ARTICLE VI — TERM AND TERMINATION',
      body: `This MOA shall be effective upon the Seller's electronic acceptance and shall remain in force for the duration of the Seller's active registration on the HomeSure platform.

Either party may terminate this agreement upon thirty (30) days' written or electronic notice. HomeSure reserves the right to immediately terminate this MOA and suspend the Seller's account in cases of fraud, gross negligence, or serious violation of platform policies.`,
    },
    {
      title: 'ARTICLE VII — DISPUTE RESOLUTION',
      body: `In the event of any dispute arising from this MOA, the parties shall first attempt to resolve the matter through good-faith negotiation. If the dispute cannot be resolved within thirty (30) days, the matter shall be referred to the appropriate government authority or courts of the Philippines having jurisdiction.`,
    },
    {
      title: 'ARTICLE VIII — GOVERNING LAW',
      body: `This MOA shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any legal action arising from this agreement shall be brought before the proper courts of Bulacan, Philippines.`,
    },
  ];

  // ── Render MOA ────────────────────────────────────────────────────────────────
  function render() {
    renderStatusBadge();

    const sectionsHtml = MOA_SECTIONS.map(s => `
      <div class="moa-section">
        <div class="moa-section-title">${s.title}</div>
        ${s.body   ? `<p class="moa-section-body">${s.body.replace(/\n\n/g, '</p><p class="moa-section-body">')}</p>` : ''}
        ${s.items  ? `<ol class="moa-list">${s.items.map(i => `<li>${i}</li>`).join('')}</ol>` : ''}
      </div>`).join('');

    if (signedAt) {
      col.innerHTML = `
        <!-- Already signed -->
        <div class="signed-banner">
          <div class="signed-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div class="signed-title">MOA Successfully Signed</div>
            <div class="signed-desc">You signed this Memorandum of Agreement on <strong>${fmtDate(signedAt)}</strong>. A copy is kept on record by HomeSure. You can review the full document below.</div>
          </div>
        </div>

        <div class="moa-doc readonly">
          <div class="moa-doc-header">
            <div class="moa-doc-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div class="moa-doc-title">MEMORANDUM OF AGREEMENT</div>
              <div class="moa-doc-subtitle">HomeSure Online Property Marketplace &amp; Property Seller</div>
            </div>
          </div>
          <div class="moa-body">${sectionsHtml}</div>
          <div class="moa-signature-block">
            <div class="sig-row">
              <div class="sig-item">
                <div class="sig-name">HomeSure Platform</div>
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Representative</div>
                <div class="sig-date">Date: ${fmtDate(signedAt)}</div>
              </div>
              <div class="sig-item">
                <div class="sig-name">${fullUser ? fullUser.firstName + ' ' + fullUser.lastName : user.firstName + ' ' + user.lastName}</div>
                <div class="sig-line"></div>
                <div class="sig-label">Seller / Property Owner</div>
                <div class="sig-date">Date: ${fmtDate(signedAt)}</div>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      col.innerHTML = `
        <!-- Needs to sign -->
        <div class="banner-card">
          <div class="banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div class="banner-title">Signature Required</div>
            <div class="banner-desc">Please read the entire Memorandum of Agreement below. Scroll to the bottom to sign. You must sign before your listings can be made active.</div>
          </div>
        </div>

        <div class="moa-doc" id="moaDocument">
          <div class="moa-doc-header">
            <div class="moa-doc-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div class="moa-doc-title">MEMORANDUM OF AGREEMENT</div>
              <div class="moa-doc-subtitle">HomeSure Online Property Marketplace &amp; Property Seller</div>
            </div>
          </div>
          <div class="moa-body">${sectionsHtml}</div>
        </div>

        <div class="sign-panel" id="signPanel">
          <div class="sign-panel-inner">
            <label class="agree-check">
              <input type="checkbox" id="agreeCheck" onchange="onCheckChange()" />
              <span class="check-box"></span>
              <span class="check-label">I have fully read and understood this Memorandum of Agreement and I agree to be bound by its terms.</span>
            </label>
            <button class="btn-sign" id="signBtn" onclick="signMOA()" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              Sign MOA
            </button>
          </div>
        </div>`;
    }
  }

  render();

  // ── Checkbox toggle ───────────────────────────────────────────────────────────
  window.onCheckChange = function () {
    const checked = document.getElementById('agreeCheck').checked;
    document.getElementById('signBtn').disabled = !checked;
  };

  // ── Sign action ───────────────────────────────────────────────────────────────
  window.signMOA = function () {
    const btn = document.getElementById('signBtn');
    btn.disabled = true;
    btn.textContent = 'Signing…';

    setTimeout(() => {
      const now = new Date().toISOString().split('T')[0];
      localStorage.setItem(storageKey, now);
      signedAt = now;
      if (fullUser) fullUser.moaSignedAt = now;
      showToast('MOA signed successfully! Your listings are now eligible for activation.');
      setTimeout(() => render(), 800);
    }, 900);
  };

  // ── Toast ─────────────────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
  }
})();
