// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – Session helpers
//  Depends on: config.js (sb)
//
//  The real session lives in Supabase (localStorage, auto-refreshed). 'kasafide_user' in
//  sessionStorage is only a cached copy of the signed-in user's profile so pages can read
//  it synchronously with getSession(). It is for UX (menus, redirects); the database never
//  trusts it — Row Level Security decides what each request may do.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'kasafide_user';

// One-time move from the pre-rebrand key, so a tab that was signed in before the rename keeps
// its cached profile instead of looking signed out until the next full sign-in.
try {
  const legacy = sessionStorage.getItem('homesure_user');
  if (legacy !== null) {
    if (sessionStorage.getItem(SESSION_KEY) === null) sessionStorage.setItem(SESSION_KEY, legacy);
    sessionStorage.removeItem('homesure_user');
  }
} catch (e) { /* storage blocked: nothing to migrate */ }

function saveSession(user) {
  const session = {
    id: user.id, role: user.role,
    firstName: user.firstName, lastName: user.lastName,
    email: user.email, phone: user.phone,
    verified: user.verified, accountStatus: user.accountStatus || null,
    savedListings: user.savedListings || [],
    avatar: user.avatar || null,
    isVerified: user.isVerified || false,
    verifiedAt: user.verifiedAt || null,
    verificationExpiry: user.verificationExpiry || null,
    phoneVerified: user.phoneVerified || false,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function redirectToDashboard(role) {
  const routes = {
    buyer:      '../module/buyer/buyer.html',
    seller:     '../module/seller/seller.html',
    admin:      '../module/admin/admin.html',
    superadmin:         '../module/super-admin/super-admin.html',
    super_duper_admin:  '../module/super-admin/super-admin.html',
  };
  const path = routes[role];
  if (path) window.location.href = path;
}

function signinUrl() {
  return location.pathname.includes('/module/') ? '../../auth/signin.html' : 'auth/signin.html';
}

// Sign out of Supabase and drop the cached profile.
async function hsSignOut() {
  try { await sb.auth.signOut(); } catch (e) { /* offline: still clear the local copy */ }
  clearSession();
}

// For pages that need a signed-in user of a given role. Redirects to sign-in otherwise.
//   const user = await requireRole('seller'); if (!user) return;
async function requireRole(...roles) {
  const cached = getSession();
  const { data } = await sb.auth.getSession();

  if (!data.session) {
    clearSession();
    window.location.href = signinUrl();
    return null;
  }
  if (!cached || !roles.includes(cached.role)) {
    window.location.href = signinUrl();
    return null;
  }
  return cached;
}

// If the Supabase session is gone (expired, signed out in another tab) the cached profile is stale.
(function dropStaleSession() {
  if (typeof sb === 'undefined') return;
  const inModule = location.pathname.includes('/module/');

  if (getSession()) {
    sb.auth.getSession().then(({ data }) => {
      if (data && data.session) return;
      clearSession();
      if (inModule) window.location.href = signinUrl();
    });
  }

  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      clearSession();
      if (inModule) window.location.href = signinUrl();
    }
  });
})();

// Wait until typing stops before doing the expensive thing.
//
// A search box fires on every keystroke. Typing "apartment" ran the filter nine times and rebuilt
// every card nine times; eight of those renders were thrown away before anyone saw them. This
// waits for a pause instead.
//
// Only for work that redraws a list. Anything that should feel instant as you type — a character
// counter, a password strength meter — must stay undebounced.
function hsDebounce(fn, wait) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait === undefined ? 200 : wait);
  };
}

// Initials for an avatar circle.
//
// Every caller used to write `first[0] + last[0]`, which throws the moment a name is null — and a
// name is null for any account made straight in Supabase rather than through the sign-up form.
// One of those throws took the whole topbar down, and with it every line of the page script after
// it, which is why a page could end up showing its leftover placeholder markup.
function hsInitials(first, last, fallback) {
  const a = (first || '').trim();
  const b = (last || '').trim();
  const letters = (a.charAt(0) + b.charAt(0)).trim();
  if (letters) return letters.toUpperCase();

  // No name on the profile: fall back to the email, then to a neutral mark.
  const from = (fallback || '').trim();
  return from ? from.charAt(0).toUpperCase() : '?';
}

// A display name that is never blank.
function hsDisplayName(user) {
  if (!user) return 'User';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    || (user.fullName || '').trim();
  if (name) return name;
  return (user.email || '').split('@')[0] || 'User';
}

// Small toast for reporting database/network results on pages that have no toast of their own.
function hsToast(text, kind) {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: kind === 'error' ? 'var(--danger)' : 'var(--surface-soft)', color: kind === 'error' ? 'var(--on-primary)' : 'var(--text)',
    padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 20px rgb(var(--shade-rgb) / min(0.4, var(--shadow-cap, 1)))', zIndex: '99999', transition: 'opacity 0.4s',
    opacity: '1', fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '90vw',
  });
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, 2800);
  setTimeout(() => el.remove(), 3300);
}
