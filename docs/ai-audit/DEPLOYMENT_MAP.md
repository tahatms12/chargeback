# Deployment Map

## Craftline
- **Current Deployment:** Unknown (Vercel/Fly inferred)
- **Inferred Hosting Vendor:** None explicit.
- **Environment Variables:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `DATABASE_URL`
- **Database:** Prisma SQLite/Postgres (`schema.prisma` present)
- **Auth Model:** @shopify/shopify-app-remix standard
- **Extensions:** ui_extension
- **Risks/Mismatches:** None significant.

## FixitCSV
- **Current Deployment:** Dockerized
- **Inferred Hosting Vendor:** Any container orchestration (has `Dockerfile`).
- **Environment Variables:** `PORT`, `NODE_ENV`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `DATABASE_URL`
- **Database:** Prisma (`schema.prisma` present)
- **Auth Model:** @shopify/shopify-app-remix standard
- **Extensions:** None
- **Risks/Mismatches:** None.

## Stagewise
- **Current Deployment:** Unknown Node hosting
- **Inferred Hosting Vendor:** None explicit.
- **Environment Variables:** `NODE_ENV`, `BILLING_TEST_MODE`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL`, `SHOP_CUSTOM_DOMAIN`, `EMAIL_QUEUE_BATCH_SIZE`, `EMAIL_SEND_DELAY_MS`, `EMAIL_QUEUE_POLL_MS`, `DATABASE_URL`
- **Database:** Prisma (`schema.prisma` present)
- **Auth Model:** @shopify/shopify-app-remix standard
- **Extensions:** None
- **Risks/Mismatches:** Custom queue mechanics using `p-queue` in memory.

## customsready
- **Current Deployment:** Docker multi-container expected.
- **Inferred Hosting Vendor:** Custom VPS / Container hosting (has `Dockerfile`).
- **Environment Variables:** `PORT`, `NODE_ENV`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `LOG_LEVEL`, `REDIS_URL`, `DATABASE_URL`
- **Database:** Prisma (`schema.prisma` present), Redis
- **Auth Model:** @shopify/shopify-app-remix standard
- **Extensions:** order-detail-block, order-detail-action, print-action, product-detail-block
- **Risks/Mismatches:** Use of Redis (`ioredis`, `bullmq`) violates the operational constraint of "No unnecessary services".

## QuoteLoop
- **Current Deployment:** Standard Node
- **Inferred Hosting Vendor:** Heroku / Custom VPS
- **Environment Variables:** `PORT`, `BACKEND_PORT`, `NODE_ENV`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `HOST`, `DB_PATH`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `POLL_INTERVAL_CRON`
- **Database:** SQLite (`db.js` writes to `DB_PATH`)
- **Auth Model:** Custom Express Auth logic (Obsolete)
- **Extensions:** None
- **Risks/Mismatches:** Legacy auth logic. Should be rebuilt to Remix.

## poref
- **Current Deployment:** Unknown
- **Inferred Hosting Vendor:** N/A
- **Environment Variables:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL`, `DATABASE_URL`
- **Database:** Prisma (`schema.prisma` present)
- **Auth Model:** @shopify/shopify-app-remix (Assumed, code references Remix loaders/actions)
- **Extensions:** poref-checkout (ui_extension), poref-order-block, poref-order-action, poref-pos, poref-cart (theme_app_extension)
- **Risks/Mismatches:** Broken state, missing `package.json`.
