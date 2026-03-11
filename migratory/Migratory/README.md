# New Customer Accounts Migration Audit

A Shopify admin app that scans a store's installed apps and active theme Liquid files, then generates a compatibility report showing what will break when switching from Classic to New Customer Accounts before the August 2026 deadline.

## What it does

1. **App scanner** — Fetches all installed apps via the Admin GraphQL API (`appInstallations` query) and cross-references each against a manually curated compatibility database (`database/compatibility-db.json`).
2. **Liquid scanner** — Reads account-relevant Liquid files from the active theme via the Theme Asset REST API and pattern-matches for classic account constructs: `customer_login` form tags, `customer.account_activation_url`, `/account/register` URLs, Multipass references, tracking pixel scripts, and more.
3. **Report** — Generates an inline Polaris report with severity badges, finding details, and estimated developer hours to resolve. A downloadable PDF is also available.

## Required Shopify Scopes

```
read_apps     — enumerate installed apps
read_themes   — read active theme Liquid files
```

## Prerequisites

- Node.js >= 18.20.4
- A Shopify Partner account
- A development store
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed globally: `npm install -g @shopify/cli`

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable           | Description                                              |
|--------------------|----------------------------------------------------------|
| `SHOPIFY_API_KEY`  | Your app's API key from the Partner Dashboard            |
| `SHOPIFY_API_SECRET` | Your app's API secret from the Partner Dashboard       |
| `SHOPIFY_APP_URL`  | Public URL of the app (set automatically in dev by CLI)  |
| `SCOPES`           | `read_apps,read_themes`                                  |
| `DATABASE_URL`     | SQLite (`file:./dev.db`) for dev; PostgreSQL URL for prod |

## Install

```bash
npm install
```

## Database Setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Local Development

```bash
shopify app dev
```

The Shopify CLI will:
1. Handle OAuth tunnel setup
2. Set `SHOPIFY_APP_URL` automatically
3. Open the app in your development store's admin

## Running Tests

```bash
npm test
```

Tests cover:
- Liquid pattern matching (the highest-risk logic — false negatives = missed breaking changes)
- Compatibility database lookup (multi-strategy matching for app names and handles)

## Project Structure

```
nca-migration-audit/
├── app/
│   ├── routes/
│   │   ├── _index.jsx              # Redirect to /app
│   │   ├── auth.$.jsx              # OAuth callback
│   │   ├── webhooks.jsx            # APP_UNINSTALLED cleanup
│   │   ├── app.jsx                 # Polaris AppProvider shell
│   │   ├── app._index.jsx          # Home page (audit history)
│   │   ├── app.audit.new.jsx       # Run new audit (action + UI)
│   │   ├── app.audit.$auditId.jsx  # Audit results page
│   │   └── app.audit.$auditId.pdf.jsx  # PDF download resource route
│   ├── lib/
│   │   ├── scanner/
│   │   │   ├── app-scanner.server.js     # GraphQL app listing + DB lookup
│   │   │   ├── liquid-scanner.server.js  # Theme file reading + pattern matching
│   │   │   └── report-builder.server.js  # Report assembly + hour estimation
│   │   └── pdf/
│   │       └── report-pdf.server.js      # PDFKit report generation
│   ├── shopify.server.js           # Shopify app auth + session storage
│   ├── db.server.js                # Prisma client singleton
│   └── root.jsx                    # Remix root
├── database/
│   └── compatibility-db.json       # Manually curated app compatibility database
├── prisma/
│   └── schema.prisma               # Session + AuditRun models
├── tests/
│   ├── liquid-scanner.test.js
│   └── app-scanner.test.js
├── shopify.app.toml
├── vite.config.js
├── vitest.config.js
└── .env.example
```

## Compatibility Database Maintenance

The file `database/compatibility-db.json` is the primary ongoing maintenance cost of this product.

**Status values:**
- `compatible` — App confirmed compatible with New Customer Accounts
- `incompatible` — App confirmed broken; requires replacement or developer work
- `partial` — App requires configuration changes or has a migration path
- `unknown` — Not yet verified (apps not in the database default to this status)

**Adding new apps:** Add an entry following the existing schema. Required fields: `handle`, `name`, `status`. Recommended: `notes`, `sourceUrl`, `lastChecked`, `estimatedResolveHours`.

**How to find an app's handle:** The handle appears in the Shopify App Store URL: `https://apps.shopify.com/{handle}`.

Apps are matched by handle first, then by `alternateHandles`, then by name. When an app's App Store handle differs from what the GraphQL API returns, add the GraphQL handle to `alternateHandles`.

## Deployment

### Fly.io

```bash
fly launch
fly secrets set SHOPIFY_API_KEY=... SHOPIFY_API_SECRET=... DATABASE_URL=postgres://...
fly deploy
```

### Heroku

```bash
heroku create
heroku config:set SHOPIFY_API_KEY=... SHOPIFY_API_SECRET=... DATABASE_URL=postgres://...
git push heroku main
```

**Important:** For production deployment, replace the SQLite `DATABASE_URL` with a PostgreSQL connection string. The Prisma schema supports both; only the `datasource db.provider` needs to change from `"sqlite"` to `"postgresql"`.

### After deployment

Update `shopify.app.toml` with your production `application_url` and `redirect_urls`, then run:

```bash
shopify app deploy
```

## Known Limitations

- The audit runs synchronously. For stores with very large themes (200+ Liquid files), the scan may approach Shopify's 30-second response timeout. The scanner targets only account-relevant files to mitigate this.
- Apps not in `compatibility-db.json` are marked `unknown` — this is intentional. The disclaimer in the report makes this visible to merchants.
- Liquid pattern matching is regex-based, not AST-based. Complex conditional Liquid or commented-out code may produce false positives. Source requirement explicitly excludes "advanced Liquid parsing beyond pattern matching."
- NCA-hosted pages (login, register, account) are served from a Shopify domain and cannot be scanned by this tool. The scan covers your theme files only.

## Disclaimer

This tool performs automated scanning and is not a guarantee that a migration will succeed without issues. Always test in a development store before switching. See the in-app disclaimer for full details.
