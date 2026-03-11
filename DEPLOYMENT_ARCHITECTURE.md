# Deployment Architecture (Vercel Monorepo, Per-App Projects)

## Model

This monorepo should be deployed to Vercel as **multiple projects**, one per deployable app, each with its own **Root Directory** and **subdomain**.

No deployable app should depend on path-based mounting under `https://uplifttechnologies.pro/<app>`.

## Vercel project mapping

| Vercel Project Root | Runtime | Production URL |
|---|---|---|
| `frontend/` | Next.js | `https://chargeguard.uplifttechnologies.pro` |
| `customsready/` | Remix (Shopify app) | `https://customsready.uplifttechnologies.pro` |
| `poref/` | Shopify app runtime | `https://poref.uplifttechnologies.pro` |
| `Craftline/` | Remix (Shopify app) | `https://makerqueue.uplifttechnologies.pro` |
| `FixitCSV/` | Remix (Shopify app) | `https://fixitcsv.uplifttechnologies.pro` |
| `Stagewise/` | Remix (Shopify app) | `https://stagewise.uplifttechnologies.pro` |

## Notes

- Root-level `vercel.json` has been removed to avoid forcing a single root deployment strategy.
- Shared package access remains monorepo-native; configure each Vercel project to the correct root directory.
- If a specific app requires background workers beyond Vercel capabilities, keep worker processes external while the web app remains on its subdomain.
