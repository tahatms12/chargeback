# CustomsReady Lite — Full Architecture & Build Blueprint

---

## SECTION 1 — Product Definition

### What it is
CustomsReady Lite is a Shopify embedded public app that audits merchant product catalog data for missing HS (Harmonized System) codes and country-of-origin (COO) values, surfaces a persistent gap dashboard so gaps can be remediated before shipments are held, and generates professional commercial invoice PDFs per order on demand from the Shopify admin.

### Exact product boundary
**In scope:**
- Product/variant/inventory-item audit for `harmonizedSystemCode` + `countryCodeOfOrigin` completeness
- Persistent gap dashboard (summary cards + sortable gap table)
- Affected international orders panel
- Per-order Customs Readiness status (Complete / Partial / Not Ready)
- Server-side commercial invoice PDF generation
- Custom line item fallback (no crash, placeholder fields shown)
- Multi-currency display using order currency (no conversion)
- Seller configuration (name, address, home country)
- Configurable exempt tags
- CSV gap export
- Fix-status tracking (needs_review → under_review → customs_verified)
- Deep-link to Shopify admin product editor for remediation
- Shopify Billing API subscription ($7/month, 14-day trial)
- GDPR mandatory webhooks
- products/create + products/update incremental re-audit

**Out of scope (V1):**
- Duty/tariff/landed-cost calculation
- AI HS classification suggestions
- In-app HS/COO field writing back to Shopify
- Batch PDF generation
- Email sending of PDFs
- Customs broker integrations
- Carrier/label integrations
- Storefront or checkout modifications
- POS functionality
- Incoterms logic
- Legal compliance claims

### Target merchant
- International DTC and B2B Shopify sellers (Standard/Advanced plan)
- Cross-border shippers with 20–2,000 active products
- Merchants who skip customs data during product setup and discover gaps reactively

### Why it is a recurring subscription
Catalog gaps regenerate continuously. New products are added regularly. The audit must run on every change. The order-readiness and PDF features are used per-shipment. The operational value repeats every billing cycle; it is not a one-time configuration.

---

## SECTION 2 — Shopify Feasibility Verdict

### Fully feasible
- OAuth + session token embedding via `@shopify/shopify-app-remix`
- Billing API with 14-day trial recurring subscription
- Admin GraphQL Product → ProductVariant → InventoryItem join for `harmonizedSystemCode` and `countryCodeOfOrigin`
- `admin.order-details.block.render`, `admin.order-details.action.render`, `admin.order-details.print-action.render`, `admin.product-details.block.render` extension targets
- GDPR webhooks (customers/data_request, customers/redact, shop/redact)
- Webhook signature verification
- Server-side Puppeteer PDF generation served as a binary download
- Background BullMQ job queue for large catalog audits
- PostgreSQL + Prisma for audit state persistence
- CSV export via Remix action route

### Feasible with caveats
- **InventoryItem customs fields via `read_products` alone**: In API version 2024-10+, `inventoryItem` is accessible through the product→variants→inventoryItem join using only `read_products`. `read_inventory` is **not required** for reading `harmonizedSystemCode` and `countryCodeOfOrigin`. Verify this remains true in the pinned API version. If a future API version restricts this, add `read_inventory` to scopes.
- **Large catalog audits**: Shopify GraphQL has cost-based throttling. A 2,000-product catalog with 5 variants each = 10,000 inventory item reads. Must use cursor pagination, cost monitoring, and exponential backoff. Estimated time: 3–8 minutes at sustained throughput. Progress must be shown in UI.
- **Print-action extension**: Triggers PDF generation and downloads the file. The extension cannot directly stream binary data; it must open the app's PDF endpoint URL in a new tab. This is the correct and reviewed pattern.
- **orders/create webhook**: Kept optional. Recent international order detection reads live from GraphQL on the affected-orders panel loader; webhooks for orders are not required for MVP.

