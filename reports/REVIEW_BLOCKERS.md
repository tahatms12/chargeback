# Shopify App Store Review Blocker Verification

**Run Date**: 2026-03-12T03:36:35.751Z
**Purpose**: Static analysis of `shopify.app.toml` configurations for common App Store rejection causes.

## Checklist
- `[webhooks]`: GDPR mandate topics (`customers/data_request`, `customers/redact`, `shop/redact`).
- URLs: No `localhost` outside of `dev` environments.
- App proxies / Subscriptions block definitions.

---

### App: `Craftline`
❌ **FAIL**: Missing mandatory GDPR webhooks: customers/data_request, customers/redact, shop/redact. **[BLOCKER]**
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.


### App: `FixitCSV`
✅ **PASS**: GDPR Webhooks configured.
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.


### App: `Stagewise`
❌ **FAIL**: Missing mandatory GDPR webhooks: customers/data_request, customers/redact, shop/redact. **[BLOCKER]**
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.


### App: `customsready`
✅ **PASS**: GDPR Webhooks configured.
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.


### App: `apps/poref-new`
✅ **PASS**: GDPR Webhooks configured.
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.


### App: `apps/quoteloop-new`
❌ **FAIL**: Missing mandatory GDPR webhooks: customers/data_request, customers/redact, shop/redact. **[BLOCKER]**
✅ **PASS**: No hardcoded `localhost` in root application_url detected.
ℹ️ **INFO**: App is embedded in Shopify Admin.

