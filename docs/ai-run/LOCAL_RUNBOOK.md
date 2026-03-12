# Local Runbook

This document provides the exact commands for running each app locally.

## Craftline
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev`
- **Build Command:** `pnpm run build`
- **Local URL:** The Shopify tunnel URL and `http://localhost:3000` mapped.
- **Expected Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- **Expected Startup:** "Press Any Key" to open Shopify dev or logs showing tunnel established.

## FixitCSV
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev`
- **Build Command:** `pnpm run build`
- **Local URL:** The Shopify tunnel URL.
- **Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- **Expected Startup:** Logs showing tunnel established and Remix server running.

## Stagewise
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev`
- **Build Command:** `pnpm run build`
- **Local URL:** Shopify tunnel URL.
- **Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`
- **Expected Startup:** Tunnel established.

## customsready
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev` (Requires Redis active for background jobs unless removed)
- **Build Command:** `pnpm run build`
- **Local URL:** Shopify tunnel URL.
- **Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `REDIS_URL`
- **Expected Startup:** Tunnel established, BullMQ connected to Redis msg.

## poref-new
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev`
- **Build Command:** `pnpm run build`
- **Local URL:** Shopify tunnel URL.
- **Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- **Expected Startup:** Tunnel established and Remix running.

## quoteloop-new
- **Install Command:** `pnpm install`
- **Dev Command:** `shopify app dev`
- **Build Command:** `pnpm run build`
- **Local URL:** Shopify tunnel URL.
- **Expected Env Vars:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- **Expected Startup:** Tunnel established and Express backend replacement server running.