### Should not be done in V1
- `read_all_orders` scope — regular `read_orders` covers the 60-day window sufficient for MVP
- In-app HS/COO writing — requires `write_products` and adds compliance complexity
- Batch PDF — out of scope per brief

### Biggest risks and mitigations

| Risk | Mitigation |
|------|-----------|
| `harmonizedSystemCode` / `countryCodeOfOrigin` not on Product/Variant — on InventoryItem | All queries explicitly traverse `variants.inventoryItem` in every query |
| Custom line items crash PDF generation | Explicit null guard: if `variant` or `inventoryItem` is null, use placeholder strings |
| Puppeteer binary in serverless container | Use dedicated Node.js server (not edge/serverless). Docker image pins Chromium. |
| Large catalog audit timeouts | BullMQ worker, cursor pagination, 50 products/page, rate-limit aware |
| App review PDF discoverability | Both order detail block CTA and print action registered; reviewed from both paths |
| Billing gate bypass | Every app route loader calls `billing.require()` before rendering |

---

## SECTION 3 — Final Architecture Decision

| Concern | Decision |
|---------|---------|
| Framework | `@shopify/shopify-app-remix` v3 + Remix v2 |
| Language | TypeScript strict mode |
| UI | Polaris v13 (embedded) |
| Hosting | Node.js container (Railway, Render, Fly.io, or AWS ECS) — must not be edge/serverless |
| Database | PostgreSQL 16 |
| ORM | Prisma v5 |
| Session storage | `@shopify/shopify-app-session-storage-prisma` |
| Queue | Redis 7 + BullMQ v5 |
| PDF | Puppeteer v22 (Chromium headless) |
| Extensions | Shopify UI Extensions (React) — 4 targets |
| Auth model | Session token via embedded App Bridge |
| API version | `2025-01` (pinned, quarterly) |
| Scopes | `read_products`, `read_orders` |
| Webhooks | customers/data_request, customers/redact, shop/redact, products/create, products/update, app/uninstalled |
| Logging | Structured JSON via pino |
| Local dev | `shopify app dev` with ngrok tunnel |

---

## SECTION 4 — Data Model

### What lives in Shopify (read-only, never stored)
- Product title, vendor, type, tags
- Variant price, weight, SKU
- InventoryItem ID, harmonizedSystemCode, countryCodeOfOrigin
- Order metadata, line items, shipping address
- Buyer name, email, address (read live at PDF generation time only)

### What lives in app DB
- Session tokens (via Prisma session storage adapter)
- Installation record (shop domain, billing status)
- Configuration (seller details, home country, exempt tags)
- ProductAuditRecord (customs completeness state per variant)
- AuditRun (progress and results per audit job)
- PdfGenerationLog (minimal operational record — no PII)

### What must NEVER be stored
- Customer name, email, phone, or address
- Buyer payment information
- Order line item customer notes containing PII
- IP addresses tied to customers

### Entity relationships
```
Installation (1) ─── (1) Configuration
Installation (1) ─── (*) AuditRun
Installation (1) ─── (*) ProductAuditRecord
Installation (1) ─── (*) PdfGenerationLog
AuditRun (1) ─── (*) ProductAuditRecord (via shopDomain + audit window)
```

---

## SECTION 5 — Merchant Workflow

### Install + first run
1. Merchant clicks "Add app" from Shopify App Store listing
2. OAuth redirects through Shopify; app stores session + access token
3. App redirects to Shopify Billing API approval page ($7/month, 14-day trial)
4. Merchant approves; billing status set to `active`
5. App home loads showing empty state + "Catalog audit starting…" banner
6. Background BullMQ job (catalogAudit) is enqueued automatically on install
7. UI polls `/api/audit-status` every 3 seconds; progress bar appears

### Configuration
8. Merchant opens Settings tab
9. Fills seller name, address, home country, contact email, phone
10. Optionally adds exempt tags (e.g., "digital", "giftcard")
11. Saves; Configuration upserted in DB

