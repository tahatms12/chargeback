# Master App Store Listing Drafts

# Content Inference: craftline

**Positioning:** Order synchronization and maker queue automation.
**Problem Solved:** Tracking production status of customized orders across multiple makers requires constant manual syncing.
**Primary User:** Make-to-order merchants

## Core Features
- Automated production queues
- Order state synchronization

## How it works
Syncs Shopify orders into customizable production queues automatically based on product tags.

## Requirements & Limitations
- **Setup:** Configure tags for makers.
- **Prerequisites:** None
- **Online Store Required:** No
- **Limitations:** Does not support raw material inventory tracking.

## Support & Compliance
- **Support Themes:** Setup configuration, queue rule troubleshooting.
- **Data Handling:** Reads order line items; standard retention.

---

## App Store Safe Copy (Compliant)
> Automate production queues for make-to-order operations.

## Website Safe Copy (Expanded Context)
> Craftline connects your Shopify orders directly to maker workstations. Define rules once and let products route themselves to fulfillment queues automatically without spreadsheets.


---\

# Content Inference: fixitcsv

**Positioning:** Robust, validated CSV data imports.
**Problem Solved:** Formatting errors in bulk CSV uploads cause silent failures or corrupted catalog data.
**Primary User:** Store operators and catalog managers

## Core Features
- Safe CSV parsing
- Pre-import validation
- Syntax error highlighting

## How it works
Upload your exact CSV locally, FixitCSV validates the formatting constraints before hitting Shopify APIs, then injects the clean data.

## Requirements & Limitations
- **Setup:** None
- **Prerequisites:** None
- **Online Store Required:** No
- **Limitations:** File sizes up to 10MB per upload.

## Support & Compliance
- **Support Themes:** CSV formatting rules, error deciphering.
- **Data Handling:** Processes files in memory; files are not retained post-import.

---

## App Store Safe Copy (Compliant)
> Import catalog and bulk data safely via validated CSV.

## Website Safe Copy (Expanded Context)
> Stop guessing why your catalog imports failed. FixitCSV provides safe, validated CSV parsing with exact error highlighting before your data hits Shopify APIs.


---\

# Content Inference: stagewise

**Positioning:** Incremental staging for complex fulfillment operations.
**Problem Solved:** Large or complex orders cannot always be fulfilled simultaneously.
**Primary User:** Merchants with staged fulfillment or multi-warehouse logistics

## Core Features
- Staged fulfillment management
- Progressive order statuses

## How it works
Hooks into the order lifecycle to mark progressive states of a multi-stage fulfillment cycle.

## Requirements & Limitations
- **Setup:** Map active fulfillment locations.
- **Prerequisites:** None
- **Online Store Required:** No
- **Limitations:** Does not replace third-party logistics integrations.

## Support & Compliance
- **Support Themes:** Location mismatch, webhook synchronization delays.
- **Data Handling:** Processes order IDs and fulfillment statuses.

---

## App Store Safe Copy (Compliant)
> Manage multi-stage order fulfillment workflows.

## Website Safe Copy (Expanded Context)
> Stagewise lets your team break large or complex orders into incremental fulfillment steps without confusing customer notifications.


---\

# Content Inference: customsready

**Positioning:** Dynamic customs documentation preparation for international orders.
**Problem Solved:** Generating accurate customs declarations for international shipments is a high-liability manual task.
**Primary User:** High-volume international shippers

## Core Features
- Forms generation
- Order admin integration
- Product classification sync

## How it works
Reads international orders, matches product weights and HS codes, and prints localized customs declarations directly from the Shopify Admin order view.

## Requirements & Limitations
- **Setup:** Input baseline HS codes for catalog.
- **Prerequisites:** None
- **Online Store Required:** No
- **Limitations:** Carrier-specific requirements may still need manual tuning depending on integration level.

## Support & Compliance
- **Support Themes:** Label generation failures, missing HS codes.
- **Data Handling:** Reads customer shipping addresses (Protected Customer Data required for labels). Retains logs strictly for 30-day debug cycles.

---

## App Store Safe Copy (Compliant)
> Generate and print localized customs documentation directly from the order page.

## Website Safe Copy (Expanded Context)
> Stop hand-typing international shipping documentation. CustomsReady automatically aligns your catalog HS codes with international orders so your fulfillment team can print completed declarations instantly.


---\

# Content Inference: poref

**Positioning:** Seamless Purchase Order reference tracking across checkout and POS.
**Problem Solved:** B2B customers often need to provide their internal PO references at the moment of checkout, but standard Shopify flows lack a unified PO capture mechanism.
**Primary User:** B2B and blended merchants

## Core Features
- Checkout Extension block
- POS Extension integration
- Admin order visibility

## How it works
Injects a PO capture field at checkout and POS, saving the reference to order attributes seamlessly.

## Requirements & Limitations
- **Setup:** Enable Checkout/POS extensions in settings.
- **Prerequisites:** Checkout Extensibility enabled.
- **Online Store Required:** Yes
- **Limitations:** Only viable for Shopify plans containing Checkout Extensibility or newer.

## Support & Compliance
- **Support Themes:** Checkout block placement, theme integration.
- **Data Handling:** Reads orders. Attaches new metadata to orders.

---

## App Store Safe Copy (Compliant)
> Capture customer Purchase Order numbers smoothly during Checkout and POS flows.

## Website Safe Copy (Expanded Context)
> Empower your B2B buyers. PORef naturally injects Purchase Order capture straight into your Shopify Checkout and POS experiences, ensuring invoice reconciliation is flawless.


---\

# Content Inference: quoteloop

**Positioning:** Automated draft order synchronization and quote messaging.
**Problem Solved:** Following up manually on Draft Orders/Quotes slows down B2B sales cycles.
**Primary User:** Wholesale businesses drafting custom orders

## Core Features
- Draft order parsing
- Quote notifications
- Automated email synchronization

## How it works
Watches for drafted orders and synchronizes quote notifications automatically via external email connections.

## Requirements & Limitations
- **Setup:** Connect designated sender email profiles.
- **Prerequisites:** None
- **Online Store Required:** No
- **Limitations:** Requires external email provider setup.

## Support & Compliance
- **Support Themes:** Draft order status misreads, email delivery bouncing.
- **Data Handling:** Reads customer email strings (Protected Data).

---

## App Store Safe Copy (Compliant)
> Synchronize and send quote notifications from drafted orders seamlessly.

## Website Safe Copy (Expanded Context)
> Accelerate your wholesale pipeline. Quando you create a draft order, QuoteLoop automatically parses the contents and structures an outbound quote notification.


---\


