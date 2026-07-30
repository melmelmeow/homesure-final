This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Run locally

- Install dependencies:

```bash
npm install
```

- Create a copy of `.env.local.example` named `.env.local` and fill in the values for your environment (Supabase, Xendit, Google credentials):

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_CALLBACK_TOKEN=your-webhook-callback-token

GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json

GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your-client-id
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=your-client-secret
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://homesure.ph
```

- Start development server:

```bash
npm run dev
```

- Build for production and run:

```bash
npm run build
npm start
```

## Useful scripts

- `npm run dev` — run Next.js in development mode (hot reload at http://localhost:3000)
- `npm run build` — build the production bundle
- `npm start` — start the built production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript type check

## Notes & troubleshooting

- Ensure Node.js (v18+) and npm are installed.
- If you see authentication or Supabase errors, confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct and present in `.env.local`.
- For server-side operations requiring elevated privileges, set `SUPABASE_SERVICE_ROLE_KEY` only on server/runtime (do NOT expose it to the browser).
- Verify the path in `GOOGLE_CLOUD_KEY_FILE` points to a valid service account JSON file accessible to the runtime.
- If images fail to load from Supabase or external services, check `next.config.mjs` remote patterns.
# homesure-final
