# Risk Register

## 1. customsready Redis Dependency
- **Severity:** HIGH
- **Affected App:** `customsready`
- **Description:** The app uses BullMQ and IORedis for background jobs. This violates the "No Redis" operational rule. 
- **Mitigation Approach:** Replace BullMQ logic with an in-memory or database-backed queue (if local/Neon DB), or simply mock/strip the queueing if it is an unnecessary abstraction for the migration scope.
- **Blocks Forward Progress:** Yes, for local validation unless a local Redis is spun up or the code is patched to remove Redis.

## 2. poref Missing Configuration
- **Severity:** CRITICAL
- **Affected App:** `poref`
- **Description:** Missing `package.json` file. The repository cannot install dependencies or run `shopify app dev` for this app.
- **Mitigation Approach:** STRATEGY_REBUILD. Scaffold a new `poref` app using the Remix template and copy over the `shopify.app.toml`, `prisma/schema.prisma`, and root level Remix files into the standard structure.
- **Blocks Forward Progress:** Yes, cannot be tested without rebuilding.

## 3. QuoteLoop Obsolete Application
- **Severity:** HIGH
- **Affected App:** `QuoteLoop`
- **Description:** Express-based custom Node backend with legacy auth (`shopify.js`, `db.js`), no `package.json` clearly mapped, and SendGrid + Cron jobs embedded.
- **Mitigation Approach:** STRATEGY_REBUILD. Create a new Remix scaffold, port over the custom logic from `index.js` and `poller.js`.
- **Blocks Forward Progress:** Yes, obsolete logic will not work properly with modern Shopify CLI out-of-the-box.
