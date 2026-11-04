# GEMINI AI Developer Manual - HomeSure Platform

Welcome to the **HomeSure** repository (`homesure-final`). This operational manual guides Gemini and Antigravity AI agents in navigating, maintaining, and developing features across this repository.

---

## 1. Quick Reference Commands

| Task | Command | Description |
|---|---|---|
| **Development Server** | `npm run dev` | Starts Next.js dev server with hot reload at `http://localhost:3000` |
| **Production Build** | `npm run build` | Builds optimized production bundle |
| **Start Production** | `npm start` | Runs production server after build |
| **Type Check** | `npm run typecheck` | Executes `tsc --noEmit` to verify TypeScript types |
| **Linter** | `npm run lint` | Runs Next.js ESLint verification |

---

## 2. Workspace Overview

- **Frontend Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 3
- **Database & Auth**: Supabase (PostgreSQL with RLS, `@supabase/ssr`)
- **Payment Gateway**: Xendit (`xendit-node`)
- **Integrations**: Google APIs (`googleapis` for GSC sync & OCR processing)
- **Deployment Target**: Vercel / Node.js Serverless Environment

---

## 3. Project Structure

```text
homesure-final/
├── .gemini/               # AI agent context, history, and prompt templates
│   ├── context.md         # Active technical context & rules
│   ├── history.md         # Architecture decision & change log
│   └── prompts/           # Agent execution templates (refactor, test-gen)
├── docs/                  # System documentation
│   ├── ARCHITECTURE.md    # Detailed system design & architecture
│   └── SPECS/             # Specs and feature requirements
├── src/
│   ├── app/               # Next.js App Router routes & endpoints
│   │   ├── api/           # API routes (payments, refunds, analytics, verify)
│   │   ├── globals.css    # Tailwind CSS imports
│   │   ├── layout.tsx     # Root layout wrapper
│   │   └── page.tsx       # Main home view
│   ├── components/        # Reusable React components
│   ├── lib/               # Utility modules (Supabase, Xendit, Google clients)
│   └── middleware.ts      # Supabase authentication session middleware
├── supabase/              # Database migrations & schemas
├── documentation/         # Supplemental stack specifications
├── GEMINI.md              # AI developer operational guide (this file)
└── .geminiignore          # Exclusion rules for AI context processing
```

---

## 4. Environment Variables Reference

Ensure `.env.local` contains valid credentials when running operations locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

XENDIT_SECRET_KEY=xnd_development_...
XENDIT_CALLBACK_TOKEN=<your-webhook-callback-token>

GOOGLE_CLOUD_PROJECT_ID=<your-project-id>
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json

GOOGLE_SEARCH_CONSOLE_CLIENT_ID=<your-client-id>
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=<your-refresh-token>
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://homesure.ph
```

> [!IMPORTANT]
> **Security Rule**: `SUPABASE_SERVICE_ROLE_KEY` and `XENDIT_SECRET_KEY` MUST NOT be prefixed with `NEXT_PUBLIC_` or exposed to client-side code bundles under any circumstances.

---

## 5. Development Workflow & Agent Guardrails

1. **Code Modification**:
   - Inspect files completely before modifying.
   - Respect strict TypeScript types. Avoid `any`.
   - Use Server Components by default; add `'use client'` only when interactive state/event handlers are required.
2. **Verification Protocol**:
   - Run `npm run typecheck` after any TS code modification.
   - Run `npm run build` or `npm run lint` when structural changes occur.
3. **Logging & History**:
   - Record significant refactors or architectural updates in `.gemini/history.md`.