### Reviewing gaps
12. After audit completes, dashboard shows summary cards:
    - Total variants audited | Missing HS | Missing COO | Missing Both | % Complete
13. Gap table shows sortable rows: Product / Variant | HS | COO | Orders (30d) | Fix Status
14. Merchant sorts by "Orders (30d)" to prioritize high-volume gaps
15. Merchant clicks "Fix in Shopify" → deep-link opens product editor in new tab
16. Merchant edits HS/COO in Shopify admin → products/update webhook fires
17. Incremental re-audit runs for that product only
18. Gap table refreshes (next page load reads updated DB)

### Order readiness
19. Merchant views recent international orders in affected-orders panel
20. Each order shows Customs Readiness badge (Complete / Partial / Not Ready)
21. Merchant clicks order → order detail page
22. Order detail block shows per-line readiness rows + warnings for incomplete lines

### PDF generation
23. Merchant clicks "Generate Customs Invoice" in order detail block or action
24. App fetches order data live from Shopify GraphQL
25. App fetches seller configuration from DB
26. PDF rendered server-side via Puppeteer
27. PDF streamed to browser as download
28. PdfGenerationLog record created (no PII)
29. Merchant attaches PDF to shipment documentation

### Edge cases
- **Custom line items**: variant is null → show placeholder `[HS CODE REQUIRED]` / `[COO REQUIRED]`; PDF still generates
- **Partially complete**: some lines have HS+COO, others don't; status = `partial`; PDF generates with mixed data
- **Multi-currency**: use `order.currencyCode` throughout; no conversion; state currency clearly
- **Large catalog**: audit runs async; UI shows progress; partial results visible during run
- **Exempt tags**: products with matching tags skipped in audit; not counted in gap totals
- **Re-audit loop**: products/update fires once per save; worker is idempotent; safe to retry
- **Uninstall**: app/uninstalled webhook clears session; data retention per privacy policy

---

## SECTION 6 — GraphQL & Backend Design

### API version
All queries use `2025-01`. Pinned in `shopify.app.toml` and in every `admin.graphql()` call context.

### Catalog audit query (paginated)
```graphql
query AuditProducts($cursor: String, $first: Int!) {
  products(first: $first, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      title
      vendor
      productType
      tags
      variants(first: 100) {
        nodes {
          id
          title
          price
          weight
          inventoryItem {
            id
            harmonizedSystemCode
            countryCodeOfOrigin
          }
        }
      }
    }
  }
}
```
- Page size: 50 products (cost ~50*100 = 5000 units)
- After each page: check `extensions.cost.throttleStatus.currentlyAvailable`
- If available < 1000: sleep `Math.ceil((1000 - available) / restoreRate) * 1000` ms

### Product re-audit query (single product)
```graphql
query ReauditProduct($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    productType
    tags
    variants(first: 100) {
      nodes {
        id
        title
        price
        weight
        inventoryItem {
          id
          harmonizedSystemCode
          countryCodeOfOrigin
        }
      }
    }
  }
}
```

### Affected orders query (dashboard panel)
```graphql
query RecentOrders($cursor: String) {
  orders(first: 50, after: $cursor, 
         query: "created_at:>2024-01-01 shipping_address_country_code:NOT US") {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      name
      createdAt
      currencyCode
      totalPriceSet { shopMoney { amount currencyCode } }
      shippingAddress { countryCode country }
      lineItems(first: 50) {
        nodes {
          id
          title
          quantity
          variant {
            id
            inventoryItem {
              harmonizedSystemCode
              countryCodeOfOrigin
            }
          }
          originalUnitPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }
  }
}
```
- Filter by shipping country != home country (read from Configuration)
- Limit to last 60 days in query string
- Compute completeness per order in-memory; do not persist order PII

