# Application Stack Overview

| Layer | Technology / Library | Purpose | Key Files |
|-------|----------------------|---------|-----------|
| **Frontend** | **Next.js 14** (React 18) | Full‑stack React framework with server‑side rendering, API routes, and static generation. | [`src/app`](file:///home/slick2/lando/homesure-final/src/app) |
| | **TypeScript** | Static typing for both client and server code. | `tsconfig.json` (in repo root) |
| | **Tailwind CSS 3** + **PostCSS** + **Autoprefixer** | Utility‑first CSS framework for styling. | `tailwind.config.js`, `postcss.config.js`, `src/app/globals.css` |
| | **React DOM** | Rendering React components into the browser. | `package.json` → `"react"` / `"react-dom"` |
| **Backend / API** | **Next.js API routes** (`src/app/api/...`) | Server‑less functions handling authentication, payments, refunds, analytics, etc. | `src/app/api/*/route.ts` |
| | **Supabase** (client & server SDK) | Managed PostgreSQL database, authentication, edge functions, RLS policies. | `src/lib/supabase/*` |
| | **Xendit‑Node SDK** (`^6.1.0`) | Payment gateway integration (payouts, refunds, etc.). | `src/app/api/payments/create-invoice/route.ts`, `src/app/api/refunds/*/route.ts` |
| | **Google APIs** (`googleapis` ^173) | Used for GSC sync, OCR verification, etc. | `src/app/api/analytics/gsc-sync/route.ts`, `src/app/api/verify/ocr/route.ts` |
| **Database** | **PostgreSQL** (via Supabase) | Persistent relational storage. | Supabase migration scripts in `supabase/migrations/` |
| **Deployment** | **Vercel** (implied by Next.js project structure & `vercel.svg` asset) | Edge‑network hosting for Next.js apps. | `vercel.json` (if present) |
| **Testing / Linting** | **ESLint** (`eslint-config-next`) | Code quality enforcement. | `.eslintrc.json` |
| | **TypeScript compiler** (`tsc --noEmit`) | Type checking as part of `npm run typecheck`. | `package.json` → `"typecheck"` script |
| **Package Management** | **npm** (node_modules) | Dependency installation. | `package.json` |
| **Runtime** | **Node.js (>=18)** | Executes server‑side code & build scripts. | `engines` field (if any) in `package.json` |

### Key Dependency List (from `package.json`)

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.12.4",
    "@supabase/supabase-js": "^2.49.1",
    "googleapis": "^173.0.0",
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xendit-node": "^6.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.19.43",
    "@types/react": "^18.3.31",
    "@types/react-dom": "^18.3.7",
    "autoprefixer": "^10.5.4",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.35",
    "postcss": "^8.5.25",
    "tailwindcss": "^3.4.19",
    "typescript": "^5"
  }
}
```

### Quick Summary
- **Framework**: Next.js 14 (React 18) with TypeScript.
- **Styling**: Tailwind CSS 3.
- **Database & Auth**: Supabase (PostgreSQL).
- **Payments**: Xendit (via `xendit-node`).
- **Other integrations**: Google APIs (e.g., Search Console sync, OCR).
- **Build / Deploy**: Typically Vercel (edge‑ready) but can run on any Node.js host.

Feel free to ask for deeper details on any specific layer (e.g., Supabase schema, payment flow, or deployment configuration).
