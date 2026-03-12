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
