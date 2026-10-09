// ── Data ──────────────────────────────────────────────────────────────────────

const properties = [
  {
    title: "House for Sale",
    location: "Pulong Buhangin, Sta. Maria, Bulacan",
    price: "₱10,000",
    period: "/month",
    verified: true,
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80",
  },
  {
    title: "Cozy Studio Apartment",
    location: "Poblacion, Sta. Maria, Bulacan",
    price: "₱8,000",
    period: "/month",
    verified: true,
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80",
  },
  {
    title: "Modern 2BR Apartment",
    location: "Poblacion, Sta. Maria, Bulacan",
    price: "₱12,000",
    period: "/month",
    verified: true,
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
  },
  {
    title: "Spacious Family Home",
    location: "Bagbaguin, Sta. Maria, Bulacan",
    price: "₱15,000",
    period: "/month",
    verified: true,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
  },
  {
    title: "Studio Loft Unit",
    location: "Pulong Buhangin, Sta. Maria",
    price: "₱6,500",
    period: "/month",
    verified: false,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
  },
  {
    title: "Townhouse for Rent",
    location: "Tumana, Sta. Maria, Bulacan",
    price: "₱10,500",
    period: "/month",
    verified: true,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
  },
];

const bentoListings = [
  {
    badge:'For Sale', badgeType:'sale',
    price:'₱4,500,000', name:'4BR Modern House', barangay:'Pulong Buhangin',
    beds:4, baths:3,
    img:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80',
  },
  {
    badge:'For Rent', badgeType:'rent',
    price:'₱15,000/mo', name:'2BR Apartment', barangay:'Poblacion',
    beds:2, baths:1,
    img:'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&q=80',
  },
  {
    badge:'For Sale', badgeType:'sale',
    price:'₱2,800,000', name:'3BR Townhouse', barangay:'Guyong',
    beds:3, baths:2,
    img:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
  },
  {
    badge:'For Rent', badgeType:'rent',
    price:'₱8,000/mo', name:'Studio Unit', barangay:'Bagbaguin',
    beds:1, baths:1,
    img:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  },
  {
    badge:'New', badgeType:'new',
    price:'₱1,900,000', name:'2BR Condo Unit', barangay:'Tumana',
    beds:2, baths:1,
    img:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
  },
];

const categories = [
  {
    name: "Houses",
    count: "342 listings",
    color: "#1a9e8f",
    bg: "rgba(26,158,143,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    name: "Apartments",
    count: "218 listings",
    color: "#6c63ff",
    bg: "rgba(108,99,255,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>`,
  },
  {
    name: "Townhouses",
    count: "97 listings",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M1 22h22"/><path d="M5 22V7l7-5 7 5v15"/><path d="M9 22V12h6v10"/></svg>`,
  },
];

const steps = [
  {
    num: "1",
    title: "Create an Account",
    desc: "Sign up as a buyer or seller. Verify your identity to build trust.",
  },
  {
    num: "2",
    title: "Browse or List",
    desc: "Search properties by barangay, budget, and type — or post your listing.",
  },
  {
    num: "3",
    title: "Connect Directly",
    desc: "Message verified sellers securely within the platform.",
  },
  {
    num: "4",
    title: "Close the Deal",
    desc: "Agree on terms confidently with full transparency on both sides.",
  },
];

