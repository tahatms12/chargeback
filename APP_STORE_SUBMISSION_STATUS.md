# App Store Submission Status

This document separates **infrastructure completed** from actual **Shopify submission readiness**.

## 1) Chargeback

### Infra completed
- Path-based public route reserved: `/chargeback` via root gateway.
- Prefix stripping enabled so app can continue behaving as root-mounted internally.

### Shopify config completed
- Not modified in-repo to honor immutability and missing folder constraints.
- Requires manual Partner Dashboard URL updates.

### Code submission ready?
- **Unknown from this repo snapshot** (source folder not present here).

### Checklist
- [ ] Production App URL set to `https://uplifttechnologies.pro/chargeback`
- [ ] Redirect URLs set for `/chargeback/*callback`
- [ ] Embedded app loads in Shopify Admin iframe
- [ ] OAuth/session flow validates behind path prefix
- [ ] Webhooks reachable at `/chargeback/webhooks`
- [ ] Billing flow sanity-check (if used)
- [ ] Privacy policy URL configured
- [ ] Support/contact URL configured
- [ ] Reviewer test account/instructions prepared

### Reviewer instructions (draft)
1. Install Chargeback on review store.
2. Open app from Shopify Admin; confirm it resolves under `/chargeback` and loads embedded UI.
3. Execute one primary business workflow and confirm no auth loops.

---

## 2) CustomsReady

### Infra completed
- Public route wired to `/customsready` through gateway.
- Root-path assumption handled via proxy prefix stripping.

### Shopify config completed
- `customsready/shopify.app.toml` updated with production path-based App URL and redirect URLs.

### Code submission ready?
- **Infra-ready; functional submission readiness still requires full E2E validation on a dev store.**

### Checklist
- [x] Production App URL set
- [x] Redirect URLs set
- [ ] Install/auth flow verified on production-like domain
- [ ] Embedded admin route test (`/customsready/app`)
- [ ] Webhooks verified under `/customsready/webhooks`
- [ ] Billing status declared (currently non-billing in config)
- [ ] Listing assets finalized (icon, screenshots, copy)
- [ ] Privacy policy / support URL / contact URL confirmed
- [ ] Reviewer instructions validated end-to-end

### Reviewer instructions (draft)
1. Install app on test store.
2. Launch app from admin and confirm embedded load.
3. Trigger product update and confirm webhook handling.
4. Verify no redirect loops during auth callbacks.

---

## 3) PORef

### Infra completed
- Public route wired to `/poref` through gateway.
- Prefix stripping configured for root-mounted runtime compatibility.

### Shopify config completed
- `poref/shopify.app.toml` application URL set to path-based domain and redirect URLs added.

### Code submission ready?
- **Not yet** in this snapshot: runtime implementation appears partial (no complete runnable app package found).

### Checklist
- [x] Production App URL set
- [x] Redirect URL candidates provided
- [ ] Full runtime packaged/deployed
- [ ] Install/auth flow verified
- [ ] Embedded admin app route verified
- [ ] `orders/create` + `orders/updated` webhook verification
- [ ] GDPR webhook verification
- [ ] Billing flow verification (`appSubscriptionCreate`) if enabled
- [ ] POS/Checkout extensions tested in eligible environments
- [ ] Listing assets and policy/support/contact URLs finalized

### Reviewer instructions (draft)
1. Install PORef on test store.
2. Complete checkout/order flow producing PO reference.
3. Confirm reference appears in admin surfaces and webhook processing logs.
4. Confirm app remains embedded and path-stable at `/poref`.

---

## Global blockers still remaining
1. **Chargeback source absent in this repo snapshot**, so in-repo Shopify config updates cannot be applied for that app.
2. **PORef runtime appears incomplete**; infra routing is ready but code-level submission readiness needs completion and test evidence.
3. Shopify Partner Dashboard values must be entered manually for all three apps (URLs and redirect URLs).
