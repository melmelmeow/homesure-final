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
// Phone number — digits only, "+63" lives outside the input entirely (see .phone-prefix
// in auth.css), so there's nothing for the user to delete and nothing to re-insert.
// A PH mobile number is always +63 9XX XXX XXXX — the digit right after +63 is always 9 — so
// anything typed before a 9 appears is dropped rather than accepted and flagged later. Re-checked
// on every edit, not just the first keystroke: deleting the leading 9 later leaves whatever was
// next in that spot, and that gets dropped the same way.
// signup.html only; quietly does nothing elsewhere.
// ──────────────────────────────────────────────────────────────────────────────
(function () {
  const el = document.getElementById('phoneLocal');
  if (!el) return;
  el.addEventListener('input', () => {
    let digits = el.value.replace(/\D/g, '');
    while (digits.length && digits[0] !== '9') digits = digits.slice(1);
    el.value = digits.slice(0, 10);
  });
})();

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
// loadAuthBackgroundPhoto() — a real listing's photo behind the sign-in/sign-up card
//
// Replaces what used to be a single hardcoded stock photo (house_image.jpg) on every visit. Runs
// on signin.html/signup.html only — the element it needs doesn't exist on forgot-password.html, so
// it quietly does nothing there rather than erroring.
// ──────────────────────────────────────────────────────────────────────────────
(function loadAuthBackgroundPhoto() {
  const el = document.getElementById('authBgPhoto');
  if (!el || typeof HS === 'undefined' || !HS.randomListingPhoto) return;

  HS.randomListingPhoto()
    .then((url) => {
      if (!url) return;  // no approved listing has a photo yet — the gradient background stays
      el.style.backgroundImage = `url("${url}")`;
      el.classList.add('loaded');
    })
    .catch((err) => console.error('Could not load a listing photo for the auth background:', err));
})();

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

async function submitSignin() {
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

  // Signs in, loads the profile (role, verification status, saved listings) and caches it for the pages.
  let user;
  try {
    user = await HS.auth.signIn(email.value.trim(), pw.value);
  } catch (err) {
    showError(pw, err.message);
    return;
  }

  // Coming from a public listing? Buyers go straight back to it (only our own buyer pages are allowed).
  const back = new URLSearchParams(window.location.search).get('redirect');
  if (user.role === 'buyer' && back && /^module\/buyer\/[a-z-]+\.html(\?[\w=&-]*)?$/.test(back)) {
    window.location.href = '../' + back;
    return;
  }

  redirectToDashboard(user.role);
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

function validateSignup() {
  let valid = true;

  const surname   = document.querySelector('input[placeholder="Surname"]');
  const firstName = document.querySelector('input[placeholder="First Name"]');
  const email     = document.querySelector('input[type="email"]');
  const phone     = document.getElementById('phoneLocal');
  const pw1       = document.getElementById('pw1');
  const pw2       = document.getElementById('pw2');

  if (!surname.value.trim())   { showError(surname,   'Surname is required');          valid = false; } else clearError(surname);
  if (!firstName.value.trim()) { showError(firstName, 'First name is required');       valid = false; } else clearError(firstName);

  if (!email.value.trim()) {
    showError(email, 'Email is required'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, 'Enter a valid email address'); valid = false;
  } else { clearError(email); }

  // 10 digits after +63 — a PH mobile number (09XX XXX XXXX) with the leading 0 dropped, since
  // the +63 already stands in for it.
  if (!phone.value.trim()) {
    showError(phone, 'Phone number is required'); valid = false;
  } else if (phone.value.trim().length !== 10) {
    showError(phone, 'Enter a 10-digit mobile number'); valid = false;
  } else { clearError(phone); }

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

async function openVerifyModal() {
  if (!validateSignup()) return;

  const surname   = document.querySelector('input[placeholder="Surname"]').value.trim();
  const firstName = document.querySelector('input[placeholder="First Name"]').value.trim();
  const emailEl   = document.querySelector('input[type="email"]');
  const email     = emailEl.value.trim();
  const phone     = '+63' + document.getElementById('phoneLocal').value.trim();
  const password  = document.getElementById('pw1').value;
  const role      = document.getElementById('sellerBtn').classList.contains('active') ? 'seller' : 'buyer';

  // Signing up goes through our own API, not straight to Supabase.
  //
  // The auth server insists on a confirmed email but has no mail sender of its own, so its signup
  // endpoint fails every time with "Error sending confirmation email". Our route creates the
  // account unconfirmed — which sends nothing and so cannot fail that way — and emails the link
  // from this app instead. The account still cannot be used until the link is opened.
  const btn = document.getElementById('signupBtn');
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Creating your account…'; }

  let result;
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, firstName, lastName: surname, phone, role,
      }),
    });
    result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Could not create your account.');
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = label; }
    showError(emailEl, err.message);
    return;
  }

  if (btn) { btn.disabled = false; btn.textContent = label; }

  document.getElementById('modalEmail').textContent = email;
  document.getElementById('verifyModal').classList.add('active');
  startCountdown(60);
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

