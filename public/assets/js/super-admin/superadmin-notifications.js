// HomeSure – Super Admin Notifications

const user = getSession();
if (!user || user.role !== 'superadmin') window.location.href = '../../auth/signin.html';

HomeSureSidebar.init({ activePage: 'notifications' });
HomeSureTopbar.init({ placeholder: 'Search notifications...' });

const NOTIFICATIONS = [
  { id: 1, unread: true,  time: '20 minutes ago',     type: 'admin',  color: '#8b5cf6', initials: 'AV',
    msg: 'Admin <strong>Andrea Villanueva</strong> approved 3 listings in the last hour.' },
  { id: 2, unread: true,  time: '1 hour ago',         type: 'report', color: '#ef4444', initials: 'HS',
    msg: '<strong>2 new reports</strong> have been filed and are pending admin review.' },
  { id: 3, unread: true,  time: '3 hours ago',        type: 'system', color: '#3b82f6', initials: 'HS',
    msg: 'A new admin account was successfully created for <strong>Andrea Villanueva</strong>.' },
  { id: 4, unread: false, time: 'Yesterday, 11:00 AM', type: 'admin', color: '#8b5cf6', initials: 'AV',
    msg: 'Admin <strong>Andrea Villanueva</strong> rejected a listing — <strong>2-Bedroom Bungalow in Catanghalan</strong>.' },
  { id: 5, unread: false, time: 'Yesterday, 8:00 AM', type: 'system', color: '#3b82f6', initials: 'HS',
    msg: '<strong>5 new users</strong> registered on the platform yesterday.' },
  { id: 6, unread: false, time: '3 days ago',         type: 'report', color: '#ef4444', initials: 'HS',
    msg: 'Report <strong>rep-003</strong> was resolved by Admin Andrea Villanueva.' },
  { id: 7, unread: false, time: '5 days ago',         type: 'system', color: '#3b82f6', initials: 'HS',
    msg: 'System health check passed. All services are running normally.' },
];

const TYPE_BADGE = {
  admin:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, cls: 'badge-purple' },
  report: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, cls: 'badge-red' },
  system: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`, cls: 'badge-blue' },
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
