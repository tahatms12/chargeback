# Application Inventory

## 1. Craftline
- **Path:** `Craftline/`
- **Classification:** TYPE_J (Mixed monorepo: embedded admin app + extensions)
- **Framework and Runtime:** @shopify/shopify-app-remix (^3.2.0), React Router, Node ^18
- **Deployment Assumption:** Vercel or Fly.io (standard Remix deployment)
- **Status:** STATUS_WORKING
- **Evidence:** `package.json` contains `@shopify/shopify-app-remix`, `shopify.app.toml` is present, `workspaces` array exists.
- **Migration Strategy:** STRATEGY_REPAIR
- **Confidence Score:** 0.95
- **Blocking Unknowns:** None

## 2. FixitCSV
- **Path:** `FixitCSV/`
- **Classification:** TYPE_A (Shopify embedded admin app)
- **Framework and Runtime:** @shopify/shopify-app-remix (^3.3.0), Node ^20
- **Deployment Assumption:** Standard Node.js hosting / Docker container (Has `Dockerfile`)
- **Status:** STATUS_WORKING
- **Evidence:** `package.json`, `shopify.app.toml`, `Dockerfile`
- **Migration Strategy:** STRATEGY_REPAIR
- **Confidence Score:** 0.95
- **Blocking Unknowns:** None

## 3. Stagewise
- **Path:** `Stagewise/`
- **Classification:** TYPE_A (Shopify embedded admin app)
- **Framework and Runtime:** @shopify/shopify-app-remix (^3.3.0), Node ^18
- **Deployment Assumption:** Standard Node.js hosting
- **Status:** STATUS_WORKING
- **Evidence:** `package.json` with p-queue, `shopify.app.toml`
- **Migration Strategy:** STRATEGY_REPAIR
- **Confidence Score:** 0.95
- **Blocking Unknowns:** None

## 4. customsready (customsready-lite)
- **Path:** `customsready/`
- **Classification:** TYPE_J (Mixed monorepo: app + extensions)
- **Framework and Runtime:** @shopify/shopify-app-remix (^3.3.0), BullMQ, Redis, Node ^20
- **Deployment Assumption:** Docker / multi-container (requires Redis)
- **Status:** STATUS_WORKING (but violates banned extra containers rule)
- **Evidence:** `package.json` with `ioredis` and `bullmq`, `extensions/` directory present.
- **Migration Strategy:** STRATEGY_REPAIR (Requires replacing/removing Redis queue logic)
- **Confidence Score:** 0.90
- **Blocking Unknowns:** Redis/BullMQ specific dependencies and Puppeteer

## 5. QuoteLoop
- **Path:** `QuoteLoop/QuoteLoop/`
- **Classification:** TYPE_A (Shopify embedded admin app)
- **Framework and Runtime:** Node.js Express script-based
- **Deployment Assumption:** Standard Node.js instance
- **Status:** STATUS_OBSOLETE
- **Evidence:** `index.js`, `shopify.js`, usages of old custom auth.
- **Migration Strategy:** STRATEGY_REBUILD
- **Confidence Score:** 0.85
- **Blocking Unknowns:** Legacy custom logic bridging

## 6. poref (PORef)
- **Path:** `poref/`
- **Classification:** TYPE_J (Mixed monorepo: app + extensions)
- **Framework and Runtime:** React / Remix UI roots but missing configuration.
- **Deployment Assumption:** Unknown
- **Status:** STATUS_BROKEN
- **Evidence:** Missing `package.json`, malformed structure, but has `shopify.app.toml` with extensions.
- **Migration Strategy:** STRATEGY_REBUILD
- **Confidence Score:** 0.90
- **Blocking Unknowns:** Missing package.json dependencies

## 7. frontend
- **Path:** `frontend/`
- **Classification:** TYPE_G (Non-Shopify application)
- **Framework and Runtime:** Next.js (^14.2.5)
- **Deployment Assumption:** Vercel
- **Status:** STATUS_WORKING
- **Evidence:** `package.json` with `next` dependency
- **Migration Strategy:** STRATEGY_RETIRE
- **Confidence Score:** 1.0
- **Blocking Unknowns:** None

## 8. migratory
- **Path:** `migratory/`
- **Classification:** TYPE_I (Abandoned or empty scaffold)
- **Framework and Runtime:** None (Schema only)
- **Deployment Assumption:** N/A
- **Status:** STATUS_ABANDONED
- **Evidence:** Only contains `schema.prisma`. No `package.json` or code.
- **Migration Strategy:** STRATEGY_RETIRE
- **Confidence Score:** 1.0
- **Blocking Unknowns:** None
