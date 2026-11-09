// HomeSure – Seller Notifications

const user = getSession();
if (!user || user.role !== 'seller') window.location.href = '../../auth/signin.html';

HomeSureSidebar.init({ activePage: 'notifications' });
HomeSureTopbar.init({ placeholder: 'Search notifications...' });

const NOTIFICATIONS = [
  { id: 1, unread: true,  time: '5 minutes ago',      type: 'listing', color: '#00c9a7', initials: 'HS',
    msg: 'Your listing <strong>Studio-Type Apartment in Balasing</strong> has been submitted and is now pending review.' },
  { id: 2, unread: true,  time: '1 hour ago',          type: 'listing', color: '#f59e0b', initials: 'HS',
    msg: 'Your listing <strong>2-Bedroom Bungalow in Catanghalan</strong> was rejected. Please review the reason and resubmit.' },
  { id: 3, unread: true,  time: '3 hours ago',         type: 'message', color: '#3b82f6', initials: 'MS',
    msg: '<strong>Maria Santos</strong> sent you an inquiry about <strong>1-Bedroom Apartment near Town Proper</strong>.' },
  { id: 4, unread: false, time: 'Yesterday, 2:00 PM',  type: 'listing', color: '#00c9a7', initials: 'HS',
    msg: 'Your listing <strong>House for Rent near Highway</strong> has been approved and is now visible to buyers.' },
  { id: 5, unread: false, time: 'Yesterday, 9:00 AM',  type: 'verif',   color: '#8b5cf6', initials: 'HS',
    msg: 'Your seller verification is expiring on <strong>April 20, 2026</strong>. Please submit new documents to stay verified.' },
  { id: 6, unread: false, time: '3 days ago',          type: 'message', color: '#3b82f6', initials: 'JR',
    msg: '<strong>Jose Reyes</strong> is interested in viewing <strong>Family House with Garden</strong>.' },
  { id: 7, unread: false, time: '5 days ago',          type: 'system',  color: '#8b5cf6', initials: 'HS',
    msg: 'Welcome to HomeSure! Your seller account has been created. Submit your documents to get verified.' },
];

const TYPE_BADGE = {
  listing: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`, cls: 'badge-teal' },
  message: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, cls: 'badge-blue' },
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