async function resendEmail() {
  const email = document.getElementById('modalEmail').textContent;
  const countdown = document.getElementById('resendCountdown');

  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (countdown) countdown.textContent = body.error || 'Could not resend. Try again shortly.';
      clearInterval(_resendTimer);
      startCountdown(body.retryAfter || 60);
      return;
    }
  } catch (err) {
    if (countdown) countdown.textContent = 'Could not resend. Check your connection.';
    return;
  }

  clearInterval(_resendTimer);
  startCountdown(60);
}

// ── Coming back from the confirmation link ───────────────────────────────────
// /api/auth/verify-email sends people here with ?verified=… so they see a sentence rather than
// a bare JSON response.
(function showVerificationResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('verified');
  const errorParam = urlParams.get('error');

  if (!status && !errorParam) return;

  const MESSAGES = {
    success: ['Your email is confirmed. You can sign in now.', 'ok'],
    already: ['That email was already confirmed. Go ahead and sign in.', 'ok'],
    expired: ['That link has expired. Sign up again, or use "Resend" to get a new one.', 'error'],
    invalid: ['That confirmation link is not valid. Please request a new one.', 'error'],
    missing: ['That confirmation link was incomplete. Please request a new one.', 'error'],
    failed:  ['We could not confirm your email. Please try the link again shortly.', 'error'],
    google_cancelled: ['Google sign-in was cancelled.', 'error'],
    google_not_configured: ['Google sign-in is not configured yet.', 'error'],
    google_exchange_failed: ['Could not complete Google authentication. Please try again.', 'error'],
    google_profile_failed: ['Could not read your Google profile. Please try again.', 'error'],
    create_failed: ['Could not create account via Google. Please try regular sign up.', 'error'],
    update_failed: ['Could not update account for Google sign-in. Please try again.', 'error'],
    signin_failed: ['Could not start session after Google sign-in. Please try again.', 'error'],
  };

  const key = status || errorParam;
  const [text, kind] = MESSAGES[key] || ['An error occurred during authentication. Please try again.', 'error'];

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.textContent = text;
  banner.style.cssText = `
    margin: 0 0 18px; padding: 12px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 600; line-height: 1.5;
    background: ${kind === 'ok' ? 'rgba(0,201,167,0.12)' : 'rgba(248,113,113,0.12)'};
    border: 1px solid ${kind === 'ok' ? 'rgba(0,201,167,0.35)' : 'rgba(248,113,113,0.35)'};
    color: ${kind === 'ok' ? '#0d8f7b' : '#b91c1c'};
  `;

  const form = document.querySelector('form') || document.body.firstElementChild;
  if (form && form.parentNode) form.parentNode.insertBefore(banner, form);

  // Keep the page shareable/reloadable without re-triggering the banner.
  const clean = window.location.pathname;
  window.history.replaceState({}, '', clean);
})();

// ── Forgot Password ───────────────────────────────────────────────────────────

let _fpTimer = null;

async function submitForgotPassword() {
  const input = document.getElementById('fpEmail');
  if (!input) return;
  if (!input.value.trim()) { showError(input, 'Email is required'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { showError(input, 'Enter a valid email address'); return; }
  clearError(input);

  const { error } = await sb.auth.resetPasswordForEmail(input.value.trim(), {
    // PLACEHOLDER: kailangan din i-whitelist, at kailangan ng page na tumatanggap ng bagong password
    redirectTo: window.location.origin + '/auth/signin.html'
  });
  if (error) { showError(input, error.message); return; }

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

async function resendReset() {
  const email = document.getElementById('sentEmail').textContent;
  await sb.auth.resetPasswordForEmail(email);
  clearInterval(_fpTimer);
  startFpCountdown(32);
}

// ── Dodge Button Easter Egg REMOVED ───────────────────────────────────────────
// QA feedback: Button moving causes bad UX. Removed all dodge functionality.

// ── Google Authentication ───────────────────────────────────────────────────

function signInWithGoogle() {
  const back = new URLSearchParams(window.location.search).get('redirect');
  const redirectParam = back ? '&redirect=' + encodeURIComponent(back) : '';
  window.location.href = '/api/auth/google?action=signin' + redirectParam;
}

function signUpWithGoogle() {
  const role = document.getElementById('sellerBtn')?.classList.contains('active') ? 'seller' : 'buyer';
  window.location.href = '/api/auth/google?action=signup&role=' + encodeURIComponent(role);
}

function showGoogleToast() {
  signInWithGoogle();
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyAuthTheme(localStorage.getItem('hs-theme') || 'dark');

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
