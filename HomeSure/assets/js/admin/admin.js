// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Admin Dashboard Logic
//  Depends on: fake-data.js, sidebar.js, topbar.js
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const user = getSession();
  if (!user || user.role !== 'admin') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  document.getElementById('dashTitle').textContent =
    'Admin Panel – ' + user.firstName + ' ' + user.lastName;

  document.getElementById('totalUsers').textContent      = FAKE_USERS.filter(u => ['buyer','seller'].includes(u.role)).length;
  document.getElementById('totalListings').textContent   = FAKE_LISTINGS.length;
  document.getElementById('pendingListings').textContent = FAKE_LISTINGS.filter(l => l.status === 'pending').length;
  document.getElementById('pendingSellers').textContent  = FAKE_USERS.filter(u => u.role === 'seller' && u.accountStatus === 'pending').length;
  document.getElementById('openReports').textContent     = FAKE_REPORTS.filter(r => r.status === 'pending').length;

})();
