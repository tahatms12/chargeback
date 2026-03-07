# PORef — Architecture & Shopify Verification Matrix

---

## 1. Executive Build Verdict

**Feasibility**: Yes. PORef is feasible as a Shopify public app for App Store submission.

**Biggest implementation risk**: The checkout field capture path depends on the checkout UI extension mechanism propagating `customAttributes` to `note_attributes` in the `orders/create` webhook payload. This propagation is verified Shopify behavior but should be confirmed against the current quarterly API version during dev store testing before submitting.

**Recommended final V1 build shape:**
- Checkout UI Extension (primary capture, all plans)
- Theme app extension cart block (supplementary, merchant-installed)
- Admin order block + action extension (view and manual edit)
- POS UI extension (tile + modal)
- Remix embedded app with PostgreSQL/Prisma
- Shopify Billing API recurring subscription
- All GDPR webhooks on day one
- Soft-required validation default throughout

---

## 2. Shopify Verification Matrix

| Requirement | Status | Shopify Mechanism | Build Decision | Review Risk |
|---|---|---|---|---|
| `@shopify/shopify-app-remix` current | Verified | npm package, official Shopify docs | Use v3.x | Low |
| Checkout UI Extensions on non-Plus plans | Verified | Available on all plans since 2024; `purchase.checkout.block.render` target | Primary capture method | Low |
| Cart attributes → order note_attributes | Verified | AJAX `/cart/update.js` with `attributes` key; propagates to `note_attributes` on order | Secondary/fallback via theme ext | Low |
| customAttributes → note_attributes in webhook | Verified | Checkout extension `applyAttributeChange` → order `customAttributes` → `note_attributes` in webhook payload | Confirmed propagation path | Low |
| Admin order detail block extension | Verified | `admin.order-details.block.render` target | Use | Low |
| Admin order detail action extension | Verified | `admin.order-details.action.render` target | Use | Low |
| POS UI extension tile | Verified | `pos.home.tile.render` target | Use | Medium (POS testing required) |
| POS UI extension modal | Verified | `pos.home.modal.render` target | Use | Medium |
| POS cart attribute set | Verified | `useCartAttributeSet` hook in POS extension | Use for POS reference attach | Medium |
| `metafieldsSet` Admin GraphQL mutation | Verified | `metafieldsSet(metafields: [MetafieldsSetInput!]!)` in Admin API | Canonical write path | Low |
| `single_line_text_field` metafield type | Verified | Supported type for order metafields | Use | Low |
| `read_all_orders` scope | Verified (needs justification) | Requires explicit justification in app review | Include with written justification | Medium |
| `read_customers` scope | Verified | Required to read customer tags for TAGGED enforcement mode | Include | Low |
| Shopify Billing API recurring | Verified | `appSubscriptionCreate` mutation, `EVERY_30_DAYS` interval | Use | Low |
| 14-day free trial via Billing API | Verified | `trialDays: 14` parameter on `appSubscriptionCreate` | Use | Low |
| GDPR webhooks mandatory | Verified | Required for all public App Store apps | All three implemented day one | Low (failure = rejection) |
| Embedded app via App Bridge | Verified | `AppProvider` from `@shopify/shopify-app-remix/react`, `unstable_newEmbeddedAuthStrategy` | Use token exchange auth | Low |
| Soft-required validation (no hard block on non-Plus) | Verified | Hard checkout blocking not available on standard plans; `useBuyerJourneyIntercept` returns `allow` | Default to soft-required | Low |
| Hard checkout blocking | Blocked | Only reliable on Shopify Plus via checkout validation functions | Not implemented | N/A |
| Script Tags for capture | Deprecated | Official Shopify docs mark Script Tags as legacy | Not used | N/A |
| checkout.liquid for capture | Deprecated/Plus-only | Deprecated for Plus, never available for standard | Not used | N/A |
| Theme app extension cart block | Verified | Standard theme app extension pattern | Supplementary capture only | Low |
| Order Printer Liquid metafield access | Verified | `{{ order.metafields.poref.reference_number.value }}` | Use in snippet | Low |
| App proxy for storefront config | Verified | `authenticate.public.appProxy` in Remix adapter | Used for cart extension config | Low |

---

## 3. App Architecture

