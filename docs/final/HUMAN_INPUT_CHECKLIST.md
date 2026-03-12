# Human Input Checklist

──────────────────────────────────────────  
APP: Craftline  
──────────────────────────────────────────  

File: `Craftline/.env`  
Variable: `SHOPIFY_API_KEY`  
Why needed: Identifies this app to Shopify OAuth and CLI.  
How to obtain: Shopify Partner Dashboard → Apps → Craftline → App setup → API key  
Expected format: 32-character hex string  
Blocking severity: HARD — app cannot start without this  

File: `Craftline/.env`  
Variable: `SHOPIFY_API_SECRET`  
Why needed: Signs OAuth callbacks.  
How to obtain: Shopify Partner Dashboard → API secret key  
Expected format: 32-character hex string  
Blocking severity: HARD  

File: `Craftline/shopify.app.toml`  
Field: `client_id`  
Why needed: Links config to Partner app record.  
How to obtain: Same as SHOPIFY_API_KEY.  
Blocking severity: HARD  

──────────────────────────────────────────  
APP: FixitCSV  
──────────────────────────────────────────  

File: `FixitCSV/.env`  
Variable: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`  
How to obtain: Shopify Partner Dashboard → Apps → FixitCSV  
Blocking severity: HARD  

──────────────────────────────────────────  
APP: Stagewise  
──────────────────────────────────────────  

File: `Stagewise/.env`  
Variable: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`  
How to obtain: Shopify Partner Dashboard → Apps → Stagewise  
Blocking severity: HARD  

──────────────────────────────────────────  
APP: customsready  
──────────────────────────────────────────  

File: `customsready/.env`  
Variables: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `REDIS_URL`  
Why Redis needed: The app was audited to rigidly require Redis (ioredis/bullmq) for its queues. Provide a local Redis connection string like `redis://localhost:6379`.  
Blocking severity: HARD  

──────────────────────────────────────────  
APP: poref-new  
──────────────────────────────────────────  

File: `apps/poref-new/.env`  
Variables: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`  
How to obtain: Partner Dashboard → Apps → PORef  

──────────────────────────────────────────  
APP: quoteloop-new  
──────────────────────────────────────────  

File: `apps/quoteloop-new/.env`  
Variables: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`  

──────────────────────────────────────────  
PARTNER DASHBOARD ACTIONS REQUIRED  
──────────────────────────────────────────  

Action: Verify redirect URIs in Partner Dashboard for all apps.  
Required value format: `https://<tunnel-url>/auth/callback`
