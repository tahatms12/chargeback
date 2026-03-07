# CustomsReady Lite — Developer Quickstart

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Shopify Partner account with a dev store
- Shopify CLI (`npm install -g @shopify/cli`)
- A registered Shopify app in the Partner Dashboard

---

## 1. Create the Shopify App in Partners Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Apps → Create app → Public app
3. Name: **CustomsReady Lite**
4. App URL: `http://localhost:3000` (update after getting ngrok URL)
5. Allowed redirect URL: `http://localhost:3000/auth/callback`
6. Copy **API key** and **API secret**

---

## 2. Clone and install

```bash
git clone <your-repo> customsready-lite
cd customsready-lite
npm install
```

---

## 3. Configure environment

```bash
cp .env.sample .env
```

Edit `.env`:

```env
SHOPIFY_API_KEY=<from Partners Dashboard>
SHOPIFY_API_SECRET=<from Partners Dashboard>
SHOPIFY_APP_URL=https://<your-ngrok-subdomain>.ngrok.io
DATABASE_URL=postgresql://postgres:password@localhost:5432/customsready_lite
REDIS_URL=redis://localhost:6379
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 4. Start infrastructure

```bash
docker compose up -d postgres redis
```

---

## 5. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 6. Start the app (dev mode with ngrok tunnel)

```bash
shopify app dev
```

This will:
- Start the Remix dev server on port 3000
- Open an ngrok HTTPS tunnel
- Register the tunnel URL with your Shopify app
- Give you an install URL for your dev store

> **Important:** Copy the ngrok HTTPS URL that `shopify app dev` prints and update `SHOPIFY_APP_URL` in your `.env` file and in the Partner Dashboard.

---

## 7. Start background workers (separate terminal)

```bash
# Terminal 2 — catalog audit worker
npx tsx app/jobs/catalogAudit.worker.ts

# Terminal 3 — product re-audit worker
npx tsx app/jobs/productReaudit.worker.ts
```

Or using the combined script:
```bash
npm run workers
```

---

## 8. Install on dev store

1. Use the install URL printed by `shopify app dev`
2. Approve OAuth scopes
3. Approve the $7/month billing (test mode — no real charge)
4. App home loads and initial catalog audit starts automatically

---

## 9. Test PDF generation

1. Open any order in your dev store admin
2. The **Customs Readiness** block appears on the order detail page
3. Click **Generate Customs Invoice**
4. PDF downloads to your browser

Alternatively, visit directly:
```
https://<ngrok-url>/api/invoice/<order-numeric-id>
```
(must be authenticated via Shopify admin session)

---

## Development workflow

### After schema changes
```bash
npx prisma migrate dev --name <description>
npx prisma generate
```

### Type checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### View database contents
```bash
npx prisma studio
```

---

## Production deployment

### Build
```bash
docker build -t customsready-lite .
```

### Environment variables required in production
```
SHOPIFY_API_KEY
SHOPIFY_API_SECRET
SHOPIFY_APP_URL          # Your production HTTPS domain
DATABASE_URL             # PostgreSQL connection string
REDIS_URL                # Redis connection string
NODE_ENV=production
LOG_LEVEL=info
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium   # Set if using system Chromium
```

### Start
```bash
# Runs migrations then starts the app server
docker run -p 3000:3000 --env-file .env customsready-lite
```

### Workers (run as separate processes/containers)
```bash
# Catalog audit worker
node --loader tsx app/jobs/catalogAudit.worker.ts

# Product re-audit worker
node --loader tsx app/jobs/productReaudit.worker.ts
```

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `/app` | Embedded dashboard |
| `/app/settings` | Seller configuration |
| `/api/audit-status` | Poll audit progress (authenticated) |
| `/api/csv-export` | Download gap CSV (authenticated) |
| `/api/invoice/:orderId` | Download PDF (authenticated) |
| `/api/product-audit/:productId` | Product audit status (authenticated) |
| `/api/fix-status` | Update fix status (authenticated POST) |
| `/health` | Health check (unauthenticated) |
| `/webhooks` | Shopify webhook endpoint |

---

## Folder structure overview

```
customsready-lite/
├── app/
│   ├── shopify.server.ts     # shopifyApp() config + billing
│   ├── db.server.ts          # PrismaClient singleton
│   ├── queue.server.ts       # BullMQ queues + helpers
│   ├── root.tsx              # HTML shell + Polaris provider
│   ├── entry.server.tsx      # Remix SSR entry
│   ├── entry.client.tsx      # Remix hydration entry
│   ├── lib/
│   │   ├── graphql.server.ts # GraphQL queries + rate-limit logic
│   │   ├── audit.server.ts   # Classification + DB helpers
│   │   ├── billing.server.ts # Billing gate helper
│   │   ├── pdf.server.ts     # Puppeteer PDF generation
│   │   └── logger.server.ts  # Pino structured logger
│   ├── jobs/
│   │   ├── catalogAudit.worker.ts   # Full catalog worker
│   │   └── productReaudit.worker.ts # Per-product re-audit worker
│   └── routes/
│       ├── _index.tsx               # / → auth redirect
│       ├── app.tsx                  # Auth layout + billing gate
│       ├── app._index.tsx           # Dashboard
│       ├── app.settings.tsx         # Seller config
│       ├── auth.$.tsx               # OAuth handler
│       ├── webhooks.$.tsx           # All Shopify webhooks
│       ├── health.ts                # Health check
│       ├── api.audit-status.ts      # Audit progress poll
│       ├── api.csv-export.ts        # Gap CSV download
│       ├── api.invoice.$orderId.ts  # PDF generation
│       ├── api.fix-status.ts        # Fix status PATCH
│       └── api.product-audit.$productId.ts # Product audit data
├── extensions/
│   ├── order-detail-block/    # Customs Readiness block on orders
│   ├── order-detail-action/   # Invoice preview + download modal
│   ├── print-action/          # Print menu → PDF
│   └── product-detail-block/  # HS/COO status on product page
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── migrations/            # SQL migrations
├── shopify.app.toml           # App config, scopes, webhooks
├── vite.config.ts
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .env.sample
```

---

## Common issues

### "No access token found for shop"
The worker started before the install hook ran. Wait for OAuth to complete, then trigger a re-scan from the dashboard.

### "GraphQL throttle budget low"
Normal for large catalogs. The worker sleeps automatically and resumes. Check logs for `sleepMs` values.

### PDF is blank or crashes
Check `PUPPETEER_EXECUTABLE_PATH` points to a real Chromium binary. In the Docker image it's `/usr/bin/chromium`.

### Billing redirect loop
Ensure `SHOPIFY_APP_URL` matches the exact URL you registered in the Partner Dashboard (including https, no trailing slash).

### Workers not processing jobs
Check `REDIS_URL` is correct and Redis is running. Verify with `redis-cli -u $REDIS_URL ping`.