const features = [
  {
    title: "Verified Sellers",
    desc: "All property owners undergo identity verification with government ID and selfie before publishing listings.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  {
    title: "Local Focus",
    desc: "Find properties by barangay within Sta. Maria, Bulacan with easy filtering options.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    title: "Direct Messaging",
    desc: "Connect directly with verified sellers through our secure in-platform messaging system.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
];

const statsData = [
  { end: 24, suffix: "", label: "Barangays Covered" },
  { end: 1200, suffix: "+", label: "Verified Sellers" },
  { end: 0, suffix: "", label: "Unverified Listings" },
  { end: 100, suffix: "%", label: "Secure Messaging" },
];

const testimonials = [
  {
    stars: 5,
    quote:
      "Found my apartment in just two days. Every seller was verified — no scams, no stress.",
    name: "Maria Santos",
    role: "Tenant, Poblacion",
    initials: "MS",
  },
  {
    stars: 5,
    quote:
      "Listed my townhouse and got genuine buyers in under a week. The platform is so easy to use.",
    name: "Rolando Cruz",
    role: "Property Owner, Bagbaguin",
    initials: "RC",
  },
  {
    stars: 4,
    quote:
      "Direct messaging made negotiating with the seller so much smoother than the usual process.",
    name: "Jessa Reyes",
    role: "Buyer, Tumana",
    initials: "JR",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// UNUSED CODE - Property Card System (Replaced by simple markers)
// ══════════════════════════════════════════════════════════════════════════════
/*
const propertyPins = [
  { id: 1, title: 'House for Sale', price: '₱10,000', period: '/month', location: 'Pulong Buhangin, Sta. Maria, Bulacan', position: { x: 78, y: 18 }, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80', verified: true },
  { id: 2, title: 'Cozy Studio Apartment', price: '₱8,000', period: '/month', location: 'Poblacion, Sta. Maria, Bulacan', position: { x: 42, y: 58 }, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80', verified: true },
  { id: 3, title: 'Modern 2BR Apartment', price: '₱12,000', period: '/month', location: 'Bagbaguin, Sta. Maria, Bulacan', position: { x: 25, y: 65 }, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80', verified: true },
  { id: 4, title: 'Spacious Family Home', price: '₱15,000', period: '/month', location: 'Guyong, Sta. Maria, Bulacan', position: { x: 48, y: 48 }, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80', verified: true },
  { id: 5, title: 'Studio Loft Unit', price: '₱6,500', period: '/month', location: 'Tumana, Sta. Maria', position: { x: 50, y: 68 }, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80', verified: false },
];
*/

// ══════════════════════════════════════════════════════════════════════════════
// UNUSED CODE - 3D Barangay Polygon Data (Was for MapLibre 3D extrusion attempt)
// ══════════════════════════════════════════════════════════════════════════════
/*
const barangayGeoJSON_OLD = {
  type: 'FeatureCollection',
  features: [
    // ── SILANGAN – northern irregular shape (purple on map) ───────────────────
    { type:'Feature', properties:{ name:'Silangan', count:12 }, geometry:{ type:'Polygon', coordinates:[[
      [120.956,14.887],[120.964,14.889],[120.972,14.888],[120.978,14.886],
      [120.982,14.883],[120.984,14.878],[120.982,14.872],[120.978,14.868],
      [120.972,14.865],[120.965,14.864],[120.958,14.865],[120.952,14.868],
      [120.948,14.872],[120.946,14.877],[120.948,14.882],[120.952,14.885],
      [120.956,14.887]
    ]] } },
    // ── MAG-ASAWANG SAPA – northwest irregular (yellow on map) ────────────────
    { type:'Feature', properties:{ name:'Mag-asawang Sapa', count:8 }, geometry:{ type:'Polygon', coordinates:[[
      [120.920,14.886],[120.928,14.888],[120.936,14.887],[120.944,14.885],
      [120.950,14.882],[120.954,14.878],[120.956,14.873],[120.954,14.867],
      [120.950,14.862],[120.944,14.858],[120.936,14.856],[120.928,14.856],
      [120.920,14.858],[120.914,14.862],[120.910,14.867],[120.908,14.872],
      [120.908,14.878],[120.912,14.882],[120.920,14.886]
    ]] } },
    // ── PULONG BUHANGIN – large northeast (purple on map) ─────────────────────
    { type:'Feature', properties:{ name:'Pulong Buhangin', count:15 }, geometry:{ type:'Polygon', coordinates:[[
      [120.972,14.889],[120.984,14.890],[120.995,14.888],[121.003,14.884],
      [121.008,14.878],[121.010,14.870],[121.008,14.862],[121.003,14.856],
      [120.995,14.852],[120.984,14.850],[120.972,14.850],[120.964,14.852],
      [120.956,14.856],[120.952,14.862],[120.950,14.870],[120.952,14.878],
      [120.956,14.884],[120.964,14.887],[120.972,14.889]
    ]] } },
    // ── CAY POMBO – central small (yellow on map) ─────────────────────────────
    { type:'Feature', properties:{ name:'Cay Pombo', count:6 }, geometry:{ type:'Polygon', coordinates:[[
      [120.950,14.870],[120.956,14.872],[120.962,14.871],[120.966,14.868],
      [120.968,14.864],[120.966,14.860],[120.962,14.857],[120.956,14.856],
      [120.950,14.857],[120.946,14.860],[120.944,14.864],[120.946,14.868],
      [120.950,14.870]
    ]] } },
    // ── CAYSIO – west of center (yellow on map) ───────────────────────────────
    { type:'Feature', properties:{ name:'Caysio', count:9 }, geometry:{ type:'Polygon', coordinates:[[
      [120.920,14.878],[120.928,14.880],[120.936,14.879],[120.944,14.876],
      [120.950,14.872],[120.952,14.867],[120.950,14.862],[120.944,14.858],
      [120.936,14.856],[120.928,14.856],[120.920,14.858],[120.914,14.862],
      [120.912,14.867],[120.914,14.872],[120.920,14.878]
    ]] } },
    // ── MANGGAHAN – far west (yellow on map) ──────────────────────────────────
    { type:'Feature', properties:{ name:'Manggahan', count:11 }, geometry:{ type:'Polygon', coordinates:[[
      [120.910,14.852],[120.916,14.854],[120.922,14.853],[120.926,14.850],
      [120.928,14.846],[120.926,14.842],[120.922,14.840],[120.916,14.840],
      [120.910,14.842],[120.906,14.846],[120.908,14.850],[120.910,14.852]
    ]] } },
    // ── BALASING – east (green on map) ────────────────────────────────────────
    { type:'Feature', properties:{ name:'Balasing', count:7 }, geometry:{ type:'Polygon', coordinates:[[
      [120.968,14.865],[120.978,14.867],[120.988,14.865],[120.996,14.860],
      [121.002,14.853],[121.004,14.845],[121.002,14.837],[120.996,14.830],
      [120.988,14.826],[120.978,14.825],[120.968,14.826],[120.962,14.830],
      [120.960,14.837],[120.962,14.845],[120.966,14.853],[120.968,14.860],
      [120.968,14.865]
    ]] } },
    // ── BULAC – far east (yellow on map) ──────────────────────────────────────
    { type:'Feature', properties:{ name:'Bulac', count:5 }, geometry:{ type:'Polygon', coordinates:[[
      [120.992,14.856],[121.000,14.858],[121.008,14.856],[121.012,14.850],
      [121.014,14.842],[121.012,14.834],[121.006,14.828],[121.000,14.824],
      [120.992,14.822],[120.986,14.824],[120.982,14.830],[120.982,14.837],
      [120.984,14.844],[120.988,14.850],[120.992,14.856]
    ]] } },
    // ── GUYONG – large central (beige on map) ─────────────────────────────────
    { type:'Feature', properties:{ name:'Guyong', count:18 }, geometry:{ type:'Polygon', coordinates:[[
      [120.930,14.854],[120.940,14.856],[120.950,14.854],[120.958,14.850],
      [120.964,14.844],[120.966,14.837],[120.964,14.830],[120.958,14.825],
      [120.950,14.822],[120.940,14.822],[120.930,14.825],[120.924,14.830],
      [120.922,14.837],[120.924,14.844],[120.928,14.850],[120.930,14.854]
    ]] } },
    // ── SANTA CRUZ – west central (yellow on map) ─────────────────────────────
    { type:'Feature', properties:{ name:'Santa Cruz', count:14 }, geometry:{ type:'Polygon', coordinates:[[
      [120.914,14.866],[120.922,14.868],[120.930,14.867],[120.938,14.864],
      [120.944,14.860],[120.946,14.855],[120.944,14.850],[120.938,14.847],
      [120.930,14.846],[120.922,14.847],[120.914,14.850],[120.910,14.855],
      [120.910,14.860],[120.912,14.864],[120.914,14.866]
    ]] } },
    // ── CATMON – east central (yellow on map) ─────────────────────────────────
    { type:'Feature', properties:{ name:'Catmon', count:13 }, geometry:{ type:'Polygon', coordinates:[[
      [120.964,14.858],[120.974,14.860],[120.984,14.858],[120.992,14.854],
      [120.998,14.848],[121.000,14.840],[120.998,14.832],[120.992,14.826],
      [120.984,14.822],[120.974,14.820],[120.964,14.820],[120.958,14.824],
      [120.956,14.830],[120.958,14.837],[120.962,14.844],[120.966,14.850],
      [120.964,14.858]
    ]] } },
    // ── SANTA CLARA – west (yellow on map) ────────────────────────────────────
    { type:'Feature', properties:{ name:'Santa Clara', count:10 }, geometry:{ type:'Polygon', coordinates:[[
      [120.910,14.840],[120.916,14.842],[120.922,14.842],[120.928,14.839],
      [120.930,14.835],[120.928,14.831],[120.922,14.829],[120.916,14.829],
      [120.910,14.831],[120.906,14.835],[120.908,14.839],[120.910,14.840]
    ]] } },
    // ── SAN JOSE PATAG – central (purple on map) ──────────────────────────────
    { type:'Feature', properties:{ name:'San Jose Patag', count:16 }, geometry:{ type:'Polygon', coordinates:[[
      [120.930,14.834],[120.938,14.836],[120.946,14.835],[120.954,14.832],
      [120.960,14.827],[120.962,14.822],[120.960,14.817],[120.954,14.814],
      [120.946,14.812],[120.938,14.812],[120.930,14.814],[120.924,14.818],
      [120.922,14.823],[120.924,14.828],[120.928,14.832],[120.930,14.834]
    ]] } },
    // ── POBLACION – town center (purple on map) ───────────────────────────────
    { type:'Feature', properties:{ name:'Poblacion', count:45 }, geometry:{ type:'Polygon', coordinates:[[
      [120.928,14.823],[120.934,14.825],[120.940,14.824],[120.946,14.821],
      [120.950,14.817],[120.950,14.812],[120.946,14.808],[120.940,14.806],
      [120.934,14.806],[120.928,14.808],[120.924,14.812],[120.924,14.817],
      [120.926,14.821],[120.928,14.823]
    ]] } },
    // ── BAGBAGUIN – southwest (yellow on map) ─────────────────────────────────
    { type:'Feature', properties:{ name:'Bagbaguin', count:22 }, geometry:{ type:'Polygon', coordinates:[[
      [120.916,14.816],[120.924,14.818],[120.932,14.817],[120.940,14.814],
      [120.946,14.809],[120.948,14.803],[120.946,14.797],[120.940,14.793],
      [120.932,14.791],[120.924,14.791],[120.916,14.793],[120.910,14.797],
      [120.908,14.803],[120.910,14.809],[120.914,14.813],[120.916,14.816]
    ]] } },
    // ── TUMANA – south central (purple on map) ────────────────────────────────
    { type:'Feature', properties:{ name:'Tumana', count:19 }, geometry:{ type:'Polygon', coordinates:[[
      [120.944,14.816],[120.952,14.818],[120.960,14.817],[120.968,14.814],
      [120.974,14.809],[120.976,14.803],[120.974,14.797],[120.968,14.793],
      [120.960,14.791],[120.952,14.791],[120.944,14.793],[120.938,14.797],
      [120.936,14.803],[120.938,14.809],[120.942,14.813],[120.944,14.816]
    ]] } },
    // ── PARADA – south central (purple on map) ────────────────────────────────
    { type:'Feature', properties:{ name:'Parada', count:17 }, geometry:{ type:'Polygon', coordinates:[[
      [120.964,14.822],[120.972,14.824],[120.980,14.823],[120.988,14.820],
      [120.994,14.815],[120.996,14.809],[120.994,14.803],[120.988,14.799],
      [120.980,14.797],[120.972,14.797],[120.964,14.799],[120.958,14.803],
      [120.956,14.809],[120.958,14.815],[120.962,14.820],[120.964,14.822]
    ]] } },
    // ── SAN VICENTE – large southeast (purple on map) ─────────────────────────
    { type:'Feature', properties:{ name:'San Vicente', count:14 }, geometry:{ type:'Polygon', coordinates:[[
      [120.978,14.836],[120.990,14.838],[121.002,14.836],[121.012,14.831],
      [121.018,14.824],[121.020,14.815],[121.018,14.806],[121.012,14.799],
      [121.002,14.794],[120.990,14.792],[120.978,14.792],[120.970,14.796],
      [120.964,14.802],[120.962,14.810],[120.964,14.818],[120.970,14.826],
      [120.976,14.832],[120.978,14.836]
    ]] } },
    // ── LALAKHAN – far west (yellow on map) ───────────────────────────────────
    { type:'Feature', properties:{ name:'Lalakhan', count:8 }, geometry:{ type:'Polygon', coordinates:[[
      [120.906,14.826],[120.912,14.828],[120.918,14.827],[120.922,14.824],
      [120.924,14.820],[120.922,14.816],[120.918,14.814],[120.912,14.814],
      [120.906,14.816],[120.904,14.820],[120.906,14.824],[120.906,14.826]
    ]] } },
    // ── TABING BAKOD – southwest (yellow on map) ──────────────────────────────
    { type:'Feature', properties:{ name:'Tabing Bakod', count:12 }, geometry:{ type:'Polygon', coordinates:[[
      [120.916,14.813],[120.924,14.815],[120.932,14.814],[120.938,14.810],
      [120.942,14.805],[120.942,14.799],[120.938,14.794],[120.932,14.791],
      [120.924,14.790],[120.916,14.791],[120.910,14.795],[120.908,14.800],
      [120.910,14.806],[120.914,14.810],[120.916,14.813]
    ]] } },
    // ── SAN GABRIEL – south (yellow on map) ───────────────────────────────────
    { type:'Feature', properties:{ name:'San Gabriel', count:15 }, geometry:{ type:'Polygon', coordinates:[[
      [120.930,14.798],[120.938,14.800],[120.946,14.799],[120.954,14.795],
      [120.960,14.789],[120.962,14.782],[120.960,14.775],[120.954,14.770],
      [120.946,14.768],[120.938,14.768],[120.930,14.770],[120.924,14.775],
      [120.922,14.782],[120.924,14.789],[120.928,14.795],[120.930,14.798]
    ]] } },
    // ── BUENAVISTA – south (purple on map) ────────────────────────────────────
    { type:'Feature', properties:{ name:'Buenavista', count:11 }, geometry:{ type:'Polygon', coordinates:[[
      [120.942,14.798],[120.950,14.800],[120.958,14.799],[120.966,14.795],
      [120.972,14.789],[120.974,14.782],[120.972,14.775],[120.966,14.770],
      [120.958,14.768],[120.950,14.768],[120.942,14.770],[120.936,14.775],
      [120.934,14.782],[120.936,14.789],[120.940,14.795],[120.942,14.798]
    ]] } },
    // ── CAMANGYANAN – south (purple on map) ───────────────────────────────────
    { type:'Feature', properties:{ name:'Camangyanan', count:13 }, geometry:{ type:'Polygon', coordinates:[[
      [120.960,14.812],[120.970,14.814],[120.980,14.812],[120.988,14.808],
      [120.994,14.802],[120.996,14.795],[120.994,14.788],[120.988,14.783],
      [120.980,14.780],[120.970,14.780],[120.960,14.782],[120.952,14.786],
      [120.948,14.792],[120.950,14.799],[120.954,14.806],[120.960,14.812]
    ]] } },
    // ── MAHABANG PARANG – far southwest (yellow on map) ───────────────────────
    { type:'Feature', properties:{ name:'Mahabang Parang', count:6 }, geometry:{ type:'Polygon', coordinates:[[
      [120.908,14.796],[120.916,14.798],[120.924,14.797],[120.932,14.793],
      [120.938,14.788],[120.940,14.781],[120.938,14.774],[120.932,14.769],
      [120.924,14.767],[120.916,14.767],[120.908,14.769],[120.902,14.774],
      [120.900,14.781],[120.902,14.788],[120.906,14.793],[120.908,14.796]
    ]] } },
  ]
};
*/

// Exact 24 barangays of Sta. Maria, Bulacan
const STA_MARIA_BARANGAYS = new Set([
  'Bagbaguin','Balasing','Buenavista','Bulac','Camangyanan','Catmon',
  'Cay Pombo','Caysio','Guyong','Lalakhan','Mag-asawang Sapa',
  'Mahabang Parang','Manggahan','Parada','Poblacion','Pulong Buhangin',
  'San Gabriel','San Jose Patag','San Vicente','Santa Clara','Santa Cruz',
  'Silangan','Tabing Bakod','Tumana',
]);

// Name aliases — OSM may use these alternate spellings
const BARANGAY_ALIAS = {
  'Sta. Clara':'Santa Clara','Sta. Cruz':'Santa Cruz',
  'Cay-Pombo':'Cay Pombo','Mag-Asawang Sapa':'Mag-asawang Sapa',
  'Mahabang-Parang':'Mahabang Parang','Tabing-Bakod':'Tabing Bakod',
  'San Jose-Patag':'San Jose Patag',
};

// Listing count per barangay — merged with Overpass API data
const barangayListings = {
  'Poblacion':12,'Guyong':9,'Santa Cruz':8,'Manggahan':7,'Bagbaguin':7,
  'Mag-asawang Sapa':6,'Tumana':6,'Catmon':6,'Caysio':5,'Santa Clara':5,
  'San Gabriel':5,'Camangyanan':5,'Parada':5,'Silangan':4,'San Jose Patag':4,
  'San Vicente':4,'Buenavista':4,'Pulong Buhangin':20,'Cay Pombo':3,
  'Balasing':3,'Lalakhan':3,'Tabing Bakod':3,'Bulac':2,'Mahabang Parang':2,
};

// Assemble ordered OSM way segments into a single closed ring
function assembleRing(ways) {
  if (!ways || !ways.length) return null;
  if (ways.length === 1) {
    const w = ways[0]; if (w.length < 3) return null;
    const f = w[0], l = w[w.length-1];
    return (f[0]===l[0]&&f[1]===l[1]) ? w : [...w, f];
  }
  let ring = [...ways[0]];
  const rem = [...ways.slice(1)];
  while (rem.length) {
    const tail = ring[ring.length-1]; let found = false;
    for (let i = 0; i < rem.length; i++) {
      const w = rem[i];
      if (Math.abs(w[0][0]-tail[0])<1e-7 && Math.abs(w[0][1]-tail[1])<1e-7)
        { ring.push(...w.slice(1)); rem.splice(i,1); found=true; break; }
      if (Math.abs(w[w.length-1][0]-tail[0])<1e-7 && Math.abs(w[w.length-1][1]-tail[1])<1e-7)
        { ring.push(...[...w].reverse().slice(1)); rem.splice(i,1); found=true; break; }
    }
    if (!found) break;
  }
  if (ring.length < 4) return null;
  const f = ring[0], l = ring[ring.length-1];
  if (Math.abs(f[0]-l[0])>1e-7||Math.abs(f[1]-l[1])>1e-7) ring.push(f);
  return ring;
}

// Convert any Overpass relation to GeoJSON (no name filter — used for municipality boundary)
function relationToGeoJSON(osm) {
  const features = [];
  (osm.elements || []).forEach(el => {
    if (el.type !== 'relation') return;
    const outerWays = (el.members || [])
      .filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry && m.geometry.length > 1)
      .map(m => m.geometry.map(g => [g.lon, g.lat]));
    if (!outerWays.length) return;
    const ring = assembleRing(outerWays);
    if (!ring || ring.length < 4) return;
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });
  });
  return { type: 'FeatureCollection', features };
}

