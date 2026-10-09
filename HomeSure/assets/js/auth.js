// ══════════════════════════════════════════════════════════════════════════════
// Password Peek-a-Boo Icons
// Because trust issues are real and you deserve to see what you typed
// ══════════════════════════════════════════════════════════════════════════════
const eyeOpen = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOff  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

// ══════════════════════════════════════════════════════════════════════════════
// Theme Toggle Icons
// For the vampires who code at 3AM and the early birds who don't
// ══════════════════════════════════════════════════════════════════════════════
const sunIcon  = `<svg id="themeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonIcon = `<svg id="themeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

// ──────────────────────────────────────────────────────────────────────────────
// togglePw() — Show/Hide Password
// "Did I type 'password123' or 'passw0rd123'?" - Everyone, always
// ──────────────────────────────────────────────────────────────────────────────
function togglePw(id, btn) {
  const input = document.getElementById(id);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? eyeOff : eyeOpen;
}

// ──────────────────────────────────────────────────────────────────────────────
// applyAuthTheme() — Apply Light or Dark Mode
// Your eyeballs called, they have opinions about brightness levels
// ──────────────────────────────────────────────────────────────────────────────
function applyAuthTheme(mode) {
  document.body.classList.toggle('dark',  mode === 'dark');
  document.body.classList.toggle('light', mode === 'light');
  const iconEl = document.getElementById('themeIcon');
  if (iconEl) iconEl.outerHTML = mode === 'dark' ? moonIcon : sunIcon;
}

// ──────────────────────────────────────────────────────────────────────────────
// toggleTheme() — Switch Between Light and Dark Mode
// Clicking this at 2AM? We don't judge. Much.
// ──────────────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('hs-theme', next);
  applyAuthTheme(next);
}

// ──────────────────────────────────────────────────────────────────────────────
// setRole() — Toggle Between Buyer and Seller
// Identity crisis? Solved with one click.
// ──────────────────────────────────────────────────────────────────────────────
function setRole(role) {
  document.getElementById('buyerBtn').classList.toggle('active',  role === 'buyer');
  document.getElementById('sellerBtn').classList.toggle('active', role === 'seller');
}

// ══════════════════════════════════════════════════════════════════════════════
// Validation Helpers
// Because "oops" is not a valid error message
// ══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────────
// showError() — Display Validation Error
// The polite way to tell users they messed up
// ──────────────────────────────────────────────────────────────────────────────
function showError(input, message) {
  input.classList.add('error');
  const group = input.closest('.field-group');
  let msg = group.querySelector('.field-error-msg');
  if (!msg) {
    msg = document.createElement('span');
    msg.className = 'field-error-msg';
    group.appendChild(msg);
  }
  msg.textContent = message;
}

// ──────────────────────────────────────────────────────────────────────────────
// clearError() — Remove Validation Error
// Redemption arc for your input fields
// ──────────────────────────────────────────────────────────────────────────────
function clearError(input) {
  input.classList.remove('error');
  const group = input && input.closest('.field-group');
  const msg = group && group.querySelector('.field-error-msg');
  if (msg) msg.textContent = '';
}

// ── Sign In ───────────────────────────────────────────────────────────────────

