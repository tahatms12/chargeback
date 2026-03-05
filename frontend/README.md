# Chargeback Tracker Frontend

This is a standalone Next.js (App Router + TypeScript) Shopify embedded-app frontend for the existing FastAPI backend.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_SHOPIFY_API_KEY=...
   NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPPORT_EMAIL=support@uplifttechnologies.pro
   NEXT_PUBLIC_SUPPORT_URL=https://uplifttechnologies.pro/support
   ```
3. Start frontend:
   ```bash
   npm run dev
   ```
4. Open the app through Shopify Admin app launch (embedded context), not directly.

## Auth behavior

- App Bridge is initialized with `host` and `NEXT_PUBLIC_SHOPIFY_API_KEY`.
- Every backend request gets a fresh session token (`getSessionToken`) and sends `Authorization: Bearer <token>`.
- `401` responses redirect to backend OAuth install: `${NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/install?shop=...`.

## CSP / iframe protection

`src/middleware.ts` sets dynamic `Content-Security-Policy` `frame-ancestors` headers based on `shop` query param:

- Embedded requests: `frame-ancestors https://{shop} https://admin.shopify.com;`
- Standalone legal routes without `shop`: `frame-ancestors 'none';`

The middleware removes `X-Frame-Options` to avoid iframe conflicts.
