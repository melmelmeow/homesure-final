
  /* ── Auth guard ── */
  const user = getSession();
  if (!user || user.role !== 'seller') window.location.href = '../../auth/signin.html';

  /* ── Verification gate ── */
  const fullUser   = FAKE_USERS.find(u => u.id === user.id);
  const isVerified = fullUser && fullUser.accountStatus === 'verified';
  if (!isVerified) {
    document.getElementById('postForm').style.display = 'none';
    document.getElementById('verifyGate').style.display = 'flex';
    document.getElementById('pageSubtitle').textContent = 'Complete identity verification to post your first listing';
  }

  /* ── Init sidebar & topbar ── */
  HomeSureSidebar.init({ activePage: 'listings' });
  HomeSureTopbar.init({ placeholder: 'Post a property...' });

  /* ── Seller name in document section ── */
  const sellerFullName = (user.firstName || '') + ' ' + (user.lastName || '');
  document.getElementById('sellerNameDisplay').textContent = sellerFullName.trim();

  /* ── Populate barangay dropdown from fake listings ── */
  const barangays = [...new Set(FAKE_LISTINGS.map(l => l.barangay))].sort();
  const barangaySelect = document.getElementById('listingBarangay');
  barangays.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    barangaySelect.appendChild(opt);
  });

  /* ── Amenities ── */
  const AMENITY_LIST = [
    'Aircon', 'WiFi-ready', 'Parking/Carport', 'Garden', 'Balcony',
    'Security', 'Water Meter', 'Meralco', 'Furnished', 'Pet-friendly',
    'Near School', 'Near Highway'
  ];
  const selectedAmenities = new Set();
  const amenitiesGroup = document.getElementById('amenitiesGroup');
  AMENITY_LIST.forEach(name => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-checkbox';
    btn.textContent = name;
    btn.onclick = () => {
      if (selectedAmenities.has(name)) {
        selectedAmenities.delete(name);
        btn.classList.remove('selected');
      } else {
        selectedAmenities.add(name);
        btn.classList.add('selected');
      }
    };
    amenitiesGroup.appendChild(btn);
  });

  /* ── Listing type toggle ── */
  let currentListingType = 'sale';
  function setListingType(type) {
    currentListingType = type;
    document.querySelectorAll('#listingTypeGroup .pill-toggle').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === type);
    });
    document.getElementById('priceSuffix').textContent = type === 'rent' ? '/month' : '';
  }
  // Set initial suffix
  setListingType('sale');

  /* ── Negotiable toggle ── */
  function onNegotiableChange() {
    const checked = document.getElementById('negotiableToggle').checked;
    const label   = document.getElementById('negLabel');
    label.textContent = checked ? 'On' : 'Off';
    label.classList.toggle('on', checked);
  }

  /* ── Multiple Units toggle ── */
  window.onMultiUnitChange = function() {
    const checked = document.getElementById('multiUnitToggle').checked;
    const label   = document.getElementById('multiUnitLabel');
    const fields  = document.getElementById('multiUnitFields');

    label.textContent = checked ? 'On' : 'Off';
    label.classList.toggle('on', checked);
    fields.style.display = checked ? 'block' : 'none';

    // Reset values when turning on (minimum 2 units)
    if (checked) {
      document.getElementById('totalUnits').value = '2';
      document.getElementById('availableUnits').value = '2';
    }
  };

  /* ── Description char count ── */
  function updateCharCount() {
    const val   = document.getElementById('listingDesc').value;
    const count = document.getElementById('charCount');
    count.textContent = val.length + ' / 500';
    count.classList.toggle('over', val.length > 500);
  }

  /* ── Photo uploads ── */
  let uploadedPhotos = []; // array of { file, url }

  function updatePhotoUI() {
    const grid      = document.getElementById('photoPreviewGrid');
    const countEl   = document.getElementById('photoCount');
    const n         = uploadedPhotos.length;

    grid.innerHTML = '';
    uploadedPhotos.forEach((p, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb';
      thumb.innerHTML = `
        <img src="${p.url}" alt="Photo ${i+1}" />
        <button type="button" class="photo-thumb-remove" onclick="removePhoto(${i})">&times;</button>
      `;
      grid.appendChild(thumb);
    });

    if (n > 0) {
      countEl.style.display = '';
      countEl.textContent = n + ' / 10 photos';
    } else {
      countEl.style.display = 'none';
    }
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files);
    const remaining = 10 - uploadedPhotos.length;
    const toAdd     = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast('error', 'Maximum 10 photos allowed. Some photos were not added.');
    }
    toAdd.forEach(file => {
      const url = URL.createObjectURL(file);
      uploadedPhotos.push({ file, url });
    });
    updatePhotoUI();
    e.target.value = '';
  }

  function removePhoto(idx) {
    URL.revokeObjectURL(uploadedPhotos[idx].url);
    uploadedPhotos.splice(idx, 1);
    updatePhotoUI();
  }

  function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('photoUploadZone').classList.add('drag-over');
  }
  function handleDragLeave(e) {
    document.getElementById('photoUploadZone').classList.remove('drag-over');
  }
  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('photoUploadZone').classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const remaining = 10 - uploadedPhotos.length;
    const toAdd     = files.slice(0, remaining);
    toAdd.forEach(file => {
      const url = URL.createObjectURL(file);
      uploadedPhotos.push({ file, url });
    });
    updatePhotoUI();
  }

  /* ── Document uploads ── */
  let deedFile    = null;
  let supportFile = null;

  function formatFileSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function handleDocSelect(type, e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'deed') {
      deedFile = files[0];
      const box      = document.getElementById('deedUploadBox');
      const nameEl   = document.getElementById('deedFileName');
      const infoEl   = document.getElementById('deedFileInfo');
      box.classList.add('has-file');
      nameEl.textContent = deedFile.name;
      infoEl.textContent = formatFileSize(deedFile.size);
      infoEl.style.display = '';
    } else {
      supportFile = files[0];
      const box      = document.getElementById('supportUploadBox');
      const nameEl   = document.getElementById('supportFileName');
      const infoEl   = document.getElementById('supportFileInfo');
      box.classList.add('has-file');
      nameEl.textContent = supportFile.name;
      infoEl.textContent = formatFileSize(supportFile.size);
      infoEl.style.display = '';
    }
    e.target.value = '';
  }

  /* ── Toast ── */
  let toastTimer = null;
  function showToast(type, msg) {
    const toast   = document.getElementById('toast');
    const icon    = document.getElementById('toastIcon');
    const iconSvg = document.getElementById('toastIconSvg');
    const msgEl   = document.getElementById('toastMsg');

    toast.classList.remove('success', 'error', 'show');
    if (type === 'success') {
      toast.classList.add('success');
      iconSvg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    } else {
      toast.classList.add('error');
      iconSvg.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    }
    msgEl.textContent = msg;

    // Force reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  /* ── Validation + Submit ── */
  function submitListing() {
    const title    = document.getElementById('listingTitle').value.trim();
    const price    = document.getElementById('listingPrice').value.trim();
    const barangay = document.getElementById('listingBarangay').value;
    const address  = document.getElementById('listingAddress').value.trim();
    const floor    = document.getElementById('floorArea').value.trim();
    const desc     = document.getElementById('listingDesc').value.trim();

    const missing = [];
    if (!title)    missing.push('Listing Title');
    if (!price)    missing.push('Price');
    if (!barangay) missing.push('Barangay');
    if (!address)  missing.push('Full Address');
    if (!floor)    missing.push('Floor Area');
    if (!desc)     missing.push('Description');
    if (uploadedPhotos.length === 0) missing.push('at least 1 photo');
    if (deedPhotos.length === 0) missing.push('Deed of Sale or TCT photos (at least 1 page)');

    if (missing.length > 0) {
      showToast('error', 'Please fill in all required fields and upload required documents.');
      return;
    }

    // Show success modal
    document.getElementById('successModal').classList.add('open');
  }

  /* ── Save as Draft ── */
  function saveAsDraft() {
    showToast('success', 'Listing saved as draft. You can submit it for review from My Listings.');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CAMERA CAPTURE - MULTI-PHOTO DOCUMENT UPLOAD
  // ══════════════════════════════════════════════════════════════════════════════

  let deedPhotos = [];
  let supportPhotos = [];

  window.takeDeedPhoto = function() {
    CameraCapture.open({
      title: 'Take Document Photo',
      instructions: [
        'Place document on flat surface',
        'Ensure all text is clearly visible',
        'Good lighting, no shadows or glare',
        'Take photos of ALL pages (front & back)'
      ],
      onCapture: function(imageDataURL) {
        deedPhotos.push(imageDataURL);
        renderDeedPhotos();

        const nameEl = document.getElementById('deedFileName');
        nameEl.textContent = `${deedPhotos.length} photo${deedPhotos.length > 1 ? 's' : ''} captured`;

        document.getElementById('deedUploadBox').classList.add('has-file');

        showToast('success', `Photo ${deedPhotos.length} captured! Add more photos if needed.`);
      }
    });
  };

  window.takeSupportPhoto = function() {
    CameraCapture.open({
      title: 'Take Document Photo',
      instructions: [
        'Place document on flat surface',
        'Ensure all text is clearly visible',
        'Good lighting, no shadows or glare',
        'Take photos of ALL pages (front & back)'
      ],
      onCapture: function(imageDataURL) {
        supportPhotos.push(imageDataURL);
        renderSupportPhotos();

        const nameEl = document.getElementById('supportFileName');
        nameEl.textContent = `${supportPhotos.length} photo${supportPhotos.length > 1 ? 's' : ''} captured`;

        document.getElementById('supportUploadBox').classList.add('has-file');

        showToast('success', `Photo ${supportPhotos.length} captured! Add more photos if needed.`);
      }
    });
  };

  function renderDeedPhotos() {
    const grid = document.getElementById('deedPhotosGrid');
    if (deedPhotos.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = deedPhotos.map((photo, index) => `
      <div class="doc-photo-item">
        <img src="${photo}" alt="Document page ${index + 1}" />
        <button class="doc-photo-remove" onclick="removeDeedPhoto(${index})" title="Remove photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="doc-photo-number">Page ${index + 1}</div>
      </div>
    `).join('');
  }

  function renderSupportPhotos() {
    const grid = document.getElementById('supportPhotosGrid');
    if (supportPhotos.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = supportPhotos.map((photo, index) => `
      <div class="doc-photo-item">
        <img src="${photo}" alt="Document page ${index + 1}" />
        <button class="doc-photo-remove" onclick="removeSupportPhoto(${index})" title="Remove photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="doc-photo-number">Page ${index + 1}</div>
      </div>
    `).join('');
  }

  window.removeDeedPhoto = function(index) {
    deedPhotos.splice(index, 1);
    renderDeedPhotos();

    const nameEl = document.getElementById('deedFileName');
    if (deedPhotos.length === 0) {
      nameEl.textContent = 'Click to take photos';
      document.getElementById('deedUploadBox').classList.remove('has-file');
    } else {
      nameEl.textContent = `${deedPhotos.length} photo${deedPhotos.length > 1 ? 's' : ''} captured`;
    }

    showToast('success', 'Photo removed');
  };

  window.removeSupportPhoto = function(index) {
    supportPhotos.splice(index, 1);
    renderSupportPhotos();

    const nameEl = document.getElementById('supportFileName');
    if (supportPhotos.length === 0) {
      nameEl.textContent = 'Click to take photos';
      document.getElementById('supportUploadBox').classList.remove('has-file');
    } else {
      nameEl.textContent = `${supportPhotos.length} photo${supportPhotos.length > 1 ? 's' : ''} captured`;
    }

    showToast('success', 'Photo removed');
  };
