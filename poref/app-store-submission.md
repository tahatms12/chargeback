# PORef — App Store Submission Package

---

## App Listing Description

**Headline (80 chars max)**
Capture buyer PO and reference numbers at checkout, search them instantly.

**Short Description (160 chars)**
PORef adds a PO/reference field to checkout and POS, saves it to orders, and makes it searchable. No more missing reference numbers on invoices.

**Long Description**

PORef solves a specific, painful problem for business-to-business Shopify merchants: buyer PO and reference numbers that should appear on invoices keep getting lost between checkout and the order record.

**What PORef does:**

PORef adds a labeled input field to your checkout and POS. When a buyer enters their PO number, job reference, or project code, it is automatically saved to the order and indexed for fast search. It appears on your order record, in your Order Printer invoices, and in your notification emails — without any manual intervention.

**Key features:**

- Configurable field label: "PO Number", "Job Reference", "Project Code", or any label you choose
- Checkout field works on all Shopify themes via Checkout UI Extension
- POS tile and modal for staff-entered references on in-person sales
- Instant search across all orders by reference value — including orders older than 60 days
- Order detail block showing the captured reference on every order
- Edit or add a missing reference directly from the order page
- Dashboard showing recent orders missing a reference, so you can resolve gaps
- Enforcement mode: optional, required for all buyers, or required only for tagged customers
- Copy-paste snippets for Order Printer, Order Printer Pro, and notification email templates
- Full audit trail for every reference create and edit

**Who this is for:**

Wholesalers, trade sellers, interior designers, building material suppliers, made-to-order brands, and any merchant whose buyers need a PO number on their invoice to release payment.

**Pricing:**
$6/month — 14-day free trial.

---

## Scope Justification Text
(For Shopify App Review submission form)

**read_orders**
Required to read order data and display PO references in the order detail admin extension. Also used to verify order existence before writing metafields.

**write_orders**
Required to write the `poref.reference_number` metafield to orders using the `metafieldsSet` Admin GraphQL mutation. This is the canonical storage location for captured references.

**read_all_orders**
Required to support merchant use case of searching orders by PO/reference number for AP (accounts payable) reconciliation. Business buyers frequently need to match invoices to PO numbers on orders placed more than 60 days ago. Without `read_all_orders`, the Admin API only returns orders from the past 60 days, which breaks the AP reconciliation use case that is the core value of this app. We only use this scope to write order metafields and read order data within our own app. We do not share, export, or transmit order data to third parties.

**read_customers**
Required to evaluate customer tags when enforcement mode is set to "Required for tagged customers only". The app checks whether the customer placing an order has a tag that matches the merchant's configured required-tag list. Customer PII (name, email, address) is never stored in the app database. Only the customer's tag list is read at webhook processing time, and only tag match status (boolean) is stored.

---

## Privacy Policy Outline

**Data we collect:**
- Shopify shop domain (for authentication and data scoping)
- Shopify session tokens (temporary, server-side only, never client-stored)
- Shopify order IDs and order names (not customer names)
- PO/reference number strings entered by buyers or staff
- Audit log entries: actor type (webhook/staff/system), old value, new value, timestamp
- App billing subscription ID

**Data we do not collect:**
- Customer name, email, phone number, or address
- Payment method information
- Product details beyond what is necessary for order correlation
- Browser fingerprints or behavioral tracking data

**Data retention:**
All merchant data is retained for the duration of the app installation. On receipt of a `shop/redact` GDPR webhook (issued 48 hours after uninstall), all data for that shop is permanently deleted.

**Data sharing:**
No customer or order data is shared with third parties. No advertising or analytics tracking is performed.

**GDPR compliance:**
The app implements all three mandatory GDPR webhooks:
- `customers/data_request`: Acknowledged. We hold no customer PII.
- `customers/redact`: Audit log entries for affected orders are anonymized.
- `shop/redact`: All app data for the shop is deleted within 24 hours.

---

## Support Page Outline

**FAQ**

Q: The PO field is not appearing at checkout.
A: PORef uses a Checkout UI Extension. Open your theme customizer and confirm the PORef block has been added to the checkout contact section. The extension is enabled by default after install.

Q: I use a custom/headless theme. Will PORef work?
A: The Checkout UI Extension works on standard Shopify checkout regardless of your storefront theme. If you use a headless storefront that bypasses Shopify's hosted checkout, PORef's checkout field is not compatible. The POS capture and manual order edit features still work.

Q: A buyer entered a reference but it's not showing on the order.
A: Check the order's note_attributes in Shopify admin or contact support. The most common causes are: (1) the buyer did not submit the cart after entering the value, or (2) the webhook failed — in that case use the order detail action to add it manually.

Q: Can I edit a reference that was entered incorrectly?
A: Yes. Open the order in Shopify admin and click the PORef action button to edit the reference. All changes are logged in the audit trail.

Q: The reference appears in PORef search but not on my Order Printer invoice.
A: Copy the Liquid snippet from the Snippets page in PORef and paste it into your Order Printer template.

Q: Can I use PORef for headless storefronts?
A: The checkout UI extension only works with Shopify's hosted checkout. If your headless storefront uses Shopify's checkout (common), it works. If your storefront uses a fully custom checkout bypass, it does not. Manual entry via order action is always available.

---

## Screenshot Checklist

1. App home dashboard — showing missing reference count
2. Settings page — field label and enforcement mode configuration
3. Checkout page with PORef field visible (desktop)
4. Checkout page with PORef field visible (mobile)
5. Order detail page showing the reference block with captured value
6. Order detail page showing the reference block with "Missing" warning
7. Order action modal — editing a reference
8. Search page with results
9. Document snippets page
10. POS tile visible on POS home screen
11. POS modal with reference input

---

## Reviewer Notes

- The app uses `read_all_orders` — justification: AP reconciliation requires searching orders older than 60 days by PO number. Full justification in scope section above.
- The checkout field uses soft-required validation. It warns buyers but does not hard-block checkout. This is intentional for compatibility and App Store safety.
- All three GDPR compliance webhooks are implemented and respond 200.
- `shop/redact` deletes all app data for the shop.
- Billing uses Shopify Billing API recurring subscription at $6/month with 14-day trial. Test mode is active in development.
- The app is fully embedded in Shopify admin. There are no primary workflows in external windows.
- No third-party payment processors are used.
- No customer PII is stored in the app database.

---

## Known Limitations

- **Headless storefronts with custom checkout**: The checkout UI extension does not work on fully custom checkout implementations that bypass Shopify's hosted checkout flow.
- **Soft-required validation only**: Hard checkout blocking is not available on standard Shopify plans. Buyers can proceed without entering a reference if the field is required. The missing-reference dashboard exists to resolve these cases.
- **Guest checkout + tagged enforcement**: For guest checkouts, customer tags cannot be determined before order creation. Tag-based enforcement applies after the order is placed (for dashboard flagging), not as a pre-order gate.
- **POS testing**: The POS extension requires a physical or simulator device running Shopify POS. Behavior on specific POS hardware (card readers, receipt printers) should be tested by the merchant.
- **Order Printer compatibility**: The Liquid snippet works with both Order Printer and Order Printer Pro. Custom third-party invoice apps that do not support Liquid metafield access are not compatible without custom integration.
- **Third-party accounting sync**: PORef surfaces references via order metafields. Whether third-party accounting apps (Xero, QuickBooks) read Shopify order metafields depends on those apps' implementation. PORef makes no guarantees about third-party app compatibility.
