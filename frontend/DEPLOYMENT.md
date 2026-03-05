# Deployment Guide (Vercel + Shopify)

## 1) Vercel project setup

- Import this repo into Vercel.
- Set **Root Directory** to `frontend/`.
- Build command: `npm run build`
- Output: Next.js default

## 2) Domain and DNS

Use `app.uplifttechnologies.pro` as the Shopify App URL.

1. In Vercel project → **Settings → Domains**, add `app.uplifttechnologies.pro`.
2. In DNS for `uplifttechnologies.pro`, create the record Vercel asks for (usually CNAME for `app` to `cname.vercel-dns.com`).
3. Wait for SSL issuance and domain verification in Vercel.

## 3) Frontend environment variables (Vercel)

```bash
NEXT_PUBLIC_SHOPIFY_API_KEY=...
NEXT_PUBLIC_BACKEND_BASE_URL=https://<backend-domain>
NEXT_PUBLIC_APP_BASE_URL=https://app.uplifttechnologies.pro
NEXT_PUBLIC_SUPPORT_EMAIL=support@uplifttechnologies.pro
NEXT_PUBLIC_SUPPORT_URL=https://uplifttechnologies.pro/support
```

## 4) Backend environment alignment (no backend code changes)

- `SHOPIFY_APP_URL=https://app.uplifttechnologies.pro`
- `ALLOWED_ORIGINS` must include `https://app.uplifttechnologies.pro`

## 5) Shopify Partner / Dev Dashboard settings

- **App URL**: `https://app.uplifttechnologies.pro`
- **Allowed redirection URL(s)**:
  - `https://<backend-domain>/api/auth/callback`
  - Any frontend auth bounce route if added later.

## 6) Embedded auth and iframe notes

- Frontend sends session token on every backend request via `Authorization: Bearer <token>`.
- CSP `frame-ancestors` is set dynamically in middleware for embedded HTML routes.
