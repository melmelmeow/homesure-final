# 💳 Xendit Payment Gateway & QRPH Integration Guide

This document details how **Xendit** and **QRPH** are integrated into the HomeSure Next.js backend, covering checkout flows, QR code generation, webhook verification, and testing procedures.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Supported Payment Channels](#supported-payment-channels)
3. [Step 1: Xendit Account Setup](#step-1-xendit-account-setup)
4. [Step 2: Environment Configuration](#step-2-environment-configuration)
5. [Step 3: Payment Endpoints Architecture](#step-3-payment-endpoints-architecture)
6. [Step 4: Webhook Callback Configuration](#step-4-webhook-callback-configuration)
7. [Step 5: Testing Payments (Sandbox & QRPH)](#step-5-testing-payments-sandbox--qrph)

---

## 🎯 Overview

HomeSure processes rental payments, deposits, and service fees through Xendit. Xendit acts as the payment aggregator supporting major Philippine payment methods, particularly **QRPH** (the Bangko Sentral ng Pilipinas national QR standard for GCash, Maya, and banking apps).

---

## 📱 Supported Payment Channels

- 🟢 **GCash** (E-Wallet / QRPH)
- 🔵 **Maya** (E-Wallet / QRPH)
- 💳 **Credit / Debit Cards** (Visa, Mastercard)
- 📲 **QRPH Standard** (Scannable from any BSP-compliant banking or e-wallet app)

---

## 1️⃣ Step 1: Xendit Account Setup

1. Sign up for a [Xendit Account](https://dashboard.xendit.co/register).
2. Switch to **Test Mode** (Sandbox) on top of the Xendit dashboard.
3. Navigate to **Settings** -> **API Keys**.
4. Click **Generate secret key**:
   - Key Name: `HomeSure Backend Dev`
   - Permissions:
     - `Money In`: **Write**
     - `Invoices`: **Write**
     - `QR Codes`: **Write**
5. Save the generated key (`xnd_development_...`).

---

## 2️⃣ Step 2: Environment Configuration

Add your Xendit keys to `.env.local` or host environment settings:

```env
XENDIT_SECRET_KEY=xnd_development_your_secret_key
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_development_your_public_key
XENDIT_WEBHOOK_VERIFICATION_TOKEN=your_custom_verification_token
```

---

## 3️⃣ Step 3: Payment Endpoints Architecture

### A. Invoice Checkout Flow (`POST /api/payments/create-invoice`)

1. Frontend sends payment request:
   ```json
   {
     "amount": 35000,
     "user_id": "00000000-0000-0000-0000-000000000001",
     "payer_email": "tenant@homesure.com",
     "description": "BGC Condo Monthly Rent",
     "payment_type": "rent"
   }
   ```
2. Backend generates a Xendit Invoice and records payment as `PENDING` in Supabase.
3. Response provides `checkout_url`.
4. User is redirected to complete payment via GCash/Maya/Card.

### B. QRPH Code Generation Flow (`POST /api/payments/create-qr`)

1. Frontend sends QR generation request:
   ```json
   {
     "amount": 35000,
     "user_id": "00000000-0000-0000-0000-000000000001"
   }
   ```
2. Backend calls Xendit QR API generating a dynamic QRPH string.
3. Frontend renders the QR code for scanning.

---

## 4️⃣ Step 4: Webhook Callback Configuration

When a user completes a payment, Xendit posts a notification to your backend webhook.

1. Go to **Xendit Dashboard** -> **Settings** -> **Webhooks**.
2. Set **Invoice Paid** and **QR Code Paid** Webhook URL to:
   `https://yourdomain.com/api/payments/webhook` (or ngrok URL for local dev)
3. Set **Verification Token** to match `XENDIT_WEBHOOK_VERIFICATION_TOKEN`.

### Webhook Handling Code (`app/api/payments/webhook/route.ts`):
- Verifies `x-callback-token` header.
- Parses `external_id` and payment `status`.
- Updates `payments` record in Supabase to `PAID`.
- Automatically marks listing as `rented` upon successful rental payment.

---

## 5️⃣ Step 5: Testing Payments (Sandbox & QRPH)

### Simulating Invoice Payment in Xendit Sandbox:
1. Trigger payment creation via API.
2. Open the returned `checkout_url`.
3. Choose **GCash** or **Maya**.
4. Click **Simulate Payment** in Sandbox mode.
5. Check backend logs and database status:
   ```sql
   SELECT * FROM public.payments WHERE external_id = 'INV-...';
   ```
   Status will update to `PAID`.
