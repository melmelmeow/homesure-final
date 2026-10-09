# 🏡 HomeSure Next.js Backend & API Suite

Welcome to the **HomeSure Backend API**, built with **Next.js App Router**, **Supabase** (PostgreSQL Database & Auth), and **Xendit Payment Gateway** (supporting GCash, Maya, Cards, and BSP QRPH standard).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys and Xendit Sandbox API credentials.

### 3. Run Development Server
```bash
npm run dev
```
The API server will launch on `http://localhost:3000`. Test the health check endpoint:
```bash
curl http://localhost:3000/api/health
```

---

## 🛠️ Tech Stack & Integrations

- **Framework**: Next.js 14 (App Router REST API)
- **Database & Auth**: Supabase (PostgreSQL with RLS + Supabase Auth)
- **Payments**: Xendit Node SDK (Invoices + QRPH Standard for GCash/Maya)
- **Deployment**: Hostinger VPS (Nginx + PM2 + Node.js 20 + Let's Encrypt SSL)

---

## 📖 Comprehensive Guides & Documentation

All setup instructions are documented in the `docs/` folder:

1. ⚡ **[Supabase Setup Guide](file:///C:/Users/LUNA/homesure/docs/SUPABASE_SETUP_GUIDE.md)**: Database schema creation, RLS policies, Auth setup, and credentials.
2. 💳 **[Xendit & QRPH Integration Guide](file:///C:/Users/LUNA/homesure/docs/XENDIT_INTEGRATION_GUIDE.md)**: Invoices API, QRPH code generation, Webhook callback security token configuration, and testing.
3. 🚀 **[Hostinger Deployment Guide](file:///C:/Users/LUNA/homesure/docs/HOSTINGER_DEPLOYMENT_GUIDE.md)**: Step-by-step deployment on Hostinger VPS / Cloud Hosting, Nginx reverse proxy, PM2 process management, and free SSL setup.
4. 📚 **[Backend API Reference](file:///C:/Users/LUNA/homesure/docs/BACKEND_API_REFERENCE.md)**: Complete list of API endpoints, parameters, and example JSON payloads.

---

## 🗄️ Database Schemas

- `supabase/schema.sql`: Complete SQL script to initialize tables (`profiles`, `listings`, `viewing_requests`, `payments`, `messages`, `reviews`), triggers, enums, and RLS policies.
- `supabase/seed.sql`: Seed data matching the frontend demo data.

---

## 🔌 Connecting Existing HTML Frontend to Backend

Include the API client adapter in your HTML files:
```html
<script src="/assets/js/api-client.js"></script>
<script>
  // Example: Fetch listings from Next.js backend API
  HomeSureAPI.getListings().then(data => {
    console.log('Listings from backend:', data.listings);
  });
</script>
```
