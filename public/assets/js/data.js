// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Data layer
//  Depends on: config.js (sb), session.js
//
//  The only place the front end talks to the database (Supabase) — pages call HS.*
//  instead of reading the old fake-data arrays. Database rows are snake_case; the pages use
//  camelCase, so everything returned here is already in the shape the pages expect.
//  What a user may read/change is enforced by Row Level Security (backend/supabase).
//  Functions throw an Error with a readable message; callers catch and show a toast.
// ─────────────────────────────────────────────────────────────────────────────
const HS = (function () {
  'use strict';

  const ASSET_BASE = document.currentScript ? new URL('.', document.currentScript.src).href : '';

  const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
      '<rect width="800" height="600" fill="#e2e8f0"/>' +
      '<path d="M400 190l150 120v150H250V310z" fill="#cbd5e1"/>' +
      '<text x="400" y="520" font-family="sans-serif" font-size="28" text-anchor="middle" fill="#64748b">No photo</text></svg>'
    );

  // ── Small helpers ───────────────────────────────────────────────────────────
  const num = (v) => (v === null || v === undefined ? null : Number(v));
  const day = (v) => (v ? String(v).slice(0, 10) : null);

  function unwrap({ data, error }) {
    if (error) throw new Error(error.message || 'Request failed');
    return data;
  }

  async function userId() {
    const { data } = await sb.auth.getSession();
    return data.session ? data.session.user.id : null;
  }

  async function needUserId() {
    const id = await userId();
    if (!id) throw new Error('Your session has expired. Please sign in again.');
    return id;
  }

  // POST to one of the Next.js API routes.
  //
  // A few things cannot be done from the browser at all: payments have no INSERT or UPDATE policy,
  // so only the server (service role) may write one. Those routes authenticate the caller with the
  // access token Supabase keeps for us, which getAuth() on the server verifies.
  async function api(path, body) {
    const { data } = await sb.auth.getSession();
    const token = data.session ? data.session.access_token : null;
    if (!token) throw new Error('Your session has expired. Please sign in again.');

    const res = await fetch((typeof API_URL === 'string' ? API_URL : '') + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body || {}),
    });

    const text = await res.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (err) { payload = null; }

    if (!res.ok) {
      throw new Error((payload && payload.error) || 'Request failed (' + res.status + ')');
    }
    return payload || {};
  }

  // ── Row ⇄ page-shape mapping ────────────────────────────────────────────────
  function mapProfile(r) {
    if (!r) return null;
    const parts = (r.full_name || '').trim().split(/\s+/);
    const firstName = r.first_name || parts[0] || '';
    const lastName = r.last_name || parts.slice(1).join(' ');
    return {
      id: r.id,
      role: r.role,
      firstName, lastName,
      name: (firstName + ' ' + lastName).trim(),
      email: r.email || null,                 // null for other users (public_profiles has no contact info)
      phone: r.phone || null,
      avatar: r.avatar_url || null,
      accountStatus: r.account_status || 'unverified',
      verified: r.account_status === 'verified',
      isVerified: r.account_status === 'verified',
      verifiedAt: day(r.verified_at),
      verificationExpiry: day(r.verification_expiry),
      phoneVerified: !!r.phone_verified,
      submittedVerificationAt: day(r.submitted_verification_at),
      moaSignedAt: day(r.moa_signed_at),
      verificationDocs: r.verification_docs || [],             // [{ label, path }] — private files
      newVerificationDocs: r.new_verification_docs || [],      // a renewal submitted while still verified
      newSubmittedAt: day(r.new_submitted_verification_at),
      verificationRejectReason: r.verification_reject_reason || null,
      warningCount: r.warning_count || 0,
      suspendedAt: r.suspended_at || null,
      joinedAt: day(r.created_at),
    };
  }

  function mapProperty(r) {
    if (!r) return null;
    return {
      id: r.id,
      sellerId: r.landowner_id,
      type: r.property_type,
      listingFor: r.listing_type,
      title: r.title,
      description: r.description || '',
      price: num(r.price),
      // barangay is a lookup table; queries join it in as `barangays(name)`
      barangayId: r.barangay_id,
      barangay: (r.barangays && r.barangays.name) || '',
      address: r.address || '',
      city: r.city || '', province: r.province || '',
      lat: num(r.latitude), lng: num(r.longitude),
      bedrooms: r.bedrooms, bathrooms: r.bathrooms,
      floorArea: num(r.floor_area_sqm), lotArea: num(r.lot_area_sqm),
      status: r.status,
      verified: r.verification_state === 'verified',      // title checked by an admin (LRA)
      titleState: r.verification_state,
      negotiable: !!r.price_negotiable,
      featured: !!r.featured,
      lifecycleStatus: r.lifecycle_status || undefined,
      hasMultipleUnits: !!r.has_multiple_units,
      totalUnits: r.total_units, availableUnits: r.available_units,
      images: Array.isArray(r.images) ? r.images : [],
      thumbnail: r.thumbnail_url || null,
      documents: Array.isArray(r.documents) ? r.documents : [],   // [{ label, path }] — private, see storage.signedUrl()
      amenities: Array.isArray(r.amenities) ? r.amenities : [],
      postedAt: r.created_at,
      rejectionReason: r.rejection_reason || undefined,
      rejectionNotes: r.rejection_notes || undefined,
    };
  }

  const PROPERTY_FIELDS = {
    type: 'property_type', listingFor: 'listing_type', title: 'title', description: 'description', price: 'price',
    barangayId: 'barangay_id', address: 'address', city: 'city', province: 'province',
    lat: 'latitude', lng: 'longitude',
    bedrooms: 'bedrooms', bathrooms: 'bathrooms', floorArea: 'floor_area_sqm', lotArea: 'lot_area_sqm',
    negotiable: 'price_negotiable', amenities: 'amenities', images: 'images', documents: 'documents',
    thumbnail: 'thumbnail_url',
    hasMultipleUnits: 'has_multiple_units', totalUnits: 'total_units', availableUnits: 'available_units',
    status: 'status', lifecycleStatus: 'lifecycle_status',
  };

  // Pages pass a barangay NAME; the table stores a barangay_id.
  async function toPropertyRow(listing) {
    const row = {};
    Object.keys(PROPERTY_FIELDS).forEach((k) => { if (listing[k] !== undefined) row[PROPERTY_FIELDS[k]] = listing[k]; });
    if (listing.barangay !== undefined && listing.barangayId === undefined) {
      row.barangay_id = await barangayId(listing.barangay);
    }
    if (row.images && row.images.length && !listing.thumbnail) row.thumbnail_url = row.images[0];
    return row;
  }

  // Everything that reads a listing needs the barangay name joined in.
  const PROPERTY_SELECT = '*, barangays(name)';

  // Lists do not need every column. A card shows a title, a price, a photo and a few figures; it
  // never shows the description or the amenities, and those are the two biggest fields on the row.
  // Checked against every page that renders a list — none of them reads either one.
  //
  // The detail page still uses PROPERTY_SELECT, because it shows all of it.
  const PROPERTY_LIST_SELECT = [
    'id', 'landowner_id', 'title', 'price', 'price_negotiable',
    'property_type', 'listing_type', 'status', 'lifecycle_status', 'verification_state',
    'address', 'barangay_id', 'city', 'province', 'latitude', 'longitude',
    'bedrooms', 'bathrooms', 'floor_area_sqm', 'lot_area_sqm',
    'images', 'thumbnail_url', 'has_multiple_units', 'total_units', 'available_units',
    'created_at', 'updated_at',
    'barangays(name)',
  ].join(', ');

  // Nothing should ever ask the database for an unbounded number of rows. 500 is far above any
  // realistic number of listings for one municipality, so it changes nothing today — it is there
  // so that a table which grows unexpectedly degrades into "showing the newest 500" instead of
  // sending megabytes to every visitor.
  const LIST_CAP = 500;

  function cover(listing) {
    return (listing && listing.images && listing.images[0]) || PLACEHOLDER_IMG;
  }

  // The database stores reviewer/reviewee; the pages think in buyer/seller. Which is which
  // depends on the direction, so both names are provided.
  function mapReview(r) {
    const buyerIsReviewer = r.type === 'buyer-to-seller';
    return {
      id: r.id,
      type: r.type,
      reviewerId: r.reviewer_id,
      revieweeId: r.reviewee_id,
      buyerId: buyerIsReviewer ? r.reviewer_id : r.reviewee_id,
      sellerId: buyerIsReviewer ? r.reviewee_id : r.reviewer_id,
      listingId: r.property_id || null,
      rating: r.rating,
      comment: r.comment || '',
      helpful: r.helpful || 0,
      reviewDate: r.created_at,
    };
  }

  function mapMessage(r) {
    const vd = r.viewing_data || {};
    const effectiveType = vd.messageType || r.type;
    return {
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      type: effectiveType,                       // 'text' | 'viewing-request' | 'viewing-response' | 'payment-request' | 'payment-proof' | 'refund-request' | 'file-attachment'
      rawType: r.type,
      text: r.body,
      listingId: r.property_id || null,
      viewingRequestId: r.viewing_request_id || null,
      viewingData: r.viewing_data || null,
      paymentData: vd.payment || ((effectiveType.startsWith('payment') || effectiveType === 'refund-request') ? vd : null),
      status: r.status || vd.status || null,
      read: !!r.read,
      timestamp: r.created_at,
    };
  }

  function mapViewing(r) {
    return {
      id: r.id, listingId: r.property_id, buyerId: r.buyer_id, sellerId: r.seller_id, status: r.status,
      requestedDate: r.requested_date, requestedTime: (r.requested_time || '').slice(0, 5),
      proposedDate: r.proposed_date || null, proposedTime: r.proposed_time ? r.proposed_time.slice(0, 5) : null,
      buyerNotes: r.buyer_notes || null, sellerNotes: r.seller_notes || null,
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth = {
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        // The auth server is what refuses an unconfirmed account, so this is the real gate, not
        // a check this code could be talked out of.
        if (/confirm/i.test(error.message)) {
          throw new Error('Please confirm your email first — check your inbox for the link from HomeSure.');
        }
        throw new Error('Incorrect email or password');
      }
      const user = await auth.refresh();
      if (!user) { await hsSignOut(); throw new Error('Your profile could not be loaded. Please try again.'); }
      if (user.suspendedAt) {
        await hsSignOut();
        throw new Error('This account has been suspended. Please contact HomeSure support.');
      }
      return user;
    },

    // Re-read the profile (and saved listings) from the database and refresh the cached copy.
    async refresh() {
      const profile = await profiles.me();
      if (!profile) return null;
      profile.savedListings = await favorites.ids();
      saveSession(profile);
      return profile;
    },

    async changePassword(current, next) {
      const { data } = await sb.auth.getUser();
      if (!data || !data.user) throw new Error('Your session has expired. Please sign in again.');
      const check = await sb.auth.signInWithPassword({ email: data.user.email, password: current });
      if (check.error) throw new Error('Current password is incorrect.');
      const { error } = await sb.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
    },
  };

  // ── Profiles ────────────────────────────────────────────────────────────────
  const profiles = {
    async me() {
      const id = await userId();
      if (!id) return null;
      return mapProfile(unwrap(await sb.from('profiles').select('*').eq('id', id).maybeSingle()));
    },

    // Update the signed-in user's own profile. Accepts page-shape keys.
    async updateMe(patch) {
      const id = await needUserId();
      const row = {};
      if (patch.firstName !== undefined) row.first_name = patch.firstName;
      if (patch.lastName !== undefined) row.last_name = patch.lastName;
      if (patch.firstName !== undefined || patch.lastName !== undefined) {
        const cur = await profiles.me();
        const first = patch.firstName !== undefined ? patch.firstName : cur.firstName;
        const last = patch.lastName !== undefined ? patch.lastName : cur.lastName;
        row.full_name = (first + ' ' + last).trim();
      }
      if (patch.phone !== undefined) row.phone = patch.phone;
      if (patch.avatar !== undefined) row.avatar_url = patch.avatar;
      unwrap(await sb.from('profiles').update(row).eq('id', id));
      return auth.refresh();
    },

    // Public view of other users (name, avatar, verified badge — never email/phone).
    // Signing the seller MOA. 006 guards this column: once it is set it cannot be changed or
    // cleared by the account itself, so a signature cannot quietly be taken back.
    async signMoa() {
      const id = await needUserId();
      const signedAt = new Date().toISOString();
      unwrap(await sb.from('profiles').update({ moa_signed_at: signedAt }).eq('id', id));
      return signedAt;
    },

    // ── How a seller wants to be paid ─────────────────────────────────────────
    // These are contact details, so they are not in public_profiles. The seller reads and writes
    // their own row; a buyer has to go through get_seller_payment_methods(), which only answers
    // for a seller they have a payment, viewing or conversation with.

    async myPaymentMethods() {
      const id = await needUserId();
      const row = unwrap(await sb.from('profiles').select('payment_methods').eq('id', id).maybeSingle());
      return (row && row.payment_methods) || {};
    },

    async savePaymentMethods(methods) {
      const id = await needUserId();
      unwrap(await sb.from('profiles').update({ payment_methods: methods || {} }).eq('id', id));
    },

    async sellerPaymentMethods(sellerId) {
      const { data, error } = await sb.rpc('get_seller_payment_methods', { p_seller: sellerId });
      if (error) throw new Error(error.message);
      return data || {};
    },

    async byIds(ids) {
      const unique = [...new Set((ids || []).filter(Boolean))];
      if (!unique.length) return {};
      const rows = unwrap(await sb.from('public_profiles').select('*').in('id', unique));
      const out = {};
      (rows || []).forEach((r) => { out[r.id] = mapProfile(r); });
      return out;
    },

    async publicById(id) {
      return (await profiles.byIds([id]))[id] || null;
    },
  };

  // ── Listings ────────────────────────────────────────────────────────────────
  const listings = {
    // Marketplace: admin-approved and still available.
    async approved() {
      const rows = unwrap(await sb.from('properties').select(PROPERTY_LIST_SELECT)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(LIST_CAP));
      return (rows || []).map(mapProperty).filter((l) => l.lifecycleStatus !== 'sold' && l.lifecycleStatus !== 'rented');
    },

    // One listing, if the current user is allowed to see it (RLS).
    async get(id) {
      return mapProperty(unwrap(await sb.from('properties').select(PROPERTY_SELECT).eq('id', id).maybeSingle()));
    },

    // The signed-in seller's own listings, every status.
    async mine() {
      const id = await needUserId();
      const rows = unwrap(await sb.from('properties').select(PROPERTY_LIST_SELECT).eq('landowner_id', id).order('created_at', { ascending: false }).limit(LIST_CAP));
      return (rows || []).map(mapProperty);
    },

    // Admins: every listing, every status.
    async all() {
      const rows = unwrap(await sb.from('properties').select(PROPERTY_LIST_SELECT).order('created_at', { ascending: false }).limit(LIST_CAP));
      return (rows || []).map(mapProperty);
    },

    // All listings of one seller that the current user may see (admins: every status; others: approved only).
    async bySeller(sellerId) {
      const rows = unwrap(await sb.from('properties').select(PROPERTY_SELECT).eq('landowner_id', sellerId).order('created_at', { ascending: false }));
      return (rows || []).map(mapProperty);
    },

    // Attach the (public) seller profile to each listing as `l.seller`.
    async withSellers(list) {
      const people = await profiles.byIds(list.map((l) => l.sellerId));
      list.forEach((l) => { l.seller = people[l.sellerId] || null; });
      return list;
    },

    // New listings always start as a draft; call submit() once photos/documents are uploaded.
    async create(listing) {
      const id = await needUserId();
      const row = await toPropertyRow(listing);
      row.landowner_id = id;
      row.status = 'draft';
      return mapProperty(unwrap(await sb.from('properties').insert(row).select(PROPERTY_SELECT).single()));
    },

    async update(id, patch) {
      const row = await toPropertyRow(patch);
      return mapProperty(unwrap(await sb.from('properties').update(row).eq('id', id).select(PROPERTY_SELECT).single()));
    },

    submit(id) { return listings.update(id, { status: 'pending' }); },

    // Seller closes a listing (optionally because it was sold / rented).
    close(id, lifecycleStatus) {
      const patch = { status: 'closed' };
      if (lifecycleStatus) patch.lifecycleStatus = lifecycleStatus;
      return listings.update(id, patch);
    },

    reopen(id) { return listings.update(id, { status: 'pending', lifecycleStatus: null }); },

    async remove(id) {
      unwrap(await sb.from('properties').delete().eq('id', id));
    },

    // ── Admin moderation ──
    async approve(id) {
      const adminId = await needUserId();
      const row = unwrap(await sb.from('properties').update({
        status: 'approved', approved_by: adminId, approved_at: new Date().toISOString(),
        rejection_reason: null, rejection_notes: null,
      }).eq('id', id).select(PROPERTY_SELECT).single());
      return mapProperty(row);
    },

    async reject(id, reason, notes) {
      return mapProperty(unwrap(await sb.from('properties').update({
        status: 'rejected', rejection_reason: reason || null, rejection_notes: notes || null,
      }).eq('id', id).select(PROPERTY_SELECT).single()));
    },
  };

  // ── Saved listings (favorites) ──────────────────────────────────────────────
  function cacheSaved(ids) {
    const s = getSession();
    if (s) { s.savedListings = ids; sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  }

  const favorites = {
    async ids() {
      const id = await userId();
      if (!id) return [];
      const rows = unwrap(await sb.from('saved_properties').select('property_id').eq('user_id', id));
      return (rows || []).map((r) => r.property_id);
    },

    // [{ listing, savedAt }] newest first
    async list() {
      const id = await needUserId();
      const rows = unwrap(await sb.from('saved_properties').select('created_at, properties(*, barangays(name))').eq('user_id', id).order('created_at', { ascending: false }));
      return (rows || []).filter((r) => r.properties).map((r) => ({ listing: mapProperty(r.properties), savedAt: r.created_at }));
    },

    // Returns true when the listing is saved afterwards.
    async toggle(propertyId) {
      const id = await needUserId();
      const current = await favorites.ids();
      let next;
      if (current.includes(propertyId)) {
        unwrap(await sb.from('saved_properties').delete().eq('user_id', id).eq('property_id', propertyId));
        next = current.filter((p) => p !== propertyId);
      } else {
        unwrap(await sb.from('saved_properties').insert({ user_id: id, property_id: propertyId }));
        next = current.concat(propertyId);
      }
      cacheSaved(next);
      return next.includes(propertyId);
    },
  };

  // ── Files (Supabase Storage) ────────────────────────────────────────────────
  // listing-images : public bucket  — listing photos
  // verification-docs : private bucket — IDs, titles, deeds (only the owner and admins can read)
  // Files live under "<user id>/…" so storage policies can check ownership from the path.
  // A phone camera photo is commonly 3–8 MB at full sensor resolution, and every buyer browsing
  // afterwards downloads it. Nothing in HomeSure ever displays an image wider than this, so
  // sending the original costs everyone bandwidth for detail no screen will show.
  const MAX_IMAGE_EDGE = 1600;        // px on the long side
  const IMAGE_QUALITY  = 0.82;        // JPEG quality after resizing

  const storage = {
    async toBlob(source) {
      if (source instanceof Blob) return source;
      return (await fetch(source)).blob();      // data: / blob: URLs from the camera or file input
    },

    /**
     * Shrink a photo to something a screen can actually use.
     *
     * Returns the original untouched when it is already small enough, when it is not an image
     * (a PDF land title, say), or when anything goes wrong — a failed resize must never stop
     * somebody uploading their document.
     */
    async shrinkImage(blob) {
      if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml') return blob;

      try {
        const bitmap = await createImageBitmap(blob);
        const longest = Math.max(bitmap.width, bitmap.height);

        if (longest <= MAX_IMAGE_EDGE) {
          bitmap.close();
          return blob;
        }

        const scale = MAX_IMAGE_EDGE / longest;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const shrunk = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY));

        // Re-encoding a small or already-compressed image can make it bigger. Keep whichever won.
        return shrunk && shrunk.size < blob.size ? shrunk : blob;
      } catch (err) {
        console.warn('Could not resize the image, uploading it as it is:', err);
        return blob;
      }
    },

    async upload(bucket, source, name) {
      const id = await needUserId();
      const blob = await storage.shrinkImage(await storage.toBlob(source));
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0];
      const safe = (name || 'file').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40);
      const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${ext}`;
      const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw new Error('Upload failed: ' + error.message);
      return path;
    },

    // Public URLs for listing photos.
    async uploadListingImages(sources) {
      const urls = [];
      for (const src of sources) {
        const path = await storage.upload('listing-images', src, 'photo');
        urls.push(sb.storage.from('listing-images').getPublicUrl(path).data.publicUrl);
      }
      return urls;
    },

    // Profile photo. It has to be publicly readable (it is shown next to listings and messages),
    // so it goes in the public bucket under the user own folder, like listing photos do.
    async uploadAvatar(source) {
      const path = await storage.upload('listing-images', source, 'avatar');
      return sb.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
    },

    // Private files: returns storage paths (resolve to links with signedUrl()).
    async uploadPrivate(sources, name) {
      const paths = [];
      for (const src of sources) paths.push(await storage.upload('verification-docs', src, name));
      return paths;
    },

    async signedUrl(path, seconds) {
      const { data, error } = await sb.storage.from('verification-docs').createSignedUrl(path, seconds || 3600);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    },

    // [{ label, path }] → [{ label, url }] (url is a short-lived signed link). Unreadable files are skipped.
    async resolveDocs(docs) {
      const out = [];
      for (const d of docs || []) {
        if (d.url) { out.push(d); continue; }
        try { out.push({ label: d.label, url: await storage.signedUrl(d.path) }); } catch (e) { /* not allowed / missing */ }
      }
      return out;
    },
  };

  // ── Account verification (buyers & sellers) ────────────────────────────────
  const verification = {
    // docs: [{ label, sources: [File | dataURL, …] }]. Files go to the private bucket; the account moves
    // to "pending" (first time) or "reverification" (renewing; the approved documents are kept for comparison).
    async submit(docs) {
      const id = await needUserId();
      const me = await profiles.me();
      const stored = [];
      for (const d of docs) {
        const paths = await storage.uploadPrivate(d.sources, d.label);
        paths.forEach((p, i) => stored.push({ label: paths.length > 1 ? `${d.label} (page ${i + 1})` : d.label, path: p }));
      }
      const now = new Date().toISOString();
      const patch = me && me.accountStatus === 'verified'
        ? { new_verification_docs: stored, new_submitted_verification_at: now, account_status: 'reverification' }
        : { verification_docs: stored, submitted_verification_at: now, account_status: 'pending' };
      unwrap(await sb.from('profiles').update(patch).eq('id', id));
      return auth.refresh();
    },
  };

  // ── Viewing requests ───────────────────────────────────────────────────────
  const viewing = {
    // Buyer asks to view a listing. Also drops a "viewing-request" card into the chat with the seller.
    async request({ propertyId, sellerId, listingTitle, date, time, notes }) {
      const me = await needUserId();
      const row = unwrap(await sb.from('viewing_requests').insert({
        property_id: propertyId, buyer_id: me, seller_id: sellerId,   // seller_id is re-set to the listing owner by the database
        requested_date: date, requested_time: time, buyer_notes: notes || null,
      }).select('*').single());

      unwrap(await sb.from('messages').insert({
        sender_id: me, receiver_id: row.seller_id, type: 'viewing-request', property_id: propertyId,
        viewing_request_id: row.id, status: 'pending',
        viewing_data: { listingId: propertyId, listingTitle, requestedDate: date, requestedTime: time, buyerNotes: notes || null },
      }));
      return mapViewing(row);
    },

    // Every request the signed-in user is part of (RLS already limits it to those), newest first,
    // with the other party and the listing attached.
    async list() {
      const me = await needUserId();
      const rows = unwrap(await sb.from('viewing_requests').select('*').order('created_at', { ascending: false }));
      const reqs = (rows || []).map(mapViewing);
      if (!reqs.length) return [];

      const otherIds = reqs.map((r) => (r.buyerId === me ? r.sellerId : r.buyerId));
      const people = await profiles.byIds(otherIds);

      const listingIds = [...new Set(reqs.map((r) => r.listingId).filter(Boolean))];
      const listingRows = listingIds.length
        ? unwrap(await sb.from('properties').select(PROPERTY_SELECT).in('id', listingIds))
        : [];
      const listings = {};
      (listingRows || []).forEach((r) => { listings[r.id] = mapProperty(r); });

      reqs.forEach((r) => {
        r.other = people[r.buyerId === me ? r.sellerId : r.buyerId] || null;
        r.listing = listings[r.listingId] || null;
        r.buyerName = r.buyerId === me ? 'You' : (r.other ? r.other.name : '');
        r.sellerName = r.sellerId === me ? 'You' : (r.other ? r.other.name : '');
        r.listingTitle = r.listing ? r.listing.title : '';
      });
      return reqs;
    },

    // Seller (or buyer) answers. 'counter-proposed' carries a new date/time.
    // The reply is mirrored into the chat so both sides see it in one place.
    async respond(id, { status, proposedDate, proposedTime, sellerNotes }) {
      const me = await needUserId();
      const patch = { status };
      if (proposedDate !== undefined) patch.proposed_date = proposedDate || null;
      if (proposedTime !== undefined) patch.proposed_time = proposedTime || null;
      if (sellerNotes !== undefined) patch.seller_notes = sellerNotes || null;

      const row = unwrap(await sb.from('viewing_requests').update(patch).eq('id', id).select('*').single());
      const req = mapViewing(row);

      const other = req.buyerId === me ? req.sellerId : req.buyerId;
      let title = '';
      try {
        const l = await listings.get(req.listingId);
        title = l ? l.title : '';
      } catch (e) { /* the listing may be gone; the reply still matters */ }

      try {
        unwrap(await sb.from('messages').insert({
          sender_id: me, receiver_id: other, type: 'viewing-response',
          property_id: req.listingId, viewing_request_id: req.id, status,
          viewing_data: {
            listingId: req.listingId, listingTitle: title,
            originalDate: req.requestedDate, originalTime: req.requestedTime,
            proposedDate: req.proposedDate, proposedTime: req.proposedTime,
            sellerNotes: req.sellerNotes,
          },
        }));
      } catch (e) { /* the status change is what counts; the chat copy is a convenience */ }

      return req;
    },
  };

  // ── Messages ────────────────────────────────────────────────────────────────
  // A conversation is simply the pair of people; RLS only ever returns rows the caller is part of.
  const messages = {
    async all() {
      const id = await needUserId();
      const rows = unwrap(await sb.from('messages').select('*')
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .order('created_at', { ascending: true }));
      return (rows || []).map(mapMessage);
    },

    // One row per person you have talked to, newest first, with the other party, the most recent
    // listing discussed, the last message and how many of theirs you have not read.
    async conversations() {
      const me = await needUserId();
      const all = await messages.all();
      if (!all.length) return [];

      const byPerson = new Map();
      all.forEach((m) => {
        const other = m.senderId === me ? m.receiverId : m.senderId;
        if (!byPerson.has(other)) byPerson.set(other, []);
        byPerson.get(other).push(m);
      });

      const people = await profiles.byIds([...byPerson.keys()]);
      const listingIds = [...new Set(all.map((m) => m.listingId).filter(Boolean))];
      const listingRows = listingIds.length
        ? unwrap(await sb.from('properties').select(PROPERTY_SELECT).in('id', listingIds))
        : [];
      const listings = {};
      (listingRows || []).forEach((r) => { listings[r.id] = mapProperty(r); });

      return [...byPerson.entries()].map(([otherId, msgs]) => {
        const last = msgs[msgs.length - 1];
        const lastWithListing = [...msgs].reverse().find((m) => m.listingId);
        return {
          id: otherId,                                  // the conversation is identified by the other person
          otherId,
          other: people[otherId] || null,
          listing: lastWithListing ? listings[lastWithListing.listingId] || null : null,
          messages: msgs,
          lastMessage: last,
          unread: msgs.filter((m) => m.receiverId === me && !m.read).length,
          updatedAt: last.timestamp,
        };
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    async send({ to, body, propertyId, data, status, viewingRequestId }) {
      const me = await needUserId();
      if (!to) throw new Error('No recipient');
      if (to === me) throw new Error('You cannot message yourself');
      const payload = {
        sender_id: me,
        receiver_id: to,
        type: 'text',
        body: body || '',
        property_id: propertyId || null,
      };
      if (data) payload.viewing_data = data;
      if (status) payload.status = status;
      if (viewingRequestId) payload.viewing_request_id = viewingRequestId;
      const row = unwrap(await sb.from('messages').insert(payload).select('*').single());
      return mapMessage(row);
    },

    async updateMessage(messageId, { status, data, body }) {
      const patch = {};
      if (status !== undefined) patch.status = status;
      if (data !== undefined) patch.viewing_data = data;
      if (body !== undefined) patch.body = body;
      const row = unwrap(await sb.from('messages').update(patch).eq('id', messageId).select('*').single());
      return mapMessage(row);
    },

    // Mark everything that person sent me as read.
    async markRead(otherId) {
      const me = await needUserId();
      unwrap(await sb.from('messages').update({ read: true })
        .eq('receiver_id', me).eq('sender_id', otherId).eq('read', false));
    },

    async unreadCount() {
      const me = await userId();
      if (!me) return 0;
      const { count, error } = await sb.from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', me).eq('read', false);
      if (error) throw new Error(error.message);
      return count || 0;
    },
  };

  // ── Reviews ─────────────────────────────────────────────────────────────────
  // Reviews are public: anyone can read them, only the author can write or edit their own.
  const reviews = {
    // Reviews written ABOUT someone, newest first, with the author's public profile attached.
    async about(userId_) {
      if (!userId_) return [];
      const rows = unwrap(await sb.from('reviews').select('*')
        .eq('reviewee_id', userId_).order('created_at', { ascending: false }));
      const list = (rows || []).map(mapReview);
      if (!list.length) return [];

      const people = await profiles.byIds(list.map((r) => r.reviewerId));
      list.forEach((r) => {
        r.reviewer = people[r.reviewerId] || null;
        r.reviewerName = r.reviewer ? r.reviewer.name : 'HomeSure user';
      });
      return list;
    },

    // Reviews somebody wrote.
    async by(userId_) {
      if (!userId_) return [];
      const rows = unwrap(await sb.from('reviews').select('*')
        .eq('reviewer_id', userId_).order('created_at', { ascending: false }));
      return (rows || []).map(mapReview);
    },

    // Average and star breakdown for a profile page.
    summary(list) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      list.forEach((r) => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
      const total = list.length;
      const sum = list.reduce((a, r) => a + r.rating, 0);
      return {
        count: total,
        average: total ? Math.round((sum / total) * 10) / 10 : 0,
        breakdown: counts,
      };
    },

    async create({ type, revieweeId, propertyId, rating, comment }) {
      const me = await needUserId();
      if (!type || !revieweeId) throw new Error('Missing review details');
      if (revieweeId === me) throw new Error('You cannot review yourself');
      const n = Number(rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('Rating must be between 1 and 5');

      const row = unwrap(await sb.from('reviews').insert({
        type, reviewer_id: me, reviewee_id: revieweeId,
        property_id: propertyId || null, rating: n, comment: comment || null,
      }).select('*').single());
      return mapReview(row);
    },
  };

  // ── Payments (read-only for now; creating one needs the provider decision) ──
  // The database says 'paid'; the pages say 'confirmed'. Translate at the boundary so neither side
  // has to know the other's word.
  const PAYMENT_STATUS = { paid: 'confirmed' };

  const PAYMENT_SELECT = '*, properties(title, landowner_id)';

  function mapPayment(r) {
    return {
      id: r.id,
      listingId: r.property_id,
      listingTitle: r.properties ? r.properties.title : '',
      sellerId: r.properties ? r.properties.landowner_id : null,
      buyerId: r.user_id,
      amount: num(r.amount),
      currency: r.currency || 'PHP',
      purpose: r.purpose || null,
      paymentType: r.purpose || r.type || null,   // the pages call it paymentType
      type: r.type || null,
      status: PAYMENT_STATUS[r.status] || r.status,
      period: r.period || '',
      dueDate: r.due_date || null,
      method: r.method || null,
      reference: r.reference || null,
      proofPath: r.proof_url || null,
      rejectionReason: r.rejection_reason || null,
      paidDate: r.paid_at ? String(r.paid_at).slice(0, 10) : null,
      paidAt: r.paid_at,
      confirmedAt: r.confirmed_at || null,
      qrCodeUrl: r.qr_code_url || null,
      createdAt: r.created_at,
    };
  }

  const payments = {
    // The signed-in buyer's own payments, newest first. RLS limits it to theirs.
    async mine() {
      const id = await needUserId();
      const rows = unwrap(await sb.from('payments').select(PAYMENT_SELECT)
        .eq('user_id', id).order('created_at', { ascending: false }));
      return (rows || []).map(mapPayment);
    },

    // Payments on the signed-in seller's own listings. The "Sellers read payments on own
    // properties" policy is what limits this, so no landowner filter is needed to stay safe.
    async forMyListings() {
      const me = await needUserId();
      const rows = unwrap(await sb.from('payments').select(PAYMENT_SELECT)
        .order('created_at', { ascending: false }));
      // A seller can also be a buyer elsewhere; keep only the rows where they are the landlord.
      return (rows || []).map(mapPayment).filter((p) => p.sellerId === me);
    },

    // Buyer names, for the seller's payment list. Contact details are not in the public view.
    async payerNames(list) {
      const people = await profiles.byIds(list.map((p) => p.buyerId));
      list.forEach((p) => {
        p.payer = people[p.buyerId] || null;
        p.tenantName = p.payer ? p.payer.name : 'HomeSure user';
      });
      return list;
    },

    // ── Paying ────────────────────────────────────────────────────────────────
    // Both of these go through the API: there is no INSERT or UPDATE policy on payments for end
    // users, so only the service role may write a row. That is deliberate — it keeps the amount
    // out of the client's hands.

    // Raises a Xendit QRPH charge and returns { payment, qr } with the QR string to display.
    async startQrph({ propertyId, purpose, period, dueDate, depositMonths }) {
      return api('/api/payments/create-invoice', {
        propertyId, purpose: purpose || 'rent', period, dueDate, depositMonths,
      });
    },

    // Records a GCash / bank / cash payment with its proof. Lands on 'pending_confirmation'.
    async submitProof({ paymentId, propertyId, purpose, period, dueDate, depositMonths, method, reference, proofPath }) {
      const { payment } = await api('/api/payments/manual-proof', {
        paymentId, propertyId, purpose, period, dueDate, depositMonths, method, reference, proofPath,
      });
      return mapPayment(payment);
    },

    // Uploads the screenshot and returns its path inside the private payment-proofs bucket.
    async uploadProof(source) {
      return storage.upload('payment-proofs', source, 'proof');
    },

    // A signed link the buyer or the listing's seller can open for an hour.
    async proofUrl(path) {
      if (!path) return null;
      const { data, error } = await sb.storage.from('payment-proofs').createSignedUrl(path, 3600);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    },

    // One row, for polling while a QR charge is open. The webhook is what flips it to 'paid',
    // so the browser has to ask.
    async byId(id) {
      const rows = unwrap(await sb.from('payments').select(PAYMENT_SELECT).eq('id', id));
      return rows && rows[0] ? mapPayment(rows[0]) : null;
    },

    // ── The seller's decision ─────────────────────────────────────────────────
    async confirm(paymentId) {
      const { payment } = await api('/api/payments/confirm', { paymentId, action: 'confirm' });
      return mapPayment(payment);
    },

    async reject(paymentId, reason) {
      const { payment } = await api('/api/payments/confirm', { paymentId, action: 'reject', reason });
      return mapPayment(payment);
    },
  };

  // ── Refunds ─────────────────────────────────────────────────────────────────
  const refunds = {
    async request({ paymentId, propertyId, amount, destinationAccountNo, destinationBankCode, reason }) {
      return api('/api/refunds/request', {
        paymentId, propertyId, amount, destinationAccountNo, destinationBankCode, reason,
      });
    },
    async forPayment(paymentId) {
      const rows = unwrap(await sb.from('refunds').select('*').eq('payment_id', paymentId).order('created_at', { ascending: false }));
      return rows || [];
    },
    async mine() {
      const id = await needUserId();
      const rows = unwrap(await sb.from('refunds').select('*, payments(*, properties(title, landowner_id))').eq('requested_by', id).order('created_at', { ascending: false }));
      return rows || [];
    },
  };

  // ── Security deposits ───────────────────────────────────────────────────────
  // Unlike payments, this table has RLS the client can use directly: both sides read the row and
  // only the seller writes it, so the browser can talk to it without an API route.
  const deposits = {
    async list() {
      const rows = unwrap(await sb.from('security_deposits')
        .select('*, properties(title, landowner_id)')
        .order('created_at', { ascending: false }));
      return (rows || []).map((r) => {
        const deductions = Array.isArray(r.deductions) ? r.deductions : [];
        const deducted = deductions.reduce((s, d) => s + num(d.cost), 0);
        return {
          id: r.id,
          listingId: r.property_id,
          listingTitle: r.properties ? r.properties.title : '',
          buyerId: r.buyer_id,
          sellerId: r.seller_id,
          amount: num(r.amount),
          status: r.status,
          deductions: deductions.map((d) => ({ reason: d.reason || '', cost: num(d.cost), date: d.date || null })),
          totalDeductions: deducted,
          refundable: Math.max(0, num(r.amount) - deducted),
          createdAt: r.created_at,
        };
      });
    },

    // Seller-side: the names of the tenants whose deposits these are.
    async tenantNames(list) {
      const people = await profiles.byIds(list.map((d) => d.buyerId));
      list.forEach((d) => {
        d.tenant = people[d.buyerId] || null;
        d.tenantName = d.tenant ? d.tenant.name : 'HomeSure user';
      });
      return list;
    },

    // The trigger fills seller_id from the listing, so a seller cannot record a deposit on
    // somebody else's property.
    async open(propertyId, buyerId, amount) {
      const rows = unwrap(await sb.from('security_deposits')
        .insert({ property_id: propertyId, buyer_id: buyerId, amount })
        .select('id'));
      return rows && rows[0] ? rows[0].id : null;
    },

    // Appends one damage deduction. Read-then-write, because the whole jsonb array is replaced.
    async addDeduction(id, { reason, cost, date }) {
      const rows = unwrap(await sb.from('security_deposits').select('amount, deductions').eq('id', id));
      const row = rows && rows[0];
      if (!row) throw new Error('That deposit no longer exists.');
      const current = Array.isArray(row.deductions) ? row.deductions : [];
      const entry = { reason, cost: num(cost), date: date || new Date().toISOString().slice(0, 10) };
      const total = current.reduce((s, d) => s + num(d.cost), 0) + entry.cost;
      if (total > num(row.amount)) {
        throw new Error('The deductions would come to more than the deposit itself.');
      }
      unwrap(await sb.from('security_deposits')
        .update({ deductions: current.concat([entry]) }).eq('id', id));
    },

    // 'held' | 'partially_refunded' | 'refunded' | 'forfeited'
    async setStatus(id, status) {
      unwrap(await sb.from('security_deposits').update({ status }).eq('id', id));
    },
  };

  // ── Public figures for the landing page ─────────────────────────────────────
  // Counted, not typed in. Anyone can run these without signing in: approved listings are public
  // by policy, and public_profiles exposes role and account_status to anon by design.
  //
  // head: true asks for the count without the rows, so this is three small queries rather than
  // three downloads of the tables.
  async function publicStats() {
    const count = async (table, build) => {
      const query = build(sb.from(table).select('*', { count: 'exact', head: true }));
      const { count: n, error } = await query;
      if (error) throw new Error(error.message);
      return n || 0;
    };

    const [listings, sellers, barangayList] = await Promise.all([
      count('properties', (q) => q.eq('status', 'approved')),
      count('public_profiles', (q) => q.eq('role', 'seller').eq('account_status', 'verified')),
      barangays().catch(() => []),
    ]);

    return {
      listings,
      verifiedSellers: sellers,
      // The barangay table is the authority. Sta. Maria has 24, but reading it means the figure
      // stays right if that ever changes.
      barangays: barangayList.length || 24,
    };
  }

  // How many live listings sit in each barangay, keyed by barangay name.
  //
  // The landing page map links each barangay through to browse.html?barangay=<name>, so these
  // counts have to agree with what browse will actually show — otherwise the map promises twelve
  // listings and the page delivers none. That means the same two filters browse applies:
  // status approved, and not already sold or rented.
  //
  // lifecycle_status is filtered here rather than in the query because it is null on older rows,
  // and `NOT IN ('sold','rented')` is null — not true — for those, which would drop them.
  async function listingCountsByBarangay() {
    const rows = unwrap(await sb.from('properties')
      .select('lifecycle_status, barangays(name)')
      .eq('status', 'approved')
      .limit(LIST_CAP));

    const counts = {};
    for (const r of rows || []) {
      if (r.lifecycle_status === 'sold' || r.lifecycle_status === 'rented') continue;
      const name = r.barangays && r.barangays.name;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  }

  // Same shape as listingCountsByBarangay, grouped by property_type instead. The landing page's
  // "Browse by Type" cards used to show fixed numbers (342, 218, 97) that were never real — this is
  // what replaced them. property_type is one of 'house' | 'apartment' | 'condo' | 'commercial' |
  // 'lot' (the CHECK constraint in 006_frontend_alignment.sql); there is no 'townhouse' in the
  // schema, so a page that wants that exact label has to fold it into one of these.
  async function listingCountsByType() {
    const rows = unwrap(await sb.from('properties')
      .select('property_type, lifecycle_status')
      .eq('status', 'approved')
      .limit(LIST_CAP));

    const counts = {};
    for (const r of rows || []) {
      if (r.lifecycle_status === 'sold' || r.lifecycle_status === 'rented') continue;
      const type = r.property_type;
      if (!type) continue;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }

  // Listings for the landing page — the "Featured Properties" carousel, the hero bento grid, and
  // the hero's orbiting cards all used to show their own hardcoded placeholder arrays, none of them
  // real. One query now backs all three; each reads the subset of these fields it needs.
  //
  // Newest first; `featured = true` goes first among them, but nothing is ever hidden just for
  // lacking that flag — an empty carousel from a strict filter would be worse than one with
  // un-flagged listings.
  async function featuredListings(limit = 8) {
    const rows = unwrap(await sb.from('properties')
      .select('id, title, price, listing_type, bedrooms, bathrooms, images, thumbnail_url, verification_state, lifecycle_status, created_at, barangays(name), city')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(LIST_CAP));

    const live = (rows || []).filter((r) => r.lifecycle_status !== 'sold' && r.lifecycle_status !== 'rented');
    const NEW_WITHIN_DAYS = 14;
    const now = Date.now();

    return live.slice(0, limit).map((r) => {
      const price = num(r.price) || 0;
      const barangay = (r.barangays && r.barangays.name) || '';
      const isNew = r.created_at && (now - new Date(r.created_at).getTime()) < NEW_WITHIN_DAYS * 86400000;
      const badgeType = isNew ? 'new' : r.listing_type === 'rent' ? 'rent' : 'sale';
      const badge = isNew ? 'New' : r.listing_type === 'rent' ? 'For Rent' : 'For Sale';
      return {
        id: r.id,
        title: r.title,
        name: r.title,  // same value, different callers (carousel vs. bento tiles) expect different keys
        location: [barangay, r.city || 'Sta. Maria'].filter(Boolean).join(', '),
        barangay,
        // Kept apart rather than baked into one string: the carousel renders price and period as
        // two separate elements, so concatenating here would double up for whichever caller adds
        // its own suffix.
        price: '₱' + price.toLocaleString('en-PH'),
        period: r.listing_type === 'rent' ? '/month' : '',
        beds: r.bedrooms ?? 0,
        baths: r.bathrooms ?? 0,
        badge, badgeType,
        verified: r.verification_state === 'verified',
        image: r.thumbnail_url || (Array.isArray(r.images) && r.images[0]) || PLACEHOLDER_IMG,
      };
    });
  }

  // A single real photo for the sign-in/sign-up pages' background — those used to hardcode one
  // stock photo (house_image.jpg), the same image regardless of what is actually listed. Picks
  // randomly among a handful of recent approved listings that actually have a photo, so a reload
  // does not always show the same one, and a listing with no image never gets chosen. Returns null
  // if nothing qualifies — the page keeps its gradient background in that case.
  async function randomListingPhoto() {
    const rows = unwrap(await sb.from('properties')
      .select('images, thumbnail_url')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20));

    const photos = (rows || [])
      .map((r) => r.thumbnail_url || (Array.isArray(r.images) && r.images[0]))
      .filter(Boolean);
    if (!photos.length) return null;
    return photos[Math.floor(Math.random() * photos.length)];
  }

  // ── Tenants ─────────────────────────────────────────────────────────────────
  // Not a table. A tenant is a conclusion drawn from the rows that already exist: somebody with a
  // confirmed payment or a security deposit on one of your listings. Messaging you or asking for a
  // viewing does not make someone a tenant — money does.
  const tenants = {
    async mine() {
      const me = await needUserId();

      // One failure must not empty the whole page, so each source is asked for separately and a
      // tenant is still listed if only one of the two answered.
      const [paid, held] = await Promise.all([
        payments.forMyListings().catch((err) => { console.error('Payments:', err); return []; }),
        deposits.list().catch((err) => { console.error('Deposits:', err); return []; }),
      ]);

      const myDeposits = held.filter((d) => d.sellerId === me);
      const byPerson = new Map();

      const entry = (buyerId, listingId, listingTitle) => {
        if (!byPerson.has(buyerId)) {
          byPerson.set(buyerId, {
            id: buyerId,
            listingId,
            listingTitle,
            payments: [],
            deposit: null,
            totalPaid: 0,
            nextDue: null,
            awaitingConfirmation: 0,
          });
        }
        return byPerson.get(buyerId);
      };

      paid.forEach((p) => {
        // A pending payment on its own does not make a tenant — anyone could have an invoice
        // raised. Only money that arrived, or proof waiting to be checked, counts.
        if (p.status !== 'confirmed' && p.status !== 'pending_confirmation') return;
        const t = entry(p.buyerId, p.listingId, p.listingTitle);
        t.payments.push(p);
        if (p.status === 'confirmed') t.totalPaid += Number(p.amount || 0);
        if (p.status === 'pending_confirmation') t.awaitingConfirmation += 1;
      });

      myDeposits.forEach((d) => {
        const t = entry(d.buyerId, d.listingId, d.listingTitle);
        t.deposit = d;
      });

      const list = [...byPerson.values()];
      if (!list.length) return [];

      // What is still owed, from the payments already loaded. No extra request.
      const today = new Date().toISOString().slice(0, 10);
      const open = paid.filter((p) => p.status === 'pending' || p.status === 'rejected');
      open.forEach((p) => {
        const t = byPerson.get(p.buyerId);
        if (!t) return;                       // owes money but was never a tenant
        if (!t.nextDue || String(p.dueDate || '9999') < String(t.nextDue.dueDate || '9999')) {
          t.nextDue = { amount: Number(p.amount || 0), dueDate: p.dueDate, period: p.period,
                        overdue: !!p.dueDate && p.dueDate < today };
        }
      });

      // Names come from the public view, so no contact details are exposed here.
      const people = await profiles.byIds(list.map((t) => t.id));
      list.forEach((t) => {
        const person = people[t.id] || null;
        t.name = person ? person.name : 'HomeSure user';
        t.avatar = person ? person.avatar : null;
        t.since = t.payments.reduce((earliest, p) => {
          const at = p.paidAt || p.createdAt;
          return !earliest || (at && at < earliest) ? at : earliest;
        }, null);
      });

      list.sort((a, b) => a.name.localeCompare(b.name));
      return list;
    },
  };

  // ── Listing reports ─────────────────────────────────────────────────────────
  const reports = {
    async file(propertyId, category, reason) {
      const me = await needUserId();
      unwrap(await sb.from('listing_reports').insert({
        property_id: propertyId, reported_by: me, category, reason: reason || category,
      }));
    },

    // Admins see every report; everyone else only their own (RLS decides, not this code).
    async list() {
      const rows = unwrap(await sb.from('listing_reports')
        .select('*, properties(id, title, landowner_id)')
        .order('created_at', { ascending: false }));
      const list = (rows || []).map((r) => ({
        id: r.id,
        listingId: r.property_id,
        listingTitle: r.properties ? r.properties.title : '',
        sellerId: r.properties ? r.properties.landowner_id : null,
        reportedBy: r.reported_by,
        category: r.category,
        reason: r.reason,
        status: r.status,
        actionTaken: r.action_taken || null,
        adminNotes: r.admin_notes || null,
        resolvedBy: r.resolved_by || null,
        resolvedAt: r.resolved_at || null,
        reportedAt: r.created_at,
      }));
      if (!list.length) return [];

      // Reporter and seller names come from the public view (no contact details).
      const people = await profiles.byIds(list.flatMap((r) => [r.reportedBy, r.sellerId]));
      list.forEach((r) => {
        r.reporter = people[r.reportedBy] || null;
        r.reporterName = r.reporter ? r.reporter.name : 'HomeSure user';
        r.seller = people[r.sellerId] || null;
        r.sellerName = r.seller ? r.seller.name : '';
      });
      return list;
    },

    // status: 'under_review' | 'resolved' | 'dismissed'
    async resolve(id, { status, actionTaken, adminNotes }) {
      const me = await needUserId();
      const patch = { status };
      if (actionTaken !== undefined) patch.action_taken = actionTaken || null;
      if (adminNotes !== undefined) patch.admin_notes = adminNotes || null;
      if (status === 'resolved' || status === 'dismissed') {
        patch.resolved_by = me;
        patch.resolved_at = new Date().toISOString();
      }
      unwrap(await sb.from('listing_reports').update(patch).eq('id', id));
    },
  };

  // ── Admin: users ────────────────────────────────────────────────────────────
  const admin = {
    async users() {
      const rows = unwrap(await sb.from('profiles').select('*').order('created_at', { ascending: false }));
      return (rows || []).map(mapProfile);
    },

    async user(id) {
      return mapProfile(unwrap(await sb.from('profiles').select('*').eq('id', id).maybeSingle()));
    },

    // Listings that have a confirmed payment (admins see every payment).
    async paidPropertyIds() {
      const rows = unwrap(await sb.from('payments').select('property_id').eq('status', 'paid'));   // payments.user_id is the payer
      return new Set((rows || []).map((r) => r.property_id));
    },

    // Approve a user's verification. Sellers are verified for 12 months, buyers for 6.
    // A renewal's new documents replace the old ones.
    async approveVerification(userId_) {
      const u = await admin.user(userId_);
      if (!u) throw new Error('User not found');
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + (u.role === 'seller' ? 12 : 6));
      const patch = {
        account_status: 'verified',
        verified_at: new Date().toISOString(),
        verification_expiry: expiry.toISOString().slice(0, 10),
        verification_reject_reason: null,
      };
      if (u.newVerificationDocs && u.newVerificationDocs.length) {
        patch.verification_docs = u.newVerificationDocs;
        patch.new_verification_docs = [];
        patch.new_submitted_verification_at = null;
      }
      unwrap(await sb.from('profiles').update(patch).eq('id', userId_));
    },

    async rejectVerification(userId_, reason) {
      unwrap(await sb.from('profiles').update({
        account_status: 'unverified',
        verified_at: null,
        verification_expiry: null,
        verification_reject_reason: reason || null,
        new_verification_docs: [],
        new_submitted_verification_at: null,
      }).eq('id', userId_));
    },

    // Admin and super-admin accounts, for the super admin's "Admin Management" page.
    async admins() {
      const rows = unwrap(await sb.from('profiles').select('*')
        .in('role', ['admin', 'superadmin', 'super_duper_admin']).order('created_at', { ascending: false }));
      return (rows || []).map(mapProfile).map((p) => ({
        ...p,
        status: p.suspendedAt ? 'suspended' : 'active',
        addedAt: p.joinedAt,
        addedBy: '',          // the database does not record who created an account
      }));
    },

    async savedCount(userId_) {
      const { count, error } = await sb.from('saved_properties').select('property_id', { count: 'exact', head: true }).eq('user_id', userId_);
      if (error) throw new Error(error.message);
      return count || 0;
    },

    async openReportsCount() {
      const { count, error } = await sb.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      if (error) throw new Error(error.message);
      return count || 0;
    },
  };

  // ── Audit trail (admin actions) ────────────────────────────────────────────
  const audit = {
    // Only super admins can read the trail; for anyone else RLS returns nothing.
    async list(limit) {
      const rows = unwrap(await sb.from('audit_logs').select('*')
        .order('created_at', { ascending: false }).limit(limit || 200));
      return (rows || []).map((r) => ({
        id: r.id,
        actor: r.actor_name || 'Unknown',
        actorId: r.actor_id,
        actorRole: r.actor_role || '',
        action: r.action,
        type: r.type,
        status: r.status,
        details: r.details || '',
        target: r.details || '',     // the page labels this column "target"
        ipAddress: r.ip_address || '',
        timestamp: r.created_at,
      }));
    },

    // Best effort: never blocks the action it describes.
    async log(action, type, details, status) {
      try {
        const me = getSession();
        if (!me) return;
        await sb.from('audit_logs').insert({
          actor_id: me.id,
          actor_name: ((me.firstName || '') + ' ' + (me.lastName || '')).trim(),
          actor_role: me.role,
          action, type: type || 'system', details: details || null, status: status || 'success',
        });
      } catch (e) { /* ignore */ }
    },
  };

  // ── Static reference data ──────────────────────────────────────────────────
  // The barangays table is the source of truth (properties.barangay_id points at it).
  let barangayCache = null;
  async function barangayRows() {
    if (!barangayCache) {
      const rows = unwrap(await sb.from('barangays').select('id, name').order('name'));
      barangayCache = rows || [];
    }
    return barangayCache;
  }

  async function barangays() {
    return (await barangayRows()).map((b) => b.name);
  }

  async function barangayId(name) {
    if (!name) return null;
    const hit = (await barangayRows()).find((b) => b.name.toLowerCase() === String(name).toLowerCase());
    return hit ? hit.id : null;
  }

  return {
    PLACEHOLDER_IMG, cover, mapProfile, mapProperty, userId,
    auth, profiles, listings, favorites, storage, verification, viewing, messages, reviews, payments,
    refunds, deposits, tenants, reports, admin, audit, barangays, barangayId,
    publicStats, listingCountsByBarangay, listingCountsByType, featuredListings, randomListingPhoto,
  };
})();
