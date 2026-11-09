
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  KasafideSidebar.init({ activePage: 'profile' });
  KasafideTopbar.init({ placeholder: 'Identity Verification' });

  const col = document.getElementById('verifyCol');

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Reads the account's current status from the database, then draws the page.
  async function renderPage() {
  col.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading…</div>';
  let fullUser;
  try {
    fullUser = await HS.auth.refresh();
  } catch (err) {
    console.error(err);
    col.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Could not load your account. Please try again.</div>';
    return;
  }
  if (!fullUser) { window.location.href = '../../auth/signin.html'; return; }

  const isVerified = fullUser.accountStatus === 'verified' && fullUser.verificationExpiry && new Date(fullUser.verificationExpiry) >= new Date();
  const isExpired  = fullUser.accountStatus === 'verified' && fullUser.verificationExpiry && new Date(fullUser.verificationExpiry) < new Date();
  const daysLeft = fullUser.verificationExpiry
    ? Math.ceil((new Date(fullUser.verificationExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isNearExpiry = isVerified && daysLeft !== null && daysLeft <= 30;
  // Resubmitting isn't needed (and HS.verification.submit() will refuse it) until the current
  // verification is within 30 days of expiring, or already has. Comfortably-valid buyers get the
  // info card below instead of a form with nothing to actually submit.
  const canSubmit = !isVerified || isExpired || isNearExpiry;

    // Under review / last rejection (the reason is written by the admin who reviewed the documents)
    const underReview = fullUser.accountStatus === 'pending' || fullUser.accountStatus === 'reverification';
    const notices = (underReview ? `
      <div class="banner-card">
        <div class="banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="banner-title">Documents Under Review</div>
          <div class="banner-desc">We received your documents. An admin will review them within 1–2 business days. You can submit new photos below if you need to replace them.</div>
        </div>
      </div>` : '') + (fullUser.accountStatus === 'unverified' && fullUser.verificationRejectReason ? `
      <div class="banner-card danger">
        <div class="banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div class="banner-title">Your last submission was not approved</div>
          <div class="banner-desc">${fullUser.verificationRejectReason}</div>
        </div>
      </div>` : '');

  col.innerHTML = `
    ${notices}
    <div class="banner-card">
      <div class="banner-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div>
        <div class="banner-title">${isExpired ? 'Verification Expired' : isNearExpiry ? 'Verification Expiring Soon' : isVerified ? 'Identity Verified' : 'Verification Required'}</div>
        <div class="banner-desc">${
          isExpired ? 'Re-upload your government ID and a selfie to renew your verification and keep your messaging access active.'
          : isNearExpiry ? 'Your verification expires soon. Re-upload your government ID and a selfie to renew it and keep your messaging access active.'
          : isVerified ? `You're all set — your identity has been verified. You'll be able to re-verify starting 30 days before it expires.`
          : 'To message sellers and save listings, Kasafide requires identity verification. This keeps the platform safe for everyone.'
        }</div>
      </div>
    </div>

    ${(isVerified || isExpired) ? `
    <div class="verif-info-card">
      <div class="verif-info-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <div class="verif-info-label">Verified On</div>
          <div class="verif-info-value">${fmtDate(fullUser.verifiedAt)}</div>
        </div>
      </div>
      <div class="verif-info-divider"></div>
      <div class="verif-info-item ${isExpired ? 'expired' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div>
          <div class="verif-info-label">Expires On</div>
          <div class="verif-info-value">${fmtDate(fullUser.verificationExpiry)}${isExpired ? ' <span class="verif-expired-tag">Expired</span>' : ''}</div>
        </div>
      </div>
    </div>` : ''}

    ${canSubmit ? `
    <div class="section-card">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Submit Documents</div>
          <div class="section-sub">Upload a clear photo of your government-issued ID and a selfie</div>
        </div>
      </div>

      <div class="upload-grid">
        <div>
          <div class="upload-label">Government-Issued ID <span class="required-star">*</span></div>
          <div class="upload-box" id="idUploadBox" onclick="takeIDPhoto()">
            <div class="upload-box-icon" id="idIcon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <img id="idPreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;" alt="ID Preview" />
            <div class="upload-filename" id="idFileName">Click to take ID photo</div>
            <div class="upload-filesub">PNG, JPG up to 10MB &bull; Passport, Driver's License, UMID, SSS, PhilHealth</div>
          </div>
        </div>

        <div>
          <div class="upload-label">Selfie Verification <span class="required-star">*</span></div>
          <div class="upload-box" id="selfieUploadBox" onclick="takeSelfiePhoto()">
            <div class="upload-box-icon" id="selfieIcon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <img id="selfiePreview" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;" alt="Selfie Preview" />
            <div class="upload-filename" id="selfieFileName">Click to take selfie</div>
            <div class="upload-filesub">PNG, JPG up to 10MB &bull; Hold your ID next to your face</div>
          </div>
        </div>
      </div>

      <div class="tips-box">
        <span class="tips-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
        <ul class="tips-list">
          <li>Ensure your ID is clearly visible and not blurred</li>
          <li>Take the selfie in good lighting conditions</li>
          <li>Make sure your face and ID are both clearly visible in the selfie</li>
          <li>Documents will be securely stored and only used for verification</li>
        </ul>
      </div>

      <div class="submit-wrap">
        <button class="btn-primary" id="submitBtn" onclick="submitVerification()" disabled>Submit for Verification</button>
      </div>
    </div>
    ` : ''}
  `;
  }

  renderPage();

  // ══════════════════════════════════════════════════════════════════════════════
  // CAMERA CAPTURE
  // ══════════════════════════════════════════════════════════════════════════════

  let idPhotoData = null;
  let selfiePhotoData = null;

  window.takeIDPhoto = function() {
    CameraCapture.open({
      title: 'Take ID Photo',
      instructions: [
        'Place your ID on a flat surface with good lighting',
        'Make sure all text is clearly readable',
        'Avoid glare and shadows'
      ],
      onCapture: function(imageDataURL) {
        idPhotoData = imageDataURL;

        // Update preview
        const preview = document.getElementById('idPreview');
        preview.src = imageDataURL;
        preview.style.display = 'block';

        // Update text and style
        document.getElementById('idFileName').textContent = '✓ ID Photo Captured';
        document.getElementById('idUploadBox').classList.add('has-file');
        document.getElementById('idIcon').style.display = 'none';

        // Check if both photos captured
        checkBothCaptured();
        showToast('ID photo captured!');
      }
    });
  };

  window.takeSelfiePhoto = function() {
    CameraCapture.open({
      title: 'Take Selfie',
      instructions: [
        'Hold your ID next to your face',
        'Center your face in the frame',
        'Ensure good lighting and clear background'
      ],
      onCapture: function(imageDataURL) {
        selfiePhotoData = imageDataURL;

        // Update preview
        const preview = document.getElementById('selfiePreview');
        preview.src = imageDataURL;
        preview.style.display = 'block';

        // Update text and style
        document.getElementById('selfieFileName').textContent = '✓ Selfie Captured';
        document.getElementById('selfieUploadBox').classList.add('has-file');
        document.getElementById('selfieIcon').style.display = 'none';

        // Check if both photos captured
        checkBothCaptured();
        showToast('Selfie captured!');
      }
    });
  };

  function checkBothCaptured() {
    const bothCaptured = idPhotoData && selfiePhotoData;
    document.getElementById('submitBtn').disabled = !bothCaptured;
  }

  async function submitVerification() {
    if (!idPhotoData || !selfiePhotoData) {
      showToast('Please take both ID photo and selfie');
      return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    // Photos go to the private bucket; the account waits for an admin's review. Only an admin can mark
    // it verified — the database refuses a buyer who tries to do that to their own account.
    try {
      await HS.verification.submit([
        { label: 'Government-Issued ID', sources: [idPhotoData] },
        { label: 'Selfie Verification',  sources: [selfiePhotoData] },
      ]);
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = 'Submit for Verification';
      showToast('Could not submit your documents: ' + err.message);
      return;
    }

    showToast("Documents submitted! You'll be able to message sellers and save listings once an admin verifies you (within 24 hours).");

    setTimeout(() => window.location.href = 'buyer.html', 3000);
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
  }
