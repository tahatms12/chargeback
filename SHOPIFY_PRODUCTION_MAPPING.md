# Shopify Production Mapping

All production domains and callback targets are env-driven. Use `.env.example` (root) plus app-level env files to define canonical values before deployment.

## Chargeback
- **App name:** Chargeback
- **Folder:** `chargeback/` (not present in this repo snapshot; treated as immutable external app)
- **Production URL:** `${CHARGEBACK_PUBLIC_BASE_URL}`
- **Embedded app base path:** `${CHARGEBACK_EMBEDDED_BASE_PATH:-/chargeback}`
- **Redirect URL candidates (Partner Dashboard manual entry):**
  - `${CHARGEBACK_PUBLIC_BASE_URL}/auth/callback`
  - `${CHARGEBACK_PUBLIC_BASE_URL}/auth/shopify/callback`
  - `${CHARGEBACK_PUBLIC_BASE_URL}/api/auth/callback`
- **Webhook endpoint candidate:** `${CHARGEBACK_PUBLIC_BASE_URL}/webhooks`
- **Billing note:** preserve existing billing implementation unchanged (manual dashboard verification required).
- **Deploy path:** independent service routed by gateway from `${CHARGEBACK_EMBEDDED_BASE_PATH:-/chargeback}`.
- **Reviewer test entry:** install app on test store, then open Admin app link resolving to `${CHARGEBACK_EMBEDDED_BASE_PATH:-/chargeback}`.

## CustomsReady
- **App name:** CustomsReady Lite
- **Folder:** `customsready/`
- **Production URL:** `${CUSTOMSREADY_PUBLIC_BASE_URL}`
- **Embedded app base path:** `${CUSTOMSREADY_EMBEDDED_BASE_PATH:-/customsready}`
- **Redirect URL candidates:**
  - `${CUSTOMSREADY_PUBLIC_BASE_URL}/auth/callback`
  - `${CUSTOMSREADY_PUBLIC_BASE_URL}/auth/shopify/callback`
  - `${CUSTOMSREADY_PUBLIC_BASE_URL}/api/auth/callback`
- **Webhook endpoint:** `${CUSTOMSREADY_PUBLIC_BASE_URL}/webhooks`
- **Billing note:** no active billing flow found in committed app config; treat as non-billing until enabled.
- **Deploy path:** dedicated service routed by gateway from `${CUSTOMSREADY_EMBEDDED_BASE_PATH:-/customsready}`.
- **Reviewer test entry:** after install, verify embedded admin load at `${CUSTOMSREADY_EMBEDDED_BASE_PATH:-/customsready}/app` and verify webhook + auth callbacks.

## PORef
- **App name:** PORef
- **Folder:** `poref/`
- **Production URL:** `${POREF_PUBLIC_BASE_URL}`
- **Embedded app base path:** `${POREF_EMBEDDED_BASE_PATH:-/poref}`
- **Redirect URL candidates (add in Partner Dashboard / app config):**
  - `${POREF_PUBLIC_BASE_URL}/auth/callback`
  - `${POREF_PUBLIC_BASE_URL}/auth/shopify/callback`
  - `${POREF_PUBLIC_BASE_URL}/api/auth/callback`
- **Webhook endpoint candidate:** `${POREF_PUBLIC_BASE_URL}/webhooks`
- **Billing note:** architecture docs indicate planned recurring billing (`$6/mo`, 14-day trial); verify in implemented runtime before submission.
- **Deploy path:** dedicated PORef runtime service routed by gateway from `${POREF_EMBEDDED_BASE_PATH:-/poref}`.
- **Reviewer test entry:** install on dev store, verify embedded launch and order-reference workflows.

---

## Environment Variable Ownership Matrix

| Variable Namespace | Consumed By | Purpose |
|---|---|---|
| `CHARGEBACK_*` | gateway + chargeback deployment | Upstream target, app URL, OAuth/billing values for Chargeback |
| `CUSTOMSREADY_*` | customsready service + gateway | App URL, secrets, DB/session/billing env (if enabled) |
| `POREF_*` | poref service + gateway | App URL, secrets, DB/session/billing env |

Keep secrets in app-specific secret stores (or app-specific `.env` files outside source control) and avoid cross-app secret reuse.
