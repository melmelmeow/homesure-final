# ⚡ Supabase Setup & Integration Guide for HomeSure

This document provides a step-by-step guide on connecting and configuring **Supabase** (Database, Authentication, Row Level Security, Storage) for the HomeSure Next.js backend.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Step 1: Create a Supabase Project](#step-1-create-a-supabase-project)
3. [Step 2: Database Schema & Migration](#step-2-database-schema--migration)
4. [Step 3: Environment Credentials](#step-3-environment-credentials)
5. [Step 4: Supabase Client Architecture](#step-4-supabase-client-architecture)
6. [Step 5: Authentication Configuration](#step-5-authentication-configuration)
7. [Step 6: Row-Level Security (RLS) & Policies](#step-6-row-level-security-rls--policies)
8. [Testing & Verification](#testing--verification)

---

## 🎯 Overview

HomeSure uses Supabase for:
- **PostgreSQL Database**: Storing Profiles, Listings, Viewing Requests, Payments, Messages, and Reviews.
- **Supabase Auth**: Handling User Registration, JWT authentication, and User Roles (`buyer`, `seller`, `admin`, `super-admin`).
- **Row Level Security (RLS)**: Enforcing data access policies at the database layer.

---

## 1️⃣ Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Choose your organization and specify:
   - **Name**: `homesure-db`
   - **Database Password**: Set a secure password and record it.
   - **Region**: Choose **Singapore (ap-southeast-1)** for low latency in the Philippines.
4. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2️⃣ Step 2: Database Schema & Migration

1. In your Supabase Dashboard, open the **SQL Editor** tab from the left sidebar.
2. Click **New Query**.
3. Open `supabase/schema.sql` from the HomeSure project folder and paste the entire script.
4. Click **Run** to create:
   - Enum types (`user_role`, `listing_status`, `viewing_status`, `payment_status`, `payment_method`, `payment_type`).
   - Tables (`profiles`, `listings`, `viewing_requests`, `payments`, `messages`, `reviews`).
   - Automated timestamp update triggers.
   - User creation trigger (`on_auth_user_created`) mapping Supabase Auth users to `public.profiles`.
   - Row Level Security (RLS) policies.

*(Optional)* Run `supabase/seed.sql` in the SQL Editor to insert test data.

---

## 3️⃣ Step 3: Environment Credentials

1. In Supabase Dashboard, navigate to **Project Settings** -> **API**.
2. Copy the following keys:
   - **Project URL**: `https://<your-project-id>.supabase.co`
   - **anon / public key**: Used on client side
   - **service_role key**: Used only in backend API routes (bypasses RLS)
3. Paste them into your `.env.local` or host environment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> ⚠️ **SECURITY WARNING**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser scripts or frontend repositories.

---

## 4️⃣ Step 4: Supabase Client Architecture

The backend project includes three dedicated Supabase client instantiations:

1. **Browser Client** (`lib/supabase/client.ts`):
   ```typescript
   import { createBrowserClient } from '@supabase/ssr';
   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   }
   ```
2. **Server Client** (`lib/supabase/server.ts`): Uses Next.js cookies to track logged-in user session in SSR & API routes.
3. **Admin Client** (`lib/supabase/admin.ts`): Uses `SUPABASE_SERVICE_ROLE_KEY` to update payments when Xendit sends webhooks.

---

## 5️⃣ Step 5: Authentication Configuration

1. In Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Add your application domain to **Site URL**:
   - Development: `http://localhost:3000`
   - Production (Hostinger): `https://yourdomain.com`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

---

## 6️⃣ Step 6: Row-Level Security (RLS) & Policies

All HomeSure tables operate with **RLS enabled**. Key policies include:

| Table | Policy Name | Access Type | Description |
| :--- | :--- | :--- | :--- |
| `profiles` | Public profiles are viewable by everyone | SELECT | Anyone can view profiles |
| `profiles` | Users can update own profile | UPDATE | Users can only modify their own profile |
| `listings` | Listings are viewable by everyone | SELECT | Public property catalog |
| `listings` | Sellers can create/update listings | INSERT/UPDATE | Sellers manage their property listings |
| `payments` | Users view own payments | SELECT | Payers/Payees see their transactions |

---

## 🧪 Testing & Verification

Run the test endpoint or check health API:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "online",
  "app": "HomeSure Next.js Backend API",
  "services": {
    "supabase": "configured",
    "xendit": "configured"
  }
}
```