### Invoice generation query
```graphql
query OrderForInvoice($id: ID!) {
  order(id: $id) {
    id
    name
    createdAt
    currencyCode
    totalPriceSet { shopMoney { amount currencyCode } }
    shippingAddress {
      firstName lastName company
      address1 address2
      city province zip
      country countryCode phone
    }
    lineItems(first: 100) {
      nodes {
        id
        title
        quantity
        sku
        variant {
          id
          sku
          weight
          weightUnit
          inventoryItem {
            harmonizedSystemCode
            countryCodeOfOrigin
          }
        }
        originalUnitPriceSet { shopMoney { amount currencyCode } }
        discountedUnitPriceSet { shopMoney { amount currencyCode } }
        totalDiscountSet { shopMoney { amount currencyCode } }
      }
    }
    shippingLines(first: 5) {
      nodes {
        title
        originalPriceSet { shopMoney { amount currencyCode } }
      }
    }
  }
}
```

### Audit pipeline
1. `catalogAudit` job dequeued from `audit` BullMQ queue
2. Open AuditRun record (status: running)
3. Paginate products 50/page with cursor
4. Per product: iterate variants; for each variant read inventoryItem fields
5. Classify: complete | missing_hs | missing_coo | missing_both
6. Check exempt tags against Configuration.exemptTags
7. Upsert ProductAuditRecord (shopDomain + variantId unique key)
8. Update AuditRun.processedVariants counter every 250 variants
9. After all pages: set AuditRun.status = completed; set totals
10. On error: set AuditRun.status = failed; store errorSummary

### Re-audit pipeline (products/create, products/update)
1. Webhook verified, payload parsed for `id` (product GID = `gid://shopify/Product/{id}`)
2. `productReaudit` job enqueued with `{ shopDomain, productGid }`
3. Worker runs single-product query
4. Upsert ProductAuditRecord rows for all variants
5. Emit log entry

### Affected-orders computation
- Runs on app home loader (not cached indefinitely — max 5 min stale)
- Fetches last 60 days of orders with non-home-country shipping
- For each order: check each line item variant.inventoryItem for nulls
- Classify: complete (all lines have both) | partial (some) | not_ready (none or custom-only)
- Returns top 20 most recent, sorted by createdAt desc
- No order data persisted to DB (privacy boundary)

### Rate-limit strategy
- After every paginated response, read `extensions.cost`
- If `currentlyAvailable < restoreRate * 2`: sleep until buffer restored
- On HTTP 429: exponential backoff starting at 2s, max 30s, 5 retries
- Log all rate-limit events as structured JSON

---

## SECTION 7 — Admin UI & Extension Design

### App home (app/_index)

**Loading state (audit in progress):**
- ProgressBar with percentage from AuditRun.processedVariants / totalVariants
- "Catalog audit in progress — {n} of {m} variants scanned" text
- Polaris Spinner on summary cards

**Loaded — gaps exist:**
- Summary cards row: Total Variants | Missing HS | Missing COO | Missing Both | % Complete
- "Last audited: {relative time}" + "Re-scan catalog" button
- Gap table: sortable columns (Product Title, Variant, HS, COO, Orders 30d, Fix Status, Action)
- Fix Status dropdown per row: needs_review → under_review → customs_verified
- "Fix in Shopify" link opens `admin/products/{id}/variants/{id}` deep-link
- CSV Export button
- Affected Orders panel (collapsible or tab): order rows with badge + "View Order" link

**Empty state — no gaps:**
- Green checkmark illustration
- "Your catalog is customs-ready. All variants have HS codes and country of origin."
- Last audit time shown

**Empty state — first install, no audit run yet:**
- "Starting your first catalog audit…" with animated spinner

### Order detail block (`admin.order-details.block.render`)
- Block title: "Customs Readiness"
- Overall badge: Complete (green) | Partial (yellow) | Not Ready (red)
- Line items list: each line shows title + HS status + COO status
- Missing data shown as warning icon + "HS code missing" / "COO missing"
- Custom line items flagged: "[Custom item — customs data required]"
- Primary button: "Generate Customs Invoice" → triggers action render

