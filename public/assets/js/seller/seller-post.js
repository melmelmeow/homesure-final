
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
  KasafideSidebar.init({ activePage: 'listings' });
  KasafideTopbar.init({ placeholder: 'Post a property...' });

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
      helper.style.color = 'var(--warning)';
      helper.innerHTML = `⚠️ ${formatted} — Did you mean <strong>₱${(val * 1000).toLocaleString('en-PH')}</strong> or <strong>₱${(val * 1000000).toLocaleString('en-PH')}</strong>? Please enter the full amount.`;
    } else {
      helper.style.color = 'var(--teal, var(--primary))';
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
      lat: num('pinnedLat'),
      lng: num('pinnedLng'),
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
    if (form.lat) patch.lat = form.lat;
    if (form.lng) patch.lng = form.lng;
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

  // ── Google Maps Interactive Double-Click Pinning ───────────────────────────
  let sellerGoogleMap = null;
  let gmapStreetLayer = null;
  let gmapSatelliteLayer = null;
  let currentGmapLayer = 'street';
  let googlePinMarker = null;

  // Iconic Google Maps Red Pin SVG Icon
  function createGoogleRedPinIcon() {
    if (typeof L === 'undefined') return null;
    return L.divIcon({
      className: 'gmaps-red-pin',
      html: `<div style="
        position: relative;
        width: 32px; height: 42px;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));
        cursor: grab;
      ">
        <svg viewBox="0 0 24 32" width="32" height="42" fill="none">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#EA4335" stroke="#FFFFFF" stroke-width="1.4"/>
          <circle cx="12" cy="11" r="4.2" fill="#FFFFFF"/>
        </svg>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 40],
      popupAnchor: [0, -38]
    });
  }

  function initSellerGoogleMap() {
    const container = document.getElementById('sellerGoogleMap');
    if (!container || typeof L === 'undefined' || sellerGoogleMap) return;

    // Santa Maria, Bulacan center
    const defaultCenter = [14.8192, 120.9610];
    sellerGoogleMap = L.map('sellerGoogleMap', {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
      doubleClickZoom: false // Disable double click zoom so dblclick drops pin!
    });

    // Google Maps Street/Roadmap Tiles
    gmapStreetLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
      maxZoom: 20
    });

    // Google Maps Hybrid Satellite Tiles (Satellite + Road Labels)
    gmapSatelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Satellite',
      maxZoom: 20
    });

    gmapStreetLayer.addTo(sellerGoogleMap);

    // Double-Click to Pin the House Instantly!
    sellerGoogleMap.on('dblclick', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      placeGooglePin(lat, lng);
      showToast('success', `📍 Pinned house at ${lat}, ${lng}`);
    });

    // Single-click also updates pin if clicked directly
    sellerGoogleMap.on('click', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      placeGooglePin(lat, lng);
    });

    setTimeout(() => sellerGoogleMap.invalidateSize(), 300);
  }

  function placeGooglePin(lat, lng) {
    if (!sellerGoogleMap || typeof L === 'undefined') return;

    document.getElementById('pinnedLat').value = lat;
    document.getElementById('pinnedLng').value = lng;

    const coordBadge = document.getElementById('coordBadge');
    if (coordBadge) {
      coordBadge.textContent = `📍 Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      coordBadge.style.display = 'inline-block';
    }

    const statusEl = document.getElementById('mapStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--teal)">✓ House pinned at: <strong>${lat}, ${lng}</strong> (You can drag the pin to fine-tune)</span>`;
    }

    const openLink = document.getElementById('openInGoogleMapsLink');
    if (openLink) {
      openLink.href = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=18`;
      openLink.style.borderColor = 'rgba(0,201,167,0.4)';
    }

    if (googlePinMarker) {
      googlePinMarker.setLatLng([lat, lng]);
    } else {
      googlePinMarker = L.marker([lat, lng], {
        icon: createGoogleRedPinIcon(),
        draggable: true
      }).addTo(sellerGoogleMap);

      googlePinMarker.on('dragend', () => {
        const pos = googlePinMarker.getLatLng();
        const dLat = parseFloat(pos.lat.toFixed(6));
        const dLng = parseFloat(pos.lng.toFixed(6));
        document.getElementById('pinnedLat').value = dLat;
        document.getElementById('pinnedLng').value = dLng;
        if (coordBadge) {
          coordBadge.textContent = `📍 Lat: ${dLat.toFixed(5)}, Lng: ${dLng.toFixed(5)}`;
        }
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:var(--teal)">✓ House pin adjusted to: <strong>${dLat}, ${dLng}</strong></span>`;
        }
        showToast('info', `Pin adjusted to ${dLat}, ${dLng}`);
      });
    }
  }

  window.switchGoogleMapView = function(type) {
    if (!sellerGoogleMap) return;
    currentGmapLayer = type;
    const btnStreet = document.getElementById('gmapBtnStreet');
    const btnSat = document.getElementById('gmapBtnSatellite');

    if (type === 'satellite') {
      sellerGoogleMap.removeLayer(gmapStreetLayer);
      gmapSatelliteLayer.addTo(sellerGoogleMap);
      if (btnStreet) btnStreet.classList.remove('active');
      if (btnSat) btnSat.classList.add('active');
    } else {
      sellerGoogleMap.removeLayer(gmapSatelliteLayer);
      gmapStreetLayer.addTo(sellerGoogleMap);
      if (btnSat) btnSat.classList.remove('active');
      if (btnStreet) btnStreet.classList.add('active');
    }
  };

  // Parses coordinates from string like "14.8192, 120.9610" or Google Maps URL
  function extractCoords(input) {
    if (!input) return null;
    const urlMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };

    const coordMatch = input.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }

  window.pinLocationOnMap = async function(manualSearch) {
    const searchInput = document.getElementById('mapAddressSearch');
    const rawVal = (typeof manualSearch === 'string' ? manualSearch : (searchInput?.value || '')).trim() ||
                   document.getElementById('listingAddress')?.value.trim() ||
                   document.getElementById('listingBarangay')?.value.trim();

    if (!rawVal) {
      showToast('error', 'Please enter an address, subdivision, or coordinates.');
      return;
    }

    if (!sellerGoogleMap) initSellerGoogleMap();

    const coords = extractCoords(rawVal);
    if (coords) {
      sellerGoogleMap.setView([coords.lat, coords.lng], 18);
      placeGooglePin(coords.lat, coords.lng);
      showToast('success', '📍 Pinned house to exact coordinates!');
      return;
    }

    let query = rawVal;
    if (!query.toLowerCase().includes('santa maria') && !query.toLowerCase().includes('sta. maria')) {
      query += ', Santa Maria, Bulacan';
    }
    if (!query.toLowerCase().includes('philippines')) {
      query += ', Philippines';
    }

    const statusEl = document.getElementById('mapStatusText');
    if (statusEl) statusEl.innerHTML = `<span>Searching location for <em>${query}</em>...</span>`;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));

          sellerGoogleMap.setView([lat, lng], 18);
          placeGooglePin(lat, lng);
          showToast('success', `Located ${data[0].display_name.split(',')[0]}! Double-click to adjust pin directly on the roof.`);
          return;
        }
      }
    } catch (e) {
      console.warn('Geocoding notice:', e);
    }

    // Fallback: Center on Sta. Maria and let user double-click
    const defaultLat = 14.8192;
    const defaultLng = 120.9610;
    sellerGoogleMap.setView([defaultLat, defaultLng], 16);
    placeGooglePin(defaultLat, defaultLng);
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--teal)">✓ Centered on Sta. Maria. Double-click or drag the pin onto your house.</span>`;
    }
  };

  
  // ── Explicit Save Pin Location ──────────────────────────────────────────────
  window.savePinLocation = function() {
    const lat = document.getElementById('pinnedLat').value;
    const lng = document.getElementById('pinnedLng').value;

    if (!lat || !lng) {
      showToast('error', 'Please double-click or click on the map to drop a pin on your house first.');
      return;
    }

    const badge = document.getElementById('pinSavedBadge');
    if (badge) {
      badge.innerHTML = `✓ Pin Confirmed: <strong>${lat}, ${lng}</strong>`;
      badge.style.display = 'inline-flex';
    }

    const openLink = document.getElementById('openInGoogleMapsLink');
    if (openLink) {
      openLink.href = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=18`;
      openLink.style.borderColor = 'var(--teal)';
      openLink.style.color = 'var(--teal)';
    }

    const statusEl = document.getElementById('mapStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--teal)">✓ <strong>House pin confirmed & saved!</strong> Coordinates: <code>${lat}, ${lng}</code>. Click <strong>"View in Actual Google Maps ↗"</strong> to preview your pin live in Google Maps.</span>`;
    }

    showToast('success', `✓ Pin saved at ${lat}, ${lng}! Ready for Google Maps.`);
  };

  window.useCurrentGpsLocation = function() {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser.');
      return;
    }

    if (!sellerGoogleMap) initSellerGoogleMap();
    const statusEl = document.getElementById('mapStatusText');
    if (statusEl) statusEl.innerHTML = `<span>Acquiring GPS location...</span>`;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        sellerGoogleMap.setView([lat, lng], 18);
        placeGooglePin(lat, lng);

        const searchInput = document.getElementById('mapAddressSearch');
        if (searchInput) searchInput.value = `${lat}, ${lng}`;

        showToast('success', '📍 GPS location found! Double-click or drag to fine-tune on the house.');

        const addressInput = document.getElementById('listingAddress');
        if (addressInput && !addressInput.value.trim()) {
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (r.ok) {
              const d = await r.json();
              if (d && d.display_name) {
                const parts = d.display_name.split(',');
                addressInput.value = parts.slice(0, 3).join(',').trim();
              }
            }
          } catch {}
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        showToast('error', 'Unable to retrieve location. Please check browser permissions.');
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger)">Location access was denied or timed out.</span>`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  window.pinFromAddressField = function() {
    const addr = document.getElementById('listingAddress')?.value.trim();
    const brgy = document.getElementById('listingBarangay')?.value.trim();
    if (!addr && !brgy) {
      showToast('error', 'Please enter your Street Address or select a Barangay first.');
      return;
    }
    const combined = [addr, brgy].filter(Boolean).join(', ');
    const searchInput = document.getElementById('mapAddressSearch');
    if (searchInput) searchInput.value = combined;
    window.pinLocationOnMap(combined);
  };

  // Auto-pin when selecting barangay or address
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initSellerGoogleMap, 200);

    const addrField = document.getElementById('listingAddress');
    if (addrField) {
      addrField.addEventListener('blur', () => {
        if (addrField.value.trim()) window.pinFromAddressField();
      });
    }
    const brgyField = document.getElementById('listingBarangay');
    if (brgyField) {
      brgyField.addEventListener('change', () => {
        if (brgyField.value) window.pinFromAddressField();
      });
    }
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSellerGoogleMap, 200);
  }