// Convert Overpass API `out geom` response to GeoJSON — only Sta. Maria barangays
function overpassToGeoJSON(osm) {
  const features = [];
  (osm.elements || []).forEach(el => {
    if (el.type !== 'relation') return;
    let name = el.tags?.name || el.tags?.['name:en'] || ''; if (!name) return;
    name = name.replace(/^(Barangay|Brgy\.?)\s+/i, '').trim();
    if (BARANGAY_ALIAS[name]) name = BARANGAY_ALIAS[name];
    if (!STA_MARIA_BARANGAYS.has(name)) return;

    // `out geom` puts geometry directly on each member way; skip inner rings (holes)
    const outerWays = (el.members || [])
      .filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry && m.geometry.length > 1)
      .map(m => m.geometry.map(g => [g.lon, g.lat]));
    if (!outerWays.length) return;

    const ring = assembleRing(outerWays);
    if (!ring || ring.length < 4) return;
    features.push({
      type: 'Feature',
      properties: { name, count: barangayListings[name] || 2 },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  });
  return { type: 'FeatureCollection', features };
}

// ── Theme init (read localStorage, default light) ──────────────────────────────
(function () {
  const t = localStorage.getItem('hs-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
})();

// ── SVG Helpers ───────────────────────────────────────────────────────────────

const pinIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b8fa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const checkIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const chevronLeft = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const chevronRight = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const searchIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const shieldIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const starIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const lockIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const LOGO_SRC = "assets/img/HomeSure_Logo.svg";

// ── React Components ──────────────────────────────────────────────────────────

const { useState, useEffect, useRef } = React;

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// Typing Animation
const typingPhrases = [
  "Find your home.",
  "Find verified properties.",
  "Find your perfect place.",
  "Find trusted listings.",
  "Find your next home.",
];

function TypingText() {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = typingPhrases[phraseIdx];
    let timer;

    if (!deleting) {
      if (displayed.length < current.length) {
        timer = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          68 + Math.random() * 38,
        );
      } else {
        timer = setTimeout(() => setDeleting(true), 1900);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(
          () => setDisplayed(d => d.slice(0, -1)),
          28 + Math.random() * 18,
        );
      } else {
        timer = setTimeout(() => {
          setPhraseIdx(i => (i + 1) % typingPhrases.length);
          setDeleting(false);
        }, 280);
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, deleting, phraseIdx]);

  return React.createElement(
    React.Fragment, null,
    displayed,
    React.createElement('span', { className: 'typing-cursor' }),
  );
}

// Hero Wheel — center is fixed, only arms orbit clockwise
function HeroCards() {
  const cards = properties.slice(0, 3);
  return React.createElement(
    'div', { className: 'hero-cards' },
    cards.map((prop, i) =>
      React.createElement(
        'div', { key: i, className: 'hero-card' },
        React.createElement(
          'div', { className: 'wc-img-wrap' },
          React.createElement('img', { className: 'wc-img', src: prop.image, alt: prop.title }),
          prop.verified
            ? React.createElement(
                'span', { className: 'wc-verified-badge' },
                React.createElement('span', { dangerouslySetInnerHTML: { __html: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` } }),
                'Verified',
              )
            : null,
        ),
        React.createElement(
          'div', { className: 'wc-info' },
          React.createElement('div', { className: 'wc-title' }, prop.title),
          React.createElement('div', { className: 'wc-location' },
            React.createElement('span', { dangerouslySetInnerHTML: { __html: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>` } }),
            prop.location,
          ),
          React.createElement('div', { className: 'wc-footer' },
            React.createElement('span', { className: 'wc-price' }, prop.price, React.createElement('span', { className: 'wc-period' }, prop.period)),
            React.createElement('span', { className: 'wc-view' }, 'View Details'),
          ),
        ),
      )
    ),
  );
}

function HeroMap() {
  const mapWrapRef = useRef(null);
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgContent, setSvgContent] = useState('');

  // Fetch SVG content
  useEffect(() => {
    fetch('assets/img/Sta. Maria Map.svg')
      .then(res => res.text())
      .then(svg => setSvgContent(svg));
  }, []);

  // Add property markers
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const markers = [
      { x: 35, y: 68, count: 12, barangay: 'Poblacion' },
      { x: 40, y: 58, count: 8, barangay: 'Guyong' },
      { x: 25, y: 73, count: 15, barangay: 'Bagbaguin' },
      { x: 45, y: 78, count: 10, barangay: 'Tumana' },
      { x: 63, y: 58, count: 6, barangay: 'Catmon' },
      { x: 63, y: 28, count: 20, barangay: 'Pulong Buhangin'}
    ];

    markers.forEach((marker, i) => {
      const pin = document.createElement('div');
      pin.className = 'property-marker';
      pin.style.left = `${marker.x}%`;
      pin.style.top = `${marker.y}%`;
      pin.style.animationDelay = `${i * 0.3}s`;
      pin.innerHTML = `
        <div class="marker-pulse"></div>
        <div class="marker-icon">
          <img src="assets/img/House Icon.svg" alt="Property" />
        </div>
        <div class="marker-tooltip">${marker.count} properties in ${marker.barangay}</div>
      `;
      containerRef.current.appendChild(pin);
    });
  }, [svgContent]);

  useEffect(() => {
    if (!mapWrapRef.current) return;

    const wrap = mapWrapRef.current;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.5, transform.scale + delta), 3);
      setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e) => {
      if (e.shiftKey) {
        setIsRotating(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    };

    const handleMouseMove = (e) => {
      if (isRotating) {
        const deltaX = e.clientX - dragStart.x;
        setTransform(prev => ({
          ...prev,
          rotate: prev.rotate + deltaX * 0.5
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isDragging) {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    wrap.addEventListener('wheel', handleWheel, { passive: false });
    wrap.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      wrap.removeEventListener('wheel', handleWheel);
      wrap.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transform, isDragging, isRotating, dragStart]);

  return React.createElement(
    'div', {
      className: 'hero-map-wrap',
      ref: mapWrapRef,
      style: { cursor: isDragging ? 'grabbing' : isRotating ? 'crosshair' : 'grab' }
    },
    React.createElement('div', {
      ref: containerRef,
      className: 'hero-map-container',
      style: {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
        transformOrigin: 'center center',
        transition: (isDragging || isRotating) ? 'none' : 'transform 0.1s ease-out'
      },
      dangerouslySetInnerHTML: { __html: svgContent }
    }),
  );
}

const sunSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

// Navbar
function Navbar() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hs-theme', next);
    setTheme(next);
  }

  return React.createElement(
    "nav",
    null,
    React.createElement(
      "a",
      { className: "nav-logo", href: "#" },
      React.createElement("span", { className: "nav-catstone-wrap" },
        React.createElement("img", { src: "assets/img/CatsTone Logo.png", alt: "CatsTone", className: "nav-catstone-img" }),
      ),
      React.createElement("span", { className: "nav-logo-divider" }),
      React.createElement("img", { src: LOGO_SRC, alt: "HomeSure", height: 30, style: { display: "block" } }),
      React.createElement("span", { style: { display: "inline-block" } }, "HomeSure"),
    ),
    React.createElement(
      "div",
      { className: "nav-btns" },
      React.createElement("button", {
        className: "nav-theme-btn",
        onClick: toggleTheme,
        title: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
        dangerouslySetInnerHTML: { __html: theme === 'dark' ? sunSVG : moonSVG },
      }),
      React.createElement("button", { className: "btn-outline", onClick: () => (window.location.href = "auth/signin.html") }, "Sign In"),
      React.createElement(
        "button",
        { className: "btn-solid", onClick: () => (window.location.href = "auth/signup.html") },
        "Sign Up",
      ),
    ),
  );
}

const bedSVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/><path d="M2 9h20v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><line x1="6" y1="9" x2="6" y2="20"/></svg>`;
const bathSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6L9 2"/><path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><line x1="4" y1="14" x2="20" y2="14"/></svg>`;

function HeroBento() {
  return React.createElement('div', { className:'hero-bento-wrap' },
    // ── Live ping badge ──
    React.createElement('div', { className:'bento-ping' },
      React.createElement('span', { className:'bento-ping-dot' }),
      '3 new listings today',
    ),
    // ── Bento grid ──
    React.createElement('div', { className:'hero-bento' },
      bentoListings.map((l, i) =>
        React.createElement('div', {
          key: i,
          className: `bento-tile${i === 0 ? ' bento-featured' : ''}`,
          style: { backgroundImage:`url(${l.img})` },
        },
          React.createElement('div', { className:'bento-grad' }),
          React.createElement('div', { className:'bento-content' },
            React.createElement('span', { className:`bento-badge bento-badge-${l.badgeType}` }, l.badge),
            React.createElement('div', { className:'bento-info' },
              React.createElement('div', { className:'bento-price' }, l.price),
              React.createElement('div', { className:'bento-name' }, l.name),
              React.createElement('div', { className:'bento-loc' }, l.barangay),
              React.createElement('div', { className:'bento-meta' },
                React.createElement('span', { className:'bento-pill' },
                  React.createElement('span', { dangerouslySetInnerHTML:{ __html: bedSVG } }),
                  `${l.beds} bed`,
                ),
                React.createElement('span', { className:'bento-pill' },
                  React.createElement('span', { dangerouslySetInnerHTML:{ __html: bathSVG } }),
                  `${l.baths} bath`,
                ),
              ),
            ),
          ),
        )
      ),
    ),
  );
}

// Feature Highlights Section
function FeatureHighlights() {
  const features = [
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      title: 'Admin-Verified Listings',
      desc: 'Every listing reviewed before publishing',
      color: '#00c9a7',
      badge: 'VERIFIED'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
      title: 'Secure In-Chat Payments',
      desc: 'Agree on price and send payment requests within the chat',
      color: '#3b82f6',
      badge: 'SECURE'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
      title: 'Anti-Fraud Protection',
      desc: 'Government ID verification for all sellers',
      color: '#f59e0b',
      badge: 'PROTECTED'
    },
  ];

  return React.createElement(
    'section',
    { className: 'feature-highlights' },
    React.createElement(
      'div',
      { className: 'feature-grid' },
      ...features.map((feat, i) =>
        React.createElement(
          'div',
          { key: i, className: 'feature-card', style: { '--feature-color': feat.color } },
          React.createElement('div', {
            className: 'feature-card-icon',
            dangerouslySetInnerHTML: { __html: feat.icon }
          }),
          React.createElement('div', { className: 'feature-card-badge' }, feat.badge),
          React.createElement('h3', { className: 'feature-card-title' }, feat.title),
          React.createElement('p', { className: 'feature-card-desc' }, feat.desc)
        )
      )
    )
  );
}

// Trust Banner Component
function TrustBanner() {
  return React.createElement(
    'section',
    { className: 'trust-banner' },
    React.createElement(
      'div',
      { className: 'trust-content' },
      React.createElement('div', {
        className: 'trust-icon',
        dangerouslySetInnerHTML: {
          __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`
        }
      }),
      React.createElement(
        'h3',
        { className: 'trust-text' },
        'Every listing is reviewed. Every seller is verified. ',
        React.createElement('span', { className: 'trust-highlight' }, 'No exceptions.')
      ),
      React.createElement(
        'p',
        { className: 'trust-subtext' },
        'Your safety is our priority. All sellers undergo government ID verification before posting.'
      )
    )
  );
}

// Platform Features Section
function PlatformFeatures() {
  const features = [
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
      title: 'In-Chat Payment Requests',
      desc: 'Request and track payments directly in conversations'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
      title: 'Security Deposit Management',
      desc: 'Automated deposit tracking and refund processing'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
      title: 'Damage Reporting System',
      desc: 'Photo uploads and dispute resolution tools'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      title: 'Barangay-Level Search',
      desc: 'Find properties in all 24 barangays of Sta. Maria'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
      title: 'Verified Seller Badges',
      desc: 'Government ID verification for all property owners'
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
      title: 'Real-Time Messaging',
      desc: 'Instant chat with sellers, no phone numbers required'
    }
  ];

  return React.createElement(
    'section',
    { className: 'platform-features' },
    React.createElement('h2', { className: 'section-title' }, 'Platform Features'),
    React.createElement('p', { className: 'section-subtitle' }, 'Everything you need for safe and secure property rentals'),
    React.createElement(
      'div',
      { className: 'platform-grid' },
      ...features.map((feat, i) =>
        React.createElement(
          'div',
          { key: i, className: 'platform-item' },
          React.createElement('div', {
            className: 'platform-icon',
            dangerouslySetInnerHTML: { __html: feat.icon }
          }),
          React.createElement('h3', { className: 'platform-title' }, feat.title),
          React.createElement('p', { className: 'platform-desc' }, feat.desc)
        )
      )
    )
  );
}

function Hero() {

  return React.createElement(
    "section",
    { className: "hero" },

    // ── Particle background ──
    React.createElement("div", { className: "hero-particles" }),

    // ── Content ──
    React.createElement(
      "div",
      { className: "hero-left" },
      React.createElement(
        "div",
        { className: "hero-badge" },
        React.createElement("span", { className: "hero-badge-dot" }),
        "Sta. Maria, Bulacan — Property Platform",
      ),
      React.createElement(
        "h1",
        { className: "hero-title" },
        "Buy. Sell. Rent.",
        React.createElement("br"),
        "All in one place.",
        React.createElement("br"),
        React.createElement(
          "span", { className: "hero-title-accent" },
          React.createElement(TypingText),
        ),
      ),
      React.createElement(
        "p",
        { className: "hero-desc" },
        "HomeSure connects buyers with verified property owners across Sta. Maria, Bulacan. No hidden listings. No unverified sellers.",
      ),
      React.createElement(
        "div",
        { className: "hero-ctas" },
        // Desktop: Browse Listings & List Property
        React.createElement(
          "button",
          { className: "hero-btn-primary hero-btn-browse", onClick: () => (window.location.href = "browse.html") },
          React.createElement("span", { dangerouslySetInnerHTML: { __html: searchIcon } }),
          React.createElement("span", null, "Browse Listings"),
        ),
        React.createElement(
          "button",
          { className: "hero-btn-secondary hero-btn-list", onClick: () => (window.location.href = "auth/signup.html") },
          React.createElement("span", null, "List Your Property"),
          React.createElement("span", { dangerouslySetInnerHTML: { __html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>` } }),
        ),
        // Mobile: Sign In & Sign Up
        React.createElement(
          "button",
          { className: "hero-btn-mobile-signin", onClick: () => (window.location.href = "auth/signin.html") },
          "Sign In",
        ),
        React.createElement(
          "button",
          { className: "hero-btn-mobile-signup", onClick: () => (window.location.href = "auth/signup.html") },
          "Sign Up",
        ),
      ),
      React.createElement(
        "div",
        { className: "hero-trust" },
        React.createElement("span", { className: "hero-trust-item" },
          React.createElement("span", { className: "hero-trust-icon", dangerouslySetInnerHTML: { __html: shieldIcon } }),
          React.createElement("span", null, "Verified Listings"),
        ),
        React.createElement("span", { className: "hero-trust-item" },
          React.createElement("span", { className: "hero-trust-icon", dangerouslySetInnerHTML: { __html: starIcon } }),
          React.createElement("span", null, "4.8/5 Rating"),
        ),
        React.createElement("span", { className: "hero-trust-item" },
          React.createElement("span", { className: "hero-trust-icon", dangerouslySetInnerHTML: { __html: lockIcon } }),
          React.createElement("span", null, "Secure Messaging"),
        ),
      ),
    ),

    // ── Map on right side ──
    React.createElement(
      "div",
      { className: "hero-right" },
      React.createElement(HeroMap),
    ),

  );
}

