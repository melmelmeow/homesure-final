
  /* ── Auth guard ── */
  const user = getSession();
  if (!user || user.role !== 'seller') window.location.href = '../../auth/signin.html';

  /* ── Verification gate (cached state first, confirmed from the database below) ── */
  function applyGate(isVerified) {
    document.getElementById('postForm').style.display   = isVerified ? '' : 'none';
    document.getElementById('verifyGate').style.display = isVerified ? 'none' : 'flex';
    if (!isVerified) {
      document.getElementById('pageSubtitle').textContent = 'Complete identity verification to post your first listing';
    }
  }
  applyGate(user.accountStatus === 'verified');
  HS.auth.refresh().then(me => { if (me) applyGate(me.accountStatus === 'verified'); }).catch(() => {});

  /* ── Init sidebar & topbar ── */
  HomeSureSidebar.init({ activePage: 'listings' });
  HomeSureTopbar.init({ placeholder: 'Post a property...' });

  /* ── Seller name in document section ── */
  const sellerFullName = (user.firstName || '') + ' ' + (user.lastName || '');
  document.getElementById('sellerNameDisplay').textContent = sellerFullName.trim();

  /* ── Populate barangay dropdown (Sta. Maria barangay list) ── */
  const barangaySelect = document.getElementById('listingBarangay');
  HS.barangays().then(names => {
    names.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      barangaySelect.appendChild(opt);
    });
  }).catch(err => console.error('Could not load barangays:', err));

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
    updatePriceHelper();
  }

  function updatePriceHelper() {
    const input = document.getElementById('listingPrice');
    const helper = document.getElementById('priceHelper');
    if (!input || !helper) return;
    const val = Number(input.value);
    if (!val || val <= 0) {
      helper.textContent = '';
      return;
    }
    const formatted = '₱' + val.toLocaleString('en-PH');
    if (currentListingType === 'sale' && val < 50000) {
      helper.style.color = '#fbbf24';
      helper.innerHTML = `⚠️ ${formatted} — Did you mean <strong>₱${(val * 1000).toLocaleString('en-PH')}</strong> or <strong>₱${(val * 1000000).toLocaleString('en-PH')}</strong>? Please enter the full amount.`;
    } else {
      helper.style.color = 'var(--teal, #00c9a7)';
      let words = '';
      if (val >= 1000000) {
        words = ` (${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 2)} Million Pesos)`;
      } else if (val >= 1000) {
        words = ` (${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)} Thousand Pesos)`;
      }
      helper.textContent = `${formatted}${words}${currentListingType === 'rent' ? ' / month' : ''}`;
    }
  }
  window.updatePriceHelper = updatePriceHelper;

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

  /* ── Save to the database ── */
  let draftId = null;                    // set after the first save, so later saves update instead of inserting again
  let saving  = false;
  const uploadedDocPaths = new Map();    // data URL → storage path, so a retry never uploads the same photo twice

  function readForm() {
    const val = (id) => document.getElementById(id).value.trim();
    const num = (id) => (val(id) === '' ? null : Number(val(id)));
    const type = val('propertyType') || null;
    const hasRooms = type !== 'lot' && type !== 'commercial';
    const multi = document.getElementById('multiUnitToggle').checked;
    return {
      title: val('listingTitle'),
      type,
      listingFor: currentListingType,
      price: num('listingPrice'),
      barangay: val('listingBarangay') || null,
      address: val('listingAddress') || null,
      floorArea: num('floorArea'),
      lotArea: num('lotArea'),
      bedrooms: hasRooms ? parseInt(val('listingBedrooms'), 10) : null,
      bathrooms: hasRooms ? parseInt(val('listingBathrooms'), 10) : null,
      negotiable: document.getElementById('negotiableToggle').checked,
      hasMultipleUnits: multi,
      totalUnits: multi ? num('totalUnits') : null,
      availableUnits: multi ? num('availableUnits') : null,
      description: val('listingDesc') || null,
      amenities: Array.from(selectedAmenities),
    };
  }

  // Create/update the row, upload photos + documents, then (optionally) hand it to the admins.
  async function persist(submit) {
    const form = readForm();

    // 1. The row first (as a draft): if an upload fails the seller keeps what they typed.
    const row = draftId ? await HS.listings.update(draftId, form) : await HS.listings.create(form);
    draftId = row.id;

    // 2. Listing photos → public bucket
    const pending = uploadedPhotos.filter(p => !p.remoteUrl);
    if (pending.length) {
      const urls = await HS.storage.uploadListingImages(pending.map(p => p.file));
      pending.forEach((p, i) => { p.remoteUrl = urls[i]; });
    }

    // 3. Title documents → private bucket (only the owner and admins can open them)
    const documents = [];
    const groups = [
      { label: 'Deed of Sale / Transfer Certificate of Title', photos: deedPhotos },
      { label: 'Supporting Document', photos: supportPhotos },
    ];
    for (const g of groups) {
      for (let i = 0; i < g.photos.length; i++) {
        const dataUrl = g.photos[i];
        if (!uploadedDocPaths.has(dataUrl)) {
          uploadedDocPaths.set(dataUrl, await HS.storage.upload('verification-docs', dataUrl, g.label));
        }
        documents.push({ label: g.photos.length > 1 ? g.label + ' (page ' + (i + 1) + ')' : g.label, path: uploadedDocPaths.get(dataUrl) });
      }
    }

    // 4. Attach everything; submitting moves it to the admins' review queue.
    const patch = { images: uploadedPhotos.map(p => p.remoteUrl).filter(Boolean), documents };
    if (submit) patch.status = 'pending';
    await HS.listings.update(draftId, patch);
  }

  function setSaving(on) {
    saving = on;
    document.querySelectorAll('#postForm .btn-primary, #postForm .btn-ghost').forEach(b => { b.disabled = on; });
  }

  /* ── Validation + Submit ── */
  async function submitListing() {
    if (saving) return;
    const f = readForm();

    const missing = [];
    if (!f.title)                       missing.push('Listing Title');
    if (!f.type)                        missing.push('Property Type');
    if (!f.price)                       missing.push('Price');
    if (!f.barangay)                    missing.push('Barangay');
    if (!f.address)                     missing.push('Full Address');
    if (!f.floorArea)                   missing.push('Floor Area');
    if (!f.description)                 missing.push('Description');
    if (uploadedPhotos.length === 0)    missing.push('at least 1 photo');
    if (deedPhotos.length === 0)        missing.push('Deed of Sale or TCT photos (at least 1 page)');

    if (missing.length > 0) {
      showToast('error', 'Please fill in all required fields and upload required documents.');
      return;
    }
    if (f.hasMultipleUnits && !(f.totalUnits >= 2 && f.availableUnits >= 0 && f.availableUnits <= f.totalUnits)) {
      showToast('error', 'Units: total must be at least 2 and available cannot exceed the total.');
      return;
    }

    setSaving(true);
    try {
      await persist(true);
      document.getElementById('successModal').classList.add('open');
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not submit your listing: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── Save as Draft ── */
  async function saveAsDraft() {
    if (saving) return;
    const f = readForm();
    if (!f.title || !f.price) {
      showToast('error', 'Add at least a title and a price to save a draft.');
      return;
    }
    setSaving(true);
    try {
      await persist(false);
      showToast('success', 'Listing saved as draft. You can submit it for review from My Listings.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not save your draft: ' + err.message);
    } finally {
      setSaving(false);
    }
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

  // ── Google Map Pin Location ────────────────────────────────────────────────
  window.pinLocationOnMap = function() {
    const searchVal = document.getElementById('mapAddressSearch').value.trim() ||
                      document.getElementById('listingAddress').value.trim() ||
                      document.getElementById('listingBarangay').value.trim();
    if (!searchVal) {
      showToast('error', 'Please enter an address or barangay first.');
      return;
    }

    const query = encodeURIComponent(searchVal + ', Santa Maria, Bulacan, Philippines');
    const iframe = document.getElementById('sellerMapIframe');
    if (iframe) {
      iframe.src = `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
    }

    const statusEl = document.getElementById('mapStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--teal)">✓ Pinned on map: <strong>${searchVal}, Sta. Maria, Bulacan</strong></span>`;
    }
  };
