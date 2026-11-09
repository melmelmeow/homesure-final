// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Seller Dashboard Logic
//  Depends on: fake-data.js, sidebar.js, topbar.js
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const user = getSession();
  if (!user || user.role !== 'seller') {
    window.location.href = '../../auth/signin.html';
    return;
  }

  HomeSureSidebar.init({ activePage: 'dashboard' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  document.getElementById('dashTitle').textContent =
    'Welcome back, ' + user.firstName + '!';

  if (user.accountStatus === 'pending') {
    document.getElementById('pendingNotice').style.display = 'block';
  }

  const sellerData = FAKE_USERS.find(u => u.id === user.id);
  if (sellerData && sellerData.listings) {
    const myListings = FAKE_LISTINGS.filter(l => sellerData.listings.includes(l.id));
    document.getElementById('totalListings').textContent    = myListings.length;
    document.getElementById('approvedListings').textContent = myListings.filter(l => l.status === 'approved').length;
    document.getElementById('pendingListings').textContent  = myListings.filter(l => l.status === 'pending').length;
    document.getElementById('rejectedListings').textContent = myListings.filter(l => l.status === 'rejected').length;
  }

})();
