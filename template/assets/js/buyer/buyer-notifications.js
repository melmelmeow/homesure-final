
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: 'notifications' });
  HomeSureTopbar.init({ placeholder: 'Search notifications...' });

  const AVATAR_COLORS = ['#0f766e','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];

  const NOTIFICATIONS = [
    { id: 1,  unread: true,  time: '2 minutes ago',   type: 'message', color: '#0f766e', initials: 'RC',
      msg: '<strong>Ramon Cruz</strong> sent you a message about <strong>1-Bedroom Apartment near Town Proper</strong>.' },
    { id: 2,  unread: true,  time: '18 minutes ago',  type: 'listing', color: '#3b82f6', initials: 'HS',
      msg: '<strong>New listing</strong> in Poblacion matches your saved preferences — check it out.' },
    { id: 3,  unread: true,  time: '1 hour ago',      type: 'price',   color: '#f59e0b', initials: 'LN',
      msg: 'Price dropped on <strong>Studio Unit in Bagong Silang</strong> — now ₱5,500/month.' },
    { id: 4,  unread: false, time: '3 hours ago',     type: 'message', color: '#0f766e', initials: 'RC',
      msg: '<strong>Ramon Cruz</strong> replied to your inquiry about a property in Pulong Yantok.' },
    { id: 5,  unread: false, time: 'Yesterday, 4:32 PM', type: 'system', color: '#8b5cf6', initials: 'HS',
      msg: 'Your phone number has been successfully verified.' },
    { id: 6,  unread: false, time: 'Yesterday, 11:00 AM', type: 'listing', color: '#3b82f6', initials: 'HS',
      msg: '<strong>2 new listings</strong> in Sta. Maria match your saved search filters.' },
    { id: 7,  unread: false, time: '2 days ago',      type: 'price',   color: '#f59e0b', initials: 'LN',
      msg: 'Price reduced on a saved listing — <strong>3-Bedroom House in Pulong Yantok</strong>.' },
    { id: 8,  unread: false, time: '3 days ago',      type: 'system',  color: '#8b5cf6', initials: 'HS',
      msg: 'Welcome to HomeSure! Your account has been successfully created and verified.' },
  ];

  const TYPE_BADGE = {
    message: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, cls: 'badge-teal'   },
    listing: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,                                                         cls: 'badge-blue'   },
    price:   { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,                           cls: 'badge-amber'  },
    system:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,                                                           cls: 'badge-purple' },
  };

  let currentTab = 'all';

  function render(tab) {
    const list = tab === 'unread' ? NOTIFICATIONS.filter(n => n.unread) : NOTIFICATIONS;
    const newItems      = list.filter(n => n.unread);
    const earlierItems  = list.filter(n => !n.unread);
    const container     = document.getElementById('notifList');

    if (!list.length) {
      container.innerHTML = `<div class="notif-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        You're all caught up!
      </div>`;
      return;
    }

    let html = '';
    if (newItems.length) {
      html += `<div class="notif-section-label">New</div>`;
      html += newItems.map(n => notifRow(n)).join('');
    }
    if (earlierItems.length) {
      html += `<div class="notif-section-label">Earlier</div>`;
      html += earlierItems.map(n => notifRow(n)).join('');
    }
    container.innerHTML = html;

    // Update unread count badge
    const unread = NOTIFICATIONS.filter(n => n.unread).length;
    document.getElementById('unreadCount').textContent = unread ? `(${unread})` : '';
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
