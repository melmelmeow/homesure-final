# 📚 HomeSure Backend API Reference Documentation

Complete API specification for the Next.js backend API routes.

---

## 📍 Base URL
- **Local Development**: `http://localhost:3000/api`
- **Production (Hostinger)**: `https://yourdomain.com/api`

---

## 1. System Health
### `GET /api/health`
Checks server status and connected services.

**Response `200 OK`**:
```json
{
  "status": "online",
  "app": "HomeSure Next.js Backend API",
  "timestamp": "2026-10-09T15:50:00.000Z",
  "services": {
    "supabase": "configured",
    "xendit": "configured"
  }
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Registers a new user account (buyer or seller).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Juan Dela Cruz",
  "role": "buyer",
  "phone": "+639171234567"
}
```

**Response `201 Created`**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "full_name": "Juan Dela Cruz",
    "role": "buyer"
  }
}
```

### `POST /api/auth/login`
Authenticates user and returns session.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response `200 OK`**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "full_name": "Juan Dela Cruz",
    "role": "buyer"
  },
  "session": { "access_token": "jwt..." }
}
```

---

## 3. Property Listings

### `GET /api/listings`
Retrieve property listings with optional filters.

**Query Parameters**:
- `location` (string): Search location keyword (e.g. `BGC`, `Makati`)
- `type` (string): Property type (`condo`, `house`, `apartment`)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter

**Response `200 OK`**:
```json
{
  "listings": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "title": "Modern 2BR Condo in BGC Taguig",
      "price": 35000,
      "location": "Bonifacio Global City, Taguig",
      "bedrooms": 2,
      "bathrooms": 2,
      "status": "available",
      "images": ["https://..."],
      "seller": {
        "full_name": "Maria Santos",
        "phone": "+639189876543"
      }
    }
  ]
}
```

### `POST /api/listings`
Create a new property listing.

---

## 4. Payments & Xendit

### `POST /api/payments/create-invoice`
Creates Xendit Checkout Invoice supporting GCash, Maya, QRPH, and Cards.

**Request Body**:
```json
{
  "amount": 35000,
  "user_id": "uuid-v4",
  "payer_email": "tenant@example.com",
  "description": "BGC Condo Monthly Rent",
  "payment_type": "rent"
}
```

**Response `201 Created`**:
```json
{
  "message": "Payment invoice created successfully",
  "checkout_url": "https://checkout.xendit.co/web/inv_...",
  "external_id": "INV-1728489200-123"
}
```

### `POST /api/payments/create-qr`
Generates a dynamic QRPH payment code for GCash & Maya scanning.

**Request Body**:
```json
{
  "amount": 35000,
  "user_id": "uuid-v4"
}
```

**Response `201 Created`**:
```json
{
  "message": "QRPH payment code created successfully",
  "qr_string": "00020101021226...",
  "external_id": "QRPH-1728489200-456"
}
```

### `POST /api/payments/webhook`
Xendit Webhook Callback receiver. (Secured via `x-callback-token` header).

---

## 5. Viewing Requests

### `POST /api/viewing-requests`
Submit appointment request to view property.

**Request Body**:
```json
{
  "listing_id": "uuid-v4",
  "buyer_id": "uuid-v4",
  "seller_id": "uuid-v4",
  "preferred_date": "2026-10-15",
  "preferred_time": "14:00:00",
  "notes": "Would like to see unit facing sunset"
}
```

---

## 6. Admin & Analytics

### `GET /api/admin/analytics`
Fetches high-level metrics for admin dashboard.

**Response `200 OK`**:
```json
{
  "analytics": {
    "total_users": 150,
    "total_listings": 42,
    "total_viewings": 89,
    "total_payments": 34,
    "total_revenue_php": 1190000
  }
}
```