### Order detail action (`admin.order-details.action.render`)
- Modal title: "Generate Commercial Invoice"
- Preview table: line-by-line HS / COO status
- Warning banner if incomplete: "This invoice will include placeholder values for {n} line items. Verify before filing."
- "Download PDF" button → fetches `/api/invoice/{orderId}` and triggers download
- "Cancel" button

### Print action (`admin.order-details.print-action.render`)
- Menu item label: "Customs Invoice (CustomsReady)"
- On trigger: opens `/api/invoice/{orderId}?print=1` in new tab (browser prints or downloads)

### Product detail block (`admin.product-details.block.render`)
- Block title: "Customs Data Status"
- Per-variant table: Variant title | HS Code | COO | Status badge
- If missing: warning icon + "Edit in Shopify to add this data" link
- If complete: green checkmark

### Empty / warning states
- All extensions handle `isLoading` state with skeleton UI
- All extensions handle fetch errors with "Unable to load customs data" + retry button
- Order block handles orders with zero line items gracefully

---

## SECTION 8 — File & Folder Structure

```
customsready-lite/
├── ARCHITECTURE.md
├── package.json                     # Dependencies, scripts
├── shopify.app.toml                 # App config, scopes, extensions, webhooks
├── vite.config.ts                   # Vite + Remix config
├── tsconfig.json                    # TypeScript strict config
├── .env.sample                      # All required env vars documented
├── Dockerfile                       # Production container (Node 20 + Chromium)
├── docker-compose.yml               # Local dev: app + postgres + redis
├── prisma/
│   └── schema.prisma                # Full DB schema, all 5 entities + Session
├── app/
│   ├── root.tsx                     # Remix root layout (AppProvider, Polaris)
│   ├── entry.client.tsx             # Remix client entry
│   ├── entry.server.tsx             # Remix server entry
│   ├── shopify.server.ts            # shopifyApp() singleton, billing config, exports
│   ├── db.server.ts                 # PrismaClient singleton
│   ├── queue.server.ts              # BullMQ Queue instances + IORedis connection
│   ├── lib/
│   │   ├── graphql.server.ts        # Typed GraphQL helpers, pagination, rate-limit
│   │   ├── audit.server.ts          # Audit classification logic, upsert helpers
│   │   ├── billing.server.ts        # Billing gate helper used by loaders
│   │   ├── pdf.server.ts            # Puppeteer render, HTML invoice template
│   │   └── logger.server.ts         # Pino structured JSON logger
│   ├── jobs/
│   │   ├── catalogAudit.worker.ts   # Full catalog BullMQ worker
│   │   └── productReaudit.worker.ts # Single-product re-audit BullMQ worker
│   └── routes/
│       ├── _index.tsx               # Redirects / → /app
│       ├── app.tsx                  # Auth layout, billing gate, Polaris AppProvider
│       ├── app._index.tsx           # Dashboard home: audit summary, gap table, orders
│       ├── app.settings.tsx         # Seller configuration form
│       ├── auth.$.tsx               # OAuth callback handler (shopify-app-remix)
│       ├── webhooks.$.tsx           # All webhook topics, verified + queued
│       ├── api.audit-status.ts      # Poll endpoint: current AuditRun progress
│       ├── api.csv-export.ts        # CSV download of gap records
│       ├── api.invoice.$orderId.ts  # PDF generation endpoint (streamed binary)
│       └── api.fix-status.ts        # PATCH fix status on ProductAuditRecord
└── extensions/
    ├── order-detail-block/
    │   ├── shopify.extension.toml   # target: admin.order-details.block.render
    │   └── src/index.tsx            # React extension: customs readiness + generate CTA
    ├── order-detail-action/
    │   ├── shopify.extension.toml   # target: admin.order-details.action.render
    │   └── src/index.tsx            # React extension: invoice preview modal + download
    ├── print-action/
    │   ├── shopify.extension.toml   # target: admin.order-details.print-action.render
    │   └── src/index.tsx            # React extension: triggers PDF URL in new tab
    └── product-detail-block/
        ├── shopify.extension.toml   # target: admin.product-details.block.render
        └── src/index.tsx            # React extension: per-variant HS/COO status
```

