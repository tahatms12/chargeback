# Migration Plan

## Craftline
- **Strategy & Justification:** STRATEGY_REPAIR. App already uses modern `@shopify/shopify-app-remix` (v3.2.0) and has valid configuration. Just needs dependency standardization.
- **Target Folder:** `Craftline/` (In-place repair)
- **Target Shopify CLI Scaffold Type:** N/A (In-place repair)
- **Reusable Code:** Complete codebase structure, Prisma schema, Remix routes.
- **Code to Rewrite:** Remove redundant `npm` configurations, standardize to `pnpm`.
- **App Identity:** Preserved via existing `shopify.app.toml`.
- **Database Strategy:** SQLite local / Neon Postgres via native Prisma structure.
- **Local Dev Workflow:** `pnpm run dev` (maps to `shopify app dev`)
- **Dev Store Validation:** Load via Shopify Partner tunnel URL; verify embedded.
- **Rollback Path:** Existing recovery branch history.

## FixitCSV
- **Strategy & Justification:** STRATEGY_REPAIR. Uses current Remix templates and extensions.
- **Target Folder:** `FixitCSV/` (In-place repair)
- **Target Shopify CLI Scaffold Type:** N/A
- **Reusable Code:** All standard files.
- **Code to Rewrite:** Dependency locks to `pnpm`.
- **App Identity:** Preserved via existing `shopify.app.toml`.
- **Database Strategy:** Prisma SQLite
- **Local Dev Workflow:** `shopify app dev`
- **Dev Store Validation:** Install to dev store via dev tunnel link.
- **Rollback Path:** Local git history.

## Stagewise
- **Strategy & Justification:** STRATEGY_REPAIR. Uses current Remix templates.
- **Target Folder:** `Stagewise/`
- **Target Shopify CLI Scaffold Type:** N/A
- **Reusable Code:** All standard files.
- **Code to Rewrite:** None functionally. Dependency locks to `pnpm`.
- **App Identity:** Preserved via `shopify.app.toml`.
- **Database Strategy:** Prisma SQLite
- **Local Dev Workflow:** `shopify app dev`
- **Dev Store Validation:** Tunnel install link.
- **Rollback Path:** Local git history.

## customsready
- **Strategy & Justification:** STRATEGY_REPAIR. Uses current Remix but includes forbidden containers (Redis).
- **Target Folder:** `customsready/`
- **Target Shopify CLI Scaffold Type:** N/A
- **Reusable Code:** Remix routes, UI extensions, webhooks.
- **Code to Rewrite:** Background workers relying on BullMQ + Redis must be removed or conditionally disabled for strictly local validation per strict rules. Assumed local queue fallback logic required.
- **App Identity:** Preserved via `shopify.app.toml`.
- **Database Strategy:** Prisma SQLite
- **Local Dev Workflow:** `shopify app dev` (with Redis temporarily provided or bypassed)
- **Dev Store Validation:** Tunnel install link and test UI extension blocks.
- **Rollback Path:** Local git history.

## poref
- **Strategy & Justification:** STRATEGY_REBUILD. App is broken, missing `package.json`, and missing scaffolding files, though UI roots exist.
- **Target Folder:** `apps/poref-new/`
- **Target Shopify CLI Scaffold Type:** `shopify app init` with React Router template. Custom extensions to be scaffolded manually (`ui_extension`, `theme_app_extension`).
- **Reusable Code:** `schema.prisma`, root logic from `poref/index.tsx` and `shopify.server.ts`.
- **Code to Rewrite:** Standard App Bridge integration, package structures, Remix loaders.
- **App Identity:** Re-apply `client_id = "00000000000000000000000000000000"` to target TOML config to connect to existing partner record.
- **Database Strategy:** SQLite local
- **Local Dev Workflow:** Fresh `shopify app dev` on reconstructed app.
- **Dev Store Validation:** Full install and extension block interaction test.
- **Rollback Path:** Old folder `poref/` will be preserved untouched during rebuild.

## QuoteLoop
- **Strategy & Justification:** STRATEGY_REBUILD. Obsolete custom node/express app handling webhooks manually with obsolete auth paradigms. No `package.json` found in standard structure.
- **Target Folder:** `apps/quoteloop-new/`
- **Target Shopify CLI Scaffold Type:** `shopify app init` with React Router template.
- **Reusable Code:** Domain logic inside `db.js`, `poller.js`, and `email.js`. 
- **Code to Rewrite:** All express web framework routes to Remix Route Actions.
- **App Identity:** New Shopify app configuration.
- **Database Strategy:** SQLite local
- **Local Dev Workflow:** `shopify app dev`
- **Dev Store Validation:** Test polling/email hooks via dev store UI changes.
- **Rollback Path:** `QuoteLoop/` folder preserved untouched.
