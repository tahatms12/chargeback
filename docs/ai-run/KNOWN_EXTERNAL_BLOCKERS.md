# Known External Blockers

The following systems are functionally complete in code but cannot be run without external keys.

## **Craftline**
- **What is blocked:** Local Startup (`shopify app dev`)
- **Required Credential:** `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- **Where to obtain:** Shopify Partner Dashboard
- **How to inject:** Edit `Craftline/.env` and `Craftline/shopify.app.toml` (`client_id` field).
- **Severity:** HARD BLOCKER

## **FixitCSV**
- **What is blocked:** Local Startup
- **Required Credential:** `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- **Where to obtain:** Shopify Partner Dashboard
- **How to inject:** `FixitCSV/.env` and `FixitCSV/shopify.app.toml`
- **Severity:** HARD BLOCKER

## **Stagewise**
- **What is blocked:** Local Startup
- **Required Credential:** `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- **Where to obtain:** Shopify Partner Dashboard
- **How to inject:** `Stagewise/.env` and `Stagewise/shopify.app.toml`
- **Severity:** HARD BLOCKER

## **customsready**
- **What is blocked:** Local Startup
- **Required Credential:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, and `REDIS_URL`
- **Where to obtain:** Partner Dashboard and a local Redis container / Neon Postgres.
- **How to inject:** `customsready/.env`
- **Severity:** HARD BLOCKER

## **poref-new**
- **What is blocked:** Local Startup
- **Required Credential:** `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`.
- **Where to obtain:** Shopify Partner Dashboard (existing app: PORef)
- **How to inject:** `apps/poref-new/.env`
- **Severity:** HARD BLOCKER

## **quoteloop-new**
- **What is blocked:** Local Startup
- **Required Credential:** `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`.
- **Where to obtain:** Shopify Partner Dashboard (new app)
- **How to inject:** `apps/quoteloop-new/.env`
- **Severity:** HARD BLOCKER