---

## SECTION 9 — Full Implementation Plan

### Phase 0 — Scaffold & Infrastructure (Days 1–2)
**Objective:** Working Shopify app shell that installs, authenticates, and shows a placeholder dashboard.

Files created:
- `package.json`, `tsconfig.json`, `vite.config.ts`
- `shopify.app.toml` with scopes + webhooks declared
- `prisma/schema.prisma` (all tables)
- `app/shopify.server.ts` — shopifyApp() with billing config
- `app/db.server.ts` — PrismaClient singleton
- `app/root.tsx`, `app/entry.client.tsx`, `app/entry.server.tsx`
- `app/routes/_index.tsx`, `app/routes/app.tsx`, `app/routes/auth.$.tsx`
- `.env.sample`, `Dockerfile`, `docker-compose.yml`

Acceptance criteria:
- `shopify app dev` starts without errors
- OAuth install flow completes against a dev store
- Billing approval flow triggered and completed
- Prisma migrations run: `npx prisma migrate dev`
- App home renders "Dashboard" heading (placeholder)

### Phase 1 — Queue Infrastructure & Audit Worker (Days 3–4)
**Objective:** Background catalog audit runs end-to-end; results in DB.

Files created:
- `app/queue.server.ts`
- `app/lib/graphql.server.ts`
- `app/lib/audit.server.ts`
- `app/lib/logger.server.ts`
- `app/jobs/catalogAudit.worker.ts`
- `app/jobs/productReaudit.worker.ts`
- `app/routes/api.audit-status.ts`

Acceptance criteria:
- On install, `catalogAudit` job enqueued and completes for a 50-product test store
- ProductAuditRecord rows upserted correctly
- AuditRun.status = completed; counters correct
- Rate-limit sleep logic triggers and recovers for large catalogs
- `GET /api/audit-status` returns progress JSON

### Phase 2 — Dashboard UI (Days 5–7)
**Objective:** Full gap dashboard readable from DB; CSV export works.

Files created:
- `app/routes/app._index.tsx` (full implementation)
- `app/routes/api.csv-export.ts`
- `app/routes/api.fix-status.ts`

Acceptance criteria:
- Summary cards show correct counts from DB
- Gap table renders with sorting working
- Fix status dropdown persists via PATCH route
- "Re-scan catalog" button enqueues new catalogAudit job
- Audit progress bar appears when AuditRun.status = running
- CSV downloads correct data
- Empty state shown when no gaps
- Affected orders panel shows international orders with readiness badges

### Phase 3 — Settings (Day 8)
**Objective:** Seller configuration saved and used in PDF.

Files created:
- `app/routes/app.settings.tsx`

Acceptance criteria:
- Configuration form saves all fields
- Seller name/address appear in PDF output
- Exempt tags respected in next catalog audit

### Phase 4 — PDF Generation (Days 9–10)
**Objective:** Professional commercial invoice PDF generated server-side.

Files created:
- `app/lib/pdf.server.ts` (Puppeteer + HTML template)
- `app/routes/api.invoice.$orderId.ts`

Acceptance criteria:
- PDF streams as `application/pdf` response
- Seller info, buyer info, all line items, totals rendered correctly
- Custom line items show `[HS CODE REQUIRED]` / `[COO REQUIRED]` highlighted
- Multi-currency order shows correct currency code throughout
- Partially complete order generates without crash
- PDF visually passes inspection (legible, professional)
- PdfGenerationLog row created (no PII in row)

### Phase 5 — Admin Extensions (Days 11–13)
**Objective:** All 4 extension targets built, registered, and testable in dev store.

