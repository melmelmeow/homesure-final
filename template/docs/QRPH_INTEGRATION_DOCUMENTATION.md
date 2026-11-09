# 📘 QRPH Payment Integration - Documentation for Capstone Defense

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Payment Flow](#payment-flow)
5. [Security Implementation](#security-implementation)
6. [File Structure](#file-structure)
7. [How to Test](#how-to-test)
8. [Production Deployment Notes](#production-deployment-notes)
9. [Defense Q&A](#defense-qa)

---

## 🎯 Overview

HomeSure integrates **QRPH** as its payment gateway to facilitate secure rental payments between tenants and landlords. QRPH is a licensed payment service provider in the Philippines that supports multiple payment methods including GCash, Maya (PayMaya), and credit/debit cards.

### Why QRPH?
- ✅ **Licensed in Philippines** - Compliant with BSP regulations
- ✅ **Multiple Payment Methods** - GCash, Maya, Cards
- ✅ **Developer-Friendly API** - Well-documented REST API
- ✅ **Test Mode Available** - Safe testing without real money
- ✅ **Webhook Support** - Real-time payment notifications

---

## 🏗️ Architecture

### Current Implementation (Prototype/Demo)
```
┌─────────────────────────────────────────────────────────┐
│           FRONTEND (HTML/CSS/JavaScript)                 │
│  • User clicks "Pay Now"                                 │
│  • Payment modal opens                                   │
│  • Simulates payment processing                          │
│  • Shows success confirmation                            │
│  • Stores transaction in localStorage                    │
└─────────────────────────────────────────────────────────┘
```

### Production Implementation (How it SHOULD work with real backend)
```
┌───────────────────────────────────────────────────────────┐
│                   FRONTEND (Browser)                       │
│  1. User clicks "Pay Now"                                  │
│  2. Sends payment request to backend                       │
│  4. Receives checkout URL                                  │
│  5. Redirects to QRPH checkout                         │
│  8. Returns from QRPH                                  │
│  9. Shows payment status                                   │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Node.js/PHP)                  │
│  3. Creates Payment Intent with QRPH                   │
│     (using SECRET KEY - never exposed to frontend)         │
│  6. Receives webhook from QRPH                         │
│  7. Updates database with payment status                   │
│  10. Serves payment receipt                                │
└────────────────┬──────────────────────┬──────────────────┘
                 │                      │
                 ▼                      ▼
┌──────────────────────────┐  ┌────────────────────────────┐
│   QRPH API           │  │   DATABASE (MongoDB/MySQL) │
│   • Processes payment    │  │   • Users                  │
│   • Sends webhooks       │  │   • Transactions           │
│   • Returns status       │  │   • Listings               │
└──────────────────────────┘  └────────────────────────────┘
```

---

## 💻 Technology Stack

### Current (Demo/Prototype)
```javascript
Frontend:  HTML5 + CSS3 + Vanilla JavaScript
Storage:   localStorage (temporary)
Payment:   Simulated QRPH flow (no real API calls)
```

### Required for Production
```javascript
Frontend:  HTML5 + CSS3 + Vanilla JavaScript
Backend:   Node.js + Express (or PHP + Laravel)
Database:  MongoDB (or MySQL/PostgreSQL)
Payment:   QRPH API
Hosting:   Heroku/Railway (backend) + Netlify/Vercel (frontend)
```

---

## 💳 Payment Flow

### Step-by-Step Process

#### 1. **Payment Initiation**
```javascript
// Tenant clicks "Pay Now" button
PaymentIntegration.openPaymentModal({
  amount: 15000,              // Amount in pesos
  listingTitle: "2BR Apt",    // Property being paid for
  listingId: "prop-001",      // Property reference
  landlordId: "usr-003",      // Landlord ID
  period: "June 2026",        // Rental period
  dueDate: "2026-07-01"       // Payment due date
});
```

#### 2. **Payment Method Selection**
User chooses from available payment methods:
- **GCash** - E-wallet payment
- **Maya** - E-wallet payment (formerly PayMaya)
- **Credit/Debit Card** - Visa, Mastercard, JCB

#### 3. **Payment Processing**
```javascript
// In production, this would:
// 1. Send request to YOUR backend server
// 2. Backend creates QRPH Payment Intent:

const paymentIntent = await QRPH.paymentIntents.create({
  data: {
    attributes: {
      amount: 1500000,  // Amount in centavos (₱15,000.00)
      payment_method_allowed: ['gcash', 'paymaya', 'card'],
      currency: 'PHP',
      description: 'Rent Payment - June 2026'
    }
  }
});

// 3. Backend returns checkout URL to frontend
// 4. Frontend redirects user to QRPH checkout page
window.location.href = checkoutUrl;
```

#### 4. **Payment Confirmation**
```javascript
// After payment on QRPH:
// 1. QRPH redirects back to your site
// 2. QRPH sends webhook to your backend
// 3. Backend verifies payment and updates database
// 4. Frontend shows success message
```

#### 5. **Transaction Recording**
```javascript
// Transaction stored in database with:
{
  id: 'TXN-1234567890',
  QRPHPaymentId: 'pi_xxxxxxxxxxxxx',  // From QRPH
  amount: 15000,
  status: 'confirmed',
  method: 'gcash',
  reference: 'GC-12345678',
  tenantId: 'usr-001',
  landlordId: 'usr-003',
  listingId: 'prop-001',
  paidDate: '2026-06-15T10:30:00Z'
}
```

---

## 🔒 Security Implementation

### 1. **API Key Management**
```javascript
// ❌ NEVER do this (exposes secret key):
const secretKey = 'sk_test_xxxxxxxxxxxxx';

// ✅ CORRECT way:
// Store secret key in backend .env file
// Frontend NEVER sees the secret key
```

**Environment Variables (.env file on backend):**
```bash
QRPH_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
QRPH_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
QRPH_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 2. **Webhook Signature Verification**
```javascript
// Backend webhook receiver must verify signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.QRPH_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### 3. **Payment Verification**
```javascript
// Always verify payment status from QRPH API
// NEVER trust client-side data alone
const payment = await QRPH.paymentIntents.retrieve(paymentId);

if (payment.data.attributes.status === 'succeeded') {
  // Update database
  // Mark payment as confirmed
}
```

### 4. **User Authentication**
```javascript
// Only allow authenticated users to initiate payments
// Verify user owns the rental agreement
if (!isAuthenticated || !hasActiveRental) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## 📁 File Structure

```
HomeSure/
├── assets/
│   ├── css/
│   │   └── payment-modal.css          # Payment modal styles
│   └── js/
│       └── payment-integration.js     # Payment flow logic
├── module/
│   └── buyer/
│       └── payments.html              # Payments page
└── QRPH_INTEGRATION_DOCUMENTATION.md  # This file
```

### Key Files Explained

#### 1. `payment-modal.css`
- Styles for payment modal
- QRPH-inspired design
- Responsive mobile-friendly layout
- Loading/success/error states

#### 2. `payment-integration.js`
- Payment flow orchestration
- Modal management
- Transaction creation
- localStorage integration (demo)
- Heavily commented for understanding

#### 3. `payments.html`
- Main payments page
- Integrates payment modal
- Shows payment history
- "Pay Now" button

---

## 🧪 How to Test

### Testing the Demo

1. **Open Payments Page**
   ```
   http://localhost:3000/module/buyer/payments.html
   ```
   (or open directly in browser)

2. **Click "Pay Now (QRPH)" button**

3. **Select Payment Method**
   - Click on GCash, Maya, or Card option

4. **Click "Pay ₱15,000" button**

5. **Watch Processing Animation**
   - Simulates API call delay (3 seconds)

6. **View Success Screen**
   - Shows transaction ID
   - Shows reference number
   - Shows payment details

7. **Check Transaction Storage**
   ```javascript
   // Open browser console and run:
   localStorage.getItem('homesure_transactions');
   ```

### Testing in Production (With Real QRPH)

1. **Sign up for QRPH Test Account**
   - Go to https://developers.QRPH.com
   - Create free account
   - Get test API keys

2. **Use Test Credit Card**
   ```
   Card Number: 4123 4500 0000 0008
   Expiry: Any future date
   CVC: Any 3 digits
   ```

3. **Use Test GCash**
   - QRPH provides test phone number
   - Will not charge real money

4. **Check Dashboard**
   - View test transactions at dashboard.QRPH.com

---

## 🚀 Production Deployment Notes

### What's Needed for Real Deployment

#### 1. **Backend Server**
```bash
# Example: Node.js + Express backend
npm install express QRPH dotenv

# Create server.js:
```
```javascript
const express = require('express');
const QRPH = require('QRPH');

const app = express();
app.use(express.json());

// Initialize QRPH
const client = QRPH.client(process.env.QRPH_SECRET_KEY);

// Create payment intent
app.post('/api/create-payment', async (req, res) => {
  const { amount, description } = req.body;
  
  const paymentIntent = await client.paymentIntents.create({
    data: {
      attributes: {
        amount: amount * 100, // Convert to centavos
        payment_method_allowed: ['gcash', 'paymaya', 'card'],
        currency: 'PHP',
        description
      }
    }
  });
  
  res.json({ checkoutUrl: paymentIntent.data.attributes.next_action.redirect.url });
});

// Webhook receiver
app.post('/webhooks/QRPH', async (req, res) => {
  // Verify webhook signature
  // Update database
  // Send confirmation
  res.status(200).send('OK');
});

app.listen(3000);
```

#### 2. **Database Schema**
```sql
-- Transactions table
CREATE TABLE transactions (
  id VARCHAR(50) PRIMARY KEY,
  QRPH_payment_id VARCHAR(100),
  amount DECIMAL(10, 2),
  status VARCHAR(20),
  method VARCHAR(20),
  reference VARCHAR(50),
  tenant_id VARCHAR(50),
  landlord_id VARCHAR(50),
  listing_id VARCHAR(50),
  period VARCHAR(50),
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **Environment Variables**
```bash
# Production .env file
QRPH_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
QRPH_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
QRPH_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=mongodb://username:password@host:port/database
```

#### 4. **Webhook Setup**
1. Go to QRPH Dashboard
2. Create webhook endpoint: `https://yourdomain.com/webhooks/QRPH`
3. Select events:
   - `payment.paid` - Payment successful
   - `payment.failed` - Payment failed
   - `payment.refunded` - Payment refunded

---

## 💬 Defense Q&A

### Common Questions from Panelists

#### Q1: "Why did you choose QRPH over other payment gateways?"
**Answer:**
- QRPH is licensed by BSP for Philippines
- Supports popular local payment methods (GCash, Maya)
- Developer-friendly API with good documentation
- Provides test environment for safe development
- Transparent pricing with no setup fees

#### Q2: "How do you ensure payment security?"
**Answer:**
1. **API Key Protection** - Secret keys stored on backend only
2. **Webhook Verification** - Verify signatures from QRPH
3. **HTTPS Encryption** - All data transmitted encrypted
4. **Payment Verification** - Always verify with QRPH API
5. **User Authentication** - Only authenticated users can pay
6. **No Card Storage** - Card data never touches our servers

#### Q3: "What happens if payment fails?"
**Answer:**
1. QRPH returns error status
2. Webhook notifies our backend
3. Transaction marked as 'failed' in database
4. User receives error message
5. No money is deducted from user
6. User can retry payment
7. Landlord not notified of failed payment

#### Q4: "How do you handle refunds?"
**Answer:**
1. Landlord/Admin initiates refund in system
2. Backend calls QRPH refund API
3. QRPH processes refund to original payment method
4. Webhook confirms refund completion
5. Database updated with refund status
6. Both parties receive email notification
7. Refund typically completes in 5-10 business days

#### Q5: "Can you explain the webhook system?"
**Answer:**
Webhooks are HTTP callbacks that QRPH sends to our server when events occur:

**Flow:**
```
1. Payment completed on QRPH
2. QRPH sends POST to our webhook URL
3. Our backend verifies webhook signature
4. Updates database with payment status
5. Sends confirmation response to QRPH
6. Triggers notification to user
```

**Why needed:**
- User might close browser after payment
- Ensures payment status always accurate
- Real-time updates without polling
- More reliable than frontend-only updates

#### Q6: "Is this implementation ready for production?"
**Answer:**
Current state: **Demo/Prototype** for capstone demonstration

**What's complete:**
- ✅ User interface and flow
- ✅ Payment method selection
- ✅ Transaction recording structure
- ✅ Receipt generation
- ✅ Error handling

**What's needed for production:**
- ❌ Backend server (Node.js/PHP)
- ❌ Database (MongoDB/MySQL)
- ❌ Real QRPH API integration
- ❌ Webhook receiver
- ❌ Email notifications
- ❌ Production API keys
- ❌ SSL certificate
- ❌ Hosting setup

**Timeline to production:** 2-3 weeks with backend developer

#### Q7: "Show me the actual QRPH API calls"
**Answer:**
```javascript
// Example: Create Payment Intent
const QRPH = require('QRPH')('sk_test_xxxxx');

const paymentIntent = await QRPH.paymentIntents.create({
  data: {
    attributes: {
      amount: 1500000,  // ₱15,000.00 in centavos
      payment_method_allowed: [
        'gcash',
        'grab_pay',
        'paymaya',
        'card'
      ],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any'
        }
      },
      currency: 'PHP',
      description: 'Rent Payment - 2BR Apt June 2026',
      statement_descriptor: 'HomeSure Rent'
    }
  }
});

// Example: Attach Payment Method
const attachedIntent = await QRPH.paymentIntents.attach(
  paymentIntent.id,
  {
    data: {
      attributes: {
        payment_method: paymentMethodId
      }
    }
  }
);
```

#### Q8: "How do you test without real money?"
**Answer:**
QRPH provides test mode:

**Test Cards:**
```
Success: 4123 4500 0000 0008
Decline: 4571 7360 0000 0010
```

**Test GCash:**
- Use test phone numbers provided by QRPH
- Simulates real flow without charges

**Test Environment:**
- Use `sk_test_` and `pk_test_` keys
- All transactions in test dashboard
- No real money involved
- Can reset test data anytime

---

## 📚 Additional Resources

### Official Documentation
- QRPH API: https://developers.QRPH.com/docs
- QRPH SDKs: https://developers.QRPH.com/docs/sdks
- Webhooks: https://developers.QRPH.com/docs/webhooks

### Integration Guides
- GCash: https://developers.QRPH.com/docs/gcash
- Maya: https://developers.QRPH.com/docs/paymaya
- Cards: https://developers.QRPH.com/docs/card-payments

### Code Examples
- Node.js: https://github.com/QRPH/QRPH-node
- PHP: https://github.com/QRPH/QRPH-php

---

## ✅ Conclusion

This payment integration demonstrates understanding of:
1. Payment gateway integration concepts
2. Security best practices
3. User experience design
4. Transaction management
5. Webhook systems
6. Error handling

The demo implementation serves as proof of concept for capstone requirements while documenting the production pathway clearly.

---

**For Questions or Clarifications:**
- Review code comments in `payment-integration.js`
- Check QRPH documentation
- Test the demo thoroughly
- Prepare to explain each step during defense

**Good luck with your capstone defense! 🎓**
