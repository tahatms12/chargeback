# Maker Queue

A production queue dashboard for handmade and made-to-order Shopify sellers.

Tracks each open order through named production stages (e.g. Order Received → In Production → Quality Check → Ready to Ship), sends automatic customer email updates at each stage transition, and shows the merchant a live grouped queue view.

---

## Source Integrity Register

### Source facts extracted
- Admin-only app; no theme extension or checkout surfaces required
- 3–7 custom production stages per store, configurable
- Assign orders to a stage (batch select)
- Auto-send customer email when order moves to a stage
- Production queue view: all active orders grouped by stage
- Mobile-responsive requirement
- Email notification rate limit risk for batch moves — requires queue
- Free tier: up to 10 active orders; Paid: $9/month unlimited
- Stage data stored per-store; implementation choice: order tags OR metafields (source unclear)
- Webhooks: orders/fulfilled, orders/cancelled, app/uninstalled

### Implementation choices due to missing source detail
- **Stage storage**: order metafields (`maker_queue.production_stage`) used on Shopify orders; local DB (`OrderStage`) used for fast queue view without N+1 API calls
- **Email mechanism**: nodemailer with merchant-configured SMTP (source says "Shopify Email API or Customer Notifications" but no direct custom-email Shopify endpoint exists in the standard Admin API for regular orders; SMTP is the standard App Store-safe pattern)
- **Queue UI**: batch-select modal for adding orders; inline stage selector per order card (source marks drag-and-drop vs batch-select as "Unclear from source")
- **Default stages**: 5 defaults seeded on first visit to Stages page (Order Received, Materials Sourced, In Production, Quality Check, Ready to Ship)

### Missing from source
- Specific Reddit evidence
- Exact Etsy-to-Shopify cohort size
- Whether W3 Custom Order Status is stagnant

### Unclear from source
- Drag-and-drop vs batch-select for queue UI → resolved as batch-select (implementation choice)
- Order tags vs metafields for stage tracking → resolved as metafields (implementation choice)

---

## Prerequisites

- Node.js >= 18.20.0
- A [Shopify Partner account](https://partners.shopify.com)
- A Shopify development store
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed globally (`npm install -g @shopify/cli`)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `SHOPIFY_API_KEY` | From your app in the Shopify Partner dashboard |
| `SHOPIFY_API_SECRET` | From your app in the Shopify Partner dashboard |
| `SCOPES` | `read_orders,write_orders,read_customers,read_metafields,write_metafields` |
| `SHOPIFY_APP_URL` | Your tunnel URL (auto-set by `shopify app dev`) |
| `DATABASE_URL` | `file:./dev.db` for local dev; PostgreSQL URL for production |

---

## Install and run locally

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client and run migrations
npx prisma migrate dev --name init

# 3. Start the development server with Shopify tunnel
shopify app dev
```

`shopify app dev` starts a local tunnel and prompts you to connect to a development store. The `SHOPIFY_APP_URL` variable is injected automatically.

---

## Shopify app setup

```bash
# Link this codebase to an existing app in your Partner dashboard
shopify app config link

# Or create a new app
shopify app deploy
```

Update `shopify.app.toml`:
- Replace `YOUR_CLIENT_ID` with your app's client ID from the Partner dashboard
- Replace `YOUR_APP_URL` with your production URL after deployment

---

## Database

Local development uses SQLite (`prisma/dev.db`).

For production, set `DATABASE_URL` to a PostgreSQL connection string and update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate deploy
```

---

## Running tests

```bash
npm test
```

Tests cover `renderTemplate` and `createTransport` — the highest-risk logic in the email pipeline.

---

## Email setup (merchant-facing)

After installing the app, go to **Settings** and configure SMTP:

- **Gmail**: Use an [App Password](https://support.google.com/accounts/answer/185833), host `smtp.gmail.com`, port 587
- **SendGrid**: host `smtp.sendgrid.net`, port 587, user `apikey`, password = your API key
- **Postmark**: host `smtp.postmarkapp.com`, port 587

---

## Deployment

Any Node.js host works (Railway, Fly.io, Render, Heroku).

Ensure:
1. `DATABASE_URL` points to a persistent PostgreSQL database
2. `SHOPIFY_APP_URL` matches your production domain
3. `shopify.app.toml` `redirect_urls` and `application_url` match production URL
4. Run `npm run setup` (runs `prisma generate && prisma migrate deploy`) on deploy

---

## Scope Protection

**Intentionally excluded (source says MVP should not do):**
- Inventory management
- Materials tracking
- Team member assignment
- Payment handling
- Customer self-service status page
- Bulk stage assignment by external event trigger

**Not implemented due to missing source detail:**
- No Shopify-native email mechanism exists for custom transactional emails on regular orders → SMTP used instead

**Not implemented due to unclear source detail:**
- Drag-and-drop queue UI (batch-select chosen instead)