Files created:
- All 4 extension directories with `shopify.extension.toml` and `src/index.tsx`

Acceptance criteria:
- Order detail block visible on order detail page
- Customs Readiness badge reflects actual order data
- "Generate Customs Invoice" button in block triggers action
- Action modal shows preview + download works
- Print action appears in print menu + downloads PDF
- Product detail block shows per-variant HS/COO status on product page

### Phase 6 — Webhooks (Day 14)
**Objective:** All webhooks verified, GDPR compliant, idempotent.

Files created:
- `app/routes/webhooks.$.tsx` (complete)

Acceptance criteria:
- Shopify HMAC signature verified on all webhooks
- GDPR webhooks respond 200 correctly
- products/create and products/update enqueue productReaudit and return 200
- app/uninstalled clears session
- Duplicate webhook deliveries handled idempotently

### Phase 7 — Hardening & Review Readiness (Days 15–16)
**Objective:** Error states, loading states, empty states, logging, App Store review readiness.

Tasks:
- Audit all routes for missing error boundaries
- Add Polaris SkeletonPage loading states
- Verify all empty states render
- Add compliance disclaimer copy to PDF footer
- Run Shopify App Store review checklist
- Verify no PII stored in DB
- Verify no external redirects
- Test billing gate bypass attempts

---

## SECTION 11 — Acceptance Test Matrix

| Scenario | Pass Criteria |
|----------|--------------|
| **Install flow** | OAuth completes, session stored, billing page shown, app home loads |
| **Billing — approve** | Subscription active, app home accessible, billing status = active |
| **Billing — decline** | Redirected back to billing page, app home not accessible |
| **Billing — gate bypass** | Direct URL to /app without subscription → redirected to billing |
| **Webhook HMAC invalid** | Returns 401, no processing |
| **customers/data_request** | Returns 200, no data emitted (no PII stored) |
| **customers/redact** | Returns 200 (nothing to delete — no PII stored) |
| **shop/redact** | Returns 200, Installation + Session deleted |
| **products/create webhook** | productReaudit job enqueued; new variant row created |
| **products/update webhook** | productReaudit job enqueued; variant row updated |
| **Duplicate webhook** | Second delivery processed idempotently, no duplicate DB rows |
| **Audit — small store (< 100 products)** | Completes in < 30s; all records upserted |
| **Audit — large store (500+ products)** | Progress bar shows; completes; no timeout |
| **Audit — exempt tags** | Tagged products not counted in gap totals |
| **Audit re-scan** | New AuditRun row created; previous records updated |
| **Gap table sort** | All 4 sort columns work; order persists within session |
| **CSV export** | Downloads CSV with correct headers + all gap rows |
| **Fix status update** | PATCH persists; row shows updated status on reload |
| **Fix in Shopify** | Deep-link opens correct product variant URL in new tab |
| **Affected orders — no international orders** | Empty state shown |
| **Order readiness — complete** | All lines have HS + COO → green "Complete" badge |
| **Order readiness — partial** | Some lines missing → yellow "Partial" badge |
| **Order readiness — not ready** | All lines missing → red "Not Ready" badge |
| **PDF — complete order** | All fields populated; no placeholders |
| **PDF — partial order** | Mixed data; placeholders highlighted in yellow |
| **PDF — custom line item** | Placeholder shown; no crash; warning visible |
| **PDF — multi-currency (EUR order)** | EUR shown throughout; no USD conversion |
| **PDF — seller config missing** | Warning in invoice; placeholder seller info shown |
| **PDF — download** | Response Content-Type: application/pdf; file downloads |
| **PDF — PdfGenerationLog** | Log row created; no PII in row |
| **Order detail block** | Visible on order detail page; badge correct |
| **Order detail action** | Modal opens; preview table correct; download works |
| **Print action** | Appears in print menu; triggers PDF |
| **Product detail block** | Visible on product page; variant-level status correct |
| **GDPR — no PII in DB** | Confirm no customer name/email/address in any table |
| **App Store — embedded** | All routes render inside Shopify admin iframe |
| **App Store — no external payment** | No Stripe/external checkout links anywhere |
| **App Store — billing API only** | Confirmed via code audit |

