# Draft Order Follow-Up & Expiry Nudge

A Shopify embedded app that automatically follows up on stale draft orders via email and marks them as expired after a merchant-defined number of days.

## What It Does

- **Dashboard** — Lists every open draft order with its age in days and current status
- **Follow-up rule** — After X days, sends a follow-up email to the customer containing the draft order link
- **Expiry rule** — After Y days, tags the draft order `expired` via the Admin API and optionally adds a note
- **Merchant notification** — Shop owner receives a summary email when drafts are expired

## Prerequisites

- Node.js 18+
- npm 9+
- A Shopify Partner account and a development store
- Shopify CLI v3 (`npm install -g @shopify/cli@latest`)
- A SendGrid account with a verified sender address
- ngrok or a similar tunnel for local development

## Environment Variables

Copy `.env.example` to `.env` inside `web/` and fill in all values.

| Variable | Description |
|---|---|
| `SHOPIFY_API_KEY` | From Shopify Partner dashboard |
| `SHOPIFY_API_SECRET` | From Shopify Partner dashboard |
| `SCOPES` | `read_draft_orders,write_draft_orders,read_customers` |
| `HOST` | Your public HTTPS URL (ngrok tunnel for local dev) |
| `SENDGRID_API_KEY` | From SendGrid account |
| `SENDGRID_FROM_EMAIL` | Verified sender email address in SendGrid |
| `DB_PATH` | SQLite database file path (default `./data/app.db`) |
| `PORT` | Backend port (default `3000`) |
| `POLL_INTERVAL_CRON` | Cron schedule (default `0 * * * *` = every hour) |

## Install

```bash
# Install backend dependencies
cd web
npm install

# Install frontend dependencies
cd frontend
npm install
```

## Local Development

```bash
# 1. Start ngrok tunnel on port 3000
ngrok http 3000

# 2. Set HOST in web/.env to the ngrok HTTPS URL

# 3. In the Shopify Partner dashboard, set the app URL and redirect URL to the ngrok URL

# 4. From the repo root, start the app
cd web
npm run dev
```

The backend runs on port 3000. The Vite frontend dev server proxies API requests through to the backend.

## Production Deployment

1. Deploy the `web/` directory to any Node.js host (Railway, Render, Fly.io, etc.)
2. Build the frontend: `cd web/frontend && npm run build`
3. The backend serves the built frontend from `web/frontend/dist/`
4. Set all environment variables on your host
5. Update the app URL in the Shopify Partner dashboard to your production URL

## App Setup in Shopify Partner Dashboard

1. Create a new app in the Partner dashboard
2. Set **App URL** to `https://your-host.com`
3. Set **Allowed redirection URL** to `https://your-host.com/api/auth/callback`
4. Copy the API key and secret to `web/.env`
5. Under **Webhooks**, register:
   - `draft_orders/create` → `https://your-host.com/api/webhooks`
   - `draft_orders/update` → `https://your-host.com/api/webhooks`

## Required Shopify API Scopes

```
read_draft_orders
write_draft_orders
read_customers
```

## How the Poller Works

A `node-cron` job runs on the `POLL_INTERVAL_CRON` schedule (default: every hour). For each installed shop, it:

1. Fetches all open draft orders from the Shopify Admin API
2. Computes the age of each draft in days from its `created_at` timestamp
3. For drafts that have reached the **follow-up threshold** and haven't been emailed yet, sends a follow-up email to the customer and records the action
4. For drafts that have reached the **expiry threshold**, adds the tag `expired` to the draft order, records the action, and optionally sends the merchant a notification
