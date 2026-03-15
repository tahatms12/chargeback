# Paste These Values

=== APP: Craftline ===

File: `Craftline/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
SCOPES=read_orders,write_orders,read_products
---

File: `Craftline/shopify.app.toml`
Line: `client_id = ""`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

=== APP: FixitCSV ===

File: `FixitCSV/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
SCOPES=read_orders,write_orders,read_products
---

File: `FixitCSV/shopify.app.toml`
Line: `client_id = ""`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

=== APP: Stagewise ===

File: `Stagewise/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
SCOPES=read_orders,write_orders
---

File: `Stagewise/shopify.app.toml`
Line: `client_id = ""`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

=== APP: customsready ===

File: `customsready/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
REDIS_URL=redis://localhost:6379
SCOPES=read_orders,write_orders,read_customers
---

File: `customsready/shopify.app.toml`
Line: `client_id = ""`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

=== APP: poref-new ===

File: `apps/poref-new/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
SCOPES=read_orders,write_orders,read_all_orders,read_customers
---

File: `apps/poref-new/shopify.app.toml`
Line: `client_id = "00000000000000000000000000000000"`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

=== APP: quoteloop-new ===

File: `apps/quoteloop-new/.env`
---
SHOPIFY_API_KEY=PASTE_KEY_HERE
SHOPIFY_API_SECRET=PASTE_SECRET_HERE
DATABASE_URL=file:./prisma/dev.db
SCOPES=read_draft_orders,write_draft_orders,read_customers
---

File: `apps/quoteloop-new/shopify.app.toml`
Line: `client_id = ""`
Replace with: `client_id = "PASTE_KEY_HERE"`
---

fit all that shit the api keys are keeping this here CustomsReady Lite

Client ID: 4f41ad971e2764edd783199602e89f90
Client Secret: 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
App URL: https://customsready.uplifttechnologies.pro
Redirect URLs: https://customsready.uplifttechnologies.pro/auth/callback
 Maker Queue

 FixitCSV

Client ID: 1d81ef94081a2c788405f34bf1869a8b
Client Secret: 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
App URL: https://fixitcsv.uplifttechnologies.pro
Redirect URLs: https://fixitcsv.uplifttechnologies.pro/auth/callback
 Production Queue Communicator

 PORef

Client ID: 59ed62f675a6cb042c7079b3379bec5c
Client Secret: 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
App URL: https://poref.uplifttechnologies.pro
Redirect URLs: https://poref.uplifttechnologies.pro/auth/callback
 QuoteLoop (quoteloop-new)

Client ID: c0a7f6741dfc891c848bba84360c66da
Client Secret: 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
App URL: https://quoteloop.uplifttechnologies.pro
Redirect URLs: https://quoteloop.uplifttechnologies.pro/auth/callback
deploy 