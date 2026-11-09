// HomeSure – Admin Notifications

const user = getSession();
if (!user || user.role !== 'admin') window.location.href = '../../auth/signin.html';

HomeSureSidebar.init({ activePage: 'notifications' });
HomeSureTopbar.init({ placeholder: 'Search notifications...' });

const NOTIFICATIONS = [
  { id: 1, unread: true,  time: '10 minutes ago',     type: 'listing', color: '#f59e0b', initials: 'HS',
    msg: '<strong>New listing submitted</strong> — Studio-Type Apartment in Balasing is awaiting your review.' },
  { id: 2, unread: true,  time: '45 minutes ago',     type: 'report',  color: '#ef4444', initials: 'HS',
    msg: 'A new report has been filed against <strong>Modern Loft Apartment in Pulong Buhangin</strong>. Please review.' },
  { id: 3, unread: true,  time: '2 hours ago',        type: 'verif',   color: '#8b5cf6', initials: 'HS',
    msg: '<strong>Lourdes Navarro</strong> has submitted verification documents. Review is pending.' },
  { id: 4, unread: false, time: 'Yesterday, 3:15 PM', type: 'listing', color: '#f59e0b', initials: 'HS',
    msg: '<strong>2 listings</strong> are pending approval and have been waiting for more than 48 hours.' },
  { id: 5, unread: false, time: 'Yesterday, 10:00 AM', type: 'system', color: '#8b5cf6', initials: 'SA',
    msg: 'Super Admin <strong>Ricardo Dela Cruz</strong> reset your password. If this was not you, contact support.' },
  { id: 6, unread: false, time: '2 days ago',         type: 'report',  color: '#ef4444', initials: 'HS',
    msg: 'Report <strong>rep-003</strong> has been escalated. Seller may be requesting off-platform payments.' },
  { id: 7, unread: false, time: '4 days ago',         type: 'system',  color: '#8b5cf6', initials: 'HS',
    msg: 'Welcome to HomeSure Admin. Your account has been set up by the Super Admin.' },
];

const TYPE_BADGE = {
  listing: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`, cls: 'badge-amber' },
  report:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, cls: 'badge-red' },
  verif:   { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, cls: 'badge-purple' },
  system:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`, cls: 'badge-purple' },
};

let currentTab = 'all';

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
  document.getElementById('unreadCount').textContent = NOTIFICATIONS.filter(n => n.unread).length
    ? `(${NOTIFICATIONS.filter(n => n.unread).length})` : '';
}

function notifRow(n) {
  const badge = TYPE_BADGE[n.type] || TYPE_BADGE.system;
  return `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
      <div class="notif-avatar-wrap">
        <div class="notif-avatar" style="background:${n.color}">${n.initials}</div>
        <div class="notif-badge ${badge.cls}">${badge.icon}</div>
      </div>
      <div class="notif-content">
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
    </div>`;
}

function markRead(id) {
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (n) n.unread = false;
  render(currentTab);
}

function markAllRead() {
  NOTIFICATIONS.forEach(n => n.unread = false);
  render(currentTab);
}

function switchTab(btn, tab) {
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentTab = tab;
  render(tab);
}

render('all');
