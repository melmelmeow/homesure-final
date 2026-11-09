// Kasafide – Super Admin Notifications

const user = getSession();
if (!user || (user.role !== 'superadmin' && user.role !== 'super_duper_admin')) window.location.href = '../../auth/signin.html';

KasafideSidebar.init({ activePage: 'notifications' });
KasafideTopbar.init({ placeholder: 'Search notifications...' });


  const roleName = 'superadmin';
  const notifStorageKey = 'hs_read_notifs_' + roleName + '_' + (user ? user.id : 'anon');

  function getReadIds() {
    try {
      const arr = JSON.parse(localStorage.getItem(notifStorageKey) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveReadIds(readSet) {
    try {
      localStorage.setItem(notifStorageKey, JSON.stringify([...readSet]));
    } catch (_) {}
    syncTopbarDot();
  }

  function syncTopbarDot() {
    const hasUnread = NOTIFICATIONS.some(n => n.unread);
    const topbarDot = document.querySelector('#hsNotifDot') || document.querySelector('.hs-notif-dot');
    if (topbarDot) {
      topbarDot.style.display = hasUnread ? 'block' : 'none';
    }
  }

  // Restore persistent read status
  const savedReadIds = getReadIds();
  NOTIFICATIONS.forEach(n => {
    if (savedReadIds.has(n.id)) {
      n.unread = false;
    }
  });

const TYPE_BADGE = {
  admin:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, cls: 'badge-purple' },
  report: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, cls: 'badge-red' },
  system: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`, cls: 'badge-blue' },
};

let NOTIFICATIONS = [];
let currentTab = 'all';

// ── "x minutes/hours/days ago", matching how old a notification actually is instead of a
// hand-picked fake timestamp. ───────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function render(tab) {
  const list         = tab === 'unread' ? NOTIFICATIONS.filter(n => n.unread) : NOTIFICATIONS;
  const newItems     = list.filter(n => n.unread);
  const earlierItems = list.filter(n => !n.unread);
  const container    = document.getElementById('notifList');

  if (!list.length) {
    container.innerHTML = `<div class="notif-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      You're all caught up!
    </div>`;
    return;
  }

  let html = '';
  if (newItems.length)     { html += `<div class="notif-section-label">New</div>`;     html += newItems.map(notifRow).join(''); }
  if (earlierItems.length) { html += `<div class="notif-section-label">Earlier</div>`; html += earlierItems.map(notifRow).join(''); }
  container.innerHTML = html;
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  document.getElementById('unreadCount').textContent = unread ? `(${unread})` : '';
}

function notifRow(n) {
  const badge = TYPE_BADGE[n.type] || TYPE_BADGE.system;
  return `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead('${n.id}')">
      <div class="notif-avatar-wrap">
        <div class="notif-avatar" style="background:var(--primary)">HS</div>
        <div class="notif-badge ${badge.cls}">${badge.icon}</div>
      </div>
      <div class="notif-content">
        <div class="notif-msg">${n.title ? `<strong>${n.title}</strong> ` : ''}${n.body}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
      ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
    </div>`;
}

function markRead(id) {
    const n = NOTIFICATIONS.find(x => x.id === id);
    if (n) {
      n.unread = false;
      const readSet = getReadIds();
      readSet.add(id);
      saveReadIds(readSet);
    }
    render(currentTab);
    syncTopbarDot();
  }

function markAllRead() {
    const readSet = getReadIds();
    NOTIFICATIONS.forEach(n => {
      n.unread = false;
      readSet.add(n.id);
    });
    saveReadIds(readSet);
    render(currentTab);
    syncTopbarDot();
  }

function switchTab(btn, tab) {
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentTab = tab;
  render(tab);
}

async function loadNotifications() {
  try {
    NOTIFICATIONS = await HS.notifications.list();
  } catch (err) {
    console.error('Could not load notifications:', err);
  }
  render(currentTab);
}

loadNotifications();
