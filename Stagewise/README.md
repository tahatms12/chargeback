# Production Queue Communicator

Shopify embedded admin app for handmade and custom-product sellers.

Tracks each open order through named production stages, sends customers automatic email notifications at each stage transition, and displays a live grouped production queue view.

---

## Prerequisites

- Node.js >= 18.20.0
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) (`npm install -g @shopify/cli`)
- A Shopify Partner account and a development store
- SMTP credentials for outbound email (e.g. Gmail App Password, Mailgun, Postmark)

---

## Environment variables

Copy `.env.example` to `.env` and fill in all values:

```
SHOPIFY_API_KEY=         # From Shopify Partners dashboard → Your app → App setup
SHOPIFY_API_SECRET=      # Same location
SHOPIFY_APP_URL=         # Tunnel URL — populated automatically by `shopify app dev`
SCOPES=read_orders,write_orders,read_customers
DATABASE_URL=file:./dev.db
NODE_ENV=development
BILLING_TEST_MODE=true
EMAIL_QUEUE_POLL_MS=30000
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_SEND_DELAY_MS=1000
CRON_SECRET=             # Optional: protect /api/email-queue POST
PORT=3000
```

---

## Install and run (development)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client and run migrations
npm run setup

# 3. Start the app (opens a tunnel, registers with Shopify, starts the dev server)
shopify app dev
```

The CLI will prompt you to select your dev store on first run and open the app in the Shopify admin.

---

## Database

SQLite is used by default. For production, set `DATABASE_URL` to a PostgreSQL connection string and change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.

Apply migrations:

```bash
# Dev
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

---

## Email configuration

After installing the app:

1. Navigate to **Settings** in the app nav.
2. Enter your SMTP host, port, username, password, and sender address.
3. Click **Test connection** to verify.

Stage notification emails are queued in the database and sent by a background polling loop (default: every 30 seconds). To also trigger processing via an external cron job, `POST /api/email-queue` with header `Authorization: Bearer <CRON_SECRET>`.

---

## Billing

- **Free tier**: up to 10 active orders in the production queue.
- **Paid tier**: $9/month — unlimited active orders.

Billing uses Shopify's native subscription API. In development, set `BILLING_TEST_MODE=true` to avoid real charges.

---

## Tests

```bash
npm test
```

Tests cover: email template variable interpolation; email queue processor concurrency guard and failure handling.

---

## Deployment

Any Node.js host works (Fly.io, Render, Railway, Heroku). Required steps:

1. Set all production env vars (use PostgreSQL `DATABASE_URL`).
2. Run `npm run setup` as a release/startup command.
3. Update `SHOPIFY_APP_URL` in `.env` and `shopify.app.toml` to your production URL.
4. Run `shopify app deploy` to push the app config to Shopify.

---

## Scope protection

**Not included (source: MVP should not do):**
- Inventory management
- Materials tracking per order
- Team member assignment
- Payment handling
- Customer self-service status lookup page (v2)
- Bulk stage assignment via external event trigger (non-Plus Shopify Flow limitation)

**Not included (missing from source):**
- Specific Reddit community evidence
- Exact Etsy-to-Shopify migration cohort sizing

**Not included (unclear from source):**
- Drag-and-drop kanban UI — implemented as list + batch select instead (mobile-first rationale)
- Order tags vs. metafields storage — implemented as DB records (primary) + order tags (Shopify visibility); metafields not used
