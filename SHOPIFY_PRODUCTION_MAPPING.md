# Shopify Production Mapping

## Chargeback
- **App name:** Chargeback
- **Folder:** `chargeback/` (not present in this repo snapshot; treated as immutable external app)
- **Production URL:** `https://uplifttechnologies.pro/chargeback`
- **Embedded app base path:** `/chargeback`
- **Redirect URL candidates (Partner Dashboard manual entry):**
  - `https://uplifttechnologies.pro/chargeback/auth/callback`
  - `https://uplifttechnologies.pro/chargeback/auth/shopify/callback`
  - `https://uplifttechnologies.pro/chargeback/api/auth/callback`
- **Webhook endpoint candidate:** `https://uplifttechnologies.pro/chargeback/webhooks`
- **Billing note:** preserve existing billing implementation unchanged (manual dashboard verification required).
- **Deploy path:** independent service routed by gateway from `/chargeback`.
- **Reviewer test entry:** install app on test store, then open Admin app link resolving to `/chargeback`.

## CustomsReady
- **App name:** CustomsReady Lite
- **Folder:** `customsready/`
- **Production URL:** `https://uplifttechnologies.pro/customsready`
- **Embedded app base path:** `/customsready`
- **Redirect URL candidates:**
  - `https://uplifttechnologies.pro/customsready/auth/callback`
  - `https://uplifttechnologies.pro/customsready/auth/shopify/callback`
  - `https://uplifttechnologies.pro/customsready/api/auth/callback`
- **Webhook endpoint:** `https://uplifttechnologies.pro/customsready/webhooks`
- **Billing note:** no active billing flow found in committed app config; treat as non-billing until enabled.
- **Deploy path:** dedicated service routed by gateway from `/customsready`.
- **Reviewer test entry:** after install, verify embedded admin load at `/customsready/app` and verify webhook + auth callbacks.

## PORef
- **App name:** PORef
- **Folder:** `poref/`
- **Production URL:** `https://uplifttechnologies.pro/poref`
- **Embedded app base path:** `/poref`
- **Redirect URL candidates (add in Partner Dashboard / app config):**
  - `https://uplifttechnologies.pro/poref/auth/callback`
  - `https://uplifttechnologies.pro/poref/auth/shopify/callback`
  - `https://uplifttechnologies.pro/poref/api/auth/callback`
- **Webhook endpoint candidate:** `https://uplifttechnologies.pro/poref/webhooks`
- **Billing note:** architecture docs indicate planned recurring billing (`$6/mo`, 14-day trial); verify in implemented runtime before submission.
- **Deploy path:** dedicated PORef runtime service routed by gateway from `/poref`.
- **Reviewer test entry:** install on dev store, verify embedded launch and order-reference workflows.

---

## Environment Variable Ownership Matrix

| Variable Namespace | Consumed By | Purpose |
|---|---|---|
| `CHARGEBACK_*` | gateway + chargeback deployment | Upstream target, app URL, OAuth/billing values for Chargeback |
| `CUSTOMSREADY_*` | customsready service + gateway | App URL, secrets, DB/session/billing env (if enabled) |
| `POREF_*` | poref service + gateway | App URL, secrets, DB/session/billing env |

Keep secrets in app-specific secret stores (or app-specific `.env` files outside source control) and avoid cross-app secret reuse.
