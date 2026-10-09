
  const user = getSession();
  if (!user || user.role !== 'superadmin') window.location.href = '../../auth/signin.html';

  HomeSureSidebar.init({ activePage: '' });
  HomeSureTopbar.init({ placeholder: 'Search...' });

  document.getElementById('firstName').value = user.firstName || '';
  document.getElementById('lastName').value  = user.lastName  || '';
  document.getElementById('email').value     = user.email     || '';
  document.getElementById('phone').value     = user.phone     || '';

  const avatarCircle = document.getElementById('avatarCircle');

  function renderAvatar() {
    if (user.avatar) {
      avatarCircle.textContent = '';
      avatarCircle.style.backgroundImage = `url(${user.avatar})`;
    } else {
      avatarCircle.textContent = ((user.firstName || '')[0] + (user.lastName || '')[0]).toUpperCase();
      avatarCircle.style.backgroundImage = '';
    }
  }
  renderAvatar();

  document.getElementById('identityName').textContent  = (user.firstName || '') + ' ' + (user.lastName || '');
  document.getElementById('identityEmail').textContent = user.email || '';
  document.getElementById('phoneStatus').textContent   = user.phone || 'Not set';

  const fullUser = FAKE_USERS.find(u => u.id === user.id);
  if (fullUser && fullUser.joinedAt) {
    document.getElementById('memberSince').textContent =
      new Date(fullUser.joinedAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
  }

  const avatarInput = document.getElementById('avatarInput');
  document.getElementById('avatarEditBtn').addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      user.avatar = e.target.result;
      saveSession(user);
      renderAvatar();
      showToast('Profile photo updated.');
    };
    reader.readAsDataURL(file);
  });

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    t.className = 'toast ' + type;
    document.getElementById('toastMsg').textContent = msg;
    icon.innerHTML = type === 'success'
      ? '<polyline points="20 6 9 17 4 12"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function savePersonal() {
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    if (!fn || !ln) { showToast('Please fill in both name fields.', 'error'); return; }
    user.firstName = fn; user.lastName = ln;
    saveSession(user);
    document.getElementById('identityName').textContent = fn + ' ' + ln;
    showToast('Profile updated successfully.');
  }

  function savePhone() {
    const ph = document.getElementById('phone').value.trim();
    if (!ph) { showToast('Please enter a phone number.', 'error'); return; }
    user.phone = ph;
    saveSession(user);
    document.getElementById('phoneStatus').textContent = ph;
    showToast('Phone number saved.');
  }
