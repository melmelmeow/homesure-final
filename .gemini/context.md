# Gemini Context - HomeSure Platform

## 1. Executive Summary & Domain Context
**HomeSure** is a Philippine-based property and real estate services platform built with Next.js 14, Supabase, Xendit payment gateways, and Google Cloud integrations. The application enables users to view property listings, process payment invoices, manage transactions, perform verification/OCR processing, and sync analytics with Google Search Console.

---

## 2. Core Stack Matrix
- **Framework**: Next.js 14 (App Router, React 18, Server Components, Route Handlers)
- **Language**: TypeScript 5 (Strict Mode enabled)
- **Styling**: Tailwind CSS 3, PostCSS, Autoprefixer
- **Backend & Database**: Supabase (PostgreSQL, RLS Policies, `@supabase/ssr`, `@supabase/supabase-js`)
- **Payments Gateway**: Xendit Node SDK (`xendit-node`)
- **Integrations**: Google Cloud APIs (`googleapis` for GSC Sync, OCR verification)
- **Deployment**: Edge-ready Node.js runtime / Vercel

---

## 3. Directory Layout Blueprint
```text
homesure-final/
├── .gemini/               # AI context, history, and prompt templates
│   ├── context.md         # Active domain & technical context
│   ├── history.md         # Project evolution & AI task log
│   └── prompts/           # Guardrailed agent prompt templates
├── docs/                  # Project documentation & specs
│   ├── ARCHITECTURE.md    # In-depth architectural blueprint
│   └── SPECS/             # Functional & technical specs
├── src/
│   ├── app/               # Next.js 14 App Router routes & API endpoints
│   │   ├── api/           # Serverless API routes (payments, refunds, analytics, verify)
│   │   ├── globals.css    # Global Tailwind styles
│   │   └── page.tsx       # Root homepage entrypoint
│   ├── components/        # Shared React UI components
│   ├── lib/               # Shared libraries (Supabase, Xendit, Google clients)
│   └── middleware.ts      # Supabase auth session middleware
├── supabase/              # Database schema migrations & configurations
├── documentation/         # Legacy/supplemental stack & sitemap docs
├── GEMINI.md              # AI agent operations manual
└── .geminiignore          # AI context exclusion rules
```

---

## 4. Key Architectural Patterns & Constraints
1. **Server vs. Client Components**:
   - Default to Server Components (`React Server Components`).
   - Use `'use client'` only when requiring client-side interactivity, state hooks (`useState`, `useEffect`), or DOM events.
2. **Supabase Authentication & SSR**:
   - Use `@supabase/ssr` helpers for server-side auth & cookie management.
   - Access database queries strictly within server routes/actions or through authenticated client instances with proper Row Level Security (RLS).
   - **CRITICAL**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components or public bundles.
3. **API Route Handlers (`src/app/api/...`)**:
   - All external webhooks (Xendit, Google Cloud) and backend transactions must reside in Next.js App Router route handlers (`export async function POST(req: Request) ...`).
   - Standardize API response structures with proper HTTP status codes (`200 OK`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Error`).
4. **Type Safety & Validation**:
   - Maintain strict TypeScript compliance (`npm run typecheck`).
   - Explicitly type all incoming request payloads, DB schema mappings, and component props.

---

## 5. Development Guidelines for Agents
- Always check `.gemini/history.md` before initiating major multi-file refactors.
- Verify changes with `npm run typecheck` and `npm run build` before declaring task completion.
- Follow Tailwind CSS utility patterns for UI updates; avoid custom inline CSS or CSS modules unless strictly necessary.