// Categories
function Categories() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "span",
      { className: "section-label" },
      "Browse by Type",
    ),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Find What You're Looking For",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Filter by property type or listing category",
    ),
    React.createElement(
      "div",
      { className: "categories-grid" },
      categories.map((c, i) =>
        React.createElement(
          "div",
          { key: i, className: "cat-card" },
          React.createElement(
            "div",
            { className: "cat-icon", style: { background: c.bg } },
            React.createElement("span", {
              style: { color: c.color },
              dangerouslySetInnerHTML: { __html: c.icon },
            }),
          ),
          React.createElement("div", { className: "cat-name" }, c.name),
          React.createElement("div", { className: "cat-count" }, c.count),
        ),
      ),
    ),
  );
}

// Spotlight Carousel
function Carousel() {
  const [ref, visible] = useReveal();
  const len = properties.length;
  const [idx, setIdx] = useState(0);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % len), 3500);
    return () => clearInterval(t);
  }, [autoKey]);

  const go = (next) => {
    setIdx((next + len) % len);
    setAutoKey((k) => k + 1);
  };

  const leftProp = properties[(idx - 1 + len) % len];
  const centerProp = properties[idx];
  const rightProp = properties[(idx + 1) % len];

  const SideCard = (prop) =>
    React.createElement(
      "div",
      { className: "crd-side" },
      React.createElement("img", {
        className: "crd-img",
        src: prop.image,
        alt: prop.title,
      }),
      React.createElement(
        "div",
        { className: "crd-body-side" },
        React.createElement(
          "div",
          { className: "card-title-side" },
          prop.title,
        ),
        React.createElement("div", {
          className: "card-loc",
          dangerouslySetInnerHTML: {
            __html: pinIcon + `<span>${prop.location}</span>`,
          },
        }),
        React.createElement(
          "div",
          { className: "card-price-side" },
          prop.price,
        ),
      ),
    );

  return React.createElement(
    "section",
    { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "span",
      { className: "section-label" },
      "Featured Properties",
    ),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Curated Listings Near You",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Hand-picked from verified sellers in Sta. Maria, Bulacan",
    ),
    React.createElement(
      "div",
      { className: "crs-stage" },
      React.createElement(
        "div",
        { className: "crs-row" },
        React.createElement("button", {
          className: "crs-btn",
          onClick: () => go(idx - 1),
          dangerouslySetInnerHTML: { __html: chevronLeft },
        }),
        React.createElement(
          "div",
          { className: "crs-clip" },
          React.createElement(
            "div",
            {
              className: "crd-side-wrap crd-side-left",
              onClick: () => go(idx - 1),
            },
            SideCard(leftProp),
          ),
          React.createElement(
            "div",
            { className: "crd-center" },
            React.createElement(
              "div",
              { style: { position: "relative" } },
              React.createElement("img", {
                className: "crd-img-center",
                src: centerProp.image,
                alt: centerProp.title,
              }),
              centerProp.verified &&
                React.createElement("div", {
                  className: "verified-badge",
                  dangerouslySetInnerHTML: { __html: checkIcon + " Verified" },
                }),
            ),
            React.createElement(
              "div",
              { className: "crd-body-center" },
              React.createElement(
                "div",
                { className: "card-title" },
                centerProp.title,
              ),
              React.createElement("div", {
                className: "card-loc",
                dangerouslySetInnerHTML: {
                  __html: pinIcon + `<span>${centerProp.location}</span>`,
                },
              }),
              React.createElement(
                "div",
                { className: "card-footer-row" },
                React.createElement(
                  "div",
                  { className: "card-price" },
                  centerProp.price,
                  React.createElement("span", null, centerProp.period),
                ),
                React.createElement(
                  "span",
                  {
                    className: "card-link",
                    onClick: () => (window.location.href = "auth/signin.html"),
                  },
                  "View Details",
                ),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              className: "crd-side-wrap crd-side-right",
              onClick: () => go(idx + 1),
            },
            SideCard(rightProp),
          ),
        ),
        React.createElement("button", {
          className: "crs-btn",
          onClick: () => go(idx + 1),
          dangerouslySetInnerHTML: { __html: chevronRight },
        }),
      ),
    ),
    React.createElement(
      "div",
      { className: "dots" },
      properties.map((_, i) =>
        React.createElement("button", {
          key: i,
          className: "dot" + (i === idx ? " active" : ""),
          onClick: () => go(i),
        }),
      ),
    ),
  );
}

