
  const user = getSession();
  if (!user || (user.role !== 'superadmin' && user.role !== 'super_duper_admin')) window.location.href = '../../auth/signin.html';

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

  // "Member since" comes from the profile row, not from a cached copy.
  HS.profiles.me().then(me => {
    if (me && me.joinedAt) {
      document.getElementById('memberSince').textContent =
        new Date(me.joinedAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
    }
  }).catch(err => console.error('Could not load profile:', err));

  const avatarInput = document.getElementById('avatarInput');
  document.getElementById('avatarEditBtn').addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;

    // Show it straight away, then upload. It only sticks once the upload succeeds.
    const reader = new FileReader();
    reader.onload = e => { user.avatar = e.target.result; renderAvatar(); };
    reader.readAsDataURL(file);

    try {
      const url = await HS.storage.uploadAvatar(file);
      await HS.profiles.updateMe({ avatar: url });
      user.avatar = url;
      saveSession(user);
      renderAvatar();
      showToast('Profile photo updated.');
    } catch (err) {
      showToast('Could not save your photo: ' + err.message, 'error');
    }
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

    async function savePersonal() {
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    if (!fn || !ln) { showToast('Please fill in both name fields.', 'error'); return; }

    try {
      await HS.profiles.updateMe({ firstName: fn, lastName: ln });
      user.firstName = fn;
      user.lastName = ln;
      saveSession(user);
      document.getElementById('identityName').textContent = fn + ' ' + ln;
      showToast('Profile updated successfully.');
    } catch (err) {
      console.error('Error saving personal info:', err);
      showToast('Could not save profile: ' + err.message, 'error');
    }
  }

  async function savePhone() {
    const ph = document.getElementById('phone').value.trim();
    if (!ph) { showToast('Please enter a phone number.', 'error'); return; }

    try {
      await HS.profiles.updateMe({ phone: ph });
      user.phone = ph;
      saveSession(user);
      document.getElementById('phoneStatus').textContent = ph;
      showToast('Phone number saved.');
    } catch (err) {
      console.error('Error saving phone:', err);
      showToast('Could not save phone: ' + err.message, 'error');
    }
  }

  window.savePersonal = savePersonal;
  window.savePhone = savePhone;
  window.showToast = showToast;
    user.phone = ph;
    saveSession(user);
    document.getElementById('phoneStatus').textContent = ph;
    showToast('Phone number saved.');
  }
