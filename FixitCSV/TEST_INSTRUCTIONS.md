# Test Instructions — FixitCSV

## Installation
1. Click the provided installation URL.
2. Select store for testing (e.g. `uplift-technologies-2.myshopify.com`).
3. Click "Install app" to authorize the application's scopes.

## Billing (FixitCSV Pro)
1. Upon initial load to the App Dashboard, if usage limits are exceeded or premium attempts are made, the Shopify billing modal will appear.
2. The modal states the "FixitCSV Pro" plan to accept the test charge.
3. Approve the test charge.
4. Expected: All app features and unlimited rows are unlocked.

## Core Functionality
1. Navigate to Apps → FixitCSV.
2. Go to the main dashboard.
3. Click "Upload CSV" and select a sample Shopify product or order CSV.
4. Expected: The app validates the CSV and presents an Error Table highlighting missing columns or formatting issues.
5. Click "Auto-Fix with Gemini AI" (if there are validation failures).
6. Expected: The AI feature corrects bad values (translates, formats variables, and standardizes numbers/SKUs).
7. Click "Download Fixed CSV".
8. Expected: The fixed CSV is downloaded and is fully compatible with standard Shopify imports.

## Notes
- Support email: support@uplifttechnologies.pro