// How It Works
function HowItWorks() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement("span", { className: "section-label" }, "How It Works"),
    React.createElement(
      "h2",
      { className: "section-title" },
      "Simple Steps to Your Next Home",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Get started in minutes — no complicated process",
    ),
    React.createElement(
      "div",
      { className: "how-steps" },
      steps.map((s, i) =>
        React.createElement(
          "div",
          { key: i, className: "how-step" },
          React.createElement("div", { className: "how-step-num" }, s.num),
          React.createElement("div", { className: "how-step-title" }, s.title),
          React.createElement("div", { className: "how-step-desc" }, s.desc),
        ),
      ),
    ),
  );
}

// Features
function Features() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "features-inner" },
      React.createElement(
        "span",
        { className: "section-label" },
        "Why HomeSure",
      ),
      React.createElement(
        "h2",
        { className: "section-title" },
        "Built for Trust & Transparency",
      ),
      React.createElement(
        "p",
        { className: "section-sub" },
        "A platform designed with security and convenience at its core",
      ),
      React.createElement(
        "div",
        { className: "features-card-wrap" },
        features.map((f, i) =>
          React.createElement(
            "div",
            { key: i, className: "feature-card" },
            React.createElement("div", {
              className: "feature-icon",
              dangerouslySetInnerHTML: { __html: f.icon },
            }),
            React.createElement("div", { className: "feature-title" }, f.title),
            React.createElement("div", { className: "feature-desc" }, f.desc),
          ),
        ),
      ),
    ),
  );
}