---

## SECTION 12 — Submission Readiness Checklist

### Required before App Store submission

**Technical:**
- [ ] `shopify.app.toml` app_url is production URL (not localhost)
- [ ] All 3 GDPR webhook endpoints registered and returning 200
- [ ] Billing API subscription tested end-to-end on dev store
- [ ] Billing gate tested: app inaccessible without active subscription
- [ ] All extensions registered in toml and building without errors
- [ ] Webhook HMAC verification passing for all topics
- [ ] No `console.log` PII in production logs
- [ ] Environment variables documented; no secrets in source
- [ ] Production Dockerfile builds and starts correctly
- [ ] Health check endpoint responding
- [ ] Database migrations applied in production

**Compliance copy (must appear verbatim):**
- PDF footer: "This document is generated from your Shopify store data. It must be reviewed and verified with your licensed customs broker or freight forwarder before filing. CustomsReady Lite does not provide legal, tax, or customs advice."
- App home: "CustomsReady Lite identifies potential customs data gaps in your catalog. It does not provide customs clearance services or legal compliance guarantees."
- App Store listing description: Must not claim "customs clearance", "legally compliant", "certified", or "guaranteed customs approval"

**Privacy policy requirements:**
- Hosted privacy policy URL required
- Must state: no customer PII stored; access token stored securely; data deletion process
- Must list: shopDomain, audit records, configuration, PDF generation logs as data stored

**Support requirements:**
- Support email address registered in Partner Dashboard
- Response time policy (recommend 48h)
- Searchable help documentation or FAQ page

**App Store listing:**
- At minimum 3 screenshots showing: dashboard, gap table, PDF invoice
- Short description ≤ 100 chars
- Long description with no compliance overclaims
- App icon (1200×628 and 512×512)
- Demo store or test credentials provided to reviewer

### Rejection risks

| Risk | Mitigation |
|------|-----------|
| Missing GDPR webhooks | All 3 registered in toml + verified in code |
| Billing not via Shopify API | No external payment path exists |
| App not embedded | All routes use App Bridge; no standalone UI |
| PII stored in DB | Confirmed by code audit: no customer fields in schema |
| PDF feature not discoverable by reviewer | Both block CTA and print action demonstrate it |
| Overclaiming compliance in copy | All compliance copy reviewed per section above |
| Scopes broader than needed | Only read_products + read_orders requested |

---

## SECTION 13 — Missing Information Ledger

| Item | Why it matters | Safest assumption | Blocks launch? |
|------|---------------|-------------------|----------------|
| Whether `inventoryItem.harmonizedSystemCode` is accessible via `read_products` alone in `2025-01` | Core audit query depends on this | Yes it is — confirmed in 2024-04 and later; test in dev store on install | No, but verify on first dev store test |
| Production hosting provider | Affects Dockerfile, environment vars, Redis setup | Railway or Render (simple Node + Redis + Postgres); config in docker-compose | No |
| SHOPIFY_API_KEY / SECRET | Required for shopify.app.toml and .env | Set in Shopify Partner Dashboard; use env vars | No (standard setup) |
| Chromium binary path in production container | Puppeteer needs a browser | Pin `puppeteer` version and use bundled Chromium; add `--no-sandbox` flag | No |
| Whether `read_orders` covers orders older than 60 days | Affects affected-orders window | Default `read_orders` covers last 60 days; acceptable for MVP | No — 60 days is sufficient |
| App Store review timeline | Affects launch date planning | 2–5 business days for new app submission | No |
| Merchant's home country detection (for "international" order filter) | Affects which orders appear in affected-orders panel | Read from Configuration.homeCountry; default to shop.primaryDomain country if unset | No |