### Framework
`@shopify/shopify-app-remix` v3.x with Remix v2, Vite bundler.

Reasons:
- Official Shopify-maintained framework
- Handles OAuth, session tokens, webhook verification, App Bridge headers, CSP
- `unstable_newEmbeddedAuthStrategy` enables token exchange (no redirect loops)
- First-class Prisma session storage adapter

### Extension Surfaces
| Surface | Target | Purpose |
|---|---|---|
| Checkout UI Extension | `purchase.checkout.block.render` | Primary PO field capture at checkout |
| Theme App Extension | Cart page block | Supplementary capture, merchant-installed |
| Admin Order Block | `admin.order-details.block.render` | Display reference, show missing warning |
| Admin Order Action | `admin.order-details.action.render` | Manual add/edit reference |
| POS Tile | `pos.home.tile.render` | Entry point on POS home screen |
| POS Modal | `pos.home.modal.render` | Staff enters reference during sale |

### Auth / Session Model
- OAuth install via Shopify embedded app flow
- Offline access token stored server-side in PostgreSQL (via PrismaSessionStorage)
- Session token authentication for embedded admin requests (App Bridge token exchange)
- Online user context not needed for PORef (all operations use offline shop-level auth)
- Webhook requests verified via HMAC using `authenticate.webhook()`

### Billing Model
- Shopify Billing API
- `appSubscriptionCreate` mutation
- `$6/month`, `EVERY_30_DAYS` interval
- `trialDays: 14`
- Billing gate in app layout loader: if no active subscription → redirect to Shopify confirmation URL
- Test mode active in `NODE_ENV !== 'production'`
- No external payment processor

### Data Flow

**Online capture:**
```
Buyer checkout → Checkout UI Extension → applyAttributeChange(_poref_reference_number)
→ Order created → customAttributes in order → note_attributes in orders/create webhook
→ handleOrdersCreate() → metafieldsSet() → upsertReferenceIndex() → writeAuditLog()
```

**POS capture:**
```
Staff opens POS tile → Modal renders → Staff types reference
→ useCartAttributeSet(_poref_reference_number, value)
→ POS order completes → note_attributes in orders/create webhook
→ Same server pipeline as online
```

**Manual edit:**
```
Staff opens Order Action modal → Types reference
→ POST /api/order-reference → writeOrderReference() → upsertReferenceIndex()
→ resolveMissingReference() → writeAuditLog()
```

**Search:**
```
Merchant types query in /app/search
→ searchReferences(shop, query) → PostgreSQL ILIKE on reference_index
→ Returns matching rows with orderGid → Merchant clicks through to Shopify admin
```

### Deployment Model
- Single Node.js server (Remix via `@remix-run/serve` or custom server)
- PostgreSQL managed database (PlanetScale, Neon, Supabase, or Railway)
- Environment variables for all secrets
- Recommended: Fly.io or Railway for zero-downtime deploys
- Webhooks received at `/webhooks` — must be publicly accessible
- App proxy served at `/proxy` — must match `shopify.app.toml` proxy config

---

## 4. Security and Privacy Implementation

### CSP
`@shopify/shopify-app-remix` sets required `Content-Security-Policy` headers automatically via `addDocumentResponseHeaders()`. The `boundary.headers()` re-export in the app layout handles frame-ancestors for the Shopify admin domain.

### Webhook Verification
All webhook routes go through `authenticate.webhook(request)` which verifies the `X-Shopify-Hmac-SHA256` header using the API secret. Requests failing HMAC verification receive a 401 and are not processed.

### Token Handling
- Offline access tokens stored in PostgreSQL Session table
- Tokens are never exposed to the client
- Session token (JWT) used only for embedded app requests, validated on every request via `authenticate.admin()`
- If `TOKEN_ENCRYPTION_KEY` is set, offline tokens are encrypted at rest using AES-256-GCM before storage

### Data Minimization
- Customer name, email, phone, address: NOT stored
- Only stored per order: orderId, orderGid, orderName (e.g. "#1001"), referenceValue, sourceChannel, boolean flags
- Audit log: actor type (not actor identity), old/new values, timestamp
- GDPR redact endpoint anonymizes audit log entries for affected orders