// Animated counter hook
function useCounter(end, duration, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [active]);
  return val;
}

function StatBox({ stat }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setActive(true);
      },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCounter(stat.end, 1800, active);
  return React.createElement(
    "div",
    { className: "stat-box", ref },
    React.createElement(
      "div",
      { className: "stat-value" },
      count.toLocaleString() + stat.suffix,
    ),
    React.createElement("div", { className: "stat-label" }, stat.label),
  );
}

function Stats() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "stats-inner" },
      React.createElement(
        "span",
        { className: "section-label" },
        "Our Numbers",
      ),
      React.createElement(
        "h2",
        { className: "section-title" },
        "Trusted by Thousands",
      ),
      React.createElement(
        "p",
        { className: "section-sub" },
        "Building a safer housing marketplace for everyone in Sta. Maria",
      ),
      React.createElement(
        "div",
        { className: "stats-grid" },
        statsData.map((s, i) =>
          React.createElement(StatBox, { key: i, stat: s }),
        ),
      ),
    ),
  );
}

// Testimonials
function Testimonials() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "section",
    { className: `section-alt reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement("span", { className: "section-label" }, "Testimonials"),
    React.createElement(
      "h2",
      { className: "section-title" },
      "What Our Users Say",
    ),
    React.createElement(
      "p",
      { className: "section-sub" },
      "Real stories from real people in the community",
    ),
    React.createElement(
      "div",
      { className: "testimonials-grid" },
      testimonials.map((t, i) =>
        React.createElement(
          "div",
          { key: i, className: "testimonial-card" },
          React.createElement(
            "div",
            { className: "t-stars" },
            "★".repeat(t.stars) + (t.stars < 5 ? "☆".repeat(5 - t.stars) : ""),
          ),
          React.createElement("p", { className: "t-quote" }, `"${t.quote}"`),
          React.createElement(
            "div",
            { className: "t-author" },
            React.createElement("div", { className: "t-avatar" }, t.initials),
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "t-name" }, t.name),
              React.createElement("div", { className: "t-role" }, t.role),
            ),
          ),
        ),
      ),
    ),
  );
}

// CTA
function CTA() {
  const [ref, visible] = useReveal();
  return React.createElement(
    "div",
    { className: `cta-section reveal-section${visible ? ' in-view' : ''}`, ref },
    React.createElement(
      "div",
      { className: "cta-inner" },
      React.createElement(
        "h2",
        { className: "cta-title" },
        "Ready to Find Your Next Home?",
      ),
      React.createElement(
        "p",
        { className: "cta-sub" },
        "Join thousands of verified users discovering trusted properties in Sta. Maria, Bulacan",
      ),
      React.createElement(
        "div",
        { className: "cta-btns" },
        React.createElement(
          "button",
          {
            className: "cta-btn-white",
            onClick: () => (window.location.href = "auth/signup.html"),
          },
          "Sign Up as Buyer",
        ),
        React.createElement(
          "button",
          {
            className: "cta-btn-ghost",
            onClick: () => (window.location.href = "auth/signup.html"),
          },
          "List Your Property",
        ),
      ),
    ),
  );
}

// Footer
function Footer() {
  const platformLinks = ["Browse Listings", "List Your Property", "About Us"];
  const supportLinks = ["Help & Support", "Contact Us", "Report a Listing"];
  const legalLinks = ["Privacy Policy", "Terms of Service"];

  return React.createElement(
    "footer",
    null,
    React.createElement(
      "div",
      { className: "footer-grid" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-logo" },
          React.createElement("img", {
            src: LOGO_SRC,
            alt: "HomeSure",
            height: 28,
            style: { display: "block" },
          }),
          "HomeSure",
        ),
        React.createElement(
          "p",
          { className: "footer-tagline" },
          "A verified housing platform for secure property rentals and purchases in Sta. Maria, Bulacan.",
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-col-title" },
          "Platform",
        ),
        ...platformLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: l === "About Us" ? "about.html" : "#",
            },
            l,
          ),
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "footer-col-title" },
          "Support",
        ),
        ...supportLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: l === "Help & Support" ? "faqs.html" : "#"
            },
            l,
          ),
        ),
      ),
      React.createElement(
        "div",
        null,
        React.createElement("div", { className: "footer-col-title" }, "Legal"),
        ...legalLinks.map((l) =>
          React.createElement(
            "a",
            {
              key: l,
              className: "footer-link",
              href: l === "Privacy Policy" ? "privacy-policy.html" : "terms.html",
            },
            l,
          ),
        ),
      ),
    ),
    React.createElement("div", { className: "footer-divider" }),
    React.createElement(
      "div",
      { className: "footer-copy" },
      "© 2026 HomeSure. All rights reserved.",
    ),
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

function App() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Navbar),
    React.createElement(Hero),
    React.createElement(FeatureHighlights),
    React.createElement(TrustBanner),
    React.createElement(PlatformFeatures),
    React.createElement(HowItWorks),
    React.createElement(Features),
    React.createElement(Stats),
    React.createElement(Testimonials),
    React.createElement(CTA),
    React.createElement(Footer),
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
