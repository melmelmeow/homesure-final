
  const user = getSession();
  if (!user || user.role !== 'buyer') window.location.href = '../../auth/signin.html';

  KasafideSidebar.init({ activePage: 'notifications' });
  KasafideTopbar.init({ placeholder: 'Search notifications...' });

  
  const roleName = 'buyer';
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
    message: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, cls: 'badge-teal'   },
    listing: { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,                                                         cls: 'badge-blue'   },
    price:   { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,                           cls: 'badge-amber'  },
    system:  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,                                                           cls: 'badge-purple' },
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

  async function markRead(id) {
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
