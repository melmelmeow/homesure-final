// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Fake / Sample Data  (Front-End Development Only)
//  Replace this file with real API calls once the back-end is ready.
// ─────────────────────────────────────────────────────────────────────────────

// ── Fake Accounts ─────────────────────────────────────────────────────────────
const FAKE_USERS = [
  {
    id: 'usr-001', role: 'buyer',
    firstName: 'Maria', lastName: 'Santos',
    email: 'buyer@homesure.com', password: 'buyer1234',
    phone: '09171234567', avatar: null, verified: true,
    isVerified: true, verifiedAt: '2025-11-20', verificationExpiry: '2027-05-20',
    phoneVerified: true,
    savedListings: ['prop-002', 'prop-004', 'prop-006', 'prop-007', 'prop-009'], joinedAt: '2025-11-10',
  },
  {
    id: 'usr-002', role: 'buyer',
    firstName: 'Jose', lastName: 'Reyes',
    email: 'jose.reyes@gmail.com', password: 'buyer1234',
    phone: '09281234567', avatar: null, verified: true,
    isVerified: true, verifiedAt: '2026-01-20', verificationExpiry: '2027-01-20',
    phoneVerified: true,
    savedListings: ['prop-001'], joinedAt: '2026-01-05',
  },
  {
    id: 'usr-003', role: 'seller',
    firstName: 'Ramon', lastName: 'Cruz',
    email: 'seller@homesure.com', password: 'seller1234',
    phone: '09191234567', avatar: null, verified: true,
    accountStatus: 'verified', listings: ['prop-001', 'prop-002', 'prop-003', 'prop-006', 'prop-007', 'prop-008', 'prop-014', 'prop-015'],
    joinedAt: '2025-10-01',
    verifiedAt: '2025-10-15', verificationExpiry: '2027-06-16',
    verificationDocs: [
      { label: 'Valid Government ID',           url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
      { label: 'Transfer Certificate of Title', url: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=600' },
      { label: 'Tax Declaration',               url: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600' },
    ],
    submittedVerificationAt: '2025-10-10',
    moaSignedAt: '2025-10-12',
  },
  {
    id: 'usr-004', role: 'seller',
    firstName: 'Lourdes', lastName: 'Navarro',
    email: 'lourdes.navarro@gmail.com', password: 'seller1234',
    phone: '09271234567', avatar: null, verified: true,
    accountStatus: 'verified', listings: ['prop-004', 'prop-005', 'prop-009', 'prop-010', 'prop-011', 'prop-012', 'prop-013'],
    joinedAt: '2026-02-14',
    verifiedAt: '2026-03-01', verificationExpiry: '2027-03-01',
    verificationDocs: [
      { label: 'Valid Government ID',           url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
      { label: 'Transfer Certificate of Title', url: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=600' },
      { label: 'Tax Declaration',               url: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600' },
    ],
    submittedVerificationAt: '2026-02-20',
    moaSignedAt: '2026-02-28',
  },
  {
    id: 'usr-007', role: 'seller',
    firstName: 'Ana', lastName: 'Reyes',
    email: 'seller2@homesure.com', password: 'seller1234',
    phone: '09561234567', avatar: null, verified: true,
    accountStatus: 'verified', listings: [],
    joinedAt: '2026-03-20',
    verifiedAt: '2026-04-05', verificationExpiry: '2027-04-05',
    verificationDocs: [
      { label: 'Valid Government ID',           url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
      { label: 'Transfer Certificate of Title', url: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=600' },
      { label: 'Tax Declaration',               url: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600' },
    ],
    submittedVerificationAt: '2026-03-28',
    moaSignedAt: '2026-04-02',
  },
  {
    id: 'usr-005', role: 'admin',
    firstName: 'Andrea', lastName: 'Villanueva',
    email: 'admin@homesure.com', password: 'admin1234',
    phone: '09301234567', avatar: null, verified: true, joinedAt: '2025-08-15',
  },
  {
    id: 'usr-006', role: 'superadmin',
    firstName: 'Ricardo', lastName: 'Dela Cruz',
    email: 'superadmin@homesure.com', password: 'superadmin1234',
    phone: '09091234567', avatar: null, verified: true, joinedAt: '2025-07-01',
  },
];

// ── Sample Property Listings ──────────────────────────────────────────────────
const FAKE_LISTINGS = [
  // ── Approved (visible to buyers) ────────────────────────────────────────────
  {
    id: 'prop-001', sellerId: 'usr-003',
    type: 'house', listingFor: 'sale',
    title: '3-Bedroom House for Sale in Pulong Buhangin',
    description: 'Spacious single-detached house in a quiet residential neighborhood. Features 3 bedrooms, 2 bathrooms, a carport, and a small garden. Just 5 minutes from Sta. Maria public market.',
    price: 4500000, barangay: 'Pulong Buhangin',
    address: 'Blk 7 Lot 12, Pulong Buhangin, Sta. Maria, Bulacan',
    lat: 14.8167, lng: 121.0333,
    bedrooms: 3, bathrooms: 2, floorArea: 120, lotArea: 200,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
    amenities: ['Carport', 'Garden', 'Water Meter', 'Meralco'], postedAt: '2026-02-01', featured: true,
  },
  {
    id: 'prop-002', sellerId: 'usr-003',
    type: 'apartment', listingFor: 'rent',
    title: '1-Bedroom Apartment for Rent near Town Proper',
    description: 'Fully-furnished apartment on the 2nd floor. Includes aircon, ref, and laundry area access. Walking distance to jeepney terminal. Building has 8 similar units available.',
    price: 8000, barangay: 'Poblacion',
    address: '123 Maharlika Rd, Poblacion, Sta. Maria, Bulacan',
    lat: 14.8100, lng: 121.0167,
    bedrooms: 1, bathrooms: 1, floorArea: 35, lotArea: null,
    status: 'approved', verified: true, negotiable: false,
    lifecycleStatus: 'rented',
    hasMultipleUnits: true, totalUnits: 8, availableUnits: 3,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    amenities: ['Aircon', 'Ref', 'WiFi-ready', 'Security'], postedAt: '2026-02-10', featured: true,
  },
  {
    id: 'prop-003', sellerId: 'usr-003',
    type: 'house', listingFor: 'sale',
    title: '4-Bedroom House & Lot in San Jose Patag',
    description: 'Corner lot property in a gated village. Two-storey house with 4 bedrooms, 3 bathrooms, service area, and a 2-car garage.',
    price: 7800000, barangay: 'San Jose Patag',
    address: 'Blk 2 Lot 5, Villa Magsaysay, San Jose Patag, Sta. Maria, Bulacan',
    bedrooms: 4, bathrooms: 3, floorArea: 180, lotArea: 300,
    status: 'approved', verified: true, negotiable: false,
    lifecycleStatus: 'sold',
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800'],
    amenities: ['2-Car Garage', 'Gated Village', 'Service Area', 'Balcony'], postedAt: '2026-01-28', featured: false,
  },
  {
    id: 'prop-006', sellerId: 'usr-003',
    type: 'apartment', listingFor: 'rent',
    title: 'Studio Apartment in Tungkong Mangga',
    description: 'Modern studio apartment inside a well-maintained complex. Air conditioned, with built-in cabinets and a private balcony overlooking the garden.',
    price: 26000, barangay: 'Tungkong Mangga',
    address: '14 Camella Residences, Tungkong Mangga, Sta. Maria, Bulacan',
    bedrooms: 0, bathrooms: 1, floorArea: 38, lotArea: null,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    amenities: ['Aircon', 'Balcony', 'WiFi-ready', 'Security'], postedAt: '2026-01-15', featured: true,
  },
  {
    id: 'prop-007', sellerId: 'usr-003',
    type: 'house', listingFor: 'rent',
    title: 'House for Rent near Highway',
    description: 'Bright and airy 3-bedroom house located along the main highway. Easy access to buses and public transport. Good for families.',
    price: 18000, barangay: 'Bagbaguin',
    address: '78 MacArthur Highway, Bagbaguin, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 2, floorArea: 110, lotArea: 180,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    amenities: ['Carport', 'Garden', 'Meralco'], postedAt: '2026-02-05', featured: false,
  },
  {
    id: 'prop-008', sellerId: 'usr-003',
    type: 'house', listingFor: 'sale',
    title: 'Beautiful House for Sale',
    description: 'Elegant 3-bedroom house with modern finishes. Granite countertops, tiled flooring, and a covered patio. Subdivision with 24/7 security.',
    price: 3500000, barangay: 'Lalakhan',
    address: 'Blk 3 Lot 8, Spring Ville, Lalakhan, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 2, floorArea: 100, lotArea: 160,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'],
    amenities: ['Patio', '24hr Security', 'Water Meter'], postedAt: '2026-01-20', featured: true,
  },
  {
    id: 'prop-009', sellerId: 'usr-004',
    type: 'house', listingFor: 'sale',
    title: 'Modern House for Sale in San Jose Patag',
    description: 'Contemporary designed two-storey house. Open floor plan living area, 3 bedrooms, and a spacious master bedroom with walk-in closet.',
    price: 2800000, barangay: 'San Jose Patag',
    address: 'Phase 2, Blk 5 Lot 3, San Jose Patag, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 2, floorArea: 130, lotArea: 200,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800'],
    amenities: ['Walk-in Closet', 'Carport', 'Meralco'], postedAt: '2026-02-18', featured: false,
  },
  {
    id: 'prop-010', sellerId: 'usr-004',
    type: 'apartment', listingFor: 'rent',
    title: 'Modern 2BR Apartment in Manggahan',
    description: '2-bedroom apartment on the 3rd floor of a newly built residential building. Kitchen with gas range, living area with ceiling fan.',
    price: 12000, barangay: 'Manggahan',
    address: '56 Tulip St, Manggahan, Sta. Maria, Bulacan',
    bedrooms: 2, bathrooms: 1, floorArea: 55, lotArea: null,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'],
    amenities: ['Gas Range', 'Ceiling Fan', 'Meralco'], postedAt: '2026-02-12', featured: false,
  },
  {
    id: 'prop-011', sellerId: 'usr-004',
    type: 'house', listingFor: 'rent',
    title: 'Family House with Garden',
    description: 'Charming 3-bedroom family house with a large garden perfect for children. Quiet dead-end street. Near Balasing Elementary School.',
    price: 22000, barangay: 'Balasing',
    address: '9 Rosal Street, Balasing, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 2, floorArea: 140, lotArea: 300,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
    amenities: ['Large Garden', 'Carport', 'Near School'], postedAt: '2026-01-10', featured: false,
  },
  {
    id: 'prop-012', sellerId: 'usr-004',
    type: 'house', listingFor: 'rent',
    title: 'Spacious Family Home in San Jose Patag',
    description: 'Large 3-bedroom family home in a peaceful subdivision. Has a big living room, covered garage, and a backyard. Ideal for families.',
    price: 20000, barangay: 'San Jose Patag',
    address: 'Blk 11 Lot 2, Green Meadows, San Jose Patag, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 2, floorArea: 150, lotArea: 260,
    status: 'approved', verified: true, negotiable: true,
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'],
    amenities: ['Covered Garage', 'Backyard', 'Meralco'], postedAt: '2026-03-01', featured: false,
  },
  {
    id: 'prop-013', sellerId: 'usr-004',
    type: 'apartment', listingFor: 'rent',
    title: 'Modern Loft Apartment in Pulong Buhangin',
    description: 'Stylish loft-style apartment with high ceilings and an open layout. Polished concrete floors, minimalist design. 2 bedrooms on the upper floor.',
    price: 11000, barangay: 'Pulong Buhangin',
    address: '32 Rivera Bldg, Pulong Buhangin, Sta. Maria, Bulacan',
    bedrooms: 2, bathrooms: 1, floorArea: 65, lotArea: null,
    status: 'approved', verified: true, negotiable: true,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    amenities: ['High Ceiling', 'Minimalist', 'Meralco'], postedAt: '2026-02-25', featured: false,
  },
  {
    id: 'prop-014', sellerId: 'usr-004',
    type: 'apartment', listingFor: 'rent',
    title: 'Cozy Studio Apartment in Catanghalan',
    description: 'Compact and well-maintained studio unit. Clean shared bathroom. Ideal for students or working individuals. Near the highway.',
    price: 8000, barangay: 'Catanghalan',
    address: '21 Catanghalan Road, Catanghalan, Sta. Maria, Bulacan',
    bedrooms: 0, bathrooms: 1, floorArea: 22, lotArea: null,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    amenities: ['Near Highway', 'Meralco'], postedAt: '2026-03-05', featured: false,
  },
  {
    id: 'prop-015', sellerId: 'usr-004',
    type: 'apartment', listingFor: 'rent',
    title: 'Affordable 3BR Apartment in Santa Clara',
    description: '3-bedroom apartment unit perfect for small families. Quiet building with security guard on duty. Near public market and schools.',
    price: 9000, barangay: 'Santa Clara',
    address: '88 Rizal Street, Santa Clara, Sta. Maria, Bulacan',
    bedrooms: 3, bathrooms: 1, floorArea: 70, lotArea: null,
    status: 'approved', verified: true, negotiable: false,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    amenities: ['Security', 'Near Market', 'Near School'], postedAt: '2026-03-10', featured: false,
  },

  // ── Draft (saved by seller, not yet submitted) ───────────────────────────────
  {
    id: 'prop-014', sellerId: 'usr-003',
    type: 'house', listingFor: 'sale',
    title: '4-Bedroom House with Garage in Tumana',
    description: 'Spacious 4-bedroom single detached house with a covered garage, wide living room, and tiled kitchen. Located in a quiet subdivision near the highway.',
    price: 4200000, barangay: 'Tumana',
    address: '22 Kamagong St, Tumana, Sta. Maria, Bulacan',
    bedrooms: 4, bathrooms: 2, floorArea: 180, lotArea: 220,
    status: 'draft', verified: false, negotiable: true,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
    documents: [], amenities: ['Garage', 'Perimeter Fence'], postedAt: '2026-04-15', featured: false,
  },
  {
    id: 'prop-015', sellerId: 'usr-003',
    type: 'apartment', listingFor: 'rent',
    title: '1-Bedroom Apartment for Rent in Bagbaguin',
    description: 'Fully furnished 1-bedroom apartment with air conditioning, private bathroom, and kitchen area. Ideal for young professionals.',
    price: 8500, barangay: 'Bagbaguin',
    address: '10 Sampaguita Ave, Bagbaguin, Sta. Maria, Bulacan',
    bedrooms: 1, bathrooms: 1, floorArea: 35, lotArea: null,
    status: 'draft', verified: false, negotiable: false,
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    documents: [], amenities: ['Furnished', 'Air Conditioning'], postedAt: '2026-04-17', featured: false,
  },

  // ── Pending / Rejected (submitted for admin review) ───────────────────────────
  {
    id: 'prop-004', sellerId: 'usr-004',
    type: 'apartment', listingFor: 'rent',
    title: 'Studio-Type Apartment in Balasing',
    description: 'Newly-renovated studio apartment perfect for single individuals or couples.',
    price: 5500, barangay: 'Balasing',
    address: '456 Sampaguita St, Balasing, Sta. Maria, Bulacan',
    bedrooms: 0, bathrooms: 1, floorArea: 22, lotArea: null,
    status: 'pending', verified: false, negotiable: false,
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    documents: [
      { label: 'Valid Government ID',           url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
      { label: 'Transfer Certificate of Title', url: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=600' },
      { label: 'Tax Declaration',               url: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600' },
    ],
    amenities: ['Water Included', 'Newly Renovated'], postedAt: '2026-03-01', featured: false,
  },
  {
    id: 'prop-005', sellerId: 'usr-004',
    type: 'house', listingFor: 'rent',
    title: '2-Bedroom Bungalow for Rent in Catanghalan',
    description: 'Single-storey bungalow with spacious living room, 2 bedrooms, and a front yard.',
    price: 12000, barangay: 'Catanghalan',
    address: '789 Rizal Ave, Catanghalan, Sta. Maria, Bulacan',
    bedrooms: 2, bathrooms: 1, floorArea: 80, lotArea: 150,
    status: 'rejected', verified: false, negotiable: false,
    rejectionReason: 'Incomplete property documents',
    rejectionNotes: 'The uploaded Transfer Certificate of Title (TCT) is not clear. Please upload a high-quality scan or photo showing all property details, boundaries, and the owner\'s name clearly. Also ensure the document is complete (all pages included).',
    images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
    documents: [
      { label: 'Valid Government ID', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
    ],
    amenities: ['Front Yard', '24-hr Water'], postedAt: '2026-02-20', featured: false,
  },
];

// ── Reported Listings ─────────────────────────────────────────────────────────
const FAKE_REPORTS = [
  {
    id: 'rep-001', listingId: 'prop-004', reportedBy: 'usr-001',
    reason: 'Suspicious listing – price seems too low and photos look copied.',
    category: 'suspicious', status: 'pending', reportedAt: '2026-03-10',
  },
  {
    id: 'rep-002', listingId: 'prop-013', reportedBy: 'usr-002',
    reason: 'Photos are taken from another listing. This property does not exist.',
    category: 'fake', status: 'pending', reportedAt: '2026-04-01',
  },
  {
    id: 'rep-003', listingId: 'prop-005', reportedBy: 'usr-001',
    reason: 'Seller is asking for payments outside of the platform.',
    category: 'scam', status: 'resolved', reportedAt: '2026-02-25', resolvedAt: '2026-03-01',
  },
  {
    id: 'rep-004', listingId: 'prop-011', reportedBy: 'usr-002',
    reason: 'Listed price does not match what the seller is actually asking.',
    category: 'misleading', status: 'dismissed', reportedAt: '2026-03-20', resolvedAt: '2026-03-22',
  },
  {
    id: 'rep-005', listingId: 'prop-006', reportedBy: 'usr-001',
    reason: 'This listing appears to be a duplicate of another property already posted.',
    category: 'duplicate', status: 'pending', reportedAt: '2026-04-05',
  },
];

// ── System Activity Logs (Super Admin) ───────────────────────────────────────
const FAKE_ACTIVITY_LOGS = [
  { id: 'log-001', action: 'Listing approved',    detail: 'prop-001 approved by Andrea Villanueva', timestamp: '2026-02-02 09:14' },
  { id: 'log-002', action: 'New user registered', detail: 'Jose Reyes (buyer) created an account',  timestamp: '2026-01-05 14:30' },
  { id: 'log-003', action: 'Listing rejected',    detail: 'prop-005 rejected – incomplete documents', timestamp: '2026-02-21 11:00' },
  { id: 'log-004', action: 'Listing reported',    detail: 'prop-004 reported by Maria Santos',      timestamp: '2026-03-10 16:45' },
  { id: 'log-005', action: 'Admin added',         detail: 'Andrea Villanueva added as Admin',       timestamp: '2025-08-15 08:00' },
];

// ── Audit Trail (Super Admin) ─────────────────────────────────────────────────
const FAKE_AUDIT_TRAIL = [
  { id: 'aud-001', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Approved listing',       ipAddress: '192.168.1.12',  status: 'success', details: '3-Bedroom House for Sale in Pulong Buhangin',          type: 'listing',  timestamp: '2026-04-06 09:14' },
  { id: 'aud-002', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Rejected listing',       ipAddress: '192.168.1.12',  status: 'success', details: 'Studio-Type Apartment in Balasing – incomplete docs',     type: 'listing',  timestamp: '2026-04-05 11:32' },
  { id: 'aud-003', actor: 'Ricardo Dela Cruz', actorRole: 'superadmin', action: 'Added admin account',    ipAddress: '10.0.0.1',      status: 'success', details: 'Andrea Villanueva (admin@homesure.com)',             type: 'admin',    timestamp: '2026-04-05 08:00' },
  { id: 'aud-004', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Resolved report',        ipAddress: '192.168.1.12',  status: 'success', details: 'Report rep-001 – Suspicious listing prop-004',       type: 'report',   timestamp: '2026-04-04 15:20' },
  { id: 'aud-005', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Issued warning',         ipAddress: '192.168.1.12',  status: 'success', details: 'Seller: Lourdes Navarro – misleading listing',        type: 'user',     timestamp: '2026-04-04 14:05' },
  { id: 'aud-006', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Verified seller',        ipAddress: '192.168.1.12',  status: 'success', details: 'Ramon Cruz (seller@homesure.com)',                   type: 'user',     timestamp: '2026-04-03 10:48' },
  { id: 'aud-007', actor: 'Ricardo Dela Cruz', actorRole: 'superadmin', action: 'Viewed audit trail',     ipAddress: '10.0.0.1',      status: 'success', details: 'Full audit log accessed',                            type: 'system',   timestamp: '2026-04-03 09:00' },
  { id: 'aud-008', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Approved listing',       ipAddress: '192.168.1.12',  status: 'success', details: '1-Bedroom Apartment for Rent near Town Proper',       type: 'listing',  timestamp: '2026-04-02 16:30' },
  { id: 'aud-009', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Suspended account',      ipAddress: '192.168.1.12',  status: 'success', details: 'Seller: Ana Reyes – repeated policy violations',      type: 'user',     timestamp: '2026-04-01 13:15' },
  { id: 'aud-010', actor: 'Ricardo Dela Cruz', actorRole: 'superadmin', action: 'Reset admin password',   ipAddress: '10.0.0.1',      status: 'success', details: 'Andrea Villanueva (admin@homesure.com)',             type: 'admin',    timestamp: '2026-03-30 11:00' },
  { id: 'aud-011', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Rejected report',        ipAddress: '192.168.1.12',  status: 'failed',  details: 'Report flagged as invalid – insufficient evidence',   type: 'report',   timestamp: '2026-03-28 09:45' },
  { id: 'aud-012', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Removed listing',        ipAddress: '192.168.1.12',  status: 'success', details: 'prop-005 – fraudulent property details',             type: 'listing',  timestamp: '2026-03-25 14:00' },
  { id: 'aud-013', actor: 'Ricardo Dela Cruz', actorRole: 'superadmin', action: 'Exported system report', ipAddress: '10.0.0.1',      status: 'success', details: 'Full listings export (CSV)',                          type: 'system',   timestamp: '2026-03-20 08:30' },
  { id: 'aud-014', actor: 'Andrea Villanueva', actorRole: 'admin',      action: 'Approved listing',       ipAddress: '192.168.1.12',  status: 'success', details: 'House for Rent near Highway – Bagbaguin, Sta. Maria, Bulacan',             type: 'listing',  timestamp: '2026-03-15 10:22' },
  { id: 'aud-015', actor: 'Ricardo Dela Cruz', actorRole: 'superadmin', action: 'Added admin account',    ipAddress: '10.0.0.1',      status: 'success', details: 'New Admin (pending setup)',                          type: 'admin',    timestamp: '2026-03-10 09:00' },
];

// ── Admin Accounts (Super Admin view) ────────────────────────────────────────
const FAKE_ADMINS = FAKE_USERS.filter(u => u.role === 'admin').map(u => ({
  ...u,
  status: 'active',
  addedBy: 'Ricardo Dela Cruz',
  addedAt: u.joinedAt,
}));

// ── Auth Helpers ──────────────────────────────────────────────────────────────
function fakeLogin(email, password) {
  return FAKE_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) || null;
}

function saveSession(user) {
  const session = {
    id: user.id, role: user.role,
    firstName: user.firstName, lastName: user.lastName,
    email: user.email, phone: user.phone,
    verified: user.verified, accountStatus: user.accountStatus || null,
    savedListings: user.savedListings || [],
    avatar: user.avatar || null,
    isVerified: user.isVerified || false,
    verifiedAt: user.verifiedAt || null,
    verificationExpiry: user.verificationExpiry || null,
    phoneVerified: user.phoneVerified || false,
  };
  sessionStorage.setItem('homesure_user', JSON.stringify(session));
}

function getSession() {
  const raw = sessionStorage.getItem('homesure_user');
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  sessionStorage.removeItem('homesure_user');
}

function redirectToDashboard(role) {
  const routes = {
    buyer:      '../module/buyer/buyer.html',
    seller:     '../module/seller/seller.html',
    admin:      '../module/admin/admin.html',
    superadmin: '../module/super-admin/super-admin.html',
  };
  const path = routes[role];
  if (path) window.location.href = path;
}

// ── Reviews (Two-Way: Buyer ↔ Seller) ────────────────────────────────────────
const FAKE_REVIEWS = [
  // Buyers rating Sellers
  {
    id: 'rev-1',
    type: 'buyer-to-seller',
    buyerId: 'u-buyer-1',
    sellerId: 'u-seller-1',
    listingId: 'lst-1',
    rating: 5,
    comment: 'Excellent seller! Very professional and responsive. The property was exactly as described. Highly recommend!',
    reviewDate: '2025-11-15T14:30:00Z',
    helpful: 12,
  },
  {
    id: 'rev-2',
    type: 'buyer-to-seller',
    buyerId: 'u-buyer-2',
    sellerId: 'u-seller-1',
    listingId: 'lst-2',
    rating: 5,
    comment: 'Great experience! The seller was very accommodating during the viewing and answered all my questions.',
    reviewDate: '2025-10-22T09:15:00Z',
    helpful: 8,
  },
  {
    id: 'rev-3',
    type: 'buyer-to-seller',
    buyerId: 'u-buyer-1',
    sellerId: 'u-seller-2',
    listingId: 'lst-5',
    rating: 4,
    comment: 'Good property and fair pricing. Minor issues with documentation but seller resolved them quickly.',
    reviewDate: '2025-09-10T16:45:00Z',
    helpful: 5,
  },
  {
    id: 'rev-4',
    type: 'buyer-to-seller',
    buyerId: 'u-buyer-3',
    sellerId: 'u-seller-2',
    listingId: 'lst-6',
    rating: 5,
    comment: 'Very smooth transaction! Seller provided all necessary documents and was very transparent throughout.',
    reviewDate: '2025-11-01T11:20:00Z',
    helpful: 15,
  },
  {
    id: 'rev-5',
    type: 'buyer-to-seller',
    buyerId: 'u-buyer-2',
    sellerId: 'u-seller-3',
    listingId: 'lst-9',
    rating: 3,
    comment: 'Property was okay but seller was not very responsive to messages. Took longer than expected to finalize.',
    reviewDate: '2025-08-18T13:00:00Z',
    helpful: 3,
  },

  // Sellers rating Buyers
  {
    id: 'rev-6',
    type: 'seller-to-buyer',
    sellerId: 'u-seller-1',
    buyerId: 'u-buyer-1',
    listingId: 'lst-1',
    rating: 5,
    comment: 'Professional and serious buyer. Payment was on time and communication was excellent. Would work with again!',
    reviewDate: '2025-11-16T10:00:00Z',
    helpful: 7,
  },
  {
    id: 'rev-7',
    type: 'seller-to-buyer',
    sellerId: 'u-seller-1',
    buyerId: 'u-buyer-2',
    listingId: 'lst-2',
    rating: 5,
    comment: 'Great buyer to work with. Respectful during viewings and quick to make decisions.',
    reviewDate: '2025-10-23T14:30:00Z',
    helpful: 4,
  },
  {
    id: 'rev-8',
    type: 'seller-to-buyer',
    sellerId: 'u-seller-2',
    buyerId: 'u-buyer-1',
    listingId: 'lst-5',
    rating: 4,
    comment: 'Good buyer but needed extra time to process documents. Overall positive experience.',
    reviewDate: '2025-09-11T09:15:00Z',
    helpful: 2,
  },
  {
    id: 'rev-9',
    type: 'seller-to-buyer',
    sellerId: 'u-seller-2',
    buyerId: 'u-buyer-3',
    listingId: 'lst-6',
    rating: 5,
    comment: 'Excellent buyer! Very organized and prepared with all requirements. Smooth transaction from start to finish.',
    reviewDate: '2025-11-02T08:45:00Z',
    helpful: 9,
  },
  {
    id: 'rev-10',
    type: 'seller-to-buyer',
    sellerId: 'u-seller-3',
    buyerId: 'u-buyer-2',
    listingId: 'lst-9',
    rating: 4,
    comment: 'Buyer was pleasant but took a while to respond to messages. Transaction completed successfully though.',
    reviewDate: '2025-08-19T15:20:00Z',
    helpful: 1,
  },
];

// ── Transactions (Completed Deals) ───────────────────────────────────────────
const FAKE_TRANSACTIONS = [
  {
    id: 'txn-001',
    listingId: 'prop-002',
    listingTitle: '1-Bedroom Apartment for Rent near Town Proper',
    buyerId: 'usr-001',
    buyerName: 'Maria Santos',
    sellerId: 'usr-003',
    sellerName: 'Ramon Cruz',
    type: 'rent',
    status: 'completed',
    amount: 8000,
    paymentMethod: 'GCash',
    transactionDate: '2025-11-20T14:30:00Z',
    moveInDate: '2025-12-01',
  },
  {
    id: 'txn-002',
    listingId: 'prop-003',
    listingTitle: '4-Bedroom House & Lot in San Jose Patag',
    buyerId: 'usr-001',
    buyerName: 'Maria Santos',
    sellerId: 'usr-003',
    sellerName: 'Ramon Cruz',
    type: 'sale',
    status: 'completed',
    amount: 7800000,
    paymentMethod: 'Bank Transfer',
    transactionDate: '2025-10-15T10:00:00Z',
    moveInDate: '2025-11-01',
  },
  {
    id: 'txn-003',
    listingId: 'prop-004',
    listingTitle: 'Studio Unit in Bagbaguin',
    buyerId: 'usr-002',
    buyerName: 'Juan Dela Cruz',
    sellerId: 'usr-003',
    sellerName: 'Ramon Cruz',
    type: 'rent',
    status: 'completed',
    amount: 8000,
    paymentMethod: 'GCash',
    transactionDate: '2025-09-05T16:00:00Z',
    moveInDate: '2025-09-15',
  },
];

// ── Viewing Requests ──────────────────────────────────────────────────────────
const FAKE_VIEWING_REQUESTS = [
  {
    id: 'view-001',
    listingId: 'prop-001',
    listingTitle: '3-Bedroom House for Sale in Brgy. Poblacion',
    buyerId: 'usr-001',
    buyerName: 'Maria Santos',
    sellerId: 'usr-003',
    sellerName: 'Ramon Cruz',
    status: 'pending', // pending, accepted, declined, counter-proposed, confirmed
    requestedDate: '2026-06-05',
    requestedTime: '14:00',
    proposedDate: null, // Set when seller counter-proposes
    proposedTime: null,
    buyerNotes: 'I would like to see the property this Friday afternoon.',
    sellerNotes: null,
    createdAt: '2026-06-02T10:30:00Z',
    updatedAt: '2026-06-02T10:30:00Z'
  },
  {
    id: 'view-002',
    listingId: 'prop-006',
    listingTitle: '2-Bedroom Condo Unit for Rent – Gusa',
    buyerId: 'usr-002',
    buyerName: 'Jose Reyes',
    sellerId: 'usr-003',
    sellerName: 'Ramon Cruz',
    status: 'counter-proposed',
    requestedDate: '2026-06-04',
    requestedTime: '10:00',
    proposedDate: '2026-06-04',
    proposedTime: '15:00',
    buyerNotes: 'Prefer morning viewing if possible.',
    sellerNotes: 'Morning is not available, but I can do 3 PM same day. Would that work?',
    createdAt: '2026-06-01T14:20:00Z',
    updatedAt: '2026-06-01T16:45:00Z'
  },
  {
    id: 'view-003',
    listingId: 'prop-004',
    listingTitle: 'Studio Apartment for Rent near Lim Ket Kai',
    buyerId: 'usr-001',
    buyerName: 'Maria Santos',
    sellerId: 'usr-004',
    sellerName: 'Lourdes Navarro',
    status: 'confirmed',
    requestedDate: '2026-06-03',
    requestedTime: '11:00',
    proposedDate: null,
    proposedTime: null,
    buyerNotes: 'I can come anytime in the morning.',
    sellerNotes: null,
    createdAt: '2026-05-30T09:15:00Z',
    updatedAt: '2026-05-30T10:00:00Z'
  }
];

// ── Messages / Conversations ──────────────────────────────────────────────────
const FAKE_MESSAGES = [
  {
    id: 'msg-001',
    conversationId: 'conv-usr001-usr003', // buyer-seller pair
    senderId: 'usr-001',
    senderName: 'Maria Santos',
    receiverId: 'usr-003',
    receiverName: 'Ramon Cruz',
    type: 'text', // text, viewing-request, viewing-response
    message: 'Hi! I saw your property listing. Is it still available?',
    timestamp: '2026-06-01T09:00:00Z',
    read: true
  },
  {
    id: 'msg-002',
    conversationId: 'conv-usr001-usr003',
    senderId: 'usr-003',
    senderName: 'Ramon Cruz',
    receiverId: 'usr-001',
    receiverName: 'Maria Santos',
    type: 'text',
    message: 'Yes, it is! Would you like to schedule a viewing?',
    timestamp: '2026-06-01T10:30:00Z',
    read: true
  },
  {
    id: 'msg-003',
    conversationId: 'conv-usr001-usr003',
    senderId: 'usr-001',
    senderName: 'Maria Santos',
    receiverId: 'usr-003',
    receiverName: 'Ramon Cruz',
    type: 'viewing-request',
    message: null,
    viewingRequestId: 'view-001', // Links to FAKE_VIEWING_REQUESTS
    viewingData: {
      listingId: 'prop-001',
      listingTitle: '3-Bedroom House for Sale in Brgy. Poblacion',
      requestedDate: '2026-06-05',
      requestedTime: '14:00',
      buyerNotes: 'I would like to see the property this Friday afternoon.'
    },
    timestamp: '2026-06-02T10:30:00Z',
    read: false,
    status: 'pending' // pending, accepted, declined, counter-proposed
  },
  {
    id: 'msg-004',
    conversationId: 'conv-usr002-usr003',
    senderId: 'usr-002',
    senderName: 'Jose Reyes',
    receiverId: 'usr-003',
    receiverName: 'Ramon Cruz',
    type: 'viewing-request',
    message: null,
    viewingRequestId: 'view-002',
    viewingData: {
      listingId: 'prop-006',
      listingTitle: '2-Bedroom Condo Unit for Rent – Gusa',
      requestedDate: '2026-06-04',
      requestedTime: '10:00',
      buyerNotes: 'Prefer morning viewing if possible.'
    },
    timestamp: '2026-06-01T14:20:00Z',
    read: true,
    status: 'counter-proposed'
  },
  {
    id: 'msg-005',
    conversationId: 'conv-usr002-usr003',
    senderId: 'usr-003',
    senderName: 'Ramon Cruz',
    receiverId: 'usr-002',
    receiverName: 'Jose Reyes',
    type: 'viewing-response',
    message: null,
    viewingRequestId: 'view-002',
    viewingData: {
      listingId: 'prop-006',
      listingTitle: '2-Bedroom Condo Unit for Rent – Gusa',
      originalDate: '2026-06-04',
      originalTime: '10:00',
      proposedDate: '2026-06-04',
      proposedTime: '15:00',
      sellerNotes: 'Morning is not available, but I can do 3 PM same day. Would that work?'
    },
    timestamp: '2026-06-01T16:45:00Z',
    read: true,
    status: 'counter-proposed'
  }
];

// ── Make data globally accessible ────────────────────────────────────────────
window.FAKE_USERS = FAKE_USERS;
window.FAKE_LISTINGS = FAKE_LISTINGS;
window.FAKE_REPORTS = FAKE_REPORTS;
window.FAKE_REVIEWS = FAKE_REVIEWS;
window.FAKE_TRANSACTIONS = FAKE_TRANSACTIONS;
window.FAKE_VIEWING_REQUESTS = FAKE_VIEWING_REQUESTS;
window.FAKE_MESSAGES = FAKE_MESSAGES;
