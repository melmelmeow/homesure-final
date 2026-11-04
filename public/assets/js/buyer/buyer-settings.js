
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'settings' });
  HomeSureTopbar.init({ placeholder: 'Search settings...' });

  // ── Toast ────────────────────────────────────────────────────────────────
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

  // ── Password ─────────────────────────────────────────────────────────────
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
    label.className     = 'pw-strength-label ' + (levels[score] || '');
    label.textContent   = texts[score] || '';
  }

  async function savePassword() {
    const cur = document.getElementById('currentPw').value;
    const nw  = document.getElementById('newPw').value;
    const cf  = document.getElementById('confirmPw').value;

    if (!cur || !nw || !cf) { showToast('Please fill in all password fields.', 'error'); return; }
    if (nw.length < 8)          { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (!/[A-Z]/.test(nw))      { showToast('Password must include an uppercase letter.', 'error'); return; }
    if (!/[0-9]/.test(nw))      { showToast('Password must include a number.', 'error'); return; }
    if (!/[^A-Za-z0-9]/.test(nw)) { showToast('Password must include a special character.', 'error'); return; }
    if (nw !== cf) { showToast('New passwords do not match.', 'error'); return; }

    // Supabase verifies the current password by re-signing in, then sets the new one.
    // Nothing here ever sees a stored password.
    try {
      await HS.auth.changePassword(cur, nw);
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    document.getElementById('pwForm').classList.remove('open');
    document.getElementById('changePwBtn').innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Change Password`;
    ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).value = '');
    showToast('Password updated successfully.');
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────
  const twoFaStorageKey = 'hs_2fa_' + (user ? user.id : 'default');
  let twoFaEnabled = localStorage.getItem(twoFaStorageKey) === 'true';
  let twoFaResendInterval = null;

  if (twoFaEnabled) {
    const toggleEl = document.getElementById('twoFaToggle');
    if (toggleEl) toggleEl.checked = true;
    setTwoFaStatus(true);
  }

  async function handle2FA(checkbox) {
    if (checkbox.checked && !twoFaEnabled) {
      document.getElementById('twoFaEmailTarget').textContent = user.email || 'your account';
      document.getElementById('twoFaModal').classList.add('open');
      document.getElementById('twoFaError').classList.remove('show');
      document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
      start2FAResendTimer();
      setTimeout(() => document.querySelectorAll('#twoFaBoxes .otp-box')[0].focus(), 100);

      // Trigger real OTP delivery via Brevo Email & SMS
      try {
        await fetch('/api/auth/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', email: user.email, phone: user.phone || '' })
        });
      } catch (e) {
        console.warn('Could not trigger 2FA email/SMS:', e);
      }
    } else if (!checkbox.checked && twoFaEnabled) {
      twoFaEnabled = false;
      localStorage.removeItem(twoFaStorageKey);
      setTwoFaStatus(false);
      showToast('Two-factor authentication disabled.');
    }
  }

  function start2FAResendTimer() {
    clearInterval(twoFaResendInterval);
    let secs = 30;
    const timerEl  = document.getElementById('twoFaTimer');
    const textEl   = document.getElementById('twoFaResendText');
    const linkEl   = document.getElementById('twoFaResendLink');
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

  async function resend2FA() {
    document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
    document.getElementById('twoFaError').classList.remove('show');
    document.getElementById('twoFaResendText').style.display = 'inline';
    start2FAResendTimer();

    try {
      await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: user.email, phone: user.phone || '' })
      });
      showToast('Verification code resent via Brevo to ' + (user.email || 'your account') + '.');
    } catch (e) {
      showToast('Code sent (simulated). Check your inbox.');
    }
  }

  function close2FA(e) {
    if (e) e.stopPropagation();
    clearInterval(twoFaResendInterval);
    document.getElementById('twoFaModal').classList.remove('open');
    document.getElementById('twoFaError').classList.remove('show');
    if (!twoFaEnabled) document.getElementById('twoFaToggle').checked = false;
  }

  async function verify2FA() {
    const code = [...document.querySelectorAll('#twoFaBoxes .otp-box')].map(b => b.value).join('');
    if (code.length < 6) { showToast('Please enter the full 6-digit code.', 'error'); return; }

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: user.email, phone: user.phone || '', code })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        twoFaEnabled = true;
        localStorage.setItem(twoFaStorageKey, 'true');
        clearInterval(twoFaResendInterval);
        setTwoFaStatus(true);
        document.getElementById('twoFaToggle').checked = true;
        document.getElementById('twoFaModal').classList.remove('open');
        document.getElementById('twoFaError').classList.remove('show');
        showToast('Two-factor authentication enabled!');
        return;
      } else {
        document.getElementById('twoFaError').textContent = data.error || 'Invalid code. Please try again.';
        document.getElementById('twoFaError').classList.add('show');
        document.querySelectorAll('#twoFaBoxes .otp-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
        document.querySelectorAll('#twoFaBoxes .otp-box')[0].focus();
      }
    } catch (err) {
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

  document.querySelectorAll('#twoFaBoxes .otp-box').forEach((box, i, boxes) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      box.classList.toggle('filled', box.value !== '');
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
    });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (!paste) return;
      boxes.forEach((b, idx) => {
        b.value = paste[idx] || '';
        b.classList.toggle('filled', !!b.value);
      });
      const nextIdx = Math.min(paste.length, 5);
      if (boxes[nextIdx]) boxes[nextIdx].focus();
    });
  });

  // ── SMS toggle: requires verified phone ───────────────────────────────────
  (function initSmsToggle() {
    const smsInput = document.getElementById('notifSms');
    const smsRow   = smsInput.closest('.setting-row');
    const hasPhone = Boolean(user && (user.phone || user.phoneVerified));
    if (!hasPhone) {
      smsInput.disabled = true;
      smsInput.checked  = false;
      document.getElementById('notifSms-lbl').textContent = 'Off';
      document.getElementById('notifSms-lbl').className   = 'toggle-state';
      let hint = smsRow.querySelector('.sms-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'sms-hint';
        hint.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Add your phone number in <a href="profile.html">My Profile</a> to enable SMS`;
        smsRow.querySelector('.setting-info').appendChild(hint);
      }
    } else {
      smsInput.disabled = false;
    }
  })();

  // ── Notifications ─────────────────────────────────────────────────────────
  function updateToggleLabel(input, labelId) {
    const lbl = document.getElementById(labelId);
    if (!lbl) return;
    lbl.textContent = input.checked ? 'On' : 'Off';
    lbl.className = 'toggle-state' + (input.checked ? ' on' : '');
  }

  function updateChannelDependency() {
    const anyOn = ['notifEmail','notifSms','notifPush'].some(id => document.getElementById(id)?.checked);
    ['rowNewListing','rowPriceDrop','rowMessages','rowPromo'].forEach(id => {
      const row = document.getElementById(id);
      if (row) row.classList.toggle('dimmed', !anyOn);
    });
  }

  function saveNotifications() {
    const msg = document.getElementById('notifSavedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 3000);
  }

  // ── Account Deletion ──────────────────────────────────────────────────────
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

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    const formatted = deletionDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const daysLeft = 30;

    closeDeleteModal();

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

  // ── Theme Toggle ─────────────────────────────────────────────────────────
  function getTheme() {
    return localStorage.getItem('hs-theme') || 'dark';
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('hs-theme', mode);
    updateThemeButtons(mode);
  }

  function updateThemeButtons(mode) {
    const lightBtn = document.getElementById('themeLight');
    const darkBtn = document.getElementById('themeDark');

    if (mode === 'light') {
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
    } else {
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
    }
  }

  window.setTheme = function(mode) {
    applyTheme(mode);
    showToast(`Theme changed to ${mode} mode`);
  };

  // Initialize theme on page load
  const currentTheme = getTheme();
  applyTheme(currentTheme);

  // Google Client 2FA verification
  window.verifyWithGoogleClient = function() {
    showToast('Connecting to Google Client...');
    const width = 500, height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.location.href = '/api/auth/google?action=verify2fa&redirect=' + encodeURIComponent(window.location.href);
  };
