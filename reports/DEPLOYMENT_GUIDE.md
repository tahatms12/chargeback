# Deployment and Domaining Guide

The `apps-launch` Next.js application serves as a dynamic, subdomain-aware routing engine that automatically serves the correct App Store public presences for all 6 active Shopify apps in this monorepo.

## 1. Vercel Project Setup
1. Create a **New Project** in Vercel.
2. Import this Monorepo.
3. In the project configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps-launch`
   - **Build Command**: `pnpm run build`
   - **Install Command**: `pnpm install`
4. Deploy the application.

## 2. DNS & Custom Domains
The application has built-in Edge Middleware (`apps-launch/src/middleware.ts`) that intercepts the Host header and automatically rewrites requests to the correct dynamic `[slug]` route.

To activate this, you must bind all 6 subdomains to the specific Vercel project you just created.

Add the following domains in the Vercel Project Settings > Domains:
- `craftline.uplifttechnologies.pro`
- `fixitcsv.uplifttechnologies.pro`
- `stagewise.uplifttechnologies.pro`
- `customsready.uplifttechnologies.pro`
- `poref.uplifttechnologies.pro`
- `quoteloop.uplifttechnologies.pro`

*Note: All domains should maintain standard Vercel CNAME/A record pointing (`cname.vercel-dns.com` or `76.76.21.21`).*

## 3. How the Routing Works (No Config Changes Required)
When a user visits `https://craftline.uplifttechnologies.pro/privacy`:
1. Vercel Edge Middleware reads the Host header: `craftline.uplifttechnologies.pro`
2. It detects the `craftline` slug.
3. It transparently rewrites the URL to `/launch/craftline/privacy`.
4. The user sees the Craftline-specific privacy policy without the URL changing in their browser.

## 4. Environment Variables
The launch site currently requires **no sensitive environment variables** to build and deploy, as all app schema data is statically inferred in `lib/data.ts`.
