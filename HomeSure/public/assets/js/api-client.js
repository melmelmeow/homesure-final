/**
 * HomeSure Frontend API Client Helper
 * Connects standard HTML/JS frontend pages to Next.js Backend API
 */

const API_BASE_URL = window.location.origin.includes('3000')
  ? 'http://localhost:3000/api'
  : '/api';

const HomeSureAPI = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE_URL}/auth/me`);
    return res.json();
  },

  // Listings
  async getListings(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE_URL}/listings?${params}`);
    return res.json();
  },

  async getListingById(id) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}`);
    return res.json();
  },

  async createListing(data) {
    const res = await fetch(`${API_BASE_URL}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Payments & Xendit / QRPH
  async createPaymentInvoice(paymentData) {
    const res = await fetch(`${API_BASE_URL}/payments/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return res.json();
  },

  async createQRPHCode(qrData) {
    const res = await fetch(`${API_BASE_URL}/payments/create-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qrData),
    });
    return res.json();
  },

  async getPaymentStatus(paymentId) {
    const res = await fetch(`${API_BASE_URL}/payments/${paymentId}`);
    return res.json();
  },

  // Viewing Requests
  async createViewingRequest(requestData) {
    const res = await fetch(`${API_BASE_URL}/viewing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    return res.json();
  },

  async getViewingRequests(userId, role = 'buyer') {
    const paramKey = role === 'seller' ? 'seller_id' : 'buyer_id';
    const res = await fetch(`${API_BASE_URL}/viewing-requests?${paramKey}=${userId}`);
    return res.json();
  },

  // Analytics (Admin)
  async getAdminAnalytics() {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`);
    return res.json();
  },
};

window.HomeSureAPI = HomeSureAPI;
