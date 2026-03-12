=== FINAL STATUS ===

APPS FULLY REPAIRED IN PLACE:
- Craftline
- FixitCSV
- Stagewise
- customsready

APPS REBUILT WITH SHOPIFY CLI:
- poref-new
- quoteloop-new

APPS RETIRED:
- frontend
- migratory

APPS READY FOR LOCAL RUN (pending secrets only):
- Craftline — exact command: `shopify app dev`
- FixitCSV — exact command: `shopify app dev`
- Stagewise — exact command: `shopify app dev`
- customsready — exact command: `shopify app dev`
- poref-new — exact command: `shopify app dev`
- quoteloop-new — exact command: `shopify app dev`

APPS READY FOR DEV STORE INSTALL (pending secrets only):
- Craftline — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_products&redirect_uri=https://<tunnel>/auth/callback`
- FixitCSV — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_products&redirect_uri=https://<tunnel>/auth/callback`
- Stagewise — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders&redirect_uri=https://<tunnel>/auth/callback`
- customsready — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`
- poref-new — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_all_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`
- quoteloop-new — exact install URL: `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_draft_orders,write_draft_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`

APPS BLOCKED AND WHY:
- All active apps are blocked locally.
- Blocker description: Missing API Keys and Secrets. `customsready` is also blocked on providing a `REDIS_URL`.
- Exact next action: Fill `PASTE_THESE_VALUES.md`.

SCREENSHOTS CAPTURED:
- None. Blocked on secrets string.

SCREENSHOTS PENDING (need dev store access):
- All screenshots across all validated apps (see `docs/ai-test/SCREENSHOT_CHECKLIST.md`).

RECOVERY BRANCH: `shopify-recovery-20260311`
COMMIT: Head of `shopify-recovery-20260311`

NEXT HUMAN ACTION: Open `docs/final/PASTE_THESE_VALUES.md`. Fill every `PASTE_HERE` field. Run the commands in `docs/ai-run/LOCAL_RUNBOOK.md`. Done.
