# Shopify Production Mapping (Subdomain Hosting)

## Folder to production URL

- `app/` + root Python services (Chargeguard): `https://chargeguard.uplifttechnologies.pro`
- `customsready/`: `https://customsready.uplifttechnologies.pro`
- `poref/`: `https://poref.uplifttechnologies.pro`
- `Craftline/` (Maker Queue): `https://makerqueue.uplifttechnologies.pro`
- `FixitCSV/`: `https://fixitcsv.uplifttechnologies.pro`
- `Stagewise/`: `https://stagewise.uplifttechnologies.pro`

## Canonical Shopify callback/webhook conventions

Each Shopify app should use its own subdomain:

- OAuth callback: `https://<app-subdomain>.uplifttechnologies.pro/auth/callback`
- Webhook endpoint: `https://<app-subdomain>.uplifttechnologies.pro/webhooks`
- Embedded app internal return URL: `https://<app-subdomain>.uplifttechnologies.pro/app`

## Environment ownership

Set app URL values per project in Vercel environment variables:

- `SHOPIFY_APP_URL` = exact app subdomain URL
- `APP_URL` / `PUBLIC_BASE_URL` / `SITE_URL` equivalents = same app subdomain URL where applicable
- Keep only secrets as placeholders (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, database credentials, tokens)
