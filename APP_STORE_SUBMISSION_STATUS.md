# App Store Submission Status (Subdomain Model)

This repo is now aligned to **subdomain-based hosting** per app (no `uplifttechnologies.pro/<app>` path deployment assumptions).

## Production URL mapping

- Chargeguard / Chargeback: `https://chargeguard.uplifttechnologies.pro`
- CustomsReady: `https://customsready.uplifttechnologies.pro`
- PORef: `https://poref.uplifttechnologies.pro`
- Maker Queue (Craftline): `https://makerqueue.uplifttechnologies.pro`
- FixitCSV: `https://fixitcsv.uplifttechnologies.pro`
- Stagewise: `https://stagewise.uplifttechnologies.pro`

## Shopify URL checklist per app

For each Shopify app, confirm these values are consistent across repo + Partner Dashboard:

1. **App URL** = app subdomain root (for example `https://customsready.uplifttechnologies.pro`)
2. **Allowed redirection URL(s)** include `/auth/callback` on the same subdomain
3. **Webhook endpoint** points to `/webhooks` on the same subdomain
4. **No path-prefix deployment URL remains** (`/customsready`, `/poref`, `/fixitcsv`, etc.)

## Remaining manual checks before submission

- End-to-end install/auth flow validation in a dev store
- Embedded app load from Shopify Admin iframe
- Webhook delivery verification for configured topics
- Billing flow verification where billing is enabled
- Privacy policy/support/contact URLs in listing
- Reviewer test steps + test account preparation
