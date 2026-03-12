# Shopify App Inventory

Detailed report generated from monorepo structures.

## Craftline
* **Slug**: `craftline` (`Craftline/`)
* **Framework**: Remix + React Router
* **Embedded/Extensions**: Embedded Admin, Uses Extensions
* **Protection/Billing**: No protected scopes or explicitly registered billing
* **Value Prop**: Automates maker and production queues from Shopify orders
* **Public Domain Target**: `craftline.uplifttechnologies.pro`

## FixitCSV
* **Slug**: `fixitcsv` (`FixitCSV/`)
* **Framework**: Remix + React Router
* **Embedded/Extensions**: Embedded Admin, No Extensions
* **Protection/Billing**: No protected scopes or explicitly registered billing
* **Value Prop**: Validates and imports CSV data safely into Shopify
* **Public Domain Target**: `fixitcsv.uplifttechnologies.pro`

## Stagewise
* **Slug**: `stagewise` (`Stagewise/`)
* **Framework**: Remix + React Router
* **Embedded/Extensions**: Embedded Admin, No Extensions
* **Protection/Billing**: No protected scopes or explicitly registered billing
* **Value Prop**: Manages order staging and incremental fulfillment limits
* **Public Domain Target**: `stagewise.uplifttechnologies.pro`

## Customs Ready
* **Slug**: `customsready` (`customsready/`)
* **Framework**: Remix + React Router + BullMQ
* **Embedded/Extensions**: Embedded Admin, Uses Extensive Admin UI Extensions
* **Protection/Billing**: **Uses Protected Customer Data (`read_customers`)**, **Has Billing Engine**
* **Value Prop**: Prepares and prints customs declarations dynamically for international orders
* **Public Domain Target**: `customsready.uplifttechnologies.pro`

## PORef
* **Slug**: `poref` (`apps/poref-new/`)
* **Framework**: Remix + React Router
* **Embedded/Extensions**: Embedded Admin, Checkout UI, Theme App Extensions, POS UI Extension
* **Protection/Billing**: **Uses Protected Customer Data (`read_customers`)**, no explicit billing
* **Value Prop**: Captures and embeds Purchase Order references through checkout and POS
* **Public Domain Target**: `poref.uplifttechnologies.pro`

## QuoteLoop
* **Slug**: `quoteloop` (`apps/quoteloop-new/`)
* **Framework**: Remix + React Router
* **Embedded/Extensions**: Embedded Admin, No Extensions
* **Protection/Billing**: **Uses Protected Customer Data (`read_customers`)**, no explicit billing
* **Value Prop**: Connects draft orders seamlessly with external quoting lifecycles
* **Public Domain Target**: `quoteloop.uplifttechnologies.pro`
