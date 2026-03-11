# Deployment Architecture (Vercel Multi-Project, Subdomain Model)

This repository is configured for **one Vercel project per deployable app folder**.

> Legacy note: `legacy-infra/gateway/nginx.conf` is retained only for optional local/path-based gateway experiments and is **not** part of the active Vercel deployment path.

## Root-level anti-ambiguity guard

- `vercel.json` at repository root is set to `"framework": null`.
- This prevents the repo root from being treated as a Next.js app.
- Repo root deploys are intentional for a minimal static status page (`index.html`) and are separate from app deploys.
- The Chargeguard web app boundary remains `frontend/` (Vercel Root Directory `frontend`).

## Deployable app inventory

| App folder | Framework/runtime | Package manager | package.json | Build script | Next.js app | Intended for Vercel | Vercel project name (recommended) | Vercel Root Directory | Production subdomain |
|---|---|---|---|---|---|---|---|---|---|
| `frontend/` | Next.js 14 | npm | `frontend/package.json` | `npm run build` (`next build`) | Yes | Yes | `chargeguard-web` | `frontend` | `chargeguard.uplifttechnologies.pro` |
| `customsready/` | Remix + Shopify app | npm | `customsready/package.json` | `npm run build` (`remix vite:build`) | No | Yes (web process) | `customsready` | `customsready` | `customsready.uplifttechnologies.pro` |
| `Craftline/` | Remix + Shopify app | npm | `Craftline/package.json` | `npm run build` (`remix vite:build`) | No | Yes (web process) | `makerqueue` | `Craftline` | `makerqueue.uplifttechnologies.pro` |
| `FixitCSV/` | Remix + Shopify app | npm | `FixitCSV/package.json` | `npm run build` (`remix vite:build`) | No | Yes (web process) | `fixitcsv` | `FixitCSV` | `fixitcsv.uplifttechnologies.pro` |
| `Stagewise/` | Remix + Shopify app | npm | `Stagewise/package.json` | `npm run build` (`remix vite:build`) | No | Yes (web process) | `stagewise` | `Stagewise` | `stagewise.uplifttechnologies.pro` |
| `poref/` | Shopify app sources/config present | n/a | **missing** | n/a | No | Not yet (incomplete package) | `poref` (after package/runtime completion) | `poref` (after package/runtime completion) | `poref.uplifttechnologies.pro` |

## App-level Vercel config

Each deployable Node app folder includes its own `vercel.json` to ensure framework/build are interpreted per-app:

- `frontend/vercel.json` -> `framework: nextjs`
- `customsready/vercel.json` -> `framework: remix`
- `Craftline/vercel.json` -> `framework: remix`
- `FixitCSV/vercel.json` -> `framework: remix`
- `Stagewise/vercel.json` -> `framework: remix`

## Environment model

Use each app's `.env.example` as source-of-truth templates with subdomain URLs prefilled.
Only secrets/account-specific values remain placeholders.