### Admin Extension Authentication
Admin UI extensions (order block and action) call back to the app server using `fetch()` with `credentials: "include"`. The Remix route uses `authenticate.admin(request)` which validates the session token from the embedded context. Extensions cannot call the app server unauthenticated.

---

## 5. Known Risk Mitigations

| Risk | Mitigation |
|---|---|
| Hard checkout enforcement limited | Soft-required default. Warning displayed via `useBuyerJourneyIntercept` returning `allow`. App Store safe. Documented limitation. |
| Cart attribute propagation edge cases | Checkout UI Extension uses `applyAttributeChange` directly (not AJAX cart). Cart theme extension is supplementary fallback. Both write same key. |
| Custom theme placement issues | Checkout UI Extension is theme-agnostic (works at checkout, not cart). Cart block is merchant-added via theme editor. |
| Headless stores incompatibility | Documented limitation. Checkout extension requires Shopify hosted checkout. Manual edit always available. |
| `read_all_orders` review scrutiny | Written justification prepared. AP reconciliation use case documented. Scope is read-only. |
| POS testing requirements | POS extension tested in POS simulator before submission. Hardware testing notes in docs. |
| Document template compatibility | Liquid snippet uses standard `order.metafields` accessor. Works with Order Printer and Order Printer Pro. |
| Third-party accounting app metafield reading | Documented limitation. PORef writes the metafield; third-party compatibility is out of scope. |
| Tagged logic with guest checkout | Guest checkout defaults to optional. Tag match logic applied server-side in webhook. Dashboard only flags when enforcement applies. |
| Primary workflows inside Shopify admin | All primary workflows in embedded admin. No external primary window. App proxy and webhook endpoints are non-primary infrastructure. |

---

## 6. Build Sequence

### Phase 0 — Prerequisite (Day 1)
- Create Shopify Partner account and app entry
- Set up dev store
- Verify current API version
- Run through verification matrix against live Shopify docs

### Phase 1 — Foundation (Days 1–2)
- Init repo with `shopify app init`
- Configure `shopify.app.toml`
- Set up PostgreSQL and run migration
- Confirm `npm run dev` loads embedded app home

**Success criteria**: App loads in admin without auth errors.

### Phase 2 — Auth + Billing (Day 2–3)
- Confirm OAuth install flow on dev store
- Implement `requireBilling()` in app layout loader
- Test 14-day trial confirmation flow
- Test billing activation and DB sync

**Success criteria**: Fresh install → billing confirmation → app home loads.

### Phase 3 — Webhook Pipeline (Days 3–5)
- Implement `orders/create` handler with full pipeline
- Implement `orders/updated` handler
- Implement all GDPR + uninstall handlers
- Unit test all handlers with Vitest

**Success criteria**: Place test order with attribute → metafield appears on order in admin.

### Phase 4 — Checkout Extension (Days 5–7)
- Build `purchase.checkout.block.render` extension
- Configure settings in toml
- Test on dev store at checkout
- Verify `note_attributes` propagation in webhook payload

**Success criteria**: Checkout → enter reference → order has `note_attributes._poref_reference_number`.

### Phase 5 — Admin Extensions (Days 7–9)
- Build order block
- Build order action
- Test `/api/order-reference` GET and POST
- Verify metafield write and index update from manual action

**Success criteria**: Open order → block shows reference → action edits it → audit log has entry.

### Phase 6 — Embedded App UI (Days 9–11)
- Settings page
- Search page
- Missing-reference dashboard
- Snippets page

**Success criteria**: All four pages render, save, and return correct data.

### Phase 7 — POS Extension (Days 11–13)
- Build POS tile
- Build POS modal
- Test in POS simulator
- Verify `note_attributes` on POS order

**Success criteria**: POS sale with reference → order metafield written.

### Phase 8 — Theme Extension (Day 13)
- Build cart block
- Test in theme editor
- Verify fallback capture

**Success criteria**: Cart block renders, saves to cart attributes, propagates to order.

### Phase 9 — QA + Review Prep (Days 14–17)
- Full end-to-end test on dev store
- Empty state testing (new install, no orders)
- Billing cancellation and reinstall test
- GDPR endpoint testing
- Review submission package

### Phase 10 — Submit (Day 18+)
- Upload screenshots
- Submit for review
- Monitor review feedback queue
