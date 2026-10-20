
      const user = getSession();
      if (!user) window.location.href = "../../auth/signin.html";

      HomeSureSidebar.init({ activePage: "dashboard" });
      HomeSureTopbar.init({ placeholder: "Search properties..." });

      // ── Icons ──────────────────────────────────────────────────────────────────
      const iconPin = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
      const iconBed = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
      const iconBath = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
      const iconArea = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
      const iconMsg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      const iconFlag = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
      const iconHeart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

      // ── Save / unsave (favorites table) ────────────────────────────────────────
      let savedIds = [];

      function updateSaveBtn(listingId) {
        const isSaved = savedIds.includes(listingId);
        const btn = document.getElementById("saveBtn");
        if (!btn) return;
        if (isSaved) {
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Saved`;
          btn.classList.add("saved");
        } else {
          btn.innerHTML = `${iconHeart} Save Listing`;
          btn.classList.remove("saved");
        }
      }

      function isBuyerVerified() {
        const u = getSession();
        if (!u || u.role !== 'buyer') return true;
        if (!u.isVerified) return false;
        if (u.verificationExpiry && new Date(u.verificationExpiry) < new Date()) return false;
        return true;
      }

      async function toggleSave(listingId) {
        if (!isBuyerVerified()) {
          window.location.href = 'verification.html';
          return;
        }
        try {
          const nowSaved = await HS.favorites.toggle(listingId);
          savedIds = nowSaved ? savedIds.concat(listingId) : savedIds.filter((id) => id !== listingId);
          updateSaveBtn(listingId);
        } catch (err) {
          toast(err.message);
        }
      }

      // ── Thumbnail swap ─────────────────────────────────────────────────────────
      function swapImage(src, el) {
        document.getElementById("mainImg").src = src;
        document
          .querySelectorAll(".thumb-item")
          .forEach((t) => t.classList.remove("active"));
        el.classList.add("active");
      }

      // ── Modal helpers ──────────────────────────────────────────────────────────
      function openReportModal() {
        document.getElementById("reportReason").value = "";
        document.getElementById("reportDetails").value = "";
        document.getElementById("reportReasonErr").style.display = "none";
        document.getElementById("reportModal").classList.add("open");
      }

      function closeReportModal() {
        document.getElementById("reportModal").classList.remove("open");
      }

      function toast(text) {
        const el = document.createElement("div");
        el.textContent = text;
        Object.assign(el.style, {
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#253347",
          color: "#f1f5f9",
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: "9999",
          transition: "opacity 0.4s",
          opacity: "1",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        });
        document.body.appendChild(el);
        setTimeout(() => {
          el.style.opacity = "0";
        }, 2200);
        setTimeout(() => el.remove(), 2700);
      }

      async function submitReport() {
        const select = document.getElementById("reportReason");
        const reason = select.value;
        const err = document.getElementById("reportReasonErr");
        if (!reason) {
          err.style.display = "block";
          return;
        }
        err.style.display = "none";
        const details = document.getElementById("reportDetails").value.trim();
        const label = select.options[select.selectedIndex].textContent.trim();
        try {
          await HS.reports.file(listing.id, reason, details ? label + ": " + details : label);
          closeReportModal();
          toast("Report submitted. Thank you.");
        } catch (e) {
          toast("Could not submit the report: " + e.message);
        }
      }

      document
        .getElementById("reportModal")
        .addEventListener("click", function (e) {
          if (e.target === this) closeReportModal();
        });

      // ── Dynamic back button ────────────────────────────────────────────────────
      const params = new URLSearchParams(window.location.search);
      const fromPage = params.get("from");
      const backBtn = document.querySelector(".back-link");
      if (fromPage === "saved") {
        backBtn.textContent = "";
        backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Back to Saved Listings`;
        backBtn.onclick = () => (window.location.href = "saved.html");
      }

      // ── Load listing (from the database; RLS decides whether this user may see it) ──
      let listing = null;
      let seller = null;
      const detail = document.getElementById("listingDetail");

      async function loadListing() {
        detail.innerHTML = `<p style="color:var(--muted);text-align:center;padding:60px 0">Loading…</p>`;
        try {
          listing = await HS.listings.get(params.get("id"));
          if (listing) {
            seller = await HS.profiles.publicById(listing.sellerId);
            savedIds = await HS.favorites.ids();
          }
        } catch (err) {
          console.error(err);
          detail.innerHTML = `<p style="color:var(--muted);text-align:center;padding:60px 0">Could not load this listing. Please try again.</p>`;
          return;
        }

      if (!listing) {
        detail.innerHTML = `<p style="color:var(--muted);text-align:center;padding:60px 0">Listing not found.</p>`;
      } else {
        const isRent = listing.listingFor === "rent";
        const price = "₱" + listing.price.toLocaleString("en-PH");
        const bedsLabel =
          listing.bedrooms === null || listing.bedrooms === undefined
            ? ""
            : listing.bedrooms === 0
              ? "Studio"
              : listing.bedrooms +
                " Bedroom" +
                (listing.bedrooms !== 1 ? "s" : "");
        const bathLabel =
          listing.bathrooms === null || listing.bathrooms === undefined
            ? ""
            : listing.bathrooms +
              " Bathroom" +
              (listing.bathrooms !== 1 ? "s" : "");
        const areaLabel = listing.floorArea || listing.lotArea;
        const sellerName = seller ? seller.name : "Unknown Seller";
        const amenitiesHtml = (listing.amenities || [])
          .map((a) => `<span class="amenity-tag">${a}</span>`)
          .join("");

        const thumbsHtml =
          listing.images.length > 1
            ? `<div class="thumb-strip">` +
              listing.images
                .map(
                  (src, i) => `
          <div class="thumb-item ${i === 0 ? "active" : ""}" onclick="swapImage('${src}', this)">
            <img src="${src}" alt="" loading="lazy" />
          </div>`,
                )
                .join("") +
              `</div>`
            : "";

        detail.innerHTML = `
      <div class="detail-img-wrap">
        <img id="mainImg" src="${HS.cover(listing)}" alt="${listing.title}" />
        <span class="badge-tl ${isRent ? "badge-rent" : "badge-sale"}">${isRent ? "For Rent" : "For Sale"}</span>
        ${listing.negotiable ? `<span class="badge-negotiable-img">Negotiable</span>` : ""}
        <span class="badge-avail">Available</span>
      </div>
      ${thumbsHtml}

      <div class="detail-body">
        <div class="detail-title-row">
          <div class="detail-title">${listing.title}</div>
          <div class="detail-price-block">
            <div class="detail-price">${price}</div>
            ${isRent ? `<span class="detail-price-per">/month</span>` : ""}
            ${listing.negotiable ? `<span class="price-negotiable">Price negotiable</span>` : ""}
          </div>
        </div>

        <div class="detail-location">
          ${iconPin} ${listing.address}
          ${listing.lat && listing.lng ? `
            <a href="https://www.google.com/maps?q=${listing.lat},${listing.lng}"
               target="_blank"
               class="map-link"
               title="View on Google Maps">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              View on Map
            </a>
          ` : ''}
        </div>

        <div class="detail-specs">
          ${bedsLabel ? `<div class="spec-item">${iconBed} ${bedsLabel}</div>` : ""}
          ${bathLabel ? `<div class="spec-item">${iconBath} ${bathLabel}</div>` : ""}
          ${areaLabel ? `<div class="spec-item">${iconArea} ${areaLabel} sqm</div>` : ""}
        </div>

        <div class="detail-section-title">Description</div>
        <div class="detail-desc">${listing.description}</div>

        ${amenitiesHtml ? `<div class="amenities-wrap">${amenitiesHtml}</div>` : ""}

        
        <div class="detail-section-title" style="display:flex;align-items:center;gap:8px;margin-top:24px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--teal)">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Property Location &amp; Map</span>
        </div>
        <div class="property-map-container" style="width:100%;height:320px;border-radius:12px;overflow:hidden;border:1px solid var(--border);margin:12px 0 24px;box-shadow:0 4px 16px rgba(0,0,0,0.15);background:#1e293b;">
          <iframe
            width="100%"
            height="100%"
            style="border:0"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=${listing.lat && listing.lng ? (listing.lat + ',' + listing.lng) : encodeURIComponent((listing.address || '') + (listing.barangay ? ', ' + listing.barangay : '') + ', Sta. Maria, Bulacan, Philippines')}&z=15&output=embed">
          </iframe>
        </div>

        <div class="seller-card">
          <div>
            <div class="seller-label">Listed by</div>
            <div class="seller-name">
              <span class="seller-name-link" onclick="
                ${user.role === 'seller' && user.id === listing.sellerId
                  ? `window.location.href='../seller/profile.html'`
                  : `window.location.href='seller-profile.html?id=${listing.sellerId}'`}
              ">${sellerName}</span>
              ${seller && seller.verified ? `<span class="verified-sm">${iconCheck} Verified</span>` : ""}
            </div>
          </div>
          <div class="seller-actions">
            <button class="save-btn" id="saveBtn">
              ${iconHeart} Save Listing
            </button>
            ${user.id !== listing.sellerId ? `
              <button class="schedule-btn" onclick="openScheduleModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Schedule Viewing
              </button>
              <button class="msg-btn" onclick="handleMessageSeller()"> ${iconMsg} Message Seller </button>
            ` : ''}
          </div>
        </div>

        <button class="report-link" onclick="openReportModal()">
          ${iconFlag} Report Listing
        </button>
      </div>
    `;

        updateSaveBtn(listing.id);
        document
          .getElementById("saveBtn")
          .addEventListener("click", () => toggleSave(listing.id));
      }
      }

      loadListing();

      function handleMessageSeller() {
        if (!isBuyerVerified()) {
          window.location.href = 'verification.html';
          return;
        }
        window.location.href = 'messages.html';
      }

      // ── Schedule Viewing Functions ─────────────────────────────────────────────
      window.openScheduleModal = function() {
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        document.getElementById('viewingDate').min = minDate;

        // Clear form
        document.getElementById('viewingDate').value = '';
        document.getElementById('viewingTime').value = '';
        document.getElementById('viewingNotes').value = '';

        // Hide errors
        document.getElementById('viewingDateErr').style.display = 'none';
        document.getElementById('viewingTimeErr').style.display = 'none';

        // Show modal
        document.getElementById('scheduleModal').classList.add('active');
      };

      window.closeScheduleModal = function() {
        document.getElementById('scheduleModal').classList.remove('active');
      };

      window.submitSchedule = async function() {
        const date = document.getElementById('viewingDate').value;
        const time = document.getElementById('viewingTime').value;
        const notes = document.getElementById('viewingNotes').value;

        let hasError = false;

        // Validate date
        if (!date) {
          document.getElementById('viewingDateErr').style.display = 'block';
          hasError = true;
        } else {
          document.getElementById('viewingDateErr').style.display = 'none';
        }

        // Validate time
        if (!time) {
          document.getElementById('viewingTimeErr').style.display = 'block';
          hasError = true;
        } else {
          document.getElementById('viewingTimeErr').style.display = 'none';
        }

        if (hasError) return;

        // Format date for display
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        // Convert 24h time to 12h format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const formattedTime = `${hour12}:${minutes} ${ampm}`;

        // Create the viewing request (and the chat card for the seller) in the database
        try {
          await HS.viewing.request({
            propertyId: listing.id,
            sellerId: listing.sellerId,
            listingTitle: listing.title,
            date, time, notes,
          });
        } catch (err) {
          toast("Could not send your request: " + err.message);
          return;
        }

        // Close modal
        closeScheduleModal();

        // Reset form
        document.getElementById('viewingDate').value = '';
        document.getElementById('viewingTime').value = '';
        document.getElementById('viewingNotes').value = '';

        // Show success notification
        showSuccessNotification(
          `Your viewing request for <strong>${formattedDate} at ${formattedTime}</strong> has been sent to ${seller ? seller.name : "the seller"}. They will review and respond soon!`
        );
      };


      // ── Success Notification ────────────────────────────────────────────────
      function showSuccessNotification(message) {
        const notif = document.getElementById('successNotif');
        const messageEl = document.getElementById('successMessage');
        
        messageEl.innerHTML = message;
        notif.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
          notif.classList.remove('show');
        }, 5000);
      }

