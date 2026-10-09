
  const user = getSession();
  if (!user || user.role !== 'admin') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: '' });
  HomeSureTopbar.init({ placeholder: 'Search settings...' });

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

  // ── Password ────────────────────────────────────────────────────────────────
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
    bars.forEach((b, i) => { b.className = 'pw-bar' + (i < score ? ' ' + levels[score] : ''); });
    label.className   = 'pw-strength-label ' + (levels[score] || '');
    label.textContent = texts[score] || '';
  }

  function savePassword() {
    const cur = document.getElementById('currentPw').value;
    const nw  = document.getElementById('newPw').value;
    const cf  = document.getElementById('confirmPw').value;
    const fullUser = FAKE_USERS.find(u => u.id === user.id);

    if (!cur || !nw || !cf) { showToast('Please fill in all password fields.', 'error'); return; }
    if (fullUser && cur !== fullUser.password) { showToast('Current password is incorrect.', 'error'); return; }
    if (nw.length < 8)             { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (!/[A-Z]/.test(nw))        { showToast('Password must include an uppercase letter.', 'error'); return; }
    if (!/[0-9]/.test(nw))        { showToast('Password must include a number.', 'error'); return; }
    if (!/[^A-Za-z0-9]/.test(nw)) { showToast('Password must include a special character.', 'error'); return; }
    if (nw !== cf)                 { showToast('New passwords do not match.', 'error'); return; }

    document.getElementById('pwForm').classList.remove('open');
    document.getElementById('changePwBtn').innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Change Password`;
    ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).value = '');
    showToast('Password updated successfully.');
  }

  // ── 2FA ─────────────────────────────────────────────────────────────────────
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

  function close2FA() {
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

  // ── Notifications ────────────────────────────────────────────────────────────
  function updateToggleLabel(input, labelId) {
    const lbl = document.getElementById(labelId);
    if (!lbl) return;
    lbl.textContent = input.checked ? 'On' : 'Off';
    lbl.className = 'toggle-state' + (input.checked ? ' on' : '');
  }

  function updateChannelDependency() {
    const anyOn = ['notifEmail','notifSms','notifPush'].some(id => document.getElementById(id)?.checked);
    ['rowReports','rowListings','rowUsers','rowSystem'].forEach(id => {
      const row = document.getElementById(id);
      if (row) row.classList.toggle('dimmed', !anyOn);
    });
  }

  function saveNotifications() {
    const msg = document.getElementById('notifSavedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 3000);
  }

  // ── Theme Toggle ────────────────────────────────────────────────────────────
  window.toggleTheme = function(checkbox) {
    const label = document.getElementById('theme-lbl');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (checkbox.checked) {
      // Switch to dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      label.textContent = 'Dark';
      label.classList.add('on');
    } else {
      // Switch to light mode
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      label.textContent = 'Light';
      label.classList.remove('on');
    }
  };

  // Initialize theme on page load
  (function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    const label = document.getElementById('theme-lbl');

    document.documentElement.setAttribute('data-theme', savedTheme);

    if (savedTheme === 'dark') {
      themeToggle.checked = true;
      label.textContent = 'Dark';
      label.classList.add('on');
    } else {
      themeToggle.checked = false;
      label.textContent = 'Light';
      label.classList.remove('on');
    }
  })();
