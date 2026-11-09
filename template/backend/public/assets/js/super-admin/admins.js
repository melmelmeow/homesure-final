// HomeSure – Super Admin: Admin Management Page

const user = getSession();
if (!user || user.role !== 'superadmin') window.location.href = '../../auth/signin.html';

HomeSureSidebar.init({ activePage: 'admins' });
HomeSureTopbar.init({ placeholder: 'Search admins...', onSearch: function() { searchQuery = (document.getElementById('hsSearch')||{}).value?.trim() || ''; renderAdminTable(); } });

let adminList   = [...FAKE_ADMINS];
let filterState = 'all';
let searchQuery = '';

// ── Render ────────────────────────────────────────────────────────────────────
function renderAdminTable() {
  let list = adminList;

  if (filterState !== 'all') {
    list = list.filter(a => a.status === filterState);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(a =>
      (a.firstName + ' ' + a.lastName).toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }

  const tbody = document.getElementById('adminTable');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted);">No admins found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    const initials    = (a.firstName[0] + a.lastName[0]).toUpperCase();
    const statusBadge = a.status === 'active'
      ? `<span class="badge active">Active</span>`
      : `<span class="badge inactive">Inactive</span>`;
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initials}</div>
            <span>${a.firstName} ${a.lastName}</span>
          </div>
        </td>
        <td>${a.email}</td>
        <td>${statusBadge}</td>
        <td>${a.addedAt || '—'}</td>
        <td>${a.addedBy || '—'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-sm ${a.status === 'active' ? 'deactivate' : 'activate'}"
              onclick="toggleAdmin('${a.id}')">
              ${a.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn-sm reset" onclick="resetPassword('${a.id}', '${a.firstName} ${a.lastName}')">
              Reset Password
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────
document.getElementById('filterTabs').addEventListener('click', e => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  filterState = btn.dataset.status;
  renderAdminTable();
});


// ── Toggle Active/Inactive ────────────────────────────────────────────────────
window.toggleAdmin = function (id) {
  const admin = adminList.find(a => a.id === id);
  if (!admin) return;
  admin.status = admin.status === 'active' ? 'inactive' : 'active';
  renderAdminTable();
  showToast(`${admin.firstName} ${admin.lastName} has been ${admin.status === 'active' ? 'activated' : 'deactivated'}.`);
};

// ── Reset Password ────────────────────────────────────────────────────────────
window.resetPassword = function (id, name) {
  showToast(`Password reset link sent to ${name}.`);
};

// ── Add Admin Modal ───────────────────────────────────────────────────────────
const modal = document.getElementById('addAdminModal');

document.getElementById('addAdminBtn').addEventListener('click', () => {
  modal.style.display = 'flex';
});
document.getElementById('closeAdminModal').addEventListener('click', closeModal);
document.getElementById('cancelAdminModal').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function closeModal() {
  modal.style.display = 'none';
  ['newAdminFirst', 'newAdminLast', 'newAdminEmail', 'newAdminPass'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

document.getElementById('confirmAddAdmin').addEventListener('click', () => {
  const fn    = document.getElementById('newAdminFirst').value.trim();
  const ln    = document.getElementById('newAdminLast').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const pass  = document.getElementById('newAdminPass').value.trim();

  if (!fn || !ln || !email || !pass) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  const newAdmin = {
    id: 'usr-' + Date.now(),
    role: 'admin',
    firstName: fn,
    lastName: ln,
    email,
    password: pass,
    status: 'active',
    addedBy: user.firstName + ' ' + user.lastName,
    addedAt: new Date().toISOString().split('T')[0],
  };

  adminList.push(newAdmin);
  renderAdminTable();
  closeModal();
  showToast(`Admin account created for ${fn} ${ln}.`);
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast   = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderAdminTable();
