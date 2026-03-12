# Dev Store Test Plan

## Global Install URL Pattern
Replace `<store>`, `<client_id>`, `<scopes>`, and `<redirect_uri>`:
`https://<store>.myshopify.com/admin/oauth/authorize?client_id=<client_id>&scope=<scopes>&redirect_uri=<redirect_uri>`

## Craftline
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_products&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Completes OAuth, redirects to embedded App Bridge UI.
- **Extensions:** Verify `ui_extension` appears in correct target zone.

## FixitCSV
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_products&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Completes OAuth, redirects to embedded App Bridge UI.
- **Features:** File upload UI loads without console errors.

## Stagewise
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Embedded UI loads. Webhooks registering.

## customsready
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Embedded UI loads.
- **Extensions:** Verify `order-detail-block`, `product-detail-block` in admin.

## poref-new
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_orders,write_orders,read_all_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Checkout extension available into Checkout Editor. Theme app block available in Theme Editor.

## quoteloop-new
- **Install URL:** `https://<store>.myshopify.com/admin/oauth/authorize?client_id=PASTE_API_KEY_HERE&scope=read_draft_orders,write_draft_orders,read_customers&redirect_uri=https://<tunnel>/auth/callback`
- **Expected Behavior:** Embedded UI connects successfully. Polling loop operational.
