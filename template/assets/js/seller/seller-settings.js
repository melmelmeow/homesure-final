
  const user = getSession();
  if (!user || user.role !== 'seller') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'settings' });
  HomeSureTopbar.init({ placeholder: 'Search settings...' });

  // ── Pre-fill personal info ──────────────────────────────────────────────────
  const fullUser = FAKE_USERS.find(u => u.id === user.id) || {};
  document.getElementById('profileName').value     = fullUser.name  || user.name  || '';
  document.getElementById('profileEmail').value    = fullUser.email || user.email || '';
  document.getElementById('profilePhone').value    = fullUser.phone || '';
  document.getElementById('profileLocation').value = fullUser.location || 'Sta. Maria, Bulacan';

  // ── Identity Verification status ───────────────────────────────────────────
  (function renderVerifyStatus() {
    const status  = fullUser.accountStatus || 'unverified';
    const expiry  = fullUser.verificationExpiry ? new Date(fullUser.verificationExpiry) : null;
    const today   = new Date();
    const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : null;
    const isNearExpiry = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
    const isExpired    = daysLeft !== null && daysLeft <= 0;

    const row = document.getElementById('verifyStatusRow');

    const expiryFormatted = expiry ? expiry.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
    const verifiedFormatted = fullUser.verifiedAt
      ? new Date(fullUser.verifiedAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    if (status === 'verified') {
      // Expiry warning banner (always shown for verified sellers)
      let expiryBanner = '';
      if (isExpired) {
        expiryBanner = `
          <div style="display:flex;align-items:flex-start;gap:12px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.3);border-radius:10px;padding:14px 16px;margin:0 22px 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:#f87171;margin-bottom:3px;">Verification Expired</div>
              <div style="font-size:12px;color:var(--muted2);line-height:1.5;">Your verification expired on <strong>${expiryFormatted}</strong>. Your listings have been paused. Please re-verify to continue publishing.</div>
            </div>
            <a href="verification.html?reverify=true" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;background:#f87171;color:#fff;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;">Re-verify Now</a>
          </div>`;
      } else if (isNearExpiry) {
        expiryBanner = `
          <div style="display:flex;align-items:flex-start;gap:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:10px;padding:14px 16px;margin:0 22px 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:3px;">Verification Expiring Soon</div>
              <div style="font-size:12px;color:var(--muted2);line-height:1.5;">Your verification expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> on <strong>${expiryFormatted}</strong>. Re-verify before it expires to avoid listing interruptions.</div>
            </div>
            <a href="verification.html?reverify=true" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;">Re-verify</a>
          </div>`;
      } else {
        expiryBanner = `
          <div style="display:flex;align-items:center;gap:10px;background:rgba(0,201,167,0.06);border:1px solid rgba(0,201,167,0.18);border-radius:10px;padding:12px 16px;margin:0 22px 0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style="font-size:12px;color:var(--muted2);">Verification valid until <strong style="color:var(--teal)">${expiryFormatted}</strong>${daysLeft ? ' · ' + daysLeft + ' days remaining' : ''}</span>
          </div>`;
      }

      row.innerHTML = `
        <div class="setting-row" style="border-bottom:none">
          <div class="setting-info">
            <span class="verify-status-label verified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Identity Verified
            </span>
            <div class="setting-desc" style="margin-top:6px;">
              Your identity has been verified. You are authorized to publish listings.
              ${verifiedFormatted ? `<span style="display:block;margin-top:3px;font-size:11.5px;color:var(--muted);">Verified on ${verifiedFormatted} · renews every 6 months</span>` : ''}
            </div>
          </div>
          ${!isNearExpiry && !isExpired ? `<a href="verification.html?reverify=true" class="btn-ghost" style="text-decoration:none;white-space:nowrap;font-size:12.5px;">Re-verify</a>` : ''}
        </div>
        <div style="padding-bottom:16px;">${expiryBanner}</div>`;

    } else if (status === 'pending') {
      row.innerHTML = `
        <div class="setting-row" style="border-bottom:none">
          <div class="setting-info">
            <span class="verify-status-label pending">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Verification Pending
            </span>
            <div class="setting-desc" style="margin-top:6px;">Your documents are under review. This usually takes 1–2 business days.</div>
          </div>
          <span class="verify-status-label pending" style="flex-shrink:0;">Under Review</span>
        </div>`;
    } else {
      row.innerHTML = `
        <div class="setting-row" style="border-bottom:none">
          <div class="setting-info">
            <span class="verify-status-label unverified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Not Verified
            </span>
            <div class="setting-desc" style="margin-top:6px;">You need to verify your identity before publishing listings.</div>
          </div>
          <a href="verification.html" class="btn-primary" style="text-decoration:none;white-space:nowrap;">Start Verification →</a>
        </div>`;
    }
  })();

  // ── Toast ────────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = 'toast ' + type;
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastIcon').innerHTML = type === 'success'
      ? '<polyline points="20 6 9 17 4 12"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ── Personal info ────────────────────────────────────────────────────────────
  function savePersonalInfo() {
    const name  = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    if (!name) { showToast('Please enter your full name.', 'error'); return; }
    showToast('Personal information updated.');
  }

  // ── Password ─────────────────────────────────────────────────────────────────
  function togglePwForm() {
    const form = document.getElementById('pwForm');
    const btn  = document.getElementById('changePwBtn');
    const isOpen = form.classList.contains('open');
    form.classList.toggle('open');
    btn.innerHTML = isOpen
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Change Password`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Hide Form`;
    if (isOpen) {
      ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).value = '');
      checkStrength('');
    }
  }

  function toggleVis(inputId, btn) {
    const inp = document.getElementById(inputId);
    const isHidden = inp.type === 'password';
    inp.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  function checkStrength(val) {
    const wrap  = document.getElementById('pwStrengthWrap');
    const label = document.getElementById('pwStrengthLabel');
    const reqs  = document.getElementById('pwRequirements');
    const bars  = [1,2,3,4].map(n => document.getElementById('pwBar' + n));

    if (!val) {
      wrap.classList.remove('show');
      reqs.classList.remove('show');
      bars.forEach(b => b.className = 'pw-bar');
      return;
    }

    wrap.classList.add('show');
    reqs.classList.add('show');

    const checks = {
      len:     val.length >= 8,
      upper:   /[A-Z]/.test(val),
      num:     /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val),
    };

    ['len','upper','num','special'].forEach(key => {
      const el = document.getElementById('req-' + key);
      el.classList.toggle('met', checks[key]);
      el.querySelector('svg').innerHTML = checks[key]
        ? '<polyline points="20 6 9 17 4 12"/>'
        : '<circle cx="12" cy="12" r="10"/>';
    });

    const score = Object.values(checks).filter(Boolean).length;
    const levels = ['','weak','fair','good','strong'];
    const texts  = ['','Weak','Fair','Good','Strong'];

    bars.forEach((b, i) => {
      b.className = 'pw-bar' + (i < score ? ' ' + levels[score] : '');
    });
    label.className   = 'pw-strength-label ' + (levels[score] || '');
    label.textContent = texts[score] || '';
  }

  function savePassword() {
    const cur = document.getElementById('currentPw').value;
    const nw  = document.getElementById('newPw').value;
    const cf  = document.getElementById('confirmPw').value;

    if (!cur || !nw || !cf) { showToast('Please fill in all password fields.', 'error'); return; }
    if (fullUser && cur !== fullUser.password) { showToast('Current password is incorrect.', 'error'); return; }
    if (nw.length < 8)              { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (!/[A-Z]/.test(nw))          { showToast('Password must include an uppercase letter.', 'error'); return; }
    if (!/[0-9]/.test(nw))          { showToast('Password must include a number.', 'error'); return; }
    if (!/[^A-Za-z0-9]/.test(nw))   { showToast('Password must include a special character.', 'error'); return; }
    if (nw !== cf) { showToast('New passwords do not match.', 'error'); return; }

    document.getElementById('pwForm').classList.remove('open');
    document.getElementById('changePwBtn').innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Change Password`;
    ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).value = '');
    showToast('Password updated successfully.');
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────────
  let twoFaEnabled = false;
  let twoFaResendInterval = null;

  function handle2FA(checkbox) {
    if (checkbox.checked && !twoFaEnabled) {
      document.getElementById('twoFaEmailTarget').textContent = user.email;
      document.getElementById('twoFaModal').classList.add('open');
      document.getElementById('twoFaError').classList.remove('show');
      document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
      start2FAResendTimer();
      setTimeout(() => document.querySelectorAll('#twoFaBoxes .otp-box')[0].focus(), 100);
    } else if (!checkbox.checked && twoFaEnabled) {
      twoFaEnabled = false;
      setTwoFaStatus(false);
      showToast('Two-factor authentication disabled.');
    }
  }

  function start2FAResendTimer() {
    clearInterval(twoFaResendInterval);
    let secs = 30;
    const timerEl = document.getElementById('twoFaTimer');
    const textEl  = document.getElementById('twoFaResendText');
    const linkEl  = document.getElementById('twoFaResendLink');
    timerEl.textContent = secs + 's';
    textEl.style.display = 'inline';
    linkEl.classList.add('disabled');
    twoFaResendInterval = setInterval(() => {
      secs--;
      if (secs <= 0) {
        clearInterval(twoFaResendInterval);
        textEl.style.display = 'none';
        linkEl.classList.remove('disabled');
      } else { timerEl.textContent = secs + 's'; }
    }, 1000);
  }

  function resend2FA() {
    document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
    document.getElementById('twoFaError').classList.remove('show');
    document.getElementById('twoFaResendText').style.display = 'inline';
    start2FAResendTimer();
    showToast('Verification code resent to ' + user.email + '.');
  }

  function close2FA(e) {
    if (e) e.stopPropagation();
    clearInterval(twoFaResendInterval);
    document.getElementById('twoFaModal').classList.remove('open');
    document.getElementById('twoFaError').classList.remove('show');
    if (!twoFaEnabled) document.getElementById('twoFaToggle').checked = false;
  }

  function verify2FA() {
    const code = [...document.querySelectorAll('#twoFaBoxes .otp-box')].map(b => b.value).join('');
    if (code.length < 6) { showToast('Please enter the full 6-digit code.', 'error'); return; }
    if (code === '123456') {
      twoFaEnabled = true;
      clearInterval(twoFaResendInterval);
      setTwoFaStatus(true);
      document.getElementById('twoFaToggle').checked = true;
      document.getElementById('twoFaModal').classList.remove('open');
      document.getElementById('twoFaError').classList.remove('show');
      showToast('Two-factor authentication enabled!');
    } else {
      document.getElementById('twoFaError').classList.add('show');
      document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
      document.querySelectorAll('#twoFaBoxes .otp-box')[0].focus();
    }
  }

  function setTwoFaStatus(enabled) {
    const textEl = document.getElementById('twoFaStatusText');
    const iconEl = document.getElementById('twoFaStatusIcon');
    const inner  = document.getElementById('twoFaStatusInner');
    textEl.textContent = enabled ? 'Two-Factor Authentication is enabled' : 'Two-Factor Authentication is disabled';
    inner.style.color  = enabled ? 'var(--teal)' : '';
    iconEl.innerHTML   = enabled
      ? '<polyline points="20 6 9 17 4 12"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }

  // OTP auto-advance for 2FA modal
  document.querySelectorAll('#twoFaBoxes .otp-box').forEach((box, i, boxes) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      box.classList.toggle('filled', box.value !== '');
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
    });
  });

  // ── Notifications ─────────────────────────────────────────────────────────────
  function updateToggleLabel(input, labelId) {
    const lbl = document.getElementById(labelId);
    if (!lbl) return;
    lbl.textContent = input.checked ? 'On' : 'Off';
    lbl.className = 'toggle-state' + (input.checked ? ' on' : '');
  }

  function updateChannelDependency() {
    const anyOn = ['notifEmail','notifSms','notifPush'].some(id => document.getElementById(id)?.checked);
    ['rowInquiries','rowMessages','rowListingStatus','rowMarket','rowPromo'].forEach(id => {
      const row = document.getElementById(id);
      if (row) row.classList.toggle('dimmed', !anyOn);
    });
  }

  function saveNotifications() {
    const msg = document.getElementById('notifSavedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 3000);
  }

  // ── Account Deletion ──────────────────────────────────────────────────────────
  function openDeleteModal() {
    document.getElementById('deleteModal').classList.add('open');
    document.getElementById('deleteEmailInput').value = '';
    document.getElementById('deleteEmailError').classList.remove('show');
  }

  function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
    document.getElementById('deleteEmailInput').value = '';
    document.getElementById('deleteEmailError').classList.remove('show');
  }

  function confirmScheduleDeletion() {
    const val = document.getElementById('deleteEmailInput').value.trim();
    if (val !== user.email) {
      document.getElementById('deleteEmailError').classList.add('show'); return;
    }

    // Schedule deletion — 30 days from now
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    const formatted = deletionDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const daysLeft = 30;

    closeDeleteModal();

    // Show pending banner, hide warning + button
    document.getElementById('deletionWarning').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'none';
    const banner = document.getElementById('pendingBanner');
    banner.style.display = 'flex';
    document.getElementById('pendingBannerSub').textContent =
      `Scheduled for ${formatted} — you have ${daysLeft} days to cancel.`;

    showToast('Account scheduled for deletion in 30 days.');
  }

  function cancelScheduledDeletion() {
    document.getElementById('pendingBanner').style.display = 'none';
    document.getElementById('deletionWarning').style.display = 'flex';
    document.getElementById('deleteBtn').style.display = '';
    showToast('Account deletion cancelled. Your account is safe.');
  }

// ══════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS
// Save once, use forever. No more typing GCash numbers at 2AM.
// ══════════════════════════════════════════════════════════════════════════

function togglePaymentMethod(method, isEnabled) {
  const fieldsId = method + 'Fields';
  const fields = document.getElementById(fieldsId);
  const header = fields.previousElementSibling;
  
  if (isEnabled) {
    fields.style.display = 'grid';
    header.classList.add('expanded');
  } else {
    fields.style.display = 'none';
    header.classList.remove('expanded');
  }
}

function savePaymentMethods() {
  const user = getSession();
  if (!user) return;

  const paymentMethods = {
    gcash: {
      enabled: document.getElementById('enableGcash').checked,
      number: document.getElementById('gcashNumber').value.trim(),
      name: document.getElementById('gcashName').value.trim()
    },
    maya: {
      enabled: document.getElementById('enableMaya').checked,
      number: document.getElementById('mayaNumber').value.trim(),
      name: document.getElementById('mayaName').value.trim()
    },
    bank: {
      enabled: document.getElementById('enableBank').checked,
      bankName: document.getElementById('bankName').value.trim(),
      accountNumber: document.getElementById('bankAccount').value.trim(),
      accountName: document.getElementById('bankAccountName').value.trim()
    }
  };

  // Validate enabled methods have all required fields
  if (paymentMethods.gcash.enabled && (!paymentMethods.gcash.number || !paymentMethods.gcash.name)) {
    showToast('Please fill in all GCash fields', 'error');
    return;
  }
  if (paymentMethods.maya.enabled && (!paymentMethods.maya.number || !paymentMethods.maya.name)) {
    showToast('Please fill in all Maya fields', 'error');
    return;
  }
  if (paymentMethods.bank.enabled && (!paymentMethods.bank.bankName || !paymentMethods.bank.accountNumber || !paymentMethods.bank.accountName)) {
    showToast('Please fill in all Bank Transfer fields', 'error');
    return;
  }

  // Save to user object
  user.paymentMethods = paymentMethods;
  updateSession(user);

  showToast('Payment methods saved successfully!', 'success');
}

function loadPaymentMethods() {
  const user = getSession();
  if (!user || !user.paymentMethods) return;

  const pm = user.paymentMethods;

  // Load GCash
  if (pm.gcash) {
    document.getElementById('enableGcash').checked = pm.gcash.enabled || false;
    document.getElementById('gcashNumber').value = pm.gcash.number || '';
    document.getElementById('gcashName').value = pm.gcash.name || '';
    if (pm.gcash.enabled) {
      document.getElementById('gcashFields').style.display = 'grid';
      document.getElementById('gcashFields').previousElementSibling.classList.add('expanded');
    }
  }

  // Load Maya
  if (pm.maya) {
    document.getElementById('enableMaya').checked = pm.maya.enabled || false;
    document.getElementById('mayaNumber').value = pm.maya.number || '';
    document.getElementById('mayaName').value = pm.maya.name || '';
    if (pm.maya.enabled) {
      document.getElementById('mayaFields').style.display = 'grid';
      document.getElementById('mayaFields').previousElementSibling.classList.add('expanded');
    }
  }

  // Load Bank
  if (pm.bank) {
    document.getElementById('enableBank').checked = pm.bank.enabled || false;
    document.getElementById('bankName').value = pm.bank.bankName || '';
    document.getElementById('bankAccount').value = pm.bank.accountNumber || '';
    document.getElementById('bankAccountName').value = pm.bank.accountName || '';
    if (pm.bank.enabled) {
      document.getElementById('bankFields').style.display = 'grid';
      document.getElementById('bankFields').previousElementSibling.classList.add('expanded');
    }
  }
}

// Load payment methods on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadPaymentMethods, 100);
});

