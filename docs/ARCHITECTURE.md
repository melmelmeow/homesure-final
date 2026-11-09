# Kasafide Architecture Documentation

This document describes the high-level system design, subsystem relationships, database architecture, and integration flows for the **Kasafide** platform (`homesure-final`).

---

## 1. System Overview

Kasafide is a real estate and property service platform delivering modern web experiences, seamless digital payment processing, identity/document verification, and web search analytics tracking.

```mermaid
flowchart TD
    Client[Browser / Client App] -->|HTTPS Requests| NextServer[Next.js 14 App Router]
    
    subgraph Frontend & Middleware Layer
        NextServer --> Middleware[middleware.ts Auth Guard]
        NextServer --> RSC[React Server Components]
        NextServer --> ClientComp[React Client Components]
    end

    subgraph API Route Layer
        NextServer --> APIPayments[src/app/api/payments]
        NextServer --> APIRefunds[src/app/api/refunds]
        NextServer --> APIAnalytics[src/app/api/analytics]
        NextServer --> APIVerify[src/app/api/verify]
    end

    subgraph External & Storage Services
        APIPayments -->|Xendit SDK| Xendit[Xendit Payment Gateway]
        APIRefunds -->|Xendit SDK| Xendit
        APIAnalytics -->|googleapis| GSC[Google Search Console]
        APIVerify -->|googleapis / Vision| GoogleCloud[Google Cloud Platform]
        NextServer -->|@supabase/ssr| SupabaseDB[(Supabase PostgreSQL DB & Auth)]
    end
```

---

## 2. Technical Stack Matrix

| Architecture Layer | Technology | Version | Key Responsibilities |
|---|---|---|---|
| **Framework** | Next.js | 14.2.x | App Router, Server-Side Rendering (SSR), Server Actions, Route Handlers |
| **Language** | TypeScript | 5.x | Static typing across server and client layers |
| **Styling** | Tailwind CSS | 3.4.x | Utility-first CSS framework and design system |
| **Database & Auth** | Supabase | PostgreSQL / `@supabase/ssr` | Persistent storage, Auth session management, Row Level Security (RLS) |
| **Payments** | Xendit Node SDK | 6.1.x | Payment invoice generation, payout handling, webhook processing |
| **Integrations** | Google APIs | 173.0.x | Google Search Console sync, document verification / OCR |
| **Runtime & Build** | Node.js | >=18 | Serverless API runtime and build pipeline |

---

## 3. Key Subsystems & Data Flows

### 3.1 Authentication & Session Management
- Managed via `@supabase/ssr` and Next.js middleware (`src/middleware.ts`).
- Middleware checks incoming requests, refreshes session tokens, and guards protected routes.
- RLS policies on Supabase tables ensure data isolation between user roles.

### 3.2 Payment & Invoice Processing (Xendit)
- Route handlers located in `src/app/api/payments/` handle invoice creation.
- Upon user payment initiation, Kasafide calls the Xendit SDK (`xendit-node`) to generate hosted invoice links or checkout sessions.
- Xendit dispatches asynchronous webhook notifications to callback route handlers, which update payment statuses in Supabase.

### 3.3 Analytics & Verification (Google Cloud APIs)
- Route handlers in `src/app/api/analytics/gsc-sync` sync performance data from Google Search Console.
- Route handlers in `src/app/api/verify/ocr` perform document verification and image processing via Google Cloud Vision/OCR APIs.

---

## 4. Directory Blueprint & Responsibilities

```text
homesure-final/
├── docs/
│   ├── ARCHITECTURE.md    # System architecture and technical specs (this file)
│   └── SPECS/             # Detailed feature requirements and specs
├── src/
│   ├── app/               # App Router pages and serverless API endpoints
│   │   ├── api/           # Backend API route handlers
│   │   │   ├── analytics/ # GSC sync endpoints
│   │   │   ├── payments/  # Xendit payment creation & callbacks
│   │   │   ├── refunds/   # Payment refund handlers
│   │   │   └── verify/    # OCR verification handlers
│   │   ├── globals.css    # Global Tailwind styles
│   │   ├── layout.tsx     # Root application layout
│   │   └── page.tsx       # Main homepage view
│   ├── components/        # UI components (buttons, forms, layout elements)
│   ├── lib/               # Service client wrappers (Supabase, Xendit, Google)
│   └── middleware.ts      # Authentication guard & session refresh
├── supabase/              # Database migrations & configuration
├── .gemini/               # AI workspace context and guardrail prompts
└── GEMINI.md              # AI agent manual
```

---

## 5. Security & Deployment Architecture

### 5.1 Security Controls
- **Environment Isolation**: Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `XENDIT_SECRET_KEY`) are kept isolated on the server runtime and never sent to client bundles.
- **Webhook Signature Verification**: Webhook callbacks validate incoming tokens/signatures (`XENDIT_CALLBACK_TOKEN`) prior to processing payment state mutations.
- **Row Level Security (RLS)**: PostgreSQL tables strictly enforce user access boundaries via Supabase policies.

### 5.2 Deployment Pipeline
- Hosted on serverless edge networks (e.g. Vercel / Node.js runtime).
- Build command: `npm run build`
- Type check step: `npm run typecheck`
- Linting step: `npm run lint`