function submitSignin() {
  const email = document.querySelector('input[type="email"]');
  const pw    = document.getElementById('pw1');
  let valid   = true;

  if (!email.value.trim()) {
    showError(email, 'Email is required'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, 'Enter a valid email address'); valid = false;
  } else { clearError(email); }

  if (!pw.value) {
    showError(pw, 'Password is required'); valid = false;
  } else { clearError(pw); }

  if (!valid) return;

  // Check if account exists first
  const emailVal = email.value.trim();
  const userExists = window.FAKE_USERS?.find(u => u.email.toLowerCase() === emailVal.toLowerCase());

  if (!userExists) {
    // No account with this email
    showError(email, 'No account found with this email');
    clearError(pw);
    return;
  }

  // Account exists, now check password
  const user = fakeLogin(emailVal, pw.value);
  if (!user) {
    // Wrong password
    showError(pw, 'Incorrect password');
    clearError(email);
    return;
  }

  saveSession(user);
  redirectToDashboard(user.role);
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

function validateSignup() {
  let valid = true;

  const surname   = document.querySelector('input[placeholder="Surname"]');
  const firstName = document.querySelector('input[placeholder="First Name"]');
  const email     = document.querySelector('input[type="email"]');
  const phone     = document.querySelector('input[type="tel"]');
  const pw1       = document.getElementById('pw1');
  const pw2       = document.getElementById('pw2');

  if (!surname.value.trim())   { showError(surname,   'Surname is required');          valid = false; } else clearError(surname);
  if (!firstName.value.trim()) { showError(firstName, 'First name is required');       valid = false; } else clearError(firstName);

  if (!email.value.trim()) {
    showError(email, 'Email is required'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, 'Enter a valid email address'); valid = false;
  } else { clearError(email); }

  if (!phone.value.trim()) { showError(phone, 'Phone number is required'); valid = false; } else clearError(phone);

  if (!pw1.value) {
    showError(pw1, 'Password is required'); valid = false;
  } else if (pw1.value.length < 8) {
    showError(pw1, 'Must be at least 8 characters'); valid = false;
  } else { clearError(pw1); }

  if (!pw2.value) {
    showError(pw2, 'Please confirm your password'); valid = false;
  } else if (pw2.value !== pw1.value) {
    showError(pw2, 'Passwords do not match'); valid = false;
  } else { clearError(pw2); }

  return valid;
}

// ── Agree checkbox → enable/disable sign up button ───────────────────────────
function toggleSignupBtn() {
  const checked = document.getElementById('agreeCheck')?.checked;
  const btn     = document.getElementById('signupBtn');
  if (!btn) return;
  btn.disabled       = !checked;
  btn.style.opacity  = checked ? '1'            : '0.45';
  btn.style.cursor   = checked ? 'pointer'      : 'not-allowed';
}

// ── Verify Email Modal ────────────────────────────────────────────────────────

let _resendTimer = null;

function openVerifyModal() {
  if (!validateSignup()) return;
  const email = document.querySelector('input[type="email"]').value.trim();
  document.getElementById('modalEmail').textContent = email;
  document.getElementById('verifyModal').classList.add('active');
  startCountdown(32);
}

function closeModal() {
  document.getElementById('verifyModal').classList.remove('active');
  clearInterval(_resendTimer);
}

function startCountdown(seconds) {
  const btn = document.getElementById('resendBtn');
  const countdown = document.getElementById('resendCountdown');
  btn.disabled = true;
  let remaining = seconds;
  countdown.textContent = `Resend in ${remaining}s`;
  _resendTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(_resendTimer);
      countdown.textContent = '';
      btn.disabled = false;
    } else {
      countdown.textContent = `Resend in ${remaining}s`;
    }
  }, 1000);
}

function resendEmail() {
  clearInterval(_resendTimer);
  startCountdown(32);
}

// ── Forgot Password ───────────────────────────────────────────────────────────

let _fpTimer = null;

function submitForgotPassword() {
  const input = document.getElementById('fpEmail');
  if (!input) return;
  if (!input.value.trim()) { showError(input, 'Email is required'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { showError(input, 'Enter a valid email address'); return; }
  clearError(input);
  document.getElementById('sentEmail').textContent = input.value.trim();
  document.getElementById('formView').style.display    = 'none';
  document.getElementById('successView').style.display = '';
  startFpCountdown(32);
}

function startFpCountdown(seconds) {
  const btn = document.getElementById('fpResendBtn');
  const countdown = document.getElementById('fpCountdown');
  btn.disabled = true;
  let remaining = seconds;
  countdown.textContent = `Resend in ${remaining}s`;
  _fpTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) { clearInterval(_fpTimer); countdown.textContent = ''; btn.disabled = false; }
    else countdown.textContent = `Resend in ${remaining}s`;
  }, 1000);
}

function resendReset() { clearInterval(_fpTimer); startFpCountdown(32); }

// ── Dodge Button Easter Egg REMOVED ───────────────────────────────────────────
// QA feedback: Button moving causes bad UX. Removed all dodge functionality.

// ── Google Toast ──────────────────────────────────────────────────────────────

function showGoogleToast() {
  let toast = document.getElementById('googleToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'googleToast';
    toast.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(12px);
      background:#1c2f42; border:1px solid rgba(255,255,255,0.1);
      color:#e8f0f5; font-family:'Plus Jakarta Sans',sans-serif;
      font-size:13px; font-weight:500; padding:12px 20px;
      border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,0.4);
      display:flex; align-items:center; gap:10px;
      opacity:0; transition:opacity 0.2s, transform 0.2s; z-index:9999;
      white-space:nowrap;
    `;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Google Sign-In? Still cooking! 🍳
    `;
    document.body.appendChild(toast);
  }
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(12px)';
  }, 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyAuthTheme(localStorage.getItem('hs-theme') || 'light');

  const backdrop = document.getElementById('verifyModal');
  if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

  const isSignup = !!document.getElementById('pw2');

  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (isSignup) openVerifyModal();
        else submitSignin();
      }
    });
  });
});
