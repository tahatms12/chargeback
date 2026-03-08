# FixitCSV (Shopify CSV Pre-Import Validator)

Embedded Shopify admin app for validating product CSV files before import.

## Key behavior

- Client-side CSV parsing and validation (CSV data is not sent/stored on the server)
- Validation config centralized in `app/lib/shopify-csv-spec.ts`
- Free tier: 100 rows/month per shop
- Paid tier: $7/month unlimited via Shopify Billing
- APP_UNINSTALLED webhook deletes session + usage records

## Run locally

```bash
cd FixitCSV
npm install
npm run setup
npm run dev
```

## Test

```bash
npm test
```
